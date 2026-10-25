// ============================================================================
// src/lib/finance/queries.ts
// Operações de Banco de Dados para o Módulo Financeiro e Conciliação
//
// Protegido com Zero Trust. Todas as funções usam createAdminClient()
// após verificação de autenticação de administrador.
// ============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";
import type {
  FinancialSettingsDTO,
  ExpenseCategoryDTO,
  FinancialAssetDTO,
  FinancialTransactionDTO,
  AccountPayableDTO,
  AccountReceivableDTO,
  FinancialReconciliationDTO,
  ProductCostSnapshotDTO,
} from "@/types/finance.types";
import {
  calculateCashflow,
  calculateDRE,
  calculateProductUnitEconomics,
  round,
} from "./calculations";
import {
  buildPaymentTransactionPayload,
  buildSpoolPurchaseTransactionPayload,
  buildAssetPurchaseTransactionPayload,
  buildRefundTransactionPayload,
  validateInterestLeadNoFinancialImpact,
} from "./reconciliation";

// ---------------------------------------------------------------------------
// 1. CONFIGURAÇÕES E PARÂMETROS
// ---------------------------------------------------------------------------

export async function getFinancialSettings(): Promise<FinancialSettingsDTO> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("financial_settings")
    .select("*")
    .eq("singleton_key", "active_config")
    .single();

  if (error || !data) {
    // Retorno de fallback seguro
    return {
      id: "default",
      singleton_key: "active_config",
      electricity_kwh_rate: 0.85,
      electricity_provider_name: "Padrão",
      labor_hourly_rate: 25.0,
      default_gateway_pix_fee_pct: 0.0099,
      default_gateway_card_fee_pct: 0.0499,
      default_gateway_fixed_fee: 0.0,
      default_packaging_cost: 3.5,
      target_markup_multiplier: 2.5,
      notes: null,
      updated_at: new Date().toISOString(),
    };
  }

  return data as FinancialSettingsDTO;
}

export async function updateFinancialSettings(
  input: Partial<Database["public"]["Tables"]["financial_settings"]["Update"]>
): Promise<FinancialSettingsDTO> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("financial_settings")
    .upsert({
      singleton_key: "active_config",
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar configurações financeiras: ${error.message}`);
  }

  return data as FinancialSettingsDTO;
}

// ---------------------------------------------------------------------------
// 2. CATEGORIAS DE DESPESAS
// ---------------------------------------------------------------------------

export async function listExpenseCategories(): Promise<ExpenseCategoryDTO[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Erro ao buscar categorias de despesa: ${error.message}`);
  }

  return (data ?? []) as ExpenseCategoryDTO[];
}

// ---------------------------------------------------------------------------
// 3. ATIVOS E EQUIPAMENTOS (CAPEX)
// ---------------------------------------------------------------------------

export async function listFinancialAssets(): Promise<FinancialAssetDTO[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("financial_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar equipamentos: ${error.message}`);
  }

  return (data ?? []) as FinancialAssetDTO[];
}

export async function createFinancialAsset(input: {
  assetTag: string;
  name: string;
  brand?: string;
  model?: string;
  purchaseCost: number;
  shippingCost?: number;
  usefulLifeHours: number;
  nominalPowerWatts?: number;
  purchasedAt?: string;
  supplierInvoice?: string;
  notes?: string;
  actorProfileId?: string;
}): Promise<FinancialAssetDTO> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("financial_assets")
    .insert({
      asset_tag: input.assetTag,
      name: input.name,
      brand: input.brand ?? null,
      model: input.model ?? null,
      purchase_cost: input.purchaseCost,
      shipping_cost: input.shippingCost ?? 0,
      useful_life_hours: input.usefulLifeHours,
      nominal_power_watts: input.nominalPowerWatts ?? 150,
      purchased_at: input.purchasedAt ?? null,
      supplier_invoice: input.supplierInvoice ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cadastrar equipamento: ${error.message}`);
  }

  // Obter categoria de CAPEX
  const { data: cat } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("code", "EQUIPMENT")
    .single();

  // Registrar a transação contábil correspondente
  const txPayload = buildAssetPurchaseTransactionPayload(
    {
      assetId: data.id,
      assetTag: data.asset_tag,
      name: data.name,
      purchaseCost: data.purchase_cost,
      shippingCost: data.shipping_cost,
      usefulLifeHours: data.useful_life_hours,
      purchasedAt: data.purchased_at,
      actorProfileId: input.actorProfileId,
    },
    cat?.id ?? null
  );

  await supabase.from("financial_transactions").upsert(txPayload, {
    onConflict: "idempotency_key",
  });

  return data as FinancialAssetDTO;
}

// ---------------------------------------------------------------------------
// 4. TRANSAÇÕES FINANCEIRAS (LIVRO RAZÃO)
// ---------------------------------------------------------------------------

export async function listFinancialTransactions(opts?: {
  type?: Database["public"]["Enums"]["financial_transaction_type"];
  status?: Database["public"]["Enums"]["financial_transaction_status"];
  limit?: number;
}): Promise<FinancialTransactionDTO[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("financial_transactions")
    .select("*, expense_categories(*)")
    .order("created_at", { ascending: false });

  if (opts?.type) query = query.eq("transaction_type", opts.type);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Erro ao buscar transações financeiras: ${error.message}`);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    idempotency_key: row.idempotency_key,
    transaction_type: row.transaction_type,
    category_id: row.category_id,
    category: row.expense_categories,
    gross_amount: Number(row.gross_amount),
    fee_amount: Number(row.fee_amount),
    net_amount: Number(row.net_amount),
    accrual_date: row.accrual_date,
    cleared_at: row.cleared_at,
    status: row.status,
    source_type: row.source_type,
    source_id: row.source_id,
    reconciliation_id: row.reconciliation_id,
    description: row.description,
    payment_method: row.payment_method,
    notes: row.notes,
    created_at: row.created_at,
  }));
}

