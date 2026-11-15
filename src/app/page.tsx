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
  const hasBanners = banners && banners.length > 0;
  const isBannerMode = settings.hero_mode === "banner" && hasBanners;

  // Se não houver banner cadastrado, o fluxo de hierarquia desce direto para os produtos / hot products
  const hotProduct = products.find((p) => p.is_featured) || products[0] || null;
  const secondaryHotProducts = products.filter((p) => p.id !== hotProduct?.id).slice(0, 4);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "4rem" }}>
      {/* 1. SEÇÃO HERO: SE TIVER BANNER CADASTRADO E ATIVO EXIBE O BANNER, SENÃO SEGUE O FLUXO */}
      {isBannerMode && hasBanners ? (
        <section style={{ padding: "1.5rem 0" }}>
          <div className="container">
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: "420px",
                borderRadius: "24px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                padding: "clamp(2rem, 5vw, 4rem)",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              }}
            >
              <img
                src={banners[0].image_url}
                alt={banners[0].title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.3) 60%, transparent 100%)",
                }}
              />
              <div style={{ position: "relative", zIndex: 2, maxWidth: "560px" }}>
                {banners[0].tag && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#ffffff",
                      backgroundColor: "#4f46e5",
                      padding: "0.35rem 0.85rem",
                      borderRadius: "9999px",
                      marginBottom: "1rem",
                    }}
                  >
                    {banners[0].tag}
                  </span>
                )}
                <h1
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1.15,
                    marginBottom: "1rem",
                  }}
                >
                  {banners[0].title}
                </h1>
                {banners[0].subtitle && (
                  <p style={{ fontSize: "1rem", color: "#e2e8f0", lineHeight: 1.6, marginBottom: "1.75rem" }}>
                    {banners[0].subtitle}
                  </p>
                )}
                {banners[0].link_url && (
                  <Link
                    href={banners[0].link_url}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      padding: "0.85rem 1.75rem",
                      borderRadius: "12px",
                      textDecoration: "none",
                    }}
                  >
                    {banners[0].button_text || "Conferir Agora"} &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* HERO COM PRODUTO EM DESTAQUE CENTRALIZADO E ELEGANTE */
        hotProduct && (
          <section style={{ padding: "1.5rem 0" }}>
            <div className="container">
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  padding: "clamp(2rem, 5vw, 3.5rem)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  alignItems: "center",
                  gap: "2.5rem",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                  border: "1px solid #e2e8f0",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ maxWidth: "520px" }}>
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
                    <span>🔥 Destaque da Semana</span>
                  </div>

                  <h1
                    style={{
                      fontSize: "clamp(2rem, 3.5vw, 3rem)",
                      fontWeight: 900,
                      color: "#0f172a",
                      lineHeight: 1.15,
                      letterSpacing: "-0.03em",
                      marginBottom: "1rem",
                    }}
                  >
                    {hotProduct.name}
                  </h1>

                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#64748b",
                      lineHeight: 1.6,
                      marginBottom: "1.75rem",
                    }}
                  >
                    {hotProduct.short_description || "Colecionável exclusivo de alta resolução impresso em 3D com acabamento profissional."}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                    <Link
                      href={`/produtos/${hotProduct.slug}`}
                      style={{
                        backgroundColor: "#4f46e5",
                        color: "#ffffff",
                        fontSize: "0.9375rem",
                        fontWeight: 700,
                        padding: "0.85rem 1.75rem",
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

                    <div style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a" }}>
                      R$ {Number(hotProduct.base_price || 99).toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                </div>

                {/* Imagem do Produto */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
                  <img
                    src={hotProduct.images?.[0]?.image_url || "/logo.png"}
                    alt={hotProduct.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "340px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 15px 25px rgba(0, 0, 0, 0.1))",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        )
      )}

      {/* 2. CATEGORIAS DE PRODUTOS CENTRALIZADAS COM ÍCONES */}
      <section style={{ padding: "2rem 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Categorias
            </span>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
              Navegar por Categoria
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
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

      {/* 3. BANNER HORIZONTAL DE PRODUTOS HOT CENTRALIZADO */}
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
                  Destaques Especiais
                </span>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e1b4b", margin: "0.75rem 0" }}>
                  Peças Exclusivas & Mais Procuradas
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "#4338ca", maxWidth: "400px", lineHeight: 1.5 }}>
                  Modelos de alta fidelidade impressos em filamentos nobres com acabamento artesanal.
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
                    Ver Todo o Catálogo &rarr;
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

      {/* 4. GRADE DE PRODUTOS REAIS (MAIS VENDIDOS) COM TÍTULO CENTRALIZADO */}
      <section style={{ padding: "1.5rem 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Nossos Produtos
            </span>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
              Explore Nossos Mais Vendidos
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
