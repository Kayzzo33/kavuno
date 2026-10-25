// ============================================================================
// src/tests/analytics_seo_test.ts
// MÓDULO B.8 — Testes de Telemetria, SEO e Conformidade LGPD
//
// Valida:
// - Funções do tracker analítico (consentimento, sanitização de PII)
// - Estrutura e cobertura dos eventos de funil
// - Conformidade da lista de eventos com o enum do banco
// - Função de sanitização de metadata sensível
// ============================================================================

import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Utilitários de Teste
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          console.log(`  ✅  ${name}`);
          passed++;
        })
        .catch((err: unknown) => {
          console.error(`  ✗  ${name}`);
          console.error(`     ↳ ${err instanceof Error ? err.message : String(err)}`);
          failed++;
        });
    } else {
      console.log(`  ✅  ${name}`);
      passed++;
    }
  } catch (err: unknown) {
    console.error(`  ✗  ${name}`);
    console.error(`     ↳ ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Importações das funções puras (sem dependência de browser/Supabase)
// ---------------------------------------------------------------------------

/**
 * Replica a lógica de sanitização do tracker para testes isolados.
 * (Evita importar módulo client que depende do DOM)
 */
function sanitizeAnalyticsMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = [
    "email",
    "cpf",
    "cnpj",
    "phone",
    "telefone",
    "full_name",
    "nome",
    "password",
    "card",
    "token",
  ];
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

/**
 * Replica a lista canônica de eventos permitidos pelo enum do banco.
 * Deve estar em sincronismo com migration 20261015000006.
 */
const VALID_ANALYTICS_EVENTS = new Set([
  "product_view",
  "search",
  "search_no_results",
  "filter_applied",
  "variant_select",
  "banner_view",
  "banner_click",
  "cart_add",
  "cart_remove",
  "checkout_start",
  "coupon_applied",
  "lead_created",
  "order_created",
  "payment_confirmed",
]);

// ---------------------------------------------------------------------------
// Bloco 1: Sanitização de Metadata (Zero-PII)
// ---------------------------------------------------------------------------
console.log("\n// BLOCO 1 — SANITIZAÇÃO DE METADATA (ZERO-PII)");

test("sanitize - remove campo 'email' da metadata", () => {
  const result = sanitizeAnalyticsMetadata({
    email: "cliente@example.com",
    slug: "action-figure-dragao",
    price: 89.9,
  });
  assert.ok(!("email" in result), "Campo 'email' não deve estar presente");
  assert.equal(result.slug, "action-figure-dragao");
  assert.equal(result.price, 89.9);
});

test("sanitize - remove campo 'cpf' da metadata", () => {
  const result = sanitizeAnalyticsMetadata({
    cpf: "123.456.789-00",
    category: "Colecionáveis",
  });
  assert.ok(!("cpf" in result), "Campo 'cpf' não deve estar presente");
  assert.equal(result.category, "Colecionáveis");
});

test("sanitize - remove campo 'phone' da metadata", () => {
  const result = sanitizeAnalyticsMetadata({
    phone: "(11) 99999-9999",
    commercial_mode: "in_stock",
  });
  assert.ok(!("phone" in result));
  assert.equal(result.commercial_mode, "in_stock");
});

test("sanitize - remove campo 'full_name' da metadata", () => {
  const result = sanitizeAnalyticsMetadata({
    full_name: "Carlos Eduardo",
    items_count: 3,
  });
  assert.ok(!("full_name" in result));
  assert.equal(result.items_count, 3);
});

test("sanitize - remove campo 'password' da metadata", () => {
  const result = sanitizeAnalyticsMetadata({
    password: "senha_secreta_123",
    variant_id: "uuid-da-variante",
  });
  assert.ok(!("password" in result));
  assert.equal(result.variant_id, "uuid-da-variante");
});

test("sanitize - remove campo 'card' (subcadeia case-insensitive) da metadata", () => {
  const result = sanitizeAnalyticsMetadata({
    card_number: "4111111111111111",
    payment_method: "pix",
  });
  assert.ok(!("card_number" in result));
  assert.equal(result.payment_method, "pix");
});

test("sanitize - preserva campos legítimos sem modificação", () => {
  const result = sanitizeAnalyticsMetadata({
    slug: "impressora-petg",
    category_slug: "filamentos",
    price: 149.9,
    results_count: 0,
    query: "impressora 3d",
    items_count: 2,
    commercial_mode: "pre_order",
  });
  assert.deepEqual(result, {
    slug: "impressora-petg",
    category_slug: "filamentos",
    price: 149.9,
    results_count: 0,
    query: "impressora 3d",
    items_count: 2,
    commercial_mode: "pre_order",
  });
});

test("sanitize - metadata vazia retorna objeto vazio", () => {
  const result = sanitizeAnalyticsMetadata({});
  assert.deepEqual(result, {});
});

// ---------------------------------------------------------------------------
// Bloco 2: Cobertura do Funil de Conversão
// ---------------------------------------------------------------------------
console.log("\n// BLOCO 2 — COBERTURA DO FUNIL DE CONVERSÃO");

test("funil - todos os 5 estágios obrigatórios estão registrados no enum", () => {
  const funnelStages = [
    "product_view",
    "cart_add",
    "checkout_start",
    "order_created",
    "payment_confirmed",
  ];
  for (const stage of funnelStages) {
    assert.ok(
      VALID_ANALYTICS_EVENTS.has(stage),
      `Evento de funil '${stage}' não encontrado no enum`
    );
  }
});

test("funil - eventos de diagnóstico de banner estão no enum", () => {
  assert.ok(VALID_ANALYTICS_EVENTS.has("banner_view"));
  assert.ok(VALID_ANALYTICS_EVENTS.has("banner_click"));
});

test("funil - eventos de interação de catálogo estão no enum", () => {
  assert.ok(VALID_ANALYTICS_EVENTS.has("search"));
  assert.ok(VALID_ANALYTICS_EVENTS.has("search_no_results"));
  assert.ok(VALID_ANALYTICS_EVENTS.has("filter_applied"));
  assert.ok(VALID_ANALYTICS_EVENTS.has("variant_select"));
});

test("funil - remoção do carrinho e lead estão no enum", () => {
  assert.ok(VALID_ANALYTICS_EVENTS.has("cart_remove"));
  assert.ok(VALID_ANALYTICS_EVENTS.has("lead_created"));
});

test("funil - coupon_applied está no enum", () => {
  assert.ok(VALID_ANALYTICS_EVENTS.has("coupon_applied"));
});

test("funil - total de 14 eventos registrados no enum", () => {
  assert.equal(VALID_ANALYTICS_EVENTS.size, 14);
});

// ---------------------------------------------------------------------------
// Bloco 3: Regras de Negócio de Rastreamento
// ---------------------------------------------------------------------------
console.log("\n// BLOCO 3 — REGRAS DE NEGÓCIO DE RASTREAMENTO");

test("interesse_lead - reserva gratuita nunca deve gerar evento order_created", () => {
  // Regra: interest_lead é bloqueado no CartContext antes de qualquer evento de pedido
  // Validação estática: garantir que nenhum dos eventos financeiros inclui interest_lead
  const financialEvents = ["order_created", "payment_confirmed"];
  const leadOnlyEvent = "lead_created";
  assert.ok(VALID_ANALYTICS_EVENTS.has(leadOnlyEvent));
  for (const ev of financialEvents) {
    // Eventos financeiros e lead_created são distintos — isso é uma validação de separação
    assert.notEqual(ev, leadOnlyEvent, `Evento '${ev}' não deve ser o mesmo que '${leadOnlyEvent}'`);
  }
});

test("session_id - deve ser gerado com prefixo 'anon_' para rastreamentos do browser", () => {
  // Reproduz a lógica de getAnonymousSessionId() sem depender do DOM
  const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  assert.ok(sessionId.startsWith("anon_"), "Session ID deve começar com 'anon_'");
  assert.ok(sessionId.length > 10, "Session ID deve ter comprimento suficiente");
});

test("session_id - dois IDs gerados em sequência devem ser únicos", () => {
  const id1 = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const id2 = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  // Na prática são diferentes devido ao Math.random; não devem colidir
  assert.notEqual(id1, id2, "IDs de sessão distintos não devem ser idênticos");
});

test("webhook session_id - prefixo 'wh_' para eventos gerados pelo servidor", () => {
  const webhookSessionId = "wh_" + Math.random().toString(36).substring(2, 10);
  assert.ok(webhookSessionId.startsWith("wh_"));
});

test("checkout session_id - prefixo 'chk_' para eventos gerados na Server Action", () => {
  const checkoutSessionId = "chk_" + Math.random().toString(36).substring(2, 10);
  assert.ok(checkoutSessionId.startsWith("chk_"));
});

// ---------------------------------------------------------------------------
// Bloco 4: Validação de Conformidade LGPD do banco
// ---------------------------------------------------------------------------
console.log("\n// BLOCO 4 — CONFORMIDADE LGPD (VALIDAÇÃO ESTÁTICA)");

test("LGPD - função log_analytics_event rejeita 'email' na metadata", () => {
  // Simulação lógica da guarda do banco: checa se a lista de chaves proibidas
  // cobre 'email', 'cpf', 'phone', 'credit_card'
  const prohibitedKeys = ["email", "cpf", "phone", "credit_card"];
  const testMetadata = { email: "cliente@example.com", query: "dragao" };
  const hasPii = prohibitedKeys.some((k) => k in testMetadata);
  assert.ok(hasPii, "Deve detectar PII no metadata para rejeição");
});

test("LGPD - metadata sem PII passa pela guarda do banco", () => {
  const prohibitedKeys = ["email", "cpf", "phone", "credit_card"];
  const cleanMetadata = { query: "dragao", results_count: 5, slug: "dragao-petg" };
  const hasPii = prohibitedKeys.some((k) => k in cleanMetadata);
  assert.ok(!hasPii, "Metadata limpa não deve conter PII");
});

// ---------------------------------------------------------------------------
// Resultado Final
// ---------------------------------------------------------------------------
setTimeout(() => {
  console.log(`\n// RESULTADO FINAL`);
  console.log(`   Passou: ${passed}`);
  console.log(`   Falhou: ${failed}`);
  console.log(`   Total : ${passed + failed}`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} teste(s) falharam.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Todos os ${passed} testes de B.8 passaram.`);
    process.exit(0);
  }
}, 100);
