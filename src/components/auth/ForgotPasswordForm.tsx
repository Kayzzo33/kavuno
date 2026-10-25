"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export const ForgotPasswordForm: React.FC = () => {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

  return (
    <Card variant="bracket" style={{ maxWidth: "440px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
          // RECUPERAÇÃO DE ACESSO
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700 }}>
          ESQUECEU SUA SENHA?
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Informe seu e-mail cadastrado e enviaremos um link seguro para redefinição.
        </p>
      </div>

      {state?.error && (
        <Alert type="error" title="FALHA NO ENVIO">
          {state.error}
        </Alert>
      )}

      {state?.success && state.message && (
        <Alert type="success" title="INSTRUÇÕES ENVIADAS">
          {state.message}
        </Alert>
      )}

      <form action={formAction}>
        <Input
          label="E-mail"
          type="email"
          name="email"
          required
          placeholder="seu.email@exemplo.com"
          autoComplete="email"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
          style={{ width: "100%", marginBottom: "var(--spacing-lg)" }}
        >
          ENVIAR LINK // REDEFINIÇÃO
        </Button>
      </form>

      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "var(--spacing-md)",
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
        }}
      >
        Lembrou da senha?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--color-primary)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
          }}
        >
          Voltar ao login
        </Link>
      </div>
    </Card>
  );
};
