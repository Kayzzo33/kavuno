import React from "react";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect } from "next/navigation";
import { listProductionOrders } from "@/lib/production/queries";
import type { ProductionStatus } from "@/types/database.types";

export const metadata = { title: "Ordens de Produção | Admin" };

const STATUS_LABELS: Record<ProductionStatus, string> = {
  queued: "Na fila",
  slicing: "Fatiando",
  printing: "Imprimindo",
  post_processing: "Pós-proc.",
  quality_check: "Controle Q.",
  completed: "Concluída",
  failed: "Falhou",
};

const STATUS_COLORS: Record<ProductionStatus, string> = {
  queued: "var(--text-muted)",
  slicing: "var(--color-info)",
  printing: "var(--color-primary)",
  post_processing: "var(--color-warning)",
  quality_check: "var(--color-info)",
  completed: "var(--color-success)",
  failed: "var(--color-danger)",
};

export default async function ProductionOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const params = await searchParams;
  const status = params.status as ProductionStatus | undefined;
  const page = parseInt(params.page ?? "1", 10);

  const { orders, total, pageSize } = await listProductionOrders({ status, page });
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--spacing-lg)", flexWrap: "wrap", gap: "var(--spacing-sm)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            // FÁBRICA → PRODUÇÃO
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
            ORDENS DE PRODUÇÃO ({total})
          </h1>
        </div>
        <Link
          href="/admin/fabrica/producao/nova"
          style={{ padding: "0.5rem 1.25rem", backgroundColor: "var(--color-primary)", color: "#000", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.8125rem", textDecoration: "none" }}
        >
          + NOVA ORDEM
        </Link>
      </div>

      {/* Filtros de status */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "var(--spacing-lg)", flexWrap: "wrap" }}>
        <Link
          href="/admin/fabrica/producao"
          style={{ padding: "0.35rem 0.75rem", border: `1px solid ${!status ? "var(--color-primary)" : "var(--border-subtle)"}`, borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: !status ? "var(--color-primary)" : "var(--text-muted)", textDecoration: "none", backgroundColor: !status ? "var(--color-primary-subtle)" : "transparent" }}
        >
          Todos
        </Link>
        {(Object.keys(STATUS_LABELS) as ProductionStatus[]).map((s) => (
          <Link
            key={s}
            href={`?status=${s}`}
            style={{ padding: "0.35rem 0.75rem", border: `1px solid ${status === s ? STATUS_COLORS[s] : "var(--border-subtle)"}`, borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: status === s ? STATUS_COLORS[s] : "var(--text-muted)", textDecoration: "none" }}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Nenhuma ordem encontrada. <Link href="/admin/fabrica/producao/nova" style={{ color: "var(--color-primary)" }}>Criar primeira.</Link>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Nº Ordem", "Produto / Variante", "Status", "Planejado", "Produzido", "Desperdício", "Data", ""].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.6875rem", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(orders as Array<{
                id: string;
                order_number: string;
                status: ProductionStatus;
                planned_quantity: number;
                produced_quantity: number;
                waste_filament_g: number;
                queued_at: string;
                products?: { name: string } | null;
                product_variants?: { variant_name: string } | null;
              }>).map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.75rem", color: "var(--color-primary)", fontWeight: 700 }}>{o.order_number}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{o.products?.name ?? "—"}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{o.product_variants?.variant_name ?? "—"}</div>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ color: STATUS_COLORS[o.status], fontWeight: 700, fontSize: "0.75rem" }}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{o.planned_quantity}</td>
                  <td style={{ padding: "0.75rem", color: "var(--text-primary)", fontWeight: 700 }}>{o.produced_quantity}</td>
                  <td style={{ padding: "0.75rem", color: o.waste_filament_g > 0 ? "var(--color-warning)" : "var(--text-muted)" }}>
                    {(o.waste_filament_g ?? 0).toFixed(1)} g
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {new Date(o.queued_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <Link href={`/admin/fabrica/producao/${o.id}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                      VER →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "var(--spacing-lg)" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?page=${p}${status ? `&status=${status}` : ""}`} style={{ padding: "0.4rem 0.75rem", border: `1px solid ${p === page ? "var(--color-primary)" : "var(--border-subtle)"}`, borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: p === page ? "var(--color-primary)" : "var(--text-secondary)", textDecoration: "none", backgroundColor: p === page ? "var(--color-primary-subtle)" : "transparent" }}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
