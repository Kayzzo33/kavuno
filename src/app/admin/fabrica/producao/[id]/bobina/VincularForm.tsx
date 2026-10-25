"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { linkSpoolToOrderAction } from "../../../actions";

interface Spool {
  id: string;
  label: string;
  material: string;
  color_name: string;
  current_weight_g: number;
}

export default function VincularBobinaForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [spools, setSpools] = useState<Spool[]>([]);

  useEffect(() => {
    fetch("/api/admin/spools?status=in_use,sealed")
      .then((r) => r.json())
      .then((d) => setSpools(d.spools ?? []))
      .catch(() => setSpools([]));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await linkSpoolToOrderAction(orderId, fd);
    if (result?.error) { setError(result.error); setPending(false); }
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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="spool_id" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          BOBINA *
        </label>
        <select id="spool_id" name="spool_id" required style={inputStyle}>
          <option value="">Selecione uma bobina disponível</option>
          {spools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} — {s.material.toUpperCase()} {s.color_name} ({s.current_weight_g.toFixed(1)} g)
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="consumed_g" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          CONSUMO (g) *
        </label>
        <input id="consumed_g" name="consumed_g" type="number" required min="0.01" step="0.01" style={inputStyle} placeholder="ex: 85.50" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="notes" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>OBSERVAÇÃO</label>
        <input id="notes" name="notes" type="text" style={inputStyle} placeholder="Opcional" />
      </div>

      {error && (
        <div style={{ padding: "0.75rem", backgroundColor: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
        <button type="submit" disabled={pending} style={{ padding: "0.625rem 1.25rem", backgroundColor: pending ? "var(--text-muted)" : "var(--color-primary)", color: "#000", border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.875rem", cursor: pending ? "not-allowed" : "pointer" }}>
          {pending ? "REGISTRANDO..." : "VINCULAR BOBINA"}
        </button>
        <button type="button" onClick={() => router.back()} style={{ padding: "0.625rem 1rem", backgroundColor: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.875rem", cursor: "pointer" }}>
          CANCELAR
        </button>
      </div>
    </form>
  );
}
