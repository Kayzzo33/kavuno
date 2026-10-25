"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import type { AdminProduct } from "@/lib/admin/queries";
import { toggleProductActiveAction } from "@/lib/admin/actions";
import { Badge } from "@/components/ui/Badge";

interface AdminProductsTableProps {
  products: AdminProduct[];
}

const modeLabel: Record<string, string> = {
  in_stock: "Pronta Entrega",
  pre_order: "Pré-venda",
  interest_lead: "Reserva",
};

export function AdminProductsTable({ products }: AdminProductsTableProps) {
  const [isPending, startTransition] = useTransition();

  if (products.length === 0) {
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
          [ NENHUM PRODUTO ENCONTRADO ]
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Crie o primeiro produto ou ajuste os filtros de busca.
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
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                backgroundColor: "var(--bg-canvas)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {["PRODUTO", "MODALIDADE", "PREÇO BASE", "VARIANTES", "STATUS", "AÇÕES"].map(
                (header) => (
                  <th
                    key={header}
                    style={{
                      padding: "0.625rem 0.875rem",
                      textAlign: "left",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product, i) => (
              <tr
                key={product.id}
                style={{
                  borderBottom: i < products.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                  backgroundColor: !product.is_active ? "rgba(0,0,0,0.04)" : undefined,
                  opacity: !product.is_active ? 0.7 : 1,
                }}
              >
                {/* Nome e slug */}
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "0.125rem",
                    }}
                  >
                    {product.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    /{product.slug}
                  </div>
                </td>

                {/* Modalidade */}
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <Badge mode={product.commercial_mode} />
                </td>

                {/* Preço */}
                <td
                  style={{
                    padding: "0.75rem 0.875rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.875rem",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    product.base_price
                  )}
                  {product.promotional_price && (
                    <div style={{ fontSize: "0.6875rem", color: "var(--mode-in-stock)" }}>
                      Promo:{" "}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        product.promotional_price
                      )}
                    </div>
                  )}
                </td>

                {/* Variantes */}
                <td
                  style={{
                    padding: "0.75rem 0.875rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    textAlign: "center",
                  }}
                >
                  {product.variants?.length || 0}
                </td>

                {/* Status */}
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      color: product.is_active ? "var(--mode-in-stock)" : "var(--text-muted)",
                    }}
                  >
                    <span
                      className="badge-dot"
                      style={{
                        backgroundColor: product.is_active
                          ? "var(--mode-in-stock)"
                          : "var(--text-muted)",
                      }}
                    />
                    {product.is_active ? "ATIVO" : "INATIVO"}
                  </span>
                </td>

                {/* Ações */}
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "nowrap" }}>
                    <Link
                      href={`/admin/produtos/${product.id}/editar`}
                      className="btn btn-bracket"
                      style={{ fontSize: "0.6875rem", padding: "0.3rem 0.6rem" }}
                    >
                      EDITAR
                    </Link>
                    <button
                      className="btn btn-bracket"
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.3rem 0.6rem",
                        color: product.is_active ? "var(--status-error)" : "var(--mode-in-stock)",
                        opacity: isPending ? 0.5 : 1,
                      }}
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          await toggleProductActiveAction(product.id, !product.is_active);
                        });
                      }}
                    >
                      {product.is_active ? "DESATIVAR" : "ATIVAR"}
                    </button>
                    <Link
                      href={`/produtos/${product.slug}`}
                      target="_blank"
                      className="btn btn-bracket"
                      style={{ fontSize: "0.6875rem", padding: "0.3rem 0.6rem" }}
                    >
                      VER ↗
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
