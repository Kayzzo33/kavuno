import React from "react";
import { createClient } from "@/lib/supabase/server";

export async function AdminHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let adminName = "Admin";
  if (user?.id) {
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) adminName = profile.full_name;
    else if (profile?.email) adminName = profile.email;
  }

  return (
    <header
      style={{
        height: "52px",
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 var(--spacing-xl)",
        gap: "1rem",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
        }}
      >
        <span className="badge-dot" style={{ backgroundColor: "var(--mode-in-stock)" }} />
        <span>
          SESSÃO:{" "}
          <strong style={{ color: "var(--text-primary)" }}>{adminName}</strong>
        </span>
        <span style={{ color: "var(--text-muted)" }}>// ROLE: ADMIN</span>
      </div>
    </header>
  );
}
