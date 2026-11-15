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
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.06)";
        e.currentTarget.style.borderColor = "#cbd5e1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.02)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      {/* Imagem do Produto com Fundo Claro e Limpo */}
      <Link href={`/produtos/${product.slug}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingTop: "100%", // Quadrado 1:1
            backgroundColor: "#f8fafc",
            overflow: "hidden",
          }}
        >
          {primaryImage?.image_url ? (
            <Image
              src={primaryImage.image_url}
              alt={primaryImage.alt_text || product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
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
                backgroundColor: "#f1f5f9",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🦾</div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Peça 3D Exclusiva</span>
            </div>
          )}

          {/* Badge Comercial (Pronta Entrega / Sob Encomenda) */}
          <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", zIndex: 2 }}>
            {isProntaEntrega ? (
              <span
                style={{
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.55rem",
                  borderRadius: "9999px",
                  textTransform: "uppercase",
                }}
              >
                ⚡ Pronta Entrega
              </span>
            ) : (
              <span
                style={{
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.55rem",
                  borderRadius: "9999px",
                  textTransform: "uppercase",
                }}
              >
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
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                padding: "0.2rem 0.5rem",
                borderRadius: "6px",
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
      <div style={{ padding: "1.25rem 1rem", display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#ffffff" }}>
        {/* Categoria */}
        {product.category && (
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#4f46e5",
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
            color: "#0f172a",
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

        {/* Avaliação em Estrelas */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
          <span style={{ color: "#f59e0b", fontSize: "0.875rem" }}>★★★★★</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
            5.0 (24)
          </span>
        </div>

        {/* Bloco de Preço */}
        <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
          {hasPromo && formattedBasePrice && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
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
              color: "#0f172a",
              lineHeight: 1.15,
            }}
          >
            {formattedPrice}
          </div>

          <span style={{ fontSize: "0.75rem", color: "#059669", display: "block", marginTop: "0.2rem", fontWeight: 500 }}>
            em até 3x de R$ {installmentValue} sem juros
          </span>
        </div>

        {/* Botão de Ação Azul Padrão */}
        <div style={{ marginTop: "1rem" }}>
          <Link
            href={`/produtos/${product.slug}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "0.65rem 1rem",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 700,
              borderRadius: "8px",
              textDecoration: "none",
              transition: "background-color 0.15s ease",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338ca")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
          >
            Comprar Agora
          </Link>
        </div>
      </div>
    </div>
  );
};
