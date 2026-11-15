"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// ============================================================================
// AUTENTICAÇÃO ADMINISTRATIVA DEDICADA
// ============================================================================

export async function adminSignInAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Por favor, preencha o e-mail e a senha administrativa." };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: "Credenciais de administrador incorretas ou não encontradas." };
  }

  // Validação estrita de role admin
  const { data: profile, error: profileError } = await (supabase.from("profiles") as any)
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    // Não permite login de cliente no portal administrativo
    await supabase.auth.signOut();
    return {
      success: false,
      error: "Acesso negado: Esta conta não possui permissões administrativas. Clientes devem acessar a loja pelo portal de clientes.",
    };
  }

  revalidatePath("/kavuno-gestao", "layout");
  redirect("/kavuno-gestao");
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

  revalidatePath("/kavuno-gestao/produtos");
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

  revalidatePath("/kavuno-gestao/produtos");
  revalidatePath(`/kavuno-gestao/produtos/${id}/editar`);
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

  revalidatePath("/kavuno-gestao/produtos");
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

  revalidatePath(`/kavuno-gestao/produtos/${productId}/editar`);
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

  revalidatePath(`/kavuno-gestao/produtos/${productId}/editar`);
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

  revalidatePath(`/kavuno-gestao/produtos/${productId}/editar`);
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

  revalidatePath(`/kavuno-gestao/produtos/${productId}/editar`);
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

  revalidatePath("/kavuno-gestao/categorias");
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

  revalidatePath("/kavuno-gestao/categorias");
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

  revalidatePath("/kavuno-gestao/campanhas");
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

  revalidatePath("/kavuno-gestao/campanhas");
  revalidatePath("/validacao");

  return { success: true, message: `Status atualizado para "${status}".` };
}

// ============================================================================
// BANNERS E CONFIGURAÇÕES DA LOJA (HERO E ANNOUNCEMENT BAR)
// ============================================================================

