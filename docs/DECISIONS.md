# Registro de Decisões de Arquitetura (DECISIONS.md)

Este documento registra formalmente as decisões técnicas, escolhas de design e trade-offs adotados no projeto **3D Commerce**.

---

## [ADR-001] Stack da Aplicação Web e SSR
- **Data:** 2026-10-15
- **Status:** Aprovado
- **Contexto:** Necessidade de construir uma plataforma de e-commerce com alta performance em dispositivos móveis, excelente indexação orgânica (SEO) para catálogo de produtos e isolamento rigoroso de regras de negócio financeiras e dados sensíveis.
- **Decisão:** Adotar **Next.js 15 com App Router e TypeScript estrito**.
- **Consequências:**
  - Suporte nativo a Server Components para leitura direta do banco via Supabase sem expor dados no cliente.
  - Server Actions para validações de formulário, cupons e transações com Mercado Pago, eliminando o risco de adulteração de preços pelo navegador.
  - Tipagem estática fim a fim compartilhada com as tabelas do PostgreSQL.

---

## [ADR-002] Clientes Supabase com Separação Browser vs Servidor
- **Data:** 2026-10-15
- **Status:** Aprovado
- **Contexto:** Garantir o princípio Zero Trust sem risco de vazamento de credenciais privilegiadas ou de sessões inconsistentes.
- **Decisão:** Separar a inicialização do cliente em três módulos especializados em `src/lib/supabase/`:
  1. `client.ts`: Utiliza `createBrowserClient` do pacote `@supabase/ssr` e somente chaves públicas (`NEXT_PUBLIC_`).
  2. `server.ts`: Utiliza `createServerClient` com `cookies()` assíncronos do Next.js 15, garantindo leitura e gravação segura de tokens JWT em cookies HTTP-Only.
  3. `admin.ts`: Utiliza `SUPABASE_SERVICE_ROLE_KEY` isolada estritamente no backend para webhooks de pagamento e conciliação.
- **Consequências:** Bloqueio contra injeção de credenciais de serviço no frontend. Toda consulta do cliente respeita o Row Level Security (RLS) do PostgreSQL.

---

## [ADR-003] Identidade Visual: Geek + Street Utilitária com Bordas Interrompidas
- **Data:** 2026-10-15
- **Status:** Aprovado
- **Contexto:** O projeto precisa de uma identidade marcante, comercial e reconhecível para entusiastas e clientes corporativos de impressão 3D, evitando a estética genérica de IA (gradientes roxos, sombras excessivas e neons decorativos).
- **Decisão:**
  - Adoção de paleta sóbria (canvas grafite escuro `#0A0C0F`, superfícies industriais e acento em Laranja Mecânico `#FF5C00`).
  - Uso de tipografia monoespaçada técnica para SKUs, gramaturas e métricas (`JetBrains Mono`).
  - Implementação do padrão de **Bordas Técnicas Interrompidas (*Corner Brackets*)** através de pseudoelementos CSS puros (`::before`/`::after`), remetendo a marcações cartesianas e gabaritos de manufatura aditiva.
- **Consequências:** Interface rápida, sem overhead de bibliotecas pesadas de CSS, com excelente pontuação de acessibilidade e visual autêntico.

---

## [ADR-004] Separação Rígida das Três Modalidades Comerciais
- **Data:** 2026-10-15
- **Status:** Aprovado
- **Contexto:** O proprietário ainda não possui impressora 3D e precisa validar o interesse antes de adquirir maquinário e estoque de filamento.
- **Decisão:** Distinção de três estados comerciais no schema e nos componentes (`Badge`, `Card`):
  1. `in_stock`: Pronta entrega com estoque físico acabado.
  2. `pre_order`: Pré-venda paga com meta mínima de unidades e produção futura.
  3. `interest_lead`: Reserva gratuita de interesse que capta demanda pura sem gerar receita ou pedido.
- **Consequências:** Integridade contábil garantida e viabilidade de validação de mercado antes do investimento em ativos físicos.

---

## [ADR-005] Autenticação SSR e Proteção contra Autoelevação de Privilégios
- **Data:** 2026-10-15
- **Status:** Aprovado
- **Contexto:** Necessidade de autenticação compatível com SSR sem armazenamento de tokens sensíveis em `localStorage`, evitando ataques XSS e manipulação da coluna `role`.
- **Decisão:**
  - Gerenciamento de sessões exclusivo por cookies HTTP-Only através do pacote `@supabase/ssr` e Middleware Next.js.
  - Implementação de Server Actions (`signUpAction`, `signInAction`, `signOutAction`, `forgotPasswordAction`, `resetPasswordAction`, `updateProfileAction`).
  - A rota protegida `/perfil` valida a sessão no servidor via `await supabase.auth.getUser()`, sem confiar apenas no estado do cliente.
  - Na ação `updateProfileAction`, a coluna `role` é estritamente omitida da query de update, reforçando a proteção em nível de aplicação somada ao trigger de banco `prevent_self_role_escalation`.
