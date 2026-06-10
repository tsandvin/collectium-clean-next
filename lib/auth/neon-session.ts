/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon session helper
 *
 * Definering / formÃ¥l:
 * Oppretter, leser og avslutter session i Neon/Postgres.
 *
 * BruksomrÃ¥de:
 * Brukes av auth API-rutene.
 *
 * BerÃ¸rte sider / routes:
 * - /login
 * - /registrering
 * - /api/auth/session
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.login
 * - auth.logout
 * - auth.session.view
 *
 * BerÃ¸rte API-ruter:
 * - /api/auth/login
 * - /api/auth/logout
 * - /api/auth/session
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
 * log_action: session
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0003 / CHANGE-2026-06-10-0002
 */

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
};

function asBool(value: boolean | number): boolean {
  return value === true || value === 1;
}

export function createSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export async function createUserSession(userId: number, token: string): Promise<void> {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip");

  await neonQuery(
    `
      INSERT INTO ct_user_sessions (
        user_id,
        session_token,
        ip_address,
        user_agent,
        created_at,
        last_seen_at,
        expires_at,
        is_active
      )
      VALUES ($1, $2, $3, $4, now(), now(), now() + interval '7 days', true)
    `,
    [userId, token, ipAddress, userAgent],
  );
}

export async function getCurrentSessionUser(): Promise<CtAuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

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
        u.is_active
      FROM ct_user_sessions s
      JOIN ct_users u ON u.id = s.user_id
      WHERE s.session_token = $1
        AND s.is_active = true
        AND s.expires_at > now()
        AND u.is_active = true
      LIMIT 1
    `,
    [token],
  );

  if (!user) {
    return null;
  }

  await neonQuery(
    `
      UPDATE ct_user_sessions
      SET last_seen_at = now()
      WHERE session_token = $1
    `,
    [token],
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
    ...user,
    is_admin: asBool(user.is_admin),
    is_active: asBool(user.is_active),
  };
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CT_SESSION_COOKIE)?.value;

  if (token) {
    await neonQuery(
      `
        UPDATE ct_user_sessions
        SET is_active = false, revoked_at = now()
        WHERE session_token = $1
      `,
      [token],
    );
  }

  cookieStore.delete(CT_SESSION_COOKIE);
}

export async function logLoginAttempt(input: {
  email: string | null;
  userId: number | null;
  success: boolean;
  failureReason: string | null;
}): Promise<void> {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip");

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
