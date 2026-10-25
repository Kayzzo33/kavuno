"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAndApplyCoupon } from "@/lib/checkout/coupons";
import { getShippingProvider } from "@/lib/shipping/provider";
import { reserveStockForOrder } from "@/lib/checkout/inventory";
import { mercadoPago } from "@/lib/payments/mercadopago";

export interface CheckoutItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CheckoutAddressInput {
  recipientName: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface CheckoutGuestInput {
  fullName: string;
  email: string;
  phone?: string;
  cpf?: string;
}

export interface CheckoutActionInput {
  idempotencyKey: string;
  items: CheckoutItemInput[];
  address: CheckoutAddressInput;
  guest?: CheckoutGuestInput;
  couponCode?: string;
  shippingServiceId: string;
  paymentMethod: "pix" | "credit_card";
}

export interface CheckoutActionResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  qrCode?: string;
  ticketUrl?: string;
  error?: string;
}

export async function processCheckoutAction(
  input: CheckoutActionInput
): Promise<CheckoutActionResult> {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "O carrinho está vazio." };
    }

    if (!input.address?.street || !input.address?.number || !input.address?.postalCode) {
      return { success: false, error: "Endereço de entrega incompleto." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Se for visitante sem login, exige dados de contato
    if (!user && (!input.guest?.email || !input.guest?.fullName)) {
      return { success: false, error: "Para comprar como visitante, informe nome e e-mail." };
    }

    const supabaseAdmin = createAdminClient();

    // 1. Checagem de Idempotência: Impede pedidos duplicados
    if (input.idempotencyKey) {
      const { data: existingOrder } = await (supabaseAdmin.from("orders") as any)
        .select("id, order_number, total_amount, status")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();

      if (existingOrder) {
        // Busca pagamento já gerado para retornar dados de cobrança
        const { data: payment } = await (supabaseAdmin.from("payments") as any)
          .select("qr_code, ticket_url")
          .eq("order_id", existingOrder.id)
          .maybeSingle();

        return {
          success: true,
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          totalAmount: Number(existingOrder.total_amount),
          qrCode: payment?.qr_code,
          ticketUrl: payment?.ticket_url,
        };
      }
    }

    // 2. Consulta autoritativa dos produtos e variantes no banco
    const variantIds = input.items.map((i) => i.variantId);
    const { data: dbVariants, error: varError } = await (supabaseAdmin.from("product_variants") as any)
      .select("id, product_id, sku, variant_name, color_name, price_adjustment, estimated_filament_weight_g, product:products(id, name, slug, base_price, promotional_price, commercial_mode, is_active, campaign_id)")
      .in("id", variantIds);

    if (varError || !dbVariants || dbVariants.length === 0) {
      return { success: false, error: "Falha ao validar catálogo para os itens do pedido." };
    }

    // Mapeia variantes e calcula subtotal e peso
    let authoritativeSubtotal = 0;
    let totalWeightG = 0;
    const validatedItems: any[] = [];

    for (const itemInput of input.items) {
      const v = dbVariants.find((dbV: any) => dbV.id === itemInput.variantId);
      if (!v || !v.product || !v.product.is_active) {
        return { success: false, error: "Um ou mais produtos não estão mais disponíveis no catálogo." };
      }

      // Regra de Domínio: 'interest_lead' NÃO pode gerar pedido transacional
      if (v.product.commercial_mode === "interest_lead") {
        return { success: false, error: "Produtos em validação de demanda não podem ser adquiridos via checkout." };
      }

      const priceAdj = Number(v.price_adjustment || 0);
      const basePrice = Number(v.product.promotional_price && v.product.promotional_price > 0 ? v.product.promotional_price : v.product.base_price);
      const unitPrice = basePrice + priceAdj;
      const itemTotal = unitPrice * itemInput.quantity;

      authoritativeSubtotal += itemTotal;
      totalWeightG += Number(v.estimated_filament_weight_g || 100) * itemInput.quantity;

      validatedItems.push({
        productId: v.product.id,
        variantId: v.id,
        commercialMode: v.product.commercial_mode,
        productNameSnapshot: v.product.name,
        variantNameSnapshot: `${v.variant_name} (${v.color_name})`,
        skuSnapshot: v.sku,
        unitPrice,
        quantity: itemInput.quantity,
        totalPrice: itemTotal,
        campaignId: v.product.campaign_id,
      });
    }

    // 3. Cálculo autoritativo do frete
    const shippingProvider = getShippingProvider();
    const shippingQuotes = await shippingProvider.calculateShipping({
      destinationCep: input.address.postalCode,
      itemsCount: input.items.reduce((acc, i) => acc + i.quantity, 0),
      totalWeightG,
      totalOrderAmount: authoritativeSubtotal,
    });

    const selectedShipping = shippingQuotes.find((s) => s.serviceId === input.shippingServiceId) || shippingQuotes[0];
    const authoritativeShippingCost = selectedShipping?.cost ?? 20.0;

    // 4. Validação e cálculo autoritativo de Cupom de Desconto
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    let couponCodeSnapshot: string | null = null;

    if (input.couponCode) {
      const couponRes = await validateAndApplyCoupon(
        input.couponCode,
        authoritativeSubtotal,
        authoritativeShippingCost
      );
      if (couponRes.valid) {
        discountAmount = couponRes.discountAmount;
        appliedCouponId = couponRes.couponId || null;
        couponCodeSnapshot = couponRes.code || null;
      }
    }

    const authoritativeTotal = Math.max(0, authoritativeSubtotal + authoritativeShippingCost - discountAmount);

    // 5. Geração do número amigável do pedido
    const orderNumber = `3D-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 6. Criação do Pedido (Orders)
    const { data: newOrder, error: orderError } = await (supabaseAdmin.from("orders") as any)
      .insert({
        order_number: orderNumber,
        idempotency_key: input.idempotencyKey,
        profile_id: user?.id || null,
        guest_email: user ? null : input.guest?.email,
        guest_name: user ? null : input.guest?.fullName,
        guest_phone: user ? null : input.guest?.phone,
        status: "pending_payment",
        subtotal: authoritativeSubtotal,
        shipping_cost: authoritativeShippingCost,
        discount_amount: discountAmount,
        total_amount: authoritativeTotal,
        coupon_id: appliedCouponId,
        coupon_code_snapshot: couponCodeSnapshot,
        carrier_name: selectedShipping?.carrierName || "Correios",
        delivery_service: selectedShipping?.serviceName || "PAC",
        estimated_delivery_days: selectedShipping?.deliveryDays || 5,
        shipping_street: input.address.street,
        shipping_number: input.address.number,
        shipping_complement: input.address.complement || null,
        shipping_neighborhood: input.address.neighborhood,
        shipping_city: input.address.city,
        shipping_state: input.address.state.toUpperCase(),
        shipping_postal_code: input.address.postalCode,
      })
      .select("id")
      .single();

    if (orderError || !newOrder) {
      return { success: false, error: `Falha ao registrar pedido: ${orderError?.message}` };
    }

    const orderId = newOrder.id;

    // 7. Inserção dos itens do pedido com snapshot imutável (order_items)
    const orderItemsRows = validatedItems.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId,
      commercial_mode: item.commercialMode,
      product_name_snapshot: item.productNameSnapshot,
      variant_name_snapshot: item.variantNameSnapshot,
      sku_snapshot: item.skuSnapshot,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      total_price: item.totalPrice,
      campaign_id: item.campaignId,
    }));

    await (supabaseAdmin.from("order_items") as any).insert(orderItemsRows);

    // 8. Reserva de estoque transacional
    await reserveStockForOrder(
      validatedItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity, commercialMode: i.commercialMode })),
      orderId
    );

    // 9. Integração com Mercado Pago (Criação de intenção de pagamento)
    const customerName = user ? (user.user_metadata?.full_name || "Cliente") : (input.guest?.fullName || "Cliente");
    const customerEmail = user ? (user.email || "cliente@3dcommerce.local") : (input.guest?.email || "cliente@3dcommerce.local");

    const mpResult = await mercadoPago.createPayment({
      orderId,
      orderNumber,
      amount: authoritativeTotal,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: input.guest?.phone,
      },
      paymentMethod: input.paymentMethod,
      idempotencyKey: `${input.idempotencyKey}_pay`,
    });

    // 10. Persistência do Pagamento (Payments)
    await (supabaseAdmin.from("payments") as any).insert({
      order_id: orderId,
      payment_method: input.paymentMethod,
      status: mpResult.status,
      amount: authoritativeTotal,
      gateway: "mercado_pago",
      external_payment_id: mpResult.paymentId,
      idempotency_key: `${input.idempotencyKey}_pay`,
      qr_code: mpResult.qrCode || null,
      ticket_url: mpResult.ticketUrl || null,
    });

    // 12. Rastreamento Auditável de Analytics (order_created - Zero PII)
    try {
      await (supabaseAdmin.from("analytics_events") as any).insert({
        event_name: "order_created",
        session_id: "chk_" + Math.random().toString(36).substring(2, 10),
        entity_type: "order",
        entity_id: orderId,
        metadata: {
          order_number: orderNumber,
          total_amount: authoritativeTotal,
          payment_method: input.paymentMethod,
          items_count: validatedItems.length,
          coupon_applied: input.couponCode || null,
        },
      });
    } catch {
      // Silencioso para não interromper resposta do pedido
    }

    return {
      success: true,
      orderId,
      orderNumber,
      totalAmount: authoritativeTotal,
      qrCode: mpResult.qrCode,
      ticketUrl: mpResult.ticketUrl,
    };
  } catch (err: any) {
    console.error("Erro no processamento do checkout:", err);
    return { success: false, error: `Erro inesperado no servidor: ${err.message}` };
  }
}
