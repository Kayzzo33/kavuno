import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCampaigns } from "@/lib/admin/queries";
import { AdminCampaignsTable } from "@/components/admin/AdminCampaignsTable";

export const metadata: Metadata = {
  title: "Campanhas | Admin 3D Commerce",
};

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const campaigns = await getAdminCampaigns();

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--spacing-xl)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-primary)",
              marginBottom: "0.25rem",
            }}
          >
            // OPERAÇÃO // PRÉ-VENDAS E VALIDAÇÃO
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
            CAMPANHAS
          </h1>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            {campaigns.length} campanha(s) registrada(s)
          </div>
        </div>
        <Link href="/admin/campanhas/nova" className="btn btn-primary">
          + NOVA CAMPANHA
        </Link>
      </div>

      <AdminCampaignsTable campaigns={campaigns} />
    </div>
  );
}
