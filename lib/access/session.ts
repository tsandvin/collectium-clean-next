import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { ctQuery } from "@/lib/db/mariadb";

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
  is_admin: number;
  is_active: number;
};

type SessionUserRow = {
  id: number | bigint;
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
  is_admin: number | bigint;
  is_active: number | bigint;
  session_id: number | bigint;
  expires_at: Date | string;
  revoked_at: Date | string | null;
};

type SessionRow = {
  id: number | bigint;
  user_id: number | bigint;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  created_at: Date | string;
  started_at: Date | string | null;
  ended_at: Date | string | null;
  last_seen_at: Date | string | null;
  device_type: string;
};

export type CtSessionListItem = {
  id: number;
  user_id: number;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  created_at: Date | string;
  started_at: Date | string | null;
  ended_at: Date | string | null;
  last_seen_at: Date | string | null;
  device_type: string;
};

function toNumber(value: number | bigint): number {
  return typeof value === "bigint" ? Number(value) : value;
}

export function normalizeAuthUser(row: SessionUserRow): CtAuthUser {
  return {
    id: toNumber(row.id),
    public_id: row.public_id,
    email: row.email,
    display_name: row.display_name,
    public_display_name: row.public_display_name,
    preferred_language: row.preferred_language,
    preferred_theme: row.preferred_theme,
    account_status: row.account_status,
    email_status: row.email_status,
    admin_approval_status: row.admin_approval_status,
    role: row.role,
    is_admin: toNumber(row.is_admin),
    is_active: toNumber(row.is_active),
  };
}

function normalizeSessionRow(row: SessionRow): CtSessionListItem {
  return {
    id: toNumber(row.id),
    user_id: toNumber(row.user_id),
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
    created_at: row.created_at,
    started_at: row.started_at,
    ended_at: row.ended_at,
    last_seen_at: row.last_seen_at,
    device_type: row.device_type,
  };
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createSessionToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function getClientIpFromHeaders(headersList: Headers): string | null {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return headersList.get("x-real-ip") || null;
}

export function getDeviceType(userAgent: string | null): "mobile" | "tablet" | "desktop" | "tv" | "unknown" {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();

  if (ua.includes("smart-tv") || ua.includes("smarttv") || ua.includes("tv")) return "tv";
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobile") || ua.includes("iphone") || ua.includes("android")) return "mobile";

  return "desktop";
}

export async function getCurrentSessionUser(): Promise<CtAuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = sha256(token);

  const rows = await ctQuery<SessionUserRow>(
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
        u.is_admin,
        u.is_active,
        s.id AS session_id,
        s.expires_at,
        s.revoked_at
      FROM ct_user_sessions s
      INNER JOIN ct_users u ON u.id = s.user_id
      WHERE s.session_token_hash = ?
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.is_active = 1
        AND u.account_status = 'active'
      LIMIT 1
    `,
    [tokenHash],
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  await ctQuery(
    `
      UPDATE ct_user_sessions
      SET last_seen_at = NOW()
      WHERE id = ?
    `,
    [toNumber(row.session_id)],
  );

  await ctQuery(
    `
      UPDATE ct_users
      SET last_active_at = NOW(), is_online = 1
      WHERE id = ?
    `,
    [toNumber(row.id)],
  );

  return normalizeAuthUser(row);
}

export async function revokeCurrentSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CT_SESSION_COOKIE)?.value;

  if (!token) {
    return false;
  }

  const tokenHash = sha256(token);

  await ctQuery(
    `
      UPDATE ct_user_sessions
      SET revoked_at = NOW(), ended_at = NOW()
      WHERE session_token_hash = ?
        AND revoked_at IS NULL
    `,
    [tokenHash],
  );

  cookieStore.set(CT_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return true;
}

export async function createUserSession(userId: number, token: string): Promise<void> {
  const headersList = await headers();
  const ipAddress = getClientIpFromHeaders(headersList);
  const userAgent = headersList.get("user-agent");
  const tokenHash = sha256(token);
  const deviceType = getDeviceType(userAgent);

  await ctQuery(
    `
      INSERT INTO ct_user_sessions
      (
        user_id,
        session_token_hash,
        ip_address,
        user_agent,
        expires_at,
        started_at,
        last_seen_at,
        device_type
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        DATE_ADD(NOW(), INTERVAL 7 DAY),
        NOW(),
        NOW(),
        ?
      )
    `,
    [userId, tokenHash, ipAddress, userAgent, deviceType],
  );
}

export async function listCurrentUserSessions(userId: number): Promise<CtSessionListItem[]> {
  const rows = await ctQuery<SessionRow>(
    `
      SELECT
        id,
        user_id,
        ip_address,
        user_agent,
        expires_at,
        revoked_at,
        created_at,
        started_at,
        ended_at,
        last_seen_at,
        device_type
      FROM ct_user_sessions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 25
    `,
    [userId],
  );

  return rows.map(normalizeSessionRow);
}

export async function logLoginAttempt(params: {
  email: string | null;
  userId: number | null;
  success: boolean;
  failureReason: string | null;
}): Promise<void> {
  const headersList = await headers();

  await ctQuery(
    `
      INSERT INTO ct_login_attempts
      (
        email,
        user_id,
        success,
        failure_reason,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      params.email,
      params.userId,
      params.success ? 1 : 0,
      params.failureReason,
      getClientIpFromHeaders(headersList),
      headersList.get("user-agent"),
    ],
  );
}
