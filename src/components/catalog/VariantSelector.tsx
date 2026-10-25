"use client";

import React from "react";
import type { Database } from "@/types/database.types";

type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

export interface VariantSelectorProps {
  variants: ProductVariantRow[];
  selectedVariantId: string | null;
  onSelectVariant: (variant: ProductVariantRow) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariantId,
  onSelectVariant,
}) => {
  if (!variants || variants.length === 0) {
    return (
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
          padding: "0.5rem 0",
        }}
      >
        // CONFIGURAÇÃO ÚNICA (SEM VARIANTES ADICIONAIS)
      </div>
    );
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];

  return (
    <div style={{ marginBottom: "var(--spacing-lg)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
          }}
        >
          SELECIONE A VARIANTE / MATERIAL:
        </span>
        {selectedVariant && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-primary)",
              fontWeight: 600,
            }}
          >
            SKU: {selectedVariant.sku}
          </span>
        )}
      </div>

      {/* Grid de Seletores de Variante */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
        {variants.map((v) => {
          const isSelected = v.id === selectedVariant?.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVariant(v)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0.625rem 0.75rem",
                backgroundColor: isSelected ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                border: isSelected
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                textAlign: "left",
                outline: "none",
                transition: "all var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", width: "100%" }}>
                {v.color_hex && (
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: v.color_hex,
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {v.color_name}
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                MAT: {v.filament_material}
                {v.price_adjustment !== 0 && (
                  <span style={{ color: "var(--color-primary)", marginLeft: "0.25rem" }}>
                    {v.price_adjustment > 0 ? `(+R$ ${v.price_adjustment})` : `(-R$ ${Math.abs(v.price_adjustment)})`}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Caixa de Métricas Técnicas da Peça Impressa */}
      {selectedVariant && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.625rem 0.875rem",
            backgroundColor: "var(--bg-canvas)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.25rem",
          }}
        >
          <div>
            FILAMENTO ESTIMADO: <strong style={{ color: "var(--text-primary)" }}>{selectedVariant.estimated_filament_weight_g}g</strong>
          </div>
          <div>
            TEMPO ESTIMADO DE MÁQUINA: <strong style={{ color: "var(--text-primary)" }}>{Math.floor(selectedVariant.estimated_print_time_minutes / 60)}h {selectedVariant.estimated_print_time_minutes % 60}m</strong>
          </div>
        </div>
      )}
    </div>
  );
};
