import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Meu Perfil | 3D Commerce",
  description: "Gerencie seus dados de acesso, pedidos e preferências na plataforma 3D Commerce.",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // Validação estrita da sessão no servidor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/perfil");
  }

  // Consulta ao perfil correspondente na tabela public.profiles
  const { data: rawProfile } = await (supabase.from("profiles") as any)
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as import("@/types/database.types").Database["public"]["Tables"]["profiles"]["Row"] | null;

  const isAdmin = profile?.role === "admin";

  return (
    <div style={{ paddingTop: "var(--spacing-2xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        {/* Cabeçalho do Perfil */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "var(--spacing-xl)",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
              // ÁREA DO CLIENTE // SESSÃO ATIVA
            </div>
            <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700 }}>
              MEU PERFIL
            </h1>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Conta vinculada: <strong style={{ color: "var(--text-primary)" }}>{user.email}</strong>
            </div>
          </div>

          <form action={signOutAction}>
            <Button type="submit" variant="bracket" size="sm">
              ENCERRAR SESSÃO [LOGOUT]
            </Button>
          </form>
        </div>

        {/* Notificação Especial para Administrador */}
        {isAdmin && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "rgba(255, 92, 0, 0.1)",
              border: "1px solid var(--color-primary)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "var(--spacing-lg)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div>
              <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>[PAPEL ADMINISTRATIVO]:</span> Você possui privilégios de gestor no sistema (`role = 'admin'`).
            </div>
          </div>
        )}

        {/* Cartão de Resumo Cadastral */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "var(--spacing-xl)" }}>
          <Card variant="bracket">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              // NÍVEL DE ACESSO
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700, color: isAdmin ? "var(--color-primary)" : "var(--mode-in-stock)", marginTop: "0.25rem" }}>
              {profile?.role?.toUpperCase() || "CUSTOMER"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Validado por RLS no PostgreSQL
            </div>
          </Card>

          <Card variant="bracket">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              // MEMBRO DESDE
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR") : "—"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Data de registro do perfil
            </div>
          </Card>

          <Card variant="bracket">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              // SEGURANÇA
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.125rem", fontWeight: 700, color: "var(--mode-in-stock)", marginTop: "0.25rem" }}>
              SESSÃO SSR
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Cookies HTTP-Only ativos
            </div>
          </Card>
        </div>

        {/* Formulário de Edição de Dados Pessoais */}
        <Card variant="bracket">
          <div style={{ marginBottom: "var(--spacing-lg)" }}>
            <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700 }}>
              Dados Cadastrais
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Mantenha seus dados de contato atualizados para comunicações sobre produção e entregas.
            </p>
          </div>

          <ProfileForm profile={profile} />
        </Card>
      </div>
    </div>
  );
}
