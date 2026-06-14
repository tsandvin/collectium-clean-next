/*
API: /api/catalog/no-banknotes/filters

Definering/formål:
- Leser filterverdier for Norske sedler fra Neon.
- Brukes av Filter Master, katalogfilter og relasjonssøk.

Berørte DB:
- ct_v_no_banknote_filter

Berørte source/object:
- source_key = norske_sedler
- object_group = banknote
*/

import { NextRequest, NextResponse } from "next/server";
import { neonPool } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const field = searchParams.get("field");

    const values: unknown[] = [];
    const where = [
      "source_key = 'norske_sedler'",
      "object_group = 'banknote'",
    ];

    if (field) {
      values.push(field);
      where.push(`filter_field = $${values.length}`);
    }

    const result = await neonPool.query(
      `
      select
        filter_field,
        filter_key,
        filter_value_no,
        filter_value_key,
        object_count
      from public.ct_v_no_banknote_filter
      where ${where.join(" and ")}
      order by
        filter_field,
        object_count desc,
        filter_value_no
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

