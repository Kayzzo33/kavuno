import React, { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { CartNavbarButton } from "@/components/layout/CartNavbarButton";
import { NavbarSearch } from "@/components/layout/NavbarSearch";
import { getSiteSettings, getActiveCategories } from "@/lib/catalog/queries";

export const Navbar = async () => {
  let userName: string | null = null;
  let isAuthenticated = false;
  let isAdmin = false;

  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getActiveCategories(),
  ]);

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
      if (profile?.role === "admin") isAdmin = true;
    }
  } catch {
    // Silencioso para navegação anônima
  }

  return (
    <>
      {/* 1. Barra Superior Informativa (Branca / Azul Claro com frete grátis) */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          fontSize: "0.75rem",
          color: "#475569",
          padding: "0.4rem 0",
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📦 {settings.announcement_text || "Frete Grátis em pedidos acima de R$ 199"}</span>
          <div style={{ display: "flex", gap: "1rem" }}>
            <span>⚡ Manufatura Aditiva de Alta Precisão</span>
            <span>⭐ Garantia de Acabamento 3D</span>
          </div>
        </div>
      </div>

      {/* 2. Header Principal Branco com Sombra Leve */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
            paddingTop: "0.85rem",
            paddingBottom: "0.85rem",
          }}
        >
          {/* Logo da Loja */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="KAVUNO Logo"
              style={{
                height: "36px",
                width: "auto",
                objectFit: "contain",
                filter: "invert(1)", // Torna a logo branca legível no fundo branco
              }}
            />
          </Link>

          {/* Links Centrais de Navegação (Estilo NovaTech) */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.75rem",
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
            {isAdmin && (
              <Link
                href="/admin"
                style={{
                  color: "#008060",
                  textDecoration: "none",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#008060" }} />
                Painel Admin
              </Link>
            )}
          </nav>

          {/* Campo de Busca Inteligente estilo NovaTech */}
          <div style={{ flex: 1, maxWidth: "380px" }}>
            <Suspense fallback={<div style={{ height: "40px" }} />}>
              <NavbarSearch />
            </Suspense>
          </div>

          {/* Ações do Usuário & Carrinho */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
            {isAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Link
                  href="/perfil"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    textDecoration: "none",
                    color: "#0f172a",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                    }}
                  >
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span>{userName?.split(" ")[0]}</span>
                </Link>

                <form action={signOutAction}>
                  <button
                    type="submit"
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

            {/* Botão de Carrinho com badge */}
            <CartNavbarButton />
          </div>
        </div>
      </header>
    </>
  );
};
