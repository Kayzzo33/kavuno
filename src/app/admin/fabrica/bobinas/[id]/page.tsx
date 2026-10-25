import React from "react";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect, notFound } from "next/navigation";
import { getSpoolById } from "@/lib/production/queries";
import type { FilamentMaterial, SpoolStatus, SpoolMovementType } from "@/types/database.types";

const MATERIAL_LABELS: Record<FilamentMaterial, string> = {
  pla: "PLA", petg: "PETG", abs: "ABS", asa: "ASA",
  tpu: "TPU", pc: "PC", nylon: "Nylon", other: "Outro",
};

const STATUS_LABELS: Record<SpoolStatus, string> = {
  sealed: "Lacrada", in_use: "Em uso", empty: "Vazia",
  discarded: "Descartada", lost: "Perdida",
};

const MOVEMENT_LABELS: Partial<Record<SpoolMovementType, string>> = {
  production_consumption: "Consumo Produção",
  waste_discard: "Descarte / Perda",
  manual_adjustment: "Ajuste Manual",
  initial_weight: "Peso Inicial",
  weigh_in: "Pesagem",
};

export default async function SpoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const { id } = await params;
  let spool: Awaited<ReturnType<typeof getSpoolById>>;
  try {
    spool = await getSpoolById(id);
  } catch {
    notFound();
  }

  const movements = (spool.filament_spool_movements as unknown[]) ?? [];
  const usedPercent =
    spool.initial_net_weight_g > 0
      ? Math.round((spool.current_weight_g / spool.initial_net_weight_g) * 100)
      : 0;

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--spacing-xl)", flexWrap: "wrap", gap: "var(--spacing-sm)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            // FÁBRICA → BOBINAS → {spool.label}
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {spool.label}
            {spool.color_hex && (
              <span style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: spool.color_hex, border: "1px solid var(--border-subtle)", display: "inline-block" }} />
            )}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", margin: "0.25rem 0 0", fontFamily: "var(--font-mono)" }}>
            {MATERIAL_LABELS[spool.material as FilamentMaterial]} · {spool.color_name}
            {spool.manufacturer ? ` · ${spool.manufacturer}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
          <Link
            href={`/admin/fabrica/bobinas/${id}/ajuste`}
            style={{ padding: "0.5rem 1rem", border: "1px solid var(--color-primary)", borderRadius: "var(--radius-sm)", color: "var(--color-primary)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}
          >
            ± AJUSTE DE PESO
          </Link>
          <Link
            href="/admin/fabrica/bobinas"
            style={{ padding: "0.5rem 1rem", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", textDecoration: "none" }}
          >
            ← VOLTAR
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        {[
          { label: "Status", value: STATUS_LABELS[spool.status as SpoolStatus] ?? spool.status },
          { label: "Peso atual", value: `${(spool.current_weight_g ?? 0).toFixed(1)} g` },
          { label: "Peso líquido inicial", value: `${(spool.initial_net_weight_g ?? 0).toFixed(1)} g` },
          { label: "Custo/g", value: `R$ ${(spool.cost_per_gram ?? 0).toFixed(4)}` },
          { label: "Custo total", value: `R$ ${(spool.total_acquisition_cost ?? 0).toFixed(2)}` },
          { label: "Utilização", value: `${100 - usedPercent}% usado` },
        ].map((m) => (
          <div key={m.label} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-md)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Barra de progresso de peso */}
      <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)", marginBottom: "var(--spacing-xl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          <span>FILAMENTO RESTANTE</span>
          <span>{usedPercent}% disponível</span>
        </div>
        <div style={{ height: "8px", backgroundColor: "var(--bg-canvas)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${usedPercent}%`, backgroundColor: usedPercent > 30 ? "var(--color-success)" : usedPercent > 10 ? "var(--color-warning)" : "var(--color-danger)", borderRadius: "4px", transition: "width 0.4s ease" }} />
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          {(spool.current_weight_g ?? 0).toFixed(1)} g restantes de {(spool.initial_net_weight_g ?? 0).toFixed(1)} g
        </div>
      </div>

      {/* Histórico de movimentações */}
      <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--spacing-md)" }}>
          HISTÓRICO DE MOVIMENTAÇÕES ({movements.length})
        </div>
        {movements.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
            Nenhuma movimentação registrada.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {["Data", "Tipo", "Qtd (g)", "Antes (g)", "Depois (g)", "Nota"].map((h) => (
                    <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.6875rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(movements as Array<{
                  id: string;
                  created_at: string;
                  movement_type: SpoolMovementType;
                  quantity_g: number;
                  weight_before_g: number;
                  weight_after_g: number;
                  reference_note?: string;
                }>).map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-muted)" }}>
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-secondary)" }}>
                      {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem", color: m.quantity_g > 0 ? "var(--color-danger)" : "var(--color-success)", fontWeight: 700 }}>
                      {m.quantity_g > 0 ? "-" : "+"}{Math.abs(m.quantity_g).toFixed(2)}
                    </td>
                    <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-muted)" }}>{(m.weight_before_g ?? 0).toFixed(2)}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-primary)", fontWeight: 700 }}>{(m.weight_after_g ?? 0).toFixed(2)}</td>
                    <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.reference_note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
