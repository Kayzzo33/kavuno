# Operações e Procedimentos (OPERATIONS.md)

Este documento descreve os procedimentos operacionais para desenvolvedores e administradores gerenciarem o ambiente, banco de dados, migrações e deploys do **3D Commerce (KAVUNO)**.

---

## 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e preencha todas as variáveis:

```bash
cp .env.example .env.local
```

| Variável | Descrição | Escopo | Obrigatória |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Frontend + Backend | ✅ Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública | Frontend + Backend | ✅ Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa (bypass RLS) | Backend only | ✅ Sim |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token MP (Sandbox: `TEST-...`) | Backend only | ✅ Sim |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Segredo para validação de assinatura de webhook | Backend only | ✅ Sim |
| `NEXT_PUBLIC_APP_URL` | URL canônica da aplicação | Frontend + Backend | ✅ Sim |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Token de verificação Google Search Console | Frontend | ⬜ Opcional |

> ⚠️ **NUNCA** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em variáveis prefixadas com `NEXT_PUBLIC_`.

---

## 2. Aplicação de Migrations no Supabase

### Migrations Disponíveis (ordem de aplicação obrigatória)

| Arquivo | Conteúdo | Fase |
|---|---|---|
| `20261015000001_foundation_schema.sql` | Tabelas base, enums, triggers | B.1 |
| `20261015000002_foundation_rls_security.sql` | Políticas RLS e função `is_admin()` | B.1/B.2 |
| `20261015000003_inventory_production_filaments.sql` | Estoque, bobinas, produção | B.6 |
| `20261015000004_checkout_payments.sql` | Pedidos, pagamentos, webhooks | B.5 |
| `20261015000005_financial_ledger.sql` | Ledger financeiro, AR, AP, snapshots | B.7 |
| `20261015000006_analytics_and_observability.sql` | Eventos analíticos LGPD-compliant | B.8 |

### Método 1: Painel Web (SQL Editor do Supabase) — RECOMENDADO INICIALMENTE
1. Acesse: https://supabase.com/dashboard/project/ajjogujfpmasamzejluo/sql
2. Abra **SQL Editor** → **New query**
3. Cole e execute cada arquivo na ordem da tabela acima
4. Verifique a mensagem `Success. No rows returned`

### Método 2: Supabase CLI (quando autenticado)
```bash
npx supabase link --project-ref ajjogujfpmasamzejluo
npx supabase db push
```

---

## 3. Primeiro Usuário Administrador

Após criar o primeiro usuário via `/cadastro` ou painel Auth:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'seu_email@exemplo.com';

-- Verificação:
SELECT id, email, role FROM public.profiles WHERE email = 'seu_email@exemplo.com';
```

---

## 4. Fluxos de Autenticação

- **Cadastro (`/cadastro`):** `supabase.auth.signUp()` → trigger `on_auth_user_created` cria linha em `profiles`.
- **Confirmação de e-mail:** Redirecionada para `/auth/callback`.
- **Recuperação de senha (`/recuperar-senha`):** `resetPasswordForEmail()` → `/auth/callback?next=/redefinir-senha`.
- **Sessões SSR:** Cookies HTTP-Only via `@supabase/ssr`. Sem `localStorage` para tokens.

---

## 5. Configuração de Webhooks (Mercado Pago)

> ⚠️ **Não publique em produção nem processe cobranças reais sem autorização explícita. Teste em Sandbox antes.**

1. No painel MP Developers: **Suas integrações → Webhooks → Adicionar URL**
2. URL do webhook: `https://SEU_DOMINIO/api/webhooks/mercadopago`
3. Eventos a monitorar: `payment` (todos os status)
4. Copie o **Segredo de assinatura** e preencha `MERCADO_PAGO_WEBHOOK_SECRET` no `.env.local` / variáveis de produção
5. A rota `/api/webhooks/mercadopago` valida assinatura via HMAC antes de processar qualquer evento

### Fluxo de Conciliação Automática (B.7)
```
Webhook "payment.approved" recebido
  → Valida assinatura HMAC
  → Busca pagamento por external_payment_id
  → Atualiza payments.status = 'approved'
  → Atualiza orders.status = 'payment_approved'
  → Registra financial_transactions (idempotência: PAY-{id}-INCOME)
  → Atualiza accounts_receivable.status = 'received'
  → Registra analytics_events 'payment_confirmed'
```

---

## 6. Testes Automatizados

> Requer `.env.local` com Supabase ativo e usuários de teste configurados.

```bash
npm run test:auth       # Segurança de autenticação e perfis (B.2)
npm run test:catalog    # Catálogo e reservas gratuitas de interesse (B.3)
npm run test:admin      # Segurança do painel administrativo (B.4)
npm run test:checkout   # Checkout e pagamentos (B.5)
npm run test:finance    # Módulo financeiro e conciliação (B.7)
```

### Resultado Esperado: 13/13 testes financeiros passando

```
✅ calculateFilamentCost - calcula custo corretamente
✅ calculateFilamentCost - custo zero para gramatura zero
✅ calculateUnitEconomics - calcula margem bruta
✅ calculateUnitEconomics - retorna margem zero se preco cobre exatamente o custo
✅ calculateGatewayFee - PIX 0.99%
✅ calculateGatewayFee - cartao credito 4.99%
✅ buildLedgerTransaction - receita: gross = net + fee
✅ buildLedgerTransaction - gera chave de idempotencia PAY-
✅ buildLedgerTransaction - chaves de idempotencia PAY- sao unicas por pagamento
✅ buildSpoolPurchaseTransaction - despesa com frete alocado
✅ buildSpoolPurchaseTransaction - idempotencia unica por bobina
✅ buildEquipmentAssetTransaction - CAPEX de equipamento
✅ buildRefundTransaction - estorno com valor negativo
```