export async function createManualExpense(input: {
  categoryCode: string;
  amount: number;
  description: string;
  accrualDate?: string;
  paymentMethod?: Database["public"]["Enums"]["payment_method"];
  notes?: string;
  actorProfileId?: string;
}): Promise<void> {
  const supabase = createAdminClient();

  const { data: cat } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("code", input.categoryCode)
    .single();

  const idempotencyKey = `EXP-MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const dateStr = input.accrualDate ?? new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("financial_transactions").insert({
    idempotency_key: idempotencyKey,
    transaction_type: "expense",
    category_id: cat?.id ?? null,
    gross_amount: round(input.amount, 2),
    fee_amount: 0,
    net_amount: round(input.amount, 2),
    accrual_date: dateStr,
    cleared_at: new Date().toISOString(),
    status: "cleared",
    source_type: "general_expense",
    description: input.description,
    payment_method: input.paymentMethod ?? "other",
    notes: input.notes ?? null,
    actor_profile_id: input.actorProfileId ?? null,
  });

  if (error) {
    throw new Error(`Erro ao registrar despesa: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// 5. CONTAS A PAGAR E RECEBER
// ---------------------------------------------------------------------------

export async function listAccountsPayable(): Promise<AccountPayableDTO[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("accounts_payable")
    .select("*, expense_categories(*)")
    .order("due_date", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar contas a pagar: ${error.message}`);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    category_id: row.category_id,
    category: row.expense_categories,
    description: row.description,
    due_date: row.due_date,
    original_amount: Number(row.original_amount),
    paid_amount: Number(row.paid_amount),
    discount_amount: Number(row.discount_amount),
    penalty_amount: Number(row.penalty_amount),
    status: row.status,
    paid_at: row.paid_at,
    recipient_name: row.recipient_name,
    invoice_number: row.invoice_number,
    source_type: row.source_type,
    source_id: row.source_id,
    notes: row.notes,
    created_at: row.created_at,
  }));
}

export async function createAccountPayable(input: {
  categoryCode: string;
  description: string;
  dueDate: string;
  originalAmount: number;
  recipientName?: string;
  invoiceNumber?: string;
  notes?: string;
}): Promise<void> {
  const supabase = createAdminClient();

  const { data: cat } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("code", input.categoryCode)
    .single();

  const { error } = await supabase.from("accounts_payable").insert({
    category_id: cat?.id ?? null,
    description: input.description,
    due_date: input.dueDate,
    original_amount: round(input.originalAmount, 2),
    recipient_name: input.recipientName ?? null,
    invoice_number: input.invoiceNumber ?? null,
    notes: input.notes ?? null,
    status: "pending",
  });

  if (error) {
    throw new Error(`Erro ao criar conta a pagar: ${error.message}`);
  }
}

export async function settleAccountPayable(
  id: string,
  paidAmount: number,
  actorProfileId?: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: ap, error: fetchErr } = await supabase
    .from("accounts_payable")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !ap) throw new Error("Conta a pagar não encontrada.");

  const { error } = await supabase
    .from("accounts_payable")
    .update({
      paid_amount: round(paidAmount, 2),
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`Erro ao liquidar conta a pagar: ${error.message}`);

  // Criar transação de saída no livro razão
  await supabase.from("financial_transactions").upsert({
    idempotency_key: `AP-SETTLE-${id}`,
    transaction_type: "expense",
    category_id: ap.category_id,
    gross_amount: round(paidAmount, 2),
    fee_amount: 0,
    net_amount: round(paidAmount, 2),
    accrual_date: ap.due_date,
    cleared_at: new Date().toISOString(),
    status: "cleared",
    source_type: "general_expense",
    source_id: id,
    description: `Liquidação: ${ap.description}`,
    notes: `Favorecido: ${ap.recipient_name ?? "Não informado"} | NF: ${ap.invoice_number ?? "S/N"}`,
    actor_profile_id: actorProfileId ?? null,
  });
}

export async function listAccountsReceivable(): Promise<AccountReceivableDTO[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("accounts_receivable")
    .select("*")
    .order("expected_clearance_date", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar contas a receber: ${error.message}`);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    order_id: row.order_id,
    payment_id: row.payment_id,
    description: row.description,
    expected_clearance_date: row.expected_clearance_date,
    gross_amount: Number(row.gross_amount),
    estimated_fee: Number(row.estimated_fee),
    net_expected_amount: Number(row.net_expected_amount),
    received_net_amount: Number(row.received_net_amount),
    status: row.status,
    cleared_at: row.cleared_at,
    gateway_settlement_id: row.gateway_settlement_id,
    notes: row.notes,
    created_at: row.created_at,
  }));
}

