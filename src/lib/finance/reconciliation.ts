// ============================================================================
// src/lib/finance/reconciliation.ts
// Motor de Conciliação, Validação de Origens e Prevenção de Duplicidade
//
// REGRAS OBRIGATÓRIAS:
// 1. Venda criada != recebimento em caixa.
// 2. Pagamento aprovado != valor líquido liquidado (taxas de gateway deduzidas).
// 3. Reserva gratuita (interest_lead) NUNCA gera receita ou transação financeira.
// 4. Compra de equipamento (impressora) é CAPEX e não deve ser alocada
//    integralmente a uma única peça impressa.
// 5. Prevenção estrita de duplicidade via chaves determinísticas de idempotência.
// ============================================================================

import type { Database } from "@/types/database.types";
import { round } from "./calculations.ts";

export interface ReconcilePaymentInput {
  paymentId: string;
  orderId: string;
  grossAmount: number;
  paymentMethod: Database["public"]["Enums"]["payment_method"];
  paidAt: string | null;
  gatewayFeePct: number;
  gatewayFixedFee?: number;
  isCleared?: boolean;
  clearedAt?: string | null;
  actorProfileId?: string;
}

export interface ReconcileSpoolPurchaseInput {
  spoolId: string;
  label: string;
  purchaseCost: number;
  allocatedShippingCost: number;
  purchasedAt?: string | null;
  actorProfileId?: string;
}

export interface ReconcileAssetPurchaseInput {
  assetId: string;
  assetTag: string;
  name: string;
  purchaseCost: number;
  shippingCost?: number;
  usefulLifeHours: number;
  purchasedAt?: string | null;
  actorProfileId?: string;
}

export interface ReconcileRefundInput {
  paymentId: string;
  orderId: string;
  refundAmount: number;
  refundedAt?: string | null;
  reason?: string;
  actorProfileId?: string;
}

/**
 * Monta payload de transação financeira para pagamento de pedido (Mercado Pago / Pix / Cartão).
 * Garante idempotência: PAY-{paymentId}-INCOME
 */
export function buildPaymentTransactionPayload(
  input: ReconcilePaymentInput,
  categoryId: string | null
): Database["public"]["Tables"]["financial_transactions"]["Insert"] {
  const feeAmount = round(
    input.grossAmount * input.gatewayFeePct + (input.gatewayFixedFee ?? 0),
    2
  );
  const netAmount = round(Math.max(0, input.grossAmount - feeAmount), 2);

  const accrualDate = input.paidAt
    ? input.paidAt.split("T")[0]
    : new Date().toISOString().split("T")[0];

  return {
    idempotency_key: `PAY-${input.paymentId}-INCOME`,
    transaction_type: "income",
    category_id: categoryId,
    gross_amount: round(input.grossAmount, 2),
    fee_amount: feeAmount,
    net_amount: netAmount,
    accrual_date: accrualDate,
    cleared_at: input.isCleared ? input.clearedAt ?? new Date().toISOString() : null,
    status: input.isCleared ? "cleared" : "pending",
    source_type: "order_payment",
    source_id: input.paymentId,
    description: `Recebimento Pedido ref. Pagamento ${input.paymentId}`,
    payment_method: input.paymentMethod,
    notes: `Taxa gateway: R$ ${feeAmount.toFixed(2)} (${(input.gatewayFeePct * 100).toFixed(2)}%)`,
    actor_profile_id: input.actorProfileId ?? null,
  };
}

/**
 * Monta payload de transação financeira para compra de bobina de filamento.
 * Garante idempotência: SPOOL-{spoolId}-PURCHASE
 */
