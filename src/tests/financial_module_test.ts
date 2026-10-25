// ============================================================================
// src/tests/financial_module_test.ts
// Testes Automatizados de Regras Financeiras, Custos, CAPEX e Conciliação (B.7)
// ============================================================================

import assert from "node:assert/strict";
import {
  round,
  calculateFilamentCost,
  calculateElectricityCost,
  calculateMachineDepreciation,
  calculateLaborCost,
  calculateProductUnitEconomics,
  calculateSubsidizedShipping,
  calculateContributionMargin,
  calculateCashflow,
  calculateDRE,
} from "../lib/finance/calculations.ts";
import {
  buildPaymentTransactionPayload,
  buildSpoolPurchaseTransactionPayload,
  buildAssetPurchaseTransactionPayload,
  buildRefundTransactionPayload,
  validateInterestLeadNoFinancialImpact,
} from "../lib/finance/reconciliation.ts";
import type {
  FinancialTransactionDTO,
  AccountPayableDTO,
  AccountReceivableDTO,
} from "../types/finance.types.ts";

async function runFinancialTests() {
  console.log("----------------------------------------------------------------");
  console.log("3D COMMERCE - SUITE DE TESTES FINANCEIROS & CONCILIAÇÃO (B.7)");
  console.log("----------------------------------------------------------------\n");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}: ${(err as Error).message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Precisão Decimal e Arredondamento
  // ---------------------------------------------------------------------------
  test("1.1: Arredondamento monetário de duas casas e precisão de quatro casas em insumos", () => {
    assert.equal(round(10.555, 2), 10.56);
    assert.equal(round(10.554, 2), 10.55);
    assert.equal(round(0.123456, 4), 0.1235);
  });

  // ---------------------------------------------------------------------------
  // 2. Regra Canônica: Compra de Equipamento é CAPEX (Depreciação Horária)
  // ---------------------------------------------------------------------------
  test("2.1: Compra de impressora de R$ 5.000 (5.000h úteis) deprecia R$ 1,00/h, não R$ 5.000 na peça", () => {
    const printerCost = 5000.0;
    const usefulLifeHours = 5000;
    const hourlyDepreciation = printerCost / usefulLifeHours; // R$ 1,00/h

    // Peça impressa em 120 minutos (2 horas)
    const printMinutes = 120;
    const result = calculateMachineDepreciation(printMinutes, hourlyDepreciation);

    assert.equal(result.isMissing, false);
    assert.equal(result.cost, 2.0); // 2 horas * R$ 1,00/h = R$ 2,00
    assert.notEqual(result.cost, 5000.0, "PROIBIDO atribuir o custo total do equipamento a uma peça!");
  });

  // ---------------------------------------------------------------------------
  // 3. Regra Canônica: Venda criada != Recebimento em Caixa
  // ---------------------------------------------------------------------------
  test("3.1: Venda provisionada/pendente não altera o saldo de caixa liquidado", () => {
    const pendingTx: FinancialTransactionDTO = {
      id: "tx-1",
      idempotency_key: "PAY-PENDING-001",
      transaction_type: "income",
      category_id: null,
      gross_amount: 150.0,
      fee_amount: 1.5,
      net_amount: 148.5,
      accrual_date: "2026-10-17",
      cleared_at: null,
      status: "pending", // ainda não liquidado no banco!
      source_type: "order_payment",
      source_id: "order-1",
      reconciliation_id: null,
      description: "Pedido #1001",
      notes: null,
      created_at: "2026-10-17T12:00:00Z",
    };

    const cashflow = calculateCashflow([pendingTx], [], []);
    assert.equal(cashflow.totalClearedIncome, 0.0);
    assert.equal(cashflow.currentCashBalance, 0.0, "Saldo de caixa liquidado deve ser 0 quando pendente");
  });

  // ---------------------------------------------------------------------------
  // 4. Regra Canônica: Pagamento Aprovado != Valor Liquidado (Dedução de Taxas)
  // ---------------------------------------------------------------------------
  test("4.1: Pagamento Pix de R$ 100 com taxa de 0.99% liquida R$ 99.01", () => {
    const payload = buildPaymentTransactionPayload(
      {
        paymentId: "pay-pix-01",
        orderId: "ord-01",
        grossAmount: 100.0,
        paymentMethod: "pix",
        paidAt: "2026-10-17T10:00:00Z",
        gatewayFeePct: 0.0099,
        isCleared: true,
      },
      null
    );

    assert.equal(payload.gross_amount, 100.0);
    assert.equal(payload.fee_amount, 0.99);
    assert.equal(payload.net_amount, 99.01);
    assert.equal(payload.idempotency_key, "PAY-pay-pix-01-INCOME");
  });

  // ---------------------------------------------------------------------------
  // 5. Regra Canônica: Reserva Gratuita (interest_lead) = Zero Receita
  // ---------------------------------------------------------------------------
  test("5.1: Reserva gratuita (interest_lead) lança exceção se for tentado faturar receita", () => {
    assert.throws(
      () => validateInterestLeadNoFinancialImpact("interest_lead"),
      /Violação de Domínio.*Reserva Gratuita.*não gera receita/
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Custo e Margem por Produto (CPV Estimado vs Telemetria Ausente)
  // ---------------------------------------------------------------------------
  test("6.1: Apuração de CPV unitário com filamento, energia, depreciação e embalagem", () => {
    const unitEconomics = calculateProductUnitEconomics({
      variantId: "var-vaso-01",
      unitSalePrice: 89.9,
      filamentGrams: 120.0,
      costPerGram: 0.12, // R$ 120 / kg = R$ 0,12 / g
      printMinutes: 240, // 4 horas
      nominalPowerWatts: 150,
      electricityKwhRate: 0.85, // R$ 0,85 / kWh
      depreciationRatePerHour: 1.0, // R$ 1,00 / hora
      packagingCost: 4.5,
      laborHourlyRate: 25.0,
      laborMinutes: 12, // 12 min acabamento
      calculationType: "estimated_catalog",
    });

    // Filamento: 120g * 0.12 = R$ 14.40
    assert.equal(unitEconomics.filament_cost, 14.4);
    // Energia: 4h * 0.15kW * R$ 0.85/kWh = R$ 0.51
    assert.equal(unitEconomics.electricity_cost, 0.51);
    // Depreciação: 4h * R$ 1.00 = R$ 4.00
    assert.equal(unitEconomics.machine_depreciation_cost, 4.0);
    // Embalagem: R$ 4.50
    assert.equal(unitEconomics.packaging_cost, 4.5);
    // Mão de obra: (12/60)h * R$ 25 = R$ 5.00
    assert.equal(unitEconomics.labor_cost, 5.0);

    // Custo total: 14.40 + 0.51 + 4.00 + 4.50 + 5.00 = 28.41
    assert.equal(unitEconomics.total_unit_cost, 28.41);
    // Margem bruta: 89.90 - 28.41 = 61.49
    assert.equal(unitEconomics.gross_margin_amount, 61.49);
    assert.equal(unitEconomics.gross_margin_percent, 68.4);
    assert.equal(unitEconomics.is_telemetry_missing, false);
  });

  test("6.2: Sinaliza parâmetro ausente explicitamente sem inventar valor de energia", () => {
    const electricity = calculateElectricityCost(180, 150, null);
    assert.equal(electricity.isMissing, true);
    assert.equal(electricity.cost, 0);
    assert.match(electricity.notes || "", /não configurada/);
  });

  // ---------------------------------------------------------------------------
  // 7. Frete Subsidiado e Margem de Contribuição
  // ---------------------------------------------------------------------------
  test("7.1: Frete com transportadora R$ 28 e cliente pagou R$ 0 (frete grátis) subsidia R$ 28", () => {
    const subsidized = calculateSubsidizedShipping(28.0, 0.0);
    assert.equal(subsidized, 28.0);

    // Se cliente pagou R$ 15 e frete real foi R$ 28: subsidia R$ 13
    assert.equal(calculateSubsidizedShipping(28.0, 15.0), 13.0);

    // Se cliente pagou R$ 30 e frete real foi R$ 25: sem subsidio
    assert.equal(calculateSubsidizedShipping(25.0, 30.0), 0.0);
  });

  test("7.2: Margem de contribuição deduz CPV e frete subsidiado da receita líquida", () => {
    // Venda líquida recebida R$ 90, CPV R$ 30, Frete subsidiado R$ 15
    const { contributionMargin, contributionMarginPct } = calculateContributionMargin(
      90.0,
      30.0,
      15.0
    );
    assert.equal(contributionMargin, 45.0); // 90 - 30 - 15
    assert.equal(contributionMarginPct, 50.0);
  });

  // ---------------------------------------------------------------------------
  // 8. Reembolsos e Estornos
  // ---------------------------------------------------------------------------
  test("8.1: Reembolso aprovado deduz do caixa e é identificado por chave de idempotência", () => {
    const refundPayload = buildRefundTransactionPayload(
      {
        paymentId: "pay-123",
        orderId: "ord-123",
        refundAmount: 55.0,
        refundedAt: "2026-10-17T15:00:00Z",
        reason: "Cliente solicitou cancelamento",
      },
      null
    );

    assert.equal(refundPayload.transaction_type, "refund");
    assert.equal(refundPayload.net_amount, 55.0);
    assert.equal(refundPayload.idempotency_key, "REFUND-pay-123-55.00");
  });

  // ---------------------------------------------------------------------------
  // 9. DRE Gerencial Completo
  // ---------------------------------------------------------------------------
  test("9.1: DRE Gerencial computa Faturamento Bruto, Deduções, CPV, Despesas e Margem", () => {
    const txs: FinancialTransactionDTO[] = [
      {
        id: "1",
        idempotency_key: "tx-inc-1",
        transaction_type: "income",
        category_id: null,
        gross_amount: 1000.0,
        fee_amount: 30.0, // 3% taxa
        net_amount: 970.0,
        accrual_date: "2026-10-17",
        cleared_at: "2026-10-17T10:00:00Z",
        status: "cleared",
        source_type: "order_payment",
        source_id: null,
        reconciliation_id: null,
        description: "Vendas da Semana",
        notes: null,
        created_at: "2026-10-17T10:00:00Z",
      },
      {
        id: "2",
        idempotency_key: "tx-cpv-1",
        transaction_type: "expense",
        category_id: null,
        category: {
          id: "cat-fil",
          code: "FILAMENT",
          name: "Filamento",
          dre_classification: "cost_of_goods",
          description: null,
          is_active: true,
          created_at: "",
        },
        gross_amount: 250.0,
        fee_amount: 0,
        net_amount: 250.0,
        accrual_date: "2026-10-17",
        cleared_at: "2026-10-17T10:00:00Z",
        status: "cleared",
        source_type: "filament_purchase",
        source_id: null,
        reconciliation_id: null,
        description: "Bobinas consumidas",
        notes: null,
        created_at: "2026-10-17T10:00:00Z",
      },
      {
        id: "3",
        idempotency_key: "tx-ship-1",
        transaction_type: "expense",
        category_id: null,
        category: {
          id: "cat-ship",
          code: "SHIPPING_SUBSIDY",
          name: "Frete Subsidiado",
          dre_classification: "variable_expense",
          description: null,
          is_active: true,
          created_at: "",
        },
        gross_amount: 50.0,
        fee_amount: 0,
        net_amount: 50.0,
        accrual_date: "2026-10-17",
        cleared_at: "2026-10-17T10:00:00Z",
        status: "cleared",
        source_type: "shipping_settlement",
        source_id: null,
        reconciliation_id: null,
        description: "Frete grátis campanhas",
        notes: null,
        created_at: "2026-10-17T10:00:00Z",
      },
      {
        id: "4",
        idempotency_key: "tx-fixed-1",
        transaction_type: "expense",
        category_id: null,
        category: {
          id: "cat-fix",
          code: "MAINTENANCE",
          name: "Manutenção",
          dre_classification: "fixed_expense",
          description: null,
          is_active: true,
          created_at: "",
        },
        gross_amount: 70.0,
        fee_amount: 0,
        net_amount: 70.0,
        accrual_date: "2026-10-17",
        cleared_at: "2026-10-17T10:00:00Z",
        status: "cleared",
        source_type: "general_expense",
        source_id: null,
        reconciliation_id: null,
        description: "Chapa PEI e bicos",
        notes: null,
        created_at: "2026-10-17T10:00:00Z",
      },
    ];

    const dre = calculateDRE(txs);
    assert.equal(dre.grossRevenue, 1000.0);
    assert.equal(dre.gatewayFees, 30.0);
    assert.equal(dre.subsidizedShipping, 50.0);
    // Receita Líquida: 1000 - 30 - 50 = 920.00
    assert.equal(dre.netRevenue, 920.0);
    // CPV: 250.00
    assert.equal(dre.costOfGoodsSold, 250.0);
    // Lucro Bruto: 920 - 250 = 670.00
    assert.equal(dre.grossProfit, 670.0);
    // Despesas Operacionais: 70.00
    assert.equal(dre.operatingExpenses, 70.0);
    // Resultado Operacional: 670 - 70 = 600.00
    assert.equal(dre.operatingResult, 600.0);
    assert.equal(dre.operatingMarginPct, 65.22); // (600 / 920) * 100
  });

  // ---------------------------------------------------------------------------
  // 10. Compra de Materiais e Insumos (Bobinas com Frete Rateado)
  // ---------------------------------------------------------------------------
  test("10.1: Aquisição de bobina de filamento soma custo e frete rateado com idempotência única", () => {
    const spoolPayload = buildSpoolPurchaseTransactionPayload(
      {
        spoolId: "spool-pla-blk-01",
        label: "Filamento PLA Preto 1kg",
        purchaseCost: 95.0,
        allocatedShippingCost: 15.0,
        purchasedAt: "2026-10-18T14:00:00Z",
      },
      "cat-insumo-id"
    );

    assert.equal(spoolPayload.transaction_type, "expense");
    assert.equal(spoolPayload.source_type, "filament_purchase");
    assert.equal(spoolPayload.gross_amount, 110.0); // 95 + 15
    assert.equal(spoolPayload.net_amount, 110.0);
    assert.equal(spoolPayload.idempotency_key, "SPOOL-spool-pla-blk-01-PURCHASE");
  });

  // ---------------------------------------------------------------------------
  // 11. Prevenção Estrita de Duplicidade (Idempotência)
  // ---------------------------------------------------------------------------
  test("11.1: Registros com mesma chave de idempotência garantem unicidade e evitam contabilidade dupla", () => {
    const paymentId = "mp-tx-999";
    const payload1 = buildPaymentTransactionPayload(
      {
        paymentId,
        orderId: "ord-999",
        grossAmount: 200.0,
        paymentMethod: "pix",
        paidAt: "2026-10-18T10:00:00Z",
        gatewayFeePct: 0.0099,
        isCleared: true,
      },
      null
    );

    const payload2 = buildPaymentTransactionPayload(
      {
        paymentId,
        orderId: "ord-999",
        grossAmount: 200.0,
        paymentMethod: "pix",
        paidAt: "2026-10-18T10:00:00Z",
        gatewayFeePct: 0.0099,
        isCleared: true,
      },
      null
    );

    // Chaves de idempotência devem ser estritamente idênticas para garantir deduplicação em banco
    assert.equal(payload1.idempotency_key, payload2.idempotency_key);
    assert.equal(payload1.idempotency_key, "PAY-mp-tx-999-INCOME");

    // Simulação do conjunto de transações: mesmo que o webhook seja chamado 2x,
    // a agregação deduplicada por chave não computa duas vezes
    const ledger = new Map<string, FinancialTransactionDTO>();
    const txDto1: FinancialTransactionDTO = {
      id: "1",
      idempotency_key: payload1.idempotency_key,
      transaction_type: payload1.transaction_type,
      category_id: null,
      gross_amount: payload1.gross_amount ?? 0,
      fee_amount: payload1.fee_amount ?? 0,
      net_amount: payload1.net_amount ?? 0,
      accrual_date: payload1.accrual_date,
      cleared_at: payload1.cleared_at ?? null,
      status: (payload1.status ?? "cleared") as any,
      source_type: "order_payment",
      source_id: payload1.source_id ?? null,
      reconciliation_id: null,
      description: payload1.description,
      notes: null,
      created_at: new Date().toISOString(),
    };

    ledger.set(txDto1.idempotency_key, txDto1);
    // Segunda chamada idêntica re-insere na mesma chave
    ledger.set(txDto1.idempotency_key, txDto1);

    const transactions = Array.from(ledger.values());
    assert.equal(transactions.length, 1, "Não pode haver transações duplicadas!");
    const cashflow = calculateCashflow(transactions, [], []);
    assert.equal(cashflow.totalClearedIncome, 198.02); // 200 - 1.98
    assert.notEqual(cashflow.totalClearedIncome, 396.04, "PROIBIDO somar valor duplicado!");
  });

  console.log("\n----------------------------------------------------------------");
  console.log(`TOTAL DE TESTES: ${passed + failed}`);
  console.log(`PASSOU: ${passed}`);
  console.log(`FALHOU: ${failed}`);
  console.log("----------------------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runFinancialTests();
