import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { CartNavbarButton } from "@/components/layout/CartNavbarButton";
import { NavbarSearch } from "@/components/layout/NavbarSearch";

export const Navbar = async () => {
  let userName: string | null = null;
  let userEmail: string | null = null;
  let isAuthenticated = false;
  let isAdmin = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      userEmail = user.email || null;
      userName = user.user_metadata?.full_name || user.email?.split("@")[0] || null;

      const { data: profile } = await (supabase.from("profiles") as any)
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) userName = profile.full_name;
      if (profile?.role === "admin") isAdmin = true;
    }
  } catch {
    // Falha silenciosa para navegação anônima
  }

  return (
    <>
      {/* Top Announcement Bar (Estilo ViVA / Mercado Livre) */}
      <div className="announcement-bar">
        <span>
          🚚 <strong>Frete Grátis</strong> para todo Brasil acima de R$ 199 &bull; 🛡️ Garantia de Acabamento 3D &bull; ⚡ Despacho Rápido
        </span>
      </div>

      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "rgba(9, 11, 14, 0.95)",
          backdropFilter: "blur(14px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Linha Principal do Cabeçalho */}
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
          {/* Logo KAVUNO */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="KAVUNO Logo"
              style={{
                width: "36px",
                height: "36px",
                objectFit: "contain",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "1.35rem",
                  letterSpacing: "0.02em",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                KAVUNO
              </span>
              <span
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                3D STORE
              </span>
            </div>
          </Link>

          {/* Barra de Pesquisa Centralizada (Estilo Mercado Livre / TechBazaar) */}
          <div style={{ flex: 1, maxWidth: "560px", display: "flex", justifyContent: "center" }}>
            <Suspense fallback={<div style={{ height: "2.6rem" }} />}>
              <NavbarSearch />
            </Suspense>
          </div>

          {/* Ações: Conta do Usuário e Carrinho */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
            {isAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <Link
                  href="/perfil"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-primary)",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>👤</span>
                  <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", lineHeight: 1 }}>Olá,</span>
                    <strong style={{ fontSize: "0.8125rem", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userName || userEmail?.split("@")[0]}
                    </strong>
                  </div>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    style={{
                      padding: "0.45rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "rgba(255, 92, 0, 0.15)",
                      border: "1px solid var(--color-primary)",
                      color: "var(--color-primary)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    PAINEL ADMIN
                  </Link>
                )}

                <form action={signOutAction}>
                  <button
                    type="submit"
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "0.25rem",
                      textDecoration: "underline",
                    }}
                  >
                    Sair
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Link
                  href="/login"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="btn btn-primary"
                  style={{
                    fontSize: "0.8125rem",
                    padding: "0.45rem 0.95rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  Criar Conta
                </Link>
              </div>
            )}

            <CartNavbarButton />
          </div>
        </div>

        {/* Sub-Navegação de Categorias Rápidas (Estilo Nuvemshop / TechBazaar / Shopee) */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            backgroundColor: "rgba(13, 16, 22, 0.98)",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <div
            className="container"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.75rem",
              height: "2.5rem",
              fontSize: "0.8125rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <Link
              href="/catalogo"
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>☰</span> Todos os Produtos
            </Link>
            <Link
              href="/catalogo?modalidade=in_stock"
              style={{
                color: "var(--mode-in-stock)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>⚡</span> Pronta Entrega
            </Link>
            <Link
              href="/catalogo?categoria=decoracao-design"
              style={{ color: "var(--text-secondary)", transition: "color var(--transition-fast)" }}
            >
              🎮 Action Figures & Geek
            </Link>
            <Link
              href="/catalogo?categoria=setup-produtividade"
              style={{ color: "var(--text-secondary)", transition: "color var(--transition-fast)" }}
            >
              🖥️ Setup & Desk
            </Link>
            <Link
              href="/catalogo?categoria=prototipagem-engenharia"
              style={{ color: "var(--text-secondary)", transition: "color var(--transition-fast)" }}
            >
              ⚙️ Peças Técnicas & Mecânicas
            </Link>
            <Link
              href="/catalogo?ordenar=price_asc"
              style={{
                color: "var(--color-primary)",
                fontWeight: 600,
              }}
            >
              🏷️ Ofertas Especiais
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};
