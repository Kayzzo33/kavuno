"use server";

// ============================================================================
// src/app/admin/fabrica/actions.ts
// Server Actions para o módulo de chão de fábrica (B.6).
// Toda ação é protegida por requireAdminSession() antes de qualquer mutação.
// ============================================================================

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/queries";
import {
  createSpool,
  updateSpool,
  adjustSpoolWeight,
  createProductionOrder,
  updateProductionOrderStatus,
  linkSpoolToOrder,
  type CreateSpoolInput,
  type CreateProductionOrderInput,
} from "@/lib/production/queries";
import type { ProductionStatus, SpoolStatus } from "@/types/database.types";

// ---------------------------------------------------------------------------
// AÇÕES DE BOBINAS
// ---------------------------------------------------------------------------

export async function createSpoolAction(formData: FormData) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const grossWeight = parseFloat(formData.get("gross_weight_g") as string);
  const tare = parseFloat(formData.get("tare_weight_g") as string) || 0;

  const input: CreateSpoolInput = {
    label: (formData.get("label") as string).trim(),
    material: formData.get("material") as CreateSpoolInput["material"],
    color_name: (formData.get("color_name") as string).trim(),
    color_hex: (formData.get("color_hex") as string) || undefined,
    manufacturer: (formData.get("manufacturer") as string) || undefined,
    purchase_cost: parseFloat(formData.get("purchase_cost") as string),
    allocated_shipping_cost:
      parseFloat(formData.get("allocated_shipping_cost") as string) || 0,
    gross_weight_g: grossWeight,
    tare_weight_g: tare,
    batch_number: (formData.get("batch_number") as string) || undefined,
    supplier_invoice: (formData.get("supplier_invoice") as string) || undefined,
    purchased_at: (formData.get("purchased_at") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  if (!input.label)
    return { error: "Identificação (label) da bobina é obrigatória." };
  if (!input.color_name)
    return { error: "Nome da cor é obrigatório." };
  if (isNaN(grossWeight) || grossWeight <= 0)
    return { error: "Peso bruto deve ser positivo." };
  if (isNaN(input.purchase_cost) || input.purchase_cost < 0)
    return { error: "Custo de aquisição inválido." };

  try {
    await createSpool(input);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin/fabrica/bobinas");
  redirect("/admin/fabrica/bobinas");
}

export async function updateSpoolAction(
  id: string,
  formData: FormData
) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const patch = {
    label: (formData.get("label") as string)?.trim() || undefined,
    color_name: (formData.get("color_name") as string)?.trim() || undefined,
    color_hex: (formData.get("color_hex") as string) || undefined,
    manufacturer: (formData.get("manufacturer") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
    status: (formData.get("status") as SpoolStatus) || undefined,
  };

  try {
    await updateSpool(id, patch);
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin/fabrica/bobinas");
  redirect("/admin/fabrica/bobinas");
}

export async function adjustSpoolWeightAction(
  spoolId: string,
  formData: FormData
) {
  const { isAdmin, user } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const quantityG = parseFloat(formData.get("quantity_g") as string);
  const movementType = formData.get("movement_type") as
    | "manual_adjustment"
    | "weigh_in";
  const referenceNote =
    (formData.get("reference_note") as string) || undefined;

  if (isNaN(quantityG))
    return { error: "Quantidade em gramas inválida." };

  try {
    await adjustSpoolWeight({
      spoolId,
      quantityG,
      movementType: movementType ?? "manual_adjustment",
      referenceNote,
      actorProfileId: user?.id,
    });
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/admin/fabrica/bobinas/${spoolId}`);
  redirect(`/admin/fabrica/bobinas/${spoolId}`);
}

// ---------------------------------------------------------------------------
// AÇÕES DE ORDENS DE PRODUÇÃO
// ---------------------------------------------------------------------------

export async function createProductionOrderAction(formData: FormData) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const plannedQty = parseInt(formData.get("planned_quantity") as string, 10);
  const input: CreateProductionOrderInput = {
    product_id: formData.get("product_id") as string,
    variant_id: formData.get("variant_id") as string,
    sales_order_id: (formData.get("sales_order_id") as string) || undefined,
    planned_quantity: plannedQty,
    estimated_filament_g:
      parseFloat(formData.get("estimated_filament_g") as string) || undefined,
    estimated_machine_minutes:
      parseInt(formData.get("estimated_machine_minutes") as string, 10) ||
      undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  if (!input.product_id || !input.variant_id)
    return { error: "Produto e variante são obrigatórios." };
  if (isNaN(plannedQty) || plannedQty <= 0)
    return { error: "Quantidade planejada deve ser positiva." };

  let orderId: string;
  try {
    const order = await createProductionOrder(input);
    orderId = order.id;
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin/fabrica/producao");
  redirect(`/admin/fabrica/producao/${orderId}`);
}

export async function updateProductionOrderStatusAction(
  orderId: string,
  formData: FormData
): Promise<void> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const status = formData.get("status") as ProductionStatus;
  if (!status) throw new Error("Status é obrigatório.");

  await updateProductionOrderStatus(orderId, status, {
    producedQuantity: parseInt(formData.get("produced_quantity") as string, 10) || undefined,
    rejectedQuantity: parseInt(formData.get("rejected_quantity") as string, 10) || undefined,
    actualFilamentG: parseFloat(formData.get("actual_filament_g") as string) || undefined,
    wasteFilamentG: parseFloat(formData.get("waste_filament_g") as string) || undefined,
    actualMachineMinutes: parseInt(formData.get("actual_machine_minutes") as string, 10) || undefined,
    laborMinutes: parseInt(formData.get("labor_minutes") as string, 10) || undefined,
    reprintCount: parseInt(formData.get("reprint_count") as string, 10) || undefined,
    failureNotes: (formData.get("failure_notes") as string) || undefined,
    adjustmentReason: (formData.get("adjustment_reason") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  });

  revalidatePath(`/admin/fabrica/producao/${orderId}`);
  redirect(`/admin/fabrica/producao/${orderId}`);
}

export async function linkSpoolToOrderAction(
  productionOrderId: string,
  formData: FormData
) {
  const { isAdmin, user } = await requireAdminSession();
  if (!isAdmin) throw new Error("Acesso negado.");

  const spoolId = formData.get("spool_id") as string;
  const consumedG = parseFloat(formData.get("consumed_g") as string);
  const notes = (formData.get("notes") as string) || undefined;

  if (!spoolId) return { error: "Bobina é obrigatória." };
  if (isNaN(consumedG) || consumedG <= 0)
    return { error: "Consumo em gramas deve ser positivo." };

  try {
    await linkSpoolToOrder({
      productionOrderId,
      spoolId,
      consumedG,
      actorProfileId: user?.id,
      notes,
    });
  } catch (err) {
    return { error: (err as Error).message };
  }

  revalidatePath(`/admin/fabrica/producao/${productionOrderId}`);
  redirect(`/admin/fabrica/producao/${productionOrderId}`);
}
