"use client";

import React, { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createCampaignAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CampaignForm() {
  const [state, formAction, isPending] = useActionState(createCampaignAction, null);
  const router = useRouter();

  React.useEffect(() => {
    if (state?.success) {
      router.push("/admin/campanhas");
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      {state?.error && <Alert type="error" title="ERRO">{state.error}</Alert>}
      {state?.success && state.message && <Alert type="success" title="OK">{state.message}</Alert>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Input
          label="Título da Campanha *"
          name="title"
          required
          placeholder="Ex: Lote 01 — Colecionáveis Cyberpunk"
          onChange={(e) => {
            const slugInput = document.querySelector<HTMLInputElement>('[name="slug"]');
            if (slugInput) slugInput.value = slugify(e.target.value);
          }}
        />
        <Input
          label="Slug (URL) *"
          name="slug"
          required
          placeholder="lote-01-cyberpunk"
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label className="form-label">Descrição da Campanha</label>
        <textarea
          name="description"
          rows={3}
          className="form-input form-textarea"
          placeholder="Condições do lote, previsão de manufatura, avisos de pré-venda..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div className="form-group">
          <label className="form-label">Modalidade Comercial *</label>
          <select name="commercial_mode" required className="form-select" defaultValue="pre_order">
            <option value="pre_order">Pré-venda Paga</option>
            <option value="interest_lead">Validação / Reserva Gratuita</option>
            <option value="in_stock">Pronta Entrega</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Status Inicial *</label>
          <select name="status" required className="form-select" defaultValue="active">
            <option value="draft">Rascunho</option>
            <option value="active">Ativa</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        <Input
          label="Meta Mínima (unidades) *"
          name="target_min_units"
          type="number"
          min="1"
          defaultValue="10"
          required
        />
        <Input
          label="Limite Máximo (opcional)"
          name="max_units_limit"
          type="number"
          min="1"
          placeholder="Ilimitado"
        />
        <Input
          label="Dias Estimados de Produção"
          name="estimated_production_days"
          type="number"
          min="1"
          placeholder="Ex: 15"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Input
          label="Início da Campanha"
          name="starts_at"
          type="datetime-local"
        />
        <Input
          label="Fim da Campanha"
          name="ends_at"
          type="datetime-local"
        />
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "var(--spacing-md)" }}>
        <Button type="submit" variant="primary" isLoading={isPending}>
          CRIAR CAMPANHA
        </Button>
        <a href="/admin/campanhas" className="btn btn-bracket">CANCELAR</a>
      </div>
    </form>
  );
}
