"use client";

import React, { useActionState } from "react";
import { updateProfileAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface ProfileFormProps {
  profile: ProfileRow | null;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ profile }) => {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction}>
      {state?.error && (
        <Alert type="error" title="FALHA NA ATUALIZAÇÃO">
          {state.error}
        </Alert>
      )}

      {state?.success && state.message && (
        <Alert type="success" title="DADOS SALVOS">
          {state.message}
        </Alert>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <Input
          label="Nome Completo"
          type="text"
          name="fullName"
          defaultValue={profile?.full_name || ""}
          placeholder="Seu Nome Completo"
        />

        <Input
          label="Telefone / WhatsApp"
          type="text"
          name="phone"
          defaultValue={profile?.phone || ""}
          placeholder="(11) 98765-4321"
          helperText="Utilizado para avisos sobre o status da impressão e envio."
        />
      </div>

      <div style={{ marginBottom: "var(--spacing-lg)", marginTop: "0.5rem", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
        <input
          type="checkbox"
          id="profileMarketingConsent"
          name="marketingConsent"
          defaultChecked={profile?.marketing_consent || false}
          style={{ marginTop: "0.25rem", cursor: "pointer", accentColor: "var(--color-primary)" }}
        />
        <label htmlFor="profileMarketingConsent" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1.4 }}>
          Manter consentimento para receber avisos sobre lotes de pré-venda, novidades em filamentos e cupons de desconto.
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="primary" isLoading={isPending}>
          SALVAR ALTERAÇÕES
        </Button>
      </div>
    </form>
  );
};
