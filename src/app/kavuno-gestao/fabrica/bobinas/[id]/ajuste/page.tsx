import React from "react";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect, notFound } from "next/navigation";
import { getSpoolById } from "@/lib/production/queries";
import AjusteForm from "./AjusteForm";

export default async function AjusteSpoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const { id } = await params;
  let spool: Awaited<ReturnType<typeof getSpoolById>>;
  try {
    spool = await getSpoolById(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          // FÁBRICA → BOBINAS → {spool.label} → AJUSTE
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.25rem", color: "var(--text-primary)", margin: "0.25rem 0 0" }}>
          AJUSTE DE PESO — {spool.label}
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          Todo ajuste gera uma entrada auditável no histórico da bobina.
        </p>
      </div>
      <AjusteForm spoolId={id} currentWeightG={spool.current_weight_g} />
    </div>
  );
}
