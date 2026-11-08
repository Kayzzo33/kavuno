import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdminSession } from "@/lib/admin/queries";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  // Não aplica layout de dashboard na rota de login administrativo
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const { isAdmin } = await requireAdminSession();

  if (!isAdmin) {
    redirect("/admin-login?error=not_admin");
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
