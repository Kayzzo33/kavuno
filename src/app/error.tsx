"use client";

import React from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "#f8fafc",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "#0f172a",
          marginBottom: "0.75rem",
        }}
      >
        Algo deu errado
      </h2>
      <p style={{ color: "#64748b", fontSize: "0.9375rem", marginBottom: "1.5rem", maxWidth: "480px" }}>
        Ocorreu um erro ao carregar esta página. Tente novamente ou retorne à página inicial.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "10px",
            fontSize: "0.9375rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Tentar Novamente
        </button>
        <Link
          href="/"
          style={{
            backgroundColor: "#f1f5f9",
            color: "#0f172a",
            padding: "0.75rem 1.5rem",
            borderRadius: "10px",
            fontSize: "0.9375rem",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Ir para o Início
        </Link>
      </div>
    </div>
  );
}
