import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/access/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "Not authenticated",
      },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      user,
    },
    { status: 200 },
  );
}
