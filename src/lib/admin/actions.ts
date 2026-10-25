"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin/queries";

// ---------------------------------------------------------------------------
// Resultado padrão
// ---------------------------------------------------------------------------
export interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
  id?: string;
}

// ---------------------------------------------------------------------------
// Helper: gera slug amigável
// ---------------------------------------------------------------------------
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============================================================================
// PRODUTOS
// ============================================================================

export async function createProductAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado. Apenas administradores podem criar produtos." };

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || toSlug(name || "");
  const shortDescription = (formData.get("short_description") as string)?.trim() || null;
  const fullDescription = (formData.get("full_description") as string)?.trim() || null;
  const commercialMode = formData.get("commercial_mode") as string;
  const basePriceStr = formData.get("base_price") as string;
  const promotionalPriceStr = (formData.get("promotional_price") as string)?.trim() || null;
  const categoryId = (formData.get("category_id") as string) || null;
  const campaignId = (formData.get("campaign_id") as string) || null;
  const isActive = formData.get("is_active") === "true";
  const isFeatured = formData.get("is_featured") === "true";
  const metaTitle = (formData.get("meta_title") as string)?.trim() || null;
  const metaDescription = (formData.get("meta_description") as string)?.trim() || null;

  if (!name || name.length < 2) return { success: false, error: "Nome do produto é obrigatório (mínimo 2 caracteres)." };
  if (!slug || slug.length < 2) return { success: false, error: "Slug inválido." };
  if (!commercialMode) return { success: false, error: "Modalidade comercial é obrigatória." };

  const basePrice = parseFloat(basePriceStr);
  if (isNaN(basePrice) || basePrice < 0) return { success: false, error: "Preço base inválido." };

  const promotionalPrice =
    promotionalPriceStr && promotionalPriceStr.length > 0
      ? parseFloat(promotionalPriceStr)
      : null;

  const supabase = await createClient();

  const { data, error } = await (supabase.from("products") as any)
    .insert({
      name,
      slug,
      short_description: shortDescription,
      full_description: fullDescription,
      commercial_mode: commercialMode,
      base_price: basePrice,
      promotional_price: promotionalPrice,
      category_id: categoryId || null,
      campaign_id: campaignId || null,
      is_active: isActive,
      is_featured: isFeatured,
      meta_title: metaTitle,
      meta_description: metaDescription,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "Já existe um produto com este slug. Escolha um slug único." };
    return { success: false, error: `Erro ao criar produto: ${error.message}` };
  }

  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  revalidatePath("/");

  return { success: true, id: data.id, message: "Produto criado com sucesso!" };
}

