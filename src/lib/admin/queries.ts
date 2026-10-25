import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * Verifica se o usuário autenticado possui role 'admin' consultando
 * a tabela profiles via RLS (a função is_admin() do banco valida isso).
 * Deve ser chamado em Server Components e Server Actions protegidas.
 */
export async function requireAdminSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, isAdmin: false };
  }

  const { data: profile, error: profileError } = await (supabase.from("profiles") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return { user, isAdmin: false };
  }

  return { user, isAdmin: true };
}

export interface AdminDashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  leadsLast30Days: number;
}

/**
 * Agrega métricas gerais do catálogo para o dashboard administrativo.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createClient();

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalCategories },
    { count: totalCampaigns },
    { count: activeCampaigns },
    { count: totalLeads },
    { count: leadsLast30Days },
  ] = await Promise.all([
    (supabase.from("products") as any).select("*", { count: "exact", head: true }),
    (supabase.from("products") as any).select("*", { count: "exact", head: true }).eq("is_active", true),
    (supabase.from("categories") as any).select("*", { count: "exact", head: true }),
    (supabase.from("campaigns") as any).select("*", { count: "exact", head: true }),
    (supabase.from("campaigns") as any).select("*", { count: "exact", head: true }).eq("status", "active"),
    (supabase.from("interest_leads") as any).select("*", { count: "exact", head: true }),
    (supabase.from("interest_leads") as any)
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    totalProducts: totalProducts || 0,
    activeProducts: activeProducts || 0,
    totalCategories: totalCategories || 0,
    totalCampaigns: totalCampaigns || 0,
    activeCampaigns: activeCampaigns || 0,
    totalLeads: totalLeads || 0,
    leadsLast30Days: leadsLast30Days || 0,
  };
}

export type AdminProduct = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["categories"]["Row"] | null;
  campaign?: Database["public"]["Tables"]["campaigns"]["Row"] | null;
  variants: Database["public"]["Tables"]["product_variants"]["Row"][];
  images: Database["public"]["Tables"]["product_images"]["Row"][];
  leads_count?: number;
};

/**
 * Lista todos os produtos (ativos e inativos) com detalhes para o admin.
 */
export async function getAdminProducts(params: {
  search?: string;
  categoryId?: string;
  commercialMode?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;

  let query = (supabase.from("products") as any)
    .select(
      `*, category:categories(*), campaign:campaigns(*), variants:product_variants(*), images:product_images(*)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.search?.trim()) {
    const s = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${s},slug.ilike.${s}`);
  }
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.commercialMode) query = query.eq("commercial_mode", params.commercialMode);

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("Erro ao buscar produtos admin:", error);
    return { products: [], total: 0, totalPages: 0 };
  }

  const products = (data as AdminProduct[]) || [];
  const total = count || 0;
  return { products, total, totalPages: Math.ceil(total / limit) };
}

/**
 * Busca produto único por ID com todas as relações para edição.
 */
export async function getAdminProductById(id: string): Promise<AdminProduct | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("products") as any)
    .select(
      `*, category:categories(*), campaign:campaigns(*), variants:product_variants(*), images:product_images(*)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const product = data as AdminProduct;
  if (product.images) product.images.sort((a, b) => a.display_order - b.display_order);
  return product;
}

/**
 * Lista todas as categorias (ativas e inativas) para gerenciamento.
 */
export async function getAdminCategories() {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("categories") as any)
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return [];
  return data as Database["public"]["Tables"]["categories"]["Row"][];
}

/**
 * Lista todas as campanhas com contagem de produtos vinculados.
 */
export async function getAdminCampaigns() {
  const supabase = await createClient();
  const { data, error } = await (supabase.from("campaigns") as any)
    .select(`*, products:products(count)`)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as (Database["public"]["Tables"]["campaigns"]["Row"] & {
    products: { count: number }[];
  })[];
}

/**
 * Lista leads de interesse com produto e variante vinculados.
 */
export async function getAdminLeads(params: {
  productId?: string;
  campaignId?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 30));
  const offset = (page - 1) * limit;

  let query = (supabase.from("interest_leads") as any)
    .select(
      `*, product:products(id, name, slug), variant:product_variants(id, variant_name, color_name)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (params.productId) query = query.eq("product_id", params.productId);
  if (params.campaignId) query = query.eq("campaign_id", params.campaignId);
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return { leads: [], total: 0, totalPages: 0 };

  return {
    leads: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
