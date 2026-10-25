# Mapeamento de Dados Pessoais e Fluxos de Tratamento (PRIVACY_DATA_MAP.md)

> **Documento Canônico de Governança de Dados Pessoais (LGPD — Lei nº 13.709/2018)**  
> **Sistema:** KAVUNO 3D Commerce  
> **Versão:** 1.0 (Etapa B.9)

---

## 1. Princípios de Governança e Papéis (LGPD Art. 5º e 6º)

- **Controlador dos Dados:** A pessoa física ou jurídica proprietária do e-commerce KAVUNO (*a ser formalizada com CNPJ/CPF pelo proprietário*).
- **Operadores de Dados:** 
  - **Supabase Inc.:** Infraestrutura de banco de dados PostgreSQL gerenciado, autenticação e armazenamento de imagens.
  - **Mercado Pago Instituição de Pagamento LTDA:** Gateway de pagamentos e processamento de transações Pix e Cartão de Crédito.
  - **Vercel Inc. / Provedor de Hospedagem:** Execução das Server Actions e rotas de API do Next.js.
- **Encarregado pelo Tratamento de Dados Pessoais (DPO):** Canal formal a ser definido para comunicação com os titulares de dados e com a Autoridade Nacional de Proteção de Dados (ANPD).

---

## 2. Inventário de Fluxos de Dados Pessoais

### Fluxo 1: Cadastro, Login e Autenticação de Usuários
- **Dados Coletados:** E-mail, hash de senha criptografada (gerenciada internamente pelo Supabase Auth), nome completo (`full_name`), flag de consentimento para marketing (`marketing_consent`).
- **Finalidade:** Identificação individual do usuário, controle de acesso a pedidos e segurança da sessão.
- **Armazenamento:** `auth.users` (schema protegido do Supabase) e `public.profiles`.
- **Acesso:** Próprio usuário autenticado e administradores via RLS (`is_admin()`).
- **Compartilhamento com Terceiros:** Apenas com o operador de infraestrutura (Supabase).
- **Base Legal Sugerida (LGPD):** Execução de contrato ou de procedimentos preliminares (Art. 7º, V) para criação da conta; Consentimento (Art. 7º, I) para marketing opcional.
- **Período de Retenção:** Enquanto a conta estiver ativa ou até solicitação expressa de eliminação pelo titular (respeitado prazo de guarda do Marco Civil da Internet).

---

### Fluxo 2: Perfil do Cliente e Endereços Cadastrados
- **Dados Coletados:** Nome do destinatário (`recipient_name`), logradouro, número, complemento, bairro, cidade, estado, CEP (`postal_code`), telefone (`phone`), CPF/CNPJ opcional (`cpf_cnpj`).
- **Finalidade:** Faturamento fiscal, entrega de encomendas físicas e contato pós-venda.
- **Armazenamento:** `public.customer_addresses` e `public.profiles`.
- **Acesso:** Próprio usuário (`profile_id = auth.uid()`) e administradores.
- **Compartilhamento com Terceiros:** Transportadoras / Correios no momento do despacho da encomenda.
- **Base Legal Sugerida:** Execução de contrato de compra e venda (Art. 7º, V) e Cumprimento de obrigação legal/fiscal (Art. 7º, II - emissão de nota fiscal quando aplicável).
- **Período de Retenção:** 5 anos contados do exercício fiscal subsequente (Código Tributário Nacional e Código Civil).

---

### Fluxo 3: Reserva Gratuita de Interesse (Validação de Mercado)
- **Dados Coletados:** Nome completo (`full_name`), e-mail (`email`), WhatsApp opcional (`whatsapp_phone`), observações opcionais (`notes`), endereço IP do envio (`ip_address`).
- **Finalidade:** Comunicação ao interessado sobre a liberação do lote de produção do produto desejado e controle de fraude/spam por IP.
- **Armazenamento:** `public.interest_leads`.
- **Acesso:** Exclusivo para administradores (`public.is_admin() = true`).
- **Compartilhamento com Terceiros:** Nenhum.
- **Base Legal Sugerida:** Consentimento explícito do titular (Art. 7º, I) e Legítimo Interesse para combate a fraudes no registro de IP (Art. 7º, IX).
- **Período de Retenção:** Até o encerramento da campanha de validação ou mediante revogação de consentimento pelo interessado.

---

### Fluxo 4: Checkout e Realização de Pedidos
- **Dados Coletados:** 
  - Com login: vinculação com `profile_id`.
  - Como visitante: `guest_name`, `guest_email`, `guest_phone`, endereço de entrega completo.
  - Dados do pedido: itens adquiridos, valores, modalidade comercial, transportadora e chave de idempotência.
- **Finalidade:** Processamento do pedido comercial, cálculo de frete, separação, impressão e entrega da peça 3D.
- **Armazenamento:** `public.orders`, `public.order_items`, `public.order_history`.
- **Acesso:** Comprador (via sessão) e administradores da loja.
- **Compartilhamento com Terceiros:** Gateway de pagamento (Mercado Pago) e transportadora responsável pelo frete.
- **Base Legal Sugerida:** Execução de contrato (Art. 7º, V) e Defesa de direitos em processo administrativo ou judicial (Art. 7º, VI).
- **Período de Retenção:** 5 anos a contar da entrega (prescrição de obrigações de consumo - CDC Art. 27).

