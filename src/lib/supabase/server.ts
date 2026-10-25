import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Cliente Supabase para execução no servidor (Server Components, Server Actions e Route Handlers).
 * Gerencia a leitura e escrita de tokens de sessão em cookies HTTP-Only de maneira segura.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Credenciais públicas do Supabase ausentes no ambiente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // O método `setAll` foi chamado em um Server Component.
          // Isto pode ser ignorado se houver middleware renovando as sessões.
        }
      },
    },
  });
}
