/**
 * INTEGRAÇÃO MERCADO PAGO - SERVIÇO DE PAGAMENTOS
 * Camada de abstração e comunicação com a API do Mercado Pago.
 *
 * Suporta modo simulador/sandbox seguro para quando as credenciais reais
 * (MERCADO_PAGO_ACCESS_TOKEN) ainda não estiverem configuradas no ambiente.
 */

export interface CreatePaymentPreferenceInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  paymentMethod: "pix" | "credit_card";
  idempotencyKey: string;
}

export interface PaymentPreferenceResult {
  success: boolean;
  paymentId: string;
  status: "pending" | "approved" | "rejected";
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  errorMessage?: string;
}

export interface WebhookNotificationPayload {
  action: string;
  type: string;
  data: {
    id: string;
  };
  live_mode: boolean;
}

export class MercadoPagoService {
  private accessToken: string | null;

  constructor() {
    this.accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || null;
  }

  get isConfigured(): boolean {
    return !!this.accessToken && this.accessToken.length > 10;
  }

  /**
   * Cria uma intenção / cobrança de pagamento (Pix ou Cartão).
   * Se MERCADO_PAGO_ACCESS_TOKEN estiver presente, chama a API oficial v1/payments.
   * Caso contrário, gera uma resposta determinística de homologação (mock pré-pronto).
   */
  async createPayment(input: CreatePaymentPreferenceInput): Promise<PaymentPreferenceResult> {
    if (this.isConfigured) {
      try {
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
            "X-Idempotency-Key": input.idempotencyKey,
          },
          body: JSON.stringify({
            transaction_amount: Number(input.amount.toFixed(2)),
            description: `Pedido ${input.orderNumber} - 3D Commerce`,
            payment_method_id: input.paymentMethod === "pix" ? "pix" : "credit_card",
            payer: {
              email: input.customer.email,
              first_name: input.customer.name.split(" ")[0] || "Cliente",
              last_name: input.customer.name.split(" ").slice(1).join(" ") || "3D",
            },
            external_reference: input.orderId,
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://kavuno.com.br"}/api/webhooks/mercadopago`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            paymentId: "",
            status: "rejected",
            errorMessage: data.message || "Erro retornado pela API do Mercado Pago.",
          };
        }

        const pointOfInteraction = data.point_of_interaction?.transaction_data;
        return {
          success: true,
          paymentId: String(data.id),
          status: data.status === "approved" ? "approved" : "pending",
          qrCode: pointOfInteraction?.qr_code,
          qrCodeBase64: pointOfInteraction?.qr_code_base64,
          ticketUrl: pointOfInteraction?.ticket_url,
        };
      } catch (err: any) {
        return {
          success: false,
          paymentId: "",
          status: "rejected",
          errorMessage: `Falha de rede ao conectar com Mercado Pago: ${err.message}`,
        };
      }
    }

    // Modo Homologação Pré-Pronto (quando token ainda não configurado)
    const simulatedPaymentId = `mp_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const simulatedPixPayload = `00020101021226840014br.gov.bcb.pix2562qrcodes.mercadopago.com/pix/${simulatedPaymentId}5204000053039865802BR59133D_COMMERCE6009SAO_PAULO62070503***6304`;

    return {
      success: true,
      paymentId: simulatedPaymentId,
      status: "pending",
      qrCode: simulatedPixPayload,
      ticketUrl: `https://www.mercadopago.com.br/payments/${simulatedPaymentId}/ticket`,
    };
  }

  /**
   * Consulta o status real de um pagamento diretamente na API do Mercado Pago
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    statusDetail?: string;
    netReceivedAmount?: number;
    feeAmount?: number;
  }> {
    if (!this.isConfigured || paymentId.startsWith("mp_sim_")) {
      return { status: "pending", statusDetail: "modo_homologacao" };
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return { status: "error" };
      }

      const data = await response.json();
      const feeAmount = Array.isArray(data.fee_details)
        ? data.fee_details.reduce((acc: number, f: any) => acc + Number(f.amount || 0), 0)
        : undefined;

      return {
        status: data.status,
        statusDetail: data.status_detail,
        netReceivedAmount: data.transaction_details?.net_received_amount != null
          ? Number(data.transaction_details.net_received_amount)
          : undefined,
        feeAmount,
      };
    } catch {
      return { status: "error" };
    }
  }

  /**
   * Valida a assinatura do webhook oficial do Mercado Pago (X-Signature / HMAC-SHA256)
   */
  validateWebhookSignature(signatureHeader: string | null, payloadString: string): boolean {
    const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Se não houver segredo configurado no ambiente, permite processar em ambiente dev/staging
      return true;
    }
    if (!signatureHeader) return false;

    // Em produção, validação de hash ts + v1 com crypto
    try {
      const crypto = require("crypto");
      const parts = signatureHeader.split(",");
      let ts = "";
      let hash = "";

      for (const part of parts) {
        const [k, v] = part.split("=");
        if (k.trim() === "ts") ts = v.trim();
        if (k.trim() === "v1") hash = v.trim();
      }

      const manifest = `id:${payloadString};request-timestamp:${ts}`;
      const hmac = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex");
      return hmac === hash;
    } catch {
      return false;
    }
  }
}

export const mercadoPago = new MercadoPagoService();
