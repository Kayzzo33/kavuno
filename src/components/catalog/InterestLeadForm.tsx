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
    <Card variant="bracket" style={{ marginTop: "var(--spacing-xl)" }}>
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--mode-interest)",
            marginBottom: "0.25rem",
          }}
        >
          // VALIDAÇÃO DE MERCADO // 100% GRATUITO
        </div>
        <h3
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          GARANTA SUA RESERVA DE INTERESSE
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            marginTop: "0.25rem",
            lineHeight: 1.5,
          }}
        >
          Esta peça está em fase de validação de demanda. Ao manifestar seu interesse, você não paga nada agora e ganha prioridade e desconto exclusivo quando o lote for liberado para produção.
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
              style={{ width: "100%" }}
            >
              MANIFESTAR INTERESSE [SEM CUSTO]
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
