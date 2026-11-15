-- ============================================================================
-- 3D COMMERCE - MIGRATION 08: SITE BANNERS POSITION (HERO / FOOTER)
-- Version: 20261015000008
-- Description: Adiciona coluna position ('hero', 'footer') na tabela site_banners
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'site_banners'
          AND column_name = 'position'
    ) THEN
        ALTER TABLE public.site_banners ADD COLUMN position TEXT NOT NULL DEFAULT 'hero';
    END IF;
END $$;
