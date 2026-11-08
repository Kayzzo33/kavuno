import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCatalogProducts, getActiveCategories, getSiteSettings, getActiveSiteBanners } from "@/lib/catalog/queries";
import { ProductCard } from "@/components/catalog/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalogData, categories, settings, banners] = await Promise.all([
    getCatalogProducts({ limit: 12, sort: "newest" }),
    getActiveCategories(),
    getSiteSettings(),
    getActiveSiteBanners(),
  ]);

  const { products } = catalogData;
  const isBannerMode = settings.hero_mode === "banner" && banners.length > 0;
  const activeBanner = banners[0];

  // Identifica o produto em destaque principal para o Hero (estilo imagem 3 / Hypeclt)
  const hotProduct = products.find((p) => p.is_featured) || products[0] || null;
  const secondaryHotProducts = products.filter((p) => p.id !== hotProduct?.id).slice(0, 4);

  return (
    <div style={{ paddingBottom: "var(--spacing-2xl)" }}>
      {/* 1. HERO SECTION: DINÂMICA (PRODUTOS HOT ESTILO IMAGEM 3 OU BANNER GRÁFICO REAL) */}
      {isBannerMode && activeBanner ? (
        // MODO BANNER GRÁFICO REAL
        <section style={{ backgroundColor: "#090c10", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: "440px",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                border: "1px solid var(--border-medium)",
                display: "flex",
                alignItems: "flex-end",
                padding: "clamp(2rem, 5vw, 3.5rem)",
                boxShadow: "var(--shadow-lg)",
                backgroundColor: "#0d1017",
              }}
            >
              <img
                src={activeBanner.image_url}
                alt={activeBanner.title}
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
                  background: "linear-gradient(to top, rgba(9, 11, 15, 0.95) 0%, rgba(9, 11, 15, 0.4) 60%, transparent 100%)",
                }}
              />

              <div style={{ position: "relative", zIndex: 2, maxWidth: "600px" }}>
                {activeBanner.tag && (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--color-primary)",
                      backgroundColor: "rgba(255, 92, 0, 0.15)",
                      border: "1px solid var(--color-primary)",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "var(--radius-full)",
                      marginBottom: "0.85rem",
                    }}
                  >
                    {activeBanner.tag}
                  </span>
                )}
                <h1
                  style={{
                    fontSize: "clamp(2rem, 4vw, 3.25rem)",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                    color: "#ffffff",
                    marginBottom: "0.75rem",
                  }}
                >
                  {activeBanner.title}
                </h1>
                {activeBanner.subtitle && (
                  <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                    {activeBanner.subtitle}
                  </p>
                )}
                {activeBanner.link_url && (
                  <Link
                    href={activeBanner.link_url}
                    className="btn btn-primary"
                    style={{
                      padding: "0.85rem 2rem",
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {activeBanner.button_text || "Conferir Agora &rarr;"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : hotProduct ? (
        // MODO PRODUTOS HOT / MAIS VENDIDOS (INSPIRADO NA IMAGEM 3 - HYPECLT & TECH STREETWEAR)
        <section
          style={{
            backgroundColor: "#0d1016",
            borderBottom: "1px solid var(--border-subtle)",
            background: "radial-gradient(ellipse at 80% 40%, rgba(255, 92, 0, 0.12), transparent 60%), #0d1016",
          }}
        >
          <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "2.5rem",
                alignItems: "center",
              }}
            >
              {/* Lado Esquerdo: Tipografia e Chamada Hot */}
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "rgba(255, 92, 0, 0.15)",
                    border: "1px solid var(--color-primary)",
                    color: "var(--color-primary)",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "1.25rem",
                  }}
                >
                  🔥 PRODUTO EM DESTAQUE // HOT DROP
                </div>

                <h1
                  style={{
                    fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                    color: "#ffffff",
                    marginBottom: "1rem",
                  }}
                >
                  {hotProduct.name}
                </h1>

                <p
                  style={{
                    fontSize: "1.0625rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: "1.75rem",
                    maxWidth: "520px",
                  }}
                >
                  {hotProduct.short_description || "Manufatura aditiva de alta precisão com acabamento premium e preenchimento reforçado para máxima durabilidade."}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-primary)" }}>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      hotProduct.promotional_price && hotProduct.promotional_price > 0
                        ? hotProduct.promotional_price
                        : hotProduct.base_price
                    )}
                  </div>
                  <span style={{ fontSize: "0.875rem", color: "var(--mode-in-stock)", fontWeight: 700 }}>
                    ⚡ {hotProduct.commercial_mode === "in_stock" ? "Pronta Entrega" : "Sob Encomenda"}
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  <Link
                    href={`/produtos/${hotProduct.slug}`}
                    className="btn btn-primary"
                    style={{
                      padding: "0.85rem 2rem",
                      fontSize: "1rem",
                      borderRadius: "var(--radius-full)",
                      fontWeight: 800,
                    }}
                  >
                    Comprar Agora &rarr;
                  </Link>
                  <Link
                    href="/catalogo"
                    className="btn btn-secondary"
                    style={{
                      padding: "0.85rem 1.75rem",
                      fontSize: "1rem",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    Ver Todo o Catálogo
                  </Link>
                </div>

                {/* Miniaturas de outros itens HOT (estilo imagem 3) */}
                {secondaryHotProducts.length > 0 && (
                  <div style={{ marginTop: "2.5rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                      Mais Modelos em Alta:
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {secondaryHotProducts.map((p) => {
                        const img = p.images?.[0]?.image_url;
                        return (
                          <Link
                            key={p.id}
                            href={`/produtos/${p.slug}`}
                            title={p.name}
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "var(--radius-md)",
                              backgroundColor: "var(--bg-surface)",
                              border: "1px solid var(--border-medium)",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "transform var(--transition-fast), border-color var(--transition-fast)",
                            }}
                          >
                            {img ? (
                              <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ fontSize: "1.25rem" }}>📦</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Lado Direito: Card Flutuante com Efeito Glassmorphism (Estilo Imagem 3) */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    width: "100%",
                    maxWidth: "460px",
                    borderRadius: "var(--radius-xl)",
                    backgroundColor: "rgba(20, 24, 33, 0.75)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    padding: "1.5rem",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 92, 0, 0.15)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "100%",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "#080a0e",
                      overflow: "hidden",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {hotProduct.images?.[0]?.image_url ? (
                      <img
                        src={hotProduct.images[0].image_url}
                        alt={hotProduct.name}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                        <span style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🦾</span>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>KAVUNO 3D STUDIO</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase" }}>
                        {hotProduct.category?.name || "Impressão 3D"}
                      </span>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#fff", marginTop: "0.15rem" }}>
                        {hotProduct.name}
                      </h3>
                    </div>
                    <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--color-primary)" }}>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        hotProduct.promotional_price && hotProduct.promotional_price > 0
                          ? hotProduct.promotional_price
                          : hotProduct.base_price
                      )}
                    </span>
                  </div>

                  <Link
                    href={`/produtos/${hotProduct.slug}`}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-md)",
                      fontWeight: 700,
                    }}
                  >
                    + Ver Detalhes & Adicionar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        // ESTADO VAZIO LIMPO E ELEGANTE QUANDO NÃO HÁ PRODUTOS CADASTRADOS NO BANCO
        <section style={{ backgroundColor: "#090c10", borderBottom: "1px solid var(--border-subtle)", padding: "4rem 0" }}>
          <div className="container" style={{ textAlign: "center", maxWidth: "600px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1rem" }}>
              KAVUNO 3D &bull; Manufatura Aditiva
            </h1>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Nenhum produto cadastrado no momento. Acesse o painel administrativo para cadastrar produtos reais ou banners.
            </p>
            <Link href="/admin-login" className="btn btn-primary">
              Acessar Painel Administrativo
            </Link>
          </div>
        </section>
      )}

      {/* 2. ESTRUTURA DE CATEGORIAS REAIS DO BANCO (SEM ÍCONES GENÉRICOS DE IA - ESTILO IMAGEM 4) */}
      {categories.length > 0 && (
        <div className="container" style={{ marginTop: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                DEPARTAMENTOS
              </span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                Categorias em Foco
              </h2>
            </div>
            <Link href="/catalogo" style={{ fontSize: "0.875rem", color: "var(--color-primary)", fontWeight: 700 }}>
              Ver Catálogo Completo &rarr;
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalogo?categoria=${cat.slug}`}
                style={{
                  padding: "1.25rem 1.5rem",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  transition: "all var(--transition-fast)",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "100px",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {cat.description}
                    </p>
                  )}
                </div>
                <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Explorar Itens &rarr;
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. VITRINE DE PRODUTOS REAIS (ESTILO IMAGEM 4 - GRID MODERNO E LIMPO) */}
      <div className="container" style={{ marginTop: "3.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              CATÁLOGO DE LANÇAMENTOS
            </span>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              Modelos Recentes da Impressora 3D
            </h2>
          </div>
          <Link
            href="/catalogo"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-primary)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Ver Todos ({products.length}) &rarr;
          </Link>
        </div>

        {products.length === 0 ? (
          <div
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
              backgroundColor: "var(--bg-surface)",
              border: "1px dashed var(--border-medium)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Nenhum produto ativo cadastrado no momento.
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "460px", margin: "0 auto 1.5rem" }}>
              Cadastre suas peças 3D reais no painel de administração para exibi-las aqui na vitrine.
            </p>
            <Link href="/admin/produtos/novo" className="btn btn-primary">
              + Cadastrar Produto no Admin
            </Link>
          </div>
        ) : (
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
        )}

        {/* 4. GARANTIAS & BENEFÍCIOS REFORMULADOS (SEM ÍCONES DE IA - ESTILO BRANDING PREMIUM) */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
            marginTop: "4rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              LOGÍSTICA NACIONAL
            </div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Envio Rápido & Seguro
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Rastreamento direto com envio ágil para compras a pronta entrega.
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              ENGENHARIA 3D
            </div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Precisão Dimensional
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Camadas de 0.12mm a 0.20mm com inspeção visual antes de qualquer envio.
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              COMPRA PROTEGIDA
            </div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Garantia KAVUNO
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Compromisso de troca ou estorno em caso de avaria no transporte.
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              CHECKOUT BLINDADO
            </div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Mercado Pago Integrado
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              PIX com aprovação imediata e cartões de crédito em até 12 parcelas.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
