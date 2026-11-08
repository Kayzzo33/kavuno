"use client";

import React, { useActionState } from "react";
import { submitInterestLeadAction } from "@/app/catalogo/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export interface InterestLeadFormProps {
  productId: string;
  variantId: string | null;
  campaignId: string | null;
  productName: string;
}

export const InterestLeadForm: React.FC<InterestLeadFormProps> = ({
  productId,
  variantId,
  campaignId,
  productName,
}) => {
  const [state, formAction, isPending] = useActionState(submitInterestLeadAction, null);

  return (
    <Card style={{ marginTop: "var(--spacing-xl)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-medium)" }}>
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <div
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "var(--mode-interest)",
            marginBottom: "0.25rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Reserva Sob Encomenda &bull; Sem Cobrança Imediata
        </div>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "var(--text-primary)",
          }}
        >
          Reserve este modelo para o próximo lote
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginTop: "0.25rem",
            lineHeight: 1.5,
          }}
        >
          Este modelo é fabricado sob demanda. Registre seu interesse para garantir prioridade e ser avisado assim que a produção do lote iniciar.
        </p>
      </div>

      {state?.error && (
        <Alert type="error" title="NÃO FOI POSSÍVEL REGISTRAR">
          {state.error}
        </Alert>
      )}

      {state?.success && state.message && (
        <Alert type="success" title="INTERESSE REGISTRADO COM SUCESSO!">
          {state.message}
        </Alert>
      )}

      {!state?.success && (
        <form action={formAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variantId || ""} />
          <input type="hidden" name="campaignId" value={campaignId || ""} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <Input
              label="Seu Nome Completo"
              type="text"
              name="fullName"
              required
              placeholder="Ex: Carlos Silva"
            />

            <Input
              label="E-mail para Notificação"
              type="email"
              name="email"
              required
              placeholder="seu.email@exemplo.com"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <Input
              label="WhatsApp (Opcional)"
              type="tel"
              name="whatsappPhone"
              placeholder="(11) 98765-4321"
              helperText="Para avisos instantâneos via mensagem direta."
            />

            <Input
              label="Observação ou Personalização Desejada"
              type="text"
              name="notes"
              placeholder="Ex: Gostaria na cor azul petróleo se houver"
            />
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isPending}
              style={{ width: "100%", borderRadius: "var(--radius-md)" }}
            >
              Confirmar Reserva Gratuita
            </Button>
          </div>

          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: "0.75rem",
            }}
          >
            🔒 Seus dados serão utilizados exclusivamente para notificação sobre o produto &quot;{productName}&quot; (LGPD).
          </div>
        </form>
      )}
    </Card>
  );
};
