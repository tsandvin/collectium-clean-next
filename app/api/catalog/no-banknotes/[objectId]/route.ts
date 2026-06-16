import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

type RouteContext = {
  params: Promise<{
    objectId: string;
  }>;
};

function parseObjectId(value: string): number | null {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL mangler." },
        { status: 500 }
      );
    }

    const params = await context.params;
    const objectId = parseObjectId(params.objectId);

    if (!objectId) {
      return NextResponse.json(
        { ok: false, error: "Ugyldig objectId." },
        { status: 400 }
      );
    }

    const rows = await sql`
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
        release_year_label,
        production_end_year_label,
        litra_raw_no,
        denomination_issue_raw_no,
        variant_type_raw_no,
        signature_raw_no,
        ruler_display_name_no,
        ruler_relation_key,
        ruler_name_raw_no,
        alias_ruler_name_raw_no,
        variant_obverse_image_path,
        variant_reverse_image_path,
        variant_transmitted_light_obverse_image_path,
        variant_transmitted_light_reverse_image_path,
        rarity_estimated_by_quantity_raw_no,
        rarity_catalog_assessment_raw_no,
        denomination_group_count,
        issue_litra_rarity_quantity,
        signature_quantity,
        catalog_status,
        relation_links_json,
        period_links_json,
        ruler_relation_label_no,
        ruler_relation_href,
        signature_relation_label_no,
        signature_relation_href,
        variant_relation_label_no,
        variant_relation_href,
        denomination_relation_label_no,
        denomination_relation_href,
        issue_period_label_no,
        issue_period_relation_href,
        main_period_label_no,
        main_period_relation_href
      from public.ct_v_no_banknote_object_presentation
      where source_key = 'norske_sedler'
        and object_group = 'banknote'
        and object_id = ${objectId}
      limit 1
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Objekt ikke funnet.", objectId },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: "ct_v_no_banknote_object_presentation",
        object: rows[0],
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Collectium no-banknote object API error:", error);

    return NextResponse.json(
      { ok: false, error: "Kunne ikke hente objektpresentasjon." },
      { status: 500 }
    );
  }
}