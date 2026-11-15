"use client";

import React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#0f172a",
              borderRadius: "10px",
              padding: "6px 14px",
              marginBottom: "2rem",
              display: "inline-block",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "1.25rem",
                letterSpacing: "0.08em",
              }}
            >
              KAVUNO
            </span>
          </div>

          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: "0.75rem",
            }}
          >
            Erro crítico da aplicação
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.9375rem",
              marginBottom: "2rem",
              maxWidth: "480px",
              lineHeight: 1.6,
            }}
          >
            Algo inesperado aconteceu. Nossa equipe foi notificada. Tente recarregar a página.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                border: "none",
                padding: "0.75rem 1.75rem",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
            <Link
              href="/"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                padding: "0.75rem 1.75rem",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Página Inicial
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
