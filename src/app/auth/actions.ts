"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Cadastro de novo usuário.
 * Cria a conta no Supabase Auth. O trigger on_auth_user_created sincroniza public.profiles.
 */
export async function signUpAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const fullName = (formData.get("fullName") as string) || "";
  const marketingConsent = formData.get("marketingConsent") === "on";

  if (!email || !password) {
    return { success: false, error: "E-mail e senha são obrigatórios." };
  }

  if (password.length < 6) {
    return { success: false, error: "A senha deve conter no mínimo 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "As senhas não coincidem." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        marketing_consent: marketingConsent,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Se a confirmação de e-mail estiver ativa e não houver sessão imediata
  if (data.user && !data.session) {
    return {
      success: true,
      message:
        "Cadastro realizado com sucesso! Um e-mail de confirmação foi enviado. Por favor, verifique sua caixa de entrada.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/perfil");
}

/**
 * Login com E-mail e Senha.
 * Cria cookies HTTP-Only de sessão através do createServerClient.
 */
export async function signInAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/perfil";

  if (!email || !password) {
    return { success: false, error: "Por favor, preencha o e-mail e a senha." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, error: "E-mail ou senha incorretos." };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: "E-mail ainda não confirmado. Verifique o link de confirmação em sua caixa postal.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Encerramento de sessão (Logout).
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Solicitação de recuperação de senha.
 * Dispara e-mail com link contendo token PKCE redirecionando para /auth/callback.
 */
export async function forgotPasswordAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, error: "Informe o endereço de e-mail." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://kavuno.com.br";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message:
      "Se o e-mail estiver cadastrado, você receberá um link de redefinição de senha em instantes.",
  };
}

/**
 * Definição da nova senha pelo usuário autenticado via link de recuperação.
 */
export async function resetPasswordAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    return { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "As senhas digitadas não coincidem." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Senha atualizada com sucesso! Você já pode acessar sua conta.",
  };
}

/**
 * Atualização dos dados cadastrais do cliente.
 * SEGURANÇA: Atualiza estritamente os campos pessoais permitidos (full_name, phone, marketing_consent).
 * A coluna 'role' nunca é enviada na query, preservando a proteção do banco.
 */
export async function updateProfileAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const fullName = (formData.get("fullName") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const marketingConsent = formData.get("marketingConsent") === "on";

  const { error } = await (supabase.from("profiles") as any)
    .update({
      full_name: fullName,
      phone: phone,
      marketing_consent: marketingConsent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: `Falha ao atualizar perfil: ${error.message}` };
  }

  revalidatePath("/perfil");
  return { success: true, message: "Dados cadastrais atualizados com sucesso!" };
}
