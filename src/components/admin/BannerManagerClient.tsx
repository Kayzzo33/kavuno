"use client";

import React, { useActionState, useTransition, useState, useRef } from "react";
import type { SiteSettingsData, SiteBannerItem } from "@/lib/catalog/queries";
import {
  updateSiteSettingsAction,
  createSiteBannerAction,
  deleteSiteBannerAction,
  toggleSiteBannerActiveAction,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

interface BannerManagerClientProps {
  settings: SiteSettingsData;
  banners: SiteBannerItem[];
}

export function BannerManagerClient({ settings, banners }: BannerManagerClientProps) {
  const [settingsState, settingsAction, isSettingsPending] = useActionState(updateSiteSettingsAction, null);
  const [bannerState, bannerAction, isBannerPending] = useActionState(createSiteBannerAction, null);
  const [isMutating, startTransition] = useTransition();

  // Estados de upload e conversão WebP
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "hero" | "footer">("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Converte qualquer arquivo de imagem selecionado para WebP com compactação de qualidade
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    setUploadFeedback("Convertendo imagem para WebP...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensiona mantendo proporção se for gigantesca (máx 1920 largura para banner web)
        const maxWidth = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpDataUrl = canvas.toDataURL("image/webp", 0.88);
          setImageUrl(webpDataUrl);
          setImagePreview(webpDataUrl);
          setUploadFeedback(`Imagem convertida com sucesso para WebP (${Math.round(webpDataUrl.length / 1024)} KB)`);
        }
        setIsConverting(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente remover este banner?")) {
      startTransition(async () => {
        await deleteSiteBannerAction(id);
      });
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleSiteBannerActiveAction(id, !currentStatus);
    });
  };

  const filteredBanners = banners.filter((b) => {
    const pos = b.position || "hero";
    if (activeTab === "hero") return pos === "hero";
    if (activeTab === "footer") return pos === "footer";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 1. TIPO 1: Letreiro Superior em Loop & Modo Hero */}
      <Card style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "1.25rem" }}>📢</span>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
            1. Letreiro Superior (Marquee em Loop) & Modo Hero
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem" }}>
          Configure o texto contínuo que corre no topo da loja e defina como a área principal (Hero) é exibida.
        </p>

        {settingsState?.error && <Alert type="error">{settingsState.error}</Alert>}
        {settingsState?.success && <Alert type="success">{settingsState.message}</Alert>}

        <form action={settingsAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
              Texto do Letreiro Superior (Passa em loop contínuo na barra preta do topo)
            </label>
            <input
              type="text"
              name="announcement_text"
              defaultValue={settings.announcement_text}
              required
              className="form-input"
              placeholder="Ex: 🚚 Frete Grátis para todo Brasil acima de R$ 199 • 🛡️ Peças em Alta Resolução • ⚡ Despacho Rápido"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
              Modo de Exibição do Hero (Topo da Página Inicial)
            </label>
            <select
              name="hero_mode"
              defaultValue={settings.hero_mode}
              className="form-select"
              style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="hot_products">
                🔥 Vitrine de Produto HOT em Destaque (Item mais vendido + especificações)
              </option>
              <option value="banner">
                🖼️ Banner Gráfico Oficial (Imagem de Lançamento / Campanhas)
              </option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="primary" isLoading={isSettingsPending}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. TIPO 2 & 3: Cadastro de Banners Gráficos (Hero ou Footer) com Upload WebP */}
      <Card style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🎨</span>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
            2. Cadastrar Novo Banner (Hero Principal ou Acima do Footer)
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem" }}>
          Envie sua imagem real do computador (o sistema converte automaticamente para WebP de alta velocidade) ou informe uma URL externa.
        </p>

        {bannerState?.error && <Alert type="error">{bannerState.error}</Alert>}
        {bannerState?.success && <Alert type="success">{bannerState.message}</Alert>}

        <form action={bannerAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                Posição do Banner *
              </label>
              <select
                name="position"
                defaultValue="hero"
                className="form-select"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
              >
                <option value="hero">🔝 Banner Principal (Hero / Topo da Home)</option>
                <option value="footer">🔻 Banner Promocional Rodapé (Acima do Footer)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                Título Principal do Banner *
              </label>
              <input
                type="text"
                name="title"
                required
                className="form-input"
                placeholder="Ex: Coleção Dragões Medievais 3D"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                Tag em Destaque (Opcional)
              </label>
              <input
                type="text"
                name="tag"
                className="form-input"
                placeholder="Ex: NOVO LANÇAMENTO"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                Subtítulo / Descrição
              </label>
              <input
                type="text"
                name="subtitle"
                className="form-input"
                placeholder="Ex: Resolução de 0.12mm em PETG de alta tenacidade"
              />
            </div>
          </div>

          {/* Área de Upload com Conversão WebP Automática */}
          <div
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "1.5rem",
              backgroundColor: "#f8fafc",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📁</div>
            <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "0.25rem" }}>
              Upload de Imagem Real (Conversão Automática para WebP)
            </div>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "1rem" }}>
              PNG, JPG, JPEG ou WebP. O sistema compacta e otimiza instantaneamente.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Escolher Arquivo do Computador
            </button>

            {uploadFeedback && (
              <div style={{ fontSize: "0.8125rem", color: isConverting ? "#d97706" : "#16a34a", marginTop: "0.75rem", fontWeight: 600 }}>
                {uploadFeedback}
              </div>
            )}

            {imagePreview && (
              <div style={{ marginTop: "1rem", position: "relative", display: "inline-block" }}>
                <img
                  src={imagePreview}
                  alt="Pré-visualização do Banner"
                  style={{
                    maxHeight: "180px",
                    maxWidth: "100%",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            <div style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "#64748b" }}>
              Ou se preferir, informe uma URL externa direta:
            </div>
            <input
              type="text"
              name="image_url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImagePreview(e.target.value);
              }}
              required
              className="form-input"
              placeholder="https://exemplo.com/imagem-do-banner.webp"
              style={{ marginTop: "0.5rem", width: "100%" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                Link de Destino ao Clicar
              </label>
              <input
                type="text"
                name="link_url"
                className="form-input"
                placeholder="Ex: /catalogo?categoria=geek"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                Texto do Botão de Ação
              </label>
              <input
                type="text"
                name="button_text"
                className="form-input"
                placeholder="Ex: Conferir Coleção"
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              {/* Checkbox Ativo sem o hidden bugado */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="is_active"
                  value="true"
                  defaultChecked
                  style={{ width: "1.15rem", height: "1.15rem", accentColor: "#4f46e5" }}
                />
                Ativar Banner Imediatamente
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Ordem:</span>
                <input
                  type="number"
                  name="display_order"
                  defaultValue="1"
                  style={{ width: "65px", padding: "0.4rem 0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <Button type="submit" variant="primary" isLoading={isBannerPending || isConverting}>
              + Cadastrar Banner
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Listagem de Todos os Banners com Filtros por Aba */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
              Banners Cadastrados ({banners.length})
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>
              Banners marcados como inativos ficam guardados sem aparecer para o cliente.
            </p>
          </div>

          {/* Abas de filtro */}
          <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "#f1f5f9", padding: "0.25rem", borderRadius: "8px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeTab === "all" ? "#ffffff" : "transparent",
                color: activeTab === "all" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "all" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Todos ({banners.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hero")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeTab === "hero" ? "#ffffff" : "transparent",
                color: activeTab === "hero" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "hero" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Hero Principal ({banners.filter((b) => (b.position || "hero") === "hero").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("footer")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeTab === "footer" ? "#ffffff" : "transparent",
                color: activeTab === "footer" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "footer" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Acima do Footer ({banners.filter((b) => b.position === "footer").length})
            </button>
          </div>
        </div>

        {filteredBanners.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", backgroundColor: "#ffffff", border: "1px dashed #cbd5e1", borderRadius: "12px", color: "#64748b" }}>
            Nenhum banner cadastrado nesta categoria. Utilize o formulário acima para adicionar.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {filteredBanners.map((b) => {
              const pos = b.position || "hero";
              return (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: `1px solid ${b.is_active ? "#cbd5e1" : "#fee2e2"}`,
                    borderRadius: "14px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: "160px", backgroundColor: "#0f172a" }}>
                    <img src={b.image_url} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          backgroundColor: pos === "hero" ? "#4f46e5" : "#059669",
                          color: "#ffffff",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        {pos === "hero" ? "Hero Topo" : "Acima Footer"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          backgroundColor: b.is_active ? "#10b981" : "#ef4444",
                          color: "#ffffff",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        {b.is_active ? "ATIVO" : "PAUSADO"}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    {b.tag && <span style={{ fontSize: "0.75rem", color: "#4f46e5", fontWeight: 700, textTransform: "uppercase" }}>{b.tag}</span>}
                    <strong style={{ fontSize: "1.0625rem", color: "#0f172a", margin: "0.25rem 0" }}>{b.title}</strong>
                    {b.subtitle && <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "0.75rem", lineHeight: 1.4 }}>{b.subtitle}</p>}

                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Ordem: {b.display_order}</span>

                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleToggleActive(b.id, b.is_active)}
                          style={{
                            background: "none",
                            border: "none",
                            color: b.is_active ? "#d97706" : "#16a34a",
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {b.is_active ? "Pausar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleDelete(b.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
