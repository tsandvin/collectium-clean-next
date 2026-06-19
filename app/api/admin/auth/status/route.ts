import { NextResponse } from "next/server";
import { runAuthControlCheck } from "@/lib/access/auth-control";

import { protectAdminApi } from "@/lib/auth/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await protectAdminApi();
  if (guard) return guard;

  const check = await runAuthControlCheck();

  return NextResponse.json(check, {
    status: check.database.status === "OK" ? 200 : 500,
  });
}
