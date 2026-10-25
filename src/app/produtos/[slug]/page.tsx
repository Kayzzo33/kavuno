import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ProductDetailClient } from "@/components/catalog/ProductDetailClient";
import { Card } from "@/components/ui/Card";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Pré-renderiza todos os slugs de produtos ativos em build-time para
 * melhor desempenho de SEO (ISR via revalidate ou export estático).
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const supabase = createAdminClient();
    const { data: products } = await supabase
      .from("products")
      .select("slug")
      .eq("is_active", true);
    return (products ?? []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto não encontrado | 3D Commerce",
    };
  }

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];

  return {
    title: `${product.meta_title || product.name} | 3D Commerce`,
    description:
      product.meta_description ||
      product.short_description ||
      `Confira ${product.name} impresso em 3D com alta precisão na plataforma 3D Commerce.`,
    openGraph: {
      title: `${product.name} | 3D Commerce`,
      description: product.short_description || undefined,
      images: primaryImage?.image_url ? [{ url: primaryImage.image_url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kavuno.com.br";
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const finalPrice = product.promotional_price && product.promotional_price > 0
    ? product.promotional_price
    : product.base_price;

  // JSON-LD Schema.org Product para SEO e Rich Results do Google
  const jsonLdProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description || product.full_description || undefined,
    url: `${appUrl}/produtos/${product.slug}`,
    image: primaryImage?.image_url ? [primaryImage.image_url] : undefined,
    brand: { "@type": "Brand", name: "KAVUNO" },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: finalPrice.toFixed(2),
      availability:
        product.commercial_mode === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      url: `${appUrl}/produtos/${product.slug}`,
      seller: { "@type": "Organization", name: "KAVUNO" },
    },
  };

  return (
    <div style={{ paddingTop: "var(--spacing-xl)", paddingBottom: "var(--spacing-2xl)" }}>
      {/* JSON-LD Estruturado para Produto */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }}
      />
      <div className="container">
        {/* Breadcrumb Técnico */}
        <nav
          aria-label="Breadcrumb"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginBottom: "var(--spacing-lg)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Link href="/" style={{ color: "var(--text-secondary)" }}>
            INÍCIO
          </Link>
          <span>/</span>
          <Link href="/catalogo" style={{ color: "var(--text-secondary)" }}>
            CATÁLOGO
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/catalogo?categoria=${product.category.slug}`}
                style={{ color: "var(--text-secondary)" }}
              >
                {product.category.name.toUpperCase()}
              </Link>
            </>
          )}
          <span>/</span>
          <span style={{ color: "var(--color-primary)" }}>{product.slug.toUpperCase()}</span>
        </nav>

        {/* Layout Principal: 2 Colunas (Mobile-first) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--spacing-2xl)",
            alignItems: "start",
            marginBottom: "var(--spacing-2xl)",
          }}
        >
          {/* Coluna 1: Galeria de Fotos */}
          <div>
            <ProductGallery
              images={product.images || []}
              productName={product.name}
            />
          </div>

          {/* Coluna 2: Detalhes, Variantes e Ações */}
          <div>
            <ProductDetailClient product={product} />
          </div>
        </div>

        {/* Seção Inferior: Especificações Técnicas e Descrição Completa */}
        <div style={{ marginTop: "var(--spacing-xl)" }}>
          <Card variant="bracket">
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--color-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                // FICHA TÉCNICA // MANUFATURA ADITIVA FDM
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                ESPECIFICAÇÕES & ENGENHARIA DO MODELO
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "var(--spacing-xl)",
              }}
            >
              {/* Descrição Detalhada */}
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Descrição do Projeto
                </h3>
                <div
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-line",
                  }}
                >
                  {product.full_description ||
                    product.short_description ||
                    "Modelo tridimensional desenvolvido com tolerâncias mecânicas otimizadas para fatiamento preciso e encaixes suaves."}
                </div>
              </div>

              {/* Tabela de Parâmetros de Impressão */}
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Parâmetros de Fabricação Padrão
                </h3>
                <ul
                  style={{
                    listStyle: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <li>• TECNOLOGIA: FDM (Modelagem por Fusão e Deposição)</li>
                  <li>• ALTURA DE CAMADA TÍPICA: 0.16mm - 0.20mm (alta resolução)</li>
                  <li>• PREENCHIMENTO (INFILL): 20% a 30% Gyroid estrutural</li>
                  <li>• CONTROLE DE QUALIDADE: Inspeção visual de aderência e tolerância</li>
                  <li>• ACABAMENTO: Desbaste de suportes limpo e conferência dimensional</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
