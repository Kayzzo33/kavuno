import React from "react";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect } from "next/navigation";
import VincularForm from "./VincularForm";

export default async function VincularBobinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const { id } = await params;

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          // FÁBRICA → PRODUÇÃO → {id.slice(0, 8)} → VINCULAR BOBINA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
          VINCULAR BOBINA À ORDEM
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          O consumo é registrado atomicamente e o saldo da bobina é atualizado com auditoria.
        </p>
      </div>
      <VincularForm orderId={id} />
    </div>
  );
}
