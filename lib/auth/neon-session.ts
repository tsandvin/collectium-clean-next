import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { neonOne, neonQuery } from "@/lib/db/neon";

export const CT_SESSION_COOKIE = "ct_session";

export type CtAuthUser = {
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

type SessionUserRow = CtAuthUser & {
  is_admin: boolean | number;
  is_active: boolean | number;
  session_id: number;
};

function asBool(value: boolean | number): boolean {
  return value === true || value === 1;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createSessionToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

function getClientIpFromHeaders(headerStore: Headers): string | null {
  const forwardedFor = headerStore.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return headerStore.get("x-real-ip");
}

export async function createUserSession(userId: number, token: string): Promise<void> {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const ipAddress = getClientIpFromHeaders(headerStore);
  const tokenHash = sha256(token);

  await neonQuery(
    `
      INSERT INTO ct_user_sessions (
        user_id,
        session_token_hash,
        ip_address,
        user_agent,
        created_at,
        last_seen_at,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        now(),
        now(),
        now() + interval '7 days'
      )
    `,
    [userId, tokenHash, ipAddress, userAgent],
  );
}

export async function getCurrentSessionUser(): Promise<CtAuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = sha256(token);

  const user = await neonOne<SessionUserRow>(
    `
      SELECT
        u.id,
        u.public_id,
        u.email,
        u.display_name,
        u.public_display_name,
        u.preferred_language,
        u.preferred_theme,
        u.account_status,
        u.email_status,
        u.admin_approval_status,
        u.role,
        u.membership_level,
        u.is_admin,
        u.is_active,
        s.id as session_id
      FROM ct_user_sessions s
      JOIN ct_users u ON u.id = s.user_id
      WHERE s.session_token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.is_active = true
        AND u.account_status = 'active'
      LIMIT 1
    `,
    [tokenHash],
  );

  if (!user) {
    return null;
  }

  await neonQuery(
    `
      UPDATE ct_user_sessions
      SET last_seen_at = now()
      WHERE id = $1
    `,
    [user.session_id],
  ).catch(() => undefined);

  await neonQuery(
    `
      UPDATE ct_users
      SET last_active_at = now(), is_online = true
      WHERE id = $1
    `,
    [user.id],
  ).catch(() => undefined);

  return {
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
    is_admin: asBool(user.is_admin),
    is_active: asBool(user.is_active),
  };
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CT_SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = sha256(token);

    await neonQuery(
      `
        UPDATE ct_user_sessions
        SET revoked_at = now()
        WHERE session_token_hash = $1
          AND revoked_at IS NULL
      `,
      [tokenHash],
    );
  }

  cookieStore.set(CT_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function logLoginAttempt(input: {
  email: string | null;
  userId: number | null;
  success: boolean;
  failureReason: string | null;
}): Promise<void> {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const ipAddress = getClientIpFromHeaders(headerStore);

  await neonQuery(
    `
      INSERT INTO ct_login_attempts (
        email,
        user_id,
        success,
        failure_reason,
        ip_address,
        user_agent,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, now())
    `,
    [input.email, input.userId, input.success, input.failureReason, ipAddress, userAgent],
  );
}
