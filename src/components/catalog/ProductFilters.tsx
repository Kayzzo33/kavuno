"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Database, CommercialMode } from "@/types/database.types";
import { Button } from "@/components/ui/Button";
import { trackClientEvent } from "@/lib/analytics/tracker";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export interface ProductFiltersProps {
  categories: CategoryRow[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({ categories }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoria") || "");
  const [selectedMode, setSelectedMode] = useState<CommercialMode | "">(
    (searchParams.get("modalidade") as CommercialMode) || ""
  );
  const [selectedSort, setSelectedSort] = useState(searchParams.get("ordenar") || "newest");

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Resetar página ao mudar filtros
    params.delete("page");

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value.trim().length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      trackClientEvent({
        eventName: "search",
        metadata: {
          search_term: search.trim().toLowerCase(),
        },
      });
    }
    applyFilters({ search });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCategory(val);
    if (val) {
      trackClientEvent({
        eventName: "filter_applied",
        metadata: {
          filter_type: "category",
          filter_value: val,
        },
      });
    }
    applyFilters({ categoria: val });
  };

  const handleModeClick = (mode: CommercialMode | "") => {
    setSelectedMode(mode);
    if (mode) {
      trackClientEvent({
        eventName: "filter_applied",
        metadata: {
          filter_type: "commercial_mode",
          filter_value: mode,
        },
      });
    }
    applyFilters({ modalidade: mode || null });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSort(val);
    applyFilters({ ordenar: val });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedMode("");
    setSelectedSort("newest");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedMode || selectedSort !== "newest");

  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--spacing-md)",
        marginBottom: "var(--spacing-xl)",
      }}
    >
      {/* Barra de Pesquisa */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por modelo 3D, nome ou descrição..."
          className="form-input"
          style={{ flex: 1 }}
        />
        <Button type="submit" variant="primary" isLoading={isPending}>
          BUSCAR
        </Button>
      </form>

      {/* Linha de Filtros: Modalidade, Categoria e Ordenação */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Botões de Modalidade Comercial */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => handleModeClick("")}
            className={`btn ${selectedMode === "" ? "btn-primary" : "btn-bracket"}`}
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
          >
            TODOS OS PRODUTOS
          </button>
          <button
            type="button"
            onClick={() => handleModeClick("in_stock")}
            className={`btn ${selectedMode === "in_stock" ? "btn-primary" : "btn-bracket"}`}
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
          >
            PRONTA ENTREGA
          </button>
          <button
            type="button"
            onClick={() => handleModeClick("pre_order")}
            className={`btn ${selectedMode === "pre_order" ? "btn-primary" : "btn-bracket"}`}
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
          >
            PRÉ-VENDA
          </button>
          <button
            type="button"
            onClick={() => handleModeClick("interest_lead")}
            className={`btn ${selectedMode === "interest_lead" ? "btn-primary" : "btn-bracket"}`}
            style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
          >
            VALIDAÇÃO DE DEMANDA
          </button>
        </div>

        {/* Dropdowns de Categoria e Ordenação */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="form-select"
              style={{
                fontSize: "0.8125rem",
                padding: "0.4rem 0.75rem",
                width: "auto",
              }}
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedSort}
            onChange={handleSortChange}
            className="form-select"
            style={{
              fontSize: "0.8125rem",
              padding: "0.4rem 0.75rem",
              width: "auto",
            }}
          >
            <option value="newest">Mais Recentes</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--status-error)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
