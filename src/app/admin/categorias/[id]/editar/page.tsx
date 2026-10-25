import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminCategories } from "@/lib/admin/queries";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata: Metadata = {
  title: "Editar Categoria | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const categories = await getAdminCategories();
  const category = categories.find((c) => c.id === id);

  if (!category) {
    notFound();
  }

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
          // CATÁLOGO // EDIÇÃO DE CATEGORIA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
          EDITAR CATEGORIA
        </h1>
        <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          ID: {category.id}
        </div>
      </div>
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
