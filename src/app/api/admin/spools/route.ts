import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin/queries";

export async function GET(req: NextRequest) {
  try {
    const { isAdmin } = await requireAdminSession();
    if (!isAdmin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const rawStatus = req.nextUrl.searchParams.get("status");
    const supabase = createAdminClient();

    let query = supabase
      .from("filament_spools")
      .select("id, label, material, color_name, color_hex, current_weight_g, status")
      .order("label");

    if (rawStatus) {
      const statuses = rawStatus.split(",").map((s) => s.trim()) as any;
      query = query.in("status", statuses);
    }

    const { data, error } = await query;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ spools: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
