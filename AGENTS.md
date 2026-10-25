# Guia do Agente de IA (AGENTS.md)

Este documento estabelece as diretrizes permanentes de arquitetura, governança, segurança e padrões de código para o projeto **3D Commerce (E-commerce Profissional de Impressão 3D)**. Qualquer sessão ou agente de IA que atue neste repositório deve obrigatoriamente seguir estas regras.

---

## 1. Princípios Fundamentais

1. **Aplicação Real e de Produção:**
   - Não crie código "mock", descartável ou simplificações frágeis para demonstrar funcionalidade.
   - Todo fluxo de negócio deve ter persistência no banco, validações defensivas, tratamento de exceções e rastreabilidade.
2. **Separação Rígida de Modalidades Comerciais:**
   - **Pronta Entrega:** Baixa imediata de estoque físico acabado.
   - **Pré-venda Paga:** Criação de pedido futuro pago, com prazos claros de lote/produção e meta mínima opcional.
   - **Reserva Gratuita de Interesse:** Captação de demanda pura. **NUNCA** gera receita, cobrança, pedido formal nem reserva de estoque.
3. **Cálculos Financeiros e Monetários:**
   - Sempre utilize tipos `numeric` ou `decimal` com escala adequada (ex: `numeric(12,2)` para moeda e `numeric(12,4)` para gramatura/custo por grama). **PROIBIDO usar float/double** para valores financeiros ou pesos de controle de custo.
4. **Segurança e Privilégios (Zero Trust):**
   - Supabase Row Level Security (RLS) deve estar habilitado em todas as tabelas públicas.
   - A autorização administrativa é validada via função segura no Postgres (`is_admin()`) e no server-side (Next.js Server Actions / Route Handlers).
   - NUNCA exponha a `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em variáveis prefixadas com `NEXT_PUBLIC_`.
5. **Rastreabilidade de Produção e Estoque:**
   - Toda alteração de estoque físico ou saldo de bobina deve ser registrada em tabelas de histórico de movimentação (`inventory_movements`, `filament_spool_movements`). Não faça updates silenciosos em saldos sem registro de auditoria e motivo.
6. **Integrações de Pagamento e Idempotência:**
   - NUNCA aprove pagamentos baseando-se apenas em redirects de retorno do navegador (`return_url`). A aprovação só ocorre via validação de webhook assinado do provedor (Mercado Pago).
   - Registre todas as tentativas e notificações com chaves de idempotência.

---

## 2. Estrutura do Repositório

```text
├── .env.example                  # Template seguro de variáveis de ambiente
├── AGENTS.md                     # Diretrizes permanentes para agentes
├── docs/                         # Documentação técnica e operacional
│   ├── ARCHITECTURE.md           # Visão geral de arquitetura e tecnologia
│   ├── DATABASE.md               # Modelo relacional, índices e RLS
│   ├── DOMAIN_RULES.md           # Regras de negócio canônicas
│   ├── IMPLEMENTATION_PLAN.md    # Roadmap de entrega e critérios de aceite
│   └── OPERATIONS.md             # Guia de execução, deploy e migrações
├── supabase/
│   ├── config.toml               # Configuração do Supabase CLI
│   ├── migrations/               # Migrations SQL versionadas cronologicamente
│   ├── seeds/                    # Dados de inicialização dev/demo seguros
│   └── tests/                    # Testes SQL e de segurança (pgTAP / scripts)
└── src/                          # Código da aplicação Next.js (Fase B)
    ├── app/                      # App Router (páginas e rotas de API)
    ├── components/               # Componentes UI reutilizáveis
    ├── lib/                      # Utilitários, clientes de banco e serviços
    └── types/                    # Definições TypeScript compartilhadas
```

---

## 3. Padrões de Migrations e Banco de Dados

1. **Versionamento:**
   - Formato de arquivo: `YYYYMMDDHHMMSS_descricao_concisa.sql`.
   - As migrações devem ser idempotentes sempre que viável (`CREATE TABLE IF NOT EXISTS`, checagens de existência de types/triggers).
2. **Tratamento de Dados e Triggers:**
   - Sempre utilize triggers com `SECURITY DEFINER` e `SET search_path = public` ao manipular perfis ou tabelas de sistema para evitar ataques de injeção de schema.
3. **Soft Deletes vs Status Explícito:**
   - Prefira máquinas de estado com colunas `status` em vez de deleções físicas para pedidos, pagamentos, bobinas e ordens de produção.

---

## 4. Instruções de Continuidade para Novas Sessões

- Antes de criar ou modificar tabelas, consulte `docs/DATABASE.md` e `docs/DOMAIN_RULES.md`.
- Atualize a documentação sempre que adicionar novas tabelas, enums, regras de negócio ou fluxos de integração.
- Antes de declarar uma tarefa concluída, execute validações de integridade e informe explicitamente o que foi aplicado e o que requer ação do usuário.
