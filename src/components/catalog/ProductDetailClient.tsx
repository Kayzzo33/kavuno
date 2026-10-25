"use client";

import React, { useState, useEffect } from "react";
import type { ProductWithDetails } from "@/lib/catalog/queries";
import type { Database } from "@/types/database.types";
import { Badge } from "@/components/ui/Badge";
import { VariantSelector } from "@/components/catalog/VariantSelector";
import { InterestLeadForm } from "@/components/catalog/InterestLeadForm";
import { useCart } from "@/context/CartContext";
import { trackClientEvent } from "@/lib/analytics/tracker";

type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

export interface ProductDetailClientProps {
  product: ProductWithDetails;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
}) => {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantRow | null>(
    product.variants?.[0] || null
  );

  // Rastreia visualização do produto de forma anônima e conforme LGPD
  useEffect(() => {
    trackClientEvent({
      eventName: "product_view",
      productId: product.id,
      metadata: {
        slug: product.slug,
        commercial_mode: product.commercial_mode,
        category: product.category?.name || null,
      },
    });
  }, [product.id, product.slug, product.commercial_mode, product.category?.name]);

  const priceAdjustment = selectedVariant?.price_adjustment || 0;
  const basePriceWithVariant = product.base_price + priceAdjustment;
  const hasPromo = product.promotional_price !== null && product.promotional_price > 0;
  const finalPrice = (hasPromo ? product.promotional_price! : product.base_price) + priceAdjustment;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(finalPrice);

  const formattedBase = hasPromo
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(basePriceWithVariant)
    : null;

  return (
    <div>
      {/* Badge de Modalidade */}
      <div style={{ marginBottom: "0.75rem" }}>
        <Badge mode={product.commercial_mode} />
      </div>

      {/* Título do Produto */}
      <h1
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: "0.5rem",
        }}
      >
        {product.name}
      </h1>

      {/* Descrição Curta */}
      {product.short_description && (
        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "var(--spacing-lg)",
          }}
        >
          {product.short_description}
        </p>
      )}

      {/* Preço */}
      <div
        style={{
          padding: "var(--spacing-md)",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "var(--spacing-lg)",
          display: "flex",
          alignItems: "baseline",
          gap: "1rem",
        }}
      >
        <div>
          {hasPromo && formattedBase && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                textDecoration: "line-through",
                display: "block",
              }}
            >
              {formattedBase}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {formattedPrice}
          </span>
        </div>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {product.commercial_mode === "interest_lead"
            ? "Preço de referência projetado"
            : "Valor unitário à vista"}
        </span>
      </div>

      {/* Seletor de Variantes */}
      <VariantSelector
        variants={product.variants || []}
        selectedVariantId={selectedVariant?.id || null}
        onSelectVariant={(v) => {
          setSelectedVariant(v);
          trackClientEvent({
            eventName: "variant_select",
            productId: product.id,
            metadata: {
              variant_id: v.id,
              variant_sku: v.sku,
              variant_name: v.variant_name,
            },
          });
        }}
      />

      {/* Ações Específicas por Modalidade Comercial */}
      {product.commercial_mode === "in_stock" && (
        <div style={{ marginBottom: "var(--spacing-lg)" }}>
          <div
            style={{
              padding: "var(--spacing-md)",
              backgroundColor: "var(--mode-in-stock-subtle)",
              border: "1px solid var(--mode-in-stock-border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              color: "var(--mode-in-stock)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
              ✓ ITEM DISPONÍVEL EM ESTOQUE FÍSICO
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Peça acabada com despacho prioritário em até 1 dia útil após a confirmação.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
            onClick={() => {
              if (!selectedVariant) {
                alert("Selecione uma variante antes de adicionar ao carrinho.");
                return;
              }
              addItem({
                productId: product.id,
                variantId: selectedVariant.id,
                productName: product.name,
                variantName: `${selectedVariant.variant_name} (${selectedVariant.color_name})`,
                sku: selectedVariant.sku,
                slug: product.slug,
                imageUrl: product.images?.[0]?.image_url,
                price: finalPrice,
                weightG: Number(selectedVariant.estimated_filament_weight_g || 100),
                commercialMode: "in_stock",
                quantity: 1,
              });
              alert(`"${product.name}" adicionado ao carrinho!`);
            }}
          >
            🛒 ADICIONAR AO CARRINHO
          </button>
        </div>
      )}

      {product.commercial_mode === "pre_order" && (
        <div style={{ marginBottom: "var(--spacing-lg)" }}>
          <div
            style={{
              padding: "var(--spacing-md)",
              backgroundColor: "var(--mode-pre-order-subtle)",
              border: "1px solid var(--mode-pre-order-border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              color: "var(--mode-pre-order)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
              ⚡ LOTE DE PRÉ-VENDA PROGRAMADA
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {product.campaign?.estimated_production_days
                ? `Prazo de produção estimado: ${product.campaign.estimated_production_days} dias úteis.`
                : "Prazo de produção informado no pedido."}
              {" "}Meta do lote: {product.campaign?.target_min_units || 0} unidades.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.875rem", fontSize: "1rem" }}
            onClick={() => {
              if (!selectedVariant) {
                alert("Selecione uma variante antes de participar da pré-venda.");
                return;
              }
              addItem({
                productId: product.id,
                variantId: selectedVariant.id,
                productName: product.name,
                variantName: `${selectedVariant.variant_name} (${selectedVariant.color_name})`,
                sku: selectedVariant.sku,
                slug: product.slug,
                imageUrl: product.images?.[0]?.image_url,
                price: finalPrice,
                weightG: Number(selectedVariant.estimated_filament_weight_g || 100),
                commercialMode: "pre_order",
                quantity: 1,
              });
              alert(`"${product.name}" (Pré-venda) adicionado ao carrinho!`);
            }}
          >
            ⚡ COMPRAR EM PRÉ-VENDA
          </button>
        </div>
      )}

      {/* Modalidade de Validação: Formulário de Reserva Gratuita */}
      {product.commercial_mode === "interest_lead" && (
        <InterestLeadForm
          productId={product.id}
          variantId={selectedVariant?.id || null}
          campaignId={product.campaign_id || null}
          productName={product.name}
        />
      )}
    </div>
  );
};
