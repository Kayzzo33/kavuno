-- ============================================================================
-- 3D COMMERCE - MIGRATION 03: TRANSACTIONAL COMMERCE & PAYMENTS (B.5)
-- Version: 20261015000003
-- Description: Cupons, Pedidos, Itens com Snapshot Imutável, Pagamentos,
--              Webhook Logs e Controle Transacional de Estoque / Reservas.
-- ============================================================================

-- 1. Tabela: Cupons de Desconto (coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
    discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value >= 0),
    min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(12,2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
    max_uses INT CHECK (max_uses IS NULL OR max_uses > 0),
    current_uses INT NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);

-- 2. Tabela: Controle Físico de Estoque por Variante (inventory_items)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL UNIQUE REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    min_safety_stock INT NOT NULL DEFAULT 0 CHECK (min_safety_stock >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_variant ON public.inventory_items(variant_id);

-- 3. Tabela: Histórico de Movimentações de Estoque (inventory_movements)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type public.inventory_movement_type NOT NULL,
    quantity INT NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON public.inventory_movements(variant_id);

-- 4. Tabela: Pedidos (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    idempotency_key TEXT UNIQUE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guest_email TEXT,
    guest_name TEXT,
    guest_phone VARCHAR(20),
    status public.order_status NOT NULL DEFAULT 'pending_payment',
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    coupon_code_snapshot TEXT,
    carrier_name TEXT,
    delivery_service TEXT,
    estimated_delivery_days INT,
    tracking_code TEXT,
    shipping_street TEXT NOT NULL,
    shipping_number VARCHAR(20) NOT NULL,
    shipping_complement TEXT,
    shipping_neighborhood TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_state VARCHAR(2) NOT NULL,
    shipping_postal_code VARCHAR(9) NOT NULL,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_profile ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Tabela: Itens de Pedido com Snapshot Imutável (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    commercial_mode public.commercial_mode NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    estimated_production_days INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);

-- 6. Tabela: Pagamentos (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method public.payment_method NOT NULL,
    status public.payment_status NOT NULL DEFAULT 'pending',
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    gateway TEXT NOT NULL DEFAULT 'mercado_pago',
    external_payment_id TEXT UNIQUE,
    idempotency_key TEXT UNIQUE,
    qr_code TEXT,
    qr_code_base64 TEXT,
    ticket_url TEXT,
    installments INT NOT NULL DEFAULT 1,
    payment_response JSONB,
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Tabela: Log de Webhooks de Pagamento (payment_webhook_logs)
CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway TEXT NOT NULL DEFAULT 'mercado_pago',
    event_type TEXT NOT NULL,
    external_event_id TEXT,
    signature_header TEXT,
    payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_gateway ON public.payment_webhook_logs(gateway);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_id ON public.payment_webhook_logs(external_event_id);

-- 8. Tabela: Histórico de Alterações de Pedido (order_history)
CREATE TABLE IF NOT EXISTS public.order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status public.order_status,
    new_status public.order_status NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_history(order_id);

-- 9. Habilitação de RLS em Todas as Novas Tabelas
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de Segurança (Row Level Security - Zero Trust)

-- 10.1. Coupons
DROP POLICY IF EXISTS "coupons_select_active" ON public.coupons;
CREATE POLICY "coupons_select_active" ON public.coupons
    FOR SELECT TO anon, authenticated
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;
CREATE POLICY "coupons_admin_all" ON public.coupons
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.2. Inventory Items
DROP POLICY IF EXISTS "inventory_select_all" ON public.inventory_items;
CREATE POLICY "inventory_select_all" ON public.inventory_items
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "inventory_admin_all" ON public.inventory_items;
CREATE POLICY "inventory_admin_all" ON public.inventory_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.3. Inventory Movements
DROP POLICY IF EXISTS "movements_admin_all" ON public.inventory_movements;
CREATE POLICY "movements_admin_all" ON public.inventory_movements
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.4. Orders
-- O cliente vê seus próprios pedidos; admin vê tudo; anônimo pode consultar pedido recém-criado por ID se tiver a referência da sessão
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own" ON public.orders
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_allowed" ON public.orders;
CREATE POLICY "orders_insert_allowed" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.5. Order Items
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.profile_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

-- 10.6. Payments
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
            AND (o.profile_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
CREATE POLICY "payments_update_admin" ON public.payments
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.7. Payment Webhook Logs
DROP POLICY IF EXISTS "webhook_logs_admin" ON public.payment_webhook_logs;
CREATE POLICY "webhook_logs_admin" ON public.payment_webhook_logs
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10.8. Order History
DROP POLICY IF EXISTS "order_history_select" ON public.order_history;
CREATE POLICY "order_history_select" ON public.order_history
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_history.order_id
            AND (o.profile_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "order_history_insert" ON public.order_history;
CREATE POLICY "order_history_insert" ON public.order_history
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);
