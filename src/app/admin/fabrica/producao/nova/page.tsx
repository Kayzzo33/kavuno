import React from "react";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import OrdemForm from "./OrdemForm";

export const metadata = { title: "Nova Ordem de Produção | Admin" };

export default async function NovaOrdemPage() {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          // FÁBRICA → PRODUÇÃO → NOVA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
          CRIAR ORDEM DE PRODUÇÃO
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          Filamento e tempo estimados são herdados da variante e podem ser ajustados posteriormente.
        </p>
      </div>
      <OrdemForm products={products ?? []} />
    </div>
  );
}
