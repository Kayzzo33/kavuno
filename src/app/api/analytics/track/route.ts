import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/tracker";
import type { AnalyticsEventName } from "@/types/database.types";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    const sessionId = (json.session_id as string)?.slice(0, 100);
    const eventName = json.event_name as AnalyticsEventName;
    const entityType = json.entity_type as string | undefined;
    const entityId = json.entity_id as string | undefined;
    const rawMetadata = (json.metadata as Record<string, unknown>) || {};

    if (!sessionId || !eventName) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes" }, { status: 400 });
    }

    // Sanitização de dados pessoais (LGPD)
    const metadata = sanitizeAnalyticsMetadata(rawMetadata);

    const userAgent = req.headers.get("user-agent")?.slice(0, 250) || null;

    const supabase = createAdminClient();
    const { error } = await (supabase.from("analytics_events") as any).insert({
      session_id: sessionId,
      event_name: eventName,
      entity_type: entityType ?? "general",
      entity_id: entityId ?? null,
      metadata: metadata as any,
      user_agent: userAgent,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
