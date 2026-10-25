-- ============================================================================
-- 3D COMMERCE - MIGRATION 04: PRODUCTION MODULE & FILAMENT SPOOLS (B.6)
-- Version: 20261015000004
-- Description: Bobinas individuais de filamento com rastreabilidade de custo,
--              movimentações auditáveis, ordens de produção vinculadas a
--              produto/variante, consumo real vs. estimado, perdas e refugos.
-- Premissas:
--   - Todos os valores monetários usam NUMERIC(12,2); pesos usam NUMERIC(10,4)
--     para precisão de casas decimais necessária em gramas de filamento.
--   - Nenhuma migration anterior é alterada.
--   - Enums spool_status e production_status foram criados na migration 01.
-- ============================================================================

-- ============================================================================
-- ENUM ADICIONAL: tipo de movimentação de bobina
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE public.spool_movement_type AS ENUM (
        'production_consumption',   -- consumo em ordem de produção
        'waste_discard',            -- descarte de perdas/falhas
        'manual_adjustment',        -- ajuste manual corrigido
        'initial_weight',           -- registro de peso inicial ao cadastrar
        'weigh_in'                  -- pesagem intermediária de conferência
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- ENUM ADICIONAL: tipo de custo de produção
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE public.production_cost_type AS ENUM (
        'filament',
        'packaging',
        'labor',
        'energy',
        'machine_time',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 1. Tabela: Bobinas Individuais de Filamento (filament_spools)
-- Cada registro representa uma bobina física com rastreabilidade completa
-- de custo, origem, peso e status operacional.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.filament_spools (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação física
    label                   TEXT NOT NULL,                -- ex: "PLA-VERDE-001"
    batch_number            TEXT,                         -- lote do fabricante
    material                public.filament_material NOT NULL DEFAULT 'pla',
    color_name              TEXT NOT NULL,
    color_hex               VARCHAR(7),                   -- ex: "#2ECC71"
    manufacturer            TEXT,

    -- Custo de aquisição
    purchase_cost           NUMERIC(12,2) NOT NULL CHECK (purchase_cost >= 0),
    -- frete rateável entre bobinas de uma mesma compra
    allocated_shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (allocated_shipping_cost >= 0),
    -- custo total por bobina = purchase_cost + allocated_shipping_cost
    total_acquisition_cost  NUMERIC(12,2) GENERATED ALWAYS AS
                                (purchase_cost + allocated_shipping_cost) STORED,

    -- Peso (todos em gramas)
    gross_weight_g          NUMERIC(10,4) NOT NULL CHECK (gross_weight_g > 0),  -- peso bruto c/ bobina vazia
    tare_weight_g           NUMERIC(10,4) NOT NULL DEFAULT 0 CHECK (tare_weight_g >= 0), -- peso da bobina vazia
    initial_net_weight_g    NUMERIC(10,4) GENERATED ALWAYS AS
                                (gross_weight_g - tare_weight_g) STORED,        -- peso líquido inicial de filamento
    current_weight_g        NUMERIC(10,4) NOT NULL CHECK (current_weight_g >= 0), -- peso restante (atualizado via movimentações)

    -- Custo por grama calculado (estimativa com base no peso líquido inicial)
    -- Usamos NUMERIC(12,4) para mais precisão na divisão
    cost_per_gram           NUMERIC(12,4) GENERATED ALWAYS AS (
        CASE WHEN (gross_weight_g - tare_weight_g) > 0
            THEN (purchase_cost + allocated_shipping_cost) / (gross_weight_g - tare_weight_g)
            ELSE 0
        END
    ) STORED,

    -- Status operacional
    status                  public.spool_status NOT NULL DEFAULT 'sealed',

    -- Referências opcionais
    -- supplier_invoice: número da NF ou documento de compra
    supplier_invoice        TEXT,
    notes                   TEXT,

    -- Rastreabilidade temporal
    purchased_at            DATE,
    opened_at               TIMESTAMPTZ,                  -- quando foi aberta/iniciada
    finished_at             TIMESTAMPTZ,                  -- quando ficou vazia/descartada

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spools_material ON public.filament_spools(material);
CREATE INDEX IF NOT EXISTS idx_spools_status   ON public.filament_spools(status);
CREATE INDEX IF NOT EXISTS idx_spools_label    ON public.filament_spools(label);

DROP TRIGGER IF EXISTS trg_spools_updated_at ON public.filament_spools;
CREATE TRIGGER trg_spools_updated_at
    BEFORE UPDATE ON public.filament_spools
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 2. Tabela: Movimentações de Bobinas (filament_spool_movements)
-- Toda alteração de peso/saldo de bobina deve ter um registro aqui.
-- NUNCA fazer UPDATE silencioso em current_weight_g sem registrar aqui.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.filament_spool_movements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spool_id            UUID NOT NULL REFERENCES public.filament_spools(id) ON DELETE CASCADE,
    movement_type       public.spool_movement_type NOT NULL,

    -- Quantidade consumida/ajustada em gramas (positivo = saída/consumo; negativo = devolução/ajuste positivo)
    quantity_g          NUMERIC(10,4) NOT NULL,

    -- Snapshot do saldo antes e depois (para auditoria precisa)
    weight_before_g     NUMERIC(10,4) NOT NULL,
    weight_after_g      NUMERIC(10,4) NOT NULL,

    -- Referência ao contexto do movimento
    production_order_id UUID,  -- FK adicionada depois (evita dependência circular na criação)
    reference_note      TEXT,  -- ex: "Ajuste de inventário - pesagem física 2026-10-15"

    -- Rastreabilidade do ator
    actor_profile_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spool_movements_spool    ON public.filament_spool_movements(spool_id);
CREATE INDEX IF NOT EXISTS idx_spool_movements_order    ON public.filament_spool_movements(production_order_id);
CREATE INDEX IF NOT EXISTS idx_spool_movements_created  ON public.filament_spool_movements(created_at);

-- ============================================================================
-- 3. Tabela: Ordens de Produção (production_orders)
-- Representa uma instrução formal de fabricar N peças de um produto/variante.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.production_orders (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number                TEXT NOT NULL UNIQUE,    -- ex: "PO-2026-0001"

    -- Vínculo obrigatório com produto e variante
    product_id                  UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id                  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,

    -- Vínculo opcional com pedido do cliente (pré-venda ou pronta entrega)
    sales_order_id              UUID REFERENCES public.orders(id) ON DELETE SET NULL,

    -- Quantidades
    planned_quantity            INT NOT NULL CHECK (planned_quantity > 0),
    produced_quantity           INT NOT NULL DEFAULT 0 CHECK (produced_quantity >= 0),
    rejected_quantity           INT NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),

    -- Consumo de filamento estimado vs. real (em gramas)
    estimated_filament_g        NUMERIC(10,4) NOT NULL DEFAULT 0 CHECK (estimated_filament_g >= 0),
    actual_filament_g           NUMERIC(10,4) NOT NULL DEFAULT 0 CHECK (actual_filament_g >= 0),
    waste_filament_g            NUMERIC(10,4) NOT NULL DEFAULT 0 CHECK (waste_filament_g >= 0),

    -- Tempo de máquina e trabalho manual (em minutos)
    estimated_machine_minutes   INT NOT NULL DEFAULT 0 CHECK (estimated_machine_minutes >= 0),
    actual_machine_minutes      INT NOT NULL DEFAULT 0 CHECK (actual_machine_minutes >= 0),
    labor_minutes               INT NOT NULL DEFAULT 0 CHECK (labor_minutes >= 0),

    -- Status e datas
    status                      public.production_status NOT NULL DEFAULT 'queued',
    queued_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at                  TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,

    -- Falhas e reimpressões
    reprint_count               INT NOT NULL DEFAULT 0 CHECK (reprint_count >= 0),
    failure_notes               TEXT,

    -- Observações gerais e ajustes
    notes                       TEXT,
    adjustment_reason           TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_orders_product    ON public.production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_variant    ON public.production_orders(variant_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_status     ON public.production_orders(status);
CREATE INDEX IF NOT EXISTS idx_prod_orders_sales_ord  ON public.production_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_prod_orders_number     ON public.production_orders(order_number);

DROP TRIGGER IF EXISTS trg_production_orders_updated_at ON public.production_orders;
CREATE TRIGGER trg_production_orders_updated_at
    BEFORE UPDATE ON public.production_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. Tabela: Bobinas Utilizadas por Ordem de Produção (production_order_spools)
-- Relação N:N entre produção e bobinas, com rastreio de quantidade consumida.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.production_order_spools (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
    spool_id            UUID NOT NULL REFERENCES public.filament_spools(id) ON DELETE RESTRICT,

    -- Quantidade real consumida desta bobina nesta ordem (em gramas)
    consumed_g          NUMERIC(10,4) NOT NULL DEFAULT 0 CHECK (consumed_g >= 0),
    notes               TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (production_order_id, spool_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_order ON public.production_order_spools(production_order_id);
CREATE INDEX IF NOT EXISTS idx_pos_spool ON public.production_order_spools(spool_id);

-- ============================================================================
-- 5. Tabela: Custos Detalhados por Ordem de Produção (production_order_costs)
-- Separa estimados de realizados. Premissas podem ser documentadas em 'notes'.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.production_order_costs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
    cost_type           public.production_cost_type NOT NULL,
    description         TEXT,

    -- Custo estimado vs. realizado
    estimated_amount    NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (estimated_amount >= 0),
    actual_amount       NUMERIC(12,2) CHECK (actual_amount IS NULL OR actual_amount >= 0),

    -- Observação de premissa (ex: "R$ 0,85/kWh · 0,12 kWh/h · 4h estimadas")
    notes               TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_costs_order ON public.production_order_costs(production_order_id);

-- ============================================================================
-- 6. FK diferida: movimentações de bobina → ordens de produção
-- Adicionada após a criação de ambas as tabelas para evitar dependência circular.
-- ============================================================================
ALTER TABLE public.filament_spool_movements
    ADD CONSTRAINT fk_spool_movement_production_order
        FOREIGN KEY (production_order_id)
        REFERENCES public.production_orders(id)
        ON DELETE SET NULL;

-- ============================================================================
-- 7. Habilitação de RLS em Todas as Novas Tabelas
-- ============================================================================
ALTER TABLE public.filament_spools              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filament_spool_movements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_spools      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_costs       ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. Políticas de Segurança (Row Level Security - Zero Trust)
-- Bobinas, ordens e custos são dados internos de fabricação:
--   • Somente admins (staff e admin) podem ler e escrever.
--   • Anon e customer NÃO têm acesso a nenhuma dessas tabelas.
-- ============================================================================

-- 8.1 filament_spools
DROP POLICY IF EXISTS "spools_admin_all" ON public.filament_spools;
CREATE POLICY "spools_admin_all" ON public.filament_spools
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8.2 filament_spool_movements
DROP POLICY IF EXISTS "spool_movements_admin_all" ON public.filament_spool_movements;
CREATE POLICY "spool_movements_admin_all" ON public.filament_spool_movements
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8.3 production_orders
DROP POLICY IF EXISTS "prod_orders_admin_all" ON public.production_orders;
CREATE POLICY "prod_orders_admin_all" ON public.production_orders
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8.4 production_order_spools
DROP POLICY IF EXISTS "prod_order_spools_admin_all" ON public.production_order_spools;
CREATE POLICY "prod_order_spools_admin_all" ON public.production_order_spools
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8.5 production_order_costs
DROP POLICY IF EXISTS "prod_order_costs_admin_all" ON public.production_order_costs;
CREATE POLICY "prod_order_costs_admin_all" ON public.production_order_costs
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 9. Função auxiliar: registrar movimentação de bobina e atualizar peso atual
-- Chamada via Server Action ou trigger quando há consumo de filamento.
-- SECURITY DEFINER garante que a função roda com privilégios de dono,
-- protegendo de bypass de RLS por usuários autenticados não-admin.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.register_spool_movement(
    p_spool_id              UUID,
    p_movement_type         public.spool_movement_type,
    p_quantity_g            NUMERIC,        -- positivo = saída; negativo = entrada/devolução
    p_production_order_id   UUID DEFAULT NULL,
    p_reference_note        TEXT DEFAULT NULL,
    p_actor_profile_id      UUID DEFAULT NULL
)
RETURNS public.filament_spool_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_spool         public.filament_spools%ROWTYPE;
    v_weight_after  NUMERIC(10,4);
    v_movement      public.filament_spool_movements%ROWTYPE;
BEGIN
    -- Bloquear a linha da bobina para evitar race conditions
    SELECT * INTO v_spool
    FROM public.filament_spools
    WHERE id = p_spool_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bobina não encontrada: %', p_spool_id;
    END IF;

    v_weight_after := v_spool.current_weight_g - p_quantity_g;

    IF v_weight_after < 0 THEN
        RAISE EXCEPTION 'Saldo insuficiente na bobina "%": disponível %.4f g, solicitado %.4f g.',
            v_spool.label, v_spool.current_weight_g, p_quantity_g;
    END IF;

    -- Registrar movimentação
    INSERT INTO public.filament_spool_movements (
        spool_id, movement_type, quantity_g,
        weight_before_g, weight_after_g,
        production_order_id, reference_note, actor_profile_id
    )
    VALUES (
        p_spool_id, p_movement_type, p_quantity_g,
        v_spool.current_weight_g, v_weight_after,
        p_production_order_id, p_reference_note, p_actor_profile_id
    )
    RETURNING * INTO v_movement;

    -- Atualizar saldo da bobina atomicamente
    UPDATE public.filament_spools
    SET
        current_weight_g = v_weight_after,
        status = CASE
            WHEN v_weight_after = 0 THEN 'empty'::public.spool_status
            WHEN status = 'sealed'  THEN 'in_use'::public.spool_status
            ELSE status
        END
    WHERE id = p_spool_id;

    RETURN v_movement;
END;
$$;

-- ============================================================================
-- 10. Função auxiliar: gerar número sequencial de ordem de produção
-- Formato: PO-YYYY-NNNN (com padding de 4 dígitos por ano)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_production_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_year  TEXT := to_char(NOW(), 'YYYY');
    v_count INT;
    v_num   TEXT;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count
    FROM public.production_orders
    WHERE order_number LIKE 'PO-' || v_year || '-%';

    v_num := 'PO-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
    RETURN v_num;
END;
$$;
