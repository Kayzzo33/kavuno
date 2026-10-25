# Modelo de Banco de Dados e Políticas RLS (DATABASE.md)

Este documento documenta todas as tabelas, tipos enumerados, índices, triggers e políticas de segurança aplicadas no banco de dados PostgreSQL do **3D Commerce**.

---

## 1. Esquema Geral e Módulos

```text
  [Auth.Users]
       | (1:1)
  [Profiles] <----------- [Audit_Logs]
       |
       +--------------------+---------------------+
       | (1:N)              | (1:N)               | (1:N)
 [Customer_Addresses]    [Orders]        [Interest_Leads]
                            |
           +----------------+----------------+
           | (1:N)                           | (1:N)
      [Order_Items]                   [Payments] <--- [Payment_Webhook_Logs]
           |                                 |
           | (N:1)                           | (1:1)
     [Product_Variants]               [Financial_Transactions]
           |
     [Products] <--- [Product_Images]
           |
     [Categories]
           |
     [Campaigns] (Pré-venda e Validação)

  ================ CHÃO DE FÁBRICA & SUPRIMENTOS ================
  [Filament_Spools] <--- [Filament_Spool_Movements]
           |
  [Production_Orders] ---> [Print_Failures]
           |
  [Inventory_Movements] ---> [Inventory_Items]
```

---

## 2. Tipos Enumerados (Enums)

- `user_role`: `'customer'`, `'staff'`, `'admin'`.
- `commercial_mode`: `'in_stock'`, `'pre_order'`, `'interest_lead'`.
- `campaign_status`: `'draft'`, `'active'`, `'completed'`, `'cancelled'`.
- `order_status`: `'pending_payment'`, `'payment_approved'`, `'in_production'`, `'ready_for_dispatch'`, `'shipped'`, `'delivered'`, `'cancelled'`, `'refunded'`.
- `payment_status`: `'pending'`, `'in_process'`, `'approved'`, `'rejected'`, `'cancelled'`, `'refunded'`, `'charged_back'`.
- `payment_method`: `'pix'`, `'credit_card'`, `'bank_slip'`, `'other'`.
- `filament_material`: `'pla'`, `'petg'`, `'abs'`, `'asa'`, `'tpu'`, `'pc'`, `'nylon'`, `'other'`.
- `spool_status`: `'sealed'`, `'in_use'`, `'empty'`, `'discarded'`, `'lost'`.
- `production_status`: `'queued'`, `'slicing'`, `'printing'`, `'post_processing'`, `'quality_check'`, `'completed'`, `'failed'`.
- `inventory_movement_type`: `'purchase_in'`, `'sale_out'`, `'adjustment_in'`, `'adjustment_out'`, `'loss_discard'`, `'return_in'`.

---

## 3. Dicionário de Tabelas do Módulo Fundação

### 3.1. `public.profiles`
Armazena informações estendidas de perfil vinculadas ao `auth.users`.
- `id` (uuid, PK, references `auth.users.id` on delete cascade)
- `email` (text, not null)
- `full_name` (text)
- `cpf_cnpj` (varchar(18), unique)
- `phone` (varchar(20))
- `role` (`user_role`, not null, default `'customer'`)
- `marketing_consent` (boolean, default false)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 3.2. `public.customer_addresses`
Endereços de cobrança e envio de clientes.
- `id` (uuid, PK)
- `profile_id` (uuid, references `profiles.id`)
- `recipient_name` (text, not null)
- `street` (text, not null)
- `number` (varchar(20), not null)
- `complement` (text)
- `neighborhood` (text, not null)
- `city` (text, not null)
- `state` (varchar(2), not null)
- `postal_code` (varchar(9), not null)
- `is_default` (boolean, default false)
- `created_at` (timestamptz)

