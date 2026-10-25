import React from "react";
import { requireAdminSession } from "@/lib/admin/queries";
import {
  getFinancialDashboardMetrics,
  listFinancialTransactions,
  listAccountsPayable,
  listAccountsReceivable,
  listFinancialAssets,
  listProductCostSnapshots,
  listExpenseCategories,
} from "@/lib/finance/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateFinancialSettingsAction,
  createFinancialAssetAction,
  createManualExpenseAction,
  createAccountPayableAction,
  settleAccountPayableAction,
  settleAccountReceivableAction,
  triggerReconcilePaymentsAction,
  calculateVariantCostAction,
} from "./actions";

interface SearchParams {
  aba?: string;
  mensagem?: string;
}

export default async function AdminFinanceiroPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdminSession();
  const searchParams = await props.searchParams;
  const currentTab = searchParams.aba || "fluxo";

  const [
    metrics,
    transactions,
    payables,
    receivables,
    assets,
    costSnapshots,
    categories,
  ] = await Promise.all([
    getFinancialDashboardMetrics(),
    listFinancialTransactions({ limit: 50 }),
    listAccountsPayable(),
    listAccountsReceivable(),
    listFinancialAssets(),
    listProductCostSnapshots(),
    listExpenseCategories(),
  ]);

  // Buscar variantes para apuração de custo
  const supabase = createAdminClient();
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, variant_name, sku, products(name)")
    .order("sku");

  const { cashflow, dre, settings } = metrics;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "var(--spacing-lg)",
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
            // MÓDULO B.7 · CONTABILIDADE AUDITÁVEL & CHÃO DE FÁBRICA
          </div>
          <h1
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            FINANCEIRO, CUSTOS & CONCILIAÇÃO
          </h1>
        </div>

        <form action={triggerReconcilePaymentsAction}>
          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--color-primary)",
              color: "#000",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
            }}
          >
            ⚡ CONCILIAR MERCADO PAGO
          </button>
        </form>
      </div>

      {/* Alertas de Regras Canônicas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--spacing-md)",
          padding: "var(--spacing-md)",
          backgroundColor: "rgba(0, 255, 136, 0.03)",
          border: "1px dashed var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--text-muted)",
        }}
      >
        <div>✓ <strong>Venda != Recebimento:</strong> Pagamentos aprovados aguardam liquidação.</div>
        <div>✓ <strong>Reserva Gratuita:</strong> Gera R$ 0,00 de receita (pura validação de demanda).</div>
        <div>✓ <strong>Equipamentos (CAPEX):</strong> Depreciação rateada por hora de máquina.</div>
      </div>

      {/* Cards de Métricas Principais (Executive KPIs) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--spacing-md)",
        }}
      >
        {/* Saldo em Caixa Real */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-lg)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            SALDO EM CAIXA (LIQUIDADO)
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.5rem",
              fontWeight: 800,
              color:
                cashflow.currentCashBalance >= 0
                  ? "var(--color-primary)"
                  : "var(--color-danger)",
            }}
          >
            R$ {cashflow.currentCashBalance.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Entradas: R$ {cashflow.totalClearedIncome.toFixed(2)} | Saídas: R${" "}
            {cashflow.totalClearedExpense.toFixed(2)}
          </div>
        </div>

        {/* Saldo Projetado (Com A Pagar e A Receber) */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-lg)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            SALDO PROJETADO (COMPETÊNCIA)
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            R$ {cashflow.projectedCashBalance.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            A Receber: +R$ {cashflow.totalPendingReceivables.toFixed(2)} | A Pagar: -R${" "}
            {cashflow.totalPendingPayables.toFixed(2)}
          </div>
        </div>

        {/* Faturamento Líquido DRE */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-lg)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            RECEITA LÍQUIDA GERENCIAL
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-primary)",
            }}
          >
            R$ {dre.netRevenue.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Bruto: R$ {dre.grossRevenue.toFixed(2)} (Taxas: -R$ {dre.gatewayFees.toFixed(2)})
          </div>
        </div>

        {/* Frete Subsidiado */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-lg)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            FRETE SUBSIDIADO PELA LOJA
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-warning)",
            }}
          >
            R$ {cashflow.totalSubsidizedShipping.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Absorvido em frete grátis / cupons
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "0.5rem",
          overflowX: "auto",
        }}
      >
        {[
          { id: "fluxo", label: "◈ FLUXO DE CAIXA & EXTRATO" },
          { id: "contas", label: "◫ CONTAS A PAGAR & RECEBER" },
          { id: "dre", label: "⬡ DRE GERENCIAL & TAXAS" },
          { id: "custos", label: "◎ CUSTOS & MARGENS (CPV)" },
          { id: "ativos", label: "◉ ATIVOS (CAPEX) & PARÂMETROS" },
        ].map((tab) => (
          <a
            key={tab.id}
            href={`/admin/financeiro?aba=${tab.id}`}
            style={{
              padding: "0.5rem 1rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              fontWeight: currentTab === tab.id ? 700 : 500,
              color:
                currentTab === tab.id
                  ? "var(--color-primary)"
                  : "var(--text-muted)",
              backgroundColor:
                currentTab === tab.id
                  ? "var(--color-primary-subtle)"
                  : "transparent",
              border: `1px solid ${
                currentTab === tab.id ? "var(--color-primary)" : "transparent"
              }`,
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* CONTEÚDO DA ABA 1: FLUXO DE CAIXA & EXTRATO */}
      {currentTab === "fluxo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
          {/* Lançamento Rápido de Despesa */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-lg)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              + REGISTRAR SAÍDA / DESPESA OPERACIONAL AVULSA
            </div>
            <form
              action={createManualExpenseAction}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "var(--spacing-md)",
                alignItems: "flex-end",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  CATEGORIA
                </label>
                <select
                  name="category_code"
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    backgroundColor: "var(--bg-canvas)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  VALOR (R$)
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    backgroundColor: "var(--bg-canvas)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.25rem",
                  }}
                >
                  DESCRIÇÃO
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="Ex: Álcool isopropílico 1L"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    backgroundColor: "var(--bg-canvas)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--color-primary)",
                  color: "#000",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  height: "35px",
                }}
              >
                REGISTRAR SAÍDA
              </button>
            </form>
          </div>

          {/* Tabela de Extrato Auditável */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "var(--spacing-md) var(--spacing-lg)",
                borderBottom: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              // EXTRATO AUDITÁVEL DE MOVIMENTAÇÕES (ÚLTIMAS TRANSAÇÕES)
            </div>

            {transactions.length === 0 ? (
              <div
                style={{
                  padding: "var(--spacing-xl)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.875rem",
                }}
              >
                Nenhuma movimentação registrada no livro razão. Clique em "CONCILIAR MERCADO PAGO" acima para processar pagamentos existentes.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-canvas)", textAlign: "left", color: "var(--text-muted)" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>DATA</th>
                      <th style={{ padding: "0.75rem 1rem" }}>TIPO</th>
                      <th style={{ padding: "0.75rem 1rem" }}>DESCRIÇÃO</th>
                      <th style={{ padding: "0.75rem 1rem" }}>CATEGORIA</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>BRUTO</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>TAXA</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>LÍQUIDO</th>
                      <th style={{ padding: "0.75rem 1rem" }}>STATUS</th>
                      <th style={{ padding: "0.75rem 1rem" }}>IDEMPOTÊNCIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                          {tx.accrual_date}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              padding: "0.2rem 0.4rem",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              backgroundColor:
                                tx.transaction_type === "income"
                                  ? "var(--color-primary-subtle)"
                                  : tx.transaction_type === "refund"
                                  ? "var(--color-danger-subtle)"
                                  : "rgba(255, 255, 255, 0.05)",
                              color:
                                tx.transaction_type === "income"
                                  ? "var(--color-primary)"
                                  : tx.transaction_type === "refund"
                                  ? "var(--color-danger)"
                                  : "var(--text-primary)",
                            }}
                          >
                            {tx.transaction_type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          {tx.description}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                          {tx.category?.name ?? tx.source_type}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--text-muted)" }}>
                          R$ {tx.gross_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--color-danger)" }}>
                          {tx.fee_amount > 0 ? `-R$ ${tx.fee_amount.toFixed(2)}` : "—"}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            textAlign: "right",
                            fontWeight: 700,
                            color:
                              tx.transaction_type === "income"
                                ? "var(--color-primary)"
                                : tx.transaction_type === "refund"
                                ? "var(--color-danger)"
                                : "var(--text-primary)",
                          }}
                        >
                          {tx.transaction_type === "income" ? "+" : "-"}R$ {tx.net_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              color:
                                tx.status === "cleared"
                                  ? "var(--color-primary)"
                                  : "var(--color-warning)",
                            }}
                          >
                            ● {tx.status === "cleared" ? "Liquidado" : "Pendente"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            color: "var(--text-muted)",
                            fontSize: "0.625rem",
                          }}
                        >
                          {tx.idempotency_key}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: CONTAS A PAGAR & RECEBER */}
      {currentTab === "contas" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-xl)" }}>
          {/* Contas a Pagar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "var(--spacing-lg)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "var(--spacing-md)",
                }}
              >
                + NOVA CONTA A PAGAR (FORNECEDOR / DESPESA)
              </div>
              <form action={createAccountPayableAction} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>CATEGORIA</label>
                  <select name="category_code" required style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>DESCRIÇÃO</label>
                  <input type="text" name="description" required placeholder="Ex: Fatura Fornecedor Filamentos 10kg" style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>VALOR (R$)</label>
                    <input type="number" name="original_amount" step="0.01" min="0.01" required placeholder="0.00" style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>VENCIMENTO</label>
                    <input type="date" name="due_date" required defaultValue={new Date().toISOString().split("T")[0]} style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                </div>
                <button type="submit" style={{ padding: "0.5rem", backgroundColor: "var(--color-primary)", color: "#000", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", marginTop: "0.5rem" }}>
                  SALVAR CONTA A PAGAR
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div style={{ padding: "var(--spacing-md)", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                OBRIGAÇÕES A PAGAR
              </div>
              {payables.length === 0 ? (
                <div style={{ padding: "var(--spacing-lg)", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  Nenhuma conta a pagar pendente.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {payables.map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.description}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.6875rem" }}>Vencimento: {p.due_date} | {p.category?.name ?? "Geral"}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ fontWeight: 700, color: p.status === "paid" ? "var(--text-muted)" : "var(--color-danger)" }}>
                          R$ {p.original_amount.toFixed(2)}
                        </div>
                        {p.status === "pending" && (
                          <form action={settleAccountPayableAction.bind(null, p.id)}>
                            <input type="hidden" name="paid_amount" value={p.original_amount} />
                            <button type="submit" style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--color-primary-subtle)", border: "1px solid var(--color-primary)", color: "var(--color-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", cursor: "pointer" }}>
                              Baixar
                            </button>
                          </form>
                        )}
                        {p.status === "paid" && (
                          <span style={{ color: "var(--color-primary)", fontSize: "0.6875rem" }}>✓ Pago</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contas a Receber */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
            <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div style={{ padding: "var(--spacing-md)", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                DIREITOS A RECEBER (PROVEDORES / GATEWAY)
              </div>
              {receivables.length === 0 ? (
                <div style={{ padding: "var(--spacing-xl)", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  Nenhum repasse futuro pendente de conciliação.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {receivables.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.description}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.6875rem" }}>Previsão: {r.expected_clearance_date} | Taxa retida: R$ {r.estimated_fee.toFixed(2)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                          R$ {r.net_expected_amount.toFixed(2)}
                        </div>
                        {r.status === "pending" && (
                          <form action={settleAccountReceivableAction.bind(null, r.id)}>
                            <input type="hidden" name="received_net_amount" value={r.net_expected_amount} />
                            <button type="submit" style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--color-primary-subtle)", border: "1px solid var(--color-primary)", color: "var(--color-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", cursor: "pointer" }}>
                              Liquidar
                            </button>
                          </form>
                        )}
                        {r.status === "received" && (
                          <span style={{ color: "var(--color-primary)", fontSize: "0.6875rem" }}>✓ Liquidado</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: DRE GERENCIAL & TAXAS */}
      {currentTab === "dre" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "var(--spacing-xl)" }}>
          {/* Tabela DRE */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-lg)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--color-primary)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              // DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE GERENCIAL)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "0.5rem" }}>
                <span>(+) RECEITA BRUTA DE VENDAS</span>
                <span style={{ fontWeight: 700 }}>R$ {dre.grossRevenue.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-danger)" }}>
                <span>(-) Taxas de Gateway (Mercado Pago)</span>
                <span>-R$ {dre.gatewayFees.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-danger)" }}>
                <span>(-) Frete Subsidiado Absorvido</span>
                <span>-R$ {dre.subsidizedShipping.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "0.5rem 0", fontWeight: 700, color: "var(--color-primary)" }}>
                <span>(=) RECEITA LÍQUIDA OPERACIONAL</span>
                <span>R$ {dre.netRevenue.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-danger)" }}>
                <span>(-) Custo dos Produtos Vendidos (CPV Filamentos + Insumos)</span>
                <span>-R$ {dre.costOfGoodsSold.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "0.5rem 0", fontWeight: 700 }}>
                <span>(=) LUCRO BRUTO (Margem: {dre.grossMarginPct.toFixed(1)}%)</span>
                <span>R$ {dre.grossProfit.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>(-) Despesas Operacionais Fixas / Manutenção</span>
                <span>-R$ {dre.operatingExpenses.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>(-) Mão de Obra Direta e Pró-labore</span>
                <span>-R$ {dre.laborExpenses.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid var(--color-primary)", padding: "0.75rem 0", fontWeight: 800, fontSize: "1rem", color: dre.operatingResult >= 0 ? "var(--color-primary)" : "var(--color-danger)" }}>
                <span>(=) RESULTADO OPERACIONAL (Margem: {dre.operatingMarginPct.toFixed(1)}%)</span>
                <span>R$ {dre.operatingResult.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Destaque das Regras e Parâmetros */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-lg)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              // CONCILIAÇÃO & CRITÉRIOS DE AUDITORIA
            </div>
            <div>
              <strong>Taxas de Pagamento Ativas:</strong>
              <br />• Pix: {(settings.default_gateway_pix_fee_pct * 100).toFixed(2)}%
              <br />• Cartão: {(settings.default_gateway_card_fee_pct * 100).toFixed(2)}%
            </div>
            <div>
              <strong>Segregação de CAPEX:</strong>
              <br />A aquisição de impressoras é imobilizada e amortizada por hora útil calculada, impedindo a distorção do CPV na primeira venda.
            </div>
            <div>
              <strong>Reserva Gratuita:</strong>
              <br />Leads capturados não impactam a receita faturada nem a contabilidade fiscal da empresa.
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 4: CUSTOS & MARGENS (CPV) */}
      {currentTab === "custos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
          {/* Apurar Novo Custo de Variante */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-lg)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              // APURAR CUSTO ESTIMADO DO CATÁLOGO (CPV UNITÁRIO)
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-md)", flexWrap: "wrap", alignItems: "center" }}>
              {variants?.map((v: any) => (
                <form key={v.id} action={calculateVariantCostAction.bind(null, v.id)}>
                  <button
                    type="submit"
                    style={{
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "var(--color-primary-subtle)",
                      border: "1px solid var(--color-primary)",
                      color: "var(--color-primary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                    }}
                  >
                    ⚡ Calcular: {v.products?.name} ({v.variant_name})
                  </button>
                </form>
              ))}
            </div>
          </div>

          {/* Tabela de Snapshots de Custo */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "var(--spacing-md) var(--spacing-lg)",
                borderBottom: "1px solid var(--border-subtle)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              // HISTÓRICO DE CUSTOS & MARGENS APURADAS POR VARIANTE
            </div>

            {costSnapshots.length === 0 ? (
              <div
                style={{
                  padding: "var(--spacing-xl)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.875rem",
                }}
              >
                Nenhum snapshot de custo gerado. Clique em uma das variantes acima para apurar o CPV em tempo real.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "var(--bg-canvas)", textAlign: "left", color: "var(--text-muted)" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>PRODUTO / VARIANTE</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>FILAMENTO</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>ENERGIA</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>MÁQUINA/H</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>EMBALAGEM</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>CPV TOTAL</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>PREÇO VENDA</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>MARGEM BRUTA</th>
                      <th style={{ padding: "0.75rem 1rem" }}>STATUS TELEMETRIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSnapshots.map((cs) => (
                      <tr key={cs.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                          {cs.product_name} - {cs.variant_name}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                          R$ {cs.filament_cost.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                          R$ {cs.electricity_cost.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                          R$ {cs.machine_depreciation_cost.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                          R$ {cs.packaging_cost.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700 }}>
                          R$ {cs.total_unit_cost.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                          R$ {cs.unit_sale_price.toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            textAlign: "right",
                            fontWeight: 700,
                            color: cs.gross_margin_amount >= 0 ? "var(--color-primary)" : "var(--color-danger)",
                          }}
                        >
                          R$ {cs.gross_margin_amount.toFixed(2)} ({cs.gross_margin_percent.toFixed(1)}%)
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {cs.is_telemetry_missing ? (
                            <span style={{ color: "var(--color-warning)", fontSize: "0.6875rem" }}>
                              ⚠ Parâmetros padrão ({cs.missing_parameters_notes})
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-primary)", fontSize: "0.6875rem" }}>
                              ✓ Telemetria completa
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 5: ATIVOS (CAPEX) & PARÂMETROS */}
      {currentTab === "ativos" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-xl)" }}>
          {/* Cadastro de Ativos / Impressoras */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "var(--spacing-lg)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "var(--spacing-md)",
                }}
              >
                + CADASTRAR EQUIPAMENTO / IMPRESSORA (CAPEX)
              </div>
              <form action={createFinancialAssetAction} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>TAG DO ATIVO</label>
                    <input type="text" name="asset_tag" required placeholder="Ex: EQ-BAMBU-P1S-01" style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>NOME</label>
                    <input type="text" name="name" required placeholder="Ex: Bambu Lab P1S" style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>VALOR COMPRA (R$)</label>
                    <input type="number" name="purchase_cost" step="0.01" min="0.01" required placeholder="Ex: 5800.00" style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>VIDA ÚTIL (HORAS)</label>
                    <input type="number" name="useful_life_hours" min="100" required defaultValue="5000" style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>POTÊNCIA (WATTS)</label>
                    <input type="number" name="nominal_power_watts" min="10" defaultValue="150" style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>DATA AQUISIÇÃO</label>
                    <input type="date" name="purchased_at" defaultValue={new Date().toISOString().split("T")[0]} style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }} />
                  </div>
                </div>

                <button type="submit" style={{ padding: "0.5rem", backgroundColor: "var(--color-primary)", color: "#000", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.75rem", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", marginTop: "0.5rem" }}>
                  SALVAR ATIVO IMOBILIZADO
                </button>
              </form>
            </div>

            {/* Lista de Ativos */}
            <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div style={{ padding: "var(--spacing-md)", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
                EQUIPAMENTOS EM OPERAÇÃO
              </div>
              {assets.length === 0 ? (
                <div style={{ padding: "var(--spacing-lg)", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  Nenhum equipamento cadastrado. Cadastre impressoras acima para calcular a taxa de depreciação horária.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {assets.map((a) => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.name} [{a.asset_tag}]</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.6875rem" }}>Vida útil: {a.useful_life_hours}h | Potência: {a.nominal_power_watts}W</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                          R$ {a.depreciation_rate_per_hour.toFixed(4)} / hora
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.6875rem" }}>
                          Custo total: R$ {a.total_acquisition_cost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configuração de Parâmetros Financeiros */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-lg)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              // PARÂMETROS OPERACIONAIS CONFIGURÁVEIS
            </div>

            <form action={updateFinancialSettingsAction} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                  TARIFA DE ENERGIA ELÉTRICA (R$ / kWh)
                </label>
                <input
                  type="number"
                  name="electricity_kwh_rate"
                  step="0.0001"
                  defaultValue={settings.electricity_kwh_rate ?? 0.85}
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                />
                <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Caso não preenchido, os cálculos sinalizarão ausência de telemetria sem inventar valores.
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                  MÃO DE OBRA DIRETA (R$ / HORA)
                </label>
                <input
                  type="number"
                  name="labor_hourly_rate"
                  step="0.01"
                  defaultValue={settings.labor_hourly_rate ?? 25.0}
                  style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    TAXA PADRÃO PIX (%)
                  </label>
                  <input
                    type="number"
                    name="default_gateway_pix_fee_pct"
                    step="0.01"
                    defaultValue={(settings.default_gateway_pix_fee_pct * 100).toFixed(2)}
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    TAXA PADRÃO CARTÃO (%)
                  </label>
                  <input
                    type="number"
                    name="default_gateway_card_fee_pct"
                    step="0.01"
                    defaultValue={(settings.default_gateway_card_fee_pct * 100).toFixed(2)}
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    EMBALAGEM MÉDIA (R$)
                  </label>
                  <input
                    type="number"
                    name="default_packaging_cost"
                    step="0.01"
                    defaultValue={settings.default_packaging_cost.toFixed(2)}
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    MARKUP ALVO (MULTIPLICADOR)
                  </label>
                  <input
                    type="number"
                    name="target_markup_multiplier"
                    step="0.1"
                    defaultValue={settings.target_markup_multiplier.toFixed(2)}
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  padding: "0.625rem",
                  backgroundColor: "var(--color-primary)",
                  color: "#000",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                SALVAR PARÂMETROS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
