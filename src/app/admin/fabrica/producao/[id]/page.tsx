import React from "react";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect, notFound } from "next/navigation";
import { getProductionOrderById } from "@/lib/production/queries";
import type { ProductionStatus } from "@/types/database.types";
import { updateProductionOrderStatusAction } from "../../actions";

const STATUS_LABELS: Record<ProductionStatus, string> = {
  queued: "Na fila",
  slicing: "Fatiando",
  printing: "Imprimindo",
  post_processing: "Pós-processamento",
  quality_check: "Controle de Qualidade",
  completed: "Concluída",
  failed: "Falhou",
};

const STATUS_FLOW: Record<ProductionStatus, ProductionStatus[]> = {
  queued: ["slicing", "printing"],
  slicing: ["printing"],
  printing: ["post_processing", "failed"],
  post_processing: ["quality_check", "failed"],
  quality_check: ["completed", "failed"],
  completed: [],
  failed: ["queued"],
};

export default async function ProductionOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const { id } = await params;
  let order: Awaited<ReturnType<typeof getProductionOrderById>>;
  try {
    order = await getProductionOrderById(id);
  } catch {
    notFound();
  }

  const nextStatuses = STATUS_FLOW[order.status as ProductionStatus] ?? [];
  const spoolLinks = (order.production_order_spools as Array<{
    id: string;
    consumed_g: number;
    spool_id: string;
    filament_spools: { label: string; material: string; color_name: string; color_hex?: string } | null;
  }>) ?? [];

  const costs = (order.production_order_costs as Array<{
    id: string;
    cost_type: string;
    description?: string;
    estimated_amount: number;
    actual_amount?: number;
  }>) ?? [];

  const totalEstimated = costs.reduce((acc, c) => acc + (c.estimated_amount ?? 0), 0);
  const totalActual = costs.reduce((acc, c) => acc + (c.actual_amount ?? 0), 0);

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--spacing-xl)", flexWrap: "wrap", gap: "var(--spacing-sm)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            // FÁBRICA → PRODUÇÃO → {order.order_number}
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
            {order.order_number}
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>
            {(order.products as { name: string } | null)?.name ?? "—"} ·{" "}
            {(order.product_variants as { variant_name: string; sku: string } | null)?.variant_name ?? "—"}
          </p>
        </div>
        <Link
          href="/admin/fabrica/producao"
          style={{ padding: "0.5rem 1rem", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", textDecoration: "none" }}
        >
          ← VOLTAR
        </Link>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        {[
          { label: "Status", value: STATUS_LABELS[order.status as ProductionStatus] },
          { label: "Planejado", value: `${order.planned_quantity} un.` },
          { label: "Produzido", value: `${order.produced_quantity} un.` },
          { label: "Refugos", value: `${order.rejected_quantity} un.` },
          { label: "Filamento est.", value: `${order.estimated_filament_g.toFixed(1)} g` },
          { label: "Filamento real", value: `${order.actual_filament_g.toFixed(1)} g` },
          { label: "Desperdício", value: `${order.waste_filament_g.toFixed(1)} g` },
          { label: "Tempo est.", value: `${order.estimated_machine_minutes} min` },
          { label: "Tempo real", value: `${order.actual_machine_minutes} min` },
          { label: "Reimpressões", value: String(order.reprint_count) },
        ].map((m) => (
          <div key={m.label} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-md)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{m.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Avançar Status */}
      {nextStatuses.length > 0 && (
        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)", marginBottom: "var(--spacing-xl)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--spacing-md)" }}>
            AVANÇAR STATUS
          </div>
          <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
            {nextStatuses.map((s) => (
              <form key={s} action={updateProductionOrderStatusAction.bind(null, id)}>
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  style={{ padding: "0.5rem 1rem", backgroundColor: s === "failed" ? "var(--color-danger-subtle)" : "var(--color-primary-subtle)", border: `1px solid ${s === "failed" ? "var(--color-danger)" : "var(--color-primary)"}`, borderRadius: "var(--radius-sm)", color: s === "failed" ? "var(--color-danger)" : "var(--color-primary)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}
                >
                  → {STATUS_LABELS[s]}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-xl)" }}>
        {/* Bobinas utilizadas */}
        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              BOBINAS UTILIZADAS ({spoolLinks.length})
            </div>
            <Link
              href={`/admin/fabrica/producao/${id}/bobina`}
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", textDecoration: "none" }}
            >
              + ADICIONAR
            </Link>
          </div>
          {spoolLinks.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
              Nenhuma bobina vinculada.
            </p>
          ) : (
            spoolLinks.map((sl) => (
              <div key={sl.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.8125rem", color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    {sl.filament_spools?.color_hex && (
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: sl.filament_spools.color_hex, display: "inline-block" }} />
                    )}
                    {sl.filament_spools?.label ?? sl.spool_id}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    {sl.filament_spools?.material?.toUpperCase()} · {sl.filament_spools?.color_name}
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.8125rem" }}>
                  {sl.consumed_g.toFixed(1)} g
                </span>
              </div>
            ))
          )}
        </div>

        {/* Custos */}
        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--spacing-md)" }}>
            CUSTOS DETALHADOS
          </div>
          {costs.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>Sem custos registrados.</p>
          ) : (
            <>
              {costs.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                  <div>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, textTransform: "capitalize" }}>{c.cost_type}</span>
                    {c.description && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}> — {c.description}</span>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "var(--text-secondary)" }}>Est: R$ {c.estimated_amount.toFixed(2)}</div>
                    {c.actual_amount != null && (
                      <div style={{ color: "var(--color-success)", fontWeight: 700 }}>Real: R$ {c.actual_amount.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 700 }}>
                <span style={{ color: "var(--text-primary)" }}>TOTAL</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--text-secondary)" }}>Est: R$ {totalEstimated.toFixed(2)}</div>
                  {totalActual > 0 && <div style={{ color: "var(--color-success)" }}>Real: R$ {totalActual.toFixed(2)}</div>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notas */}
      {(order.notes || order.failure_notes || order.adjustment_reason) && (
        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)", marginTop: "var(--spacing-xl)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--spacing-sm)" }}>ANOTAÇÕES</div>
          {order.notes && <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "0 0 0.5rem" }}>{order.notes}</p>}
          {order.failure_notes && <p style={{ color: "var(--color-danger)", fontSize: "0.875rem", fontFamily: "var(--font-mono)", margin: "0 0 0.5rem" }}>⚠ {order.failure_notes}</p>}
          {order.adjustment_reason && <p style={{ color: "var(--color-warning)", fontSize: "0.875rem", fontFamily: "var(--font-mono)", margin: 0 }}>↺ {order.adjustment_reason}</p>}
        </div>
      )}
    </div>
  );
}
