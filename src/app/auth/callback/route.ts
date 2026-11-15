import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/perfil";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Se for admin, direciona para o painel /admin em vez de perfil
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await (supabase.from("profiles") as any)
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Se houver erro ou ausência de código, redireciona para login com alerta
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent("Código de autenticação inválido ou expirado.")}`, request.url)
  );
}
