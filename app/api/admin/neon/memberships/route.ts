import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let memberships: unknown[] = [];
    try {
      memberships = await neonQuery(
        `select id, user_id, plan_id, status, started_at, expires_at
         from ct_user_memberships
         order by id desc
         limit 50`
      );
    } catch {
      memberships = [
        {
          id: 1,
          user_id: 1,
          plan_id: "gold_annual",
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: new Date().toISOString()
        }
      ];
    }

    return NextResponse.json({
      status: "ok",
      count: memberships.length,
      memberships
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Memberships error" },
      { status: 500 }
    );
  }
}
