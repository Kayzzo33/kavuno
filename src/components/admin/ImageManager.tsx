"use client";

import React, { useActionState, useTransition } from "react";
import type { AdminProduct } from "@/lib/admin/queries";
import { addProductImageAction, deleteProductImageAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

interface ImageManagerProps {
  product: AdminProduct;
}

export function ImageManager({ product }: ImageManagerProps) {
  const [state, formAction, isPending] = useActionState(addProductImageAction, null);
  const [isDeleting, startDeleting] = useTransition();

  const images = product.images || [];

  return (
    <div>
      {/* Grid de Imagens Existentes */}
      {images.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.75rem",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                border: img.is_primary
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                backgroundColor: "var(--bg-canvas)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.alt_text || product.name}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div
                style={{
                  padding: "0.375rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                {img.is_primary && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.5625rem",
                      color: "var(--color-primary)",
                      fontWeight: 700,
                    }}
                  >
                    PRINCIPAL
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.5625rem",
                    color: "var(--text-muted)",
                  }}
                >
                  ORD: {img.display_order}
                </div>
                <button
                  className="btn btn-bracket"
                  style={{
                    fontSize: "0.5625rem",
                    padding: "0.2rem 0.4rem",
                    color: "var(--status-error)",
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                  disabled={isDeleting}
                  onClick={() => {
                    if (confirm("Remover esta imagem?")) {
                      startDeleting(async () => {
                        await deleteProductImageAction(img.id, product.id);
                      });
                    }
                  }}
                >
                  REMOVER
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "var(--spacing-md)",
            textAlign: "center",
            backgroundColor: "var(--bg-canvas)",
            border: "1px dashed var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          Nenhuma imagem cadastrada. Adicione por URL abaixo.
        </div>
      )}

      {/* Formulário para Adicionar Imagem por URL */}
      <div
        style={{
          padding: "var(--spacing-md)",
          backgroundColor: "var(--bg-canvas)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-primary)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          + ADICIONAR IMAGEM (UPLOAD OU URL)
        </div>

        {state?.error && (
          <Alert type="error" title="ERRO">
            {state.error}
          </Alert>
        )}
        {state?.success && state.message && (
          <Alert type="success" title="OK">
            {state.message}
          </Alert>
        )}

        <form action={formAction}>
          <input type="hidden" name="product_id" value={product.id} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label">Upload de Imagem (JPG, PNG, WEBP — máx 5MB)</label>
              <input
                type="file"
                name="image_file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="form-input"
                style={{ padding: "0.5rem" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-subtle)" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--text-muted)" }}>OU</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-subtle)" }} />
            </div>

            <Input
              label="URL Externa da Imagem"
              name="image_url"
              type="url"
              placeholder="https://..."
              helperText="Preencha caso não vá fazer upload direto de arquivo"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Input
              label="Texto Alternativo (SEO)"
              name="alt_text"
              placeholder="Descrição da imagem"
            />
            <Input
              label="Ordem de Exibição"
              name="display_order"
              type="number"
              min="0"
              defaultValue={String(images.length)}
              helperText="0 = primeira foto"
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              marginBottom: "var(--spacing-md)",
              marginTop: "0.25rem",
            }}
          >
            <input
              type="checkbox"
              name="is_primary"
              value="true"
              defaultChecked={images.length === 0}
              style={{ accentColor: "var(--color-primary)", width: "1rem", height: "1rem" }}
            />
            DEFINIR COMO IMAGEM PRINCIPAL
          </label>

          <Button type="submit" variant="primary" isLoading={isPending}>
            SALVAR IMAGEM
          </Button>
        </form>
      </div>
    </div>
  );
}
