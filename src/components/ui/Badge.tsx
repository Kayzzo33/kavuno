import React from "react";
import type { CommercialMode } from "@/types/database.types";

export interface BadgeProps {
  mode: CommercialMode | "custom";
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ mode, label, className = "" }) => {
  let badgeClass = "badge-in-stock";
  let defaultLabel = "Pronta Entrega";

  if (mode === "pre_order") {
    badgeClass = "badge-pre-order";
    defaultLabel = "Pré-Venda";
  } else if (mode === "interest_lead") {
    badgeClass = "badge-interest";
    defaultLabel = "Validação de Demanda";
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      <span className="badge-dot" />
      <span>{label || defaultLabel}</span>
    </span>
  );
};
