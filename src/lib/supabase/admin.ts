import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente com privilégios administrativos elevados (SERVICE ROLE).
 * ATENÇÃO: NUNCA importe ou utilize esta função em Client Components ("use client").
 * Utilizado exclusivamente em Webhooks do Mercado Pago, reconciliações financeiras
 * e tarefas de background no servidor.
 */
/**
 * Cliente com privilégios administrativos (SERVICE ROLE se configurada, ou fallback para createClient).
 * Utilizado em Server Components / Server Actions administrativas protegidas por requireAdminSession.
 */
export async function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && serviceRoleKey !== "your_service_role_key_here") {
    return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Fallback seguro: se a service_role_key não estiver configurada no .env da Vercel,
  // utiliza o cliente de sessão autenticado (onde o usuário admin possui bypass via RLS is_admin())
  const { createClient } = await import("@/lib/supabase/server");
  return await createClient();
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && serviceRoleKey !== "your_service_role_key_here") {
    return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Se não estiver definida em runtime síncrono, retorna cliente com anonKey para não crashar com Server Exception
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createSupabaseClient<Database>(supabaseUrl || "", anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
