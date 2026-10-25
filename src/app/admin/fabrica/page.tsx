import React from "react";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/queries";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Fábrica | 3D Commerce Admin",
};

async function getProductionStats() {
  const supabase = createAdminClient();
  const [spoolsRes, ordersRes] = await Promise.all([
    supabase.from("filament_spools").select("id, status, current_weight_g, cost_per_gram", { count: "exact" }),
    supabase.from("production_orders").select("id, status, planned_quantity, produced_quantity, waste_filament_g", { count: "exact" }),
  ]);

  const spools = spoolsRes.data ?? [];
  const orders = ordersRes.data ?? [];

  const totalSpools = spoolsRes.count ?? 0;
  const activeSpools = spools.filter((s) => s.status === "in_use").length;
  const totalFilamentG = spools.reduce((acc, s) => acc + (s.current_weight_g ?? 0), 0);
  const totalOrders = ordersRes.count ?? 0;
  const ordersInProgress = orders.filter((o) =>
    ["slicing", "printing", "post_processing", "quality_check"].includes(o.status)
  ).length;
  const totalWasteG = orders.reduce((acc, o) => acc + (o.waste_filament_g ?? 0), 0);

  return { totalSpools, activeSpools, totalFilamentG, totalOrders, ordersInProgress, totalWasteG };
}

export default async function AdminFabricaPage() {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) redirect("/login?mensagem=acesso_restrito");

  const stats = await getProductionStats();

  const cards = [
    {
      icon: "◈",
      label: "Bobinas cadastradas",
      value: stats.totalSpools,
      sub: `${stats.activeSpools} em uso`,
      href: "/admin/fabrica/bobinas",
    },
    {
      icon: "⬡",
      label: "Filamento disponível",
      value: `${(stats.totalFilamentG / 1000).toFixed(2)} kg`,
      sub: `${stats.totalFilamentG.toFixed(0)} g total`,
      href: "/admin/fabrica/bobinas",
    },
    {
      icon: "⬟",
      label: "Ordens de produção",
      value: stats.totalOrders,
      sub: `${stats.ordersInProgress} em andamento`,
      href: "/admin/fabrica/producao",
    },
    {
      icon: "◎",
      label: "Desperdício total",
      value: `${stats.totalWasteG.toFixed(1)} g`,
      sub: "acumulado em todas as ordens",
      href: "/admin/fabrica/producao",
    },
  ];

  const quickActions = [
    { href: "/admin/fabrica/bobinas/nova", label: "Nova Bobina", icon: "+" },
    { href: "/admin/fabrica/producao/nova", label: "Nova Ordem", icon: "+" },
    { href: "/admin/fabrica/bobinas", label: "Ver Bobinas", icon: "→" },
    { href: "/admin/fabrica/producao", label: "Ver Produção", icon: "→" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
          // MÓDULO B.6
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          CHÃO DE FÁBRICA
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          Bobinas de filamento, ordens de produção e rastreabilidade de custos.
        </p>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        {cards.map((card) => (
          <Link key={card.href + card.label} href={card.href} style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-lg)",
              transition: "border-color var(--transition-fast)",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", marginBottom: "0.5rem", color: "var(--color-primary)" }}>
                {card.icon}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.5rem", color: "var(--text-primary)" }}>
                {card.value}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                {card.label}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {card.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Ações rápidas */}
      <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-lg)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--spacing-md)" }}>
          AÇÕES RÁPIDAS
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                backgroundColor: "var(--color-primary-subtle)",
                border: "1px solid var(--color-primary)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-primary)",
                textDecoration: "none",
                transition: "opacity var(--transition-fast)",
              }}
            >
              <span>{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
