import React from "react";
import type { Metadata } from "next";
import { getSiteSettings, getActiveSiteBanners } from "@/lib/catalog/queries";
import { BannerManagerClient } from "@/components/admin/BannerManagerClient";

export const metadata: Metadata = {
  title: "Banners & Vitrine | Admin KAVUNO",
};

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const [settings, banners] = await Promise.all([
    getSiteSettings(),
    getActiveSiteBanners(),
  ]);

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
          Gestão Visual da Loja
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
          Banners & Vitrine Principal
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Controle a barra de avisos do topo e escolha se o Hero exibe Produtos Hot (em alta) ou Banners gráficos reais.
        </p>
      </div>

      <BannerManagerClient settings={settings} banners={banners} />
    </div>
  );
}
