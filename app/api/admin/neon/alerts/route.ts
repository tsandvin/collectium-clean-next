import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

import { protectAdminApi } from "@/lib/auth/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await protectAdminApi();
  if (guard) return guard;

  try {
    let alerts: unknown[] = [];
    try {
      alerts = await neonQuery(
        `select id, created_at, alert_type, title, severity, message, is_resolved
         from ct_admin_alerts
         order by id desc
         limit 50`
      );
    } catch {
      // Fallback
      alerts = [
        {
          id: 1,
          created_at: new Date().toISOString(),
          alert_type: "system",
          title: "Tabell mangler",
          severity: "varsel",
          message: "Tabellen ct_admin_alerts mangler i Neon.",
          is_resolved: false
        }
      ];
    }

    return NextResponse.json({
      status: "ok",
      count: alerts.length,
      alerts
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Alerts error" },
      { status: 500 }
    );
  }
}
