import React from "react";
import Link from "next/link";
import { getCatalogProducts, getActiveCategories, getActiveCampaigns } from "@/lib/catalog/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/catalog/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalogData, categories, campaigns] = await Promise.all([
    getCatalogProducts({ limit: 6, sort: "newest" }),
    getActiveCategories(),
    getActiveCampaigns(),
  ]);

  const { products, total } = catalogData;

  return (
    <div style={{ paddingTop: "var(--spacing-2xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        {/* Banner Técnico da Infraestrutura */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--spacing-xl)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="badge-dot" style={{ backgroundColor: "var(--mode-in-stock)" }} />
            <span style={{ color: "var(--text-secondary)" }}>SISTEMA:</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>POSTGRESQL // CATÁLOGO & VALIDAÇÃO</span>
          </div>
          <div style={{ color: "var(--text-muted)" }}>
            STATUS: <span style={{ color: "var(--mode-in-stock)" }}>ONLINE (SUPABASE RLS)</span>
          </div>
        </div>

        {/* Hero Section */}
        <section style={{ marginBottom: "var(--spacing-2xl)" }}>
          <div style={{ maxWidth: "820px" }}>
            <div style={{ marginBottom: "var(--spacing-sm)" }}>
              <Badge mode="interest_lead" label="OFICINA DE MANUFATURA ADITIVA // 3D" />
            </div>
            <h1
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "var(--text-primary)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              PROJETOS MECÂNICOS & DESIGN IMPRESSOS SOB DEMANDA.
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "var(--spacing-xl)",
              }}
            >
              Compre itens de pronta entrega ou participe de campanhas de validação de demanda gratuitas para viabilizar novos lotes de produção com transparência e precisão geométrica.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <Link href="/catalogo">
                <Button variant="primary" size="lg">
                  EXPLORAR CATÁLOGO ({total})
                </Button>
              </Link>
              <Link href="/validacao">
                <Button variant="bracket" size="lg">
                  CAMPANHAS DE VALIDAÇÃO
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Seção de Categorias Ativas */}
        {categories.length > 0 && (
          <section style={{ marginBottom: "var(--spacing-2xl)" }}>
            <div style={{ marginBottom: "var(--spacing-md)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)" }}>
                // SEGMENTOS
              </span>
              <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem" }}>
                Categorias Principais
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${cat.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    variant="bracket"
                    style={{
                      padding: "var(--spacing-md)",
                      transition: "transform var(--transition-fast), border-color var(--transition-fast)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
                      [ CAT_{cat.slug.slice(0, 4).toUpperCase()} ]
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {cat.name}
                    </div>
                    {cat.description && (
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                        {cat.description}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Vitrine de Produtos Reais em Destaque */}
        <section id="catalogo" style={{ marginBottom: "var(--spacing-2xl)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)" }}>
                // VITRINE ATUAL
              </span>
              <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>
                Modelos em Destaque
              </h2>
            </div>
            <Link
              href="/catalogo"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                color: "var(--color-primary)",
                fontWeight: 600,
              }}
            >
              VER CATÁLOGO COMPLETO &rarr;
            </Link>
          </div>

          {products.length === 0 ? (
            <Card variant="bracket" style={{ textAlign: "center", padding: "var(--spacing-2xl)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                [ NENHUM PRODUTO ATIVO NO BANCO ]
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
                Execute o script de seed opcional (<code>supabase/seeds/01_foundation_seed.sql</code>) no seu painel ou adicione produtos pelo banco para vê-los listados na vitrine.
              </p>
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "var(--spacing-lg)",
              }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Seção das Campanhas de Validação Ativas */}
        {campaigns.length > 0 && (
          <section id="validacao" style={{ marginBottom: "var(--spacing-2xl)" }}>
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--mode-interest)" }}>
                // CALIBRAÇÃO DE DEMANDA
              </span>
              <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 700, marginTop: "0.25rem" }}>
                Campanhas Abertas para Reserva
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--spacing-lg)" }}>
              {campaigns.map((camp) => (
                <Card
                  key={camp.id}
                  variant="bracket"
                  headerBadge={<Badge mode={camp.commercial_mode} />}
                >
                  <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    {camp.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "var(--spacing-md)" }}>
                    {camp.description}
                  </p>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--spacing-md)" }}>
                    META DO LOTE: {camp.target_min_units} UNIDADES // RESERVAS: {camp.current_units_pledged}
                  </div>
                  <Link href={`/validacao`} className="btn btn-bracket" style={{ width: "100%", textAlign: "center" }}>
                    DETALHES DA CAMPANHA
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Modalidades Comerciais Canônicas */}
        <section style={{ marginBottom: "var(--spacing-2xl)" }}>
          <div style={{ marginBottom: "var(--spacing-md)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)" }}>
              // TRANSPARÊNCIA COMERCIAL
            </span>
            <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>
              Nossas 3 Modalidades de Compra e Reserva
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "var(--spacing-lg)",
            }}
          >
            <Card variant="bracket" headerBadge={<Badge mode="in_stock" />}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                1. Pronta Entrega
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Itens físicos prontos na prateleira com controle estrito de saldo. Despacho ágil com código de rastreio nacional.
              </p>
            </Card>

            <Card variant="bracket" headerBadge={<Badge mode="pre_order" />}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                2. Pré-venda Paga
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Pedido antecipado com desconto em lote. Cronograma de fatiamento e produção claro, com garantia de devolução integral caso a meta não seja alcançada.
              </p>
            </Card>

            <Card variant="bracket" headerBadge={<Badge mode="interest_lead" />}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                3. Reserva Gratuita
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Manifestação de interesse sem pagamento, sem dados de cartão e sem gerar pedido formal. Usada pelo proprietário para dimensionar a compra de filamentos e maquinário.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