---

### Fluxo 5: Processamento de Pagamento e Cobrança
- **Dados Coletados:** Identificador externo do pagamento, status da transação, valor bruto, taxa cobrada, valor líquido recebido, QR Code Pix ou URL de checkout do Mercado Pago.
- **Dados NÃO Coletados:** O KAVUNO **NUNCA** armazena número de cartão de crédito, data de validade ou código de segurança (CVV). A transação de cartão ocorre em ambiente externo tokenizado do Mercado Pago.
- **Armazenamento:** `public.payments`, `public.financial_transactions`, `public.payment_webhook_logs`.
- **Acesso:** Exclusivo a administradores e ao webhook autenticado do Mercado Pago.
- **Compartilhamento com Terceiros:** Mercado Pago Instituição de Pagamento LTDA.
- **Base Legal Sugerida:** Execução de contrato (Art. 7º, V) e Cumprimento de obrigação legal e regulatória (Art. 7º, II).
- **Período de Retenção:** 5 anos (auditoria fiscal e conciliação financeira).

---

### Fluxo 6: Telemetria, Analytics e Navegação
- **Dados Coletados:** `session_id` anônimo (`anon_<timestamp>_<random>`), tipo de evento (`product_view`, `search`, `cart_add`, etc.), identificador de entidade (`entity_id`), metadados de contexto (ex: termo de busca, valor numérico do produto), `user_agent` resumido (máx 250 caracteres).
- **Garantia de Zero-PII:** Filtro de sanitização no cliente (`sanitizeAnalyticsMetadata`) e guarda defensiva no PostgreSQL que descarta chaves sensíveis (`email`, `cpf`, `phone`, `password`, `card`).
- **Armazenamento:** `public.analytics_events`.
- **Acesso:** Exclusivo a administradores autorizados para análise do funil de conversão.
- **Compartilhamento com Terceiros:** Zero compartilhamento externo (não utiliza Google Analytics, Meta Pixel ou serviços de terceiros).
- **Base Legal Sugerida:** Legítimo Interesse do Controlador (Art. 7º, IX) sob dados anonimizados/pseudonimizados ou Consentimento via banner de cookies (Art. 7º, I).
- **Período de Retenção:** Recomendado 90 a 180 dias para análise agregada de mercado.

---

### Fluxo 7: Trilha de Auditoria e Logs Técnicos
- **Dados Coletados:** `audit_logs` (alterações cadastrais por administradores: `actor_profile_id`, ação, tabela, dados anteriores/novos em JSONB, IP) e logs de servidor do Next.js.
- **Finalidade:** Rastreabilidade de ações administrativas, diagnóstico de falhas e auditoria de segurança.
- **Armazenamento:** `public.audit_logs`.
- **Acesso:** Administradores.
- **Base Legal:** Legítimo interesse e segurança da informação (Art. 7º, IX e Art. 46 da LGPD; Marco Civil da Internet Art. 15).
- **Período de Retenção:** 6 meses para logs de conexão (Marco Civil da Internet) e 2 anos para auditoria administrativa.

---

## 3. Matriz de Direitos dos Titulares (LGPD Art. 18)

| Direito do Titular | Status no KAVUNO | Procedimento Operacional / Técnico |
|---|---|---|
| **Confirmação e Acesso** | ✅ Disponível | O cliente autenticado visualiza seus dados cadastrais em `/perfil` e pedidos vinculados. |
| **Correção de Dados** | ✅ Disponível | Atualização de nome, telefone e consentimento diretamente em `/perfil`. |
| **Anonimização / Bloqueio** | ⚠️ Parcial | Realizável administrativamente via SQL Editor no Supabase pelo administrador. |
| **Eliminação de Dados** | ⚠️ Requer Fluxo Formal | Contas podem ser excluídas mediante solicitação por e-mail de suporte. Pedidos fiscais passados são mantidos por obrigação legal. |
| **Revogação do Consentimento** | ✅ Disponível | Desmarcação do checkbox de marketing em `/perfil` e opção "Apenas Essenciais" no banner de cookies. |
| **Portabilidade** | ⚠️ Manual | Exportação manual de cadastro via JSON mediante solicitação formal. |

---

## 4. Medidas Técnicas de Segurança Aplicadas (LGPD Art. 46)

1. **Criptografia em Trânsito:** Protocolo HTTPS com TLS 1.3 em todas as comunicações de navegador e APIs.
2. **Criptografia em Repouso:** Dados protegidos por criptografia gerenciada do Supabase (AES-256 no Postgres e S3 Storage).
3. **Isolamento Lógico:** Políticas de Row Level Security (RLS) impedindo que qualquer usuário visualize dados cadastrais, pedidos ou transações de terceiros.
4. **Proteção contra Injeção de Privilégios:** Trigger `prevent_self_role_escalation` impede que requisições forjem alteração de privilégio para administrador.
5. **Autenticação Segura:** Sessões com cookies HTTP-Only, `SameSite=Lax`, e mitigação de vulnerabilidades XSS e CSRF.
