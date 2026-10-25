"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createSpoolAction } from "../../actions";
import type { FilamentMaterial } from "@/types/database.types";

const MATERIALS: { value: FilamentMaterial; label: string }[] = [
  { value: "pla", label: "PLA" },
  { value: "petg", label: "PETG" },
  { value: "abs", label: "ABS" },
  { value: "asa", label: "ASA" },
  { value: "tpu", label: "TPU" },
  { value: "pc", label: "PC" },
  { value: "nylon", label: "Nylon" },
  { value: "other", label: "Outro" },
];

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  step?: string;
  min?: string;
}) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label
        htmlFor={name}
        style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}
      >
        {label}{required && " *"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        step={step}
        min={min}
        style={inputStyle}
      />
    </div>
  );
}

export default function NovaBobonaForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createSpoolAction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
    // redirect é feito na action em caso de sucesso
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
        <Field label="IDENTIFICAÇÃO (label)" name="label" required placeholder="ex: PLA-VERDE-001" />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label htmlFor="material" style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            MATERIAL *
          </label>
          <select
            id="material"
            name="material"
            required
            style={{ padding: "0.625rem 0.75rem", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}
          >
            {MATERIALS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <Field label="COR (nome)" name="color_name" required placeholder="Verde Lima" />
        <Field label="COR HEX" name="color_hex" type="color" defaultValue="#00ff00" />

        <Field label="FABRICANTE" name="manufacturer" placeholder="Bambu Lab, Polymaker..." />
        <Field label="LOTE (batch)" name="batch_number" placeholder="LOT-20261001" />

        <Field label="CUSTO DE AQUISIÇÃO (R$)" name="purchase_cost" type="number" required step="0.01" min="0" placeholder="89.90" />
        <Field label="FRETE ATRIBUÍVEL (R$)" name="allocated_shipping_cost" type="number" step="0.01" min="0" defaultValue="0" placeholder="0.00" />

        <Field label="PESO BRUTO (g)" name="gross_weight_g" type="number" required step="0.01" min="0.01" placeholder="1250.00" />
        <Field label="TARA (peso bobina vazia, g)" name="tare_weight_g" type="number" step="0.01" min="0" defaultValue="0" placeholder="250.00" />

        <Field label="NOTA FISCAL / DOCUMENTO" name="supplier_invoice" placeholder="NF-000123" />
        <Field label="DATA DE COMPRA" name="purchased_at" type="date" />
      </div>

      <div style={{ marginTop: "var(--spacing-md)" }}>
        <Field label="OBSERVAÇÕES" name="notes" placeholder="Notas gerais sobre esta bobina..." />
      </div>

      {error && (
        <div style={{ marginTop: "var(--spacing-md)", padding: "0.75rem", backgroundColor: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-lg)" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "0.625rem 1.5rem",
            backgroundColor: pending ? "var(--text-muted)" : "var(--color-primary)",
            color: "#000",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: pending ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "SALVANDO..." : "CADASTRAR BOBINA"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/fabrica/bobinas")}
          style={{ padding: "0.625rem 1rem", backgroundColor: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.875rem", cursor: "pointer" }}
        >
          CANCELAR
        </button>
      </div>
    </form>
  );
}
