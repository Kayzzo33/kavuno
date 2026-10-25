import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogProducts, getActiveCategories } from "@/lib/catalog/queries";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductFilters } from "@/components/catalog/ProductFilters";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { CommercialMode } from "@/types/database.types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo de Produtos | 3D Commerce",
  description:
    "Explore produtos e peças técnicas impressas em 3D. Pronta entrega, pré-vendas exclusivas e validação de projetos sob demanda.",
};

interface CatalogPageProps {
  searchParams: Promise<{
    search?: string;
    categoria?: string;
    modalidade?: string;
    ordenar?: string;
    pagina?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = await searchParams;

  const page = resolvedParams.pagina ? parseInt(resolvedParams.pagina, 10) : 1;
  const commercialMode = (resolvedParams.modalidade as CommercialMode) || undefined;
  const sort = (resolvedParams.ordenar as "price_asc" | "price_desc" | "newest") || "newest";

  const [catalogData, categories] = await Promise.all([
    getCatalogProducts({
      search: resolvedParams.search,
      categorySlug: resolvedParams.categoria,
      commercialMode,
      sort,
      page,
      limit: 12,
    }),
    getActiveCategories(),
  ]);

  const { products, total, totalPages } = catalogData;

  return (
    <div style={{ paddingTop: "var(--spacing-xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        {/* Cabeçalho do Catálogo */}
        <div style={{ marginBottom: "var(--spacing-lg)" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-primary)",
              marginBottom: "0.25rem",
            }}
          >
            // CATÁLOGO // PRODUTOS & MANUFATURA ADITIVA
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700 }}>
            CATÁLOGO DE PRODUTOS
          </h1>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {total === 0 ? "Nenhum produto encontrado" : `${total} produto(s) disponível(is)`}
          </div>
        </div>

        {/* Filtros e Barra de Pesquisa */}
        <Suspense
          fallback={
            <div style={{ padding: "1rem", textAlign: "center" }}>
              <LoadingSpinner size="sm" text="Carregando filtros..." />
            </div>
          }
        >
          <ProductFilters categories={categories} />
        </Suspense>

        {/* Grid de Produtos */}
        {products.length === 0 ? (
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
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              [ NENHUM PRODUTO ENCONTRADO ]
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
              Nenhum modelo cadastrado corresponde aos critérios ou filtros selecionados. Novos lotes e produtos são adicionados continuamente.
            </p>
            <Link href="/catalogo" className="btn btn-bracket">
              LIMPAR FILTROS // VER TODOS
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "var(--spacing-lg)",
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
              marginTop: "var(--spacing-2xl)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
            }}
          >
            {page > 1 ? (
              <Link
                href={`/catalogo?pagina=${page - 1}`}
                className="btn btn-bracket"
                style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}
              >
                &larr; ANTERIOR
              </Link>
            ) : (
              <span className="btn btn-bracket" style={{ opacity: 0.4, cursor: "not-allowed", fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}>
                &larr; ANTERIOR
              </span>
            )}

            <span style={{ color: "var(--text-secondary)" }}>
              PÁGINA <strong style={{ color: "var(--text-primary)" }}>{page}</strong> DE <strong style={{ color: "var(--text-primary)" }}>{totalPages}</strong>
            </span>

            {page < totalPages ? (
              <Link
                href={`/catalogo?pagina=${page + 1}`}
                className="btn btn-bracket"
                style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}
              >
                PRÓXIMA &rarr;
              </Link>
            ) : (
              <span className="btn btn-bracket" style={{ opacity: 0.4, cursor: "not-allowed", fontSize: "0.75rem", padding: "0.4rem 0.8rem" }}>
                PRÓXIMA &rarr;
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
