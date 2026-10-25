import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const metadata: Metadata = {
  title: "Login | 3D Commerce",
  description: "Acesse sua conta para visualizar pedidos, acompanhar pré-vendas e gerenciar seu perfil.",
};

export default function LoginPage() {
  return (
    <div style={{ paddingTop: "var(--spacing-2xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "var(--spacing-2xl)" }}>
              <LoadingSpinner size="lg" text="CARREGANDO AMBIENTE DE LOGIN..." />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
