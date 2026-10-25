# Operações e Procedimentos (OPERATIONS.md)

Este documento descreve os procedimentos operacionais para desenvolvedores e administradores gerenciarem o ambiente, banco de dados, migrações e deploys do **3D Commerce**.

---

## 1. Configuração do Ambiente e Variáveis

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Preencha as credenciais do seu projeto Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<PROJECT_REF>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anônima pública
   - `SUPABASE_SERVICE_ROLE_KEY`: chave administrativa privada (apenas para backend/scripts)

---

## 2. Aplicação de Migrations no Supabase

Existem duas formas seguras de aplicar as migrações:

### Método 1: Manualmente via Painel Web (SQL Editor do Supabase) - RECOMENDADO INICIALMENTE
Como o banco remoto está vazio e a CLI pode exigir login por token web interativo:
1. Acesse o dashboard do seu projeto no Supabase: [https://supabase.com/dashboard/project/ajjogujfpmasamzejluo/sql](https://supabase.com/dashboard/project/ajjogujfpmasamzejluo/sql)
2. Abra a aba **SQL Editor** -> **New query**.
3. Copie e cole na ordem exata o conteúdo dos arquivos localizados em `supabase/migrations/`:
   - `20261015000001_foundation_schema.sql` (Estrutura de tabelas, enums, índices e triggers)
   - `20261015000002_foundation_rls_security.sql` (Políticas de segurança Row Level Security)
4. Clique em **Run** e verifique a mensagem de sucesso `Success. No rows returned`.
5. Em seguida, para validar a integridade, execute o script de teste:
   - `supabase/tests/database_integrity_test.sql`

### Método 2: Via Supabase CLI (quando autenticada)
1. Vincular o projeto local ao projeto remoto:
   ```bash
   npx supabase link --project-ref ajjogujfpmasamzejluo
   ```
2. Aplicar as migrações pendentes:
   ```bash
   npx supabase db push
   ```

---

## 3. Procedimento de Primeiro Usuário Administrador

Após a criação do primeiro usuário através da aplicação (`/cadastro`) ou pelo painel do Supabase Auth:
1. No SQL Editor do Supabase, promova o usuário com seu endereço de e-mail (a trigger defensiva permite updates via SQL direto no console/service_role):
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'seu_email@exemplo.com';
   ```
2. Verifique a alteração:
   ```sql
   SELECT id, email, role FROM public.profiles WHERE email = 'seu_email@exemplo.com';
   ```
3. A partir deste momento, ao navegar para `/perfil`, o usuário verá a flag `[PAPEL ADMINISTRATIVO]` e terá permissões para gerenciar catálogo e campanhas na Fase B.4.

---

## 4. Fluxos de Autenticação e Configuração de E-mail

- **Cadastro (`/cadastro`):** Utiliza `supabase.auth.signUp()`. O trigger atômico `on_auth_user_created` cria a linha correspondente em `public.profiles`.
- **Confirmação de E-mail:** Se `mailer_autoconfirm` estiver desligado no Supabase Auth, o usuário recebe um e-mail com link de confirmação direcionado para `/auth/callback`.
- **Recuperação de Senha (`/recuperar-senha`):** Dispara `resetPasswordForEmail()` redirecionando para `/auth/callback?next=/redefinir-senha`.
- **Sessões SSR:** Armazenadas exclusivamente em cookies HTTP-Only via middleware e `@supabase/ssr`, sem uso de `localStorage` para tokens sensíveis.

---

## 5. Testes Automatizados da Aplicação

### 5.1. Testes de Segurança e Autenticação (B.2)
Valida login inválido, isolamento de perfis e bloqueio de autoelevação:
```bash
npm run test:auth
```

### 5.2. Testes de Catálogo e Reserva Gratuita de Interesse (B.3)
Valida consulta pública de categorias e produtos ativos, e persistência real em `interest_leads`:
```bash
npm run test:catalog
```

### 5.3. Testes de Segurança do Painel Administrativo (B.4)
Valida isolamento de RLS para produtos, categorias, campanhas, imagens e leads contra acessos não autorizados:
```bash
npm run test:admin
```

---

## 6. Configuração do Supabase Storage (`product-images`)

Para o upload de fotos de produtos direto para o storage gerenciado do Supabase:
1. No painel do Supabase, acesse **Storage** -> **New bucket**.
2. Nomeie o bucket como: `product-images`.
3. Marque a opção **Public bucket** (para que as URLs públicas das fotos sejam exibidas na loja sem tokens efêmeros).
4. Defina o tamanho máximo de arquivo como `5MB` e MIME types permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
5. Em **Policies**, permita `INSERT` e `DELETE` apenas para usuários autenticados onde `public.is_admin() = true`.
*Nota:* Caso o bucket ainda não tenha sido criado pelo console, o sistema permite alternativamente o cadastro imediato de imagens via URL externa acessível.

## 6. Backups e Salvaguarda

- O Supabase realiza backups automáticos diários do banco relacional.
- Para gerar um dump lógico pontual da estrutura e dados:
  ```bash
  npx supabase db dump -f backup_schema.sql
  ```
