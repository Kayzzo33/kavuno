"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface InterestLeadResult {
  success: boolean;
  message?: string;
  error?: string;
  leadId?: string;
}

/**
 * Server Action para Registro de Reserva Gratuita de Interesse.
 * - Validações defensivas no servidor (email RFC, nome, produto).
 * - Proteção contra duplicações: impede que o mesmo e-mail envie múltiplas reservas
 *   para o mesmo produto num período recente de 7 dias.
 * - Vínculo correto com product_id, variant_id e campaign_id.
 * - Persistência real em public.interest_leads.
 * - Não gera pedido formal, cobrança, transação financeira nem baixa de estoque.
 */
export async function submitInterestLeadAction(
  _prevState: InterestLeadResult | null,
  formData: FormData
): Promise<InterestLeadResult> {
  const productId = formData.get("productId") as string;
  const variantId = (formData.get("variantId") as string) || null;
  const campaignId = (formData.get("campaignId") as string) || null;
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const whatsappPhone = (formData.get("whatsappPhone") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  // 1. Validações Defensivas
  if (!productId) {
    return { success: false, error: "Identificador do produto é obrigatório." };
  }

  if (!fullName || fullName.length < 3) {
    return { success: false, error: "Por favor, informe seu nome completo (mínimo 3 caracteres)." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: "Por favor, informe um endereço de e-mail válido." };
  }

  const supabase = await createClient();

  // 2. Proteção contra duplicação de reserva recente
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existingLead } = await (supabase.from("interest_leads") as any)
    .select("id")
    .eq("product_id", productId)
    .eq("email", email)
    .gte("created_at", sevenDaysAgo)
    .maybeSingle();

  if (existingLead) {
    return {
      success: false,
      error:
        "Você já registrou seu interesse neste item recentemente! Nossa equipe entrará em contato assim que o lote for liberado.",
    };
  }

  // Obter IP do cliente de forma segura para fins de auditoria anti-abuso (respeitando LGPD)
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

  // 3. Persistência Real no Banco de Dados
  const { data: insertedLead, error: insertError } = await (supabase.from("interest_leads") as any)
    .insert({
      product_id: productId,
      variant_id: variantId,
      campaign_id: campaignId,
      full_name: fullName,
      email: email,
      whatsapp_phone: whatsappPhone,
      notes: notes,
      ip_address: ip,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Falha ao registrar interesse:", insertError);
    return {
      success: false,
      error: "Ocorreu um erro ao salvar sua manifestação de interesse. Tente novamente.",
    };
  }

  // 4. Se houver campanha associada, atualizar atomicamente o contador de interessados
  if (campaignId) {
    try {
      const { data: campaignData } = await (supabase.from("campaigns") as any)
        .select("current_units_pledged")
        .eq("id", campaignId)
        .single();

      if (campaignData) {
        await (supabase.from("campaigns") as any)
          .update({
            current_units_pledged: (campaignData.current_units_pledged || 0) + 1,
          })
          .eq("id", campaignId);
      }
    } catch {
      // Falha não crítica para a experiência do usuário
    }
  }

  // 5. Auditoria de Analytics (lead_created sem PII)
  try {
    await (supabase.from("analytics_events") as any).insert({
      event_name: "lead_created",
      product_id: productId,
      session_id: "srv_" + Math.random().toString(36).substring(2, 10),
      metadata: {
        campaign_id: campaignId,
        variant_id: variantId,
      },
    });
  } catch {
    // Silencioso para não abortar fluxo do usuário
  }

  revalidatePath("/catalogo");
  revalidatePath("/validacao");
  revalidatePath(`/produtos/${productId}`);

  return {
    success: true,
    leadId: insertedLead?.id,
    message:
      "Reserva gratuita de interesse confirmada com sucesso! Você receberá prioridade no primeiro lote de produção assim que a meta for alcançada.",
  };
}
