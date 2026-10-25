"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import type { Database } from "@/types/database.types";
import { updateCampaignStatusAction } from "@/lib/admin/actions";

type CampaignWithCount = Database["public"]["Tables"]["campaigns"]["Row"] & {
  products: { count: number }[];
};

interface AdminCampaignsTableProps {
  campaigns: CampaignWithCount[];
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "RASCUNHO", color: "var(--text-muted)" },
  active: { label: "ATIVA", color: "var(--mode-in-stock)" },
  completed: { label: "CONCLUÍDA", color: "var(--color-primary)" },
  cancelled: { label: "CANCELADA", color: "var(--status-error)" },
};

const modeMap: Record<string, string> = {
  in_stock: "Pronta Entrega",
  pre_order: "Pré-venda Paga",
  interest_lead: "Validação / Demanda",
};

export function AdminCampaignsTable({ campaigns }: AdminCampaignsTableProps) {
  const [isPending, startTransition] = useTransition();

  if (campaigns.length === 0) {
    return (
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
        <div style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          [ NENHUMA CAMPANHA CADASTRADA ]
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Crie campanhas para viabilizar lotes de pré-venda ou validações de demanda.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--bg-canvas)", borderBottom: "1px solid var(--border-subtle)" }}>
            {["CAMPANHA", "MODALIDADE", "META / LIMITES", "STATUS", "PRODUTOS", "AÇÕES"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "0.625rem 0.875rem",
                  textAlign: "left",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((camp, i) => {
            const st = statusMap[camp.status] || { label: camp.status, color: "var(--text-muted)" };
            const prodCount = camp.products?.[0]?.count ?? 0;

            return (
              <tr
                key={camp.id}
                style={{
                  borderBottom: i < campaigns.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                  opacity: camp.status === "cancelled" ? 0.6 : 1,
                }}
              >
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {camp.title}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    /{camp.slug}
                  </div>
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {modeMap[camp.commercial_mode] || camp.commercial_mode}
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <div>Mínimo: {camp.target_min_units} un</div>
                  {camp.max_units_limit && <div>Limite: {camp.max_units_limit} un</div>}
                  {camp.estimated_production_days && <div>Prazo prod: {camp.estimated_production_days}d</div>}
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      color: st.color,
                      fontWeight: 700,
                    }}
                  >
                    <span className="badge-dot" style={{ backgroundColor: st.color }} />
                    {st.label}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                  {prodCount} vinculado(s)
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {camp.status !== "active" && (
                      <button
                        className="btn btn-bracket"
                        style={{ fontSize: "0.6875rem", padding: "0.3rem 0.6rem", color: "var(--mode-in-stock)" }}
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            await updateCampaignStatusAction(camp.id, "active");
                          });
                        }}
                      >
                        ATIVAR
                      </button>
                    )}
                    {camp.status === "active" && (
                      <button
                        className="btn btn-bracket"
                        style={{ fontSize: "0.6875rem", padding: "0.3rem 0.6rem", color: "var(--color-primary)" }}
                        disabled={isPending}
                        onClick={() => {
                          startTransition(async () => {
                            await updateCampaignStatusAction(camp.id, "completed");
                          });
                        }}
                      >
                        CONCLUIR
                      </button>
                    )}
                    {camp.status !== "cancelled" && (
                      <button
                        className="btn btn-bracket"
                        style={{ fontSize: "0.6875rem", padding: "0.3rem 0.6rem", color: "var(--status-error)" }}
                        disabled={isPending}
                        onClick={() => {
                          if (confirm(`Cancelar a campanha "${camp.title}"?`)) {
                            startTransition(async () => {
                              await updateCampaignStatusAction(camp.id, "cancelled");
                            });
                          }
                        }}
                      >
                        CANCELAR
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
