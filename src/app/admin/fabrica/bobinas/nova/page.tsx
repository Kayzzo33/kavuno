import React from "react";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect } from "next/navigation";
import SpoolForm from "./SpoolForm";

export const metadata = { title: "Nova Bobina | Admin" };

export default async function NovaBobonaPage() {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          // FÁBRICA → BOBINAS → NOVA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
          CADASTRAR BOBINA
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          O peso líquido disponível é calculado automaticamente (peso bruto − tara).
        </p>
      </div>
      <SpoolForm />
    </div>
  );
}
