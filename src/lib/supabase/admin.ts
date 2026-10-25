import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente com privilégios administrativos elevados (SERVICE ROLE).
 * ATENÇÃO: NUNCA importe ou utilize esta função em Client Components ("use client").
 * Utilizado exclusivamente em Webhooks do Mercado Pago, reconciliações financeiras
 * e tarefas de background no servidor.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Operação administrativa indisponível: SUPABASE_SERVICE_ROLE_KEY não configurada no servidor."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
