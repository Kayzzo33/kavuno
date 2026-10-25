import React from "react";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect } from "next/navigation";
import { listSpools } from "@/lib/production/queries";
import type { FilamentMaterial, SpoolStatus } from "@/types/database.types";

export const metadata = { title: "Bobinas de Filamento | Admin" };

const MATERIAL_LABELS: Record<FilamentMaterial, string> = {
  pla: "PLA", petg: "PETG", abs: "ABS", asa: "ASA",
  tpu: "TPU", pc: "PC", nylon: "Nylon", other: "Outro",
};

const STATUS_LABELS: Record<SpoolStatus, string> = {
  sealed: "Lacrada", in_use: "Em uso", empty: "Vazia",
  discarded: "Descartada", lost: "Perdida",
};

const STATUS_COLORS: Record<SpoolStatus, string> = {
  sealed: "var(--color-info)",
  in_use: "var(--color-success)",
  empty: "var(--text-muted)",
  discarded: "var(--color-danger)",
  lost: "var(--color-warning)",
};

export default async function SpoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string; status?: string; page?: string }>;
}) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const params = await searchParams;
  const material = params.material as FilamentMaterial | undefined;
  const status = params.status as SpoolStatus | undefined;
  const page = parseInt(params.page ?? "1", 10);

  const { spools, total, pageSize } = await listSpools({ material, status, page });
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--spacing-lg)", flexWrap: "wrap", gap: "var(--spacing-sm)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            // FÁBRICA → BOBINAS
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
            BOBINAS DE FILAMENTO ({total})
          </h1>
        </div>
        <Link
          href="/admin/fabrica/bobinas/nova"
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: "var(--color-primary)",
            color: "#000",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "0.8125rem",
            textDecoration: "none",
          }}
        >
          + NOVA BOBINA
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" style={{ display: "flex", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-lg)", flexWrap: "wrap" }}>
        <select name="material" defaultValue={material ?? ""} style={{ padding: "0.4rem 0.75rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
          <option value="">Todos os materiais</option>
          {Object.entries(MATERIAL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} style={{ padding: "0.4rem 0.75rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button type="submit" style={{ padding: "0.4rem 1rem", backgroundColor: "var(--color-primary-subtle)", border: "1px solid var(--color-primary)", borderRadius: "var(--radius-sm)", color: "var(--color-primary)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", cursor: "pointer" }}>
          FILTRAR
        </button>
        <Link href="/admin/fabrica/bobinas" style={{ padding: "0.4rem 0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", textDecoration: "none" }}>
          Limpar
        </Link>
      </form>

      {/* Tabela */}
      {spools.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Nenhuma bobina encontrada. <Link href="/admin/fabrica/bobinas/nova" style={{ color: "var(--color-primary)" }}>Cadastrar primeira.</Link>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Bobina", "Material", "Cor", "Peso atual", "Custo/g", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.6875rem", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spools.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.75rem", color: "var(--text-primary)", fontWeight: 700 }}>{s.label}</td>
                  <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>{MATERIAL_LABELS[s.material as FilamentMaterial]}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      {s.color_hex && (
                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: s.color_hex, border: "1px solid var(--border-subtle)", display: "inline-block" }} />
                      )}
                      {s.color_name}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--text-primary)" }}>
                    {(s.current_weight_g ?? 0).toFixed(1)} g
                  </td>
                  <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>
                    R$ {(s.cost_per_gram ?? 0).toFixed(4)}/g
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ color: STATUS_COLORS[s.status as SpoolStatus] ?? "var(--text-muted)", fontWeight: 700, fontSize: "0.6875rem" }}>
                      {STATUS_LABELS[s.status as SpoolStatus] ?? s.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <Link href={`/admin/fabrica/bobinas/${s.id}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>
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
            <Link
              key={p}
              href={`?page=${p}${material ? `&material=${material}` : ""}${status ? `&status=${status}` : ""}`}
              style={{
                padding: "0.4rem 0.75rem",
                border: `1px solid ${p === page ? "var(--color-primary)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                color: p === page ? "var(--color-primary)" : "var(--text-secondary)",
                textDecoration: "none",
                backgroundColor: p === page ? "var(--color-primary-subtle)" : "transparent",
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
