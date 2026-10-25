"use client";

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminProduct } from "@/lib/admin/queries";
import type { Database } from "@/types/database.types";
import { createProductAction, updateProductAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Campaign = Database["public"]["Tables"]["campaigns"]["Row"] & {
  products: { count: number }[];
};

interface ProductFormProps {
  product?: AdminProduct;
  categories: Category[];
  campaigns: Campaign[];
}

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

export function ProductForm({ product, categories, campaigns }: ProductFormProps) {
  const isEdit = !!product;
  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.id && !isEdit) {
      router.push(`/admin/produtos/${state.id}/editar`);
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction}>
      {isEdit && <input type="hidden" name="id" value={product.id} />}

      {state?.error && (
        <Alert type="error" title="ERRO AO SALVAR">
          {state.error}
        </Alert>
      )}
      {state?.success && state.message && (
        <Alert type="success" title="SALVO COM SUCESSO!">
          {state.message}
        </Alert>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <Input
          label="Nome do Produto *"
          name="name"
          defaultValue={product?.name}
          required
          placeholder="Ex: Suporte para Monitor"
          onChange={(e) => {
            const slugInput = document.querySelector<HTMLInputElement>('[name="slug"]');
            if (slugInput && !isEdit) {
              slugInput.value = slugify(e.target.value);
            }
          }}
        />
        <Input
          label="Slug (URL amigável) *"
          name="slug"
          defaultValue={product?.slug}
          required
          placeholder="suporte-para-monitor"
          helperText="Gerado automaticamente a partir do nome"
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label className="form-label">Descrição Curta</label>
        <textarea
          name="short_description"
          defaultValue={product?.short_description || ""}
          rows={2}
          className="form-input form-textarea"
          placeholder="Breve descrição para cards e listagens..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label className="form-label">Descrição Completa</label>
        <textarea
          name="full_description"
          defaultValue={product?.full_description || ""}
          rows={5}
          className="form-input form-textarea"
          placeholder="Descrição técnica detalhada do produto..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {/* Modalidade Comercial */}
        <div className="form-group">
          <label className="form-label">Modalidade Comercial *</label>
          <select
            name="commercial_mode"
            defaultValue={product?.commercial_mode || "interest_lead"}
            className="form-select"
            required
          >
            <option value="in_stock">Pronta Entrega</option>
            <option value="pre_order">Pré-venda Paga</option>
            <option value="interest_lead">Reserva Gratuita / Validação</option>
          </select>
        </div>

        {/* Categoria */}
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select
            name="category_id"
            defaultValue={product?.category_id || ""}
            className="form-select"
          >
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Campanha */}
        <div className="form-group">
          <label className="form-label">Campanha (opcional)</label>
          <select
            name="campaign_id"
            defaultValue={product?.campaign_id || ""}
            className="form-select"
          >
            <option value="">Sem campanha</option>
            {campaigns.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.title} ({camp.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <Input
          label="Preço Base (R$) *"
          name="base_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.base_price?.toString()}
          required
          placeholder="0.00"
        />
        <Input
          label="Preço Promocional (R$)"
          name="promotional_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.promotional_price?.toString() || ""}
          placeholder="Deixe vazio se não houver"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <Input
          label="Título SEO (meta_title)"
          name="meta_title"
          defaultValue={product?.meta_title || ""}
          placeholder="Título para mecanismos de busca"
        />
        <Input
          label="Descrição SEO (meta_description)"
          name="meta_description"
          defaultValue={product?.meta_description || ""}
          placeholder="Resumo para mecanismos de busca"
        />
      </div>

      {/* Checkboxes */}
      <div style={{ display: "flex", gap: "var(--spacing-xl)", marginTop: "0.5rem", marginBottom: "var(--spacing-lg)" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
        >
          <input
            type="hidden"
            name="is_active"
            value="false"
          />
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={product?.is_active !== false}
            style={{ accentColor: "var(--color-primary)", width: "1rem", height: "1rem" }}
          />
          PRODUTO ATIVO (visível no catálogo)
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            cursor: "pointer",
          }}
        >
          <input
            type="hidden"
            name="is_featured"
            value="false"
          />
          <input
            type="checkbox"
            name="is_featured"
            value="true"
            defaultChecked={product?.is_featured || false}
            style={{ accentColor: "var(--color-primary)", width: "1rem", height: "1rem" }}
          />
          PRODUTO EM DESTAQUE
        </label>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
        >
          {isEdit ? "SALVAR ALTERAÇÕES" : "CRIAR PRODUTO"}
        </Button>
        <a href="/admin/produtos" className="btn btn-bracket">
          CANCELAR
        </a>
      </div>
    </form>
  );
}
