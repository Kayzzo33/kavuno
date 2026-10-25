"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import type { Database } from "@/types/database.types";
import { updateCategoryAction } from "@/lib/admin/actions";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface AdminCategoriesTableProps {
  categories: Category[];
}

export function AdminCategoriesTable({ categories }: AdminCategoriesTableProps) {
  const [isPending, startTransition] = useTransition();

  if (categories.length === 0) {
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
          [ NENHUMA CATEGORIA CADASTRADA ]
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Crie a primeira categoria para organizar o catálogo.
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
            {["NOME", "SLUG", "ORDEM", "STATUS", "AÇÕES"].map((h) => (
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
          {categories.map((cat, i) => (
            <tr
              key={cat.id}
              style={{
                borderBottom: i < categories.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                opacity: !cat.is_active ? 0.6 : 1,
              }}
            >
              <td style={{ padding: "0.75rem 0.875rem" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {cat.name}
                </div>
                {cat.description && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                    {cat.description.length > 60 ? cat.description.slice(0, 60) + "..." : cat.description}
                  </div>
                )}
              </td>
              <td style={{ padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                /{cat.slug}
              </td>
              <td style={{ padding: "0.75rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center" }}>
                {cat.display_order}
              </td>
              <td style={{ padding: "0.75rem 0.875rem" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: cat.is_active ? "var(--mode-in-stock)" : "var(--text-muted)",
                  }}
                >
                  <span className="badge-dot" style={{ backgroundColor: cat.is_active ? "var(--mode-in-stock)" : "var(--text-muted)" }} />
                  {cat.is_active ? "ATIVA" : "INATIVA"}
                </span>
              </td>
              <td style={{ padding: "0.75rem 0.875rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link
                    href={`/admin/categorias/${cat.id}/editar`}
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
                      color: cat.is_active ? "var(--status-error)" : "var(--mode-in-stock)",
                      opacity: isPending ? 0.5 : 1,
                    }}
                    disabled={isPending}
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("id", cat.id);
                      formData.set("name", cat.name);
                      formData.set("slug", cat.slug);
                      formData.set("is_active", String(!cat.is_active));
                      formData.set("display_order", String(cat.display_order));
                      startTransition(async () => {
                        await updateCategoryAction(null, formData);
                      });
                    }}
                  >
                    {cat.is_active ? "DESATIVAR" : "ATIVAR"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
