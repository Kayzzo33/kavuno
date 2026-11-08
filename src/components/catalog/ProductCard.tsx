import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithDetails } from "@/lib/catalog/queries";

export interface ProductCardProps {
  product: ProductWithDetails;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const hasPromo = product.promotional_price !== null && product.promotional_price > 0;
  const displayPrice = hasPromo ? product.promotional_price! : product.base_price;

  const discountPercentage = hasPromo
    ? Math.round(((product.base_price - product.promotional_price!) / product.base_price) * 100)
    : 0;

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

  const installmentValue = (displayPrice / 3).toFixed(2).replace(".", ",");

  const isProntaEntrega = product.commercial_mode === "in_stock";

  return (
    <div className="product-card-modern">
      {/* Container de Imagem com Aspect Ratio Quadrado */}
      <Link href={`/produtos/${product.slug}`} style={{ textDecoration: "none" }}>
        <div className="product-image-container">
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
                background: "linear-gradient(135deg, #131720 0%, #1c2230 100%)",
                gap: "0.5rem",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(255, 92, 0, 0.1)",
                  border: "1px solid rgba(255, 92, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.75rem",
                }}
              >
                🦾
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Peça 3D de Alta Resolução
              </span>
            </div>
          )}

          {/* Badge Comercial (Pronta Entrega / Sob Encomenda) */}
          <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", zIndex: 2 }}>
            {isProntaEntrega ? (
              <span className="badge-commercial badge-in-stock-pill">
                ⚡ Pronta Entrega
              </span>
            ) : (
              <span className="badge-commercial badge-pre-order-pill">
                Sob Encomenda
              </span>
            )}
          </div>

          {/* Badge de Desconto */}
          {hasPromo && discountPercentage > 0 && (
            <div
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                backgroundColor: "var(--color-primary)",
                color: "#ffffff",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.6875rem",
                fontWeight: 800,
                zIndex: 2,
              }}
            >
              -{discountPercentage}%
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo do Card */}
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Categoria */}
        {product.category && (
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-primary)",
              marginBottom: "0.35rem",
            }}
          >
            {product.category.name}
          </span>
        )}

        {/* Título do Produto */}
        <h3
          style={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            lineHeight: 1.35,
            marginBottom: "0.5rem",
            color: "var(--text-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.5rem",
          }}
        >
          <Link
            href={`/produtos/${product.slug}`}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {product.name}
          </Link>
        </h3>

        {/* Avaliação em Estrelas (Estilo Mercado Livre / Stuffus) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
          <span style={{ color: "#fbbf24", fontSize: "0.875rem" }}>★★★★★</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
            5.0 (24)
          </span>
        </div>

        {/* Bloco de Preço */}
        <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
          {hasPromo && formattedBasePrice && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textDecoration: "line-through",
                display: "block",
                lineHeight: 1,
              }}
            >
              {formattedBasePrice}
            </span>
          )}

          <div
            style={{
              fontSize: "1.375rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              lineHeight: 1.15,
            }}
          >
            {formattedPrice}
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--mode-in-stock)", display: "block", marginTop: "0.2rem" }}>
            em até 3x de R$ {installmentValue} sem juros
          </span>
        </div>

        {/* Botão de Ação */}
        <div style={{ marginTop: "0.875rem" }}>
          <Link
            href={`/produtos/${product.slug}`}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "0.55rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Comprar Agora
          </Link>
        </div>
      </div>
    </div>
  );
};