export async function settleAccountReceivable(
  id: string,
  receivedNetAmount: number,
  gatewaySettlementId?: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: ar, error: fetchErr } = await supabase
    .from("accounts_receivable")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !ar) throw new Error("Conta a receber não encontrada.");

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("accounts_receivable")
    .update({
      received_net_amount: round(receivedNetAmount, 2),
      status: "received",
      cleared_at: now,
      gateway_settlement_id: gatewaySettlementId ?? null,
    })
    .eq("id", id);

  if (error) throw new Error(`Erro ao liquidar conta a receber: ${error.message}`);

  // Atualizar transação financeira vinculada para cleared
  if (ar.payment_id) {
    await supabase
      .from("financial_transactions")
      .update({
        status: "cleared",
        cleared_at: now,
        net_amount: round(receivedNetAmount, 2),
      })
      .eq("source_id", ar.payment_id)
      .eq("source_type", "order_payment");
  }
}

// ---------------------------------------------------------------------------
// 6. CONCILIAÇÃO DE PAGAMENTOS DO MERCADO PAGO E PEDIDOS
// ---------------------------------------------------------------------------

export async function reconcileApprovedPayments(actorProfileId?: string): Promise<{
  reconciledCount: number;
  totalVolume: number;
}> {
  const supabase = createAdminClient();
  const settings = await getFinancialSettings();

  // Buscar categoria de receita de vendas
  const { data: cat } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("code", "OTHER")
    .single();

  // Buscar todos os pagamentos aprovados que ainda não possuem transação no livro razão
  const { data: approvedPayments, error } = await supabase
    .from("payments")
    .select("id, order_id, amount, payment_method, paid_at, status")
    .eq("status", "approved");

  if (error) throw new Error(`Erro ao listar pagamentos: ${error.message}`);

  let count = 0;
  let volume = 0;

  for (const p of approvedPayments ?? []) {
    const feePct =
      p.payment_method === "pix"
        ? settings.default_gateway_pix_fee_pct
        : settings.default_gateway_card_fee_pct;

    const txPayload = buildPaymentTransactionPayload(
      {
        paymentId: p.id,
        orderId: p.order_id,
        grossAmount: Number(p.amount),
        paymentMethod: p.payment_method,
        paidAt: p.paid_at,
        gatewayFeePct: feePct,
        gatewayFixedFee: settings.default_gateway_fixed_fee,
        isCleared: true, // Pix aprovado compensa imediatamente; cartão compensa na conta
        clearedAt: p.paid_at ?? new Date().toISOString(),
        actorProfileId,
      },
      cat?.id ?? null
    );

    const { error: upsertErr } = await supabase
      .from("financial_transactions")
      .upsert(txPayload, { onConflict: "idempotency_key" });

    if (!upsertErr) {
      count++;
      volume += Number(p.amount);
    }
  }

  return { reconciledCount: count, totalVolume: round(volume, 2) };
}

// ---------------------------------------------------------------------------
// 7. CUSTO E MARGEM UNITÁRIA POR VARIANTE (CPV)
// ---------------------------------------------------------------------------

export async function listProductCostSnapshots(): Promise<ProductCostSnapshotDTO[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_cost_snapshots")
    .select(`
      *,
      product_variants (
        variant_name,
        products (name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar snapshots de custo: ${error.message}`);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    variant_id: row.variant_id,
    variant_name: row.product_variants?.variant_name,
    product_name: row.product_variants?.products?.name,
    production_order_id: row.production_order_id,
    calculation_type: row.calculation_type,
    filament_cost: Number(row.filament_cost),
    electricity_cost: Number(row.electricity_cost),
    machine_depreciation_cost: Number(row.machine_depreciation_cost),
    packaging_cost: Number(row.packaging_cost),
    labor_cost: Number(row.labor_cost),
    other_direct_cost: Number(row.other_direct_cost),
    total_unit_cost: Number(row.total_unit_cost),
    unit_sale_price: Number(row.unit_sale_price),
    gross_margin_amount: Number(row.gross_margin_amount),
    gross_margin_percent: Number(row.gross_margin_percent),
    is_telemetry_missing: row.is_telemetry_missing,
    missing_parameters_notes: row.missing_parameters_notes,
    created_at: row.created_at,
  }));
}

