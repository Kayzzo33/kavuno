import React from "react";
import Link from "next/link";
import { getCatalogProducts, getActiveCategories } from "@/lib/catalog/queries";
import { ProductCard } from "@/components/catalog/ProductCard";

export const dynamic = "force-dynamic";

// Vitrine de demonstração de alta qualidade para caso o banco de dados ainda não possua itens inseridos
const SHOWCASE_FALLBACK_PRODUCTS = [
  {
    id: "demo-1",
    category_id: "cat-1",
    campaign_id: null,
    name: "Suporte Articulado Gamer 2 em 1 para Fone e Controle",
    slug: "suporte-articulado-gamer-2-em-1",
    short_description: "Suporte modular impresso em 3D de alta resistência com canaletas para cabos e preenchimento reforçado.",
    full_description: "Projetado para organizar seu setup gamer com praticidade e elegância.",
    commercial_mode: "in_stock" as const,
    base_price: 89.9,
    promotional_price: 74.9,
    is_active: true,
    is_featured: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "cat-1",
      name: "Setup & Produtividade",
      slug: "setup-produtividade",
      description: null,
      display_order: 1,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    variants: [],
    images: [],
  },
  {
    id: "demo-2",
    category_id: "cat-2",
    campaign_id: null,
    name: "Action Figure Busto Cyberpunk Samurái 18cm",
    slug: "busto-cyberpunk-samurai-18cm",
    short_description: "Colecionável detalhado com camadas finas de 0.12mm e acabamento fosco suave.",
    full_description: "Impressão de altíssima definição para colecionadores e fãs da cultura geek.",
    commercial_mode: "in_stock" as const,
    base_price: 159.9,
    promotional_price: 139.9,
    is_active: true,
    is_featured: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "cat-2",
      name: "Action Figures & Geek",
      slug: "decoracao-design",
      description: null,
      display_order: 2,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    variants: [],
    images: [],
  },
  {
    id: "demo-3",
    category_id: "cat-1",
    campaign_id: null,
    name: "Organizador Modular Magnético de Cabos para Desk",
    slug: "organizador-modular-cabos-desk",
    short_description: "Kit com 4 módulos magnéticos para fixação rápida na borda da mesa.",
    full_description: "Nunca mais perca seus cabos de vista com essa solução modular em 3D.",
    commercial_mode: "in_stock" as const,
    base_price: 54.9,
    promotional_price: 44.9,
    is_active: true,
    is_featured: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "cat-1",
      name: "Setup & Produtividade",
      slug: "setup-produtividade",
      description: null,
      display_order: 1,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    variants: [],
    images: [],
  },
  {
    id: "demo-4",
    category_id: "cat-3",
    campaign_id: null,
    name: "Miniatura Dragão Ancião RPG de Mesa 120mm",
    slug: "miniatura-dragao-anciao-rpg",
    short_description: "Miniatura épica para mestres e jogadores de RPG com riqueza em escamas e asas.",
    full_description: "Alta densidade e resistente a quedas de mesa de jogo.",
    commercial_mode: "pre_order" as const,
    base_price: 79.9,
    promotional_price: null,
    is_active: true,
    is_featured: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: "cat-3",
      name: "Miniaturas & RPG",
      slug: "miniaturas-rpg",
      description: null,
      display_order: 3,
      is_active: true,
      created_at: "",
      updated_at: "",
    },
    variants: [],
    images: [],
  },
];

