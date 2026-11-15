-- ============================================================================
-- KAVUNO 3D COMMERCE - SCRIPT DE INSTALAÇÃO CONSOLIDADO NO SUPABASE
-- Execute este script no SQL Editor do painel do Supabase (https://supabase.com/dashboard)
-- Criação de tabelas, configurações, categorias, banners e módulo financeiro/fábrica
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONFIGURAÇÕES DA LOJA E BANNERS (HERO, FOOTER E MARQUEE)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.site_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    tag TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    button_text TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    position TEXT NOT NULL DEFAULT 'hero',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garante a coluna position se a tabela já existia sem ela
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'site_banners' AND column_name = 'position'
    ) THEN
        ALTER TABLE public.site_banners ADD COLUMN position TEXT NOT NULL DEFAULT 'hero';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações padrão
INSERT INTO public.site_settings (key, value)
VALUES
    ('hero_mode', '"hot_products"'::jsonb),
    ('announcement_text', '"🚚 Frete Grátis para todo Brasil acima de R$ 199 • 🛡️ Garantia de Acabamento 3D • ⚡ Despacho Rápido"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- RLS para banners e configurações
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_banners_public_select" ON public.site_banners;
CREATE POLICY "site_banners_public_select" ON public.site_banners
    FOR SELECT TO public USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "site_banners_admin_all" ON public.site_banners;
CREATE POLICY "site_banners_admin_all" ON public.site_banners
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_public_select" ON public.site_settings;
CREATE POLICY "site_settings_public_select" ON public.site_settings
    FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS "site_settings_admin_all" ON public.site_settings;
CREATE POLICY "site_settings_admin_all" ON public.site_settings
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. CATEGORIAS OFICIAIS DO CATÁLOGO
-- ----------------------------------------------------------------------------

INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Action Figures & Geek', 'decoracao-design', 'Peças colecionáveis com geometria épica e acabamentos manuais de alta resolução.', 1, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'Setup & Desk', 'setup-produtividade', 'Suportes para headset, organizadores de cabos e suportes de precisão.', 2, TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'Peças Técnicas & Mecânica', 'prototipagem-engenharia', 'Engenharia aplicada e manufatura sob demanda em filamentos nobres (PETG/ABS/TPU).', 3, TRUE)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 3. MÓDULO FINANCEIRO, DRE E CONCILIAÇÃO
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE public.financial_transaction_type AS ENUM ('income', 'expense', 'refund', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.financial_transaction_status AS ENUM ('pending', 'cleared', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.account_payable_status AS ENUM ('pending', 'paid', 'cancelled', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.account_receivable_status AS ENUM ('pending', 'received', 'cancelled', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.financial_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    singleton_key TEXT NOT NULL UNIQUE DEFAULT 'active_config',
    electricity_kwh_rate NUMERIC(10, 4) NOT NULL DEFAULT 0.8500,
    electricity_provider_name TEXT NOT NULL DEFAULT 'Concessionária Local',
    labor_hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 25.00,
    default_gateway_pix_fee_pct NUMERIC(6, 4) NOT NULL DEFAULT 0.0099,
    default_gateway_card_fee_pct NUMERIC(6, 4) NOT NULL DEFAULT 0.0499,
    default_gateway_fixed_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    default_packaging_cost NUMERIC(10, 2) NOT NULL DEFAULT 3.50,
    target_markup_multiplier NUMERIC(6, 2) NOT NULL DEFAULT 2.50,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.financial_settings (singleton_key, electricity_kwh_rate, labor_hourly_rate)
VALUES ('active_config', 0.85, 25.00)
ON CONFLICT (singleton_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    dre_classification TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.expense_categories (code, name, dre_classification)
VALUES
    ('FILAMENT_RAW', 'Filamentos e Insumos 3D', 'cpv'),
    ('ELECTRICITY', 'Energia Elétrica Fabril', 'cpv'),
    ('PACKAGING', 'Caixas e Embalagens de Envio', 'cpv'),
    ('SHIPPING_SUBSIDY', 'Frete Subsidiado da Loja', 'deductions'),
    ('GATEWAY_FEE', 'Taxas Mercado Pago (PIX/Cartão)', 'deductions'),
    ('MARKETING', 'Anúncios e Campanhas', 'operational_expense'),
    ('MAINTENANCE', 'Peças e Bicos de Impressora 3D', 'operational_expense'),
    ('SOFTWARE', 'SaaS e Ferramentas Digitais', 'operational_expense'),
    ('OTHER_EXPENSE', 'Outras Despesas Operacionais', 'operational_expense')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.financial_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    purchase_cost NUMERIC(12, 2) NOT NULL,
    shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_acquisition_cost NUMERIC(12, 2) GENERATED ALWAYS AS (purchase_cost + shipping_cost) STORED,
    useful_life_hours NUMERIC(10, 2) NOT NULL DEFAULT 3000,
    depreciation_rate_per_hour NUMERIC(10, 4) GENERATED ALWAYS AS (
        CASE WHEN useful_life_hours > 0 THEN (purchase_cost + shipping_cost) / useful_life_hours ELSE 0 END
    ) STORED,
    nominal_power_watts NUMERIC(8, 2) NOT NULL DEFAULT 350,
    purchased_at DATE,
    supplier_invoice TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    transaction_type public.financial_transaction_type NOT NULL,
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    gross_amount NUMERIC(12, 2) NOT NULL,
    fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(12, 2) NOT NULL,
    accrual_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cleared_at TIMESTAMPTZ,
    status public.financial_transaction_status NOT NULL DEFAULT 'cleared',
    source_type TEXT NOT NULL DEFAULT 'manual',
    source_id TEXT,
    description TEXT NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    original_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    penalty_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status public.account_payable_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    recipient_name TEXT,
    invoice_number TEXT,
    source_type TEXT,
    source_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    payment_id UUID,
    description TEXT NOT NULL,
    expected_clearance_date DATE NOT NULL,
    gross_amount NUMERIC(12, 2) NOT NULL,
    estimated_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_expected_amount NUMERIC(12, 2) NOT NULL,
    received_net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status public.account_receivable_status NOT NULL DEFAULT 'pending',
    cleared_at TIMESTAMPTZ,
    gateway_settlement_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_cost_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    production_order_id UUID,
    calculation_type TEXT NOT NULL DEFAULT 'theoretical_variant',
    filament_cost NUMERIC(10, 4) NOT NULL DEFAULT 0,
    electricity_cost NUMERIC(10, 4) NOT NULL DEFAULT 0,
    machine_depreciation_cost NUMERIC(10, 4) NOT NULL DEFAULT 0,
    packaging_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(10, 4) NOT NULL DEFAULT 0,
    other_direct_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
    unit_sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gross_margin_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gross_margin_percent NUMERIC(6, 4) NOT NULL DEFAULT 0,
    is_telemetry_missing BOOLEAN NOT NULL DEFAULT FALSE,
    missing_parameters_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Financeiro
ALTER TABLE public.financial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_cost_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_admin_all" ON public.financial_settings;
CREATE POLICY "financial_admin_all" ON public.financial_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "expense_categories_select" ON public.expense_categories;
CREATE POLICY "expense_categories_select" ON public.expense_categories FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "financial_assets_admin" ON public.financial_assets;
CREATE POLICY "financial_assets_admin" ON public.financial_assets FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "financial_transactions_admin" ON public.financial_transactions;
CREATE POLICY "financial_transactions_admin" ON public.financial_transactions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "accounts_payable_admin" ON public.accounts_payable;
CREATE POLICY "accounts_payable_admin" ON public.accounts_payable FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "accounts_receivable_admin" ON public.accounts_receivable;
CREATE POLICY "accounts_receivable_admin" ON public.accounts_receivable FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_cost_snapshots_admin" ON public.product_cost_snapshots;
CREATE POLICY "product_cost_snapshots_admin" ON public.product_cost_snapshots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. MÓDULO DE FÁBRICA, BOBINAS E ORDENS DE PRODUÇÃO
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.filament_spools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spool_code TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    material TEXT NOT NULL DEFAULT 'PLA',
    color_name TEXT NOT NULL,
    color_hex VARCHAR(7),
    initial_weight_grams NUMERIC(10, 2) NOT NULL DEFAULT 1000,
    current_weight_grams NUMERIC(10, 2) NOT NULL DEFAULT 1000,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 120.00,
    cost_per_gram NUMERIC(10, 4) GENERATED ALWAYS AS (
        CASE WHEN initial_weight_grams > 0 THEN purchase_price / initial_weight_grams ELSE 0 END
    ) STORED,
    status TEXT NOT NULL DEFAULT 'in_use',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT NOT NULL UNIQUE,
    product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    spool_id UUID REFERENCES public.filament_spools(id) ON DELETE SET NULL,
    estimated_grams NUMERIC(10, 2) NOT NULL DEFAULT 0,
    actual_grams NUMERIC(10, 2),
    estimated_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
    actual_hours NUMERIC(6, 2),
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.filament_spools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "filament_spools_admin" ON public.filament_spools;
CREATE POLICY "filament_spools_admin" ON public.filament_spools FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "production_orders_admin" ON public.production_orders;
CREATE POLICY "production_orders_admin" ON public.production_orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Recarrega o cache do PostgREST para reconhecer as novas tabelas imediatamente
NOTIFY pgrst, 'reload schema';
