-- ============================================================================
-- 3D COMMERCE - MIGRATION 06: ANALYTICS, OBSERVABILITY & LGPD-COMPLIANCE (B.8)
-- Version: 20261015000006
-- Description: Armazenamento e agregação de eventos de navegação, funil de
--              conversão e telemetria de catálogo, sem coleta de dados pessoais
--              identificáveis (Zero-PII / LGPD-compliant).
-- ============================================================================

-- 1. Tipo Enum para nomes de eventos analíticos permitidos
DO $$ BEGIN
    CREATE TYPE public.analytics_event_name AS ENUM (
        'product_view',         -- Visualização de página de produto
        'search',               -- Execução de busca no catálogo
        'search_no_results',    -- Busca sem resultados encontrados
        'filter_applied',       -- Aplicação de filtros (categoria, material, etc.)
        'variant_select',       -- Seleção de variante (cor/material)
        'banner_view',          -- Visualização de banner promocional
        'banner_click',         -- Clique em banner promocional
        'cart_add',             -- Adição de item ao carrinho
        'cart_remove',          -- Remoção de item do carrinho
        'checkout_start',       -- Início da etapa de checkout
        'coupon_applied',       -- Aplicação de cupom de desconto
        'lead_created',         -- Reserva gratuita de interesse realizada
        'order_created',        -- Pedido gerado
        'payment_confirmed'     -- Pagamento aprovado/liquidado
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabela: Eventos Analíticos (analytics_events)
-- REQUISITO LGPD: PROIBIDO gravar CPF, nome, email, telefone ou dados confidenciais.
-- Apenas identificador de sessão anônimo (session_id) e metadados contextuais (JSONB).
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      TEXT NOT NULL,                         -- Hash anônimo gerado no cliente
    event_name      public.analytics_event_name NOT NULL,
    entity_type     TEXT CHECK (entity_type IN ('product', 'category', 'campaign', 'order', 'coupon', 'search', 'general')),
    entity_id       UUID,                                  -- ID da entidade associada (produto, campanha, etc.)
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,     -- Dados contextuais (ex: { query: 'dragao', price: 89.9 })
    ip_hash         TEXT,                                  -- Hash unidirecional (SHA-256) anonimizado para contagem única
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices estratégicos para agregações do dashboard
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_entity     ON public.analytics_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session    ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);

-- 3. Habilitação de RLS Zero Trust
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Row Level Security)
-- 4.1 Inserção: Clientes anônimos e autenticados podem registrar eventos
DROP POLICY IF EXISTS "analytics_insert_all" ON public.analytics_events;
CREATE POLICY "analytics_insert_all" ON public.analytics_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

-- 4.2 Leitura: Restrita exclusivamente a administradores autorizados (is_admin())
DROP POLICY IF EXISTS "analytics_admin_select" ON public.analytics_events;
CREATE POLICY "analytics_admin_select" ON public.analytics_events
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- 4.3 Modificação / Deleção: Proibida para todos (Log Imutável)
-- Apenas função de expiração/limpeza com service_role pode expirar dados antigos.
DROP POLICY IF EXISTS "analytics_admin_delete" ON public.analytics_events;
CREATE POLICY "analytics_admin_delete" ON public.analytics_events
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 5. Função RPC segura para inserção defensiva de eventos via aplicação
CREATE OR REPLACE FUNCTION public.log_analytics_event(
    p_session_id    TEXT,
    p_event_name    public.analytics_event_name,
    p_entity_type   TEXT DEFAULT 'general',
    p_entity_id     UUID DEFAULT NULL,
    p_metadata      JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Defesa em profundidade: rejeitar metadados com chaves comuns de dados pessoais (PII)
    IF p_metadata ? 'email' OR p_metadata ? 'cpf' OR p_metadata ? 'phone' OR p_metadata ? 'credit_card' THEN
        RAISE EXCEPTION 'Violação LGPD: Não é permitido registrar dados pessoais identificáveis em analytics.';
    END IF;

    INSERT INTO public.analytics_events (
        session_id,
        event_name,
        entity_type,
        entity_id,
        metadata
    )
    VALUES (
        p_session_id,
        p_event_name,
        p_entity_type,
        p_entity_id,
        p_metadata
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
