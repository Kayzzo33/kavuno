import React from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar Senha | 3D Commerce",
  description: "Solicite a redefinição de senha da sua conta no 3D Commerce.",
};

export default function ForgotPasswordPage() {
  return (
    <div style={{ paddingTop: "var(--spacing-2xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
