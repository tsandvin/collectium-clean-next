import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

import { protectAdminApi } from "@/lib/auth/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await protectAdminApi();
  if (guard) return guard;

  try {
    let processes: unknown[] = [];
    try {
      processes = await neonQuery(
        `select id, process_name, status, message, started_at, completed_at, duration_seconds
         from ct_process_log
         order by id desc
         limit 50`
      );
    } catch {
      processes = [
        {
          id: 1,
          process_name: "Catalog Import Staging",
          status: "VARSEL",
          message: "ct_process_log tabellen er ikke opprettet i Neon.",
          started_at: new Date().toISOString(),
          completed_at: null,
          duration_seconds: 0
        }
      ];
    }

    return NextResponse.json({
      status: "ok",
      count: processes.length,
      processes
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Processes error" },
      { status: 500 }
    );
  }
}
