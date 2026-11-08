"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function ConditionalLayout({
  navbar,
  footer,
  cookieBanner,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  cookieBanner: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/admin-login") || pathname?.startsWith("/painel-admin");

  if (isAdminRoute) {
    return <main style={{ flex: 1, minHeight: "100vh" }}>{children}</main>;
  }

  return (
    <>
      {navbar}
      <main style={{ flex: 1 }}>{children}</main>
      {footer}
      {cookieBanner}
    </>
  );
}
