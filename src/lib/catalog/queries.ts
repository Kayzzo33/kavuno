import { createClient } from "@/lib/supabase/server";
import type { Database, CommercialMode, FilamentMaterial } from "@/types/database.types";

export type ProductWithDetails = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["categories"]["Row"] | null;
  campaign?: Database["public"]["Tables"]["campaigns"]["Row"] | null;
  variants: Database["public"]["Tables"]["product_variants"]["Row"][];
  images: Database["public"]["Tables"]["product_images"]["Row"][];
};

export interface CatalogFilterParams {
  search?: string;
  categorySlug?: string;
  commercialMode?: CommercialMode;
  material?: FilamentMaterial;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: number;
  limit?: number;
}

/**
 * Consulta de catálogo paginada com suporte a pesquisa por texto e filtros múltiplos.
 * Respeita RLS: apenas produtos com is_active = true são retornados para visitantes.
 */
export async function getCatalogProducts(params: CatalogFilterParams = {}) {
  const supabase = await createClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(24, Math.max(1, params.limit || 12));
  const offset = (page - 1) * limit;

  let query = (supabase.from("products") as any)
    .select(
      `
      *,
      category:categories(*),
      campaign:campaigns(*),
      variants:product_variants(*),
      images:product_images(*)
    `,
      { count: "exact" }
    )
    .eq("is_active", true);

  // Filtro de pesquisa textual no nome ou descrição
  if (params.search && params.search.trim().length > 0) {
    const searchTerm = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${searchTerm},short_description.ilike.${searchTerm}`);
  }

  // Filtro de modalidade comercial
  if (params.commercialMode) {
    query = query.eq("commercial_mode", params.commercialMode);
  }

  // Filtro de categoria por slug
  if (params.categorySlug) {
    const { data: cat } = await (supabase.from("categories") as any)
      .select("id")
      .eq("slug", params.categorySlug)
      .maybeSingle();

    if (cat?.id) {
      query = query.eq("category_id", cat.id);
    }
  }

  // Ordenação
  if (params.sort === "price_asc") {
    query = query.order("base_price", { ascending: true });
  } else if (params.sort === "price_desc") {
    query = query.order("base_price", { ascending: false });
  } else {
    // Padrão: mais recentes
    query = query.order("created_at", { ascending: false });
  }

  // Paginação
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Erro ao buscar catálogo:", error);
    return { products: [], total: 0, page, totalPages: 0 };
  }

  // Filtro adicional em memória para variantes por material caso solicitado
  let filteredData = (data as ProductWithDetails[]) || [];
  if (params.material) {
    filteredData = filteredData.filter((p) =>
      p.variants?.some((v) => v.filament_material === params.material)
    );
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    products: filteredData,
    total,
    page,
    totalPages,
  };
}

/**
 * Consulta de produto único pelo slug amigável, trazendo variantes ativas e imagens ordenadas.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("products") as any)
    .select(
      `
      *,
      category:categories(*),
      campaign:campaigns(*),
      variants:product_variants(*),
      images:product_images(*)
    `
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const product = data as ProductWithDetails;

  // Ordenar imagens pelo display_order
  if (product.images) {
    product.images.sort((a, b) => a.display_order - b.display_order);
  }

  // Filtrar apenas variantes ativas
  if (product.variants) {
    product.variants = product.variants.filter((v) => v.is_active);
  }

  return product;
}

/**
 * Consulta lista de todas as categorias ativas.
 */
export async function getActiveCategories() {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("categories") as any)
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }
  return data as Database["public"]["Tables"]["categories"]["Row"][];
}

/**
 * Consulta lista de campanhas em andamento (status = 'active').
 */
export async function getActiveCampaigns() {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("campaigns") as any)
    .select(
      `
      *,
      products:products(count)
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar campanhas:", error);
    return [];
  }
  return data as (Database["public"]["Tables"]["campaigns"]["Row"] & { products: { count: number }[] })[];
}
