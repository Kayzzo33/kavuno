"use client";

// ============================================================================
// src/components/analytics/CampaignBannerTracker.tsx
// Componente client para rastrear visualizações e cliques em banners de
// campanhas na página inicial. Responde estritamente ao consentimento LGPD.
// ============================================================================

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { trackClientEvent } from "@/lib/analytics/tracker";

interface CampaignItem {
  id: string;
  title: string;
  description: string | null;
  commercial_mode: "in_stock" | "pre_order" | "interest_lead";
  target_min_units: number | null;
  current_units_pledged: number | null;
}

interface CampaignBannerTrackerProps {
  campaigns: CampaignItem[];
}

/**
 * Renderiza banners de campanha no servidor de forma estática e registra
 * eventos `banner_view` na montagem e `banner_click` ao clicar.
 * Nenhum dado pessoal é transmitido.
 */
export const CampaignBannerTracker: React.FC<CampaignBannerTrackerProps> = ({
  campaigns,
}) => {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current || campaigns.length === 0) return;
    trackedRef.current = true;

    // Dispara um único evento banner_view por sessão para todos os banners visíveis
    campaigns.forEach((camp) => {
      trackClientEvent({
        eventName: "banner_view",
        entityType: "campaign",
        entityId: camp.id,
        metadata: {
          campaign_title: camp.title,
          commercial_mode: camp.commercial_mode,
          target_units: camp.target_min_units,
          pledged_units: camp.current_units_pledged,
        },
      });
    });
  }, [campaigns]);

  const handleBannerClick = (campaign: CampaignItem) => {
    trackClientEvent({
      eventName: "banner_click",
      entityType: "campaign",
      entityId: campaign.id,
      metadata: {
        campaign_title: campaign.title,
        commercial_mode: campaign.commercial_mode,
      },
    });
  };

  if (campaigns.length === 0) return null;

  return (
    <section id="validacao" style={{ marginBottom: "var(--spacing-2xl)" }}>
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--mode-interest)",
          }}
        >
          // CALIBRAÇÃO DE DEMANDA
        </span>
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.75rem",
            fontWeight: 700,
            marginTop: "0.25rem",
          }}
        >
          Campanhas Abertas para Reserva
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "var(--spacing-lg)",
        }}
      >
        {campaigns.map((camp) => (
          <Card
            key={camp.id}
            variant="bracket"
            headerBadge={<Badge mode={camp.commercial_mode} />}
          >
            <h3
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.125rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              {camp.title}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                marginBottom: "var(--spacing-md)",
              }}
            >
              {camp.description}
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              META DO LOTE: {camp.target_min_units} UNIDADES // RESERVAS:{" "}
              {camp.current_units_pledged}
            </div>
            <Link
              href="/validacao"
              className="btn btn-bracket"
              style={{ width: "100%", textAlign: "center" }}
              onClick={() => handleBannerClick(camp)}
            >
              DETALHES DA CAMPANHA
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
};
