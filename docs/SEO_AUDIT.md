# Auditoria de SEO Técnico, Metadados e Visibilidade (SEO_AUDIT.md)

> **Auditoria Completa de Indexabilidade e Otimização para Mecanismos de Busca**  
> **Sistema:** KAVUNO 3D Commerce  
> **Versão:** 1.0 (Etapa B.9)

---

## 1. Resumo Executivo de SEO

A arquitetura do **KAVUNO** foi inspecionada sob as melhores práticas modernas de SEO técnico para Next.js 15 App Router:
- **Indexabilidade:** 100% das páginas públicas contam com tags canônicas, metadados dinâmicos e sitemap XML automatizado.
- **Isolamento de Segurança:** As rotas administrativas (`/admin/*`), operacionais e de dados sensíveis de clientes estão expressamente desautorizadas no `robots.txt` e, fundamentalmente, bloqueadas por autenticação e RLS no servidor.
- **Performance e CWV:** Ausência de fontes ou scripts de terceiros de bloqueio de renderização (zero Google Fonts ou CDNs lentos).
- **Dados Estruturados:** Implementação nativa de Schema.org para Organização, Mecanismo de Busca no Catálogo e Ficha Técnica de Produto com Oferta em BRL.

---

## 2. Matriz de Cobertura de Metadados por Rota

| Rota | Title Tag | Meta Description | Canonical URL | Open Graph | Schema.org JSON-LD | Status Indexação |
|---|---|---|---|---|---|---|
| `/` | `KAVUNO \| Impressão 3D Profissional & Action Figures sob Demanda` | Sim (158 caracteres otimizados) | `https://kavuno.com.br/` | Sim (1024x1024) | `Organization` + `WebSite` | Indexável |
| `/catalogo` | `Catálogo de Peças & Impressão 3D \| KAVUNO 3D` | Sim (filtros, materiais PLA/PETG) | `https://kavuno.com.br/catalogo` | Sim | — | Indexável |
| `/produtos/[slug]` | `{Nome do Produto} \| KAVUNO 3D` | Resumo técnico do produto | `https://kavuno.com.br/produtos/{slug}` | Sim com imagem do produto | `Product` + `Offer` | Indexável (apenas se `is_active = true`) |
| `/validacao` | `Campanhas & Validação de Demanda \| KAVUNO 3D` | Lotes abertos para reserva gratuita | `https://kavuno.com.br/validacao` | Sim | — | Indexável |
| `/login` | `Entrar na Conta \| KAVUNO 3D` | Acesso à área do cliente | `https://kavuno.com.br/login` | Não | — | Noindex via robots.txt |
| `/cadastro` | `Criar Conta \| KAVUNO 3D` | Cadastro de novos clientes | `https://kavuno.com.br/cadastro` | Não | — | Noindex via robots.txt |
| `/carrinho` | `Carrinho de Compras \| KAVUNO 3D` | Conferência de itens | — | Não | — | Noindex via robots.txt |
| `/checkout` | `Finalizar Compra \| KAVUNO 3D` | Pagamento e frete | — | Não | — | Noindex via robots.txt |
| `/perfil` | `Meu Perfil \| KAVUNO 3D` | Área restrita do cliente | — | Não | — | Bloqueado por Auth SSR |
| `/admin/*` | Rotas de Gestão | Painel administrativo restrito | — | Não | — | Bloqueado por Middleware + RLS |

---

## 3. Auditoria do Sitemap XML Dinâmico (`src/app/sitemap.ts`)

- **URL:** `https://kavuno.com.br/sitemap.xml`
- **Geração:** Dinâmica no Next.js App Router via Server Function.
- **Critérios de Inclusão:**
  1. Páginas estáticas principais (`/`, `/catalogo`, `/validacao`) com frequências de atualização diária/horária.
  2. Apenas produtos ativos (`is_active = true`) consultados diretamente via Supabase client, evitando URLs quebradas (404) ou indexação de rascunhos.
  3. `lastModified` preenchido com a data real de alteração do produto (`p.updated_at`).

---

## 4. Auditoria de Dados Estruturados (Schema.org)

### 4.1. Raiz do Site (`layout.tsx`)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KAVUNO",
  "url": "https://kavuno.com.br",
  "logo": "https://kavuno.com.br/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "Portuguese"
  }
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "KAVUNO",
  "url": "https://kavuno.com.br",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kavuno.com.br/catalogo?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### 4.2. Página Individual do Produto (`produtos/[slug]/page.tsx`)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "description": "...",
  "url": "https://kavuno.com.br/produtos/...",
  "brand": { "@type": "Brand", "name": "KAVUNO" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "BRL",
    "price": "89.90",
    "availability": "https://schema.org/InStock",
    "url": "https://kavuno.com.br/produtos/...",
    "seller": { "@type": "Organization", "name": "KAVUNO" }
  }
}
```

---

## 5. Auditoria de Desempenho e Core Web Vitals (CWV)

1. **Largest Contentful Paint (LCP):**
   - Imagens de catálogo servidas via Supabase Storage com cache de 1 hora (`cacheControl: "3600"`).
   - Ausência de requisições de fontes externas elimina tempos de espera de handshake TLS com terceiros.
2. **Cumulative Layout Shift (CLS):**
   - Componentes visuais utilizam contêineres de proporção delimitados (`aspect-ratio` e dimensões explícitas) nas galerias de produtos.
3. **Interaction to Next Paint (INP):**
   - Despacho de telemetria analítica com prioridade a `navigator.sendBeacon()`, sem travar a thread principal em interações de navegação ou submit.

---

## 6. Recomendações Técnicas para o Proprietário

1. **Google Search Console:** Ao subir para o domínio oficial em produção, cadastrar o domínio no Search Console e preencher a variável de ambiente `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
2. **Submissão do Sitemap:** Submeter a URL `https://kavuno.com.br/sitemap.xml` diretamente no painel do Google para acelerar a indexação dos primeiros lotes e produtos cadastrados.
3. **Imagens Otimizadas:** Fazer upload de fotografias em formato WebP com resolução máxima de 1200x1200px para garantir carregamento ultra-rápido no mobile.
