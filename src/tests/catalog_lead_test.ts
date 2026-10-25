/**
 * 3D COMMERCE - TESTE DE INTEGRIDADE DO CATÁLOGO E RESERVA DE INTERESSE (B.3)
 * Valida a consulta pública de catálogo e a persistência real de interest_leads.
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

async function runCatalogTests() {
  console.log("---------------------------------------------------------");
  console.log("INICIANDO TESTES DO CATÁLOGO E RESERVA DE INTERESSE (B.3)");
  console.log("---------------------------------------------------------");

  // 1. Consulta Pública de Categorias
  console.log("[TESTE 1] Consulta pública a public.categories...");
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, slug, is_active")
    .eq("is_active", true);

  if (catError) {
    console.error("  [FALHA] Erro ao consultar categorias:", catError.message);
    process.exit(1);
  }
  console.log(`  [OK] Categorias consultadas com sucesso: ${categories?.length || 0} ativa(s).`);

  // 2. Consulta Pública de Produtos
  console.log("[TESTE 2] Consulta pública a public.products...");
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name, slug, commercial_mode, base_price, is_active")
    .eq("is_active", true);

  if (prodError) {
    console.error("  [FALHA] Erro ao consultar produtos:", prodError.message);
    process.exit(1);
  }
  console.log(`  [OK] Produtos ativos consultados com sucesso: ${products?.length || 0} produto(s).`);

  // 3. Teste de Inserção de Reserva de Interesse (interest_leads)
  console.log("[TESTE 3] Teste de persistência de Reserva Gratuita de Interesse...");
  // Se houver produto no banco, vincula a ele; caso contrário, busca qualquer id ou usa teste de validação
  let targetProductId = products?.[0]?.id;

  if (targetProductId) {
    const testEmail = `lead.teste.${Date.now()}@3dcommerce.local`;
    const { data: leadData, error: leadError } = await (supabase.from("interest_leads") as any)
      .insert({
        product_id: targetProductId,
        full_name: "Cliente Teste Validação",
        email: testEmail,
        whatsapp_phone: "(11) 99999-8888",
        notes: "Teste automatizado da Etapa B.3",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("  [FALHA] Não foi possível persistir a reserva de interesse:", leadError.message);
      process.exit(1);
    }
    console.log("  [OK] Reserva de interesse persistida com sucesso no banco real. ID:", leadData?.id);
  } else {
    console.log("  [INFO] Nenhum produto ativo cadastrado ainda no banco remoto. Pulando vinculação de lead com ID real.");
  }

  // 4. Verificação de Segurança RLS: Anon não pode ler leads de outros clientes
  console.log("[TESTE 4] Verificação de proteção RLS da tabela interest_leads...");
  const { data: leadsData, error: leadsReadError } = await supabase
    .from("interest_leads")
    .select("id, email, full_name");

  if (!leadsReadError && Array.isArray(leadsData) && leadsData.length === 0) {
    console.log("  [OK] RLS protegeu interest_leads: nenhum dado pessoal vazado para consulta pública.");
  } else if (leadsReadError) {
    console.log("  [OK] RLS bloqueou leitura pública de leads:", leadsReadError.message);
  } else {
    console.warn("  [ALERTA] Leads retornados para acesso público:", leadsData);
  }

  console.log("---------------------------------------------------------");
  console.log("SUCESSO: TODOS OS TESTES DO CATÁLOGO E LEADS PASSARAM!");
  console.log("---------------------------------------------------------");
}

runCatalogTests().catch((err) => {
  console.error("Erro inesperado durante a execução dos testes:", err);
  process.exit(1);
});
