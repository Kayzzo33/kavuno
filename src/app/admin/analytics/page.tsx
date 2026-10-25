import React from "react";
import { requireAdminSession } from "@/lib/admin/queries";
import { getAnalyticsDashboardData } from "@/lib/analytics/queries";

export default async function AdminAnalyticsPage() {
  await requireAdminSession();
  const data = await getAnalyticsDashboardData(30);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
      {/* Cabeçalho */}
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "var(--spacing-lg)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "0.25rem",
          }}
        >
          // MÓDULO B.8 · TELEMETRIA & INTELIGÊNCIA OPERACIONAL (LGPD-COMPLIANT)
        </div>
        <h1
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          ANALYTICS, FUNIL & DIAGNÓSTICO DE PRODUTOS
        </h1>
        <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
          Métricas calculadas em tempo real com preservação rigorosa de privacidade (Zero-PII). Dados dos últimos 30 dias.
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--spacing-md)",
        }}
      >
        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>VISUALIZAÇÕES (VIEWS)</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{data.totalViews}</div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Páginas de produtos acessadas</div>
        </div>

        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>ADIÇÕES AO CARRINHO</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary)" }}>{data.totalCartAdds}</div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Intenções de compra ativas</div>
        </div>

        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>PEDIDOS CONCLUÍDOS</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary)" }}>{data.totalOrders}</div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Convertidos com sucesso</div>
        </div>

        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>TAXA DE CONVERSÃO GERAL</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800, color: data.overallConversionRatePct > 1 ? "var(--color-primary)" : "var(--color-warning)" }}>
            {data.overallConversionRatePct.toFixed(1)}%
          </div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Pedidos por visualização</div>
        </div>

        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>BUSCAS REALIZADAS</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>{data.totalSearches}</div>
          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Consultas no catálogo</div>
        </div>
      </div>

      {/* Funil de Conversão */}
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-lg)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "var(--spacing-md)" }}>
          // FUNIL DE CONVERSÃO DO E-COMMERCE (DROP-OFF POR ETAPA)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          {data.funnel.map((step, idx) => (
            <div key={step.stage} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                <span>{step.label}</span>
                <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                  {step.count} ({step.conversionFromFirstPct.toFixed(1)}% do topo)
                  {idx > 0 && <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem" }}>- queda: {step.dropoffPct.toFixed(1)}%</span>}
                </span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "var(--bg-canvas)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, Math.max(step.count > 0 ? 3 : 0, step.conversionFromFirstPct))}%`,
                    backgroundColor: idx === 4 ? "var(--color-primary)" : "rgba(0, 255, 136, 0.6)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Diagnóstico de Produtos + Buscas Sem Resultados */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: "var(--spacing-xl)" }}>
        {/* Tabela de Diagnóstico Inteligente de Produtos */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "var(--spacing-md) var(--spacing-lg)",
              borderBottom: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            // DIAGNÓSTICO INTELIGENTE DE PRODUTOS
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--bg-canvas)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>PRODUTO</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>VIEWS</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>CARRINHO</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>PEDIDOS</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>ESTOQUE</th>
                  <th style={{ padding: "0.75rem 1rem" }}>DIAGNÓSTICO OPERACIONAL</th>
                </tr>
              </thead>
              <tbody>
                {data.productDiagnostics.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "var(--spacing-lg)", textAlign: "center", color: "var(--text-muted)" }}>
                      Nenhum produto com telemetria no período.
                    </td>
                  </tr>
                ) : (
                  data.productDiagnostics.map((p) => {
                    const badgeColors = {
                      healthy: { bg: "var(--color-primary-subtle)", text: "var(--color-primary)", label: "✓ Saudável" },
                      low_exposure: { bg: "rgba(255, 255, 255, 0.05)", text: "var(--text-muted)", label: "⚠ Falta de Exposição" },
                      out_of_stock: { bg: "rgba(255, 170, 0, 0.15)", text: "var(--color-warning)", label: "⬡ Indisponibilidade" },
                      underperforming: { bg: "var(--color-danger-subtle)", text: "var(--color-danger)", label: "✗ Baixo Desempenho" },
                    }[p.diagnostic];

                    return (
                      <tr key={p.productId} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          <div>{p.productName}</div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>{p.categoryName}</div>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{p.totalViews}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>{p.totalCartAdds}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: p.totalOrders > 0 ? "var(--color-primary)" : "var(--text-muted)" }}>
                          {p.totalOrders}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", color: p.stockAvailable > 0 ? "var(--text-primary)" : "var(--color-danger)" }}>
                          {p.stockAvailable} un
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", backgroundColor: badgeColors.bg, color: badgeColors.text, fontWeight: 700, fontSize: "0.6875rem", marginBottom: "0.25rem" }}>
                            {badgeColors.label}
                          </div>
                          <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", maxWidth: "260px" }}>
                            {p.diagnosticMessage}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buscas Sem Resultados */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "var(--spacing-md) var(--spacing-lg)",
              borderBottom: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--color-primary)",
            }}
          >
            // BUSCAS SEM RESULTADOS (OPORTUNIDADES DE CATÁLOGO)
          </div>

          {data.unmatchedSearches.length === 0 ? (
            <div style={{ padding: "var(--spacing-lg)", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
              Nenhuma busca sem resultado registrada no período.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.unmatchedSearches.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>"{s.query}"</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{s.count} buscas</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(0, 255, 136, 0.02)", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            💡 Dica: Itens pesquisados frequentemente sem correspondência indicam alta demanda para modelagem e novos lotes na fábrica.
          </div>
        </div>
      </div>
    </div>
  );
}
