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
  title: "Catálogo de Produtos | KAVUNO 3D",
  description:
    "Explore action figures, suportes de setup e peças mecânicas impressas em 3D de alta precisão. Pronta entrega com envio rápido.",
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
      limit: 16,
    }),
    getActiveCategories(),
  ]);

  const { products, total, totalPages } = catalogData;

  return (
    <div style={{ paddingTop: "var(--spacing-xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        {/* Cabeçalho do Catálogo */}
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            <Link href="/" style={{ color: "var(--text-secondary)" }}>Início</Link>
            <span>/</span>
            <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Catálogo</span>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Produtos & Impressão 3D
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {total === 0 ? "Nenhum produto encontrado" : `Exibindo ${total} produto(s) disponível(is)`}
          </p>
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
              padding: "4rem 2rem",
              textAlign: "center",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Nenhum produto encontrado
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", maxWidth: "440px", margin: "0 auto 1.5rem" }}>
              Tente buscar por termos mais genéricos ou limpe os filtros para ver todas as peças disponíveis.
            </p>
            <Link href="/catalogo" className="btn btn-primary" style={{ padding: "0.65rem 1.5rem" }}>
              Ver Todos os Produtos
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.5rem",
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
              fontSize: "0.875rem",
            }}
          >
            {page > 1 ? (
              <Link
                href={`/catalogo?pagina=${page - 1}`}
                className="btn btn-secondary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
              >
                &larr; Anterior
              </Link>
            ) : (
              <span className="btn btn-secondary" style={{ opacity: 0.4, cursor: "not-allowed", fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>
                &larr; Anterior
              </span>
            )}

            <span style={{ color: "var(--text-secondary)" }}>
              Página <strong style={{ color: "var(--text-primary)" }}>{page}</strong> de <strong style={{ color: "var(--text-primary)" }}>{totalPages}</strong>
            </span>

            {page < totalPages ? (
              <Link
                href={`/catalogo?pagina=${page + 1}`}
                className="btn btn-secondary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
              >
                Próxima &rarr;
              </Link>
            ) : (
              <span className="btn btn-secondary" style={{ opacity: 0.4, cursor: "not-allowed", fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>
                Próxima &rarr;
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
