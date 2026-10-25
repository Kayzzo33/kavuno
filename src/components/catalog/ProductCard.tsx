import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithDetails } from "@/lib/catalog/queries";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export interface ProductCardProps {
  product: ProductWithDetails;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const hasPromo = product.promotional_price !== null && product.promotional_price > 0;
  const displayPrice = hasPromo ? product.promotional_price! : product.base_price;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(displayPrice);

  const formattedBasePrice = hasPromo
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(product.base_price)
    : null;

  return (
    <Card
      variant="bracket"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "var(--spacing-md)",
      }}
    >
      {/* Imagem do Produto */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "75%", // Aspect Ratio 4:3
          backgroundColor: "var(--bg-canvas)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          marginBottom: "var(--spacing-md)",
        }}
      >
        {primaryImage?.image_url ? (
          <Image
            src={primaryImage.image_url}
            alt={primaryImage.alt_text || product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-canvas)",
              gap: "0.25rem",
            }}
          >
            <span>[ IMAGEM 3D // INDISPONÍVEL ]</span>
            <span style={{ fontSize: "0.6875rem" }}>SKU: {product.slug}</span>
          </div>
        )}

        {/* Badge da Modalidade Comercial */}
        <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem" }}>
          <Badge mode={product.commercial_mode} />
        </div>
      </div>

      {/* Categoria */}
      {product.category && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-primary)",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          {product.category.name}
        </div>
      )}

      {/* Título do Produto */}
      <h3
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1rem",
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: "0.5rem",
          flex: 1,
        }}
      >
        <Link
          href={`/produtos/${product.slug}`}
          style={{ color: "var(--text-primary)", transition: "color var(--transition-fast)" }}
        >
          {product.name}
        </Link>
      </h3>

      {/* Descrição Curta */}
      {product.short_description && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            lineHeight: 1.4,
            marginBottom: "var(--spacing-md)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.short_description}
        </p>
      )}

      {/* Detalhes Técnicos de Variantes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          paddingTop: "0.5rem",
          borderTop: "1px solid var(--border-subtle)",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <span>
          {product.variants?.length
            ? `${product.variants.length} variante(s)`
            : "Modelo único"}
        </span>
        {product.variants?.[0]?.filament_material && (
          <span style={{ textTransform: "uppercase", color: "var(--text-secondary)" }}>
            MAT: {product.variants[0].filament_material}
          </span>
        )}
      </div>

      {/* Preço e Botão */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div>
          {hasPromo && formattedBasePrice && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textDecoration: "line-through",
                display: "block",
              }}
            >
              {formattedBasePrice}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {formattedPrice}
          </span>
        </div>

        <Link
          href={`/produtos/${product.slug}`}
          className="btn btn-bracket"
          style={{
            fontSize: "0.75rem",
            padding: "0.5rem 0.875rem",
            whiteSpace: "nowrap",
          }}
        >
          DETALHES // VER
        </Link>
      </div>
    </Card>
  );
};
