import { NextResponse } from "next/server";

import { protectAdminApi } from "@/lib/auth/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await protectAdminApi();
  if (guard) return guard;

  try {
    return NextResponse.json({
      status: "ok",
      vercel: {
        environment: process.env.VERCEL_ENV || "development",
        url: process.env.VERCEL_URL || "localhost:3000",
        region: process.env.VERCEL_REGION || "local",
      },
      deploy_gate: {
        status: "OPEN",
        blockers: [],
      }
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Deploy status error" },
      { status: 500 }
    );
  }
}
