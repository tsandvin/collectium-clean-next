import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ctQuery } from "@/lib/db/mariadb";
import {
  CT_SESSION_COOKIE,
  createSessionToken,
  createUserSession,
  logLoginAttempt,
} from "@/lib/access/session";

export const dynamic = "force-dynamic";

type LoginUserRow = {
  id: number | bigint;
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
  is_admin: number | bigint;
  is_active: number | bigint;
};

function toNumber(value: number | bigint): number {
  return typeof value === "bigint" ? Number(value) : value;
}

function normalizeBcryptHash(hash: string): string {
  if (hash.startsWith("$2y$")) {
    return `$2b$${hash.slice(4)}`;
  }

  return hash;
}

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
      });

      return NextResponse.json(
        {
          ok: false,
          message: "E-post og passord må fylles ut.",
        },
        { status: 400 },
      );
    }

    const users = await ctQuery<LoginUserRow>(
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
          is_admin,
          is_active
        FROM ct_users
        WHERE email = ?
        LIMIT 1
      `,
      [email],
    );

    const user = users[0] ?? null;

    if (!user || !user.password_hash) {
      await logLoginAttempt({
        email,
        userId: user ? toNumber(user.id) : null,
        success: false,
        failureReason: "invalid_credentials",
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Feil e-post eller passord.",
        },
        { status: 401 },
      );
    }

    const userId = toNumber(user.id);
    const isActive = toNumber(user.is_active);
    const isAdmin = toNumber(user.is_admin);

    if (isActive !== 1 || user.account_status !== "active") {
      await logLoginAttempt({
        email,
        userId,
        success: false,
        failureReason: "account_not_active",
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Brukerkontoen er ikke aktiv.",
        },
        { status: 403 },
      );
    }

    const passwordOk = await bcrypt.compare(password, normalizeBcryptHash(user.password_hash));

    if (!passwordOk) {
      await logLoginAttempt({
        email,
        userId,
        success: false,
        failureReason: "invalid_credentials",
      });

      return NextResponse.json(
        {
          ok: false,
          message: "Feil e-post eller passord.",
        },
        { status: 401 },
      );
    }

    const token = createSessionToken();

    await createUserSession(userId, token);

    await ctQuery(
      `
        UPDATE ct_users
        SET last_login_at = NOW(), last_active_at = NOW(), is_online = 1
        WHERE id = ?
      `,
      [userId],
    );

    await logLoginAttempt({
      email,
      userId,
      success: true,
      failureReason: null,
    });

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
        user: {
          id: userId,
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
          is_admin: isAdmin,
          is_active: isActive,
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
      {
        ok: false,
        message: "Login failed",
        error: message,
      },
      { status: 500 },
    );
  }
}