export async function calculateAndSaveVariantCost(
  variantId: string
): Promise<ProductCostSnapshotDTO> {
  const supabase = createAdminClient();
  const settings = await getFinancialSettings();

  // Buscar dados da variante e produto
  const { data: variant, error: varErr } = await supabase
    .from("product_variants")
    .select(`
      id,
      variant_name,
      estimated_filament_weight_g,
      estimated_print_time_minutes,
      price_adjustment,
      products (base_price, commercial_mode)
    `)
    .eq("id", variantId)
    .single();

  if (varErr || !variant) throw new Error("Variante não encontrada.");

  const product = variant.products as any;
  const unitSalePrice = Number(product?.base_price ?? 0) + Number(variant.price_adjustment ?? 0);

  // Buscar média de custo por grama de filamento em uso/selado
  const { data: spools } = await supabase
    .from("filament_spools")
    .select("cost_per_gram")
    .in("status", ["sealed", "in_use"]);

  let avgCostPerGram = 0.12; // R$ 120 / kg fallback
  if (spools && spools.length > 0) {
    const sum = spools.reduce((acc, s) => acc + Number(s.cost_per_gram), 0);
    avgCostPerGram = sum / spools.length;
  }

  // Buscar taxa de depreciação média de impressoras ativas
  const { data: assets } = await supabase
    .from("financial_assets")
    .select("depreciation_rate_per_hour, nominal_power_watts")
    .eq("status", "active");

  let avgDepreciationPerHour: number | null = null;
  let nominalPowerWatts = 150;
  if (assets && assets.length > 0) {
    const sumDep = assets.reduce((acc, a) => acc + Number(a.depreciation_rate_per_hour), 0);
    avgDepreciationPerHour = sumDep / assets.length;
    nominalPowerWatts = assets[0].nominal_power_watts ?? 150;
  }

  const result = calculateProductUnitEconomics({
    variantId: variant.id,
    unitSalePrice,
    filamentGrams: Number(variant.estimated_filament_weight_g),
    costPerGram: avgCostPerGram,
    printMinutes: variant.estimated_print_time_minutes ?? 0,
    nominalPowerWatts,
    electricityKwhRate: settings.electricity_kwh_rate,
    depreciationRatePerHour: avgDepreciationPerHour,
    packagingCost: settings.default_packaging_cost,
    laborHourlyRate: settings.labor_hourly_rate,
    laborMinutes: 10, // 10 min pós-processamento padrão
    calculationType: "estimated_catalog",
  });

  const { data: saved, error: saveErr } = await supabase
    .from("product_cost_snapshots")
    .insert({
      variant_id: variant.id,
      calculation_type: "estimated_catalog",
      filament_cost: result.filament_cost,
      electricity_cost: result.electricity_cost,
      machine_depreciation_cost: result.machine_depreciation_cost,
      packaging_cost: result.packaging_cost,
      labor_cost: result.labor_cost,
      other_direct_cost: result.other_direct_cost,
      unit_sale_price: result.unit_sale_price,
      gross_margin_amount: result.gross_margin_amount,
      gross_margin_percent: result.gross_margin_percent,
      is_telemetry_missing: result.is_telemetry_missing,
      missing_parameters_notes: result.missing_parameters_notes,
    })
    .select()
    .single();

  if (saveErr) throw new Error(`Erro ao salvar snapshot: ${saveErr.message}`);

  return {
    ...result,
    id: saved.id,
  };
}

// ---------------------------------------------------------------------------
// 8. MÉTRICAS AGREGADAS PARA O DASHBOARD FINANCEIRO
// ---------------------------------------------------------------------------

export async function getFinancialDashboardMetrics() {
  const transactions = await listFinancialTransactions({ limit: 200 });
  const payables = await listAccountsPayable();
  const receivables = await listAccountsReceivable();
  const settings = await getFinancialSettings();
  const assets = await listFinancialAssets();

  const cashflow = calculateCashflow(transactions, payables, receivables);
  const dre = calculateDRE(transactions);

  return {
    cashflow,
    dre,
    settings,
    assetsCount: assets.length,
    recentTransactions: transactions.slice(0, 10),
    pendingPayables: payables.filter((p) => p.status === "pending" || p.status === "overdue"),
    pendingReceivables: receivables.filter((r) => r.status === "pending"),
  };
}
