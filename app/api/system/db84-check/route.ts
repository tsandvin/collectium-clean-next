import { NextResponse } from "next/server";
import { ctQuery } from "@/lib/db/mariadb";

export const dynamic = "force-dynamic";

type TableCheckRow = {
  table_name: string;
  table_type: string;
  exists_count: number;
};

type CountRow = {
  row_count: number;
};

const requiredObjects = [
  "ct_app_pages",
  "ct_app_page_features",
  "ct_app_features",
  "ct_feature_access_rules",
  "ct_v_feature_access_resolved",
  "ct_feature_action_routes",
];

async function getRowCount(tableName: string): Promise<number | null> {
  try {
    const rows = await ctQuery<CountRow>(`SELECT COUNT(*) AS row_count FROM \`${tableName}\``);
    return Number(rows[0]?.row_count ?? 0);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const startedAt = Date.now();

    const objectRows = await ctQuery<TableCheckRow>(
      `
        SELECT
          TABLE_NAME AS table_name,
          TABLE_TYPE AS table_type,
          COUNT(*) AS exists_count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (${requiredObjects.map(() => "?").join(",")})
        GROUP BY TABLE_NAME, TABLE_TYPE
      `,
      requiredObjects,
    );

    const foundMap = new Map(
      objectRows.map((row) => [
        row.table_name,
        {
          tableType: row.table_type,
          exists: Number(row.exists_count) > 0,
        },
      ]),
    );

    const checks = await Promise.all(
      requiredObjects.map(async (objectName) => {
        const found = foundMap.get(objectName);
        const rowCount = found?.exists ? await getRowCount(objectName) : null;

        return {
          name: objectName,
          exists: Boolean(found?.exists),
          type: found?.tableType ?? null,
          rowCount,
          status: found?.exists ? "OK" : "MISSING",
        };
      }),
    );

    const missing = checks.filter((item) => !item.exists);
    const empty = checks.filter(
      (item) => item.exists && item.rowCount !== null && item.rowCount === 0,
    );

    return NextResponse.json(
      {
        ok: missing.length === 0,
        message:
          missing.length === 0
            ? "DB 8.4 control chain objects found"
            : "DB 8.4 control chain has missing objects",
        database: process.env.CT_DB_NAME ?? null,
        durationMs: Date.now() - startedAt,
        summary: {
          required: requiredObjects.length,
          found: checks.length - missing.length,
          missing: missing.length,
          empty: empty.length,
        },
        checks,
        nextStep:
          missing.length === 0
            ? "Check page keys, feature keys and action routes"
            : "Create or map missing DB 8.4 objects before building app functions",
      },
      { status: missing.length === 0 ? 200 : 500 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown DB 8.4 check error";

    return NextResponse.json(
      {
        ok: false,
        message: "DB 8.4 system check failed",
        error: message,
      },
      { status: 500 },
    );
  }
}
