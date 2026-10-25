# Auditoria Abrangente de Segurança, Privacidade, Conformidade Legal e SEO (COMPLIANCE_AUDIT.md)

> **Documento de Auditoria Técnica e Diagnóstico — Etapa B.9**  
> **Data da Auditoria:** 25 de Outubro de 2026  
> **Sistema Auditado:** KAVUNO — E-commerce Profissional de Impressão 3D  
> **Escopo da Análise:** Código-fonte, migrations, schemas do banco de dados, fluxos de checkout, autenticação, storage, telemetria analítica, metadados de SEO e conformidade regulatória (LGPD, CDC, Decreto 7.962/2013, Marco Civil da Internet, COPPA/ECA).

---

## 1. Resumo Executivo

A presente auditoria técnica inspecionou integralmente a base de código do **KAVUNO**, incluindo o Next.js 15 App Router, as 6 migrations do Supabase/PostgreSQL, as políticas de Row Level Security (RLS), o módulo financeiro (B.7) e a telemetria analítica e SEO (B.8).

### Conclusões Gerais:
1. **Segurança Técnica e Arquitetura:** O projeto adota uma postura defensiva consistente. O Row Level Security (RLS) está ativado em 100% das tabelas da fundação, do motor transacional e de analytics. A separação entre cliente anônimo (`createClient`), servidor com cookies HTTP-Only e cliente administrativo com `service_role` (`createAdminClient`) é respeitada; nenhuma credencial confidencial está exposta em variáveis `NEXT_PUBLIC_`.
2. **Telemetria e Privacidade:** O rastreamento implementado na B.8 é internamente operado (sem scripts de terceiros invasivos como Hotjar, Clarity, Google Analytics ou Meta Pixel). Existe higienização ativa no cliente e validação no banco contra PII (nomes, emails, CPFs e cartões).
3. **Lacunas Identificadas:** Foram identificados pontos de atenção de conformidade comercial e legal: ausência de páginas de Termos de Uso e Política de Privacidade estruturadas, omissão de identificação empresarial formal no rodapé (exigência do Decreto 7.962/2013 do E-commerce), modelo de consentimento de cookies presumido antes do opt-in expresso, e uma inconsistência técnica nos eventos de analytics disparados pelo servidor (`order_created` e `payment_confirmed`).

---

## 2. Classificação dos Achados por Grau de Risco

| ID | Classificação | Categoria | Descrição Sucinta | Arquivo / Ponto de Impacto |
|---|---|---|---|---|
| **ACH-01** | **Alto** | Legal / CDC | Ausência de identificação formal do fornecedor no rodapé (CNPJ/CPF, Razão Social, endereço, canais) | `src/components/layout/Footer.tsx` |
| **ACH-02** | **Alto** | Legal / LGPD | Ausência de páginas públicas de Termos de Uso e Política de Privacidade e canal do titular (Art. 18) | Rotas inexistentes em `src/app/` |
| **ACH-03** | **Alto** | Privacidade | Consentimento analítico presumido como ativo antes da manifestação de escolha no banner | `src/lib/analytics/tracker.ts:42` |
| **ACH-04** | **Médio** | Qualidade / Bug | Erro de schema silencioso: inserção de evento analítico com campo `order_id` inexistente no banco | `src/app/checkout/actions.ts:280` e `src/app/api/webhooks/mercadopago/route.ts:147` |
| **ACH-05** | **Médio** | Legal / Menores | Ausência de cláusula declaratória de maioridade civil (+18) ou consentimento para contratação | `src/components/auth/RegisterForm.tsx` e Checkout |
| **ACH-06** | **Médio** | Privacidade | Coleta de telefone/WhatsApp em reservas gratuitas sem mecanismo de descadastro ou opt-out | `src/components/catalog/InterestLeadForm.tsx` |
| **ACH-07** | **Médio** | Segurança | Manutenção de metadados EXIF originais em imagens de produtos enviadas ao Storage | `src/lib/admin/actions.ts:292` |
| **ACH-08** | **Baixo** | Segurança / DoS | Ausência de rate limiting explícito em `/api/analytics/track` | `src/app/api/analytics/track/route.ts` |
| **ACH-09** | **Pendente** | Infraestrutura | Região física dos servidores Supabase (transferência internacional de dados - LGPD Art. 33) | Console Supabase |
| **ACH-10** | **Pendente** | Integração | Validação do segredo HMAC do webhook do Mercado Pago em ambiente de produção | Console Mercado Pago Developers |

---

## 3. Detalhamento dos Achados Técnicos

