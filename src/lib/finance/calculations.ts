// ============================================================================
// src/lib/finance/calculations.ts
// Motor Canônico de Cálculos Financeiros, CPV, Depreciação e Conciliação
//
// REGRAS INVIOLÁVEIS:
// 1. Venda criada != recebimento em caixa.
// 2. Pagamento aprovado != valor líquido liquidado (taxas de gateway deduzidas).
// 3. Reserva gratuita de interesse = 0 receita, 0 transação contábil.
// 4. Custo estimado != custo realizado (dados de produção auditáveis).
// 5. Compra de impressora/máquina = CAPEX sujeito a depreciação horária.
//    NUNCA deve ser alocada integralmente a uma única peça!
// 6. Se faltarem dados de energia, mão de obra ou depreciação, sinalizar
//    isMissing explicitamente sem inventar valores fictícios.
// ============================================================================

import type {
  FinancialTransactionDTO,
  AccountPayableDTO,
  AccountReceivableDTO,
  FinancialCashflowSummary,
  DRESummary,
  ProductCostSnapshotDTO,
} from "@/types/finance.types";

/**
 * Arredonda valor para número fixo de casas decimais (padrão 2 casas para moeda, 4 para insumos).
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Calcula custo de matéria-prima (filamento consumido).
 * @param grams Peso em gramas de filamento (estimado ou real)
 * @param costPerGram Custo por grama da bobina (ou custo médio)
 */
export function calculateFilamentCost(grams: number, costPerGram: number): number {
  if (grams <= 0 || costPerGram <= 0) return 0;
  return round(grams * costPerGram, 4);
}

/**
 * Calcula custo de energia elétrica de impressão.
 * @param printMinutes Tempo de impressão em minutos
 * @param nominalPowerWatts Potência nominal da impressora (ex: 150W = 0.15 kW)
 * @param kwhRate Tarifa de energia em R$/kWh (ex: 0.85 R$/kWh)
 */
export function calculateElectricityCost(
  printMinutes: number,
  nominalPowerWatts: number = 150,
  kwhRate: number | null
): { cost: number; isMissing: boolean; notes?: string } {
  if (kwhRate === null || kwhRate === undefined || isNaN(kwhRate)) {
    return {
      cost: 0,
      isMissing: true,
      notes: "Tarifa de energia elétrica (kWh) não configurada no sistema.",
    };
  }

  if (printMinutes <= 0 || nominalPowerWatts <= 0 || kwhRate <= 0) {
    return { cost: 0, isMissing: false };
  }

  const hours = printMinutes / 60;
  const kw = nominalPowerWatts / 1000;
  const cost = round(hours * kw * kwhRate, 4);

  return { cost, isMissing: false };
}

/**
 * Calcula depreciação horária de máquina / impressora para a peça.
 * EVITA atribuir integralmente o valor da impressora à peça!
 * Fórmula: (tempo_impressão_horas) * (custo_aquisicao / vida_util_horas)
 * @param printMinutes Tempo de impressão em minutos
 * @param depreciationRatePerHour Taxa pré-calculada por hora de depreciação do ativo
 */
export function calculateMachineDepreciation(
  printMinutes: number,
  depreciationRatePerHour: number | null
): { cost: number; isMissing: boolean; notes?: string } {
  if (
    depreciationRatePerHour === null ||
    depreciationRatePerHour === undefined ||
    isNaN(depreciationRatePerHour)
  ) {
    return {
      cost: 0,
      isMissing: true,
      notes: "Nenhuma impressora vinculada com taxa horária de depreciação cadastrada.",
    };
  }

  if (printMinutes <= 0 || depreciationRatePerHour <= 0) {
    return { cost: 0, isMissing: false };
  }

  const hours = printMinutes / 60;
  const cost = round(hours * depreciationRatePerHour, 4);

  return { cost, isMissing: false };
}

/**
 * Calcula custo de mão de obra direta (fatiamento, pós-processamento, embalagem).
 * @param laborMinutes Minutos de mão de obra direta
 * @param laborHourlyRate Valor hora de mão de obra configurado
 */
export function calculateLaborCost(
  laborMinutes: number,
  laborHourlyRate: number | null
): { cost: number; isMissing: boolean; notes?: string } {
  if (laborHourlyRate === null || laborHourlyRate === undefined || isNaN(laborHourlyRate)) {
    return {
      cost: 0,
      isMissing: true,
      notes: "Tarifa de mão de obra direta (R$/h) não parametrizada.",
    };
  }

  if (laborMinutes <= 0 || laborHourlyRate <= 0) {
    return { cost: 0, isMissing: false };
  }

  const hours = laborMinutes / 60;
  const cost = round(hours * laborHourlyRate, 4);
  return { cost, isMissing: false };
}

