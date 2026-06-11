import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/account/security",
    source: "neon_pending",
    status: "not_connected",
    message: "Endpoint finnes, men er ikke koblet til produksjonsdata ennå."
  });
}
