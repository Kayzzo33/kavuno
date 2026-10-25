"use client";

import React, { useActionState, useTransition } from "react";
import type { AdminProduct } from "@/lib/admin/queries";
import type { Database } from "@/types/database.types";
import { createVariantAction, deleteVariantAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

type Variant = Database["public"]["Tables"]["product_variants"]["Row"];

interface VariantManagerProps {
  product: AdminProduct;
}

const materialLabels: Record<string, string> = {
  pla: "PLA",
  petg: "PETG",
  abs: "ABS",
  asa: "ASA",
  tpu: "TPU (Flexível)",
  pc: "Policarbonato (PC)",
  nylon: "Nylon (PA)",
  other: "Outro",
};

export function VariantManager({ product }: VariantManagerProps) {
  const [state, formAction, isPending] = useActionState(createVariantAction, null);
  const [isDeleting, startDeleting] = useTransition();

  const activeVariants = product.variants?.filter((v) => v.is_active) || [];

  return (
    <div>
      {/* Lista de Variantes Existentes */}
      {activeVariants.length > 0 ? (
        <div
          style={{
            marginBottom: "var(--spacing-lg)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-canvas)", borderBottom: "1px solid var(--border-subtle)" }}>
                {["SKU", "NOME", "MATERIAL", "COR", "AJUSTE PREÇO", "PESO (g)", "TEMPO (min)", ""].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.5rem 0.75rem",
                        textAlign: "left",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.625rem",
                        color: "var(--text-muted)",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {activeVariants.map((variant, i) => (
                <tr
                  key={variant.id}
                  style={{
                    borderBottom:
                      i < activeVariants.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                  }}
                >
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {variant.sku}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {variant.variant_name}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {materialLabels[variant.filament_material] || variant.filament_material}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      {variant.color_hex && (
                        <div
                          style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "2px",
                            backgroundColor: variant.color_hex,
                            border: "1px solid var(--border-subtle)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {variant.color_name}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: variant.price_adjustment >= 0 ? "var(--mode-in-stock)" : "var(--status-error)",
                    }}
                  >
                    {variant.price_adjustment >= 0 ? "+" : ""}
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      variant.price_adjustment
                    )}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                    {variant.estimated_filament_weight_g}g
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                    {variant.estimated_print_time_minutes}min
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <button
                      className="btn btn-bracket"
                      style={{
                        fontSize: "0.625rem",
                        padding: "0.25rem 0.5rem",
                        color: "var(--status-error)",
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                      disabled={isDeleting}
                      onClick={() => {
                        if (confirm(`Desativar variante "${variant.variant_name}"?`)) {
                          startDeleting(async () => {
                            await deleteVariantAction(variant.id, product.id);
                          });
                        }
                      }}
                    >
                      REMOVER
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            padding: "var(--spacing-md)",
            textAlign: "center",
            backgroundColor: "var(--bg-canvas)",
            border: "1px dashed var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          Nenhuma variante cadastrada. Adicione abaixo.
        </div>
      )}

      {/* Formulário para Nova Variante */}
      <div
        style={{
          padding: "var(--spacing-md)",
          backgroundColor: "var(--bg-canvas)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          + ADICIONAR VARIANTE
        </div>

        {state?.error && (
          <Alert type="error" title="ERRO">
            {state.error}
          </Alert>
        )}
        {state?.success && state.message && (
          <Alert type="success" title="OK">
            {state.message}
          </Alert>
        )}

        <form action={formAction}>
          <input type="hidden" name="product_id" value={product.id} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "0.5rem",
            }}
          >
            <Input label="SKU *" name="sku" required placeholder="EX-PLA-AZL-001" />
            <Input label="Nome da Variante *" name="variant_name" required placeholder="Azul / PLA" />

            <div className="form-group">
              <label className="form-label">Material *</label>
              <select name="filament_material" className="form-select" required>
                {Object.entries(materialLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <Input label="Nome da Cor *" name="color_name" required placeholder="Azul Petróleo" />
            <Input label="Hex da Cor" name="color_hex" placeholder="#1E3A5F" helperText="Ex: #FF5733" />
            <Input label="Ajuste de Preço (R$)" name="price_adjustment" type="number" step="0.01" defaultValue="0" placeholder="0.00" helperText="+/- sobre o preço base" />
            <Input label="Peso filamento (g)" name="estimated_filament_weight_g" type="number" step="0.1" defaultValue="0" placeholder="45.5" />
            <Input label="Tempo de impressão (min)" name="estimated_print_time_minutes" type="number" defaultValue="0" placeholder="120" />
          </div>

          <Button type="submit" variant="primary" isLoading={isPending} style={{ marginTop: "0.5rem" }}>
            ADICIONAR VARIANTE
          </Button>
        </form>
      </div>
    </div>
  );
}
