# Inventário de Serviços Externos, Fontes, Scripts e Cookies (THIRD_PARTY_SERVICES.md)

> **Inventário Técnico de Terceiros e Dependências Externas**  
> **Sistema:** KAVUNO 3D Commerce  
> **Versão:** 1.0 (Etapa B.9)

---

## 1. Inventário Consolidado de Terceiros

| Fornecedor / Serviço | Domínio / Origem | Finalidade Técnica | Momento do Carregamento | Dados Transmitidos | Tipo de Integração |
|---|---|---|---|---|---|
| **Supabase (PostgreSQL & Auth)** | `*.supabase.co` | Banco de dados, autenticação de sessão e RPCs | Requisições no servidor e actions | Credenciais, cadastros, pedidos, eventos | SDK Server-Side (`@supabase/ssr`) |
| **Supabase (Storage)** | `*.supabase.co/storage/v1` | Hospedagem de imagens públicas de produtos | Navegação nas páginas de catálogo | Download de arquivos de imagem (`GET`) | URL pública direta |
| **Mercado Pago** | `api.mercadopago.com` | Criação de pagamentos Pix/Cartão e consulta de status | Conclusão do checkout e recebimento de webhooks | Nome, e-mail, telefone, valor, identificador do pedido | API REST Server-to-Server via `fetch()` |
| **Google Search Console** | Nenhum script carregado | Verificação de propriedade do domínio | Metatag estática no `<head>` | Nenhuma chamada de cliente | `<meta name="google-site-verification">` |

---

## 2. Auditoria de Fontes, Scripts e CDNs Externos

### 2.1. Fontes Tipográficas
- **Google Fonts:** ❌ **NÃO UTILIZADO.** Não há nenhuma tag `<link href="https://fonts.googleapis.com">` nem `@import url(...)` em `layout.tsx` ou em arquivos CSS.
- **Implementação Real:** O sistema utiliza pilha nativa de fontes do sistema operacional (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`) para fontes sem serifa e fontes de console instaladas (`JetBrains Mono`, `SF Mono`, `Menlo`, `Monaco`, `Consolas`) para tipografia monoespaçada.
- **Benefício de Privacidade e Performance:** Zero vazamento de endereços IP de visitantes para servidores da Google no carregamento de fontes; tempo de renderização imediato (zero FOUT/FOIT de fontes remotas).

### 2.2. Scripts de Terceiros no Cliente
- **Google Analytics / Google Tag Manager:** ❌ **NÃO UTILIZADO.**
- **Meta / Facebook Pixel:** ❌ **NÃO UTILIZADO.**
- **Session Replay (Hotjar, Microsoft Clarity, LogRocket, FullStory):** ❌ **NÃO UTILIZADO.**
- **Mapas, Vídeos ou Chats Externos:** ❌ **NÃO UTILIZADO.**
- **Conclusão:** 100% dos scripts executados no navegador são bundles compilados localmente pelo Next.js da aplicação. Nenhuma biblioteca externa executa código arbitrário na máquina do visitante.

---

## 3. Inventário de Cookies e Armazenamento no Navegador

### 3.1. Cookies Próprios (First-Party Cookies)
| Nome do Cookie | Origem | Finalidade | Tipo / Duração | Classificação LGPD |
|---|---|---|---|---|
| `sb-<project>-auth-token` | Supabase SSR | Manutenção da sessão autenticada do usuário | Sessão / Persistente (HttpOnly, Secure, SameSite=Lax) | **Estritamente Necessário** |
| `kavuno_cookie_consent` | Aplicação KAVUNO | Armazenamento da preferência de consentimento do usuário | Persistente (1 ano, `SameSite=Lax`) | **Estritamente Necessário** |

### 3.2. Armazenamento Local (`localStorage` / `sessionStorage`)
| Chave | Mecanismo | Finalidade | Conteúdo Armazenado | Classificação |
|---|---|---|---|---|
| `kavuno_cart` | `localStorage` | Persistência do carrinho de compras durante a navegação | Lista de itens, variantes, quantidades e modalidade comercial (Zero PII) | Funcional / Essencial |
| `kavuno_anon_session_id` | `sessionStorage` | Correlação anônima de eventos de navegação para cálculo de funil | Hash pseudônimo (ex: `anon_1730000000_abc123`) | Analítico / Telemetria |

### 3.3. Cookies de Terceiros (Third-Party Cookies)
- **Status:** **ZERO cookies de terceiros.** A aplicação não carrega scripts de publicidade nem iframes de rastreamento cross-site.

---

## 4. Recomendações e Plano de Ação para Terceiros

1. **Supabase Region:** Confirmar no painel administrativo do Supabase a localização da região do banco de dados (recomenda-se selecionar a região `sa-east-1` São Paulo para conformidade imediata com a localização nacional de dados).
2. **Mercado Pago Webhook:** Garantir que o segredo de assinatura de webhooks (`MERCADO_PAGO_WEBHOOK_SECRET`) esteja estritamente configurado no ambiente de produção para validar a integridade de todas as notificações de pagamento.
3. **Transportadoras / Correios:** Quando integradas APIs externas de cálculo de frete (ex: Melhor Envio / Correios), certificar-se de transmitir apenas CEP de destino e peso do pacote, sem nomes de clientes.
