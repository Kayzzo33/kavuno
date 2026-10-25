"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction, type AuthActionResult } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo") || "/perfil";

  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <Card variant="bracket" style={{ maxWidth: "440px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
          // IDENTIDADE // SUPABASE AUTH
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700 }}>
          ACESSO À PLATAFORMA
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          Entre com seu e-mail e senha para gerenciar pedidos e perfil.
        </p>
      </div>

      {queryError && (
        <Alert type="error" title="ERRO DE ACESSO">
          {queryError}
        </Alert>
      )}

      {state?.error && (
        <Alert type="error" title="FALHA NO LOGIN">
          {state.error}
        </Alert>
      )}

      <form action={formAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />

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
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--spacing-md)" }}>
          <Link
            href="/recuperar-senha"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textDecoration: "underline",
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
          style={{ width: "100%", marginBottom: "var(--spacing-lg)" }}
        >
          ENTRAR // AUTENTICAR
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
        Não possui uma conta?{" "}
        <Link
          href="/cadastro"
          style={{
            color: "var(--color-primary)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
          }}
        >
          Cadastre-se aqui
        </Link>
      </div>
    </Card>
  );
};