### 3.3. `public.categories`
Hierarquia de categorias e coleções.
- `id` (uuid, PK)
- `parent_id` (uuid, references `categories.id`)
- `name` (text, not null)
- `slug` (text, not null, unique)
- `description` (text)
- `image_url` (text)
- `display_order` (int, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### 3.4. `public.campaigns`
Campanhas de pré-venda paga ou validação de demanda.
- `id` (uuid, PK)
- `title` (text, not null)
- `slug` (text, not null, unique)
- `description` (text)
- `commercial_mode` (`commercial_mode`, not null)
- `status` (`campaign_status`, default `'draft'`)
- `target_min_units` (int, default 0)
- `max_units_limit` (int)
- `current_units_pledged` (int, default 0)
- `starts_at` (timestamptz)
- `ends_at` (timestamptz)
- `estimated_production_days` (int)
- `created_at` (timestamptz)

### 3.5. `public.products`
Catálogo de produtos base.
- `id` (uuid, PK)
- `category_id` (uuid, references `categories.id`)
- `campaign_id` (uuid, references `campaigns.id`)
- `name` (text, not null)
- `slug` (text, not null, unique)
- `short_description` (text)
- `full_description` (text)
- `commercial_mode` (`commercial_mode`, not null, default `'in_stock'`)
- `base_price` (numeric(12,2), not null, check >= 0)
- `promotional_price` (numeric(12,2), check < base_price)
- `is_active` (boolean, default false)
- `is_featured` (boolean, default false)
- `meta_title` (text)
- `meta_description` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.6. `public.product_variants`
Variantes físicas do produto (SKU, cor, material, tamanho, tempo estimado).
- `id` (uuid, PK)
- `product_id` (uuid, references `products.id` on delete cascade)
- `sku` (text, not null, unique)
- `variant_name` (text, not null)
- `filament_material` (`filament_material`, default `'pla'`)
- `color_name` (text, not null)
- `color_hex` (varchar(7))
- `price_adjustment` (numeric(12,2), default 0.00)
- `estimated_filament_weight_g` (numeric(10,2), not null, check >= 0)
- `estimated_print_time_minutes` (int, check >= 0)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### 3.7. `public.product_images`
Galeria de imagens do produto e suas variantes.
- `id` (uuid, PK)
- `product_id` (uuid, references `products.id` on delete cascade)
- `variant_id` (uuid, references `product_variants.id` on delete set null)
- `image_url` (text, not null)
- `alt_text` (text)
- `display_order` (int, default 0)
- `is_primary` (boolean, default false)

### 3.8. `public.interest_leads`
Captura de interesse/reserva gratuita para validação de demanda.
- `id` (uuid, PK)
- `product_id` (uuid, references `products.id`)
- `variant_id` (uuid, references `product_variants.id`)
- `campaign_id` (uuid, references `campaigns.id`)
- `full_name` (text, not null)
- `email` (text, not null)
- `whatsapp_phone` (varchar(20))
- `notes` (text)
- `ip_address` (inet)
- `created_at` (timestamptz, default now())

### 3.9. `public.audit_logs`
Trilha de auditoria para operações administrativas críticas.
- `id` (uuid, PK)
- `actor_profile_id` (uuid, references `profiles.id`)
- `action` (text, not null)
- `table_name` (text, not null)
- `record_id` (text, not null)
- `previous_data` (jsonb)
- `new_data` (jsonb)
- `ip_address` (inet)
- `created_at` (timestamptz, default now())

### 3.10. Módulo de Produção e Bobinas (B.6)
- `public.filament_spools`: Bobinas físicas com custo de aquisição, frete rateado e peso líquido.
- `public.filament_spool_movements`: Trilha auditável de consumo, pesagem e ajustes de filamento.
- `public.production_orders`: Ordens de fabricação com controle de quantidade planejada vs realizada e perdas.
- `public.production_order_spools`: Associação N:N entre ordens de produção e bobinas de filamento.
- `public.production_order_costs`: Detalhamento de custos estimados vs realizados.

### 3.11. Módulo Financeiro e Conciliação Auditável (B.7)
- `public.financial_settings`: Configurações de parâmetros (tarifa de energia kWh, mão de obra/h, markup alvo, taxas padrão).
- `public.expense_categories`: Categorias contábeis auditáveis com classificação DRE (`cost_of_goods`, `variable_expense`, `fixed_expense`, `labor_expense`, `capex_asset`, etc.).
- `public.financial_assets`: Cadastro de equipamentos e máquinas (impressoras 3D) com custo de aquisição, vida útil em horas e depreciação horária automática (impede rateio 100% integral em 1 peça).
- `public.financial_reconciliations`: Histórico de sessões de conciliação bancária / gateway.
- `public.financial_transactions`: Livro Razão de entradas, saídas, estornos e taxas com chaves determinísticas de idempotência (`idempotency_key UNIQUE`), competência (`accrual_date`) e liquidação (`cleared_at`).
- `public.accounts_payable`: Contas a pagar com data de vencimento, status e baixa vinculada ao livro razão.
- `public.accounts_receivable`: Contas a receber (repasse de gateway pendente com desconto de taxa).
- `public.product_cost_snapshots`: Histórico de apuração de CPV unitário (filamento, energia, depreciação, embalagem, mão de obra), preço de venda e margens, com alerta de ausência de telemetria.

---

## 4. Políticas de Segurança (Row Level Security - RLS)

### Princípio Zero Trust
Todas as tabelas possuem `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.

1. **Função Auxiliar de Permissão:**
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS boolean AS $$
     SELECT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role = 'admin'
     );
   $$ LANGUAGE sql SECURITY DEFINER STABLE;
   ```

2. **Perfis (`profiles`):**
   - Leitura: Usuário autenticado pode ler seu próprio perfil (`id = auth.uid()`) ou administradores (`is_admin()`).
   - Atualização: Usuário pode atualizar seus dados pessoais, mas **NÃO** pode alterar a coluna `role` (garantido por trigger defensivo).
   - Inserção: Criado via trigger atômico `on_auth_user_created` na criação do usuário no Supabase Auth.

3. **Catálogo Público (`products`, `categories`, `product_variants`, `product_images`, `campaigns`):**
   - Leitura: Pública (`anon` e `authenticated`) para registros onde `is_active = true` (ou `status = 'active'`). Administradores podem ler tudo, incluindo rascunhos.
   - Escrita (Insert, Update, Delete): Restrita exclusivamente a administradores (`is_admin()`).

4. **Reserva Gratuita de Interesse (`interest_leads`):**
   - Inserção: Aberta ao público (`anon` e `authenticated`) para permitir captação de leads.
   - Leitura/Modificação: Restrita a administradores.

5. **Auditoria (`audit_logs`):**
   - Leitura: Restrita a administradores.
   - Inserção: Restrita a processos internos ou triggers autorizados.
