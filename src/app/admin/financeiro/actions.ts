"use server";

// ============================================================================
// src/app/admin/financeiro/actions.ts
// Server Actions para o Módulo Financeiro
// Todas retornam Promise<void> compatíveis com form actions do React 19 / Next 15.
// ============================================================================

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/queries";
import {
  updateFinancialSettings,
  createFinancialAsset,
  createManualExpense,
  createAccountPayable,
  settleAccountPayable,
  settleAccountReceivable,
  reconcileApprovedPayments,
  calculateAndSaveVariantCost,
} from "@/lib/finance/queries";

export async function updateFinancialSettingsAction(formData: FormData): Promise<void> {
  const { isAdmin, user } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const kwhRate = formData.get("electricity_kwh_rate") as string;
  const laborRate = formData.get("labor_hourly_rate") as string;
  const pixFee = formData.get("default_gateway_pix_fee_pct") as string;
  const cardFee = formData.get("default_gateway_card_fee_pct") as string;
  const packaging = formData.get("default_packaging_cost") as string;
  const markup = formData.get("target_markup_multiplier") as string;

  await updateFinancialSettings({
    electricity_kwh_rate: kwhRate ? parseFloat(kwhRate) : null,
    labor_hourly_rate: laborRate ? parseFloat(laborRate) : null,
    default_gateway_pix_fee_pct: pixFee ? parseFloat(pixFee) / 100 : 0.0099,
    default_gateway_card_fee_pct: cardFee ? parseFloat(cardFee) / 100 : 0.0499,
    default_packaging_cost: packaging ? parseFloat(packaging) : 3.5,
    target_markup_multiplier: markup ? parseFloat(markup) : 2.5,
    updated_by: user?.id,
  });

  revalidatePath("/admin/financeiro");
}

export async function createFinancialAssetAction(formData: FormData): Promise<void> {
  const { isAdmin, user } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const assetTag = (formData.get("asset_tag") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const purchaseCost = parseFloat(formData.get("purchase_cost") as string);
  const shippingCost = parseFloat(formData.get("shipping_cost") as string) || 0;
  const usefulLifeHours = parseInt(formData.get("useful_life_hours") as string, 10);
  const nominalPowerWatts = parseInt(formData.get("nominal_power_watts") as string, 10) || 150;
  const brand = (formData.get("brand") as string)?.trim() || undefined;
  const model = (formData.get("model") as string)?.trim() || undefined;
  const purchasedAt = (formData.get("purchased_at") as string) || undefined;
  const supplierInvoice = (formData.get("supplier_invoice") as string)?.trim() || undefined;

  if (!assetTag || !name) throw new Error("Tag e nome do ativo são obrigatórios.");
  if (isNaN(purchaseCost) || purchaseCost <= 0) throw new Error("Valor de compra deve ser positivo.");
  if (isNaN(usefulLifeHours) || usefulLifeHours <= 0) throw new Error("Vida útil em horas deve ser maior que zero.");

  await createFinancialAsset({
    assetTag,
    name,
    brand,
    model,
    purchaseCost,
    shippingCost,
    usefulLifeHours,
    nominalPowerWatts,
    purchasedAt,
    supplierInvoice,
    actorProfileId: user?.id,
  });

  revalidatePath("/admin/financeiro");
}

export async function createManualExpenseAction(formData: FormData): Promise<void> {
  const { isAdmin, user } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const categoryCode = formData.get("category_code") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string)?.trim();
  const accrualDate = (formData.get("accrual_date") as string) || undefined;
  const notes = (formData.get("notes") as string)?.trim() || undefined;

  if (!categoryCode || !description) throw new Error("Categoria e descrição são obrigatórias.");
  if (isNaN(amount) || amount <= 0) throw new Error("Valor deve ser positivo.");

  await createManualExpense({
    categoryCode,
    amount,
    description,
    accrualDate,
    notes,
    actorProfileId: user?.id,
  });

  revalidatePath("/admin/financeiro");
}

export async function createAccountPayableAction(formData: FormData): Promise<void> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const categoryCode = formData.get("category_code") as string;
  const description = (formData.get("description") as string)?.trim();
  const dueDate = formData.get("due_date") as string;
  const originalAmount = parseFloat(formData.get("original_amount") as string);
  const recipientName = (formData.get("recipient_name") as string)?.trim() || undefined;
  const invoiceNumber = (formData.get("invoice_number") as string)?.trim() || undefined;

  if (!categoryCode || !description || !dueDate) {
    throw new Error("Categoria, descrição e data de vencimento são obrigatórios.");
  }
  if (isNaN(originalAmount) || originalAmount <= 0) {
    throw new Error("Valor original deve ser positivo.");
  }

  await createAccountPayable({
    categoryCode,
    description,
    dueDate,
    originalAmount,
    recipientName,
    invoiceNumber,
  });

  revalidatePath("/admin/financeiro");
}

export async function settleAccountPayableAction(id: string, formData: FormData): Promise<void> {
  const { isAdmin, user } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const paidAmount = parseFloat(formData.get("paid_amount") as string);
  if (isNaN(paidAmount) || paidAmount <= 0) throw new Error("Valor pago inválido.");

  await settleAccountPayable(id, paidAmount, user?.id);
  revalidatePath("/admin/financeiro");
}

export async function settleAccountReceivableAction(id: string, formData: FormData): Promise<void> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const receivedNetAmount = parseFloat(formData.get("received_net_amount") as string);
  const gatewaySettlementId = (formData.get("gateway_settlement_id") as string) || undefined;
  if (isNaN(receivedNetAmount) || receivedNetAmount <= 0) throw new Error("Valor recebido líquido inválido.");

  await settleAccountReceivable(id, receivedNetAmount, gatewaySettlementId);
  revalidatePath("/admin/financeiro");
}

export async function triggerReconcilePaymentsAction(): Promise<void> {
  const { isAdmin, user } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  await reconcileApprovedPayments(user?.id);
  revalidatePath("/admin/financeiro");
}

export async function calculateVariantCostAction(variantId: string, _formData?: FormData): Promise<void> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  await calculateAndSaveVariantCost(variantId);
  revalidatePath("/admin/financeiro");
}
