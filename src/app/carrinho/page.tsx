"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, subtotal, totalWeightG } = useCart();
  const [cep, setCep] = useState("");
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingDays, setShippingDays] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const handleCalculateShipping = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      alert("Informe um CEP válido com 8 dígitos.");
      return;
    }

    setIsCalculatingShipping(true);
    try {
      // Simulação rápida determinística client-side (ou via API de cotação)
      const cepNum = parseInt(cleanCep, 10);
      let cost = subtotal >= 250 ? 0 : (cepNum <= 19999999 ? 14.9 : 24.9);
      let days = cepNum <= 19999999 ? 3 : 6;
      setShippingCost(cost);
      setShippingDays(days);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: "var(--spacing-3xl) var(--spacing-md)", textAlign: "center" }}>
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "var(--spacing-2xl)",
            backgroundColor: "var(--bg-surface)",
            border: "1px dashed var(--border-medium)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            SEU CARRINHO ESTÁ VAZIO
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--spacing-xl)" }}>
            Explore nossos produtos a pronta entrega e lotes de pré-venda exclusiva.
          </p>
          <Link href="/catalogo" className="btn btn-primary">
            EXPLORAR CATÁLOGO
          </Link>
        </div>
      </div>
    );
  }

  const finalTotal = subtotal + (shippingCost || 0);

  return (
    <div className="container" style={{ padding: "var(--spacing-2xl) var(--spacing-md)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
          // ETAPA 01 // CONFERÊNCIA DE ITENS
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 800 }}>
          CARRINHO DE COMPRAS
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          {totalItems} item(ns) selecionado(s) · Peso estimado de impressão: {totalWeightG}g
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--spacing-xl)", alignItems: "start" }}>
        {/* Lista de Itens */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {items.map((item) => (
            <Card key={item.variantId} variant="bracket" style={{ padding: "var(--spacing-md)" }}>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: item.commercialMode === "in_stock" ? "var(--mode-in-stock)" : "var(--mode-pre-order)", fontWeight: 700 }}>
                    {item.commercialMode === "in_stock" ? "✓ PRONTA ENTREGA" : "⚡ PRÉ-VENDA PAGA"}
                  </div>
                  <Link
                    href={`/produtos/${item.slug}`}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      textDecoration: "none",
                    }}
                  >
                    {item.productName}
                  </Link>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    {item.variantName} · SKU: {item.sku}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-bracket"
                    style={{ padding: "0.25rem 0.6rem" }}
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, minWidth: "1.5rem", textAlign: "center" }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="btn btn-bracket"
                    style={{ padding: "0.25rem 0.6rem" }}
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div style={{ textAlign: "right", minWidth: "120px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                  </div>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--status-error)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      cursor: "pointer",
                      marginTop: "0.25rem",
                    }}
                    onClick={() => removeItem(item.variantId)}
                  >
                    REMOVER
                  </button>
                </div>
              </div>
            </Card>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-bracket"
              style={{ fontSize: "0.75rem" }}
              onClick={() => {
                if (confirm("Deseja esvaziar todos os itens do carrinho?")) clearCart();
              }}
            >
              LIMPAR CARRINHO
            </button>
            <Link href="/catalogo" className="btn btn-bracket" style={{ fontSize: "0.75rem" }}>
              + ADICIONAR MAIS PRODUTOS
            </Link>
          </div>
        </div>

        {/* Resumo Financeiro e Cotação de Frete */}
        <div style={{ maxWidth: "450px", width: "100%", justifySelf: "end" }}>
          <Card variant="bracket" style={{ padding: "var(--spacing-lg)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "var(--spacing-md)" }}>
              // RESUMO DO PEDIDO
            </div>

            {/* Simulação de Frete */}
            <div style={{ marginBottom: "var(--spacing-md)" }}>
              <label className="form-label">Calcular Frete (CEP)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  className="form-input"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-bracket"
                  disabled={isCalculatingShipping}
                  onClick={handleCalculateShipping}
                >
                  CALCULAR
                </button>
              </div>
              {shippingCost !== null && (
                <div style={{ marginTop: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--mode-in-stock)" }}>
                  ✓ Entrega estimada: {shippingDays} dias úteis ({shippingCost === 0 ? "Frete Grátis!" : `R$ ${shippingCost.toFixed(2).replace(".", ",")}`})
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--spacing-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <span>Frete</span>
                <span>
                  {shippingCost === null
                    ? "Informe o CEP"
                    : shippingCost === 0
                    ? "GRÁTIS"
                    : `R$ ${shippingCost.toFixed(2).replace(".", ",")}`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                <span>TOTAL</span>
                <span>R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "var(--spacing-lg)", padding: "0.875rem", textAlign: "center", display: "block" }}
            >
              AVANÇAR PARA CHECKOUT →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
