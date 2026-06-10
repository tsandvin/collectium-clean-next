/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon auth logout API
 *
 * Definering / formÃ¥l:
 * Avslutter aktiv Neon-session og sletter session-cookie.
 *
 * BruksomrÃ¥de:
 * Brukes av topbar og Min side.
 *
 * BerÃ¸rte sider / routes:
 * - /login
 * - /min-side
 * - /api/auth/logout
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.logout
 *
 * BerÃ¸rte API-ruter:
 * - POST /api/auth/logout
 *
 * BerÃ¸rte tabeller / views:
 * - ct_user_sessions
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: auth
 * log_action: logout
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0007 / CHANGE-2026-06-10-0002
 */

import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth/neon-session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await revokeCurrentSession();
    return NextResponse.json({ ok: true, authenticated: false, mode: "neon_logout" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown logout error";
    return NextResponse.json(
      { ok: false, message: "Logout failed", error: message, mode: "neon_logout" },
      { status: 500 },
    );
  }
}
