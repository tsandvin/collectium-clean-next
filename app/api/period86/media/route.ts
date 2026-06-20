// COLLECTIUM API HEADER
// Overskrift: Periode 8.6 Media API
// Formål: Henter godkjente bilder/galleri for periode dynamisk felt.
// Bruksområde: Periodefilter, relasjonspresentasjon, dynamisk periodefelt.
// DB: ct_period86_media
// Feature keys: period86.media.view, period86.media.carousel.view
// Dataretning: Neon/Postgres -> API -> UI
// Versjon: CT-PERIOD86-API-MEDIA-GET-0001

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function normalizePeriodSlug(value: string | null): string {
  return String(value || "").trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const periodSlug = normalizePeriodSlug(searchParams.get("period_slug"));

  if (!connectionString) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mangler DATABASE_URL eller POSTGRES_URL",
      },
      { status: 500 }
    );
  }

  if (!periodSlug) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mangler period_slug",
      },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `
      select
        period_media_id,
        period_slug,
        media_type,
        blob_url,
        blob_path,
        thumbnail_url,
        image_role,
        alt_text_no,
        caption_no,
        description_no,
        source_note_no,
        copyright_note_no,
        sort_order,
        is_primary,
        review_status,
        visibility_status,
        created_at,
        updated_at
      from ct_period86_media
      where period_slug = $1
        and is_active = true
        and review_status = 'approved'
        and visibility_status in ('public', 'members')
      order by
        is_primary desc,
        sort_order asc,
        period_media_id asc
      `,
      [periodSlug]
    );

    const rows = result.rows;

    const primaryImage =
      rows.find((row) => row.is_primary === true) ||
      rows[0] ||
      null;

    return NextResponse.json({
      ok: true,
      period_slug: periodSlug,
      image_count: rows.length,
      primary_image: primaryImage,
      rows,
    });
  } catch (error) {
    console.error("period86/media GET error", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Kunne ikke hente periodemedia",
      },
      { status: 500 }
    );
  }
}