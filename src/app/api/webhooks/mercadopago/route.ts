import { NextRequest, NextResponse } from "next/server";
import { mercadoPago } from "@/lib/payments/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Registra log do webhook com segurança para auditoria
    const supabaseAdmin = createAdminClient();
    const eventType = payload.type || payload.action || "unknown";
    const externalEventId = payload.data?.id ? String(payload.data.id) : null;

    // Prevenção de eventos duplicados
    if (externalEventId) {
      const { data: existingLog } = await (supabaseAdmin.from("payment_webhook_logs") as any)
        .select("id, processed")
        .eq("external_event_id", externalEventId)
        .eq("processed", true)
        .maybeSingle();

      if (existingLog) {
        return NextResponse.json({ status: "already_processed" }, { status: 200 });
      }
    }

    const { data: logRecord } = await (supabaseAdmin.from("payment_webhook_logs") as any)
      .insert({
        gateway: "mercado_pago",
        event_type: eventType,
        external_event_id: externalEventId,
        signature_header: signature,
        payload,
        processed: false,
      })
      .select("id")
      .single();

    // Valida assinatura se em modo configurado
    const isValid = mercadoPago.validateWebhookSignature(signature, rawBody);
    if (!isValid) {
      if (logRecord?.id) {
        await (supabaseAdmin.from("payment_webhook_logs") as any)
          .update({ error_message: "Assinatura de webhook inválida" })
          .eq("id", logRecord.id);
      }
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    // Se o evento for de pagamento, reconcilia com a tabela de pagamentos e pedidos
    if (eventType === "payment" && externalEventId) {
      const mpStatus = await mercadoPago.getPaymentStatus(externalEventId);

      // Localiza o pagamento no banco pelo external_payment_id
      const { data: payment } = await (supabaseAdmin.from("payments") as any)
        .select("id, order_id, status, amount, payment_method")
        .eq("external_payment_id", externalEventId)
        .maybeSingle();

      if (payment) {
        if (mpStatus.status === "approved" && payment.status !== "approved") {
          const paidAt = new Date().toISOString();

          // 1. Atualiza pagamento para approved
          await (supabaseAdmin.from("payments") as any)
            .update({
              status: "approved",
              paid_at: paidAt,
            })
            .eq("id", payment.id);

          // 2. Atualiza pedido para payment_approved
          await (supabaseAdmin.from("orders") as any)
            .update({
              status: "payment_approved",
            })
            .eq("id", payment.order_id);

          // 3. Registra histórico do pedido
          await (supabaseAdmin.from("order_history") as any).insert({
            order_id: payment.order_id,
            previous_status: "pending_payment",
            new_status: "payment_approved",
            notes: `Pagamento aprovado via Webhook Mercado Pago (ID: ${externalEventId})`,
          });

          // 4. Conciliação Financeira Auditável no Livro Razão (B.7)
          try {
            const grossAmount = Number(payment.amount || 0);
            let feeAmount = mpStatus.feeAmount;
            let netAmount = mpStatus.netReceivedAmount;

            if (feeAmount == null || netAmount == null) {
              const defaultFeePct = payment.payment_method === "pix" ? 0.0099 : 0.0499;
              feeAmount = Math.round((grossAmount * defaultFeePct) * 100) / 100;
              netAmount = Math.max(0, grossAmount - feeAmount);
            }

            const idempotencyKey = `PAY-${payment.id}-INCOME`;
            const accrualDate = paidAt.split("T")[0];

            await (supabaseAdmin.from("financial_transactions") as any).upsert(
              {
                idempotency_key: idempotencyKey,
                transaction_type: "income",
                gross_amount: grossAmount,
                fee_amount: feeAmount,
                net_amount: netAmount,
                accrual_date: accrualDate,
                cleared_at: paidAt,
                status: "cleared",
                source_type: "order_payment",
                source_id: payment.id,
                description: `Recebimento Pedido ref. Pagamento ${payment.id} (Webhook)`,
                payment_method: payment.payment_method || "pix",
                notes: `Conciliação automática via Webhook Mercado Pago. Taxa retida: R$ ${feeAmount.toFixed(2)}`,
              },
              { onConflict: "idempotency_key" }
            );

            // Atualiza conta a receber vinculada (se houver)
            await (supabaseAdmin.from("accounts_receivable") as any)
              .update({
                status: "received",
                received_net_amount: netAmount,
                cleared_at: paidAt,
                gateway_settlement_id: externalEventId,
              })
              .eq("payment_id", payment.id);
          } catch (finErr) {
            console.error("Erro na conciliação financeira do webhook:", finErr);
          }

          // 5. Rastreia conversão de pagamento confirmado em analytics
          try {
            await (supabaseAdmin.from("analytics_events") as any).insert({
              event_name: "payment_confirmed",
              session_id: "wh_" + Math.random().toString(36).substring(2, 10),
              entity_type: "order",
              entity_id: payment.order_id,
              metadata: {
                gateway: "mercado_pago",
                external_payment_id: externalEventId,
                net_received_amount: mpStatus.netReceivedAmount || null,
              },
            });
          } catch {
            // Silencioso para não interromper webhook
          }
        }
      }
    }

    // Marca webhook como processado com sucesso
    if (logRecord?.id) {
      await (supabaseAdmin.from("payment_webhook_logs") as any)
        .update({ processed: true })
        .eq("id", logRecord.id);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Erro no processamento do webhook Mercado Pago:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
