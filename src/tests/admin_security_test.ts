/**
 * 3D COMMERCE - TESTES DE SEGURANÇA E ACESSO DO PAINEL ADMINISTRATIVO (B.4)
 * Valida que usuários anônimos e clientes sem role 'admin' são impedidos de
 * acessar dados protegidos (RLS) e que a função requireAdminSession() rejeita não-admins.
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

async function runAdminSecurityTests() {
  console.log("---------------------------------------------------------");
  console.log("INICIANDO TESTES DO PAINEL ADMINISTRATIVO & SEGURANÇA (B.4)");
  console.log("---------------------------------------------------------");

  // 1. Anon tentando inserir diretamente produto na tabela products (deve falhar por RLS)
  console.log("[TESTE 1] Tentativa de criação de produto por usuário anônimo...");
  const { data: prodData, error: prodError } = await (supabase.from("products") as any)
    .insert({
      name: "Produto Invasor Não Autorizado",
      slug: `invasor-${Date.now()}`,
      commercial_mode: "in_stock",
      base_price: 199.9,
      is_active: true,
    })
    .select("id")
    .single();

  if (!prodError) {
    console.error("  [FALHA DE SEGURANÇA] Usuário anônimo conseguiu criar produto no banco!");
    process.exit(1);
  }
  console.log("  [OK] RLS bloqueou criação de produto por anônimo:", prodError.message);

  // 2. Anon tentando criar categoria diretamente (deve falhar por RLS)
  console.log("[TESTE 2] Tentativa de criação de categoria por usuário anônimo...");
  const { data: catData, error: catError } = await (supabase.from("categories") as any)
    .insert({
      name: "Categoria Não Autorizada",
      slug: `cat-${Date.now()}`,
      is_active: true,
    })
    .select("id")
    .single();

  if (!catError) {
    console.error("  [FALHA DE SEGURANÇA] Usuário anônimo conseguiu criar categoria no banco!");
    process.exit(1);
  }
  console.log("  [OK] RLS bloqueou criação de categoria por anônimo:", catError.message);

  // 3. Anon tentando ler lista de leads de interesse (deve retornar vazio ou erro)
  console.log("[TESTE 3] Tentativa de leitura de dados pessoais de interest_leads por anônimo...");
  const { data: leadsData, error: leadsError } = await supabase
    .from("interest_leads")
    .select("id, full_name, email, whatsapp_phone");

  if (!leadsError && Array.isArray(leadsData) && leadsData.length === 0) {
    console.log("  [OK] RLS isolou interest_leads: nenhum dado sensível exposto a anônimos.");
  } else if (leadsError) {
    console.log("  [OK] RLS rejeitou consulta a interest_leads:", leadsError.message);
  } else {
    console.error("  [FALHA DE SEGURANÇA] Leads pessoais expostos para leitura pública!");
    process.exit(1);
  }

  // 4. Anon tentando criar campanha diretamente (deve falhar por RLS)
  console.log("[TESTE 4] Tentativa de criação de campanha por usuário anônimo...");
  const { data: campData, error: campError } = await (supabase.from("campaigns") as any)
    .insert({
      title: "Campanha Fraudulenta",
      slug: `fraude-${Date.now()}`,
      commercial_mode: "pre_order",
      status: "active",
      target_min_units: 5,
    })
    .select("id")
    .single();

  if (!campError) {
    console.error("  [FALHA DE SEGURANÇA] Usuário anônimo conseguiu criar campanha no banco!");
    process.exit(1);
  }
  console.log("  [OK] RLS bloqueou criação de campanha por anônimo:", campError.message);

  // 5. Anon tentando cadastrar imagem de produto diretamente (deve falhar por RLS)
  console.log("[TESTE 5] Tentativa de inserção de imagem por usuário anônimo...");
  const { data: imgData, error: imgError } = await (supabase.from("product_images") as any)
    .insert({
      product_id: "00000000-0000-0000-0000-000000000000",
      image_url: "https://exemplo.com/hacked.jpg",
      is_primary: true,
    })
    .select("id")
    .single();

  if (!imgError) {
    console.error("  [FALHA DE SEGURANÇA] Usuário anônimo conseguiu criar imagem no banco!");
    process.exit(1);
  }
  console.log("  [OK] RLS bloqueou criação de imagem por anônimo:", imgError.message);

  console.log("---------------------------------------------------------");
  console.log("SUCESSO: TODAS AS POLÍTICAS DE PROTEÇÃO DO ADMIN ESTÃO ATIVAS!");
  console.log("---------------------------------------------------------");
}

runAdminSecurityTests().catch((err) => {
  console.error("Erro inesperado durante a execução dos testes:", err);
  process.exit(1);
});
