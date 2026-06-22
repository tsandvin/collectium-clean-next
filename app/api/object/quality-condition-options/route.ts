/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Quality / condition options API
 *
 * Definering / formål:
 * Leser kvalitets-, graderings- og sjeldenhetsvalg for objektpresentasjon.
 *
 * Bruksområde:
 * Brukes av objektpresentasjon og samler-/graderingsfelt.
 *
 * Berørte sider / routes:
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - object.quality_condition_options.view
 *
 * Berørte API-ruter:
 * - GET /api/object/quality-condition-options
 *
 * Berørte tabeller / views:
 * - ct_no_coin_grade_levels
 * - ct_import_raw_grade_levels_no
 * - ct_import_raw_rarity_levels_no
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Endringsregel:
 * Denne filen bruker neonQuery fra lib/db/neon og ikke raw neon() direkte.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OptionRow = Record<string, unknown>;

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function safeLimit(value: string | null): number {
  const parsed = Number(value || "200");
  if (!Number.isFinite(parsed)) return 200;
  return Math.max(1, Math.min(parsed, 500));
}

function tableForGrade(objectGroup: string): string {
  return objectGroup === "coin"
    ? "ct_no_coin_grade_levels"
    : "ct_import_raw_grade_levels_no";
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await neonQuery<{ exists: boolean }>(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = $1
      ) as exists
    `,
    [tableName]
  );

  return rows[0]?.exists === true;
}

async function readTable(tableName: string, limit: number): Promise<OptionRow[]> {
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error("Unsafe table name.");
  }

  return neonQuery<OptionRow>(
    `
      select *
      from public.${tableName}
      limit $1
    `,
    [limit]
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const objectGroup = asText(url.searchParams.get("object_group")) || "banknote";
    const limit = safeLimit(url.searchParams.get("limit"));

    const gradeTable = tableForGrade(objectGroup);
    const rarityTable = "ct_import_raw_rarity_levels_no";

    const [gradeTableExists, rarityTableExists] = await Promise.all([
      tableExists(gradeTable),
      tableExists(rarityTable),
    ]);

    const [grades, rarities] = await Promise.all([
      gradeTableExists ? readTable(gradeTable, limit) : Promise.resolve([]),
      rarityTableExists ? readTable(rarityTable, limit) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      ok: true,
      source: "quality-condition-options",
      object_group: objectGroup,
      tables: {
        grade_table: gradeTable,
        grade_table_exists: gradeTableExists,
        rarity_table: rarityTable,
        rarity_table_exists: rarityTableExists,
      },
      count: {
        grades: grades.length,
        rarities: rarities.length,
      },
      grades,
      rarities,
      fallback_status_no:
        grades.length === 0 && rarities.length === 0
          ? "Mangler kvalitets- og sjeldenhetsdata."
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "quality-condition-options",
        error: error instanceof Error ? error.message : "Unknown quality-condition-options API error",
      },
      { status: 500 }
    );
  }
}