export function buildSpoolPurchaseTransactionPayload(
  input: ReconcileSpoolPurchaseInput,
  categoryId: string | null
): Database["public"]["Tables"]["financial_transactions"]["Insert"] {
  const totalCost = round(input.purchaseCost + input.allocatedShippingCost, 2);
  const accrualDate = input.purchasedAt
    ? input.purchasedAt.split("T")[0]
    : new Date().toISOString().split("T")[0];

  return {
    idempotency_key: `SPOOL-${input.spoolId}-PURCHASE`,
    transaction_type: "expense",
    category_id: categoryId,
    gross_amount: totalCost,
    fee_amount: 0,
    net_amount: totalCost,
    accrual_date: accrualDate,
    cleared_at: new Date().toISOString(),
    status: "cleared",
    source_type: "filament_purchase",
    source_id: input.spoolId,
    description: `Aquisição Bobina Filamento: ${input.label}`,
    payment_method: "other",
    notes: `Custo produto: R$ ${input.purchaseCost.toFixed(2)} | Frete rateado: R$ ${input.allocatedShippingCost.toFixed(2)}`,
    actor_profile_id: input.actorProfileId ?? null,
  };
}

/**
 * Monta payload de transação financeira para compra de equipamento (impressora 3D).
 * Garante idempotência: ASSET-{assetId}-PURCHASE
 * Importante: A despesa é categorizada como capex_asset e não deve ser
 * jogada de forma simplista como custo total de uma impressão!
 */
export function buildAssetPurchaseTransactionPayload(
  input: ReconcileAssetPurchaseInput,
  categoryId: string | null
): Database["public"]["Tables"]["financial_transactions"]["Insert"] {
  const totalCost = round(input.purchaseCost + (input.shippingCost ?? 0), 2);
  const accrualDate = input.purchasedAt
    ? input.purchasedAt.split("T")[0]
    : new Date().toISOString().split("T")[0];

  const hourlyRate = round(totalCost / input.usefulLifeHours, 4);

  return {
    idempotency_key: `ASSET-${input.assetId}-PURCHASE`,
    transaction_type: "expense",
    category_id: categoryId,
    gross_amount: totalCost,
    fee_amount: 0,
    net_amount: totalCost,
    accrual_date: accrualDate,
    cleared_at: new Date().toISOString(),
    status: "cleared",
    source_type: "asset_purchase",
    source_id: input.assetId,
    description: `Aquisição de Equipamento (CAPEX): ${input.name} [${input.assetTag}]`,
    payment_method: "other",
    notes: `Ativo imobilizado. Vida útil: ${input.usefulLifeHours}h | Depreciação horária: R$ ${hourlyRate.toFixed(4)}/h`,
    actor_profile_id: input.actorProfileId ?? null,
  };
}

/**
 * Monta payload de estorno/reembolso de pedido.
 * Garante idempotência: REFUND-{paymentId}
 */
export function buildRefundTransactionPayload(
  input: ReconcileRefundInput,
  categoryId: string | null
): Database["public"]["Tables"]["financial_transactions"]["Insert"] {
  const accrualDate = input.refundedAt
    ? input.refundedAt.split("T")[0]
    : new Date().toISOString().split("T")[0];

  return {
    idempotency_key: `REFUND-${input.paymentId}-${input.refundAmount.toFixed(2)}`,
    transaction_type: "refund",
    category_id: categoryId,
    gross_amount: round(input.refundAmount, 2),
    fee_amount: 0,
    net_amount: round(input.refundAmount, 2),
    accrual_date: accrualDate,
    cleared_at: new Date().toISOString(),
    status: "cleared",
    source_type: "refund",
    source_id: input.paymentId,
    description: `Estorno/Reembolso de Pagamento ${input.paymentId}`,
    notes: input.reason ?? "Reembolso aprovado ao cliente",
    actor_profile_id: input.actorProfileId ?? null,
  };
}

/**
 * Validação mandatória: Reserva gratuita (interest_lead) NUNCA pode ter transação financeira!
 */
export function validateInterestLeadNoFinancialImpact(commercialMode: string): void {
  if (commercialMode === "interest_lead") {
    throw new Error(
      "Violação de Domínio: Reserva Gratuita de Interesse (interest_lead) não gera receita nem movimentação financeira."
    );
  }
}
