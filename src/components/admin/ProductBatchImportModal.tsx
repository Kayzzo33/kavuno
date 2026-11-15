"use client";

import React, { useState, useActionState } from "react";
import { importProductsBatchAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ProductBatchImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(importProductsBatchAction, null);

  const sampleExample = `# Exemplo: Um produto por linha (Nome | Preço | Descrição curta)
Suporte Fone Dragão Medieval | 95.00 | Colecionável em PETG com alta tenacidade
Action Figure Guerreiro Cyberpunk | 149.90 | Impresso em 0.12mm com acabamento premium
Suporte Articulado para Webcam | 59.00 | Peça mecânica funcional para mesa
Vaso Geométrico Minimalista | 45.00 | Decoração moderna em filamento fosco`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: "0.65rem 1.15rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        📥 Importar Lista de Produtos
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Entrada em Lote
                </span>
                <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
                  Importar Lista de Produtos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: "1.25rem",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                marginBottom: "1.25rem",
                fontSize: "0.8125rem",
                color: "#1e40af",
                lineHeight: 1.5,
              }}
            >
              🔒 <strong>Regra de Segurança:</strong> Todos os produtos importados são salvos como <strong>RASCUNHO (Inativos)</strong>. Nenhum produto vai direto para o cliente sem que você o revise e ative na aba <em>&quot;Importados Recentemente&quot;</em>.
            </div>

            {state?.error && <Alert type="error">{state.error}</Alert>}
            {state?.success && <Alert type="success">{state.message}</Alert>}

            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                    Cole sua lista (um produto por linha ou formato JSON)
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      const textarea = e.currentTarget.closest("form")?.querySelector("textarea");
                      if (textarea) textarea.value = sampleExample;
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "0.75rem",
                      color: "#4f46e5",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Usar Exemplo Pronto
                  </button>
                </div>

                <textarea
                  name="batch_data"
                  rows={8}
                  required
                  placeholder={`Formato Linha por Linha:\nNome do Produto | Preço | Descrição Curta\n\nOu cole array JSON:\n[{"name": "...", "base_price": 99.0}]`}
                  className="form-textarea"
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.8125rem",
                    width: "100%",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isPending}
                >
                  Importar Produtos (Como Rascunho)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
