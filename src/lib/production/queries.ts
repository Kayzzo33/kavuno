// ============================================================================
// src/lib/production/queries.ts
// Consultas server-side para bobinas de filamento e ordens de produção.
// Usa o cliente admin (service_role) para operar além do RLS quando necessário,
// mas toda a autorização é verificada via requireAdminSession() nas rotas.
// ============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Database,
  FilamentMaterial,
  SpoolStatus,
  ProductionStatus,
} from "@/types/database.types";

// ---------------------------------------------------------------------------
// BOBINAS
// ---------------------------------------------------------------------------

export async function listSpools(opts?: {
  material?: FilamentMaterial;
  status?: SpoolStatus;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("filament_spools")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts?.material) query = query.eq("material", opts.material);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, count, error } = await query;
  if (error) throw new Error(`Erro ao listar bobinas: ${error.message}`);
  return { spools: data ?? [], total: count ?? 0, page, pageSize };
}

export async function getSpoolById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("filament_spools")
    .select("*, filament_spool_movements(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error(`Bobina não encontrada: ${error.message}`);
  return data;
}

export interface CreateSpoolInput {
  label: string;
  material: FilamentMaterial;
  color_name: string;
  color_hex?: string;
  manufacturer?: string;
  purchase_cost: number;
  allocated_shipping_cost?: number;
  gross_weight_g: number;
  tare_weight_g?: number;
  batch_number?: string;
  supplier_invoice?: string;
  purchased_at?: string;
  notes?: string;
}

export async function createSpool(input: CreateSpoolInput) {
  const supabase = createAdminClient();
  const tare = input.tare_weight_g ?? 0;
  const net = input.gross_weight_g - tare;
  if (net <= 0) throw new Error("Peso líquido inicial deve ser positivo.");

  const { data, error } = await supabase
    .from("filament_spools")
    .insert({
      ...input,
      tare_weight_g: tare,
      current_weight_g: net,
      status: "sealed" as SpoolStatus,
    })
    .select()
    .single();
  if (error) throw new Error(`Erro ao criar bobina: ${error.message}`);
  return data;
}

export async function updateSpool(
  id: string,
  patch: Partial<Omit<CreateSpoolInput, "gross_weight_g" | "tare_weight_g">> & {
    status?: SpoolStatus;
  }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("filament_spools")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Erro ao atualizar bobina: ${error.message}`);
  return data;
}

export async function adjustSpoolWeight(opts: {
  spoolId: string;
  quantityG: number;
  movementType: "manual_adjustment" | "weigh_in";
  referenceNote?: string;
  actorProfileId?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("register_spool_movement", {
    p_spool_id: opts.spoolId,
    p_movement_type: opts.movementType,
    p_quantity_g: opts.quantityG,
    p_production_order_id: null,
    p_reference_note: opts.referenceNote ?? null,
    p_actor_profile_id: opts.actorProfileId ?? null,
  });
  if (error)
    throw new Error(`Erro ao registrar movimentação de bobina: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// ORDENS DE PRODUÇÃO
// ---------------------------------------------------------------------------

export async function listProductionOrders(opts?: {
  status?: ProductionStatus;
  productId?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("production_orders")
    .select(
      `*, products(name, slug), product_variants(variant_name, sku)`,
      { count: "exact" }
    )
    .order("queued_at", { ascending: false })
    .range(from, to);

  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.productId) query = query.eq("product_id", opts.productId);

  const { data, count, error } = await query;
  if (error) throw new Error(`Erro ao listar ordens: ${error.message}`);
  return { orders: data ?? [], total: count ?? 0, page, pageSize };
}

export async function getProductionOrderById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("production_orders")
    .select(
      `*,
       products(name, slug),
       product_variants(variant_name, sku, filament_material, estimated_filament_weight_g, estimated_print_time_minutes),
       production_order_spools(*, filament_spools(label, material, color_name, color_hex)),
       production_order_costs(*)`
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(`Ordem não encontrada: ${error.message}`);
  return data;
}

export interface CreateProductionOrderInput {
  product_id: string;
  variant_id: string;
  sales_order_id?: string;
  planned_quantity: number;
  estimated_filament_g?: number;
  estimated_machine_minutes?: number;
  notes?: string;
}

export async function createProductionOrder(input: CreateProductionOrderInput) {
  const supabase = createAdminClient();

  const { data: orderNum, error: numError } = await supabase.rpc(
    "generate_production_order_number"
  );
  if (numError)
    throw new Error(`Erro ao gerar número de ordem: ${numError.message}`);

  let estimatedG = input.estimated_filament_g;
  let estimatedMinutes = input.estimated_machine_minutes;

  if (!estimatedG) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("estimated_filament_weight_g, estimated_print_time_minutes")
      .eq("id", input.variant_id)
      .single();
    estimatedG =
      (variant?.estimated_filament_weight_g ?? 0) * input.planned_quantity;
    estimatedMinutes =
      estimatedMinutes ??
      (variant?.estimated_print_time_minutes ?? 0) * input.planned_quantity;
  }

  const { data, error } = await supabase
    .from("production_orders")
    .insert({
      order_number: orderNum as string,
      product_id: input.product_id,
      variant_id: input.variant_id,
      sales_order_id: input.sales_order_id ?? null,
      planned_quantity: input.planned_quantity,
      estimated_filament_g: estimatedG ?? 0,
      estimated_machine_minutes: estimatedMinutes ?? 0,
      notes: input.notes ?? null,
      status: "queued" as ProductionStatus,
    })
    .select()
    .single();
  if (error) throw new Error(`Erro ao criar ordem de produção: ${error.message}`);
  return data;
}

