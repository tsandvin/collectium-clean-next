/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Endringslogg 8.6 bruker-API
 *
 * Definering / formål:
 * Leser og skriver brukerbasert endringslogg for objekter.
 *
 * Bruksområde:
 * Brukes av objektpresentasjon / I min samling / Endringslogg.
 *
 * Berørte sider / routes:
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /api/object/change-log
 *
 * Berørte DB-brytere / feature_keys:
 * - object.change_log.view
 * - object.change_log.write
 *
 * Berørte API-ruter:
 * - GET /api/object/change-log
 * - POST /api/object/change-log
 *
 * Berørte tabeller / views:
 * - ct_user_change_log
 * - ct_v_user_change_log
 * - ct_change_log_query_queue
 *
 * Tilgang:
 * - Silver/Sølv og høyere
 * - Admin / owner / superadmin
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";
import { getCurrentSessionUser } from "@/lib/auth/neon-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LogBody = {
  object_id?: string;
  object_group?: string;
  source_key?: string;
  object_name?: string | null;
  previous_grade?: string | null;
  new_grade?: string | null;
  transaction_type?: string | null;
  previous_owner?: string | null;
  bought_for?: number | string | null;
  bought_currency?: string | null;
  bought_from?: string | null;
  dealer?: string | null;
  purchased_year?: number | string | null;
  previous_owner_city?: string | null;
  previous_owner_country?: string | null;
  change_type?: string | null;
  change_source?: string | null;
  change_note?: string | null;
  payload_json?: Record<string, unknown> | null;
};

const FILTER_FIELDS = [
  "changed_by_user_id",
  "object_id",
  "object_group",
  "source_key",
  "object_name",
  "previous_grade",
  "new_grade",
  "changed_at",
  "transaction_type",
  "previous_owner",
  "bought_for",
  "bought_from",
  "dealer",
  "purchased_year",
  "previous_owner_city",
  "previous_owner_country",
] as const;

const TEXT_LIKE_FIELDS = new Set<string>([
  "object_name",
  "previous_owner",
  "bought_from",
  "dealer",
  "previous_owner_city",
  "previous_owner_country",
]);

const MEMBERSHIP_RANK: Record<string, number> = {
  free: 0,
  bronze: 1,
  silver: 2,
  soelv: 2,
  sølv: 2,
  gold: 3,
  gull: 3,
  platinum: 4,
};

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isAdminUser(user: { role?: unknown; is_admin?: unknown } | null): boolean {
  if (!user) return false;

  const role = asText(user.role).toLowerCase();
  const isAdmin =
    user.is_admin === true ||
    user.is_admin === 1 ||
    asText(user.is_admin).toLowerCase() === "true";

  return isAdmin || role === "admin" || role === "owner" || role === "superadmin";
}

function hasChangeLogAccess(user: { role?: unknown; is_admin?: unknown; membership_level?: unknown } | null): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const membership = asText(user.membership_level).toLowerCase();
  return (MEMBERSHIP_RANK[membership] ?? 0) >= MEMBERSHIP_RANK.silver;
}

function countActiveFilters(url: URL): number {
  let count = 0;

  for (const field of FILTER_FIELDS) {
    if (asText(url.searchParams.get(field))) count++;
  }

  if (asText(url.searchParams.get("changed_at_from"))) count++;
  if (asText(url.searchParams.get("changed_at_to"))) count++;

  return count;
}

function buildFilterWhere(url: URL, params: unknown[], prefix = ""): string[] {
  const where: string[] = [];

  for (const field of FILTER_FIELDS) {
    const value = asText(url.searchParams.get(field));
    if (!value) continue;

    if (field === "changed_at") {
      params.push(value);
      where.push(`${prefix}changed_at::date = $${params.length}::date`);
      continue;
    }

    if (TEXT_LIKE_FIELDS.has(field)) {
      params.push(`%${value}%`);
      where.push(`${prefix}${field} ilike $${params.length}`);
      continue;
    }

    params.push(value);
    where.push(`${prefix}${field}::text = $${params.length}::text`);
  }

  const changedAtFrom = asText(url.searchParams.get("changed_at_from"));
  const changedAtTo = asText(url.searchParams.get("changed_at_to"));

  if (changedAtFrom) {
    params.push(changedAtFrom);
    where.push(`${prefix}changed_at >= $${params.length}::timestamptz`);
  }

  if (changedAtTo) {
    params.push(changedAtTo);
    where.push(`${prefix}changed_at <= $${params.length}::timestamptz`);
  }

  return where;
}

function buildFilterPayload(url: URL, forcedUserId: string): Record<string, string> {
  const payload: Record<string, string> = { user_id: forcedUserId };

  for (const field of FILTER_FIELDS) {
    const value = asText(url.searchParams.get(field));
    if (value) payload[field] = value;
  }

  const changedAtFrom = asText(url.searchParams.get("changed_at_from"));
  const changedAtTo = asText(url.searchParams.get("changed_at_to"));

  if (changedAtFrom) payload.changed_at_from = changedAtFrom;
  if (changedAtTo) payload.changed_at_to = changedAtTo;

  return payload;
}

