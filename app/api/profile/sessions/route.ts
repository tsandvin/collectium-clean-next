import { NextResponse } from "next/server";
import { getCurrentSessionUser, listCurrentUserSessions } from "@/lib/access/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown profile sessions error";

    return NextResponse.json(
      {
        ok: false,
        message: "Profile sessions API failed",
        error: message,
      },
      { status: 500 },
    );
  }
}