export async function updateProductionOrderStatus(
  id: string,
  status: ProductionStatus,
  opts?: {
    producedQuantity?: number;
    rejectedQuantity?: number;
    actualFilamentG?: number;
    wasteFilamentG?: number;
    actualMachineMinutes?: number;
    laborMinutes?: number;
    reprintCount?: number;
    failureNotes?: string;
    adjustmentReason?: string;
    notes?: string;
  }
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const patch: Database["public"]["Tables"]["production_orders"]["Update"] = { status };
  if (status === "printing" || status === "slicing") patch.started_at = now;
  if (status === "completed" || status === "failed") patch.completed_at = now;
  if (opts?.producedQuantity !== undefined)
    patch.produced_quantity = opts.producedQuantity;
  if (opts?.rejectedQuantity !== undefined)
    patch.rejected_quantity = opts.rejectedQuantity;
  if (opts?.actualFilamentG !== undefined)
    patch.actual_filament_g = opts.actualFilamentG;
  if (opts?.wasteFilamentG !== undefined)
    patch.waste_filament_g = opts.wasteFilamentG;
  if (opts?.actualMachineMinutes !== undefined)
    patch.actual_machine_minutes = opts.actualMachineMinutes;
  if (opts?.laborMinutes !== undefined) patch.labor_minutes = opts.laborMinutes;
  if (opts?.reprintCount !== undefined) patch.reprint_count = opts.reprintCount;
  if (opts?.failureNotes !== undefined) patch.failure_notes = opts.failureNotes;
  if (opts?.adjustmentReason !== undefined)
    patch.adjustment_reason = opts.adjustmentReason;
  if (opts?.notes !== undefined) patch.notes = opts.notes;

  const { data, error } = await supabase
    .from("production_orders")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Erro ao atualizar ordem: ${error.message}`);
  return data;
}

export async function linkSpoolToOrder(opts: {
  productionOrderId: string;
  spoolId: string;
  consumedG: number;
  actorProfileId?: string;
  notes?: string;
}) {
  const supabase = createAdminClient();

  const { error: rpcError } = await supabase.rpc("register_spool_movement", {
    p_spool_id: opts.spoolId,
    p_movement_type: "production_consumption",
    p_quantity_g: opts.consumedG,
    p_production_order_id: opts.productionOrderId,
    p_reference_note: `Ordem ${opts.productionOrderId}`,
    p_actor_profile_id: opts.actorProfileId ?? null,
  });
  if (rpcError)
    throw new Error(`Erro ao consumir filamento: ${rpcError.message}`);

  const { data, error } = await supabase
    .from("production_order_spools")
    .upsert(
      {
        production_order_id: opts.productionOrderId,
        spool_id: opts.spoolId,
        consumed_g: opts.consumedG,
        notes: opts.notes ?? null,
      },
      { onConflict: "production_order_id,spool_id" }
    )
    .select()
    .single();
  if (error)
    throw new Error(`Erro ao vincular bobina à ordem: ${error.message}`);
  return data;
}
