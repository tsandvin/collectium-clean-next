/*
API: /api/catalog/no-banknotes/relations
Leser relasjoner for Norske sedler fra Neon.
*/

import { NextRequest, NextResponse } from "next/server";
import { neonPool } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toInt(value: string | null, fallback: number, max: number) {
  const n = Number.parseInt(value || "", 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const objectId = searchParams.get("object_id");
    const type = searchParams.get("type");
    const key = searchParams.get("key");
    const limit = toInt(searchParams.get("limit"), 200, 1000);

    const values: unknown[] = [];

    const where = [
      "source_key = 'norske_sedler'",
      "object_group = 'banknote'",
    ];

    function addValue(value: unknown) {
      values.push(value);
      return `$${values.length}`;
    }

    if (objectId) {
      where.push(`object_id = ${addValue(Number(objectId))}`);
    }

    if (type) {
      where.push(`relation_type = ${addValue(type)}`);
    }

    if (key) {
      where.push(`relation_key = ${addValue(key)}`);
    }

    const result = await neonPool.query(
      `
      select
        relation_id,
        object_id,
        source_catalog_number,
        relation_type,
        relation_key,
        relation_label_no,
        relation_status
      from public.ct_v_no_banknote_relation
      where ${where.join(" and ")}
      order by
        relation_type,
        relation_label_no,
        object_id
      limit ${limit}
      `,
      values
    );

    return NextResponse.json({
      ok: true,
      source_key: "norske_sedler",
      object_group: "banknote",
      total: result.rows.length,
      rows: result.rows,
    }, {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

