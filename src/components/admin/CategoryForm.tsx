"use client";

import React, { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";
import { createCategoryAction, updateCategoryAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryFormProps {
  category?: Category;
  categories?: Category[];
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

export function CategoryForm({ category, categories = [] }: CategoryFormProps) {
  const isEdit = !!category;
  const action = isEdit ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  React.useEffect(() => {
    if (state?.success && !isEdit) {
      router.push("/admin/categorias");
    }
  }, [state, isEdit, router]);

  // Para edição, exclui a própria categoria da lista de pais
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <form action={formAction}>
      {isEdit && <input type="hidden" name="id" value={category.id} />}

      {state?.error && <Alert type="error" title="ERRO">{state.error}</Alert>}
      {state?.success && state.message && <Alert type="success" title="OK">{state.message}</Alert>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Input
          label="Nome da Categoria *"
          name="name"
          defaultValue={category?.name}
          required
          placeholder="Ex: Peças Técnicas"
          onChange={(e) => {
            const slugInput = document.querySelector<HTMLInputElement>('[name="slug"]');
            if (slugInput && !isEdit) slugInput.value = slugify(e.target.value);
          }}
        />
        <Input
          label="Slug (URL) *"
          name="slug"
          defaultValue={category?.slug}
          required
          placeholder="pecas-tecnicas"
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label className="form-label">Descrição</label>
        <textarea
          name="description"
          defaultValue={category?.description || ""}
          rows={3}
          className="form-input form-textarea"
          placeholder="Descrição da categoria..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Input
          label="URL da Imagem"
          name="image_url"
          defaultValue={category?.image_url || ""}
          placeholder="https://..."
        />
        <Input
          label="Ordem de Exibição"
          name="display_order"
          type="number"
          min="0"
          defaultValue={String(category?.display_order ?? 0)}
        />
      </div>

      {parentOptions.length > 0 && (
        <div className="form-group">
          <label className="form-label">Categoria Pai (opcional)</label>
          <select
            name="parent_id"
            defaultValue={category?.parent_id || ""}
            className="form-select"
          >
            <option value="">Sem hierarquia (categoria raiz)</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", cursor: "pointer", marginBottom: "var(--spacing-lg)", marginTop: "0.25rem" }}>
        <input type="hidden" name="is_active" value="false" />
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={category?.is_active !== false}
          style={{ accentColor: "var(--color-primary)", width: "1rem", height: "1rem" }}
        />
        CATEGORIA ATIVA (visível no catálogo)
      </label>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Button type="submit" variant="primary" isLoading={isPending}>
          {isEdit ? "SALVAR" : "CRIAR CATEGORIA"}
        </Button>
        <a href="/admin/categorias" className="btn btn-bracket">CANCELAR</a>
      </div>
    </form>
  );
}
