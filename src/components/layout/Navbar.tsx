import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { CartNavbarButton } from "@/components/layout/CartNavbarButton";

export const Navbar = async () => {
  let userEmail: string | null = null;
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;
      userEmail = user.email || null;
    }
  } catch {
    // Se ocorrer erro temporário ao ler cookie de sessão, permanece como anônimo
  }

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "rgba(10, 12, 15, 0.85)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4rem",
        }}
      >
        {/* Logotipo KAVUNO */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
          }}
        >
          <img
            src="/logo.png"
            alt="KAVUNO Logo"
            style={{
              width: "32px",
              height: "32px",
              objectFit: "contain",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "0.05em",
              color: "var(--text-primary)",
            }}
          >
            KAVUNO
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--color-primary)",
              border: "1px solid var(--border-medium)",
              padding: "0.1rem 0.35rem",
              borderRadius: "2px",
            }}
          >
            3D LAB
          </span>
        </Link>

        {/* Navegação Principal */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              transition: "color var(--transition-fast)",
            }}
          >
            Início
          </Link>
          <Link
            href="/catalogo"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              transition: "color var(--transition-fast)",
            }}
          >
            Catálogo
          </Link>
          <Link
            href="/validacao"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              color: "var(--mode-interest)",
              transition: "color var(--transition-fast)",
            }}
          >
            Validação de Demanda
          </Link>
        </nav>

        {/* Bloco de Ações e Autenticação */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <CartNavbarButton />
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link
                href="/perfil"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-medium)",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                }}
              >
                <span className="badge-dot" style={{ backgroundColor: "var(--mode-in-stock)" }} />
                <span>{userEmail?.split("@")[0]} // PERFIL</span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    cursor: "pointer",
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
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  padding: "0.375rem 0.75rem",
                }}
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="btn btn-primary"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.45rem 0.875rem",
                }}
              >
                Criar Conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
