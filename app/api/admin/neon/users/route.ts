import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let users: unknown[] = [];
    try {
      users = await neonQuery(
        `select id, username, email, is_admin, role, membership_level, created_at, last_active_at
         from ct_users
         order by id desc
         limit 50`
      );
    } catch {
      users = [
        {
          id: 1,
          username: "admin_placeholder",
          email: "admin@collectium.no",
          is_admin: true,
          role: "admin",
          membership_level: "gold",
          created_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        }
      ];
    }

    return NextResponse.json({
      status: "ok",
      count: users.length,
      users
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Users error" },
      { status: 500 }
    );
  }
}
