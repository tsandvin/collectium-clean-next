import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

import { protectAdminApi } from "@/lib/auth/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await protectAdminApi();
  if (guard) return guard;

  try {
    let logs: unknown[] = [];
    try {
      logs = await neonQuery(
        `select id, created_at, event_source, event_type, status, severity, message_no, suggested_fix_no
         from ct_control_event_logs
         order by id desc
         limit 50`
      );
    } catch {
      // Fallback if table doesn't exist
      logs = [
        {
          id: 1,
          created_at: new Date().toISOString(),
          event_source: "system",
          event_type: "fallback",
          status: "VARSEL",
          severity: "warning",
          message_no: "Tabellen ct_control_event_logs er ikke opprettet i Neon ennå.",
          suggested_fix_no: "Kjør database-bootstrap."
        }
      ];
    }

    return NextResponse.json({
      status: "ok",
      count: logs.length,
      logs
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Logs error" },
      { status: 500 }
    );
  }
}
