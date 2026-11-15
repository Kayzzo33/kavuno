import React from "react";
import type { Metadata } from "next";
import { getSiteSettings, getAllSiteBanners } from "@/lib/catalog/queries";
import { BannerManagerClient } from "@/components/admin/BannerManagerClient";

export const metadata: Metadata = {
  title: "Banners & Vitrine | Gestão KAVUNO",
};

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const [settings, banners] = await Promise.all([
    getSiteSettings(),
    getAllSiteBanners(),
  ]);

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
          Gestão Visual da Loja
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
          Banners & Vitrine da Loja
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Controle o letreiro superior em loop, os banners do Hero principal e os banners promocionais acima do rodapé.
        </p>
      </div>

      <BannerManagerClient settings={settings} banners={banners} />
    </div>
  );
}


