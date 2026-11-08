"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const RegisterForm: React.FC = () => {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  return (
    <Card
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-xl)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>
        <h1
          style={{
            fontSize: "1.625rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Crie sua conta
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
          Tenha acesso exclusivo a lançamentos 3D, pronta entrega e promoções.
        </p>
      </div>

      {state?.error && (
        <Alert type="error" title="Não foi possível criar a conta">
          {state.error}
        </Alert>
      )}

      {state?.success && state.message && (
        <Alert type="success" title="Conta Criada!">
          {state.message}
        </Alert>
      )}

      <GoogleAuthButton text="Cadastrar com o Google" redirectTo="/perfil" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          margin: "1.25rem 0",
        }}
      >
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-subtle)" }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
          ou com e-mail
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-subtle)" }} />
      </div>

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
          helperText="Use letras e números para maior segurança."
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
            Quero receber novidades de novas peças impressas em 3D e cupons promocionais.
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
          style={{
            width: "100%",
            height: "2.85rem",
            fontSize: "1rem",
            fontWeight: 700,
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          Criar Minha Conta
        </Button>
      </form>

      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "var(--spacing-lg)",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
        }}
      >
        Já tem uma conta?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--color-primary)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Fazer login
        </Link>
      </div>
    </Card>
  );
};
