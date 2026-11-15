import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdminSession } from "@/lib/admin/queries";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import "@/styles/shopify-admin.css";

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
      className="shopify-admin-wrapper"
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--shopify-canvas, #f1f2f4)",
      }}
    >
      <AdminSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <AdminHeader />
        <main
          style={{
            flex: 1,
            padding: "2rem",
            overflowY: "auto",
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
