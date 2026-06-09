import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/system/route-test",
    commit_test: true,
    checked_at: new Date().toISOString()
  });
}
