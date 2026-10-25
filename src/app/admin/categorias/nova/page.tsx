import React from "react";
import type { Metadata } from "next";
import { getAdminCategories } from "@/lib/admin/queries";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata: Metadata = {
  title: "Nova Categoria | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const categories = await getAdminCategories();

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "0.25rem",
          }}
        >
          // CATÁLOGO // NOVA CATEGORIA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
          CRIAR CATEGORIA
        </h1>
      </div>
      <CategoryForm categories={categories} />
    </div>
  );
}
