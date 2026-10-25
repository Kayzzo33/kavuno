import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCategories } from "@/lib/admin/queries";
import { AdminCategoriesTable } from "@/components/admin/AdminCategoriesTable";

export const metadata: Metadata = {
  title: "Categorias | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--spacing-xl)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-primary)",
              marginBottom: "0.25rem",
            }}
          >
            // CATÁLOGO // SEGMENTOS
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
            CATEGORIAS
          </h1>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {categories.length} categoria(s) cadastrada(s)
          </div>
        </div>
        <Link href="/admin/categorias/nova" className="btn btn-primary">
          + NOVA CATEGORIA
        </Link>
      </div>

      <AdminCategoriesTable categories={categories} />
    </div>
  );
}
