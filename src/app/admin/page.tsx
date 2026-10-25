import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/admin/queries";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Dashboard Admin | 3D Commerce",
};

export const dynamic = "force-dynamic";

interface StatCardProps {
  label: string;
  value: number;
  sublabel?: string;
  href?: string;
  accent?: "primary" | "success" | "interest" | "warning";
}

function StatCard({ label, value, sublabel, href, accent = "primary" }: StatCardProps) {
  const accentColor =
    accent === "success"
      ? "var(--mode-in-stock)"
      : accent === "interest"
      ? "var(--mode-interest)"
      : accent === "warning"
      ? "var(--mode-pre-order)"
      : "var(--color-primary)";

  const content = (
    <Card
      variant="bracket"
      style={{ padding: "var(--spacing-md)", height: "100%" }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: accentColor,
          marginBottom: "0.5rem",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "2.5rem",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1,
          marginBottom: "0.375rem",
        }}
      >
        {value.toLocaleString("pt-BR")}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {sublabel}
        </div>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "0.25rem",
          }}
        >
          // PAINEL DE CONTROLE // VISÃO GERAL
        </div>
        <h1
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.75rem",
            fontWeight: 800,
          }}
        >
          DASHBOARD OPERACIONAL
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Gerencie o catálogo, campanhas e leads de interesse da plataforma.
        </p>
      </div>

      {/* Métricas Principais */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "var(--spacing-md)",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <StatCard
          label="TOTAL DE PRODUTOS"
          value={stats.totalProducts}
          sublabel={`${stats.activeProducts} ativos`}
          href="/admin/produtos"
          accent="primary"
        />
        <StatCard
          label="PRODUTOS ATIVOS"
          value={stats.activeProducts}
          sublabel="visíveis no catálogo"
          href="/admin/produtos"
          accent="success"
        />
        <StatCard
          label="CATEGORIAS"
          value={stats.totalCategories}
          sublabel="segmentos ativos"
          href="/admin/categorias"
          accent="primary"
        />
        <StatCard
          label="CAMPANHAS ATIVAS"
          value={stats.activeCampaigns}
          sublabel={`de ${stats.totalCampaigns} total`}
          href="/admin/campanhas"
          accent="warning"
        />
        <StatCard
          label="TOTAL DE LEADS"
          value={stats.totalLeads}
          sublabel="reservas gratuitas"
          href="/admin/leads"
          accent="interest"
        />
        <StatCard
          label="LEADS (30 DIAS)"
          value={stats.leadsLast30Days}
          sublabel="últimos 30 dias"
          href="/admin/leads"
          accent="interest"
        />
      </div>

      {/* Atalhos de Ação Rápida */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          // AÇÕES RÁPIDAS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--spacing-md)",
          }}
        >
          <Link href="/admin/produtos/novo" style={{ textDecoration: "none" }}>
            <Card
              variant="bracket"
              style={{
                padding: "var(--spacing-md)",
                cursor: "pointer",
                transition: "border-color var(--transition-fast)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                + NOVO PRODUTO
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Cadastrar produto no catálogo
              </div>
            </Card>
          </Link>

          <Link href="/admin/categorias/nova" style={{ textDecoration: "none" }}>
            <Card
              variant="bracket"
              style={{
                padding: "var(--spacing-md)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                + NOVA CATEGORIA
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Organizar o catálogo por segmento
              </div>
            </Card>
          </Link>

          <Link href="/admin/campanhas/nova" style={{ textDecoration: "none" }}>
            <Card
              variant="bracket"
              style={{
                padding: "var(--spacing-md)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                + NOVA CAMPANHA
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Lançar lote de pré-venda ou validação
              </div>
            </Card>
          </Link>

          <Link href="/admin/leads" style={{ textDecoration: "none" }}>
            <Card
              variant="bracket"
              style={{
                padding: "var(--spacing-md)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "var(--mode-interest)",
                  marginBottom: "0.25rem",
                }}
              >
                ◎ VER LEADS
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {stats.leadsLast30Days} reservas nos últimos 30 dias
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Info do sistema */}
      <Card
        variant="bracket"
        style={{
          padding: "var(--spacing-md)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
        }}
      >
        <div style={{ marginBottom: "0.25rem" }}>
          // INFRAESTRUTURA: SUPABASE POSTGRESQL · RLS ATIVO · NEXT.JS 15 APP ROUTER
        </div>
        <div>
          // B.5 (CHECKOUT + MERCADO PAGO) E B.6 (ESTOQUE + BOBINAS) EM DESENVOLVIMENTO
        </div>
      </Card>
    </div>
  );
}
