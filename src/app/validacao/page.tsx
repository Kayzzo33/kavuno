import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCampaigns } from "@/lib/catalog/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Validação de Demanda & Campanhas | 3D Commerce",
  description:
    "Descubra novos projetos e protótipos de peças 3D. Participe de campanhas de validação sem custo ou garanta lotes de pré-venda.",
};

export default async function ValidationPage() {
  const campaigns = await getActiveCampaigns();

  return (
    <div style={{ paddingTop: "var(--spacing-xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: "800px", marginBottom: "var(--spacing-2xl)" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--mode-interest)",
              marginBottom: "0.25rem",
            }}
          >
            // VALIDAÇÃO DE DEMANDA // CO-CRIAÇÃO COM A COMUNIDADE
          </div>
          <h1
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "var(--spacing-md)",
            }}
          >
            CAMPANHAS DE VALIDAÇÃO & LOTES ESPECIAIS
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Antes de iniciarmos a produção seriada de novos designs, abrimos listas de interesse para calibrar a viabilidade mecânica e financeira. Demonstre seu interesse sem custo e ajude a viabilizar novos produtos.
          </p>
        </div>

        {/* Lista de Campanhas Ativas */}
        {campaigns.length === 0 ? (
          <div
            style={{
              padding: "var(--spacing-2xl)",
              textAlign: "center",
              backgroundColor: "var(--bg-surface)",
              border: "1px dashed var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              [ NENHUMA CAMPANHA ATIVA NO MOMENTO ]
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
              Novos projetos são submetidos a cada quinzena. Navegue pelo catálogo para conferir os itens disponíveis.
            </p>
            <Link href="/catalogo" className="btn btn-primary">
              EXPLORAR CATÁLOGO
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "var(--spacing-xl)",
            }}
          >
            {campaigns.map((camp) => {
              const target = camp.target_min_units || 1;
              const pledged = camp.current_units_pledged || 0;
              const progressPercent = Math.min(100, Math.round((pledged / target) * 100));

              return (
                <Card
                  key={camp.id}
                  variant="bracket"
                  headerBadge={<Badge mode={camp.commercial_mode} />}
                  style={{ display: "flex", flexDirection: "column", height: "100%" }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {camp.title}
                  </h2>

                  {camp.description && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                        marginBottom: "var(--spacing-lg)",
                        flex: 1,
                      }}
                    >
                      {camp.description}
                    </p>
                  )}

                  {/* Barra de Progresso da Meta */}
                  <div style={{ marginBottom: "var(--spacing-lg)" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <span>META DO LOTE: {target} UNIDADES</span>
                      <strong style={{ color: "var(--text-primary)" }}>{progressPercent}%</strong>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: "var(--bg-canvas)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: "100%",
                          backgroundColor:
                            camp.commercial_mode === "pre_order"
                              ? "var(--mode-pre-order)"
                              : "var(--mode-interest)",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        color: "var(--text-secondary)",
                        marginTop: "0.35rem",
                      }}
                    >
                      {pledged} manifestações de interesse registradas
                    </div>
                  </div>

                  {/* Informações de Prazo */}
                  <div
                    style={{
                      padding: "0.625rem 0.75rem",
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "var(--spacing-lg)",
                    }}
                  >
                    PRAZO ESTIMADO DE PRODUÇÃO:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {camp.estimated_production_days ? `${camp.estimated_production_days} dias úteis` : "A definir"}
                    </strong>
                  </div>

                  <Link
                    href={`/catalogo?modalidade=${camp.commercial_mode}`}
                    className="btn btn-bracket"
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    VER PRODUTOS DESTA CAMPANHA
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
