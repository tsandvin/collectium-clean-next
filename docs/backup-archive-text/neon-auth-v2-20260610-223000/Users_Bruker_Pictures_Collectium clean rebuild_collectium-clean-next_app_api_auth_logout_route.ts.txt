import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/access/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await revokeCurrentSession();

  return NextResponse.json(
    {
      ok: true,
      message: "Logged out",
    },
    { status: 200 },
  );
}
