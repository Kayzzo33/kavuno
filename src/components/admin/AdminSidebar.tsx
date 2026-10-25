"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "DASHBOARD", icon: "◈", exact: true },
  { href: "/admin/analytics", label: "ANALYTICS", icon: "📈" },
  { href: "/admin/produtos", label: "PRODUTOS", icon: "⬡" },
  { href: "/admin/categorias", label: "CATEGORIAS", icon: "◫" },
  { href: "/admin/campanhas", label: "CAMPANHAS", icon: "⬟" },
  { href: "/admin/leads", label: "LEADS / RESERVAS", icon: "◎" },
  { href: "/admin/fabrica", label: "FÁBRICA", icon: "◉" },
  { href: "/admin/financeiro", label: "FINANCEIRO", icon: "⚑" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo / Identidade */}
      <div
        style={{
          padding: "1.25rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--text-muted)",
            marginBottom: "0.15rem",
          }}
        >
          // PAINEL ADMINISTRATIVO
        </div>
        <Link
          href="/admin"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <img
            src="/logo.png"
            alt="KAVUNO Logo"
            style={{ width: "24px", height: "24px", objectFit: "contain" }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: "1.125rem",
              color: "var(--color-primary)",
              letterSpacing: "0.05em",
            }}
          >
            KAVUNO
          </div>
        </Link>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, padding: "0.75rem 0" }}>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.625rem 1rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "var(--color-primary)" : "var(--text-secondary)",
                backgroundColor: isActive ? "var(--color-primary-subtle)" : "transparent",
                borderLeft: isActive
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
                textDecoration: "none",
                transition: "all var(--transition-fast)",
                letterSpacing: "0.04em",
              }}
            >
              <span style={{ fontSize: "0.75rem", opacity: isActive ? 1 : 0.6 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé da Sidebar */}
      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid var(--border-subtle)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--text-muted)",
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--text-secondary)",
            textDecoration: "none",
            display: "block",
            marginBottom: "0.25rem",
          }}
        >
          ← VOLTAR À LOJA
        </Link>
        <div>v0.6.0 · B.6</div>
      </div>
    </aside>
  );
}
