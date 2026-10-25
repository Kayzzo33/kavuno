import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminProductById, getAdminCategories, getAdminCampaigns } from "@/lib/admin/queries";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantManager } from "@/components/admin/VariantManager";
import { ImageManager } from "@/components/admin/ImageManager";
import { Card } from "@/components/ui/Card";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getAdminProductById(id);
  return {
    title: product ? `Editar: ${product.name} | Admin` : "Produto não encontrado",
  };
}

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [product, categories, campaigns] = await Promise.all([
    getAdminProductById(id),
    getAdminCategories(),
    getAdminCampaigns(),
  ]);

  if (!product) notFound();

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "0.25rem",
          }}
        >
          // CATÁLOGO // EDITAR PRODUTO
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
          {product.name}
        </h1>
        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem", fontFamily: "var(--font-mono)" }}>
          ID: {product.id}
        </div>
      </div>

      {/* Formulário Principal */}
      <Card variant="bracket" style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          // DADOS GERAIS
        </div>
        <ProductForm product={product} categories={categories} campaigns={campaigns} />
      </Card>

      {/* Gestão de Variantes */}
      <Card variant="bracket" style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          // VARIANTES (SKU, MATERIAL, COR, PESO, TEMPO DE IMPRESSÃO)
        </div>
        <VariantManager product={product} />
      </Card>

      {/* Gestão de Imagens */}
      <Card variant="bracket">
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          // IMAGENS DO PRODUTO
        </div>
        <ImageManager product={product} />
      </Card>
    </div>
  );
}