export async function updateProductAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID do produto não informado." };

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const shortDescription = (formData.get("short_description") as string)?.trim() || null;
  const fullDescription = (formData.get("full_description") as string)?.trim() || null;
  const commercialMode = formData.get("commercial_mode") as string;
  const basePriceStr = formData.get("base_price") as string;
  const promotionalPriceStr = (formData.get("promotional_price") as string)?.trim() || null;
  const categoryId = (formData.get("category_id") as string) || null;
  const campaignId = (formData.get("campaign_id") as string) || null;
  const isActive = formData.get("is_active") === "true";
  const isFeatured = formData.get("is_featured") === "true";
  const metaTitle = (formData.get("meta_title") as string)?.trim() || null;
  const metaDescription = (formData.get("meta_description") as string)?.trim() || null;

  if (!name || name.length < 2) return { success: false, error: "Nome do produto é obrigatório." };

  const basePrice = parseFloat(basePriceStr);
  if (isNaN(basePrice) || basePrice < 0) return { success: false, error: "Preço base inválido." };

  const promotionalPrice =
    promotionalPriceStr && promotionalPriceStr.length > 0
      ? parseFloat(promotionalPriceStr)
      : null;

  const supabase = await createClient();

  const { error } = await (supabase.from("products") as any)
    .update({
      name,
      slug,
      short_description: shortDescription,
      full_description: fullDescription,
      commercial_mode: commercialMode,
      base_price: basePrice,
      promotional_price: promotionalPrice,
      category_id: categoryId || null,
      campaign_id: campaignId || null,
      is_active: isActive,
      is_featured: isFeatured,
      meta_title: metaTitle,
      meta_description: metaDescription,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { success: false, error: "Já existe outro produto com este slug." };
    return { success: false, error: `Erro ao atualizar produto: ${error.message}` };
  }

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${id}/editar`);
  revalidatePath("/catalogo");
  revalidatePath("/");

  return { success: true, id, message: "Produto atualizado com sucesso!" };
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const supabase = await createClient();
  const { error } = await (supabase.from("products") as any)
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  revalidatePath("/");

  return { success: true, message: `Produto ${isActive ? "ativado" : "desativado"} com sucesso.` };
}

// ============================================================================
// VARIANTES DE PRODUTO
// ============================================================================

export async function createVariantAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const productId = formData.get("product_id") as string;
  const sku = (formData.get("sku") as string)?.trim();
  const variantName = (formData.get("variant_name") as string)?.trim();
  const filamentMaterial = formData.get("filament_material") as string;
  const colorName = (formData.get("color_name") as string)?.trim();
  const colorHex = (formData.get("color_hex") as string)?.trim() || null;
  const priceAdjustment = parseFloat((formData.get("price_adjustment") as string) || "0");
  const weightG = parseFloat((formData.get("estimated_filament_weight_g") as string) || "0");
  const printMinutes = parseInt((formData.get("estimated_print_time_minutes") as string) || "0", 10);

  if (!productId || !sku || !variantName || !filamentMaterial || !colorName) {
    return { success: false, error: "Campos obrigatórios: produto, SKU, nome da variante, material e cor." };
  }

  const supabase = await createClient();
  const { data, error } = await (supabase.from("product_variants") as any)
    .insert({
      product_id: productId,
      sku,
      variant_name: variantName,
      filament_material: filamentMaterial,
      color_name: colorName,
      color_hex: colorHex,
      price_adjustment: isNaN(priceAdjustment) ? 0 : priceAdjustment,
      estimated_filament_weight_g: isNaN(weightG) ? 0 : weightG,
      estimated_print_time_minutes: isNaN(printMinutes) ? 0 : printMinutes,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "Já existe uma variante com este SKU." };
    return { success: false, error: `Erro ao criar variante: ${error.message}` };
  }

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath(`/produtos/${productId}`);

  return { success: true, id: data.id, message: "Variante criada com sucesso!" };
}

export async function deleteVariantAction(variantId: string, productId: string): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const supabase = await createClient();
  const { error } = await (supabase.from("product_variants") as any)
    .update({ is_active: false })
    .eq("id", variantId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  return { success: true, message: "Variante desativada." };
}

// ============================================================================
// IMAGENS DE PRODUTO
// ============================================================================

export async function addProductImageAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const productId = formData.get("product_id") as string;
  let imageUrl = (formData.get("image_url") as string)?.trim();
  const imageFile = formData.get("image_file") as File | null;
  const altText = (formData.get("alt_text") as string)?.trim() || null;
  const displayOrder = parseInt((formData.get("display_order") as string) || "0", 10);
  const isPrimary = formData.get("is_primary") === "true";

  if (!productId) return { success: false, error: "ID do produto é obrigatório." };

  const supabase = await createClient();

  // Se houver arquivo enviado, realiza upload para o Supabase Storage (product-images)
  if (imageFile && imageFile.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(imageFile.type)) {
      return { success: false, error: "Formato de arquivo inválido. Formatos permitidos: JPG, PNG, WEBP, GIF." };
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      return { success: false, error: "Tamanho máximo da imagem é de 5MB." };
    }

    const ext = imageFile.name.split(".").pop() || "jpg";
    const filePath = `products/${productId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: `Falha no upload do Supabase Storage: ${uploadError.message}. Se o bucket ainda não existir, cadastre via URL externa ou crie o bucket 'product-images' no painel.`,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    imageUrl = publicUrlData.publicUrl;
  }

  if (!imageUrl) {
    return { success: false, error: "Informe a URL da imagem ou selecione um arquivo para upload." };
  }

  // Validação básica de URL
  try {
    new URL(imageUrl);
  } catch {
    return { success: false, error: "URL da imagem inválida. Use uma URL completa (https://...)." };
  }

  // Se for primária, rebaixa as outras
  if (isPrimary) {
    await (supabase.from("product_images") as any)
      .update({ is_primary: false })
      .eq("product_id", productId);
  }

  const { data, error } = await (supabase.from("product_images") as any)
    .insert({
      product_id: productId,
      image_url: imageUrl,
      alt_text: altText,
      display_order: isNaN(displayOrder) ? 0 : displayOrder,
      is_primary: isPrimary,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: `Erro ao adicionar imagem: ${error.message}` };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath(`/produtos/${productId}`);

  return { success: true, id: data.id, message: "Imagem cadastrada com sucesso!" };
}

export async function deleteProductImageAction(imageId: string, productId: string): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const supabase = await createClient();
  const { error } = await (supabase.from("product_images") as any)
    .delete()
    .eq("id", imageId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath(`/produtos/${productId}`);

  return { success: true, message: "Imagem removida." };
}

// ============================================================================
// CATEGORIAS
// ============================================================================

export async function createCategoryAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || toSlug(name || "");
  const description = (formData.get("description") as string)?.trim() || null;
  const imageUrl = (formData.get("image_url") as string)?.trim() || null;
  const displayOrder = parseInt((formData.get("display_order") as string) || "0", 10);
  const isActive = formData.get("is_active") !== "false";
  const parentId = (formData.get("parent_id") as string) || null;

  if (!name) return { success: false, error: "Nome da categoria é obrigatório." };

  const supabase = await createClient();
  const { data, error } = await (supabase.from("categories") as any)
    .insert({
      name,
      slug,
      description,
      image_url: imageUrl,
      display_order: isNaN(displayOrder) ? 0 : displayOrder,
      is_active: isActive,
      parent_id: parentId || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "Já existe uma categoria com este slug." };
    return { success: false, error: `Erro ao criar categoria: ${error.message}` };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");

  return { success: true, id: data.id, message: "Categoria criada com sucesso!" };
}

export async function updateCategoryAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID não informado." };

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const imageUrl = (formData.get("image_url") as string)?.trim() || null;
  const displayOrder = parseInt((formData.get("display_order") as string) || "0", 10);
  const isActive = formData.get("is_active") !== "false";

  if (!name) return { success: false, error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await (supabase.from("categories") as any)
    .update({ name, slug, description, image_url: imageUrl, display_order: isNaN(displayOrder) ? 0 : displayOrder, is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");

  return { success: true, message: "Categoria atualizada." };
}

// ============================================================================
// CAMPANHAS
// ============================================================================

export async function createCampaignAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || toSlug(title || "");
  const description = (formData.get("description") as string)?.trim() || null;
  const commercialMode = formData.get("commercial_mode") as string;
  const status = (formData.get("status") as string) || "draft";
  const targetMinUnits = parseInt((formData.get("target_min_units") as string) || "1", 10);
  const maxUnitsLimit = (formData.get("max_units_limit") as string)?.trim()
    ? parseInt(formData.get("max_units_limit") as string, 10)
    : null;
  const estimatedProductionDays = (formData.get("estimated_production_days") as string)?.trim()
    ? parseInt(formData.get("estimated_production_days") as string, 10)
    : null;
  const startsAt = (formData.get("starts_at") as string) || null;
  const endsAt = (formData.get("ends_at") as string) || null;

  if (!title) return { success: false, error: "Título da campanha é obrigatório." };
  if (!commercialMode) return { success: false, error: "Modalidade comercial é obrigatória." };

  const supabase = await createClient();
  const { data, error } = await (supabase.from("campaigns") as any)
    .insert({
      title,
      slug,
      description,
      commercial_mode: commercialMode,
      status,
      target_min_units: isNaN(targetMinUnits) ? 1 : targetMinUnits,
      max_units_limit: maxUnitsLimit && !isNaN(maxUnitsLimit) ? maxUnitsLimit : null,
      estimated_production_days: estimatedProductionDays && !isNaN(estimatedProductionDays) ? estimatedProductionDays : null,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "Já existe uma campanha com este slug." };
    return { success: false, error: `Erro ao criar campanha: ${error.message}` };
  }

  revalidatePath("/admin/campanhas");
  revalidatePath("/validacao");

  return { success: true, id: data.id, message: "Campanha criada com sucesso!" };
}

export async function updateCampaignStatusAction(
  campaignId: string,
  status: string
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const validStatuses = ["draft", "active", "completed", "cancelled"];
  if (!validStatuses.includes(status)) return { success: false, error: "Status inválido." };

  const supabase = await createClient();
  const { error } = await (supabase.from("campaigns") as any)
    .update({ status })
    .eq("id", campaignId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/campanhas");
  revalidatePath("/validacao");

  return { success: true, message: `Status atualizado para "${status}".` };
}
