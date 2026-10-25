import type {
  FinancialTransactionType,
  FinancialTransactionStatus,
  AccountPayableStatus,
  AccountReceivableStatus,
  ReconciliationStatus,
} from "./database.types";

export interface FinancialSettingsDTO {
  id: string;
  singleton_key: string;
  electricity_kwh_rate: number | null;
  electricity_provider_name: string | null;
  labor_hourly_rate: number | null;
  default_gateway_pix_fee_pct: number;
  default_gateway_card_fee_pct: number;
  default_gateway_fixed_fee: number;
  default_packaging_cost: number;
  target_markup_multiplier: number;
  notes: string | null;
  updated_at: string;
}

export interface ExpenseCategoryDTO {
  id: string;
  code: string;
  name: string;
  dre_classification:
    | "cost_of_goods"
    | "variable_expense"
    | "fixed_expense"
    | "labor_expense"
    | "capex_asset"
    | "marketing_expense"
    | "financial_expense"
    | "other";
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FinancialAssetDTO {
  id: string;
  asset_tag: string;
  name: string;
  brand: string | null;
  model: string | null;
  purchase_cost: number;
  shipping_cost: number;
  total_acquisition_cost: number;
  useful_life_hours: number;
  depreciation_rate_per_hour: number;
  nominal_power_watts: number;
  status: "active" | "maintenance" | "retired";
  purchased_at: string | null;
  supplier_invoice: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransactionDTO {
  id: string;
  idempotency_key: string;
  transaction_type: FinancialTransactionType;
  category_id: string | null;
  category?: ExpenseCategoryDTO | null;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  accrual_date: string;
  cleared_at: string | null;
  status: FinancialTransactionStatus;
  source_type:
    | "order_payment"
    | "filament_purchase"
    | "asset_purchase"
    | "shipping_settlement"
    | "general_expense"
    | "refund"
    | "adjustment";
  source_id: string | null;
  reconciliation_id: string | null;
  description: string;
  payment_method?: string | null;
  notes: string | null;
  created_at: string;
}

export interface AccountPayableDTO {
  id: string;
  category_id: string | null;
  category?: ExpenseCategoryDTO | null;
  description: string;
  due_date: string;
  original_amount: number;
  paid_amount: number;
  discount_amount: number;
  penalty_amount: number;
  status: AccountPayableStatus;
  paid_at: string | null;
  recipient_name: string | null;
  invoice_number: string | null;
  source_type: string | null;
  source_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface AccountReceivableDTO {
  id: string;
  order_id: string | null;
  payment_id: string | null;
  description: string;
  expected_clearance_date: string;
  gross_amount: number;
  estimated_fee: number;
  net_expected_amount: number;
  received_net_amount: number;
  status: AccountReceivableStatus;
  cleared_at: string | null;
  gateway_settlement_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface FinancialReconciliationDTO {
  id: string;
  period_start: string;
  period_end: string;
  gateway: string;
  total_orders_amount: number;
  total_gateway_fees: number;
  total_net_cleared: number;
  total_refunds: number;
  discrepancy_amount: number;
  status: ReconciliationStatus;
  notes: string | null;
  reconciled_at: string | null;
  created_at: string;
}

export interface ProductCostSnapshotDTO {
  id: string;
  variant_id: string;
  variant_name?: string;
  product_name?: string;
  production_order_id: string | null;
  calculation_type: "estimated_catalog" | "actual_production";
  filament_cost: number;
  electricity_cost: number;
  machine_depreciation_cost: number;
  packaging_cost: number;
  labor_cost: number;
  other_direct_cost: number;
  total_unit_cost: number;
  unit_sale_price: number;
  gross_margin_amount: number;
  gross_margin_percent: number;
  is_telemetry_missing: boolean;
  missing_parameters_notes: string | null;
  created_at: string;
}

export interface FinancialCashflowSummary {
  // Saldo real e liquidado
  totalClearedIncome: number;
  totalClearedExpense: number;
  totalClearedRefunds: number;
  currentCashBalance: number; // income - expense - refunds

  // Direitos e obrigações futuras
  totalPendingReceivables: number;
  totalPendingPayables: number;
  projectedCashBalance: number; // currentCashBalance + receivables - payables

  // Taxas e subsidios
  totalGatewayFeesRetained: number;
  totalSubsidizedShipping: number;
}

export interface DRESummary {
  grossRevenue: number;          // Vendas brutas faturadas
  gatewayFees: number;           // Deduções de gateway
  subsidizedShipping: number;    // Frete subsidiado
  netRevenue: number;            // Receita Líquida (Vendas - Taxas - Frete Subsid)
  costOfGoodsSold: number;       // CPV (Filamento + insumos diretos)
  grossProfit: number;           // Lucro Bruto (Receita Líquida - CPV)
  grossMarginPct: number;        // Margem Bruta %
  operatingExpenses: number;     // Despesas operacionais fixas (luz geral, manutenção)
  laborExpenses: number;         // Mão de obra / pró-labore
  operatingResult: number;       // Resultado Operacional / EBITDA
  operatingMarginPct: number;    // Margem Operacional %
}
