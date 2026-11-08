import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export const metadata: Metadata = {
  title: "Acesso Administrativo | KAVUNO 3D",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSubLoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "var(--spacing-2xl)" }}>
          <LoadingSpinner size="lg" text="Iniciando ambiente administrativo seguro..." />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
