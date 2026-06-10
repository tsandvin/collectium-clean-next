/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon auth session API
 *
 * Definering / formÃ¥l:
 * Leser aktiv session fra Neon/Postgres.
 *
 * BruksomrÃ¥de:
 * Brukes av topbar, login, registrering og Min side.
 *
 * BerÃ¸rte sider / routes:
 * - /login
 * - /registrering
 * - /min-side
 * - /api/auth/session
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.session.view
 *
 * BerÃ¸rte API-ruter:
 * - GET /api/auth/session
 *
 * BerÃ¸rte tabeller / views:
 * - ct_users
 * - ct_user_sessions
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: auth
 * log_action: session.view
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0006 / CHANGE-2026-06-10-0002
 */

import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/neon-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();

    return NextResponse.json({
      ok: true,
      authenticated: Boolean(user),
      user,
      mode: "neon_session",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown session error";
    return NextResponse.json(
      { ok: false, authenticated: false, user: null, message: "Session failed", error: message, mode: "neon_session" },
      { status: 500 },
    );
  }
}
