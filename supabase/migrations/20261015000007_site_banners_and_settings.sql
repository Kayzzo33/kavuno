-- ============================================================================
-- 3D COMMERCE - MIGRATION 07: SITE SETTINGS & HERO BANNERS
-- Version: 20261015000007
-- Description: Tabela de banners reais da loja e configurações gerais
--              (modo de exibição hero: banner ou produtos hot, announcement bar, etc)
-- ============================================================================

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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela chave-valor para configurações da loja (hero_mode, announcement_bar_text, etc)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurações iniciais padrão
INSERT INTO public.site_settings (key, value)
VALUES
    ('hero_mode', '"hot_products"'::jsonb),
    ('announcement_text', '"🚚 Frete Grátis para todo Brasil acima de R$ 199 • 🛡️ Garantia de Acabamento 3D • ⚡ Despacho Rápido"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Habilitação de RLS
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
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
