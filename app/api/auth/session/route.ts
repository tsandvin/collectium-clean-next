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

    if (!user) {
      return NextResponse.json({
        status: "ok",
        authenticated: false,
        user: null
      });
    }

    return NextResponse.json({
      status: "ok",
      authenticated: true,
      user: {
        id: String(user.id),
        displayName: user.display_name,
        display_name: user.display_name,
        email: user.email,
        role: user.role,
        isAdmin: user.is_admin,
        is_admin: user.is_admin,
        membershipLevel: user.is_admin ? null : user.membership_level,
        membership_level: user.membership_level,
        public_id: user.public_id,
        public_display_name: user.public_display_name,
        preferred_language: user.preferred_language,
        preferred_theme: user.preferred_theme,
        account_status: user.account_status,
        email_status: user.email_status,
        admin_approval_status: user.admin_approval_status,
        is_active: user.is_active,
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown session error";
    return NextResponse.json(
      { status: "error", ok: false, authenticated: false, user: null, message: "Session failed", error: message },
      { status: 500 },
    );
  }
}