/**
 * Parâmetros completos para apuração de custo e margem unitária de um produto/variante.
 */
export interface UnitCostCalculationInput {
  variantId: string;
  unitSalePrice: number;
  filamentGrams: number;
  costPerGram: number;
  printMinutes: number;
  nominalPowerWatts?: number;
  electricityKwhRate: number | null;
  depreciationRatePerHour: number | null;
  packagingCost?: number;
  laborMinutes?: number;
  laborHourlyRate: number | null;
  otherDirectCost?: number;
  calculationType: "estimated_catalog" | "actual_production";
  productionOrderId?: string;
}

/**
 * Apuração de custo total unitário e margem bruta.
 */
export function calculateProductUnitEconomics(
  input: UnitCostCalculationInput
): ProductCostSnapshotDTO {
  const missingNotes: string[] = [];

  const filamentCost = calculateFilamentCost(input.filamentGrams, input.costPerGram);

  const electricity = calculateElectricityCost(
    input.printMinutes,
    input.nominalPowerWatts ?? 150,
    input.electricityKwhRate
  );
  if (electricity.isMissing && electricity.notes) missingNotes.push(electricity.notes);

  const depreciation = calculateMachineDepreciation(
    input.printMinutes,
    input.depreciationRatePerHour
  );
  if (depreciation.isMissing && depreciation.notes) missingNotes.push(depreciation.notes);

  const labor = calculateLaborCost(input.laborMinutes ?? 0, input.laborHourlyRate);
  if (labor.isMissing && labor.notes && (input.laborMinutes ?? 0) > 0) {
    missingNotes.push(labor.notes);
  }

  const packagingCost = round(input.packagingCost ?? 0, 4);
  const otherDirectCost = round(input.otherDirectCost ?? 0, 4);

  const totalUnitCost = round(
    filamentCost +
      electricity.cost +
      depreciation.cost +
      labor.cost +
      packagingCost +
      otherDirectCost,
    4
  );

  const grossMarginAmount = round(input.unitSalePrice - totalUnitCost, 2);
  const grossMarginPercent =
    input.unitSalePrice > 0
      ? round((grossMarginAmount / input.unitSalePrice) * 100, 2)
      : 0;

  return {
    id: "",
    variant_id: input.variantId,
    production_order_id: input.productionOrderId ?? null,
    calculation_type: input.calculationType,
    filament_cost: filamentCost,
    electricity_cost: electricity.cost,
    machine_depreciation_cost: depreciation.cost,
    packaging_cost: packagingCost,
    labor_cost: labor.cost,
    other_direct_cost: otherDirectCost,
    total_unit_cost: totalUnitCost,
    unit_sale_price: round(input.unitSalePrice, 2),
    gross_margin_amount: grossMarginAmount,
    gross_margin_percent: grossMarginPercent,
    is_telemetry_missing: missingNotes.length > 0,
    missing_parameters_notes:
      missingNotes.length > 0 ? missingNotes.join(" | ") : null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Calcula frete subsidiado (custo logístico absorvido pela loja).
 * Se o cliente pagou R$ 0 (frete grátis) ou R$ 10 quando o custo real na transportadora foi R$ 25,
 * o frete subsidiado é R$ 15.
 * @param actualCarrierCost Custo real cobrado pela transportadora
 * @param chargedToCustomer Custo de frete pago pelo cliente no pedido
 */
export function calculateSubsidizedShipping(
  actualCarrierCost: number,
  chargedToCustomer: number
): number {
  if (actualCarrierCost <= chargedToCustomer) return 0;
  return round(actualCarrierCost - chargedToCustomer, 2);
}

/**
 * Apuração de Margem de Contribuição após dedução de taxas e frete subsidiado.
 */
export function calculateContributionMargin(
  netReceivedAmount: number,
  totalUnitCost: number,
  subsidizedShippingAmount: number = 0
): { contributionMargin: number; contributionMarginPct: number } {
  const contributionMargin = round(
    netReceivedAmount - totalUnitCost - subsidizedShippingAmount,
    2
  );
  const contributionMarginPct =
    netReceivedAmount > 0
      ? round((contributionMargin / netReceivedAmount) * 100, 2)
      : 0;

  return { contributionMargin, contributionMarginPct };
}

/**
 * Consolida o Fluxo de Caixa (Cashflow) a partir de transações, contas a pagar e contas a receber.
 * Separa com rigor:
 * - Saldo liquidado em banco (cleared)
 * - Valores a receber futuros
 * - Obrigações a pagar futuras
 */
export function calculateCashflow(
  transactions: FinancialTransactionDTO[],
  payables: AccountPayableDTO[],
  receivables: AccountReceivableDTO[]
): FinancialCashflowSummary {
  let totalClearedIncome = 0;
  let totalClearedExpense = 0;
  let totalClearedRefunds = 0;
  let totalGatewayFeesRetained = 0;
  let totalSubsidizedShipping = 0;

  for (const tx of transactions) {
    if (tx.status === "cleared") {
      if (tx.transaction_type === "income") {
        totalClearedIncome += tx.net_amount;
        totalGatewayFeesRetained += tx.fee_amount;
      } else if (tx.transaction_type === "expense") {
        totalClearedExpense += tx.net_amount;
        if (tx.source_type === "shipping_settlement") {
          totalSubsidizedShipping += tx.net_amount;
        }
      } else if (tx.transaction_type === "refund") {
        totalClearedRefunds += tx.net_amount;
      }
    }
  }

  let totalPendingPayables = 0;
  for (const ap of payables) {
    if (ap.status === "pending" || ap.status === "overdue") {
      totalPendingPayables += ap.original_amount - ap.paid_amount;
    }
  }

  let totalPendingReceivables = 0;
  for (const ar of receivables) {
    if (ar.status === "pending") {
      totalPendingReceivables += ar.net_expected_amount - ar.received_net_amount;
    }
  }

  const currentCashBalance = round(
    totalClearedIncome - totalClearedExpense - totalClearedRefunds,
    2
  );
  const projectedCashBalance = round(
    currentCashBalance + totalPendingReceivables - totalPendingPayables,
    2
  );

  return {
    totalClearedIncome: round(totalClearedIncome, 2),
    totalClearedExpense: round(totalClearedExpense, 2),
    totalClearedRefunds: round(totalClearedRefunds, 2),
    currentCashBalance,
    totalPendingReceivables: round(totalPendingReceivables, 2),
    totalPendingPayables: round(totalPendingPayables, 2),
    projectedCashBalance,
    totalGatewayFeesRetained: round(totalGatewayFeesRetained, 2),
    totalSubsidizedShipping: round(totalSubsidizedShipping, 2),
  };
}

/**
 * Gera DRE Gerencial (Demonstração do Resultado do Exercício) a partir do regime de competência.
 * Considera:
 * Vendas Brutas Faturadas -> Deduções (Taxas, Devoluções, Frete Subsidiado) ->
 * Receita Líquida -> CPV -> Lucro Bruto -> Despesas Operacionais e Mão de Obra -> Resultado Operacional
 */
export function calculateDRE(
  transactions: FinancialTransactionDTO[]
): DRESummary {
  let grossRevenue = 0;
  let gatewayFees = 0;
  let subsidizedShipping = 0;
  let refunds = 0;
  let costOfGoodsSold = 0;
  let operatingExpenses = 0;
  let laborExpenses = 0;

  for (const tx of transactions) {
    if (tx.status === "cancelled") continue;

    if (tx.transaction_type === "income") {
      grossRevenue += tx.gross_amount;
      gatewayFees += tx.fee_amount;
    } else if (tx.transaction_type === "refund") {
      refunds += tx.gross_amount;
    } else if (tx.transaction_type === "expense") {
      const catCode = tx.category?.code || "";
      const dreClass = tx.category?.dre_classification || "";

      if (catCode === "SHIPPING_SUBSIDY" || tx.source_type === "shipping_settlement") {
        subsidizedShipping += tx.net_amount;
      } else if (dreClass === "cost_of_goods" || catCode === "FILAMENT" || catCode === "PACKAGING") {
        costOfGoodsSold += tx.net_amount;
      } else if (dreClass === "labor_expense" || catCode === "LABOR") {
        laborExpenses += tx.net_amount;
      } else if (dreClass === "fixed_expense" || dreClass === "variable_expense" || dreClass === "other") {
        operatingExpenses += tx.net_amount;
      }
      // Note: capex_asset (compra de máquina) não entra integralmente como despesa do DRE de uma vez só!
      // É amortizado via depreciação mensal/horária.
    }
  }

  const netRevenue = round(grossRevenue - gatewayFees - subsidizedShipping - refunds, 2);
  const grossProfit = round(netRevenue - costOfGoodsSold, 2);
  const grossMarginPct =
    netRevenue > 0 ? round((grossProfit / netRevenue) * 100, 2) : 0;

  const operatingResult = round(grossProfit - operatingExpenses - laborExpenses, 2);
  const operatingMarginPct =
    netRevenue > 0 ? round((operatingResult / netRevenue) * 100, 2) : 0;

  return {
    grossRevenue: round(grossRevenue, 2),
    gatewayFees: round(gatewayFees, 2),
    subsidizedShipping: round(subsidizedShipping, 2),
    netRevenue,
    costOfGoodsSold: round(costOfGoodsSold, 2),
    grossProfit,
    grossMarginPct,
    operatingExpenses: round(operatingExpenses, 2),
    laborExpenses: round(laborExpenses, 2),
    operatingResult,
    operatingMarginPct,
  };
}
