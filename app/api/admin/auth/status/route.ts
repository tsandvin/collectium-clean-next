import { NextResponse } from "next/server";
import { runAuthControlCheck } from "@/lib/access/auth-control";

export const dynamic = "force-dynamic";

export async function GET() {
  const check = await runAuthControlCheck();

  return NextResponse.json(check, {
    status: check.database.status === "OK" ? 200 : 500,
  });
}
