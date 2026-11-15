import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminProducts, getAdminCategories } from "@/lib/admin/queries";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { ProductBatchImportModal } from "@/components/admin/ProductBatchImportModal";
import type { CommercialMode } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Produtos | Gestão KAVUNO 3D",
};

export const dynamic = "force-dynamic";

interface AdminProductsPageProps {
  searchParams: Promise<{
    search?: string;
    categoria?: string;
    modalidade?: string;
    aba?: "all" | "active" | "draft" | "recent_imports";
    pagina?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const page = params.pagina ? parseInt(params.pagina, 10) : 1;
  const currentTab = params.aba || "all";

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getAdminProducts({
      search: params.search,
      categoryId: params.categoria,
      commercialMode: params.modalidade as CommercialMode | undefined,
      statusFilter: currentTab,
      page,
      limit: 20,
    }),
    getAdminCategories(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header com Ações */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              color: "#202223",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Produtos
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6d7175", marginTop: "0.25rem" }}>
            Gerencie o catálogo de peças 3D, cotações, estoque físico e produtos importados.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Modal de Importação em Lote */}
          <ProductBatchImportModal />

          <Link href="/kavuno-gestao/produtos/novo" className="shopify-btn-primary">
            + Cadastrar Produto
          </Link>
        </div>
      </div>

      {/* Card Principal da Tabela com Abas */}
      <div className="shopify-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Abas Superiores no Estilo Nuvemshop / Shopify */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderBottom: "1px solid #e1e3e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            backgroundColor: "#fafbfb",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link
              href="/kavuno-gestao/produtos?aba=all"
              style={{
                fontSize: "0.8125rem",
                fontWeight: currentTab === "all" ? 700 : 500,
                color: currentTab === "all" ? "#202223" : "#6d7175",
                padding: "0.4rem 0.85rem",
                backgroundColor: currentTab === "all" ? "#ffffff" : "transparent",
                borderRadius: "6px",
                border: currentTab === "all" ? "1px solid #c9cccf" : "1px solid transparent",
                textDecoration: "none",
                boxShadow: currentTab === "all" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Todos os Produtos
            </Link>

            <Link
              href="/kavuno-gestao/produtos?aba=recent_imports"
              style={{
                fontSize: "0.8125rem",
                fontWeight: currentTab === "recent_imports" ? 700 : 600,
                color: currentTab === "recent_imports" ? "#4f46e5" : "#4f46e5",
                padding: "0.4rem 0.85rem",
                backgroundColor: currentTab === "recent_imports" ? "#ffffff" : "#eef2ff",
                borderRadius: "6px",
                border: currentTab === "recent_imports" ? "1px solid #c7d2fe" : "1px solid transparent",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>📥 Importados Recentemente (Rascunhos)</span>
            </Link>

            <Link
              href="/kavuno-gestao/produtos?aba=active"
              style={{
                fontSize: "0.8125rem",
                fontWeight: currentTab === "active" ? 700 : 500,
                color: currentTab === "active" ? "#0e623b" : "#6d7175",
                padding: "0.4rem 0.85rem",
                backgroundColor: currentTab === "active" ? "#ffffff" : "transparent",
                borderRadius: "6px",
                border: currentTab === "active" ? "1px solid #c9cccf" : "1px solid transparent",
                textDecoration: "none",
              }}
            >
              Ativos na Vitrine
            </Link>

            <Link
              href="/kavuno-gestao/produtos?aba=draft"
              style={{
                fontSize: "0.8125rem",
                fontWeight: currentTab === "draft" ? 700 : 500,
                color: currentTab === "draft" ? "#202223" : "#6d7175",
                padding: "0.4rem 0.85rem",
                backgroundColor: currentTab === "draft" ? "#ffffff" : "transparent",
                borderRadius: "6px",
                border: currentTab === "draft" ? "1px solid #c9cccf" : "1px solid transparent",
                textDecoration: "none",
              }}
            >
              Rascunhos / Inativos
            </Link>
          </div>

          <span style={{ fontSize: "0.8125rem", color: "#6d7175" }}>
            Total: <strong>{total}</strong> produto(s)
          </span>
        </div>

        {/* Filtros de Busca */}
        <form
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #e1e3e5",
            backgroundColor: "#ffffff",
          }}
        >
          <input type="hidden" name="aba" value={currentTab} />
          <input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="Buscar por nome ou slug..."
            className="shopify-input"
            style={{ flex: "1", minWidth: "200px" }}
          />
          <select
            name="modalidade"
            defaultValue={params.modalidade}
            className="shopify-select"
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
            className="shopify-select"
            style={{ minWidth: "160px" }}
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button type="submit" className="shopify-btn-secondary" style={{ whiteSpace: "nowrap" }}>
            Filtrar
          </button>
          <Link href={`/kavuno-gestao/produtos?aba=${currentTab}`} className="shopify-btn-secondary" style={{ whiteSpace: "nowrap" }}>
            Limpar
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
              padding: "1.25rem",
              borderTop: "1px solid #e1e3e5",
              fontSize: "0.8125rem",
            }}
          >
            {page > 1 ? (
              <Link href={`/kavuno-gestao/produtos?aba=${currentTab}&pagina=${page - 1}`} className="shopify-btn-secondary">
                ← Anterior
              </Link>
            ) : (
              <span className="shopify-btn-secondary" style={{ opacity: 0.4 }}>← Anterior</span>
            )}
            <span style={{ color: "#6d7175" }}>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
            {page < totalPages ? (
              <Link href={`/kavuno-gestao/produtos?aba=${currentTab}&pagina=${page + 1}`} className="shopify-btn-secondary">
                Próxima →
              </Link>
            ) : (
              <span className="shopify-btn-secondary" style={{ opacity: 0.4 }}>Próxima →</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
