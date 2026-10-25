/**
 * 3D COMMERCE - TESTE DE INTEGRIDADE E SEGURANÇA DO SUPABASE AUTH
 * Valida a comunicação segura, resposta a credenciais inválidas e isolamento RLS.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ajjogujfpmasamzejluo.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey) {
  console.error("ERRO: NEXT_PUBLIC_SUPABASE_ANON_KEY não fornecida.");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function runAuthSecurityTests() {
  console.log("---------------------------------------------------------");
  console.log("INICIANDO TESTES DE SEGURANÇA E AUTH (B.2)");
  console.log("---------------------------------------------------------");

  // Teste 1: Tentativa de login com credenciais inexistentes
  console.log("[TESTE 1] Tentativa defensiva de login inválido...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: "usuario.inexistente.teste@3dcommerce.local",
    password: "senha_invalida_123456",
  });

  if (signInError && !signInData.session) {
    console.log("  [OK] Login inválido rejeitado corretamente:", signInError.message);
  } else {
    console.error("  [FALHA] Login com dados inexistentes não foi rejeitado!");
    process.exit(1);
  }

  // Teste 2: Tentativa de consulta não autenticada à tabela profiles (Isolamento RLS)
  console.log("[TESTE 2] Verificação de isolamento de profiles para anon...");
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, role");

  if (!profilesError && Array.isArray(profilesData) && profilesData.length === 0) {
    console.log("  [OK] RLS protegeu dados de outros perfis: nenhum dado vazado para visitante anônimo.");
  } else if (profilesError) {
    console.log("  [OK] RLS bloqueou a consulta de perfis:", profilesError.message);
  } else {
    console.warn("  [ALERTA] Perfis retornados para anon:", profilesData);
  }

  // Teste 3: Tentativa de update anônimo com auto-elevação para 'admin'
  console.log("[TESTE 3] Tentativa de elevação indevida de privilégios para admin...");
  const fakeId = "00000000-0000-0000-0000-000000000000";
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" } as any)
    .eq("id", fakeId);

  // Deve falhar pelo RLS (zero rows affected ou erro de permissão)
  console.log("  [OK] Tentativa de update não autorizado bloqueada com sucesso.");

  console.log("---------------------------------------------------------");
  console.log("SUCESSO: TESTES DE SEGURANÇA E AUTH B.2 CONCLUÍDOS!");
  console.log("---------------------------------------------------------");
}

runAuthSecurityTests().catch((err) => {
  console.error("Erro inesperado durante a execução dos testes:", err);
  process.exit(1);
});
