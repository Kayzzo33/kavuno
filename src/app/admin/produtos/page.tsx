import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminProducts, getAdminCategories } from "@/lib/admin/queries";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import type { CommercialMode } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Produtos | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

interface AdminProductsPageProps {
  searchParams: Promise<{
    search?: string;
    categoria?: string;
    modalidade?: string;
    pagina?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const page = params.pagina ? parseInt(params.pagina, 10) : 1;

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getAdminProducts({
      search: params.search,
      categoryId: params.categoria,
      commercialMode: params.modalidade as CommercialMode | undefined,
      page,
      limit: 20,
    }),
    getAdminCategories(),
  ]);

  return (
    <div>
      {/* Header */}
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
            // CATÁLOGO // GESTÃO DE PRODUTOS
          </div>
          <h1
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.75rem",
              fontWeight: 800,
            }}
          >
            PRODUTOS
          </h1>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {total} produto(s) no banco de dados
          </div>
        </div>

        <Link href="/admin/produtos/novo" className="btn btn-primary">
          + NOVO PRODUTO
        </Link>
      </div>

      {/* Filtros de Busca */}
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
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Buscar por nome ou slug..."
          className="form-input"
          style={{ flex: "1", minWidth: "200px" }}
        />
        <select
          name="modalidade"
          defaultValue={params.modalidade}
          className="form-select"
          style={{ minWidth: "180px" }}
        >
          <option value="">Todas as modalidades</option>
          <option value="in_stock">Pronta Entrega</option>
          <option value="pre_order">Pré-venda</option>
          <option value="interest_lead">Validação / Reserva</option>
        </select>
        <select
          name="categoria"
          defaultValue={params.categoria}
          className="form-select"
          style={{ minWidth: "160px" }}
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-bracket" style={{ whiteSpace: "nowrap" }}>
          FILTRAR
        </button>
        <Link href="/admin/produtos" className="btn btn-bracket" style={{ whiteSpace: "nowrap" }}>
          LIMPAR
        </Link>
      </form>

      {/* Tabela de Produtos */}
      <AdminProductsTable products={products} />

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
            <Link href={`/admin/produtos?pagina=${page - 1}`} className="btn btn-bracket">
              ← ANTERIOR
            </Link>
          ) : (
            <span className="btn btn-bracket" style={{ opacity: 0.4 }}>← ANTERIOR</span>
          )}
          <span style={{ color: "var(--text-secondary)" }}>
            PÁGINA <strong style={{ color: "var(--text-primary)" }}>{page}</strong> DE{" "}
            <strong style={{ color: "var(--text-primary)" }}>{totalPages}</strong>
          </span>
          {page < totalPages ? (
            <Link href={`/admin/produtos?pagina=${page + 1}`} className="btn btn-bracket">
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
