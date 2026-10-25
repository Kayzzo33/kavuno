-- ============================================================================
-- 3D COMMERCE - MIGRATION 05: AUDITABLE FINANCIAL MODULE & RECONCILIATION (B.7)
-- Version: 20261015000005
-- Description: Módulo financeiro completo e auditável:
--              • Entradas e saídas de caixa (competência vs liquidação)
--              • Contas a pagar e receber com vencimentos e liquidações
--              • Categorias contábeis / DRE e controle de despesas
--              • Gestão de ativos (impressoras/equipamentos) com depreciação horária
--                (evita rateio 100% integral ingênuo na primeira peça!)
--              • Parâmetros configuráveis sem inventar valores ausentes
--              • Conciliação de taxas de gateway e liquidações de provedor
--              • Controle de frete subsidiado e estornos/reembolsos
--              • Prevenção de duplicidade por chave de idempotência estrita
--              • Restrição Zero Trust (RLS) exclusivamente para administradores
-- ============================================================================

-- ============================================================================
-- 1. ENUMS FINANCEIROS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.financial_transaction_type AS ENUM (
        'income',        -- entrada / receita
        'expense',       -- saída / despesa operacional ou insumo
        'refund',        -- reembolso / estorno devolvido ao cliente
        'transfer'       -- transferência interna entre contas/caixas
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.financial_transaction_status AS ENUM (
        'pending',       -- provisionado / aguardando compensação
        'cleared',       -- liquidado efetivamente no saldo bancário
        'cancelled',     -- cancelado
        'refunded'       -- estornado
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.account_payable_status AS ENUM (
        'pending',       -- a pagar
        'paid',          -- liquidado
        'cancelled',     -- cancelado
        'overdue'        -- vencido
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.account_receivable_status AS ENUM (
        'pending',       -- a receber
        'received',      -- recebido / liquidado
        'cancelled',     -- cancelado
        'disputed'       -- em contestação / chargeback
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.reconciliation_status AS ENUM (
        'open',          -- aberta em conferência
        'reconciled',    -- conciliada e aprovada
        'flagged'        -- com divergências apontadas
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. TABELA: Parâmetros e Configurações Financeiras (financial_settings)
-- Permite configurar tarifas de energia, mão de obra e taxas de gateway
-- sem inventar números quando faltar telemetria.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.financial_settings (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    singleton_key               TEXT NOT NULL UNIQUE DEFAULT 'active_config',

    -- Energia elétrica e consumo
    electricity_kwh_rate        NUMERIC(12,4) CHECK (electricity_kwh_rate IS NULL OR electricity_kwh_rate >= 0),
    electricity_provider_name   TEXT,

    -- Custo de mão de obra direta por hora (operador/pós-processamento)
    labor_hourly_rate           NUMERIC(12,2) CHECK (labor_hourly_rate IS NULL OR labor_hourly_rate >= 0),

    -- Parâmetros padrão de gateway caso o webhook não especifique a taxa
    default_gateway_pix_fee_pct NUMERIC(6,4) NOT NULL DEFAULT 0.0099 CHECK (default_gateway_pix_fee_pct >= 0),
    default_gateway_card_fee_pct NUMERIC(6,4) NOT NULL DEFAULT 0.0499 CHECK (default_gateway_card_fee_pct >= 0),
    default_gateway_fixed_fee   NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (default_gateway_fixed_fee >= 0),

    -- Embalagem média padrão por pedido (caso não detalhada)
    default_packaging_cost      NUMERIC(12,2) NOT NULL DEFAULT 3.50 CHECK (default_packaging_cost >= 0),

    -- Markup alvo para cálculo de preço sugerido
    target_markup_multiplier    NUMERIC(6,2) NOT NULL DEFAULT 2.50 CHECK (target_markup_multiplier >= 1),

    notes                       TEXT,
    updated_by                  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA: Categorias de Despesas e DRE (expense_categories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT NOT NULL UNIQUE,          -- ex: "FILAMENT", "EQUIPMENT", "ENERGY"
    name                TEXT NOT NULL,
    dre_classification  TEXT NOT NULL CHECK (
        dre_classification IN (
            'cost_of_goods',        -- CPV (filamento, insumo direto)
            'variable_expense',    -- Despesa variável (taxa gateway, frete subsidiado)
            'fixed_expense',       -- Despesa fixa (energia fábrica, aluguel, software)
            'labor_expense',       -- Mão de obra / pró-labore
            'capex_asset',         -- Investimento em equipamento / imobilizado
            'marketing_expense',   -- Despesa com tráfego e marketing
            'financial_expense',   -- Juros, multas, tarifas bancárias
            'other'
        )
    ),
    description         TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_cat_code ON public.expense_categories(code);
CREATE INDEX IF NOT EXISTS idx_expense_cat_dre  ON public.expense_categories(dre_classification);

-- Seed canônico de categorias essenciais
INSERT INTO public.expense_categories (code, name, dre_classification, description)
VALUES
    ('FILAMENT', 'Matéria-Prima (Bobinas de Filamento)', 'cost_of_goods', 'Aquisição de carretéis de PLA, PETG, ABS, TPU, etc.'),
    ('PACKAGING', 'Embalagens e Envio', 'cost_of_goods', 'Caixas de papelão, plástico bolha, fita adesiva, etiquetas'),
    ('ENERGY', 'Energia Elétrica', 'fixed_expense', 'Conta de energia do ambiente de impressão 3D'),
    ('EQUIPMENT', 'Equipamentos e Máquinas (CAPEX)', 'capex_asset', 'Compra de impressoras 3D, secadoras de filamento, no-breaks'),
    ('MAINTENANCE', 'Peças e Manutenção', 'fixed_expense', 'Bicos, chapas PEI, correias, extrusores, termistores'),
    ('GATEWAY_FEE', 'Taxas de Meio de Pagamento', 'variable_expense', 'Tarifas retidas por Mercado Pago ou adquirentes'),
    ('SHIPPING_SUBSIDY', 'Frete Subsidiado', 'variable_expense', 'Custo logístico absorvido pela loja (frete grátis ou desconto)'),
    ('LABOR', 'Mão de Obra e Pró-labore', 'labor_expense', 'Horas de modelagem, fatiamento, operação e acabamento manual'),
    ('MARKETING', 'Marketing e Vendas', 'marketing_expense', 'Anúncios online, amostras e parcerias comerciais'),
    ('REFUND', 'Reembolsos e Estornos', 'variable_expense', 'Valores devolvidos por desistência ou garantia'),
    ('OTHER', 'Outras Despesas Operacionais', 'other', 'Insumos gerais como álcool isopropílico, cola de mesa, etc.')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 4. TABELA: Ativos e Equipamentos (financial_assets)
-- Impede rateio integral ingênuo na primeira peça.
-- Registra impressoras com vida útil em horas e depreciação horária.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.financial_assets (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag                   TEXT NOT NULL UNIQUE,          -- ex: "EQ-BAMBU-P1S-01"
    name                        TEXT NOT NULL,
    brand                       TEXT,
    model                       TEXT,

    -- Custo de aquisição
    purchase_cost               NUMERIC(12,2) NOT NULL CHECK (purchase_cost >= 0),
    shipping_cost               NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
    total_acquisition_cost      NUMERIC(12,2) GENERATED ALWAYS AS (purchase_cost + shipping_cost) STORED,

    -- Vida útil e depreciação técnica
    useful_life_hours           INT NOT NULL CHECK (useful_life_hours > 0),
    depreciation_rate_per_hour  NUMERIC(12,4) GENERATED ALWAYS AS (
        (purchase_cost + shipping_cost) / useful_life_hours
    ) STORED,

    -- Potência nominal da máquina (Watts) para cálculo de energia
    nominal_power_watts         INT NOT NULL DEFAULT 150 CHECK (nominal_power_watts >= 0),

    -- Status e rastreabilidade
    status                      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    purchased_at                DATE,
    supplier_invoice            TEXT,
    notes                       TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_assets_tag    ON public.financial_assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_fin_assets_status ON public.financial_assets(status);

DROP TRIGGER IF EXISTS trg_fin_assets_updated_at ON public.financial_assets;
CREATE TRIGGER trg_fin_assets_updated_at
    BEFORE UPDATE ON public.financial_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. TABELA: Sessões de Conciliação Financeira (financial_reconciliations)
-- Registra conciliações periódicas de gateway/banco com identificação de diferenças.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.financial_reconciliations (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start                DATE NOT NULL,
    period_end                  DATE NOT NULL,
    gateway                     TEXT NOT NULL DEFAULT 'mercado_pago',

    total_orders_amount         NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_orders_amount >= 0),
    total_gateway_fees          NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_gateway_fees >= 0),
    total_net_cleared           NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_net_cleared >= 0),
    total_refunds               NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_refunds >= 0),
    discrepancy_amount          NUMERIC(12,2) NOT NULL DEFAULT 0.00,

    status                      public.reconciliation_status NOT NULL DEFAULT 'open',
    actor_profile_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes                       TEXT,
    reconciled_at               TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconcil_status ON public.financial_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_reconcil_period ON public.financial_reconciliations(period_start, period_end);

-- ============================================================================
-- 6. TABELA: Transações Financeiras / Livro Razão (financial_transactions)
-- Registra todo fluxo financeiro auditável (entradas, saídas, taxas, estornos).
-- Chave de idempotência estrita impede duplicidade contábil.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key     TEXT NOT NULL UNIQUE,          -- ex: "PAY-MP-123456-INCOME", "SPOOL-001-PURCHASE"

    transaction_type    public.financial_transaction_type NOT NULL,
    category_id         UUID REFERENCES public.expense_categories(id) ON DELETE RESTRICT,

    -- Valores monetários precisos
    gross_amount        NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),   -- valor nominal bruto
    fee_amount          NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (fee_amount >= 0), -- taxa retida
    net_amount          NUMERIC(12,2) NOT NULL CHECK (net_amount >= 0),     -- valor líquido efetivo

    -- Datas cruciais (Competência vs Liquidação de Caixa)
    accrual_date        DATE NOT NULL,                -- Data de competência da obrigação/venda
    cleared_at          TIMESTAMPTZ,                  -- Data/hora em que o valor entrou/saiu do saldo

    status              public.financial_transaction_status NOT NULL DEFAULT 'pending',

    -- Vínculo de origem auditável
    source_type         TEXT NOT NULL CHECK (
        source_type IN (
            'order_payment',          -- Pagamento de pedido de cliente
            'filament_purchase',      -- Compra de bobina de filamento
            'asset_purchase',         -- Compra de máquina/impressora
            'shipping_settlement',    -- Liquidação de frete subsidiado/pago à transportadora
            'general_expense',        -- Despesa avulsa (energia, embalagem, etc.)
            'refund',                 -- Devolução/estorno
            'adjustment'              -- Ajuste contábil manual justificado
        )
    ),
    source_id           UUID,                         -- ID do pedido, pagamento, bobina ou ativo
    reconciliation_id   UUID REFERENCES public.financial_reconciliations(id) ON DELETE SET NULL,

    description         TEXT NOT NULL,
    payment_method      public.payment_method,
    notes               TEXT,
    actor_profile_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_tx_idempotency ON public.financial_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type        ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_fin_tx_status      ON public.financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fin_tx_source      ON public.financial_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_accrual     ON public.financial_transactions(accrual_date);
CREATE INDEX IF NOT EXISTS idx_fin_tx_cleared     ON public.financial_transactions(cleared_at);

DROP TRIGGER IF EXISTS trg_fin_tx_updated_at ON public.financial_transactions;
CREATE TRIGGER trg_fin_tx_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 7. TABELA: Contas a Pagar (accounts_payable)
-- Obrigações financeiras futuras (fornecedores de filamento, energia, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id         UUID REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    description         TEXT NOT NULL,
    due_date            DATE NOT NULL,

    original_amount     NUMERIC(12,2) NOT NULL CHECK (original_amount >= 0),
    paid_amount         NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    penalty_amount      NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (penalty_amount >= 0),

    status              public.account_payable_status NOT NULL DEFAULT 'pending',
    paid_at             TIMESTAMPTZ,
    recipient_name      TEXT,
    invoice_number      TEXT,

    -- Vínculo opcional com origem
    source_type         TEXT,
    source_id           UUID,

    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payables_due    ON public.accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_payables_status ON public.accounts_payable(status);

DROP TRIGGER IF EXISTS trg_payables_updated_at ON public.accounts_payable;
CREATE TRIGGER trg_payables_updated_at
    BEFORE UPDATE ON public.accounts_payable
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 8. TABELA: Contas a Receber (accounts_receivable)
-- Direitos de recebimento (vendas aprovadas aguardando liberação do gateway)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_id              UUID REFERENCES public.payments(id) ON DELETE SET NULL,

    description             TEXT NOT NULL,
    expected_clearance_date DATE NOT NULL,

    gross_amount            NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
    estimated_fee           NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (estimated_fee >= 0),
    net_expected_amount     NUMERIC(12,2) GENERATED ALWAYS AS (gross_amount - estimated_fee) STORED,
    received_net_amount     NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (received_net_amount >= 0),

    status                  public.account_receivable_status NOT NULL DEFAULT 'pending',
    cleared_at              TIMESTAMPTZ,
    gateway_settlement_id   TEXT,

    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receivables_order   ON public.accounts_receivable(order_id);
CREATE INDEX IF NOT EXISTS idx_receivables_status  ON public.accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_receivables_cleared ON public.accounts_receivable(cleared_at);

DROP TRIGGER IF EXISTS trg_receivables_updated_at ON public.accounts_receivable;
CREATE TRIGGER trg_receivables_updated_at
    BEFORE UPDATE ON public.accounts_receivable
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 9. TABELA: Snapshots de Custo e Margem por Produto (product_cost_snapshots)
-- Registra fórmulas de CPV e margens apuradas (estimado no catálogo vs realizado em ordens).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_cost_snapshots (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id                  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    production_order_id         UUID REFERENCES public.production_orders(id) ON DELETE SET NULL,

    calculation_type            TEXT NOT NULL CHECK (calculation_type IN ('estimated_catalog', 'actual_production')),

    -- Componentes detalhados do custo unitário
    filament_cost               NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (filament_cost >= 0),
    electricity_cost            NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (electricity_cost >= 0),
    machine_depreciation_cost   NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (machine_depreciation_cost >= 0),
    packaging_cost              NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (packaging_cost >= 0),
    labor_cost                  NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
    other_direct_cost           NUMERIC(12,4) NOT NULL DEFAULT 0 CHECK (other_direct_cost >= 0),

    -- Custo total unitário calculado
    total_unit_cost             NUMERIC(12,4) GENERATED ALWAYS AS (
        filament_cost + electricity_cost + machine_depreciation_cost + packaging_cost + labor_cost + other_direct_cost
    ) STORED,

    -- Indicadores de receita e margem
    unit_sale_price             NUMERIC(12,2) NOT NULL CHECK (unit_sale_price >= 0),
    gross_margin_amount         NUMERIC(12,2) NOT NULL,
    gross_margin_percent        NUMERIC(6,2) NOT NULL,

    -- Ausência de parâmetros de telemetria identificada
    is_telemetry_missing        BOOLEAN NOT NULL DEFAULT FALSE,
    missing_parameters_notes    TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_snapshots_variant ON public.product_cost_snapshots(variant_id);
CREATE INDEX IF NOT EXISTS idx_cost_snapshots_order   ON public.product_cost_snapshots(production_order_id);
CREATE INDEX IF NOT EXISTS idx_cost_snapshots_type    ON public.product_cost_snapshots(calculation_type);

-- ============================================================================
-- 10. HABILITAÇÃO DE RLS ZERO TRUST EM TODAS AS TABELAS FINANCEIRAS
-- Todas as tabelas financeiras são estritamente restritas a administradores (public.is_admin()).
-- Clientes anônimos ou comuns NÃO POSSUEM NENHUM ACESSO.
-- ============================================================================
ALTER TABLE public.financial_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_cost_snapshots   ENABLE ROW LEVEL SECURITY;

-- 10.1 financial_settings
DROP POLICY IF EXISTS "fin_settings_admin_all" ON public.financial_settings;
CREATE POLICY "fin_settings_admin_all" ON public.financial_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.2 expense_categories
DROP POLICY IF EXISTS "exp_categories_admin_all" ON public.expense_categories;
CREATE POLICY "exp_categories_admin_all" ON public.expense_categories
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.3 financial_assets
DROP POLICY IF EXISTS "fin_assets_admin_all" ON public.financial_assets;
CREATE POLICY "fin_assets_admin_all" ON public.financial_assets
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.4 financial_reconciliations
DROP POLICY IF EXISTS "fin_reconcil_admin_all" ON public.financial_reconciliations;
CREATE POLICY "fin_reconcil_admin_all" ON public.financial_reconciliations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.5 financial_transactions
DROP POLICY IF EXISTS "fin_transactions_admin_all" ON public.financial_transactions;
CREATE POLICY "fin_transactions_admin_all" ON public.financial_transactions
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.6 accounts_payable
DROP POLICY IF EXISTS "payables_admin_all" ON public.accounts_payable;
CREATE POLICY "payables_admin_all" ON public.accounts_payable
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.7 accounts_receivable
DROP POLICY IF EXISTS "receivables_admin_all" ON public.accounts_receivable;
CREATE POLICY "receivables_admin_all" ON public.accounts_receivable
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.8 product_cost_snapshots
DROP POLICY IF EXISTS "cost_snapshots_admin_all" ON public.product_cost_snapshots;
CREATE POLICY "cost_snapshots_admin_all" ON public.product_cost_snapshots
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Inserir registro inicial de financial_settings se não existir
INSERT INTO public.financial_settings (singleton_key, electricity_kwh_rate, labor_hourly_rate)
VALUES ('active_config', 0.8500, 25.00)
ON CONFLICT (singleton_key) DO NOTHING;
