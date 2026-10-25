"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export function CartNavbarButton() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/carrinho"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.375rem 0.625rem",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-primary)",
        textDecoration: "none",
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        transition: "border-color var(--transition-fast)",
      }}
    >
      <span>🛒</span>
      <span style={{ fontWeight: 700 }}>CARRINHO</span>
      {totalItems > 0 && (
        <span
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-black)",
            borderRadius: "var(--radius-full)",
            padding: "0.1rem 0.4rem",
            fontSize: "0.6875rem",
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {totalItems}
        </span>
      )}
    </Link>
  );
}
