import React from "react";
import Link from "next/link";
import { getCatalogProducts, getActiveCategories, getSiteSettings, getActiveSiteBanners } from "@/lib/catalog/queries";
import { ProductCard } from "@/components/catalog/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalogData, categories, settings, banners] = await Promise.all([
    getCatalogProducts({ limit: 16, sort: "newest" }),
    getActiveCategories(),
    getSiteSettings(),
    getActiveSiteBanners(),
  ]);

  const { products } = catalogData;
  const hotProduct = products.find((p) => p.is_featured) || products[0] || null;
  const secondaryHotProducts = products.filter((p) => p.id !== hotProduct?.id).slice(0, 4);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "4rem" }}>
      {/* 1. HERO BANNER PRINCIPAL (ESTILO NOVATECH: CARD BRANCO/GRADIENTE CLARO COM IMAGEM DESTACADA) */}
      <section style={{ padding: "2rem 0" }}>
        <div className="container">
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              padding: "clamp(2rem, 5vw, 4rem)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              alignItems: "center",
              gap: "2.5rem",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Texto de Apresentação Hero */}
            <div style={{ maxWidth: "540px", zIndex: 2 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "#eef2ff",
                  color: "#4f46e5",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  marginBottom: "1rem",
                }}
              >
                <span>🔥 Destaque em Produção</span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  marginBottom: "1rem",
                }}
              >
                {hotProduct ? hotProduct.name : "Manufatura Aditiva & Action Figures sob Medida"}
              </h1>

              <p
                style={{
                  fontSize: "1rem",
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: "1.75rem",
                }}
              >
                {hotProduct?.short_description
                  ? hotProduct.short_description.slice(0, 140) + "..."
                  : "Colecionáveis, miniaturas e peças de engenharia com acabamento profissional e precisão geométrica."}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <Link
                  href={hotProduct ? `/produtos/${hotProduct.slug}` : "/catalogo"}
                  style={{
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    padding: "0.875rem 1.75rem",
                    borderRadius: "12px",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>Ver Detalhes</span>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>

                {hotProduct && (
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                    R$ {Number(hotProduct.base_price || 99).toFixed(2).replace(".", ",")}
                  </div>
                )}
              </div>
            </div>

            {/* Imagem do Produto em Destaque Hero */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  width: "320px",
                  height: "320px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, transparent 70%)",
                }}
              />
              <img
                src={hotProduct?.images?.[0]?.image_url || "/logo.png"}
                alt={hotProduct?.name || "Produto em Destaque"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "360px",
                  objectFit: "contain",
                  position: "relative",
                  zIndex: 2,
                  filter: "drop-shadow(0 20px 30px rgba(0, 0, 0, 0.12))",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIAS DE PRODUTOS (ESTILO NOVATECH: CARDS BRANCOS COM ÍCONES E CONTADOR) */}
      <section style={{ padding: "1.5rem 0 2.5rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
            <div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>
                Categorias
              </span>
              <h2 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
                Navegar por Categoria
              </h2>
            </div>
            <Link href="/catalogo" style={{ fontSize: "0.875rem", color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
              Ver todas ({categories.length}) →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "1rem",
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalogo?categoria=${cat.slug}`}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "1.25rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  textDecoration: "none",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {cat.slug.includes("action") ? "🦸" : cat.slug.includes("geek") ? "👾" : cat.slug.includes("setup") ? "🖥️" : "⚙️"}
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                  {cat.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Explorar
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BANNER HORIZONTAL SECUNDÁRIO DE PRODUTOS HOT (ESTILO IMAGEM ANEXADA) */}
      {secondaryHotProducts.length > 0 && (
        <section style={{ padding: "1.5rem 0 2.5rem" }}>
          <div className="container">
            <div
              style={{
                backgroundColor: "#e0e7ff",
                borderRadius: "20px",
                padding: "2rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                alignItems: "center",
                gap: "2rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                  }}
                >
                  Oferta Especial
                </span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e1b4b", margin: "0.75rem 0" }}>
                  Colecionáveis Exclusivos & Lotes Abertos
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "#4338ca", maxWidth: "400px", lineHeight: 1.5 }}>
                  Modelos de alta resolução impressos em filamentos premium com tolerância mecânica rigorosa.
                </p>
                <div style={{ marginTop: "1.25rem" }}>
                  <Link
                    href="/catalogo"
                    style={{
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      padding: "0.65rem 1.25rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    Aproveitar Lotes
                  </Link>
                </div>
              </div>

              {/* Lista Horizontal de Produtos Hot */}
              <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {secondaryHotProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/produtos/${p.slug}`}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "14px",
                      padding: "1rem",
                      minWidth: "160px",
                      maxWidth: "180px",
                      textDecoration: "none",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={p.images?.[0]?.image_url || "/logo.png"}
                      alt={p.name}
                      style={{ height: "100px", width: "100%", objectFit: "contain", marginBottom: "0.5rem" }}
                    />
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#4f46e5", marginTop: "0.25rem" }}>
                      R$ {Number(p.base_price || 89).toFixed(2).replace(".", ",")}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. GRADE DE PRODUTOS REAIS (MAIS VENDIDOS / EXPLORE NOSSO CATÁLOGO) */}
      <section style={{ padding: "1.5rem 0" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
            <div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase" }}>
                Coleção Completa
              </span>
              <h2 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
                Modelos Disponíveis
              </h2>
            </div>
            <Link
              href="/catalogo"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#4f46e5",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span>Ver todos os produtos</span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. VANTAGENS E BENEFÍCIOS DO E-COMMERCE NO RODAPÉ */}
      <section style={{ marginTop: "3rem", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "2.5rem 0" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2rem", color: "#4f46e5" }}>🚚</div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>Frete Seguro</div>
                <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>Envio rastreado para todo o Brasil</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2rem", color: "#4f46e5" }}>⚙️</div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>Precisão Geométrica</div>
                <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>Camadas de 0.12mm a 0.20mm</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2rem", color: "#4f46e5" }}>🔒</div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>Pagamento Protegido</div>
                <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>Mercado Pago via PIX e Cartão</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2rem", color: "#4f46e5" }}>💬</div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9375rem" }}>Suporte Especializado</div>
                <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>Atendimento técnico dedicado</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