---

## 7. Configuração do Supabase Storage

Para upload de imagens de produtos:
1. Acesse **Storage → New bucket**
2. Nome: `product-images`
3. Marque **Public bucket**
4. Tamanho máximo: `5MB`; MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
5. Policies: `INSERT` e `DELETE` apenas para `authenticated` onde `is_admin() = true`

---

## 8. Telemetria e Analytics (B.8)

### Eventos Rastreados
| Evento | Disparado Quando | Entidade |
|---|---|---|
| `product_view` | Usuário acessa página de produto | `product` |
| `search` | Usuário executa busca | `search` |
| `search_no_results` | Busca retorna zero resultados | `search` |
| `filter_applied` | Filtro de categoria ou modalidade aplicado | `general` |
| `variant_select` | Variante de produto selecionada | `product` |
| `banner_view` | Banner de campanha visível na tela | `campaign` |
| `banner_click` | Clique em banner de campanha | `campaign` |
| `cart_add` | Item adicionado ao carrinho | `product` |
| `cart_remove` | Item removido do carrinho | `product` |
| `checkout_start` | Página de checkout acessada | `general` |
| `coupon_applied` | Cupom aplicado com sucesso no pedido | `general` |
| `order_created` | Pedido criado com sucesso | `order` |
| `payment_confirmed` | Pagamento aprovado via webhook | `general` |
| `lead_created` | Reserva gratuita registrada | `product` |

### Conformidade LGPD
- Zero PII: nenhum dado pessoal (nome, e-mail, CPF) é gravado em `analytics_events`
- Função `log_analytics_event` rejeita no banco qualquer metadata contendo `email`, `cpf`, `phone` ou `credit_card`
- Consentimento respeitado via cookie `kavuno_cookie_consent=declined`
- Sessões identificadas por hash anônimo no `sessionStorage` do browser

### Dashboard de Analytics
Acessível via `/admin/analytics` (requer papel `admin`). Exibe:
- Totais de visualizações, buscas, adições ao carrinho, pedidos e pagamentos
- Funil de conversão 5 etapas com taxa de queda por etapa
- Diagnóstico inteligente por produto (saudável / falta de exposição / indisponível / baixo desempenho)
- Top 10 buscas sem resultado (oportunidades de catálogo)

---

## 9. SEO e Dados Estruturados

### Páginas com Metadados
| Rota | Title Tag | Open Graph | JSON-LD |
|---|---|---|---|
| `/` | Padrão do Layout | ✅ Organização + Website | ✅ Organization + WebSite |
| `/catalogo` | Catálogo de Produtos | ✅ | — |
| `/produtos/[slug]` | Nome do produto | ✅ com imagem | ✅ Product + Offer |

### Sitemap e robots.txt
- **Sitemap dinâmico:** `/sitemap.xml` — inclui todas as rotas estáticas + produtos ativos
- **robots.txt:** `/robots.txt` — bloqueia `/admin/`, `/api/`, `/perfil`, `/checkout`, `/carrinho`
- **Canonical:** Definida via `metadataBase` no layout raiz
- **Google Site Verification:** Via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

---

## 10. Build de Produção e Deploy

```bash
# Verificação de tipos (sem emitir arquivos)
npx tsc --noEmit

# Build de produção
npm run build

# Iniciar servidor de produção (após build)
npm run start
```

### Checklist de Deploy
- [ ] Todas as variáveis de ambiente configuradas no servidor de produção
- [ ] Migrations aplicadas no banco remoto (verificar com `SELECT current_schema()`)
- [ ] Bucket `product-images` criado no Storage
- [ ] Webhook do Mercado Pago configurado com URL de produção + segredo HMAC
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio de produção (sem barra final)
- [ ] HTTPS habilitado (obrigatório para cookies SSR seguros)
- [ ] Google Search Console configurado e sitemap submetido
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` preenchido (após verificação do domínio)
- [ ] Token MP de produção (`APP_USR-...`) substituindo o Sandbox (`TEST-...`)

### Domínio e HTTPS
- Configure HTTPS no provedor de hospedagem (Vercel, Railway, etc.)
- O Next.js + Supabase SSR exige cookies `Secure` em produção
- Defina `NEXT_PUBLIC_APP_URL=https://kavuno.com.br` (sem barra final)

---

## 11. Backups e Recuperação

```bash
# Dump lógico pontual
npx supabase db dump -f backup_schema_$(Get-Date -Format "yyyyMMdd").sql

# O Supabase realiza backups automáticos diários do projeto
```

### Rollback de Migration
Caso uma migration precise ser revertida:
1. Crie um script SQL com o `DROP` das colunas/tabelas adicionadas
2. Execute no SQL Editor antes de reaplicar versões anteriores
3. As migrations são idempotentes (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`), facilitando reaplicação

---

## 12. Monitoramento e Observabilidade

- **Logs de aplicação:** `console.error()` em Server Actions e API Routes (visível nos logs do provedor de hospedagem)
- **Logs de webhook:** Tabela `payment_webhook_logs` com `processed`, `error_message` e `payload` completo
- **Histórico financeiro:** Tabela `financial_transactions` com `idempotency_key`, `accrual_date` e `cleared_at`
- **Telemetria:** Tabela `analytics_events` com diagnóstico em `/admin/analytics`

### Pendências de Configuração (requer ação do proprietário)
| Item | Ação Necessária |
|---|---|
| Credenciais de produção MP | Substituir token `TEST-...` por `APP_USR-...` |
| Webhook de produção | Registrar URL pública no painel MP Developers |
| Google Search Console | Verificar domínio e submeter sitemap |
| Bucket Storage | Criar `product-images` no projeto Supabase |
| Primeiro admin | Executar UPDATE em `profiles` após criar conta |
