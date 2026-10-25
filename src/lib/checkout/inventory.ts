import { createAdminClient } from "@/lib/supabase/admin";

export interface StockReservationResult {
  success: boolean;
  unavailableVariantId?: string;
  errorMessage?: string;
}

/**
 * Valida se os itens do carrinho com modalidade 'in_stock' possuem
 * quantidade física disponível e reserva as unidades na transação.
 * Para 'pre_order', a regra não deduz estoque físico acabado, registrando demanda futura.
 */
export async function reserveStockForOrder(
  items: Array<{ variantId: string; quantity: number; commercialMode: string }>,
  orderId: string
): Promise<StockReservationResult> {
  const inStockItems = items.filter((i) => i.commercialMode === "in_stock");
  if (inStockItems.length === 0) {
    return { success: true };
  }

  const supabaseAdmin = createAdminClient();

  for (const item of inStockItems) {
    const { data: invItem } = await (supabaseAdmin.from("inventory_items") as any)
      .select("id, quantity_available, quantity_reserved")
      .eq("variant_id", item.variantId)
      .maybeSingle();

    // Se o item de inventário não existir ainda no banco, cria com saldo inicial 0
    if (!invItem) {
      await (supabaseAdmin.from("inventory_items") as any).insert({
        variant_id: item.variantId,
        quantity_available: 0,
        quantity_reserved: item.quantity,
      });

      // Registra movimentação de reserva
      await (supabaseAdmin.from("inventory_movements") as any).insert({
        variant_id: item.variantId,
        movement_type: "sale_out",
        quantity: item.quantity,
        reference_id: orderId,
        notes: `Reserva para o pedido ${orderId}`,
      });
      continue;
    }

    // Se houver controle estrito e saldo insuficiente
    if (invItem.quantity_available < item.quantity) {
      // Caso haja saldo disponível, reserva o que tiver ou reporta
      // Na fundação, se não houver saldo suficiente registrado:
      return {
        success: false,
        unavailableVariantId: item.variantId,
        errorMessage: "Quantidade solicitada excede o estoque físico disponível.",
      };
    }

    // Atualiza o saldo reservando
    await (supabaseAdmin.from("inventory_items") as any)
      .update({
        quantity_available: invItem.quantity_available - item.quantity,
        quantity_reserved: invItem.quantity_reserved + item.quantity,
      })
      .eq("id", invItem.id);

    await (supabaseAdmin.from("inventory_movements") as any).insert({
      variant_id: item.variantId,
      movement_type: "sale_out",
      quantity: item.quantity,
      reference_id: orderId,
      notes: `Reserva para o pedido ${orderId}`,
    });
  }

  return { success: true };
}

/**
 * Libera a reserva de estoque caso o pedido seja cancelado ou expire
 */
export async function releaseStockForOrder(
  items: Array<{ variantId: string; quantity: number; commercialMode: string }>,
  orderId: string
) {
  const inStockItems = items.filter((i) => i.commercialMode === "in_stock");
  if (inStockItems.length === 0) return;

  const supabaseAdmin = createAdminClient();

  for (const item of inStockItems) {
    const { data: invItem } = await (supabaseAdmin.from("inventory_items") as any)
      .select("id, quantity_available, quantity_reserved")
      .eq("variant_id", item.variantId)
      .maybeSingle();

    if (invItem && invItem.quantity_reserved >= item.quantity) {
      await (supabaseAdmin.from("inventory_items") as any)
        .update({
          quantity_available: invItem.quantity_available + item.quantity,
          quantity_reserved: invItem.quantity_reserved - item.quantity,
        })
        .eq("id", invItem.id);

      await (supabaseAdmin.from("inventory_movements") as any).insert({
        variant_id: item.variantId,
        movement_type: "adjustment_in",
        quantity: item.quantity,
        reference_id: orderId,
        notes: `Cancelamento de reserva do pedido ${orderId}`,
      });
    }
  }
}
