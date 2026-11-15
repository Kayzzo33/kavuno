import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pedidos & Reservas | Gestão KAVUNO 3D",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  aba?: "todos" | "vendas" | "reservas";
}

export default async function AdminPedidosPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminSession();
  const searchParams = await props.searchParams;
  const currentTab = searchParams.aba || "todos";

  const supabase = await createClient();

  // Consulta 1: Pedidos Comerciais (Pronta Entrega e Pré-Venda Paga)
  const { data: orders } = await (supabase.from("orders") as any)
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

  // Consulta 2: Reservas Gratuitas de Interesse / Validação de Demanda
  const { data: leads } = await (supabase.from("interest_leads") as any)
    .select(`
      id,
      full_name,
      email,
      whatsapp_phone,
      notes,
      created_at,
      product:products (
        name,
        slug
      ),
      variant:product_variants (
        variant_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const orderList = orders ?? [];
  const leadList = leads ?? [];

  // Monta lista unificada para visualização consolidada
  const unifiedItems: any[] = [];

  if (currentTab === "todos" || currentTab === "vendas") {
    orderList.forEach((ord: any) => {
      unifiedItems.push({
        id: ord.id,
        type: "order",
        code: `#${ord.order_number || ord.id.slice(0, 8)}`,
        date: ord.created_at,
        customerName: ord.profiles?.full_name || ord.shipping_recipient_name || ord.profiles?.email || "Cliente",
        customerContact: ord.profiles?.email || "—",
        modality: ord.commercial_mode === "in_stock" ? "Pronta Entrega" : "Pré-venda Paga",
        modalityColor: ord.commercial_mode === "in_stock" ? "#0e623b" : "#8c5800",
        modalityBg: ord.commercial_mode === "in_stock" ? "#eafbf1" : "#fff8e5",
        status: ord.status,
        details: `${ord.items_count || 1} un`,
        amount: Number(ord.total_amount),
        isLead: false,
      });
    });
  }

  if (currentTab === "todos" || currentTab === "reservas") {
    leadList.forEach((lead: any) => {
      unifiedItems.push({
        id: lead.id,
        type: "lead",
        code: `RES-${lead.id.slice(0, 6).toUpperCase()}`,
        date: lead.created_at,
        customerName: lead.full_name,
        customerContact: lead.whatsapp_phone || lead.email,
        modality: "Reserva Gratuita",
        modalityColor: "#1e40af",
        modalityBg: "#dbeafe",
        status: "Interesse Confirmado",
        details: lead.product?.name ? `${lead.product.name} ${lead.variant?.variant_name ? `(${lead.variant.variant_name})` : ""}` : "Produto Geral",
        amount: 0,
        isLead: true,
        whatsapp: lead.whatsapp_phone,
      });
    });
  }

  // Ordena por data decrescente
  unifiedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            Pedidos & Reservas
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6d7175", marginTop: "0.25rem" }}>
            Acompanhe pedidos de pronta entrega, pré-vendas e reservas de interesse da sua fábrica 3D.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/kavuno-gestao/leads" className="shopify-btn-secondary">
            Ver Todos os Leads
          </Link>
          <Link href="/kavuno-gestao/financeiro" className="shopify-btn-secondary">
            Ver Fluxo de Caixa & DRE
          </Link>
        </div>
      </div>

      {/* Tabela de Pedidos Estilo Shopify / Nuvemshop */}
      <div className="shopify-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Barra de Filtros rápidos por Abas */}
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
            <Link
              href="/kavuno-gestao/pedidos?aba=todos"
              style={{
                fontSize: "0.8125rem",
                fontWeight: currentTab === "todos" ? 700 : 500,
                color: currentTab === "todos" ? "#202223" : "#6d7175",
                padding: "0.4rem 0.85rem",
                backgroundColor: currentTab === "todos" ? "#ffffff" : "transparent",
                borderRadius: "6px",
                border: currentTab === "todos" ? "1px solid #c9cccf" : "1px solid transparent",
                textDecoration: "none",
                boxShadow: currentTab === "todos" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Todos ({orderList.length + leadList.length})
            </Link>

            <Link
              href="/kavuno-gestao/pedidos?aba=vendas"
              style={{
                fontSize: "0.8125rem",
                fontWeight: currentTab === "vendas" ? 700 : 500,
                color: currentTab === "vendas" ? "#202223" : "#6d7175",
                padding: "0.4rem 0.85rem",
                backgroundColor: currentTab === "vendas" ? "#ffffff" : "transparent",
                borderRadius: "6px",
                border: currentTab === "vendas" ? "1px solid #c9cccf" : "1px solid transparent",
                textDecoration: "none",
                boxShadow: currentTab === "vendas" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Vendas Pagas ({orderList.length})
            </Link>

            <Link
              href="/kavuno-gestao/pedidos?aba=reservas"
              style={{
                fontSize: "0.8125rem",
                fontWeight: currentTab === "reservas" ? 700 : 500,
                color: currentTab === "reservas" ? "#202223" : "#6d7175",
                padding: "0.4rem 0.85rem",
                backgroundColor: currentTab === "reservas" ? "#ffffff" : "transparent",
                borderRadius: "6px",
                border: currentTab === "reservas" ? "1px solid #c9cccf" : "1px solid transparent",
                textDecoration: "none",
                boxShadow: currentTab === "reservas" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              Reservas de Interesse ({leadList.length})
            </Link>
          </div>
        </div>

        {unifiedItems.length === 0 ? (
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
              Nenhum registro encontrado nesta categoria
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#6d7175", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
              Assim que seus clientes realizarem compras ou registrarem reservas de interesse na vitrine, eles serão listados aqui.
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
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Identificador</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Data</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Contato</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Modalidade</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600 }}>Item / Detalhes</th>
                  <th style={{ padding: "0.75rem 1.25rem", fontWeight: 600, textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {unifiedItems.map((item: any) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid #ebeeed",
                      transition: "background-color 0.1s ease",
                    }}
                  >
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "#202223" }}>
                      {item.code}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#6d7175" }}>
                      {new Date(item.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#202223" }}>
                      {item.customerName}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#6d7175" }}>
                      {item.whatsapp ? (
                        <a
                          href={`https://wa.me/55${item.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#059669", textDecoration: "none", fontWeight: 600 }}
                        >
                          💬 {item.whatsapp}
                        </a>
                      ) : (
                        item.customerContact
                      )}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.25rem 0.55rem",
                          borderRadius: "4px",
                          backgroundColor: item.modalityBg,
                          color: item.modalityColor,
                        }}
                      >
                        {item.modality}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: "#f4f6f8",
                          color: "#202223",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "#475569", maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.details}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right", fontWeight: 700, color: item.isLead ? "#64748b" : "#202223" }}>
                      {item.isLead ? "R$ 0,00" : `R$ ${item.amount.toFixed(2).replace(".", ",")}`}
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
