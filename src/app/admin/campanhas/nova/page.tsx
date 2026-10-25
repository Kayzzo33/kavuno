import React from "react";
import type { Metadata } from "next";
import { CampaignForm } from "@/components/admin/CampaignForm";

export const metadata: Metadata = {
  title: "Nova Campanha | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-primary)",
            marginBottom: "0.25rem",
          }}
        >
          // OPERAÇÃO // NOVA CAMPANHA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
          CRIAR CAMPANHA
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Defina lotes de pré-venda ou validação de demanda com metas de produção.
        </p>
      </div>

      <CampaignForm />
    </div>
  );
}
