/*
API: /api/catalog/no-banknotes
Leser endelig Norske sedler-katalog fra Neon.
*/

import { NextRequest, NextResponse } from "next/server";
import { neonPool } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toInt(value: string | null, fallback: number, max: number) {
  const n = Number.parseInt(value || "", 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const limit = toInt(searchParams.get("limit"), 50, 500);
    const offset = toInt(searchParams.get("offset"), 0, 100000);

    const q = searchParams.get("q");
    const denomination = searchParams.get("denomination");
    const year = searchParams.get("year");
    const ruler = searchParams.get("ruler");
    const issue = searchParams.get("issue");
    const variant = searchParams.get("variant");
    const signature = searchParams.get("signature");

    const where: string[] = [
      "source_key = 'norske_sedler'",
      "object_group = 'banknote'",
    ];

    const values: unknown[] = [];

    function addValue(value: unknown) {
      values.push(value);
      return `$${values.length}`;
    }

    if (q) {
      const p = addValue(`%${q}%`);
      where.push(`(
        collectium_title_no ilike ${p}
        or source_catalog_number ilike ${p}
        or denomination_raw_no ilike ${p}
        or denomination_issue_raw_no ilike ${p}
        or variant_type_raw_no ilike ${p}
        or signature_raw_no ilike ${p}
        or ruler_display_name_no ilike ${p}
      )`);
    }

    if (denomination) {
      where.push(`denomination_raw_no = ${addValue(denomination)}`);
    }

    if (year) {
      where.push(`object_year_label = ${addValue(year)}`);
    }

    if (ruler) {
      where.push(`ruler_relation_key = ${addValue(ruler)}`);
    }

    if (issue) {
      where.push(`denomination_issue_raw_no = ${addValue(issue)}`);
    }

    if (variant) {
      where.push(`variant_type_raw_no = ${addValue(variant)}`);
    }

    if (signature) {
      where.push(`signature_raw_no = ${addValue(signature)}`);
    }

    const whereSql = where.join(" and ");

    const countResult = await neonPool.query(
      `
      select count(*)::int as total
      from public.ct_v_no_banknote_catalog
      where ${whereSql}
      `,
      values
    );

    const dataResult = await neonPool.query(
      `
      select
        object_id,
        source_key,
        object_group,
        source_catalog_number,
        source_catalog_sort_number,
        catalog_sort_key,
        collectium_title_no,
        denomination_raw_no,
        object_year_label,
        publication_year_label,
        litra_raw_no,
        denomination_issue_raw_no,
        variant_type_raw_no,
        signature_raw_no,
        ruler_display_name_no,
        ruler_relation_key,
        rarity_estimated_by_quantity_raw_no,
        rarity_catalog_assessment_raw_no,
        variant_obverse_image_path,
        variant_reverse_image_path
      from public.ct_v_no_banknote_catalog
      where ${whereSql}
      order by
        source_catalog_sort_number nulls last,
        source_catalog_sort_suffix nulls first,
        object_year_label nulls last,
        litra_raw_no nulls last
      limit ${limit}
      offset ${offset}
      `,
      values
    );

    return NextResponse.json({
      ok: true,
      source_key: "norske_sedler",
      object_group: "banknote",
      total: countResult.rows[0]?.total ?? 0,
      limit,
      offset,
      rows: dataResult.rows,
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

