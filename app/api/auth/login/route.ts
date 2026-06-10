/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon auth login API
 *
 * Definering / formÃ¥l:
 * Logger inn bruker mot Neon/Postgres og oppretter session-cookie.
 *
 * BruksomrÃ¥de:
 * Brukes av /login.
 *
 * BerÃ¸rte sider / routes:
 * - /login
 * - /api/auth/login
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.login
 * - auth.session.create
 *
 * BerÃ¸rte API-ruter:
 * - POST /api/auth/login
 *
 * BerÃ¸rte tabeller / views:
 * - ct_users
 * - ct_user_sessions
 * - ct_login_attempts
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: auth
 * log_action: login
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0004 / CHANGE-2026-06-10-0002
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { neonOne, neonQuery } from "@/lib/db/neon";
import { verifyPassword } from "@/lib/auth/password";
import {
  CT_SESSION_COOKIE,
  createSessionToken,
  createUserSession,
  logLoginAttempt,
} from "@/lib/auth/neon-session";

export const dynamic = "force-dynamic";

type LoginUserRow = {
  id: number;
  public_id: string;
  email: string;
  password_hash: string | null;
  display_name: string;
  public_display_name: string | null;
  preferred_language: string;
  preferred_theme: string;
  account_status: string;
  email_status: string;
  admin_approval_status: string;
  role: string;
  membership_level: string;
  is_admin: boolean;
  is_active: boolean;
};

export async function POST(request: Request) {
  let email: string | null = null;

  try {
    const body = await request.json();

    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    const password = typeof body.password === "string" ? body.password : null;

    if (!email || !password) {
      await logLoginAttempt({
        email,
        userId: null,
        success: false,
        failureReason: "missing_credentials",
      }).catch(() => undefined);

      return NextResponse.json(
        { ok: false, message: "E-post og passord mÃ¥ fylles ut.", mode: "neon_login" },
        { status: 400 },
      );
    }

    const user = await neonOne<LoginUserRow>(
      `
        SELECT
          id,
          public_id,
          email,
          password_hash,
          display_name,
          public_display_name,
          preferred_language,
          preferred_theme,
          account_status,
          email_status,
          admin_approval_status,
          role,
          membership_level,
          is_admin,
          is_active
        FROM ct_users
        WHERE lower(email) = lower($1)
        LIMIT 1
      `,
      [email],
    );

    if (!user || !user.password_hash) {
      await logLoginAttempt({
        email,
        userId: user?.id ?? null,
        success: false,
        failureReason: "invalid_credentials",
      }).catch(() => undefined);

      return NextResponse.json(
        { ok: false, message: "Feil e-post eller passord.", mode: "neon_login" },
        { status: 401 },
      );
    }

    if (!user.is_active || user.account_status !== "active") {
      await logLoginAttempt({
        email,
        userId: user.id,
        success: false,
        failureReason: "account_not_active",
      }).catch(() => undefined);

      return NextResponse.json(
        { ok: false, message: "Brukerkontoen er ikke aktiv.", mode: "neon_login" },
        { status: 403 },
      );
    }

    const passwordOk = await verifyPassword(password, user.password_hash);

    if (!passwordOk) {
      await logLoginAttempt({
        email,
        userId: user.id,
        success: false,
        failureReason: "invalid_credentials",
      }).catch(() => undefined);

      return NextResponse.json(
        { ok: false, message: "Feil e-post eller passord.", mode: "neon_login" },
        { status: 401 },
      );
    }

    const token = createSessionToken();
    await createUserSession(user.id, token);

    await neonQuery(
      `
        UPDATE ct_users
        SET last_login_at = now(), last_active_at = now(), is_online = true
        WHERE id = $1
      `,
      [user.id],
    );

    await logLoginAttempt({
      email,
      userId: user.id,
      success: true,
      failureReason: null,
    }).catch(() => undefined);

    const cookieStore = await cookies();
    cookieStore.set(CT_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(
      {
        ok: true,
        authenticated: true,
        mode: "neon_login",
        user: {
          id: user.id,
          public_id: user.public_id,
          email: user.email,
          display_name: user.display_name,
          public_display_name: user.public_display_name,
          preferred_language: user.preferred_language,
          preferred_theme: user.preferred_theme,
          account_status: user.account_status,
          email_status: user.email_status,
          admin_approval_status: user.admin_approval_status,
          role: user.role,
          membership_level: user.membership_level,
          is_admin: user.is_admin,
          is_active: user.is_active,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown login error";

    await logLoginAttempt({
      email,
      userId: null,
      success: false,
      failureReason: "server_error",
    }).catch(() => undefined);

    return NextResponse.json(
      { ok: false, message: "Login failed", error: message, mode: "neon_login" },
      { status: 500 },
    );
  }
}
