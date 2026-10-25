"use client";

import React, { useState, useEffect } from "react";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se já existe decisão gravada
    const hasConsent = document.cookie.includes("kavuno_cookie_consent=");
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (consent: "accepted" | "declined") => {
    document.cookie = `kavuno_cookie_consent=${consent}; path=/; max-age=31536000; SameSite=Lax`;
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Consentimento de Cookies e Privacidade LGPD"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        right: "1rem",
        maxWidth: "800px",
        margin: "0 auto",
        zIndex: 9999,
        backgroundColor: "rgba(10, 12, 15, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-md)",
        padding: "1rem 1.25rem",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <div style={{ flex: "1 1 400px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-primary)",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}
        >
          // PRIVACIDADE & LGPD · KAVUNO 3D
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Utilizamos telemetria anônima (Zero-PII) estritamente para aprimorar as recomendações e o estoque do nosso catálogo de impressão 3D. Nenhum dado pessoal é comercializado.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => handleConsent("declined")}
          style={{
            padding: "0.45rem 0.85rem",
            backgroundColor: "transparent",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          APENAS ESSENCIAIS
        </button>
        <button
          type="button"
          onClick={() => handleConsent("accepted")}
          style={{
            padding: "0.45rem 0.85rem",
            backgroundColor: "var(--color-primary)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#000",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ACEITAR ANALYTICS
        </button>
      </div>
    </div>
  );
}