export default async function HomePage() {
  const [catalogData, categories] = await Promise.all([
    getCatalogProducts({ limit: 8, sort: "newest" }),
    getActiveCategories(),
  ]);

  const { products } = catalogData;
  const displayProducts = products.length > 0 ? products : SHOWCASE_FALLBACK_PRODUCTS;

  return (
    <div style={{ paddingBottom: "var(--spacing-2xl)" }}>
      {/* 1. Hero Promo Banner (Estilo TechBazaar / ViVA / Shopee) */}
      <section style={{ backgroundColor: "#0c0f14", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "2.5rem",
              alignItems: "center",
              background: "radial-gradient(ellipse at 80% 30%, rgba(255, 92, 0, 0.15), transparent 70%), linear-gradient(135deg, #131722 0%, #0d1017 100%)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-xl)",
              padding: "clamp(1.5rem, 4vw, 3rem)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.3rem 0.8rem",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(255, 92, 0, 0.15)",
                  border: "1px solid rgba(255, 92, 0, 0.3)",
                  color: "var(--color-primary)",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                <span>⚡</span> MANUFATURA ADITIVA DE ALTA PRECISÃO
              </div>

              <h1
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  color: "var(--text-primary)",
                  marginBottom: "1rem",
                }}
              >
                Colecionáveis Geek & Peças 3D sob Demanda.
              </h1>

              <p
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "1.75rem",
                  maxWidth: "540px",
                }}
              >
                Action figures, miniaturas épicas e organizadores de setup impressos em filamentos de alta resistência (PLA+, PETG, Resina) com acabamento profissional.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                <Link href="/catalogo" className="btn btn-primary" style={{ padding: "0.85rem 1.75rem", fontSize: "1rem", borderRadius: "var(--radius-md)" }}>
                  Explorar Loja Completa &rarr;
                </Link>
                <Link
                  href="/catalogo?modalidade=in_stock"
                  className="btn btn-secondary"
                  style={{ padding: "0.85rem 1.5rem", fontSize: "1rem", borderRadius: "var(--radius-md)" }}
                >
                  ⚡ Pronta Entrega
                </Link>
              </div>
            </div>

            {/* Visual Destaque 3D */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                background: "rgba(18, 22, 30, 0.7)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                  Destaques da Oficina 3D
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--mode-in-stock)", fontWeight: 700 }}>
                  ● EM OPERAÇÃO
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                <div style={{ padding: "0.85rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>🎯</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Resolução de Camada</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>0.12mm a 0.20mm</div>
                </div>

                <div style={{ padding: "0.85rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>🛡️</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Materiais Resistentes</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>PLA+, PETG, Resina</div>
                </div>

                <div style={{ padding: "0.85rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>⚡</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Envio em Estoque</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>Despacho em 24h</div>
                </div>

                <div style={{ padding: "0.85rem", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>💳</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pagamento Seguro</div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)" }}>PIX & Cartão em 12x</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: "2.5rem" }}>
        {/* 2. Barra de Categorias com Ícones (Estilo ViVA / TechBazaar) */}
        <section style={{ marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Categorias em Destaque
            </h2>
            <Link href="/catalogo" style={{ fontSize: "0.875rem", color: "var(--color-primary)", fontWeight: 600 }}>
              Ver Todas &rarr;
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              { label: "Action Figures & Geek", icon: "🦾", slug: "decoracao-design", count: "Colecionáveis" },
              { label: "Setup & Produtividade", icon: "🖥️", slug: "setup-produtividade", count: "Suportes e Mesas" },
              { label: "Miniaturas & RPG", icon: "🎲", slug: "miniaturas-rpg", count: "D&D e Cenários" },
              { label: "Engenharia & Peças", icon: "⚙️", slug: "prototipagem-engenharia", count: "PETG / ABS Alta Força" },
            ].map((cat, idx) => (
              <Link
                key={idx}
                href={`/catalogo?categoria=${cat.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  transition: "all var(--transition-fast)",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    fontSize: "1.75rem",
                    width: "44px",
                    height: "44px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {cat.icon}
                </div>
                <div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {cat.count}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Vitrine Principal de Produtos */}
        <section style={{ marginBottom: "3.5rem" }}>
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
                CATÁLOGO 3D
              </span>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.25rem" }}>
                Produtos em Destaque
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
              Ver Todos os Produtos &rarr;
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        </section>

        {/* 4. Banner de Vantagens e Confiança (Estilo ViVA / Mercado Livre) */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
            marginBottom: "3.5rem",
          }}
        >
          <div className="trust-banner-item">
            <span style={{ fontSize: "2rem" }}>🚚</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                Frete Rápido & Seguro
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Rastreamento nacional direto no seu WhatsApp e e-mail.
              </div>
            </div>
          </div>

          <div className="trust-banner-item">
            <span style={{ fontSize: "2rem" }}>💎</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                Qualidade de Camada
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Peças calibradas e inspecionadas manualmente antes do envio.
              </div>
            </div>
          </div>

          <div className="trust-banner-item">
            <span style={{ fontSize: "2rem" }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                Garantia KAVUNO
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Troca facilitada ou reembolso sem complicação.
              </div>
            </div>
          </div>

          <div className="trust-banner-item">
            <span style={{ fontSize: "2rem" }}>💳</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                Pagamento Seguro
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Até 12x no cartão ou desconto instantâneo no PIX.
              </div>
            </div>
          </div>
        </section>

        {/* 5. Newsletter / Chamada de Fidelidade */}
        <section
          style={{
            background: "linear-gradient(135deg, #161b24 0%, #10131a 100%)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xl)",
            padding: "2.5rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <span style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "inline-block" }}>🎁</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Ganhe 10% OFF na sua Primeira Compra
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Cadastre-se na KAVUNO para receber em primeira mão novos modelos de action figures, cupons de desconto e lotes com pronta entrega.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/cadastro" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem" }}>
                Criar Minha Conta Grátis
              </Link>
              <Link href="/catalogo" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem" }}>
                Explorar Catálogo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
