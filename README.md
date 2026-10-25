# KAVUNO — Plataforma de E-commerce Profissional para Impressão 3D

> **Projeto de portfólio de desenvolvimento full-stack.** Sistema completo de comércio eletrônico com manufatura aditiva sob demanda, módulo financeiro auditável, telemetria LGPD-compliant e conciliação de pagamentos.

---

## ⚖️ Direitos Autorais e Licença de Uso

**Copyright © 2024–2025 Kayky — Todos os direitos reservados.**

Este projeto, incluindo toda a sua arquitetura, código-fonte, estrutura de banco de dados, documentação técnica, design de interfaces e lógica de negócio, foi inteiramente concebido, planejado e desenvolvido por **Kayky**, para finalidade de **uso pessoal e de portfólio profissional**.

**É expressamente PROIBIDO:**

- Copiar, reproduzir ou distribuir qualquer parte deste projeto sem autorização prévia e escrita do autor;
- Utilizar o código-fonte, no todo ou em parte, em projetos comerciais ou públicos sem a devida atribuição ao autor;
- Remover ou alterar este aviso de direitos autorais;
- Utilizar este projeto como base para trabalhos acadêmicos ou comerciais sem mencionar o autor original.

Qualquer cópia, alteração ou uso não autorizado está sujeito às penalidades previstas na **Lei de Direitos Autorais Brasileira (Lei nº 9.610/1998)** e, quando aplicável, à legislação internacional equivalente.

Para solicitar permissão de uso, entre em contato diretamente com o autor.

---

## 🏗️ Visão Geral do Projeto

**KAVUNO** é uma plataforma de e-commerce especializada em impressão 3D com:

| Módulo | Tecnologia | Status |
|---|---|---|
| Frontend / App Router | Next.js 15 (TypeScript strict) | ✅ Produção |
| Banco de Dados | Supabase / PostgreSQL + RLS | ✅ Produção |
| Autenticação | Supabase Auth (SSR / HTTP-Only) | ✅ Produção |
| Pagamentos | Mercado Pago (Sandbox/Prod) | ✅ Produção |
| Financeiro / Ledger | Módulo auditável com idempotência | ✅ Produção |
| Telemetria | Zero-PII / LGPD-compliant | ✅ Produção |
| Analytics Dashboard | Funil de conversão + diagnóstico | ✅ Produção |

---

## 🛒 Modalidades Comerciais (Regra Canônica)

O sistema diferencia rigorosamente três modalidades:

| Modalidade | Gera Pedido? | Gera Receita? | Reserva Estoque? |
|---|---|---|---|
| **Pronta Entrega** (`in_stock`) | ✅ Sim | ✅ Sim | ✅ Sim |
| **Pré-venda Paga** (`pre_order`) | ✅ Sim | ✅ Sim | ✅ Sim |
| **Reserva Gratuita** (`interest_lead`) | ❌ Nunca | ❌ Nunca | ❌ Nunca |

---

## 🧱 Stack Técnico

```
Next.js 15 App Router (TypeScript strict)
├── Supabase (PostgreSQL + Row Level Security)
├── Mercado Pago SDK (pagamentos + webhooks)
├── CSS Tokens (design system proprietário)
└── Node.js 22 (experimental --strip-types para testes)
```

---

## 📂 Estrutura do Repositório

```
eCommerceJkayzz/
├── docs/
│   ├── ARCHITECTURE.md           # Visão geral de arquitetura
│   ├── DATABASE.md               # Modelo relacional e RLS
│   ├── DOMAIN_RULES.md           # Regras de negócio canônicas
│   ├── IMPLEMENTATION_PLAN.md    # Roadmap de entrega
│   └── OPERATIONS.md             # Deploy, migrações e operações
├── supabase/
│   ├── migrations/               # SQL versionado (YYYYMMDDHHMMSS_*.sql)
│   ├── seeds/                    # Dados de inicialização dev/demo
│   └── tests/                    # Testes SQL e de integridade
└── src/
    ├── app/                      # Next.js App Router (páginas + API routes)
    ├── components/               # Componentes UI reutilizáveis
    ├── context/                  # Contextos React (Cart, etc.)
    ├── lib/                      # Lógica de negócio e serviços
    │   ├── analytics/            # Tracker LGPD + queries de dashboard
    │   ├── catalog/              # Catálogo, produtos, categorias
    │   ├── checkout/             # Cupons, inventário, frete
    │   ├── finance/              # Cálculos financeiros e DRE
    │   ├── payments/             # Integração Mercado Pago
    │   └── shipping/             # Provedores de frete (ViaCEP/Correios)
    ├── tests/                    # Suítes de teste isoladas (Node.js)
    └── types/                    # Tipos TypeScript compartilhados
```

