-- ============================================================================
-- 3D COMMERCE - MIGRATION 02: ROW LEVEL SECURITY & POLICIES
-- Version: 20261015000002
-- Description: Função de verificação de permissão, ativação de RLS e
--              políticas granulares de leitura e gravação.
-- ============================================================================

-- 1. Função de Verificação de Perfil de Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Habilitação de RLS em todas as tabelas da fundação
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Políticas para: public.profiles
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_own_or_admin" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 4. Políticas para: public.customer_addresses
-- ============================================================================
DROP POLICY IF EXISTS "addresses_select_own_or_admin" ON public.customer_addresses;
CREATE POLICY "addresses_select_own_or_admin" ON public.customer_addresses
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "addresses_insert_own_or_admin" ON public.customer_addresses;
CREATE POLICY "addresses_insert_own_or_admin" ON public.customer_addresses
    FOR INSERT TO authenticated
    WITH CHECK (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "addresses_update_own_or_admin" ON public.customer_addresses;
CREATE POLICY "addresses_update_own_or_admin" ON public.customer_addresses
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid() OR public.is_admin())
    WITH CHECK (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "addresses_delete_own_or_admin" ON public.customer_addresses;
CREATE POLICY "addresses_delete_own_or_admin" ON public.customer_addresses
    FOR DELETE TO authenticated
    USING (profile_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 5. Políticas para: public.categories
-- ============================================================================
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "categories_admin_all" ON public.categories;
CREATE POLICY "categories_admin_all" ON public.categories
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 6. Políticas para: public.campaigns
-- ============================================================================
DROP POLICY IF EXISTS "campaigns_select_public" ON public.campaigns;
CREATE POLICY "campaigns_select_public" ON public.campaigns
    FOR SELECT TO anon, authenticated
    USING (status = 'active' OR public.is_admin());

DROP POLICY IF EXISTS "campaigns_admin_all" ON public.campaigns;
CREATE POLICY "campaigns_admin_all" ON public.campaigns
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 7. Políticas para: public.products
-- ============================================================================
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all" ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 8. Políticas para: public.product_variants
-- ============================================================================
DROP POLICY IF EXISTS "variants_select_public" ON public.product_variants;
CREATE POLICY "variants_select_public" ON public.product_variants
    FOR SELECT TO anon, authenticated
    USING (
        is_active = TRUE 
        AND EXISTS (
            SELECT 1 FROM public.products p 
            WHERE p.id = product_variants.product_id 
            AND (p.is_active = TRUE OR public.is_admin())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "variants_admin_all" ON public.product_variants;
CREATE POLICY "variants_admin_all" ON public.product_variants
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 9. Políticas para: public.product_images
-- ============================================================================
DROP POLICY IF EXISTS "images_select_public" ON public.product_images;
CREATE POLICY "images_select_public" ON public.product_images
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p 
            WHERE p.id = product_images.product_id 
            AND (p.is_active = TRUE OR public.is_admin())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "images_admin_all" ON public.product_images;
CREATE POLICY "images_admin_all" ON public.product_images
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 10. Políticas para: public.interest_leads
-- ============================================================================
DROP POLICY IF EXISTS "interest_leads_insert_public" ON public.interest_leads;
CREATE POLICY "interest_leads_insert_public" ON public.interest_leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "interest_leads_admin_select" ON public.interest_leads;
CREATE POLICY "interest_leads_admin_select" ON public.interest_leads
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "interest_leads_admin_modify" ON public.interest_leads;
CREATE POLICY "interest_leads_admin_modify" ON public.interest_leads
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 11. Políticas para: public.audit_logs
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (actor_profile_id = auth.uid() OR public.is_admin());
-- Nota: UPDATE e DELETE não possuem política concedida, garantindo imutabilidade de logs.
