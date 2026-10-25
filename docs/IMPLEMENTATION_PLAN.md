# Plano de Implementação (IMPLEMENTATION_PLAN.md)

Este plano traça o roteiro de entrega do projeto **3D Commerce**, dividindo o desenvolvimento em etapas lógicas, com dependências claras e critérios de conclusão rigorosos.

---

## Fase A — Fundação e Banco de Dados (Escopo Atual)

- [x] **Etapa A.1 — Documentação Canônica e Governança**
  - Criação de `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/DATABASE.md`, `docs/IMPLEMENTATION_PLAN.md` e `docs/OPERATIONS.md`.
  - Configuração do `.env.example`.
  - *Critério de Aceite:* Documentação aprovada e consistente com todos os requisitos de negócio.

- [x] **Etapa A.2 — Migrations da Fundação (Identidade, Catálogo e Validação)**
  - Criação dos Enums essenciais (`user_role`, `commercial_mode`, `campaign_status`, `filament_material`, etc.).
  - Criação de `profiles`, `customer_addresses`, `categories`, `campaigns`, `products`, `product_variants`, `product_images`, `interest_leads` e `audit_logs`.
  - Adição de chaves estrangeiras, restrições `CHECK`, índices de busca rápida (`slug`, `category_id`, `created_at`).
  - *Critério de Aceite:* Scripts SQL idempotentes criados em `supabase/migrations/` e revisáveis sem erros de sintaxe.

- [x] **Etapa A.3 — Políticas de Segurança (Row Level Security - RLS)**
  - Criação da função `public.is_admin()`.
  - Habilitação de RLS em todas as tabelas.
  - Políticas de leitura pública para catálogo ativo e restrição estrita de gravação administrativa.
  - Trigger para impedir auto-escalonamento de privilégios (`role`).
  - *Critério de Aceite:* Políticas RLS ativas em 100% das tabelas criadas.

- [x] **Etapa A.4 — Testes de Integridade e Scripts de Aplicação**
  - Criação de testes SQL (`supabase/tests/database_integrity_test.sql`) validando restrições, integridade e isolamento.
  - Instruções de aplicação manual e via Supabase CLI.
  - *Critério de Aceite:* Validação completa de sintaxe e regras de domínio.

---

## Fase B — Aplicação e Módulos Operacionais

- [x] **Etapa B.1 — Setup da Aplicação Next.js 15 (App Router & TypeScript)**
  - Inicialização do projeto Next.js 15 com App Router e TypeScript estrito.
  - Configuração de clientes Supabase separados para navegador (`client.ts`), servidor (`server.ts` com cookies) e rotas privilegiadas (`admin.ts`).
  - Definição da tipagem completa do banco em `src/types/database.types.ts`.
  - Implementação do Design System Geek + Street (`docs/DESIGN_SYSTEM.md`, `src/styles/design-tokens.css`, `src/app/globals.css`).
  - Criação dos componentes-base: `Button`, `Input`, `Badge`, `Card` (com cantoneiras técnicas interrompidas), `LoadingSpinner`, `Alert`, `Navbar` e `Footer`.
  - Página inicial conectada à contagem real do Supabase sem catálogo fictício.
  - Registro de decisões em `docs/DECISIONS.md`.
  - *Critério de Aceite:* Build e Typecheck validados; base pronta para a Etapa B.2.
