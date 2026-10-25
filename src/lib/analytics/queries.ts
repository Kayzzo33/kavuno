// ============================================================================
// src/lib/analytics/queries.ts
// Consultas e Agregações de Telemetria e Diagnósticos de Produtos
// ============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnalyticsDashboardData,
  FunnelStage,
  ProductPerformanceItem,
  SearchInsightItem,
  AnalyticsEventDTO,
} from "@/types/analytics.types";

export async function getAnalyticsDashboardData(days: number = 30): Promise<AnalyticsDashboardData> {
  const supabase = createAdminClient();
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // 1. Buscar todos os eventos do período
  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("*")
    .gte("created_at", sinceDate)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar telemetria analítica: ${error.message}`);
  }

  const allEvents = events ?? [];

  // 2. Contadores gerais do funil
  let totalViews = 0;
  let totalSearches = 0;
  let totalCartAdds = 0;
  let totalCheckouts = 0;
  let totalOrders = 0;
  let totalPayments = 0;

  const viewsByProduct: Record<string, number> = {};
  const cartAddsByProduct: Record<string, number> = {};
  const ordersByProduct: Record<string, number> = {};
  const leadsByProduct: Record<string, number> = {};
  const unmatchedSearchMap: Record<string, { count: number; lastAt: string }> = {};

  for (const ev of allEvents) {
    const meta = (ev.metadata as Record<string, any>) || {};

    switch (ev.event_name) {
      case "product_view":
        totalViews++;
        if (ev.entity_id) {
          viewsByProduct[ev.entity_id] = (viewsByProduct[ev.entity_id] || 0) + 1;
        }
        break;
      case "search":
        totalSearches++;
        if (meta.results_count === 0 && meta.query) {
          const q = String(meta.query).trim().toLowerCase();
          if (q) {
            unmatchedSearchMap[q] = {
              count: (unmatchedSearchMap[q]?.count || 0) + 1,
              lastAt: ev.created_at,
            };
          }
        }
        break;
      case "search_no_results":
        if (meta.query) {
          const q = String(meta.query).trim().toLowerCase();
          if (q) {
            unmatchedSearchMap[q] = {
              count: (unmatchedSearchMap[q]?.count || 0) + 1,
              lastAt: ev.created_at,
            };
          }
        }
        break;
      case "cart_add":
        totalCartAdds++;
        if (ev.entity_id) {
          cartAddsByProduct[ev.entity_id] = (cartAddsByProduct[ev.entity_id] || 0) + 1;
        }
        break;
      case "checkout_start":
        totalCheckouts++;
        break;
      case "order_created":
        totalOrders++;
        if (ev.entity_id) {
          ordersByProduct[ev.entity_id] = (ordersByProduct[ev.entity_id] || 0) + 1;
        }
        break;
      case "payment_confirmed":
        totalPayments++;
        break;
      case "lead_created":
        if (ev.entity_id) {
          leadsByProduct[ev.entity_id] = (leadsByProduct[ev.entity_id] || 0) + 1;
        }
        break;
    }
  }

  // 3. Montar Funil de Conversão
  const funnelStagesRaw = [
    { stage: "product_view", label: "1. Visualizações de Produto", count: totalViews },
    { stage: "cart_add", label: "2. Adições ao Carrinho", count: totalCartAdds },
    { stage: "checkout_start", label: "3. Checkouts Iniciados", count: totalCheckouts },
    { stage: "order_created", label: "4. Pedidos Criados", count: totalOrders },
    { stage: "payment_confirmed", label: "5. Pagamentos Confirmados", count: totalPayments },
  ];

  const firstStageCount = totalViews || 1;
  const funnel: FunnelStage[] = funnelStagesRaw.map((st, idx) => {
    const prevCount = idx === 0 ? st.count : funnelStagesRaw[idx - 1].count;
    const dropoffPct = prevCount > 0 ? Math.max(0, ((prevCount - st.count) / prevCount) * 100) : 0;
    const conversionFromFirstPct = (st.count / firstStageCount) * 100;

    return {
      stage: st.stage,
      label: st.label,
      count: st.count,
      dropoffPct: Math.round(dropoffPct * 10) / 10,
      conversionFromFirstPct: Math.round(conversionFromFirstPct * 10) / 10,
    };
  });

  // 4. Buscar produtos e estoque para diagnóstico de desempenho
  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      categories (name),
      product_variants (
        id,
        inventory_items (quantity_available)
      )
    `)
    .eq("is_active", true);

  const productDiagnostics: ProductPerformanceItem[] = (products ?? []).map((p: any) => {
    const views = viewsByProduct[p.id] || 0;
    const cartAdds = cartAddsByProduct[p.id] || 0;
    const orders = ordersByProduct[p.id] || 0;
    const leads = leadsByProduct[p.id] || 0;

    // Calcular estoque disponível consolidado das variantes
    let stock = 0;
    if (p.product_variants) {
      for (const v of p.product_variants) {
        if (v.inventory_items && v.inventory_items.length > 0) {
          stock += Number(v.inventory_items[0].quantity_available || 0);
        }
      }
    }

    const conversionRatePct = views > 0 ? Math.round((orders / views) * 1000) / 10 : 0;

    // Diferenciação Obrigatória: Falta de Exposição vs Indisponibilidade vs Baixo Desempenho
    let diagnostic: ProductPerformanceItem["diagnostic"] = "healthy";
    let diagnosticMessage = "Conversão saudável e tração ativa.";

    if (views < 5) {
      diagnostic = "low_exposure";
      diagnosticMessage = "Falta de Exposição: Poucas visualizações no período. Recomendado destacar em campanhas ou categorias.";
    } else if (stock <= 0 && orders === 0 && leads > 0) {
      diagnostic = "out_of_stock";
      diagnosticMessage = "Indisponibilidade: Alta procura sem estoque físico pronto. Considere disparar ordem de reposição na fábrica.";
    } else if (views >= 15 && orders === 0) {
      diagnostic = "underperforming";
      diagnosticMessage = "Baixo Desempenho: Alto volume de visitas com conversão nula. Avaliar fotos, especificações ou precificação.";
    }

    return {
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      categoryName: p.categories?.name ?? "Geral",
      totalViews: views,
      totalCartAdds: cartAdds,
      totalOrders: orders,
      totalLeads: leads,
      stockAvailable: stock,
      conversionRatePct,
      diagnostic,
      diagnosticMessage,
    };
  });

  // Ordenar diagnósticos por visualizações
  productDiagnostics.sort((a, b) => b.totalViews - a.totalViews);

  // 5. Buscas sem resultados ordenadas por frequência
  const unmatchedSearches: SearchInsightItem[] = Object.entries(unmatchedSearchMap)
    .map(([query, info]) => ({
      query,
      count: info.count,
      lastSearchedAt: info.lastAt,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const overallConversionRatePct = totalViews > 0 ? Math.round((totalOrders / totalViews) * 1000) / 10 : 0;

  return {
    totalViews,
    totalSearches,
    totalCartAdds,
    totalCheckouts,
    totalOrders,
    overallConversionRatePct,
    funnel,
    productDiagnostics,
    unmatchedSearches,
    recentEvents: (allEvents.slice(0, 20) as any) as AnalyticsEventDTO[],
  };
}