### ACH-01 — Ausência de Identificação Empresarial Obrigatória (CDC & Decreto 7.962/2013)
- **Evidência:** O arquivo `src/components/layout/Footer.tsx` exibe apenas o texto de direitos autorais genérico `"© KAVUNO — Impressão 3D Profissional"`.
- **Fundamento Legal:** O Decreto Federal nº 7.962/2013 (Regulamentação do Comércio Eletrônico no Brasil), em seu Artigo 2º, estabelece que os sites de comércio eletrônico devem disponibilizar, em local de destaque e fácil visualização:
  1. Razão social e número de inscrição no CNPJ ou CPF;
  2. Endereço físico e eletrônico;
  3. Informações claras de contato para atendimento ao consumidor.
- **Impacto:** Notificações de órgãos de defesa do consumidor (PROCON) e risco de questionamentos comerciais.
- **Validação de Correção:** Inclusão de seção formal com campos parametrizáveis no rodapé e na página de contato.

### ACH-02 — Ausência de Termos de Uso e Política de Privacidade Acessíveis
- **Evidência:** O diretório `src/app` não contém rotas `/privacidade`, `/termos` ou `/trocas-e-devolucoes`. Não há hiperlinks para políticas de dados nos formulários de cadastro, checkout ou reserva gratuita.
- **Fundamento Legal:** Marco Civil da Internet (Lei nº 12.965/2014, art. 7º, VIII) e LGPD (Lei nº 13.709/2018, art. 9º - direito do titular a informações claras e acessíveis sobre o tratamento de seus dados).
- **Impacto:** Falta de transparência perante o titular de dados e fragilidade jurídica em litígios comerciais.
- **Validação de Correção:** Criação de páginas institucionais com a definição dos direitos do titular, procedimentos de exclusão de dados e regras de compra/cancelamento.

