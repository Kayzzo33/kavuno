"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adjustSpoolWeightAction } from "../../../actions";

export default function AjusteSpoolForm({ spoolId, currentWeightG }: { spoolId: string; currentWeightG: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await adjustSpoolWeightAction(spoolId, fd);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    backgroundColor: "var(--bg-canvas)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "480px", display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
      <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "var(--spacing-md)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
        Peso atual: <strong style={{ color: "var(--text-primary)" }}>{currentWeightG.toFixed(2)} g</strong>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="movement_type" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>TIPO DE MOVIMENTO *</label>
        <select id="movement_type" name="movement_type" required style={inputStyle}>
          <option value="manual_adjustment">Ajuste Manual</option>
          <option value="weigh_in">Pesagem de Conferência</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="quantity_g" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          QUANTIDADE (g) * <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(positivo = saída; negativo = entrada)</span>
        </label>
        <input id="quantity_g" name="quantity_g" type="number" required step="0.01" style={inputStyle} placeholder="ex: 50.00 (saída) ou -10.00 (entrada)" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="reference_note" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>NOTA / MOTIVO</label>
        <input id="reference_note" name="reference_note" type="text" style={inputStyle} placeholder="ex: Pesagem física 2026-10-15" />
      </div>

      {error && (
        <div style={{ padding: "0.75rem", backgroundColor: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
        <button type="submit" disabled={pending} style={{ padding: "0.625rem 1.25rem", backgroundColor: pending ? "var(--text-muted)" : "var(--color-primary)", color: "#000", border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem", cursor: pending ? "not-allowed" : "pointer" }}>
          {pending ? "SALVANDO..." : "REGISTRAR"}
        </button>
        <button type="button" onClick={() => router.back()} style={{ padding: "0.625rem 1rem", backgroundColor: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.875rem", cursor: "pointer" }}>
          CANCELAR
        </button>
      </div>
    </form>
  );
}
