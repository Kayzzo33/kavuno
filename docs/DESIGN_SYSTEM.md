# Design System: Layer & Street (DESIGN_SYSTEM.md)

## 1. Visão Geral e Filosofia

O **Design System do 3D Commerce** adota a estética **Geek + Street Utilitária**: uma linguagem visual inspirada no universo da manufatura aditiva (precisão mecânica, fatiamento, coordenadas, filamento fosco) combinada com o minimalismo funcional da cultura urbana/streetwear.

### Diretrizes de Identidade
1. **Profissional, Comercial e Focado no Produto:** A interface serve para valorizar a peça impressa, com fotografia limpa e especificações reais de material.
2. **Bordas Parcialmente Interrompidas (*Corner Brackets / Interrupted Strokes*):** Detalhes geométricos sutis que remetem a gabaritos técnicos de corte e alinhamento de mesa de impressão.
3. **Ausência de Clichês de IA:** Proibido o uso de neons purpurinados, gradientes roxos genéricos, sombras pesadas e animações gratuitas que poluam a experiência de compra.
4. **Mobile-First e Acessível (WCAG AA/AAA):** Textos legíveis, áreas de toque generosas (mínimo 44x44px no mobile), contrastes estritos.

---

## 2. Tokens de Design

### 2.1. Cores de Superfície e Estrutura
- `--bg-canvas`: `#0B0D10` (Preto grafite profundo de alta profundidade)
- `--bg-surface`: `#13161C` (Superfície de cartões e blocos de conteúdo)
- `--bg-surface-elevated`: `#1A1E26` (Modais, dropdowns e seções destacadas)
- `--border-subtle`: `#242A35` (Divisores e bordas passivas)
- `--border-strong`: `#384252` (Bordas de foco e caixas de seleção)
- `--border-interrupted`: `#FF5C00` (Borda de realce com cantoneiras técnicas)

### 2.2. Tipografia e Escala
- **Fonte Geral (UI & Body):** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — Leitura confortável e neutra.
- **Fonte Técnica (Headings, SKUs, Métricas, Gramatura):** `"JetBrains Mono", "Fira Code", monospace` — Personalidade geométrica geek.
- **Escala de Tamanhos:**
  - `xs`: 0.75rem (12px)
  - `sm`: 0.875rem (14px)
  - `base`: 1.00rem (16px)
  - `lg`: 1.125rem (18px)
  - `xl`: 1.25rem (20px)
  - `2xl`: 1.50rem (24px)
  - `3xl`: 1.875rem (30px)
  - `4xl`: 2.25rem (36px)

### 2.3. Cores Semânticas de Domínio (Impressão 3D)
- **Acento Primário (Industrial Orange):** `#FF5C00` (Hover: `#E05200`) — Ações de compra, pré-venda e destaque principal.
- **Pronta Entrega (Estoque Físico):** `#10B981` (Verde oficina) — Indica produto acabado pronto para despacho imediato.
- **Pré-Venda Paga (Campanha Ativa):** `#F59E0B` (Âmbar mecânico) — Sinaliza lote em arrecadação/produção programada.
- **Reserva de Interesse (Validação Gratuita):** `#38BDF8` (Ciano calibragem) — Captação de demanda pura sem compromisso financeiro.
- **Erro / Alerta Crítico:** `#EF4444` (Vermelho falha de extrusão).

---

## 3. Padrão Visual: Bordas Parcialmente Interrompidas

O elemento característico do design é a **Borda Técnica Interrompida** (`.bracket-border` ou `.tech-card`). Em vez de um retângulo simples fechado ou excessivamente arredondado:
- Utiliza microcantoneiras nos vértices ou linhas de topo e base interrompidas por um indicador de status (ex: `[ IN_STOCK ]`, `[ PRE_ORDER ]`, `[ DEV // 3D ]`).
- Implementado em CSS puro através de gradientes angulares ou pseudoelementos `::before` e `::after`, garantindo renderização instantânea sem peso de imagens ou SVGs complexos.

---

## 4. Componentes Base e Estados

| Componente | Variantes | Estados Suportados |
|---|---|---|
| **Button** | `primary` (orange street), `secondary` (bracket outline), `ghost`, `danger` | Default, Hover, Active, Disabled, Loading (com spinner técnico) |
| **Input & Textarea** | `default`, `with-prefix`, `with-suffix` | Default, Focus com realce técnico, Error com mensagem descritiva, Disabled |
| **Badge Comercial** | `in-stock` (verde), `pre-order` (âmbar), `interest-lead` (ciano) | Estático, com indicador pulsante discreto de disponibilidade |
| **Card / Showcase** | `standard`, `bracket-highlight`, `flat` | Default, Hover com transição discreta de 2px de elevação |
| **Alert & Feedback** | `info`, `success`, `warning`, `error` | Dismissível, com suporte a ações em linha |
| **LoadingSpinner** | `sm`, `md`, `lg` | Animação suave e discreta com SVG puro |

---

## 5. Regras de Acessibilidade e SEO

- **Contraste Mínimo:** Todos os textos sobre fundo escuro atendem à razão de 4.5:1 (WCAG AA) ou 7:1 (WCAG AAA).
- **Semântica HTML5:** Uso rigoroso de `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`.
- **Focus Rings Visíveis:** Todo elemento interativo exibe anel de foco técnico nítido para navegação por teclado.
- **SEO Ready:** Tipografia e metadados configurados para OpenGraph, Twitter Cards e JSON-LD de produtos.
