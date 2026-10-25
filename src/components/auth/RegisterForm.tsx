"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export const RegisterForm: React.FC = () => {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  return (
    <Card variant="bracket" style={{ maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
          // NOVO REGISTRO // PERFIL CLIENTE
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700 }}>
          CRIAR CONTA
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Cadastre-se para reservar produtos sem custo ou participar de pré-vendas.
        </p>
      </div>

      {state?.error && (
        <Alert type="error" title="FALHA NO CADASTRO">
          {state.error}
        </Alert>
      )}

      {state?.success && state.message && (
        <Alert type="success" title="CADASTRO INICIADO">
          {state.message}
        </Alert>
      )}

      <form action={formAction}>
        <Input
          label="Nome Completo"
          type="text"
          name="fullName"
          required
          placeholder="Seu Nome e Sobrenome"
          autoComplete="name"
        />

        <Input
          label="E-mail"
          type="email"
          name="email"
          required
          placeholder="seu.email@exemplo.com"
          autoComplete="email"
        />

        <Input
          label="Senha"
          type="password"
          name="password"
          required
          placeholder="Mínimo de 6 caracteres"
          autoComplete="new-password"
          helperText="Use letras, números e símbolos para maior segurança."
        />

        <Input
          label="Confirmar Senha"
          type="password"
          name="confirmPassword"
          required
          placeholder="Repita a mesma senha"
          autoComplete="new-password"
        />

        <div style={{ marginBottom: "var(--spacing-lg)", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <input
            type="checkbox"
            id="marketingConsent"
            name="marketingConsent"
            style={{ marginTop: "0.25rem", cursor: "pointer", accentColor: "var(--color-primary)" }}
          />
          <label htmlFor="marketingConsent" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1.4 }}>
            Aceito receber comunicações sobre novas campanhas de impressão 3D, lotes de produção e cupons exclusivos (LGPD-compliant).
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
          style={{ width: "100%", marginBottom: "var(--spacing-lg)" }}
        >
          REGISTRAR // CONTA NOVA
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
        Já possui uma conta?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--color-primary)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
          }}
        >
          Acesse pelo login
        </Link>
      </div>
    </Card>
  );
};