- **Consequências:** Conformidade com o princípio Zero Trust, sessões renovadas transparentemente e bloqueio contra tentativas de auto-promoção a `admin`.

---

## [ADR-006] Catálogo Paginado, Seleção de Variantes e Reserva Gratuita de Interesse
- **Data:** 2026-10-15
- **Status:** Aprovado
- **Contexto:** Necessidade de permitir a navegação pública pelo catálogo de impressão 3D, com filtros por modalidade, categoria e material de filamento, e viabilizar a manifestação de interesse em novos produtos sem gerar receita ou cobrança indevida.
- **Decisão:**
  - Consulta paginada direta no servidor via PostgREST/Supabase (`getCatalogProducts`), respeitando RLS (`is_active = true`).
  - Sincronização dos filtros (pesquisa, categoria, modalidade comercial e ordenação) via parâmetros de busca na URL (`searchParams`), mantendo URLs compartilháveis e indexáveis por motores de busca.
  - Exibição transparente de especificações de manufatura aditiva (material, gramatura estimada em gramas e tempo de máquina).
  - Formulário de Reserva Gratuita de Interesse processado exclusivamente via Server Action (`submitInterestLeadAction`), com validação de dados no backend, proteção contra envios duplicados e inserção na tabela `public.interest_leads`.
- **Consequências:** Experiência de compra e reserva sem atritos, garantia de isolamento contábil (reserva de interesse não polui dados financeiros) e indexação SEO otimizada com metadados dinâmicos por slug.

---

## [ADR-007] Motor Transacional, Checkout Autoritativo e Integração com Mercado Pago
- **Data:** 2026-10-15
- **Status:** Aprovado
- **Contexto:** Necessidade de viabilizar a compra de itens a pronta entrega e pré-venda com cálculo autoritativo no servidor, snapshots imutáveis de preços/nomes, reserva de estoque, cupons de desconto, frete determinístico e integração com o Mercado Pago preparada para operar em modo sandbox/produção.
- **Decisão:**
  - Modelagem relacional estrita com separação entre `orders`, `order_items` (com snapshots de preço, SKU e nome), `payments`, `coupons`, `inventory_items`, `inventory_movements`, `payment_webhook_logs` e `order_history`.
  - Produtos em `interest_lead` são expressamente impedidos de entrar no fluxo de compra ou carrinho (mantendo a separação rígida de modalidades comerciais).
  - Prevenção de pedidos duplicados via chave de idempotência (`idempotency_key`).
  - Provedor de frete baseado em abstração desacoplada, calculando prazos e custos por faixas de CEP com frete grátis automático acima de R$ 250,00.
  - Serviço seguro `MercadoPagoService` com geração de intenção Pix/Cartão, preparado para conectar à API oficial assim que o token for informado, operando de forma determinística e testável na ausência de credenciais externas.
  - Reconciliação de pagamentos estritamente via Webhook oficial assinado (`/api/webhooks/mercadopago`), nunca confiando apenas no retorno do navegador.
- **Consequências:** Garantia de integridade contábil, proteção contra fraudes e adulterações de preço no cliente, e arquitetura pronta para ativação imediata das credenciais de produção do Mercado Pago.

---

## [ADR-008] Módulo Financeiro Auditável, Segregação de CAPEX e Conciliação Idempotente (B.7)
- **Data:** 2026-10-17
- **Status:** Aprovado
- **Contexto:** Necessidade de controlar entradas, saídas, fluxo de caixa, contas a pagar e receber, CPV unitário real vs estimado e conciliação bancária/gateway com governança contábil rigorosa para manufatura aditiva.
- **Decisão:**
  - Segregação estrita entre regime de competência (`accrual_date`) e regime de caixa liquidado (`cleared_at`): vendas provisionadas não alteram o saldo disponível em banco até a efetiva liquidação.
  - Pagamentos aprovados pelo gateway têm suas taxas deduzidas antes da liquidação em caixa (`net_amount = gross_amount - fee_amount`).
  - Aquisição de impressoras 3D e maquinário é classificada como Ativo Imobilizado (`financial_assets` / `capex_asset`), com depreciação horária automática (`purchase_cost / useful_life_hours`), proibindo o rateio ingênuo integral em peças individuais.
  - Chaves determinísticas de idempotência (`idempotency_key UNIQUE`) em todas as movimentações financeiras para prevenir dupla contagem em conciliações ou retentativas de webhooks.
  - Alerta transparente de ausência de parâmetros de telemetria (`is_telemetry_missing = true`), permitindo parametrizar tarifas de energia elétrica (kWh) e custos de mão de obra em runtime sem inventar números arbitrários.
  - Isolamento contábil absoluto: manifestações de interesse (`interest_lead`) geram R$ 0,00 de receita e zero lançamentos no livro razão.
  - RLS Zero Trust restringe 100% dos dados financeiros exclusivamente a administradores (`is_admin()`).
- **Consequências:** Auditoria fiscal e gerencial confiável, DRE e Fluxo de Caixa fidedignos, cálculo preciso de margens de contribuição e proteção contra erros contábeis na produção 3D.

