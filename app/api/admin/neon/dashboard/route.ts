import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let usersCount = 0;
    let sessionsCount = 0;
    let alertsCount = 0;
    let isDbConnected = false;

    try {
      const uRes = await neonQuery<{ count: string }>("select count(*)::text as count from ct_users");
      usersCount = Number(uRes[0]?.count || 0);
      
      const sRes = await neonQuery<{ count: string }>("select count(*)::text as count from ct_user_sessions");
      sessionsCount = Number(sRes[0]?.count || 0);
      
      const aRes = await neonQuery<{ count: string }>("select count(*)::text as count from ct_admin_alerts");
      alertsCount = Number(aRes[0]?.count || 0);
      
      isDbConnected = true;
    } catch {
      isDbConnected = false;
    }

    return NextResponse.json({
      status: "ok",
      database: "Neon Postgres",
      connected: isDbConnected,
      metrics: {
        users: usersCount,
        active_sessions: sessionsCount,
        admin_alerts: alertsCount,
      },
      deploy_gate: {
        status: isDbConnected ? "OPEN" : "BLOCKED",
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Dashboard error" },
      { status: 500 }
    );
  }
}
