// ============================================================================
// src/lib/analytics/tracker.ts
// Rastreador Analítico do Cliente - LGPD / Privacy First
//
// REGRAS:
// 1. Não armazena PII (Zero-PII). Nomes, emails e telefones são sanitizados.
// 2. Respeita a preferência de consentimento do usuário.
// 3. Usa navigator.sendBeacon ou fetch keepalive para zero impacto no carregamento.
// ============================================================================

import type { AnalyticsEventName } from "@/types/database.types";

const SESSION_KEY = "kavuno_anon_session_id";
const CONSENT_COOKIE_KEY = "kavuno_cookie_consent";

/**
 * Obtém ou inicializa identificador anônimo de sessão no navegador.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "server-session";

  try {
    let sessionId = window.sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      window.sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `anon_fallback_${Date.now()}`;
  }
}

/**
 * Verifica se o usuário permitiu telemetria analítica (LGPD).
 */
export function hasAnalyticalConsent(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)(${CONSENT_COOKIE_KEY})=([^;]*)`));
    if (!match) return true; // consentimento presumido até escolha expressa
    return match[3] !== "declined";
  } catch {
    return true;
  }
}

/**
 * Remove qualquer chave que possa conter dados pessoais identificáveis antes do envio.
 */
export function sanitizeAnalyticsMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["email", "cpf", "cnpj", "phone", "telefone", "full_name", "nome", "password", "card", "token"];
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      continue; // descarta chave sensível
    }
    clean[key] = value;
  }

  return clean;
}

/**
 * Dispara evento analítico para o backend de forma assíncrona e não-bloqueante.
 */
export function trackClientEvent(
  eventNameOrConfig:
    | AnalyticsEventName
    | {
        eventName: string;
        productId?: string;
        entityType?: "product" | "category" | "campaign" | "order" | "coupon" | "search" | "general";
        entityId?: string;
        metadata?: Record<string, unknown>;
      },
  options?: {
    entityType?: "product" | "category" | "campaign" | "order" | "coupon" | "search" | "general";
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticalConsent()) return;

  let eventName: AnalyticsEventName;
  let entityType: "product" | "category" | "campaign" | "order" | "coupon" | "search" | "general" = "general";
  let entityId: string | null = null;
  let metadata: Record<string, unknown> = {};

  if (typeof eventNameOrConfig === "string") {
    eventName = eventNameOrConfig;
    entityType = options?.entityType ?? "general";
    entityId = options?.entityId ?? null;
    metadata = options?.metadata ?? {};
  } else {
    eventName = eventNameOrConfig.eventName as AnalyticsEventName;
    entityType = eventNameOrConfig.entityType ?? (eventNameOrConfig.productId ? "product" : "general");
    entityId = eventNameOrConfig.entityId ?? eventNameOrConfig.productId ?? null;
    metadata = eventNameOrConfig.metadata ?? {};
  }

  const payload = {
    session_id: getAnonymousSessionId(),
    event_name: eventName,
    entity_type: entityType,
    entity_id: entityId,
    metadata: sanitizeAnalyticsMetadata(metadata),
  };

  const body = JSON.stringify(payload);

  // Prefere navigator.sendBeacon para não atrasar navegação de página
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    } catch {
      // fallback para fetch
    }
  }

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Falha silenciosa para não impactar a experiência de compra do cliente
  });
}
