import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/access/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: true,
        authenticated: false,
        user: null,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      authenticated: true,
      user,
    },
    { status: 200 },
  );
}
