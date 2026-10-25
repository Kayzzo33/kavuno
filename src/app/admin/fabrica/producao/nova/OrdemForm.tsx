"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProductionOrderAction } from "../../actions";

interface Product {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  variant_name: string;
  sku: string;
  estimated_filament_weight_g: number;
  estimated_print_time_minutes: number;
}

export default function NovaOrdemForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [plannedQty, setPlannedQty] = useState(1);

  useEffect(() => {
    if (!selectedProductId) { setVariants([]); setSelectedVariant(null); return; }
    setLoadingVariants(true);
    fetch(`/api/admin/variants?product_id=${selectedProductId}`)
      .then((r) => r.json())
      .then((data) => { setVariants(data.variants ?? []); setSelectedVariant(null); })
      .catch(() => setVariants([]))
      .finally(() => setLoadingVariants(false));
  }, [selectedProductId]);

  const estimatedG = selectedVariant
    ? (selectedVariant.estimated_filament_weight_g ?? 0) * plannedQty
    : 0;
  const estimatedMin = selectedVariant
    ? (selectedVariant.estimated_print_time_minutes ?? 0) * plannedQty
    : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await createProductionOrderAction(fd);
    if (result?.error) { setError(result.error); setPending(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    backgroundColor: "var(--bg-canvas)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    letterSpacing: "0.04em",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>

      {/* Produto */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="product_id" style={labelStyle}>PRODUTO *</label>
        <select
          id="product_id"
          name="product_id"
          required
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Selecione o produto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Variante */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="variant_id" style={labelStyle}>VARIANTE *</label>
        <select
          id="variant_id"
          name="variant_id"
          required
          disabled={!selectedProductId || loadingVariants}
          onChange={(e) => setSelectedVariant(variants.find((v) => v.id === e.target.value) ?? null)}
          style={{ ...inputStyle, opacity: loadingVariants ? 0.5 : 1 }}
        >
          <option value="">{loadingVariants ? "Carregando..." : "Selecione a variante"}</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>{v.variant_name} — {v.sku}</option>
          ))}
        </select>
      </div>

      {/* Quantidade */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="planned_quantity" style={labelStyle}>QUANTIDADE PLANEJADA *</label>
        <input
          id="planned_quantity"
          name="planned_quantity"
          type="number"
          required
          min="1"
          value={plannedQty}
          onChange={(e) => setPlannedQty(parseInt(e.target.value, 10) || 1)}
          style={inputStyle}
        />
      </div>

      {/* Estimativas calculadas automaticamente */}
      {selectedVariant && (
        <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-md)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
          <div>
            <div style={labelStyle}>FILAMENTO ESTIMADO</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{estimatedG.toFixed(1)} g</div>
          </div>
          <div>
            <div style={labelStyle}>TEMPO ESTIMADO</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{estimatedMin} min ({(estimatedMin / 60).toFixed(1)} h)</div>
          </div>
          <input type="hidden" name="estimated_filament_g" value={estimatedG} />
          <input type="hidden" name="estimated_machine_minutes" value={estimatedMin} />
        </div>
      )}

      {/* Pedido de venda vinculado (opcional) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="sales_order_id" style={labelStyle}>PEDIDO DE VENDA (opcional)</label>
        <input id="sales_order_id" name="sales_order_id" type="text" placeholder="UUID do pedido" style={inputStyle} />
      </div>

      {/* Notas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="notes" style={labelStyle}>OBSERVAÇÕES</label>
        <textarea id="notes" name="notes" rows={3} placeholder="Instruções de impressão, prioridade..." style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {error && (
        <div style={{ padding: "0.75rem", backgroundColor: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
        <button type="submit" disabled={pending} style={{ padding: "0.625rem 1.5rem", backgroundColor: pending ? "var(--text-muted)" : "var(--color-primary)", color: "#000", border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem", cursor: pending ? "not-allowed" : "pointer" }}>
          {pending ? "CRIANDO..." : "CRIAR ORDEM"}
        </button>
        <button type="button" onClick={() => router.push("/admin/fabrica/producao")} style={{ padding: "0.625rem 1rem", backgroundColor: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.875rem", cursor: "pointer" }}>
          CANCELAR
        </button>
      </div>
    </form>
  );
}
