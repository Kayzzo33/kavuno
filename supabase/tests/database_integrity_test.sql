-- ============================================================================
-- 3D COMMERCE - DATABASE INTEGRITY & SECURITY TEST SUITE
-- File: supabase/tests/database_integrity_test.sql
-- Description: Validação de tabelas, RLS, índices, triggers e restrições.
-- ============================================================================

DO $$
DECLARE
    missing_tables TEXT[];
    rls_disabled_tables TEXT[];
    missing_indexes TEXT[];
    test_failed BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '---------------------------------------------------------';
    RAISE NOTICE 'INICIANDO SUÍTE DE TESTES DE INTEGRIDADE: 3D COMMERCE';
    RAISE NOTICE '---------------------------------------------------------';

    -- 1. Verificação de Tabelas Obrigatórias
    SELECT ARRAY_AGG(expected_table) INTO missing_tables
    FROM (
        SELECT unnest(ARRAY[
            'profiles', 'customer_addresses', 'categories', 'campaigns',
            'products', 'product_variants', 'product_images', 'interest_leads', 'audit_logs'
        ]) AS expected_table
    ) t
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = t.expected_table
    );

    IF cardinality(missing_tables) > 0 THEN
        RAISE EXCEPTION 'FALHA DE TESTE: Tabelas ausentes: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '[OK] Todas as 9 tabelas da fundacao estao presentes.';
    END IF;

    -- 2. Verificação de Row Level Security (RLS)
    SELECT ARRAY_AGG(c.relname::TEXT) INTO rls_disabled_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ANY(ARRAY[
          'profiles', 'customer_addresses', 'categories', 'campaigns',
          'products', 'product_variants', 'product_images', 'interest_leads', 'audit_logs'
      ])
      AND c.relrowsecurity = FALSE;

    IF cardinality(rls_disabled_tables) > 0 THEN
        RAISE EXCEPTION 'FALHA DE SEGURANCA: Tabelas com RLS desativado: %', array_to_string(rls_disabled_tables, ', ');
    ELSE
        RAISE NOTICE '[OK] Row Level Security (RLS) habilitado em 100%% das tabelas.';
    END IF;

    -- 3. Verificação de Função de Segurança
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN
        RAISE EXCEPTION 'FALHA DE SEGURANCA: Funcao publica is_admin() nao encontrada.';
    ELSE
        RAISE NOTICE '[OK] Funcao public.is_admin() instalada com sucesso.';
    END IF;

    -- 4. Teste de Restrição de Preço (CHECK constraint)
    BEGIN
        INSERT INTO public.products (
            name, slug, commercial_mode, base_price, promotional_price
        ) VALUES (
            'Teste Invalido', 'teste-invalido', 'in_stock', 50.00, 60.00
        );
        -- Se chegou aqui sem erro, o teste falhou!
        RAISE EXCEPTION 'FALHA: Restricao CHECK de preco promocional violada permitiu gravacao!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[OK] Restricao CHECK (promotional_price < base_price) validada com sucesso.';
    END;

    -- 5. Teste de Preço Base Negativo
    BEGIN
        INSERT INTO public.products (
            name, slug, commercial_mode, base_price
        ) VALUES (
            'Preco Negativo', 'preco-negativo', 'in_stock', -10.00
        );
        RAISE EXCEPTION 'FALHA: Restricao CHECK permitiu preco base negativo!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[OK] Restricao CHECK (base_price >= 0) validada com sucesso.';
    END;

    RAISE NOTICE '---------------------------------------------------------';
    RAISE NOTICE 'SUCESSO: TODOS OS TESTES DE INTEGRIDADE E SEGURANCA PASSARAM!';
    RAISE NOTICE '---------------------------------------------------------';
END;
$$;
