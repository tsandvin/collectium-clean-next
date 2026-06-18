/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon auth register API
 *
 * Definering / formÃ¥l:
 * Registrerer ny bruker i Neon/Postgres og oppretter session-cookie.
 *
 * BruksomrÃ¥de:
 * Brukes av /registrering.
 *
 * BerÃ¸rte sider / routes:
 * - /registrering
 * - /api/auth/register
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.register
 * - auth.session.create
 *
 * BerÃ¸rte API-ruter:
 * - POST /api/auth/register
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
 * log_action: register
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0005 / CHANGE-2026-06-10-0002
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { neonOne, neonQuery } from "@/lib/db/neon";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { CT_SESSION_COOKIE, createSessionToken, createUserSession } from "@/lib/auth/neon-session";

export const dynamic = "force-dynamic";

type ExistingUserRow = { id: number };
type NewUserRow = {
  id: number;
  public_id: string;
  email: string;
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

function normalizeName(value: unknown, fallbackEmail: string): string {
  if (typeof value === "string" && value.trim().length >= 2) {
    return value.trim().slice(0, 120);
  }

  return fallbackEmail.split("@")[0] || "Collectium bruker";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = normalizeName(body.display_name ?? body.displayName, email);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, message: "Skriv inn en gyldig e-postadresse.", mode: "neon_register" },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { ok: false, message: passwordError, mode: "neon_register" },
        { status: 400 },
      );
    }

    const existing = await neonOne<ExistingUserRow>(
      `SELECT id FROM ct_users WHERE lower(email) = lower($1) LIMIT 1`,
      [email],
    );

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Det finnes allerede en bruker med denne e-posten.", mode: "neon_register" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const rows = await neonQuery<NewUserRow>(
      `
        INSERT INTO ct_users (
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
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid()::text,
          lower($1),
          $2,
          $3,
          null,
          'no',
          'collectium',
          'active',
          'unverified',
          'pending',
          'user',
          'free',
          false,
          true,
          now(),
          now()
        )
        RETURNING
          id,
          public_id,
          email,
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
      `,
      [email, passwordHash, displayName],
    );

    const user = rows[0];
    const token = createSessionToken();
    await createUserSession(user.id, token);

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
        mode: "neon_register",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown register error";
    return NextResponse.json(
      { ok: false, message: "Registration failed", error: message, mode: "neon_register" },
      { status: 500 },
    );
  }
}
