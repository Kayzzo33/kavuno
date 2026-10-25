import React from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Criar Conta | 3D Commerce",
  description: "Cadastre-se na plataforma 3D Commerce para validar demanda e comprar peças impressas em 3D.",
};

export default function RegisterPage() {
  return (
    <div style={{ paddingTop: "var(--spacing-2xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        <RegisterForm />
      </div>
    </div>
  );
}
