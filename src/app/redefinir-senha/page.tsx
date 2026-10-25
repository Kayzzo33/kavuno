import React from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Redefinir Senha | 3D Commerce",
  description: "Defina sua nova senha de acesso na plataforma 3D Commerce.",
};

export default function ResetPasswordPage() {
  return (
    <div style={{ paddingTop: "var(--spacing-2xl)", paddingBottom: "var(--spacing-2xl)" }}>
      <div className="container">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
