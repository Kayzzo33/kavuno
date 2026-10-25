import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin/queries";

export async function GET(req: NextRequest) {
  try {
    const { isAdmin } = await requireAdminSession();
    if (!isAdmin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const productId = req.nextUrl.searchParams.get("product_id");
    if (!productId)
      return NextResponse.json({ error: "product_id obrigatório." }, { status: 400 });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("product_variants")
      .select(
        "id, variant_name, sku, estimated_filament_weight_g, estimated_print_time_minutes"
      )
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("variant_name");

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ variants: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