### ACH-03 — Consentimento Analítico Presumido antes de Ação Expressa
- **Evidência:** No arquivo `src/lib/analytics/tracker.ts`, linha 42:
  ```typescript
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${CONSENT_COOKIE_KEY})=([^;]*)`));
  if (!match) return true; // consentimento presumido até escolha expressa
  return match[3] !== "declined";
  ```
- **Análise:** Caso o usuário acesse a página pela primeira vez e não interaja imediatamente com o banner de cookies, os eventos de navegação já começam a ser despachados.
- **Fundamento:** Embora os dados sejam Zero-PII e pseudonimizados via hash de sessão, a melhor prática sob o princípio da transparência da LGPD (e sob normas internacionais estritas) é o *opt-in prévio*, ou fundamentar a telemetria estritamente no Legítimo Interesse do Controlador (LGPD Art. 7º, IX) com Relatório de Impacto à Proteção de Dados (LIA), ou suspender o rastreamento até que haja consentimento explícito.
- **Validação de Correção:** Ajustar o padrão para reter o rastreamento não essencial até a aceitação ou classificar os eventos puramente funcionais de segurança separadamente.

### ACH-04 — Inconsistência de Schema em Inserções Server-Side de Analytics
- **Evidência:**
  - Em `src/app/checkout/actions.ts:280`:
    ```typescript
    await (supabaseAdmin.from("analytics_events") as any).insert({
      event_name: "order_created",
      session_id: "chk_" + Math.random().toString(36).substring(2, 10),
      order_id: orderId, // <-- COLUNA INEXISTENTE NA TABELA
      ...
    ```
  - Em `src/app/api/webhooks/mercadopago/route.ts:147`:
    ```typescript
    await (supabaseAdmin.from("analytics_events") as any).insert({
      event_name: "payment_confirmed",
      session_id: "wh_" + Math.random().toString(36).substring(2, 10),
      order_id: payment.order_id, // <-- COLUNA INEXISTENTE NA TABELA
      ...
    ```
  - O schema da tabela `analytics_events` (Migration 06) define:
    ```sql
    entity_type TEXT CHECK (entity_type IN ('product', 'category', 'campaign', 'order', 'coupon', 'search', 'general')),
    entity_id UUID,
    ```
- **Impacto:** O Postgres rejeita o comando `INSERT` por causa da coluna inválida `order_id`. O bloco `catch` silencia o erro, impedindo que o evento de conversão final do funil (`order_created` e `payment_confirmed`) seja registrado no banco de dados.
- **Validação de Correção:** Substituir `order_id: orderId` por `entity_type: "order", entity_id: orderId`.

### ACH-05 — Ausência de Declaração de Capacidade Civil / Maioridade
- **Evidência:** O formulário de registro (`RegisterForm.tsx`) e o checkout (`CheckoutPage`) não apresentam declaração ou restrição de idade mínima.
- **Análise:** O comércio eletrônico e a celebração de contratos onerosos exigem capacidade jurídica plena (art. 104 do Código Civil) ou assistência de responsáveis. Em relação a menores, a LGPD (art. 14) impõe proteção especial ao melhor interesse da criança e do adolescente.
- **Validação de Correção:** Incluir nos termos de uso e no formulário de compra a declaração de maioridade civil (18 anos) ou de autorização parental para realização de pedidos.

### ACH-06 — Coleta de WhatsApp em Reservas sem Mecanismo de Descadastro
- **Evidência:** O formulário de reserva de interesse (`InterestLeadForm.tsx`) coleta opcionalmente o número de WhatsApp (`whatsapp_phone`) para avisos instantâneos. Não há canal para que o visitante posteriormente revogue esse consentimento sem entrar em contato direto com o suporte.
- **Fundamento Legal:** LGPD Art. 8º, § 5º (o consentimento pode ser revogado a qualquer momento mediante manifestação expressa do titular).
- **Validação de Correção:** Incluir instrução clara de revogação e link no rodapé/e-mail para cancelamento de recebimento de mensagens.

### ACH-07 — Preservação de Metadados EXIF em Uploads de Imagens
- **Evidência:** O upload de imagens de produtos em `src/lib/admin/actions.ts:292` transfere o arquivo binário diretamente para o Supabase Storage sem passar por processo de sanitização de metadados EXIF.
- **Impacto:** Fotografias tiradas por celulares de administradores podem conter metadados embutidos (geolocalização GPS, modelo do aparelho).
- **Validação de Correção:** Implementar pipeline de limpeza de EXIF no momento do processamento ou documentar diretriz operacional para stripping de metadados antes do envio.

---

## 4. Auditoria de Segurança Técnica do Supabase

### 4.1. Row Level Security (RLS)
- **Tabelas com RLS verificado:**
  - `profiles`: SELECT/UPDATE/INSERT restrito ao titular (`id = auth.uid()`) ou `is_admin()`. Trigger de proteção contra auto-elevação de `role`.
  - `customer_addresses`: Acesso estritamente isolado por `profile_id = auth.uid()`.
  - `interest_leads`: Inserção pública permitida (necessária para validação anônima de mercado); leitura e edição restritas a `is_admin()`.
  - `orders` e `order_items`: RLS ativo. Modificações administrativas protegidas.
  - `financial_transactions`, `accounts_payable`, `accounts_receivable`: 100% restritos a administradores.
  - `analytics_events`: Inserção pública permitida; leitura e deleção restritas a `is_admin()`.

### 4.2. Triggers e Funções `SECURITY DEFINER`
- Todas as funções `SECURITY DEFINER` (`is_admin`, `prevent_self_role_escalation`, `handle_new_user`, `log_analytics_event`) especificam explicitamente `SET search_path = public`, eliminando vulnerabilidades de injeção de schema por hijacking de `search_path`.

---

## 5. Auditoria de SEO e Desempenho

| Critério | Status | Evidência Técnica |
|---|---|---|
| Títulos dinâmicos com template | ✅ Conforme | `title: { template: "%s \| KAVUNO 3D", default: "..." }` em `layout.tsx` |
| Meta Descriptions descritivas | ✅ Conforme | Presentes em `layout.tsx`, `/catalogo`, `/produtos/[slug]` |
| URL Canônica Global | ✅ Conforme | `alternates: { canonical: appUrl }` via `metadataBase` |
| OpenGraph e Twitter Cards | ✅ Conforme | `summary_large_image`, imagem 1024x1024 definida |
| Sitemap Dinâmico XML | ✅ Conforme | `src/app/sitemap.ts` mapeia rotas fixas e slugs ativos |
| robots.txt Dinâmico | ✅ Conforme | `src/app/robots.ts` bloqueia `/admin/`, `/api/`, `/checkout`, `/carrinho` |
| Dados Estruturados JSON-LD | ✅ Conforme | `Organization`, `WebSite` e `Product` (Schema.org) |
| Pré-renderização Estática (SSG/ISR) | ✅ Conforme | `generateStaticParams()` em `/produtos/[slug]` |
| Fontes Externas / Bloqueio de Renderização | ✅ Otimizado | Fontes locais do sistema operacional (zero requisições de CDN) |

---

## 6. Critérios de Bloqueio antes do Lançamento Público

Os seguintes itens são **bloqueadores mandatórios** antes da abertura comercial do e-commerce ao público externo:
1. Publicação de página com **Termos de Uso**, **Política de Privacidade** e **Política de Trocas/Devoluções (CDC Art. 49)**.
2. Atualização do rodapé com a **identificação civil/empresarial completa do responsável** (CNPJ ou CPF, nome/razão social, e-mail de contato oficial).
3. Correção do campo `entity_id` no disparo server-side de analytics para `order_created` e `payment_confirmed`.
4. Definição explícita de e-mail de suporte para solicitações de privacidade e direitos do titular da LGPD.