export async function updateSiteSettingsAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const heroMode = formData.get("hero_mode") as string;
  const announcementText = (formData.get("announcement_text") as string)?.trim();

  const supabase = await createClient();

  if (heroMode) {
    await (supabase.from("site_settings") as any).upsert({
      key: "hero_mode",
      value: heroMode,
      updated_at: new Date().toISOString(),
    });
  }

  if (announcementText) {
    await (supabase.from("site_settings") as any).upsert({
      key: "announcement_text",
      value: announcementText,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath("/");
  revalidatePath("/kavuno-gestao/banners");

  return { success: true, message: "Configurações da loja atualizadas com sucesso!" };
}

export async function createSiteBannerAction(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const title = (formData.get("title") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim() || null;
  const tag = (formData.get("tag") as string)?.trim() || null;
  const imageUrl = (formData.get("image_url") as string)?.trim();
  const linkUrl = (formData.get("link_url") as string)?.trim() || null;
  const buttonText = (formData.get("button_text") as string)?.trim() || null;
  const displayOrderStr = formData.get("display_order") as string;
  const displayOrder = parseInt(displayOrderStr || "0", 10);
  const position = ((formData.get("position") as string) || "hero").toLowerCase();

  // Tratamento robusto para checkbox: se conter "true" ou "on" nos valores enviados
  const activeValues = formData.getAll("is_active");
  const isActive = activeValues.includes("true") || activeValues.includes("on");

  if (!title) return { success: false, error: "Título do banner é obrigatório." };
  if (!imageUrl) return { success: false, error: "URL da imagem do banner é obrigatória." };

  const supabase = await createClient();
  const { data, error } = await (supabase.from("site_banners") as any)
    .insert({
      title,
      subtitle,
      tag,
      image_url: imageUrl,
      link_url: linkUrl,
      button_text: buttonText,
      display_order: isNaN(displayOrder) ? 0 : displayOrder,
      is_active: isActive,
      position: position === "footer" ? "footer" : "hero",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: `Erro ao criar banner: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/kavuno-gestao/banners");

  return { success: true, id: data.id, message: "Banner adicionado com sucesso!" };
}

export async function toggleSiteBannerActiveAction(bannerId: string, nextStatus: boolean): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const supabase = await createClient();
  const { error } = await (supabase.from("site_banners") as any)
    .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", bannerId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/kavuno-gestao/banners");
  return { success: true, message: nextStatus ? "Banner ativado!" : "Banner pausado." };
}

// ---------------------------------------------------------------------------
// IMPORTAÇÃO EM LOTE DE PRODUTOS (SEMPRE COMO INATIVOS / RASCUNHO)
// ---------------------------------------------------------------------------

export interface ImportProductItemInput {
  name: string;
  base_price?: number;
  short_description?: string;
  category_id?: string;
  commercial_mode?: "in_stock" | "pre_order" | "interest_lead";
}

export async function importProductsBatchAction(
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; count?: number; message?: string; error?: string }> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso administrativo obrigatório." };

  const rawInput = (formData.get("batch_data") as string)?.trim();
  if (!rawInput) {
    return { success: false, error: "Insira ao menos um produto para importar." };
  }

  const itemsToInsert: ImportProductItemInput[] = [];

  // 1. Tenta interpretar como JSON
  if (rawInput.startsWith("[") && rawInput.endsWith("]")) {
    try {
      const parsed = JSON.parse(rawInput);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.name && typeof item.name === "string" && item.name.trim().length > 0) {
            itemsToInsert.push({
              name: item.name.trim(),
              base_price: Number(item.base_price || item.preco || 89.0),
              short_description: item.short_description || item.descricao || "",
              category_id: item.category_id || undefined,
              commercial_mode: item.commercial_mode || "in_stock",
            });
          }
        }
      }
    } catch {
      // Ignora erro de JSON e tenta modo linha a linha
    }
  }

  // 2. Se não foi JSON, interpreta linha por linha (formato Nome | Preço | Descrição)
  if (itemsToInsert.length === 0) {
    const lines = rawInput.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || line.startsWith("//")) continue;

      // Suporta separador por pipe '|' ou ponto e vírgula ';' ou vírgula
      const parts = line.includes("|")
        ? line.split("|")
        : line.includes(";")
        ? line.split(";")
        : [line];

      const name = parts[0]?.trim();
      if (!name) continue;

      const priceStr = parts[1]?.trim().replace("R$", "").replace(",", ".").trim();
      const price = priceStr && !isNaN(parseFloat(priceStr)) ? parseFloat(priceStr) : 89.0;
      const desc = parts[2]?.trim() || "";

      itemsToInsert.push({
        name,
        base_price: price,
        short_description: desc,
        commercial_mode: "in_stock",
      });
    }
  }

  if (itemsToInsert.length === 0) {
    return { success: false, error: "Nenhum produto válido identificado na lista." };
  }

  const supabase = await createClient();
  let insertedCount = 0;

  for (const item of itemsToInsert) {
    const baseSlug = item.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // Regra Crítica: TODOS vêm APENAS cadastrados como INATIVOS (is_active: false)
    const { data: newProd, error: prodErr } = await (supabase.from("products") as any)
      .insert({
        name: item.name,
        slug: uniqueSlug,
        short_description: item.short_description || null,
        full_description: item.short_description || null,
        base_price: item.base_price || 89.0,
        commercial_mode: item.commercial_mode || "in_stock",
        is_active: false, // OBRIGATÓRIO: Apenas cadastrado, NÃO ativo
        is_featured: false,
        category_id: item.category_id || null,
      })
      .select("id")
      .single();

    if (!prodErr && newProd?.id) {
      insertedCount++;
      // Cria variante padrão inicial para facilitar o controle
      await (supabase.from("product_variants") as any).insert({
        product_id: newProd.id,
        variant_name: "Padrão",
        sku: `KAV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        filament_material: "PLA",
        print_time_hours: 3.5,
        filament_weight_grams: 85,
        price_in_stock: item.base_price || 89.0,
        stock_quantity: 0,
        is_active: true,
      });
    }
  }

  revalidatePath("/kavuno-gestao/produtos");
  revalidatePath("/catalogo");
  revalidatePath("/");

    return {
      success: true,
      count: insertedCount,
      message: `${insertedCount} produto(s) importado(s) com sucesso como RASCUNHO (Inativos). Você pode revisá-los e ativá-los individualmente.`,
    };
  }

  export async function deleteSiteBannerAction(bannerId: string): Promise<AdminActionResult> {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return { success: false, error: "Acesso negado." };

  const supabase = await createClient();
  const { error } = await (supabase.from("site_banners") as any)
    .delete()
    .eq("id", bannerId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/kavuno-gestao/banners");

  return { success: true, message: "Banner removido com sucesso!" };
}

