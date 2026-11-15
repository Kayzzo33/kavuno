import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";

export async function AdminHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let adminName = "Admin";
  let adminEmail = user?.email || "";
  if (user?.id) {
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) adminName = profile.full_name;
    else if (profile?.email) adminName = profile.email;
    if (profile?.email) adminEmail = profile.email;
  }

  return (
    <header
      style={{
        height: "56px",
        backgroundColor: "#1a1a1a",
        borderBottom: "1px solid #262626",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        gap: "1.5rem",
        flexShrink: 0,
      }}
    >
      {/* Barra de Pesquisa Global (Estilo Shopify: Ctrl K) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#303030",
          borderRadius: "8px",
          padding: "0.4rem 0.875rem",
          width: "100%",
          maxWidth: "460px",
          border: "1px solid #404040",
          gap: "0.625rem",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="#a3a3a3">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder="Pesquisar pedidos, produtos ou clientes..."
          style={{
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "#ffffff",
            fontSize: "0.8125rem",
            width: "100%",
          }}
        />
        <span
          style={{
            fontSize: "0.6875rem",
            color: "#8c8c8c",
            backgroundColor: "#262626",
            padding: "0.15rem 0.4rem",
            borderRadius: "4px",
            border: "1px solid #404040",
            whiteSpace: "nowrap",
          }}
        >
          Ctrl K
        </span>
      </div>

      {/* Ações do Admin */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Notificações / Sino */}
        <button
          type="button"
          aria-label="Notificações"
          style={{
            background: "transparent",
            border: "none",
            color: "#c4c4c4",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "0.4rem",
            borderRadius: "6px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Perfil & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#008060",
              color: "#ffffff",
              fontSize: "0.8125rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {adminName.charAt(0).toUpperCase()}
          </div>

          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#ffffff" }}>
              {adminName}
            </span>
            <span style={{ fontSize: "0.6875rem", color: "#8c8c8c" }}>{adminEmail}</span>
          </div>

          <form action={signOutAction} style={{ marginLeft: "0.5rem" }}>
            <button
              type="submit"
              title="Encerrar Sessão Admin"
              style={{
                backgroundColor: "#262626",
                border: "1px solid #404040",
                color: "#e3e3e3",
                fontSize: "0.75rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
