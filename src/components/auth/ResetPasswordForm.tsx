"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export const ResetPasswordForm: React.FC = () => {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null);

  return (
    <Card variant="bracket" style={{ maxWidth: "440px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
          // SEGURANÇA // NOVA SENHA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700 }}>
          REDEFINIR SENHA
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Digite e confirme sua nova chave de acesso.
        </p>
      </div>

      {state?.error && (
        <Alert type="error" title="ERRO AO REDEFINIR">
          {state.error}
        </Alert>
      )}

      {state?.success && state.message && (
        <div>
          <Alert type="success" title="SENHA ALTERADA">
            {state.message}
          </Alert>
          <div style={{ marginTop: "var(--spacing-md)" }}>
            <Link href="/login">
              <Button variant="primary" style={{ width: "100%" }}>
                ACESSAR CONTA AGORA
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!state?.success && (
        <form action={formAction}>
          <Input
            label="Nova Senha"
            type="password"
            name="password"
            required
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            name="confirmPassword"
            required
            placeholder="Repita a nova senha"
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            style={{ width: "100%", marginBottom: "var(--spacing-lg)" }}
          >
            SALVAR NOVA SENHA
          </Button>
        </form>
      )}
    </Card>
  );
};
