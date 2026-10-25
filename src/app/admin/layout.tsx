import React from "react";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/queries";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await requireAdminSession();

  if (!isAdmin) {
    redirect("/login?mensagem=acesso_restrito");
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <AdminHeader />
        <main
          style={{
            flex: 1,
            padding: "var(--spacing-xl)",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