async function enqueueQuery(userId: string, role: string, filters: Record<string, string>) {
  try {
    const rows = await neonQuery(
      `
        insert into public.ct_change_log_query_queue (
          requested_by_user_id,
          requested_role,
          query_scope,
          request_filters,
          request_filter_count,
          priority_level,
          queue_status
        )
        values (
          $1,
          $2,
          'user',
          $3::jsonb,
          $4,
          60,
          'queued'
        )
        returning queue_id, priority_level, queue_status, request_filter_count
      `,
      [userId, role || "user", JSON.stringify(filters), Object.keys(filters).length]
    );

    return rows[0] ?? null;
  } catch (error) {
    return {
      queue_status: "queue_table_missing_or_failed",
      error: error instanceof Error ? error.message : "Unknown queue error",
    };
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated", message_no: "Logg inn for å se endringslogg." },
        { status: 401 }
      );
    }

    if (!hasChangeLogAccess(user)) {
      return NextResponse.json(
        {
          ok: false,
          error: "membership_required",
          required_membership: "silver",
          message_no: "Endringslogg krever Sølv-medlemskap eller høyere.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") || "50");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 50;
    const activeFilterCount = countActiveFilters(url);
    const userId = String(user.id);

    if (activeFilterCount > 3 && !isAdminUser(user)) {
      const filters = buildFilterPayload(url, userId);
      const queue = await enqueueQuery(userId, asText(user.role), filters);

      return NextResponse.json({
        ok: true,
        queued: true,
        direct_query: false,
        reason: "more_than_3_filters",
        active_filter_count: activeFilterCount,
        queue,
      });
    }

    const params: unknown[] = [userId];
    const where = ["user_id::text = $1::text", ...buildFilterWhere(url, params)];

    params.push(limit);

    const rows = await neonQuery(
      `
        select
          change_log_id,
          user_id,
          changed_by_user_id,
          object_id,
          object_group,
          source_key,
          object_name,
          previous_grade,
          new_grade,
          changed_at,
          transaction_type,
          previous_owner,
          bought_for,
          bought_currency,
          bought_from,
          dealer,
          purchased_year,
          previous_owner_city,
          previous_owner_country,
          change_type,
          change_source,
          change_note,
          payload_json,
          user_log_path,
          visibility_status,
          review_status,
          created_at
        from public.ct_v_user_change_log
        where ${where.join("\n          and ")}
        order by changed_at desc
        limit $${params.length}
      `,
      params
    );

    return NextResponse.json({
      ok: true,
      source: "ct_v_user_change_log",
      access: "silver_plus_or_admin",
      scope: "user",
      user_id: userId,
      direct_query: true,
      active_filter_count: activeFilterCount,
      count: rows.length,
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown change-log API error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated", message_no: "Logg inn for å skrive endringslogg." },
        { status: 401 }
      );
    }

    if (!hasChangeLogAccess(user)) {
      return NextResponse.json(
        {
          ok: false,
          error: "membership_required",
          required_membership: "silver",
          message_no: "Endringslogg krever Sølv-medlemskap eller høyere.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as LogBody;

    const sourceKey = asText(body.source_key);
    const objectGroup = asText(body.object_group);
    const objectId = asText(body.object_id);

    if (!sourceKey || !objectGroup || !objectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_required_fields",
          required_fields: ["source_key", "object_group", "object_id"],
        },
        { status: 400 }
      );
    }

    const userId = String(user.id);
    const changedByUserId = String(user.id);

    const rows = await neonQuery(
      `
        insert into public.ct_user_change_log (
          user_id,
          changed_by_user_id,
          object_id,
          object_group,
          source_key,
          object_name,
          previous_grade,
          new_grade,
          transaction_type,
          previous_owner,
          bought_for,
          bought_currency,
          bought_from,
          dealer,
          purchased_year,
          previous_owner_city,
          previous_owner_country,
          change_type,
          change_source,
          change_note,
          visibility_status,
          review_status,
          payload_json
        )
        values (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          'private', 'accepted', $21::jsonb
        )
        returning *
      `,
      [
        userId,
        changedByUserId,
        objectId,
        objectGroup,
        sourceKey,
        body.object_name ?? null,
        body.previous_grade ?? null,
        body.new_grade ?? null,
        body.transaction_type ?? null,
        body.previous_owner ?? null,
        body.bought_for ?? null,
        body.bought_currency ?? null,
        body.bought_from ?? null,
        body.dealer ?? null,
        body.purchased_year ?? null,
        body.previous_owner_city ?? null,
        body.previous_owner_country ?? null,
        body.change_type || "object_change",
        body.change_source || "api",
        body.change_note ?? null,
        JSON.stringify(body.payload_json ?? {}),
      ]
    );

    return NextResponse.json({
      ok: true,
      source: "ct_user_change_log",
      written: true,
      row: rows[0] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown change-log write API error",
      },
      { status: 500 }
    );
  }
}
