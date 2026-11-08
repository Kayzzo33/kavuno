"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const mensagem = searchParams.get("mensagem");
  const redirectTo = searchParams.get("redirectTo") || "/perfil";

  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <Card
      style={{
        maxWidth: "460px",
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
          Acesse sua conta
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
          Acompanhe seus pedidos, rastreio e impressões 3D sob medida.
        </p>
      </div>

      {queryError && (
        <Alert type="error" title="Atenção">
          {queryError}
        </Alert>
      )}

      {mensagem === "acesso_restrito" && (
        <Alert type="warning" title="Identificação Necessária">
          Por favor, faça login com sua conta para continuar.
        </Alert>
      )}

      {state?.error && (
        <Alert type="error" title="Não foi possível entrar">
          {state.error}
        </Alert>
      )}

      {/* Login Social com Google no estilo Mercado Livre / Shopee */}
      <GoogleAuthButton redirectTo={redirectTo} text="Entrar com o Google" />

      {/* Divisor */}
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
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <Input
          label="E-mail"
          type="email"
          name="email"
          required
          placeholder="exemplo@email.com"
          autoComplete="email"
        />

        <Input
          label="Senha"
          type="password"
          name="password"
          required
          placeholder="Sua senha secreta"
          autoComplete="current-password"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--spacing-md)" }}>
          <Link
            href="/recuperar-senha"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-primary)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Esqueceu a senha?
          </Link>
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
          Entrar na Conta
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
        Novo na KAVUNO?{" "}
        <Link
          href="/cadastro"
          style={{
            color: "var(--color-primary)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Criar minha conta
        </Link>
      </div>
    </Card>
  );
};
