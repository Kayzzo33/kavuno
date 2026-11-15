import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pedidos | Gestão KAVUNO 3D",
};

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  await requireAdminSession();
  const supabase = await createClient();

  // Consulta defensiva de pedidos com relacionamento de cliente e pagamentos
  const { data: orders, error } = await (supabase.from("orders") as any)
    .select(`
      id,
      order_number,
      status,
      commercial_mode,
      total_amount,
      items_count,
      shipping_cost,
      shipping_recipient_name,
      shipping_city,
      shipping_state,
      created_at,
      profiles:user_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const orderList = orders ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header estilo Nuvemshop / Shopify */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              color: "#202223",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Pedidos
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6d7175", marginTop: "0.25rem" }}>
            Acompanhe pedidos de pronta entrega, pré-vendas e faturamento da sua impressora 3D.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/admin/financeiro" className="shopify-btn-secondary">
            Ver Fluxo de Caixa & DRE
          </Link>
        </div>
      </div>

      {/* Tabela de Pedidos Estilo Shopify / Nuvemshop */}
      <div className="shopify-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Barra de Filtros rápidos */}
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderBottom: "1px solid #e1e3e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            backgroundColor: "#fafbfb",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#202223",
                padding: "0.35rem 0.75rem",
                backgroundColor: "#ffffff",
                borderRadius: "6px",
                border: "1px solid #c9cccf",
              }}
            >
              Todos ({orderList.length})
            </span>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "#6d7175",
                padding: "0.35rem 0.75rem",
                cursor: "pointer",
              }}
            >
              Pronta Entrega
            </span>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "#6d7175",
                padding: "0.35rem 0.75rem",
                cursor: "pointer",
              }}
            >
              Pré-vendas
            </span>
          </div>
        </div>

        {orderList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#f4f6f8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                color: "#8c9196",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#202223", marginBottom: "0.35rem" }}>
              Nenhum pedido realizado ainda
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#6d7175", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
              Assim que seus clientes realizarem compras de pronta entrega ou reservarem lotes de pré-venda, os pedidos aparecerão aqui detalhados.
            </p>
            <Link href="/" target="_blank" className="shopify-btn-secondary">
              Visitar Loja Virtual
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e1e3e5", color: "#6d7175", backgroundColor: "#fafbfb" }}>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Pedido</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Data</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Modalidade</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Itens</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((ord: any) => (
                  <tr
                    key={ord.id}
                    style={{
                      borderBottom: "1px solid #ebeeed",
                      transition: "background-color 0.1s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f7f7f8")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "#202223" }}>
                      #{ord.order_number || ord.id.slice(0, 8)}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#6d7175" }}>
                      {new Date(ord.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#202223" }}>
                      {ord.profiles?.full_name || ord.shipping_recipient_name || ord.profiles?.email || "Cliente"}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: ord.commercial_mode === "in_stock" ? "#eafbf1" : "#fff8e5",
                          color: ord.commercial_mode === "in_stock" ? "#0e623b" : "#8c5800",
                        }}
                      >
                        {ord.commercial_mode === "in_stock" ? "Pronta Entrega" : "Pré-venda"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: "#f4f6f8",
                          color: "#202223",
                        }}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#6d7175" }}>
                      {ord.items_count || 1} un
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right", fontWeight: 700, color: "#202223" }}>
                      R$ {Number(ord.total_amount).toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

