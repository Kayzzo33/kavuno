# Regras de Negócio e Domínio (DOMAIN_RULES.md)

Este documento descreve as regras canônicas que orientam a modelagem de dados, validações e fluxos operacionais do **3D Commerce**.

---

## 1. Modalidades de Comercialização

O sistema suporta três modalidades comerciais distintas, com comportamentos inegociáveis:

| Modalidade | Pagamento Exigido | Reserva Estoque Físico | Impacto Contábil | Regra Principal |
|---|---|---|---|---|
| **Pronta Entrega (`in_stock`)** | Sim (no checkout) | Imediata ao criar pedido | Receita diferida até entrega ou aprovação de faturamento | Só pode ser vendido se houver saldo positivo em `inventory_items` com status `available`. |
| **Pré-venda Paga (`pre_order`)** | Sim (no checkout) | Não (gera ordem/lote futuro) | Receita antecipada (Passivo circulante até faturar) | Vinculada a uma campanha (`campaign_id`). Possui prazo de entrega estendido, data limite de encerramento e meta mínima de unidades. Se a meta não for atingida, pode disparar estorno/reembolso. |
| **Reserva Gratuita de Interesse (`interest_lead`)** | **NÃO** | **NÃO** | **Nenhum** (zero receita) | Coleta dados do cliente (nome, email, WhatsApp, variante desejada) para avaliar tração de produto. Não gera pedido de venda nem afeta estoque. |

---

## 2. Catálogo e Produtos

1. **Separação Produto x Variante:**
   - O `Product` define nome, descrição conceitual, SEO e categoria.
   - O `ProductVariant` define SKU, atributos físicos específicos (cor, material de filamento como PLA, PETG, ABS, TPU), peso estimado da peça em gramas, tempo estimado de impressão e diferencial de preço.
2. **Preços e Descontos:**
   - Preços são armazenados em `numeric(12,2)`.
   - Se `promotional_price` estiver preenchido, deve ser estritamente menor que `base_price`.
3. **Imagens:**
   - Suporte a múltiplas fotos ordenadas por `display_order`. Exatamente uma imagem deve ser marcada com `is_primary = true` por produto ou variante.

---

## 3. Gestão de Pedidos e Carrinho

1. **Navegação Anônima:**
   - O visitante pode adicionar itens ao carrinho sem login. Ao avançar para o checkout, pode autenticar-se via Supabase Auth ou preencher dados de visitante (gerando perfil vinculado ao checkout).
2. **Snapshot de Preços:**
   - Cada item do pedido (`order_items`) grava uma cópia imutável dos valores no momento da compra: `unit_price`, `cost_price_snapshot`, `discount_amount`, `product_name_snapshot` e `variant_name_snapshot`. Modificações futuras no catálogo não alteram pedidos passados.
3. **Máquina de Estados de Pedidos:**
   - `pending_payment` -> `payment_approved` -> `in_production` (para pré-vendas ou sob encomenda) -> `ready_for_dispatch` -> `shipped` -> `delivered`.
   - Estados de exceção: `cancelled`, `refunded`, `disputed`.
4. **Idempotência:**
   - Pedidos possuem chave única de idempotência (`idempotency_key`) para prevenir duplicações causadas por múltiplos cliques ou reenvios de requisições.

---

## 4. Pagamentos e Reconciliação (Mercado Pago)

1. **Aprovação Segura:**
   - NUNCA aprovar pagamento por parâmetro de URL de retorno.
   - Aprovação apenas por webhook oficial assinado ou consulta direta via Server Action autenticada à API do Mercado Pago.
2. **Status de Transação:**
   - `pending`, `in_process`, `approved`, `rejected`, `cancelled`, `refunded`, `charged_back`.
3. **Histórico de Notificações:**
   - Toda notificação recebida é armazenada na íntegra na tabela `payment_webhook_logs` para auditoria, prevenção de repetição e resolução de disputas.
4. **Pix e Expiração:**
   - Geração de cobrança Pix deve possuir timestamp de expiração explícito (`expires_at`). Caso expire, nova cobrança pode ser gerada sem duplicar o pedido.

---

## 5. Filamentos, Bobinas e Consumo de Impressão 3D

1. **Controle Individual de Bobinas (`filament_spools`):**
   - Cada carretel recebe um código rastreável único (ex: `SPOOL-PLA-BLK-001`).
   - Atributos obrigatórios: material (PLA, PETG, ABS, ASA, TPU, etc.), fabricante/marca, cor, lote do fabricante, peso inicial líquido (ex: 1000g), peso da tara vazia (ex: 200g) e peso restante em gramas.
   - Preço de compra e frete rateado para formar o `cost_per_gram` preciso em `numeric(12,4)`.
2. **Movimentações de Filamento:**
   - Débitos por impressão de peças, perda de calibração, expurgo de troca de cor (poop), falhas e testes.
   - É proibido saldo negativo silencioso: o sistema bloqueia ou exige justificativa com aprovação gerencial se uma baixa exceder o peso restante estimado.
3. **Compatibilidade com Bambu Lab:**
   - Estrutura pronta para mapear `tray_id` / slot de AMS (Automatic Material System), RFID do carretel e telemetria de consumo quando o hardware estiver conectado.

---

## 6. Produção e Chão de Fábrica

1. **Ordens de Produção (`production_orders`):**
   - Vinculadas a um ou mais pedidos (`order_id`) ou a ordens de reposição de estoque próprio.
   - Registram: quantidade planejada, tempo de impressão estimado vs realizado, filamento planejado em gramas vs filamento efetivamente consumido.