- [x] **Etapa B.2 — Autenticação e Gestão de Usuários**
  - Integração completa com Supabase Auth via SSR (cookies HTTP-Only seguros, sem uso de `localStorage`).
  - Implementação de Server Actions (`signUpAction`, `signInAction`, `signOutAction`, `forgotPasswordAction`, `resetPasswordAction`, `updateProfileAction`).
  - Páginas públicas de autenticação: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`.
  - Rota de troca de código PKCE: `/auth/callback`.
  - Página protegida do cliente: `/perfil` com validação de sessão no servidor e edição de dados pessoais.
  - Navbar dinâmica com identificação de sessão ativa e link para o perfil.
  - Bloqueio contra auto-elevação de privilégios (`role`) em nível de aplicação e banco de dados.
  - Script de teste automatizado de segurança e RLS (`src/tests/auth_security_test.ts` e `npm run test:auth`).
  - Documentação do primeiro administrador em `docs/OPERATIONS.md` e ADR-005 em `docs/DECISIONS.md`.
  - *Critério de Aceite:* Build de produção aprovado, typecheck sem erros e testes de segurança passando.
- [x] **Etapa B.3 — Catálogo Público, SEO e Página de Validação/Reserva**
  - Implementação das consultas de catálogo paginado, filtros e busca em `src/lib/catalog/queries.ts`.
  - Página de Catálogo Paginado (`/catalogo`) com filtros de modalidade comercial, categoria, material e ordenação.
  - Componente de filtros reativo `ProductFilters` com sincronização na URL.
  - Página individual de produto (`/produtos/[slug]`) com metadados SEO dinâmicos (`generateMetadata`), OpenGraph e canonical.
  - Galeria de imagens `ProductGallery` com seleção de miniaturas e fallbacks técnicos.
  - Seletor de variantes `VariantSelector` com amostras de cor (`color_hex`), material, peso em gramas (`estimated_filament_weight_g`), tempo de impressão e cálculo de preço em tempo real.
  - Formulário de Reserva Gratuita de Interesse `InterestLeadForm` com Server Action `submitInterestLeadAction`, validação defensiva e persistência real em `public.interest_leads`.
  - Página de Campanhas e Validação de Demanda (`/validacao`) com metas de unidades e barras de progresso.
  - Home Page (`/`) atualizada com vitrine em tempo real conectada ao Supabase sem dados fictícios.
  - Testes automatizados da B.3 em `src/tests/catalog_lead_test.ts` e script `npm run test:catalog`.
  - *Critério de Aceite:* Build de produção Next.js 15 compilando todas as 11 rotas, typecheck sem erros e testes de integração com Supabase passando.
- [x] **Etapa B.4 — Painel Administrativo de Catálogo e Campanhas**
  - Rotas protegidas `/admin/*` via Middleware Next.js e validação server-side com `requireAdminSession()` e `is_admin()`.
  - Dashboard operacional (`/admin`) com métricas reais de produtos, categorias, campanhas e reservas.
  - Gestão completa de produtos (`/admin/produtos`), criação (`/admin/produtos/novo`) e edição (`/admin/produtos/[id]/editar`).
  - Gestão de variantes com atributos de impressão 3D (material, peso estimado em gramas, tempo e cor).
  - Gestão de imagens com suporte duplo a upload para o bucket `product-images` (Supabase Storage) e URL externa.
  - Gestão completa de categorias (`/admin/categorias`), criação (`/nova`) e edição (`/[id]/editar`).
  - Gestão de campanhas (`/admin/campanhas` e `/nova`) com controle de status e metas de unidades.
  - Consulta segura de manifestações de interesse (`/admin/leads`) com filtro por produto e dados protegidos contra anon.
  - Suite de testes automatizados de segurança administrativa (`src/tests/admin_security_test.ts` e `npm run test:admin`).
  - *Critério de Aceite:* Build de produção Next.js 15 compilando todas as 15 rotas da aplicação, typecheck estrito e linters sem erros.
- [x] **Etapa B.5 — Carrinho, Checkout e Integração Mercado Pago**
  - Modelagem transacional completa em `supabase/migrations/20261015000003_transactional_commerce.sql` (`orders`, `order_items`, `payments`, `coupons`, `inventory_items`, `inventory_movements`, `payment_webhook_logs`, `order_history`).
  - Contexto de carrinho persistente client-side com isolamento de `interest_lead` em `src/context/CartContext.tsx`.
  - Página de conferência do carrinho (`/carrinho`) com alteração de quantidades, exclusão e cálculo de frete por CEP.
  - Abstração e provedor determinístico de frete em `src/lib/shipping/provider.ts` (faixas de CEP do Brasil e Frete Grátis acima de R$ 250).
  - Validador autoritativo de cupons de desconto no servidor em `src/lib/checkout/coupons.ts` (percentual, valor fixo e frete grátis).
  - Reserva e baixa transacional de estoque físico para itens `in_stock` em `src/lib/checkout/inventory.ts`.
  - Checkout autoritativo via Server Action `processCheckoutAction` (`src/app/checkout/actions.ts`), snapshot imutável de itens, prevenção de pedidos duplicados via chave de idempotência e suporte a checkout com conta ou visitante.
  - Página de checkout (`/checkout`) com formulário completo e exibição de código Pix Copia e Cola.
  - Serviço seguro do Mercado Pago (`src/lib/payments/mercadopago.ts`) preparado para Pix/Cartão, com simulação em modo sandbox e chamada oficial quando credenciais forem fornecidas.
  - Route Handler de Webhook assinado (`/api/webhooks/mercadopago`) com idempotência, auditoria de logs e reconciliação automática de status de pagamento e pedido.
  - Suite de testes do motor transacional (`src/tests/checkout_payments_test.ts` e `npm run test:checkout`).
  - *Critério de Aceite:* Build de produção Next.js 15 compilando 17 rotas (incluindo rota de API), typecheck estrito e linters sem erros.
- [x] **Etapa B.6 — Módulo de Estoque e Chão de Fábrica**
  - Migration `20261015000004_production_and_spools.sql` (`filament_spools`, `filament_spool_movements`, `production_orders`, `production_order_spools`, `production_order_costs`).
  - Cadastro individual de bobinas com tara, peso bruto/líquido, custo por grama preciso (`numeric(12,4)`).
  - Ordens de fabricação integradas a variantes e pedidos, consumo real debitado de bobinas físicas e registro de refugos.
  - Painel administrativo de fábrica (`/admin/fabrica`, `/bobinas`, `/producao`).
  - *Critério de Aceite:* Rastreabilidade completa de consumo de filamento sem saldo negativo silencioso.
- [x] **Etapa B.7 — Módulo Financeiro, Custos e Conciliação Auditável**
  - Migration `20261015000005_finance_and_reconciliation.sql` (`financial_settings`, `expense_categories`, `financial_assets`, `financial_reconciliations`, `financial_transactions`, `accounts_payable`, `accounts_receivable`, `product_cost_snapshots`).
  - Segregação rigorosa de regime de competência vs liquidação de caixa: Venda criada != Recebimento liquidado.
  - Pagamentos aprovados com dedução de taxa de gateway (`gross_amount - fee_amount = net_amount`).
  - Reserva Gratuita de Interesse (`interest_lead`) com ZERO receita e sem impacto fiscal/contábil.
  - Ativos e Máquinas (impressoras 3D): Tratamento como CAPEX imobilizado com taxa de depreciação horária automática (`custo / vida_util_horas`). Proibido ratear integralmente na primeira peça!
  - Custo unitário de produção (CPV) detalhado: filamento, energia elétrica (kWh), depreciação de máquina, embalagem e mão de obra.
  - Alerta de ausência de parâmetros / telemetria (`is_telemetry_missing = true`) com configuração em runtime sem inventar números.
  - Conciliação idempotente de pagamentos do Mercado Pago (`idempotency_key UNIQUE`), despesas de bobinas e reembolsos/estornos.
  - Cálculo de frete subsidiado absorvido pela loja (`max(0, carrier - customer)`).
  - Demonstração do Resultado do Exercício (DRE Gerencial) e Fluxo de Caixa Real vs Projetado.
  - Painel administrativo financeiro (`/admin/financeiro`) com 5 abas operacionais e design Geek + Street.
  - Suite de testes automatizados (`src/tests/financial_module_test.ts` e `npm run test:finance`) com 11/11 testes passando.
  - *Critério de Aceite:* Build de produção Next.js 15 compilando todas as 20 rotas da aplicação, typecheck estrito (tsc) sem erros e 100% dos testes financeiros aprovados.
- [x] **Etapa B.8 — Analytics, Qualidade, SEO e Deploy**
  - Migration `20261015000006_analytics_and_observability.sql`: Tabela `analytics_events` particionável, índices otimizados, e função `log_analytics_event` com validação defensiva contra PII (e-mail, CPF, telefone, cartão).
  - Telemetria LGPD-compliant no client e server (`src/lib/analytics/tracker.ts`, `CampaignBannerTracker.tsx`, `CookieConsentBanner.tsx`) com controle de consentimento, hash anônimo e sanitização de dados.
  - Cobertura completa de eventos: visualizações de produto, buscas, filtros, seleção de variantes, banners de campanha (view/click), adições/remoções do carrinho, início de checkout, cupom aplicado, pedidos criados, leads de reserva e confirmação de pagamento.
  - Painel Administrativo de Analytics (`/admin/analytics`): Funil de conversão de 5 etapas, taxas de drop-off, diagnóstico de desempenho de produtos e oportunidades de catálogo (buscas sem resultado).
  - SEO Completo: `sitemap.ts` dinâmico com produtos ativos, `robots.ts` com proteção de rotas privadas, JSON-LD Schema.org Product com ofertas dinâmicas, metadados OpenGraph/Twitter e `generateStaticParams` para SSG/ISR.
  - Documentação para Portfólio Profissional: `README.md` estruturado com declaração explícita de Direitos Autorais (Lei nº 9.610/1998) e proteção de autoria exclusiva por Kayky, além de `docs/OPERATIONS.md` completo com checklist de deploy e operações.
  - Suíte de testes automatizados (`src/tests/analytics_seo_test.ts` e `npm run test:analytics`) com 21/21 testes aprovados.
  - *Critério de Aceite:* Typecheck 100% limpo (`npx tsc --noEmit`), todas as 21 rotas compilando perfeitamente e cobertura completa dos critérios da B.8.
- [x] **Etapa B.9 — Auditoria Abrangente de Segurança, Privacidade, Conformidade Legal e SEO**
  - Inspeção rigorosa de código, migrations, dependências (`package.json`), fluxos de autenticação, checkout, reservas e telemetria.
  - Elaboração de 5 documentos canônicos de governança e diagnóstico técnico:
    - `docs/COMPLIANCE_AUDIT.md`: Relatório executivo de conformidade, classificação de riscos (ACH-01 a ACH-10) e critérios de bloqueio pré-lançamento.
    - `docs/PRIVACY_DATA_MAP.md`: Mapeamento de todos os 7 fluxos de dados pessoais sob a LGPD (bases legais, armazenamento, prazos de retenção e matriz do Art. 18).
    - `docs/THIRD_PARTY_SERVICES.md`: Inventário exaustivo de terceiros (Supabase, Mercado Pago, Google Search Console), cookies (Zero terceiros) e confirmação de fontes locais (Zero Google Fonts).
    - `docs/LEGAL_OPEN_QUESTIONS.md`: Decisões mandatórias do proprietário (CNPJ/CPF, DPO, SAC, CDC Art. 49 e direitos autorais de STL/modelos 3D).
    - `docs/SEO_AUDIT.md`: Auditoria de metatags dinâmicas, sitemap XML, robots.txt, JSON-LD Schema.org (`Organization`, `WebSite`, `Product`) e performance CWV.
  - Correção cirúrgica de inconsistência de schema em `analytics_events` (inserção correta de `entity_type: 'order'` e `entity_id` no checkout e webhook).
  - *Critério de Aceite:* Mapa completo e verificável de riscos sem declaração precipitada de conformidade jurídica definitiva, com plano estruturado para a Etapa B.10.
- [ ] **Etapa B.10 — Implementação das Correções de Conformidade, Políticas e Publicação**
  - Criação das páginas institucionais de Termos de Uso, Política de Privacidade e Trocas/Devoluções.
  - Atualização do rodapé com campos do fornecedor e canal de privacidade para titulares de dados.
  - Implementação das recomendações priorizadas da auditoria B.9 e preparação final para homologação e publicação.
