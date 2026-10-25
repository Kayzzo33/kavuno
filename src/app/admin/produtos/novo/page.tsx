import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminCategories, getAdminCampaigns } from "@/lib/admin/queries";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Novo Produto | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, campaigns] = await Promise.all([
    getAdminCategories(),
    getAdminCampaigns(),
  ]);

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "0.25rem",
          }}
        >
          // CATÁLOGO // NOVO PRODUTO
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
          CRIAR PRODUTO
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Preencha os dados do produto. Adicione variantes e imagens após salvar.
        </p>
      </div>

      <ProductForm categories={categories} campaigns={campaigns} />
    </div>
  );
}
