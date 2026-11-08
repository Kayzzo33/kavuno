"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminSignInAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export const AdminLoginForm: React.FC = () => {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [state, formAction, isPending] = useActionState(adminSignInAction, null);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-xl)",
        backgroundColor: "var(--bg-canvas)",
        background: "radial-gradient(ellipse at 50% 20%, rgba(255, 92, 0, 0.08), transparent 70%), var(--bg-canvas)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>
          <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
            <img
              src="/logo.png"
              alt="KAVUNO Logo"
              style={{ height: "42px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            PAINEL DE GESTÃO KAVUNO
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            Área restrita à administração, estoque e ordens de impressão 3D.
          </p>
        </div>

        <Card
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-xl)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {errorParam === "not_admin" && (
            <Alert type="error" title="ACESSO NÃO AUTORIZADO">
              Sua conta atual não possui privilégios de administrador. Autentique-se com credenciais autorizadas.
            </Alert>
          )}

          {errorParam === "session_required" && (
            <Alert type="warning" title="AUTENTICAÇÃO EXIGIDA">
              Por favor, realize login com uma conta administrativa para acessar este módulo.
            </Alert>
          )}

          {state?.error && (
            <Alert type="error" title="FALHA NA AUTENTICAÇÃO">
              {state.error}
            </Alert>
          )}

          <form action={formAction}>
            <Input
              label="E-mail Administrativo"
              type="email"
              name="email"
              required
              placeholder="admin@kavuno.com.br"
              autoComplete="username"
            />

            <Input
              label="Senha de Acesso"
              type="password"
              name="password"
              required
              placeholder="••••••••••••"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isPending}
              style={{
                width: "100%",
                marginTop: "var(--spacing-md)",
                height: "2.75rem",
                fontWeight: 700,
              }}
            >
              ACESSAR PAINEL ADMINISTRATIVO
            </Button>
          </form>

          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              marginTop: "var(--spacing-xl)",
              paddingTop: "var(--spacing-md)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            <Link
              href="/"
              style={{
                color: "var(--text-secondary)",
                transition: "color var(--transition-fast)",
              }}
            >
              ← Voltar à Loja
            </Link>
            <Link
              href="/login"
              style={{
                color: "var(--color-primary)",
                fontWeight: 600,
              }}
            >
              Portal de Clientes &rarr;
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