2. **Desperdício e Falhas de Impressão:**
   - Falhas (`print_failures`) registram motivo (descolamento de mesa, entupimento de bico, quebra de filamento, falta de energia), gramas perdidos e custo associado.
   - Peças descartadas geram lançamento automático de custo de refugo e necessidade de reimpressão (`reprint`).

---

## 7. Gestão Financeira, Custos e Conciliação Auditável (B.7)

1. **Diferenciações Obrigatórias e Inegociáveis:**
   - **Venda Criada != Recebimento em Caixa:** Pedidos criados/faturados afetam competência contábil, mas NÃO entram no saldo de caixa disponível (`currentCashBalance`) até sua efetiva liquidação bancária (`status = 'cleared'`).
   - **Pagamento Aprovado != Valor Liquidado:** A aprovação no gateway gera um crédito com retenção de taxa (Mercado Pago). O valor líquido recebido é `gross_amount - fee_amount`. A liquidação ocorre conforme a janela de repasse do provedor.
   - **Reserva Gratuita de Interesse (interest_lead):** Captação pura de demanda. **NUNCA** gera receita, cobrança, emissão de documento contábil ou baixa de estoque.
   - **Custo Estimado != Custo Realizado:** O custo do catálogo baseia-se em pesos nominais e premissas. O custo realizado apura filamento real debitado de bobinas físicas específicas, perdas por purga/descarte e tempo de máquina real.
   - **Equipamentos (CAPEX) e Depreciação Horária:** A aquisição de impressoras 3D e maquinário é tratada como Ativo Imobilizado (CAPEX). **É PROIBIDO** atribuir o valor integral da máquina a uma única peça! A alocação ocorre estritamente via depreciação horária calculada: `(custo_aquisicao / vida_util_horas) * (tempo_impressao_minutos / 60)`.
   - **Prevenção de Duplicidade:** Toda movimentação financeira possui chave de idempotência determinística (`PAY-{id}-INCOME`, `SPOOL-{id}-PURCHASE`, `ASSET-{id}-PURCHASE`, `REFUND-{id}`). Nenhuma transação pode ser computada duas vezes no fluxo de caixa ou DRE.

2. **Fórmulas Canônicas:**
   - **Custo Unitário de Produção (CPV):**
     $$\text{CPV} = \text{Custo Filamento} + \text{Custo Energia} + \text{Depreciação Máquina} + \text{Mão de Obra Direta} + \text{Embalagem/Insumos}$$
     - $\text{Custo Filamento} = \text{Peso (g)} \times \text{Custo por grama da bobina}$
     - $\text{Custo Energia} = \left(\frac{\text{Tempo (min)}}{60}\right) \times \left(\frac{\text{Potência (W)}}{1000}\right) \times \text{Tarifa (R\$/kWh)}$
     - $\text{Depreciação Máquina} = \left(\frac{\text{Tempo (min)}}{60}\right) \times \left(\frac{\text{Custo Máquina}}{\text{Vida Útil (horas)}}\right)$
     - $\text{Mão de Obra} = \left(\frac{\text{Minutos Trabalho}}{60}\right) \times \text{Tarifa Horária (R\$/h)}$
   - **Frete Subsidiado (Logística Absorvida):**
     $$\text{Frete Subsidiado} = \max(0, \text{Frete Real Transportadora} - \text{Frete Cobrado do Cliente})$$
   - **Margem Bruta Unitária:**
     $$\text{Margem Bruta (R\$)} = \text{Preço de Venda Unitário} - \text{CPV Total}$$
     $$\text{Margem Bruta (\%)} = \left(\frac{\text{Margem Bruta (R\$)}}{\text{Preço de Venda}}\right) \times 100$$
   - **Margem de Contribuição:**
     $$\text{Margem Contribuição} = \text{Receita Líquida Recebida} - \text{CPV} - \text{Frete Subsidiado}$$
   - **DRE Gerencial:**
     $$\text{Receita Líquida} = \text{Vendas Brutas} - \text{Taxas Gateway} - \text{Frete Subsidiado} - \text{Reembolsos}$$
     $$\text{Lucro Bruto} = \text{Receita Líquida} - \text{CPV}$$
     $$\text{Resultado Operacional} = \text{Lucro Bruto} - \text{Despesas Fixas/Operacionais} - \text{Mão de Obra}$$

3. **Ausência de Parâmetros / Telemetria:**
   - Se tarifas de energia (kWh) ou depreciação de máquinas não estiverem configuradas, o sistema marca explicitamente `is_telemetry_missing = true` e registra notas de pendência, **sem inventar valores arbitrários**. Permite parametrização administrativa em tempo de execução via tela `/admin/financeiro`.

---

## 8. Logística e Entregas (Brasil)

1. **Cotações Imutáveis:**
   - Ao fechar o pedido, salvar a cotação escolhida (`quoted_carrier`, `quoted_service`, `quoted_deadline_days`, `quoted_shipping_cost`).
2. **Rastreio:**
   - Atualização de status: `label_created`, `in_transit`, `out_for_delivery`, `delivered`, `delivery_failed`, `returned`.

---

## 9. Analytics, Funis e LGPD

1. **Eventos do Funil:**
   - `product_view`, `search_executed`, `variant_selected`, `cart_item_added`, `cart_item_removed`, `checkout_started`, `interest_lead_created`, `order_completed`.
2. **Privacidade:**
   - Registro anônimo de visitantes com `session_id` gerado no cliente.
   - Nenhuma informação pessoal identificável (PII) é gravada na tabela de eventos de navegação, respeitando a LGPD.
