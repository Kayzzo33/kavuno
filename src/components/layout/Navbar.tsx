import React, { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { CartNavbarButton } from "@/components/layout/CartNavbarButton";
import { NavbarSearch } from "@/components/layout/NavbarSearch";
import { getSiteSettings } from "@/lib/catalog/queries";

export const Navbar = async () => {
  let userName: string | null = null;
  let isAuthenticated = false;
  let announcementText =
    "🚚 Frete Grátis para todo Brasil acima de R$ 199 • 🛡️ Garantia de Acabamento 3D • ⚡ Despacho Rápido de Pronta Entrega • 🎯 Precisão Geométrica Rigorosa • ";

  try {
    const settings = await getSiteSettings();
    if (settings?.announcement_text) {
      announcementText = settings.announcement_text;
    }
  } catch (err) {
    console.warn("[Navbar] Fallback em getSiteSettings:", err);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      userName = user.user_metadata?.full_name || user.email?.split("@")[0] || null;

      const { data: profile } = await (supabase.from("profiles") as any)
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) userName = profile.full_name;
    }
  } catch {
    // Silencioso para navegação anônima
  }

  return (
    <>
      {/* 1. LETREIRO SUPERIOR EM MARQUEE CONTÍNUO (SEM FUNDO LARANJA / TOTALMENTE FLUIDO) */}
      <div className="announcement-marquee-wrapper">
        <div className="announcement-marquee-track">
          <span>{announcementText}</span>
          <span>{announcementText}</span>
          <span>{announcementText}</span>
          <span>{announcementText}</span>
        </div>
      </div>

      {/* 2. HEADER PRINCIPAL BRANCO E LIMPO */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
            paddingTop: "0.85rem",
            paddingBottom: "0.85rem",
          }}
        >
          {/* Logo da Loja Grande e Nítida */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                backgroundColor: "#0f172a",
                borderRadius: "10px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src="/logo.png"
                alt="KAVUNO Logo"
                style={{
                  height: "32px",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
            </div>
          </Link>

          {/* Links Centrais de Navegação */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
            }}
          >
            <Link href="/" style={{ color: "#0f172a", textDecoration: "none" }}>
              Início
            </Link>
            <Link href="/catalogo" style={{ color: "#475569", textDecoration: "none" }}>
              Catálogo
            </Link>
            <Link href="/catalogo?modalidade=in_stock" style={{ color: "#475569", textDecoration: "none" }}>
              Pronta Entrega
            </Link>
            <Link href="/catalogo?modalidade=pre_order" style={{ color: "#475569", textDecoration: "none" }}>
              Pré-Vendas
            </Link>
          </nav>

          {/* Campo de Busca Centralizado e Alinhado */}
          <div style={{ flex: 1, maxWidth: "420px" }}>
            <Suspense fallback={<div style={{ height: "42px" }} />}>
              <NavbarSearch />
            </Suspense>
          </div>

          {/* Área do Usuário & Carrinho */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
            {isAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <Link
                  href="/perfil"
                  title="Meu Perfil"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    textDecoration: "none",
                    color: "#0f172a",
                  }}
                >
                  {/* Ícone Redondo com Inicial / Perfil */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                    }}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  {/* Exibe apenas o primeiro nome (NUNCA email completo) */}
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userName?.split(" ")[0] || "Minha Conta"}
                  </span>
                </Link>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    title="Sair"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      padding: "0.25rem",
                    }}
                  >
                    Sair
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Link
                  href="/login"
                  style={{
                    color: "#0f172a",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "0.4rem 0.75rem",
                  }}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  style={{
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                  }}
                >
                  Criar Conta
                </Link>
              </div>
            )}

            {/* Carrinho de Compras */}
            <CartNavbarButton />
          </div>
        </div>
      </header>
    </>
  );
};
