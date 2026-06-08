import { NextResponse } from "next/server";
import { getCurrentSessionUser, listCurrentUserSessions } from "@/lib/access/session";

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

  const sessions = await listCurrentUserSessions(user.id);

  return NextResponse.json(
    {
      ok: true,
      sessions,
    },
    { status: 200 },
  );
}