---

## 🚀 Configuração Local

### 1. Pré-requisitos

- Node.js 22+
- Conta no [Supabase](https://supabase.com) com projeto criado
- Conta no [Mercado Pago](https://www.mercadopago.com.br/developers) (Sandbox para testes)

### 2. Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

| Variável | Descrição | Obrigatória |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública | ✅ Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa (apenas backend) | ✅ Sim |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token MP (Sandbox: `TEST-...`, Prod: `APP_USR-...`) | ✅ Sim |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Segredo para validação de assinatura de webhook | ✅ Sim |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação | ✅ Sim |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Token Google Search Console | ⬜ Opcional |

> ⚠️ NUNCA exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em variáveis prefixadas com `NEXT_PUBLIC_`.

### 3. Banco de Dados — Aplicar Migrations

Acesse o **SQL Editor** do seu projeto Supabase e execute os arquivos na ordem exata:

```
supabase/migrations/20261015000001_foundation_schema.sql
supabase/migrations/20261015000002_foundation_rls_security.sql
supabase/migrations/20261015000003_inventory_production_filaments.sql
supabase/migrations/20261015000004_checkout_payments.sql
supabase/migrations/20261015000005_financial_ledger.sql
supabase/migrations/20261015000006_analytics_and_observability.sql
```

### 4. Rodar em Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## 🧪 Testes Automatizados

> Requer `.env.local` com credenciais válidas de Supabase.

```bash
npm run test:auth       # Segurança de autenticação e perfis (B.2)
npm run test:catalog    # Catálogo e reservas gratuitas (B.3)
npm run test:admin      # Segurança do painel administrativo (B.4)
npm run test:checkout   # Checkout e pagamentos (B.5)
npm run test:finance    # Módulo financeiro e conciliação (B.7)
npm run test:analytics  # Telemetria, SEO e conformidade LGPD (B.8)
npm test                # Executar todas as suítes em sequência
```

---

## 📊 Funcionalidades Implementadas

### B.1 — Fundação e Banco de Dados
- Schema relacional completo com enums, triggers SECURITY DEFINER e RLS em todas as tabelas
- Função `is_admin()` segura via Postgres

### B.2 — Autenticação e Perfis
- Autenticação SSR com cookies HTTP-Only via `@supabase/ssr`
- Trigger atômico de criação de perfis; bloqueio de autoelevação

### B.3 — Catálogo Público
- Catálogo filtrado por modalidade, categoria e busca
- Formulário de reserva gratuita com zero impacto financeiro

### B.4 — Painel Administrativo
- CRUD de produtos, variantes, categorias e campanhas
- Upload de imagens via Supabase Storage
- Controle de estoque físico com movimentação auditável

### B.5 — Checkout e Pagamentos
- Cálculo autoritativo de preços e frete no servidor
- Cupons com controle de uso e idempotência
- Integração Mercado Pago (PIX e Cartão)
- Webhook assinado com reconciliação automática

### B.6 — Produção, Filamentos e Estoque
- Saldo de bobinas com movimentação auditável
- Ordens de produção com rastreabilidade de filamento consumido

### B.7 — Financeiro e Conciliação
- Livro razão com idempotência garantida (sem double-counting)
- DRE e fluxo de caixa consolidados
- Conciliação automática via webhook (venda ≠ recebimento)

### B.8 — Analytics, SEO e Deploy
- Telemetria Zero-PII / LGPD-compliant (12 tipos de evento)
- Funil de conversão 5 etapas com diagnóstico por produto
- Sitemap dinâmico, robots.txt, JSON-LD Schema.org
- Metadados Open Graph, Twitter Card, Google Site Verification
- Banner de consentimento de cookies

---

## 🔒 Segurança

- **Zero Trust:** RLS habilitado em todas as tabelas públicas
- **Sem float para dinheiro:** Todos os valores usam `numeric(12,2)`
- **Webhooks validados:** Aprovação de pagamento apenas via assinatura
- **Zero PII em analytics:** Rejeição de dados pessoais no nível do banco
- **LGPD:** Consentimento explícito antes de qualquer rastreamento

---

## 👨‍💻 Autor

**Kayky** — Desenvolvedor Full-Stack
Projeto desenvolvido inteiramente para portfólio profissional.

---

*Este projeto é de uso pessoal e portfólio. Reprodução sem autorização expressamente proibida conforme Lei nº 9.610/1998.*
