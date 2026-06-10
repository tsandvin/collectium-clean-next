/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Application runtime overview API
 *
 * Definering / formål:
 * Viser aktiv runtime-status for Collectium-applikasjonen, inkludert miljø,
 * databasekoblinger og ekte brukeraktivitet fra Neon-auth.
 *
 * Bruksområde:
 * Brukes av adminpanelet under MariaDB / Neon kontroll og fanen Brukeraktivitet.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 * - /api/system/application-runtime-overview
 *
 * Berørte DB-brytere / feature_keys:
 * - system.application_runtime_overview
 * - auth.session.view
 * - user.activity.view
 *
 * Berørte API-ruter:
 * - GET /api/system/application-runtime-overview
 *
 * Berørte tabeller / views:
 * - ct_users
 * - ct_user_sessions
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Versjon:
 * CT-FILE-SYSTEM-RUNTIME-OVERVIEW-0002 / CHANGE-2026-06-10-USER-ACTIVITY-0001
 */

import { NextResponse } from "next/server";
import { neonOne } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

type UserActivityRow = {
  online_now: string | number | null;
  anonymous_online: string | number | null;
  logged_in_online: string | number | null;
  active_24h: string | number | null;
  active_7d: string | number | null;
  free_users: string | number | null;
  bronze_users: string | number | null;
  silver_users: string | number | null;
  gold_users: string | number | null;
  platinum_users: string | number | null;
  dealers: string | number | null;
  admin_users: string | number | null;
  active_sessions: string | number | null;
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function hasEnv(name: string): boolean {
  return Boolean(process.env[name] && String(process.env[name]).trim() !== "");
}

async function getUserActivity() {
  const row = await neonOne<UserActivityRow>(
    `
      select
        count(distinct u.id) filter (
          where s.revoked_at is null
            and s.expires_at > now()
            and s.last_seen_at > now() - interval '15 minutes'
        ) as online_now,

        0 as anonymous_online,

        count(distinct s.user_id) filter (
          where s.revoked_at is null
            and s.expires_at > now()
            and s.last_seen_at > now() - interval '15 minutes'
        ) as logged_in_online,

        count(distinct u.id) filter (
          where u.last_active_at > now() - interval '24 hours'
        ) as active_24h,

        count(distinct u.id) filter (
          where u.last_active_at > now() - interval '7 days'
        ) as active_7d,

        count(distinct u.id) filter (
          where lower(coalesce(u.membership_level, 'free')) = 'free'
        ) as free_users,

        count(distinct u.id) filter (
          where lower(coalesce(u.membership_level, '')) = 'bronze'
        ) as bronze_users,

        count(distinct u.id) filter (
          where lower(coalesce(u.membership_level, '')) = 'silver'
        ) as silver_users,

        count(distinct u.id) filter (
          where lower(coalesce(u.membership_level, '')) = 'gold'
        ) as gold_users,

        count(distinct u.id) filter (
          where lower(coalesce(u.membership_level, '')) = 'platinum'
        ) as platinum_users,

        count(distinct u.id) filter (
          where lower(coalesce(u.role, '')) in ('dealer', 'forhandler')
        ) as dealers,

        count(distinct u.id) filter (
          where u.is_admin = true
        ) as admin_users,

        count(s.id) filter (
          where s.revoked_at is null
            and s.expires_at > now()
            and s.last_seen_at > now() - interval '15 minutes'
        ) as active_sessions
      from ct_users u
      left join ct_user_sessions s on s.user_id = u.id
    `,
  );

  return {
    status: "OK",
    status_label: "OK",
    source: "neon",
    data_source: "ct_users + ct_user_sessions",
    online_now: toNumber(row?.online_now),
    anonymous_online: toNumber(row?.anonymous_online),
    logged_in_online: toNumber(row?.logged_in_online),
    active_24h: toNumber(row?.active_24h),
    active_7d: toNumber(row?.active_7d),
    free: toNumber(row?.free_users),
    bronze: toNumber(row?.bronze_users),
    silver: toNumber(row?.silver_users),
    gold: toNumber(row?.gold_users),
    platinum: toNumber(row?.platinum_users),
    dealers: toNumber(row?.dealers),
    forhandlere: toNumber(row?.dealers),
    admin: toNumber(row?.admin_users),
    admin_users: toNumber(row?.admin_users),
    active_sessions: toNumber(row?.active_sessions),
    message: "Brukeraktivitet leses fra Neon ct_users og ct_user_sessions.",
    next_action: "Usage-tabeller kan senere utvide tallene, men auth/session-tall er aktive nå.",
    required_tables: [
      "ct_users",
      "ct_user_sessions",
      "ct_usage_events",
      "ct_usage_daily_summary",
      "ct_usage_user_daily_summary",
      "ct_membership_usage_summary"
    ],
  };
}

export async function GET() {
  const fetchedAt = new Date().toISOString();

  try {
    const userActivity = await getUserActivity();

    const payload = {
      ok: true,
      source: "application-runtime-overview",
      api_source: "application-runtime-overview",
      mode: "application_runtime_overview",
      fetched_at: fetchedAt,
      fetchedAt,

      project: {
        name: process.env.VERCEL_PROJECT_PRODUCTION_URL || "collectium-clean-next-template",
        node: process.version,
        vercel_environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
        neon_env: hasEnv("DATABASE_URL") || hasEnv("POSTGRES_URL") || hasEnv("NEON_DATABASE_URL"),
        mariadb_env: hasEnv("CT_DB_HOST") && hasEnv("CT_DB_USER") && hasEnv("CT_DB_NAME"),
        blob_token: hasEnv("BLOB_READ_WRITE_TOKEN"),
      },

      runtime: {
        project: process.env.VERCEL_PROJECT_PRODUCTION_URL || "collectium-clean-next-template",
        node: process.version,
        node_version: process.version,
        vercel_environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
        neon_env: hasEnv("DATABASE_URL") || hasEnv("POSTGRES_URL") || hasEnv("NEON_DATABASE_URL"),
        mariadb_env: hasEnv("CT_DB_HOST") && hasEnv("CT_DB_USER") && hasEnv("CT_DB_NAME"),
        blob_token: hasEnv("BLOB_READ_WRITE_TOKEN"),
        fetched_at: fetchedAt,
      },

      checks: {
        neon_env: {
          status: hasEnv("DATABASE_URL") || hasEnv("POSTGRES_URL") || hasEnv("NEON_DATABASE_URL") ? "OK" : "VARSEL",
          value: hasEnv("DATABASE_URL") || hasEnv("POSTGRES_URL") || hasEnv("NEON_DATABASE_URL"),
        },
        mariadb_env: {
          status: hasEnv("CT_DB_HOST") && hasEnv("CT_DB_USER") && hasEnv("CT_DB_NAME") ? "OK" : "VARSEL",
          value: hasEnv("CT_DB_HOST") && hasEnv("CT_DB_USER") && hasEnv("CT_DB_NAME"),
        },
        blob_token: {
          status: hasEnv("BLOB_READ_WRITE_TOKEN") ? "OK" : "VARSEL",
          value: hasEnv("BLOB_READ_WRITE_TOKEN"),
        },
      },

      userActivity,
      user_activity: userActivity,
      brukeraktivitet: userActivity,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown application runtime overview error";

    return NextResponse.json(
      {
        ok: false,
        source: "application-runtime-overview",
        mode: "application_runtime_overview",
        fetched_at: fetchedAt,
        fetchedAt,
        message: "Application runtime overview failed",
        error: message,
        userActivity: {
          status: "FEIL",
          online_now: 0,
          anonymous_online: 0,
          logged_in_online: 0,
          active_24h: 0,
          active_7d: 0,
          free: 0,
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
          dealers: 0,
          forhandlere: 0,
          admin: 0,
          admin_users: 0,
          message,
        },
      },
      { status: 500 },
    );
  }
}
