import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Início | Painel de Gestão KAVUNO",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Header de Boas-Vindas Estilo Shopify (conforme imagem de anexo do usuário) */}
      <div style={{ textAlign: "center", padding: "1rem 0 0.5rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#202223",
            letterSpacing: "-0.02em",
            marginBottom: "0.25rem",
          }}
        >
          Boas-vindas à KAVUNO 3D
        </h1>
        <p style={{ fontSize: "1rem", color: "#6d7175" }}>
          Vamos configurar e gerenciar sua loja de manufatura e impressão sob demanda
        </p>

        {/* Input Inteligente com Ações Rápidas (Estilo Magic Bar Shopify) */}
        <div
          style={{
            maxWidth: "600px",
            margin: "1.25rem auto 0",
            backgroundColor: "#ffffff",
            border: "1px solid #e1e3e5",
            borderRadius: "12px",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            gap: "0.75rem",
          }}
        >
          <span style={{ color: "#008060", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="O que você deseja gerenciar hoje? (ex: Criar produto, Ver pedidos, Ajustar bobinas...)"
            style={{
              border: "none",
              outline: "none",
              fontSize: "0.875rem",
              width: "100%",
              color: "#202223",
            }}
          />
        </div>
      </div>

      {/* 2. Setup Guide / Passos Essenciais da Loja (Cartões Brancos do Shopify) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Card 1: Adicionar Produto */}
        <div className="shopify-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "#f4f6f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                color: "#202223",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#202223", marginBottom: "0.35rem" }}>
              Adicione seu primeiro produto
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#6d7175", lineHeight: 1.4 }}>
              Comece cadastrando um item com título, fotos, preço, filamento e especificações técnicas de impressão 3D.
            </p>
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <Link href="/admin/produtos/novo" className="shopify-btn-secondary">
              Adicionar produto
            </Link>
          </div>
        </div>

        {/* Card 2: Banners e Design da Loja */}
        <div className="shopify-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "#f4f6f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                color: "#202223",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#202223", marginBottom: "0.35rem" }}>
              Banners e Vitrine da Loja
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#6d7175", lineHeight: 1.4 }}>
              Suba suas imagens de banner oficiais, alterne entre vitrine Hot Products ou campanhas promocionais.
            </p>
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <Link href="/admin/banners" className="shopify-btn-secondary">
              Gerenciar Banners
            </Link>
          </div>
        </div>

        {/* Card 3: Fábrica 3D e Bobinas */}
        <div className="shopify-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "#f4f6f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                color: "#008060",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#202223", marginBottom: "0.35rem" }}>
              Estoque de Bobinas & Produção
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#6d7175", lineHeight: 1.4 }}>
              Cadastre suas bobinas de filamento (PLA, PETG, ABS), custo por grama e vincule com impressoras 3D.
            </p>
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <Link href="/admin/fabrica" className="shopify-btn-secondary">
              Painel da Fábrica
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Métricas do Negócio (Visão Geral em Cards Brancos Elegantes) */}
      <div style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#202223" }}>
            Visão Geral dos Indicadores
          </h2>
          <Link href="/admin/analytics" style={{ fontSize: "0.8125rem", color: "#008060", textDecoration: "none", fontWeight: 600 }}>
            Ver relatórios completos →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          <div className="shopify-card">
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6d7175", textTransform: "uppercase" }}>
              Total de Produtos
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#202223", margin: "0.35rem 0" }}>
              {stats.totalProducts}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#008060" }}>
              {stats.activeProducts} ativos na vitrine
            </div>
          </div>

          <div className="shopify-card">
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6d7175", textTransform: "uppercase" }}>
              Coleções / Categorias
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#202223", margin: "0.35rem 0" }}>
              {stats.totalCategories}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6d7175" }}>
              Organizadas para o cliente
            </div>
          </div>

          <div className="shopify-card">
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6d7175", textTransform: "uppercase" }}>
              Campanhas de Lote
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#202223", margin: "0.35rem 0" }}>
              {stats.activeCampaigns}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6d7175" }}>
              De {stats.totalCampaigns} criadas no total
            </div>
          </div>

          <div className="shopify-card">
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6d7175", textTransform: "uppercase" }}>
              Leads e Reservas
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#202223", margin: "0.35rem 0" }}>
              {stats.totalLeads}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#008060" }}>
              +{stats.leadsLast30Days} nos últimos 30 dias
            </div>
          </div>
        </div>
      </div>

      {/* 4. Ações Rápidas de Gestão */}
      <div className="shopify-card" style={{ marginTop: "0.5rem" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#202223", marginBottom: "1rem" }}>
          Ações Rápidas do Gestor
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link href="/admin/produtos/novo" className="shopify-btn-primary">
            + Novo Produto
          </Link>
          <Link href="/admin/banners" className="shopify-btn-secondary">
            + Adicionar Banner
          </Link>
          <Link href="/admin/categorias/nova" className="shopify-btn-secondary">
            + Nova Categoria
          </Link>
          <Link href="/admin/fabrica/bobinas/nova" className="shopify-btn-secondary">
            + Cadastrar Bobina de Filamento
          </Link>
          <Link href="/admin/campanhas/nova" className="shopify-btn-secondary">
            + Nova Campanha de Lote
          </Link>
        </div>
      </div>
    </div>
  );
}
