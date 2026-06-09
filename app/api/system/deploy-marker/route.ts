import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "deploy-marker",
    route: "/api/system/deploy-marker",
    marker: "identity-relation-bootstrap-route-check",
    expected_routes: [
      "/api/system/identity-relation-bootstrap",
      "/api/system/id-mapping-check",
      "/api/system/relation-path-check",
      "/api/system/row-count-check"
    ],
    checked_at: new Date().toISOString()
  });
}
