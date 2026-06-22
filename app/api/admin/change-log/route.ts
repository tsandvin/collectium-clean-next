/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Endringslogg 8.6 admin-API
 *
 * Definering / formål:
 * Leser global endringslogg for admin uten automatisk låsing til én bruker.
 *
 * Bruksområde:
 * Brukes av admin Endringslogg og senere kontrollpanel.
 *
 * Berørte sider / routes:
 * - /admin/object-grade-log
 * - /api/admin/change-log
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.object_change_log.view
 *
 * Berørte API-ruter:
 * - GET /api/admin/change-log
 *
 * Berørte tabeller / views:
 * - ct_v_admin_change_log
 * - ct_change_log_query_queue
 *
 * Tilgang:
 * - admin / owner / superadmin
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React admin UI
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";
import { getCurrentSessionUser } from "@/lib/auth/neon-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILTER_FIELDS = [
  "user_id",
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

function countActiveFilters(url: URL): number {
  let count = 0;

  for (const field of FILTER_FIELDS) {
    if (asText(url.searchParams.get(field))) count++;
  }

  if (asText(url.searchParams.get("changed_at_from"))) count++;
  if (asText(url.searchParams.get("changed_at_to"))) count++;

  return count;
}

function buildFilterWhere(url: URL, params: unknown[]): string[] {
  const where: string[] = [];

  for (const field of FILTER_FIELDS) {
    const value = asText(url.searchParams.get(field));
    if (!value) continue;

    if (field === "changed_at") {
      params.push(value);
      where.push(`changed_at::date = $${params.length}::date`);
      continue;
    }

    if (TEXT_LIKE_FIELDS.has(field)) {
      params.push(`%${value}%`);
      where.push(`${field} ilike $${params.length}`);
      continue;
    }

    params.push(value);
    where.push(`${field}::text = $${params.length}::text`);
  }

  const changedAtFrom = asText(url.searchParams.get("changed_at_from"));
  const changedAtTo = asText(url.searchParams.get("changed_at_to"));

  if (changedAtFrom) {
    params.push(changedAtFrom);
    where.push(`changed_at >= $${params.length}::timestamptz`);
  }

  if (changedAtTo) {
    params.push(changedAtTo);
    where.push(`changed_at <= $${params.length}::timestamptz`);
  }

  return where;
}

function buildFilterPayload(url: URL): Record<string, string> {
  const payload: Record<string, string> = {};

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

async function enqueueAdminQuery(userId: string, role: string, filters: Record<string, string>) {
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
          'admin',
          $3::jsonb,
          $4,
          65,
          'queued'
        )
        returning queue_id, priority_level, queue_status, request_filter_count
      `,
      [userId, role || "admin", JSON.stringify(filters), Object.keys(filters).length]
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
        { ok: false, error: "not_authenticated", message_no: "Logg inn som admin for å se adminlogg." },
        { status: 401 }
      );
    }

    if (!isAdminUser(user)) {
      return NextResponse.json(
        { ok: false, error: "admin_required", message_no: "Adminlogg krever admin/owner/superadmin." },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") || "100");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 500)) : 100;
    const activeFilterCount = countActiveFilters(url);

    if (activeFilterCount > 3) {
      const filters = buildFilterPayload(url);
      const queue = await enqueueAdminQuery(String(user.id), asText(user.role), filters);

      return NextResponse.json({
        ok: true,
        queued: true,
        direct_query: false,
        reason: "admin_query_more_than_3_filters",
        active_filter_count: activeFilterCount,
        queue,
      });
    }

    const params: unknown[] = [];
    const where = buildFilterWhere(url, params);

    params.push(limit);

    const whereSql = where.length > 0 ? `where ${where.join("\n          and ")}` : "";

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
        from public.ct_v_admin_change_log
        ${whereSql}
        order by changed_at desc
        limit $${params.length}
      `,
      params
    );

    return NextResponse.json({
      ok: true,
      source: "ct_v_admin_change_log",
      access: "admin",
      scope: "admin",
      direct_query: true,
      active_filter_count: activeFilterCount,
      count: rows.length,
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown admin change-log API error",
      },
      { status: 500 }
    );
  }
}
