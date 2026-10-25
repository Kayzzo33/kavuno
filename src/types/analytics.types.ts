import type { AnalyticsEventName } from "./database.types";

export interface AnalyticsEventDTO {
  id: string;
  session_id: string;
  event_name: AnalyticsEventName;
  entity_type: "product" | "category" | "campaign" | "order" | "coupon" | "search" | "general" | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ProductDiagnosticStatus =
  | "healthy"           // Produto com visualizações e conversão adequada
  | "low_exposure"     // Poucas visualizações (precisa de marketing/vitrine)
  | "out_of_stock"     // Visualizado mas sem estoque físico disponível
  | "underperforming"; // Alto volume de visualizações mas zero conversão (revisar preço/fotos)

export interface ProductPerformanceItem {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  totalViews: number;
  totalCartAdds: number;
  totalOrders: number;
  totalLeads: number;
  stockAvailable: number;
  conversionRatePct: number;
  diagnostic: ProductDiagnosticStatus;
  diagnosticMessage: string;
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  dropoffPct: number;
  conversionFromFirstPct: number;
}

export interface SearchInsightItem {
  query: string;
  count: number;
  lastSearchedAt: string;
}

export interface AnalyticsDashboardData {
  totalViews: number;
  totalSearches: number;
  totalCartAdds: number;
  totalCheckouts: number;
  totalOrders: number;
  overallConversionRatePct: number;
  funnel: FunnelStage[];
  productDiagnostics: ProductPerformanceItem[];
  unmatchedSearches: SearchInsightItem[];
  recentEvents: AnalyticsEventDTO[];
}
