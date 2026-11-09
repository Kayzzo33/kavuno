"use client";

import React, { useActionState, useTransition } from "react";
import type { SiteSettingsData, SiteBannerItem } from "@/lib/catalog/queries";
import { updateSiteSettingsAction, createSiteBannerAction, deleteSiteBannerAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

interface BannerManagerClientProps {
  settings: SiteSettingsData;
  banners: SiteBannerItem[];
}

export function BannerManagerClient({ settings, banners }: BannerManagerClientProps) {
  const [settingsState, settingsAction, isSettingsPending] = useActionState(updateSiteSettingsAction, null);
  const [bannerState, bannerAction, isBannerPending] = useActionState(createSiteBannerAction, null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente remover este banner?")) {
      startDeleteTransition(async () => {
        await deleteSiteBannerAction(id);
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 1. Configurações da Hero & Barra de Anúncios */}
      <Card style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Configuração da Barra de Avisos & Hero Principal
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          Defina o texto do topo da loja e alterne o modo do hero entre produtos quentes ou banner gráfico.
        </p>

        {settingsState?.error && <Alert type="error">{settingsState.error}</Alert>}
        {settingsState?.success && <Alert type="success">{settingsState.message}</Alert>}

        <form action={settingsAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              Texto da Barra Superior (Announcement Bar)
            </label>
            <input
              type="text"
              name="announcement_text"
              defaultValue={settings.announcement_text}
              required
              className="form-input"
              placeholder="Ex: 🚚 Frete Grátis para todo Brasil acima de R$ 199..."
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.35rem" }}>
              Modo de Exibição do Hero Principal
            </label>
            <select
              name="hero_mode"
              defaultValue={settings.hero_mode}
              className="form-select"
              style={{ width: "100%", padding: "0.65rem 1rem" }}
            >
              <option value="hot_products">
                🔥 Vitrine de Produtos HOT / Mais Vendidos (Estilo Tech Streetwear)
              </option>
              <option value="banner">
                🖼️ Banners Gráficos Reais (Upload de Imagens / Lançamentos)
              </option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="primary" isLoading={isSettingsPending}>
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Cadastro de Novo Banner */}
      <Card style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Adicionar Novo Banner Gráfico
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          Cadastre banners de alta resolução que serão exibidos quando o modo &quot;Banners Gráficos&quot; estiver ativado.
        </p>

        {bannerState?.error && <Alert type="error">{bannerState.error}</Alert>}
        {bannerState?.success && <Alert type="success">{bannerState.message}</Alert>}

        <form action={bannerAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input label="Título do Banner *" name="title" required placeholder="Ex: Coleção Cyberpunk 2026" />
            <Input label="Tag Superior (Opcional)" name="tag" placeholder="Ex: NOVO LANÇAMENTO" />
          </div>

          <Input label="Subtítulo / Descrição" name="subtitle" placeholder="Ex: Action figures exclusivas em resina e PETG" />

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
            <Input label="URL da Imagem do Banner *" name="image_url" required placeholder="https://exemplo.com/banner.jpg" />
            <Input label="Link de Destino" name="link_url" placeholder="/catalogo?categoria=geek" />
            <Input label="Texto do Botão" name="button_text" placeholder="Ver Coleção" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input type="hidden" name="is_active" value="false" />
              <input type="checkbox" name="is_active" value="true" defaultChecked style={{ width: "1rem", height: "1rem", accentColor: "var(--color-primary)" }} />
              Banner Ativo
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Ordem:</span>
              <input type="number" name="display_order" defaultValue="1" style={{ width: "60px", padding: "0.35rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-canvas)", color: "#fff" }} />
            </div>

            <div style={{ marginLeft: "auto" }}>
              <Button type="submit" variant="primary" isLoading={isBannerPending}>
                + Adicionar Banner
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* 3. Listagem de Banners Atuais */}
      <div>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
          Banners Cadastrados ({banners.length})
        </h3>

        {banners.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>
            Nenhum banner cadastrado no momento. Cadastre seu primeiro banner acima.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {banners.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ position: "relative", width: "100%", height: "140px", backgroundColor: "#000" }}>
                  <img src={b.image_url} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  {b.tag && <span style={{ fontSize: "0.6875rem", color: "var(--color-primary)", fontWeight: 700 }}>{b.tag}</span>}
                  <strong style={{ fontSize: "1rem", color: "var(--text-primary)", margin: "0.25rem 0" }}>{b.title}</strong>
                  {b.subtitle && <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>{b.subtitle}</p>}

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Ordem: {b.display_order}</span>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(b.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--status-error)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

