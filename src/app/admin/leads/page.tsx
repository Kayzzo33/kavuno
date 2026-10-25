import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminLeads, getAdminProducts } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Leads de Interesse | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

interface AdminLeadsPageProps {
  searchParams: Promise<{
    produto?: string;
    pagina?: string;
  }>;
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const params = await searchParams;
  const page = params.pagina ? parseInt(params.pagina, 10) : 1;

  const [{ leads, total, totalPages }, { products }] = await Promise.all([
    getAdminLeads({
      productId: params.produto,
      page,
      limit: 25,
    }),
    getAdminProducts({ limit: 100 }),
  ]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--mode-interest)",
            marginBottom: "0.25rem",
          }}
        >
          // VALIDAÇÃO DE MERCADO // RESERVAS GRATUITAS
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
          LEADS DE INTERESSE
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Manifestações de interesse espontâneas captadas no catálogo e páginas de validação.
          Não constituem pedidos pagos, garantias de estoque ou transações financeiras.
        </p>
      </div>

      {/* Filtros */}
      <form
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "var(--spacing-lg)",
          padding: "var(--spacing-md)",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <select
          name="produto"
          defaultValue={params.produto || ""}
          className="form-select"
          style={{ minWidth: "240px", flex: 1 }}
        >
          <option value="">Todos os produtos com interesse</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.commercial_mode})
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-bracket">
          FILTRAR
        </button>
        <Link href="/admin/leads" className="btn btn-bracket">
          LIMPAR
        </Link>
      </form>

      {/* Tabela de Leads */}
      {leads.length === 0 ? (
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
            [ NENHUM LEAD DE INTERESSE ENCONTRADO ]
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Conforme os visitantes manifestarem interesse nos produtos em validação, os contatos serão listados aqui.
          </p>
        </div>
      ) : (
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
                {["DATA", "NOME", "CONTATO", "PRODUTO / VARIANTE", "OBSERVAÇÕES"].map((h) => (
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
              {leads.map((lead: any, i: number) => {
                const dateStr = lead.created_at
                  ? new Date(lead.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";

                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: i < leads.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                    }}
                  >
                    <td style={{ padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {dateStr}
                    </td>
                    <td style={{ padding: "0.75rem 0.875rem" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {lead.full_name}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      <div style={{ color: "var(--color-primary)" }}>{lead.email}</div>
                      {lead.whatsapp_phone && (
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                          Tel: {lead.whatsapp_phone}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 0.875rem" }}>
                      {lead.product ? (
                        <div>
                          <Link
                            href={`/produtos/${lead.product.slug}`}
                            target="_blank"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.8125rem",
                              color: "var(--text-primary)",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            {lead.product.name} ↗
                          </Link>
                          {lead.variant && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                              Var: {lead.variant.variant_name} ({lead.variant.color_name})
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Geral / Sem produto</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 0.875rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                      {lead.notes || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            marginTop: "var(--spacing-xl)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
          }}
        >
          {page > 1 ? (
            <Link
              href={`/admin/leads?pagina=${page - 1}${params.produto ? `&produto=${params.produto}` : ""}`}
              className="btn btn-bracket"
            >
              ← ANTERIOR
            </Link>
          ) : (
            <span className="btn btn-bracket" style={{ opacity: 0.4 }}>← ANTERIOR</span>
          )}
          <span style={{ color: "var(--text-secondary)" }}>
            PÁGINA <strong style={{ color: "var(--text-primary)" }}>{page}</strong> DE{" "}
            <strong style={{ color: "var(--text-primary)" }}>{totalPages}</strong> ({total} leads)
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/leads?pagina=${page + 1}${params.produto ? `&produto=${params.produto}` : ""}`}
              className="btn btn-bracket"
            >
              PRÓXIMA →
            </Link>
          ) : (
            <span className="btn btn-bracket" style={{ opacity: 0.4 }}>PRÓXIMA →</span>
          )}
        </div>
      )}
    </div>
  );
}
