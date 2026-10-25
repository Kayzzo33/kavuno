-- ============================================================================
-- 3D COMMERCE - SEED DATA: FOUNDATION DEMO
-- File: supabase/seeds/01_foundation_seed.sql
-- Description: Dados iniciais para categorias, campanhas e produtos de teste.
-- ============================================================================

-- 1. Categorias Iniciais
INSERT INTO public.categories (id, name, slug, description, display_order, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Decoração & Design', 'decoracao-design', 'Peças decorativas com geometria moderna e acabamentos exclusivos.', 1, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'Setup & Produtividade', 'setup-produtividade', 'Suportes para fones, organizadores de cabos e acessórios para mesa.', 2, TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'Prototipagem & Engenharia', 'prototipagem-engenharia', 'Peças funcionais em filamentos de alta resistência mecânica (PETG/ABS).', 3, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2. Campanha de Validação (Reserva Gratuita de Interesse)
-- O proprietário ainda não comprou a impressora, então valida a demanda primeiro
INSERT INTO public.campaigns (
    id, title, slug, description, commercial_mode, status,
    target_min_units, max_units_limit, current_units_pledged,
    starts_at, ends_at, estimated_production_days
)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Campanha Piloto: Suporte Articulado Gamer para Fone e Controle',
    'campanha-suporte-articulado-gamer',
    'Demonstre seu interesse sem custo! Se alcançarmos 30 interessados, iniciaremos a produção imediata com lote especial.',
    'interest_lead',
    'active',
    30,
    100,
    0,
    NOW(),
    NOW() + INTERVAL '30 days',
    10
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Produtos em Catálogo
-- Produto 1: Em Pré-venda / Validação de Interesse
INSERT INTO public.products (
    id, category_id, campaign_id, name, slug, short_description, full_description,
    commercial_mode, base_price, promotional_price, is_active, is_featured,
    meta_title, meta_description
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Suporte Articulado Gamer 2 em 1 para Headset e Controle',
    'suporte-articulado-gamer-2-em-1',
    'Suporte modular impresso em 3D de alta resistência com canaletas para cabos.',
    'Desenvolvido para organizar seu setup com sofisticação. Fabricado com preenchimento reforçado de 30% em padrão Gyroid para suportar headsets pesados e controles de console.',
    'interest_lead',
    89.90,
    74.90,
    TRUE,
    TRUE,
    'Suporte Gamer 2 em 1 Impresso em 3D | 3D Commerce',
    'Reserve seu suporte gamer impresso em 3D de alta qualidade com acabamento impecável.'
)
ON CONFLICT (slug) DO NOTHING;

-- Variantes do Produto 1
INSERT INTO public.product_variants (
    id, product_id, sku, variant_name, filament_material,
    color_name, color_hex, price_adjustment,
    estimated_filament_weight_g, estimated_print_time_minutes, is_active
)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'SUP-GMR-BLK-PLA',
        'Preto Fosco - PLA Premium',
        'pla',
        'Preto Fosco',
        '#1A1A1A',
        0.00,
        145.00,
        240,
        TRUE
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000001',
        'SUP-GMR-WHT-PETG',
        'Branco Puro - PETG Resistente',
        'petg',
        'Branco Neve',
        '#F5F5F5',
        10.00,
        155.00,
        260,
        TRUE
    )
ON CONFLICT (sku) DO NOTHING;
