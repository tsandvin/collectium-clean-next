/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon Rule MariaDB Verification API
 *
 * Definering / formål:
 * Leser MariaDB read-only for å kontrollere første Neon-regelscope før Neon kan godkjennes.
 * Første scope er Norske sedler / banknote.
 *
 * Bruksområde:
 * Brukes etter /api/system/neon-rule-establishment for å bekrefte hvilken MariaDB-tabell/view
 * som faktisk er trygg kilde for source_key=norske_sedler og object_group=banknote.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 * - GET /api/system/neon-rule-mariadb-verification
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.neon_rule_establishment.view
 * - admin.system.neon_rule_mariadb_verification.view
 * - admin.system.mariadb_neon.readonly_check
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-rule-mariadb-verification
 * - GET /api/system/neon-rule-establishment
 *
 * Berørte tabeller / views:
 * - MariaDB: banknote_catalog_objects
 * - MariaDB: ct_catalog_objects
 * - MariaDB: ct_import_banknote_catalog_objects_csv
 * - Neon target: ct_no_banknote_catalog
 *
 * Dataretning:
 * MariaDB read-only kontroll -> Next.js API -> Admin UI
 *
 * Logging:
 * log_category: system.mariadb_neon
 * log_action: neon_rule_mariadb_verification.readonly
 *
 * Versjon:
 * CT-API-0003 / CHANGE-2026-06-10-0003
 *
 * Endringsregel:
 * Denne route-filen er ny. Den skriver ikke til MariaDB eller Neon.
 */

import mysql from "mysql2/promise";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Status = "OK" | "VARSEL" | "FEIL" | "BLOKKERT" | "INFO";

const ROUTE = "/api/system/neon-rule-mariadb-verification";
const SOURCE_KEY = "norske_sedler";
const OBJECT_GROUP = "banknote";
const CANONICAL_NEON_TABLE = "ct_no_banknote_catalog";
const TEST_OBJECT_ID = 1459;

const CANDIDATE_TABLES = [
  "banknote_catalog_objects",
  "ct_catalog_objects",
  "ct_import_banknote_catalog_objects_csv",
] as const;

const IMPORTANT_COLUMN_GROUPS = {
  objectId: ["object_id", "id", "catalog_object_id"],
  sourceKey: ["source_key"],
  objectGroup: ["object_group", "object_type", "catalog_type"],
  catalogNumber: [
    "source_catalog_number",
    "catalog_number",
    "nsnr",
    "ns_number",
    "catalog_no",
    "source_id_number",
  ],
  denomination: [
    "denomination_raw_no",
    "denomination",
    "value_raw_no",
    "valor",
    "valør",
  ],
  year: [
    "object_year_label",
    "publication_year_label",
    "year",
    "object_year",
    "issue_year",
  ],
  issue: [
    "denomination_issue_raw_no",
    "issue_raw_no",
    "series_raw_no",
    "issue",
    "series",
  ],
  variant: [
    "variant_type_raw_no",
    "variant_raw_no",
    "variant",
    "type_raw_no",
  ],
  litra: [
    "litra_raw_no",
    "litra",
    "signature_raw_no",
  ],
  ruler: [
    "ruler_name_raw_no",
    "historical_ruler_raw_no",
    "ruler",
    "king",
  ],
} as const;

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function getMariaDbConfig() {
  const host = process.env.MARIADB_HOST || process.env.DB_HOST || "";
  const database =
    process.env.MARIADB_DATABASE ||
    process.env.MARIADB_DB ||
    process.env.DB_NAME ||
    "";
  const user = process.env.MARIADB_USER || process.env.DB_USER || "";
  const password = process.env.MARIADB_PASSWORD || process.env.DB_PASSWORD || "";
  const portRaw = process.env.MARIADB_PORT || process.env.DB_PORT || "3306";
  const port = Number(portRaw);

  return {
    host,
    database,
    user,
    password,
    port: Number.isFinite(port) ? port : 3306,
  };
}

function mask(value: string) {
  if (!value) return "MISSING";
  if (value.length <= 4) return "SET";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function hasEnv(config: ReturnType<typeof getMariaDbConfig>) {
  return Boolean(config.host && config.database && config.user);
}

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function findFirstColumn(columns: string[], names: readonly string[]) {
  const lowerMap = new Map(columns.map((column) => [column.toLowerCase(), column]));
  for (const name of names) {
    const found = lowerMap.get(String(name).toLowerCase());
    if (found) return found;
  }
  return null;
}

function buildColumnGroupStatus(columns: string[]) {
  return Object.entries(IMPORTANT_COLUMN_GROUPS).map(([key, candidates]) => {
    const found = findFirstColumn(columns, candidates);
    return {
      key,
      status: found ? "OK" : "VARSEL",
      found_column: found,
      accepted_columns: candidates,
    };
  });
}

function scoreCandidate(params: {
  exists: boolean;
  rowCount: number | null;
  columns: string[];
  sourceKeyRows: number | null;
  objectGroupRows: number | null;
  testObjectRows: number | null;
}) {
  if (!params.exists) return 0;

  let score = 10;

  if ((params.rowCount || 0) > 0) score += 20;

  const objectIdColumn = findFirstColumn(
    params.columns,
    IMPORTANT_COLUMN_GROUPS.objectId
  );
  const sourceKeyColumn = findFirstColumn(
    params.columns,
    IMPORTANT_COLUMN_GROUPS.sourceKey
  );
  const objectGroupColumn = findFirstColumn(
    params.columns,
    IMPORTANT_COLUMN_GROUPS.objectGroup
  );

  if (objectIdColumn) score += 20;
  if (sourceKeyColumn) score += 20;
  if (objectGroupColumn) score += 20;

  if ((params.sourceKeyRows || 0) > 0) score += 20;
  if ((params.objectGroupRows || 0) > 0) score += 20;
  if ((params.testObjectRows || 0) > 0) score += 25;

  return score;
}

async function tableExists(
  connection: mysql.Connection,
  database: string,
  tableName: string
) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      select table_name
      from information_schema.tables
      where table_schema = ?
        and table_name = ?
      limit 1
    `,
    [database, tableName]
  );

  return rows.length > 0;
}

async function getColumns(
  connection: mysql.Connection,
  database: string,
  tableName: string
) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `
      select column_name
      from information_schema.columns
      where table_schema = ?
        and table_name = ?
      order by ordinal_position
    `,
    [database, tableName]
  );

  return rows.map((row) => String(row.column_name));
}

async function countRows(connection: mysql.Connection, tableName: string) {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `select count(*) as row_count from ${quoteIdentifier(tableName)}`
  );

  return Number(rows[0]?.row_count || 0);
}

async function countWhere(
  connection: mysql.Connection,
  tableName: string,
  columnName: string,
  value: string | number
) {
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `select count(*) as row_count from ${quoteIdentifier(tableName)} where ${quoteIdentifier(
      columnName
    )} = ?`,
    [value]
  );

  return Number(rows[0]?.row_count || 0);
}

async function getSampleRow(
  connection: mysql.Connection,
  tableName: string,
  objectIdColumn: string | null
) {
  if (!objectIdColumn) return null;

  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `select * from ${quoteIdentifier(tableName)} where ${quoteIdentifier(
      objectIdColumn
    )} = ? limit 1`,
    [TEST_OBJECT_ID]
  );

  return rows[0] || null;
}

export async function GET() {
  const config = getMariaDbConfig();

  if (!hasEnv(config)) {
    return jsonResponse(
      {
        ok: false,
        route: ROUTE,
        mode: "mariadb_readonly_verification",
        source_key: SOURCE_KEY,
        object_group: OBJECT_GROUP,
        canonical_neon_table: CANONICAL_NEON_TABLE,
        mariadb: {
          connected: false,
          status: "BLOKKERT",
          env: {
            host: mask(config.host),
            database: mask(config.database),
            user: mask(config.user),
            password: config.password ? "SET" : "MISSING",
            port: config.port,
          },
          error:
            "MariaDB env mangler. Bruk MARIADB_HOST/MARIADB_DATABASE/MARIADB_USER/MARIADB_PASSWORD eller DB_HOST/DB_NAME/DB_USER/DB_PASSWORD.",
        },
        rule_gate: {
          mariadb_verification_status: "BLOKKERT",
          truth_status: "not_approved",
          migration_allowed: false,
        },
        svar_til_chatgpt: [
          "NEON RULE MARIADB VERIFICATION:",
          "MariaDB connection: BLOKKERT",
          "Reason: MariaDB env missing",
          "Migration allowed: false",
        ].join("\n"),
      },
      500
    );
  }

  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      connectTimeout: 10_000,
      ssl:
        process.env.MARIADB_SSL === "true" || process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    });

    const [dbRows] = await connection.execute<mysql.RowDataPacket[]>(
      "select database() as database_name, current_user() as user_name"
    );

    const candidates = [];

    for (const tableName of CANDIDATE_TABLES) {
      const exists = await tableExists(connection, config.database, tableName);

      if (!exists) {
        candidates.push({
          table_name: tableName,
          exists: false,
          status: "FEIL" as Status,
          row_count: null,
          columns: [],
          column_groups: [],
          source_key_rows: null,
          object_group_rows: null,
          test_object_rows: null,
          test_object_sample: null,
          score: 0,
          detail: "Tabellen finnes ikke i MariaDB.",
        });
        continue;
      }

      const columns = await getColumns(connection, config.database, tableName);
      const rowCount = await countRows(connection, tableName);

      const objectIdColumn = findFirstColumn(
        columns,
        IMPORTANT_COLUMN_GROUPS.objectId
      );
      const sourceKeyColumn = findFirstColumn(
        columns,
        IMPORTANT_COLUMN_GROUPS.sourceKey
      );
      const objectGroupColumn = findFirstColumn(
        columns,
        IMPORTANT_COLUMN_GROUPS.objectGroup
      );

      const sourceKeyRows = sourceKeyColumn
        ? await countWhere(connection, tableName, sourceKeyColumn, SOURCE_KEY)
        : null;

      const objectGroupRows = objectGroupColumn
        ? await countWhere(connection, tableName, objectGroupColumn, OBJECT_GROUP)
        : null;

      const testObjectRows = objectIdColumn
        ? await countWhere(connection, tableName, objectIdColumn, TEST_OBJECT_ID)
        : null;

      const sample = await getSampleRow(connection, tableName, objectIdColumn);

      const columnGroups = buildColumnGroupStatus(columns);
      const score = scoreCandidate({
        exists,
        rowCount,
        columns,
        sourceKeyRows,
        objectGroupRows,
        testObjectRows,
      });

      const hasIdentity =
        Boolean(objectIdColumn) &&
        Boolean(sourceKeyColumn) &&
        Boolean(objectGroupColumn);

      const status: Status = hasIdentity
        ? "OK"
        : objectIdColumn && rowCount > 0
          ? "VARSEL"
          : "FEIL";

      candidates.push({
        table_name: tableName,
        exists: true,
        status,
        row_count: rowCount,
        columns,
        identity_columns: {
          object_id: objectIdColumn,
          source_key: sourceKeyColumn,
          object_group: objectGroupColumn,
        },
        column_groups: columnGroups,
        source_key_rows: sourceKeyRows,
        object_group_rows: objectGroupRows,
        test_object_rows: testObjectRows,
        test_object_sample: sample,
        score,
        detail: hasIdentity
          ? "Tabellen har object_id/id, source_key og object_group."
          : "Tabellen finnes, men mangler én eller flere ideelle identity-kolonner for source_key/object_group-kontroll.",
      });
    }

    const sorted = [...candidates].sort((a, b) => b.score - a.score);
    const best = sorted[0] || null;

    const bestIsOk =
      best &&
      best.exists === true &&
      best.score >= 50 &&
      ((best.row_count as number | null) || 0) > 0;

    const bestHasFullIdentity =
      best?.identity_columns?.object_id &&
      best?.identity_columns?.source_key &&
      best?.identity_columns?.object_group;

    const verificationStatus: Status = bestHasFullIdentity
      ? "OK"
      : bestIsOk
        ? "VARSEL"
        : "BLOKKERT";

    const migrationAllowed = false;

    return jsonResponse({
      ok: verificationStatus === "OK",
      route: ROUTE,
      mode: "mariadb_readonly_verification",
      source_key: SOURCE_KEY,
      object_group: OBJECT_GROUP,
      canonical_neon_table: CANONICAL_NEON_TABLE,
      test_object_id: TEST_OBJECT_ID,

      mariadb: {
        connected: true,
        status: "OK",
        database_name: dbRows[0]?.database_name || config.database,
        user_name: dbRows[0]?.user_name || null,
        readonly: true,
      },

      candidates,
      recommended_source: best
        ? {
            table_name: best.table_name,
            status: best.status,
            score: best.score,
            row_count: best.row_count,
            identity_columns: best.identity_columns || null,
            detail: best.detail,
          }
        : null,

      verification: {
        status: verificationStatus,
        detail: bestHasFullIdentity
          ? "MariaDB bekrefter kandidat med full identity-modell."
          : bestIsOk
            ? "MariaDB bekrefter katalogkilde, men full source_key/object_group-modell mangler i valgt tabell. Bruk resolved view eller mapping før approval."
            : "Ingen trygg MariaDB-kilde ble bekreftet.",
        migration_allowed: migrationAllowed,
        write_allowed: false,
      },

      rule_gate: {
        mariadb_verification_status: verificationStatus,
        truth_status: "not_approved",
        migration_allowed: false,
      },

      next_step:
        verificationStatus === "OK"
          ? "Koble resultatet inn i /api/system/neon-rule-establishment. Hold migration_allowed=false til logging, rules og approval workflow er OK."
          : "Opprett eller velg resolved MariaDB-view med object_id + object_group + source_key før Neon truth approval.",

      svar_til_chatgpt: [
        "NEON RULE MARIADB VERIFICATION:",
        `Route: ${ROUTE}`,
        `Scope: source_key=${SOURCE_KEY}, object_group=${OBJECT_GROUP}`,
        `Canonical Neon table: ${CANONICAL_NEON_TABLE}`,
        `MariaDB: OK`,
        `Recommended source: ${best?.table_name || "none"}`,
        `Recommended source rows: ${best?.row_count ?? "unknown"}`,
        `Verification status: ${verificationStatus}`,
        `Migration allowed: ${migrationAllowed}`,
        "Next: bruk anbefalt kilde eller bygg resolved view før approval.",
      ].join("\n"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return jsonResponse(
      {
        ok: false,
        route: ROUTE,
        mode: "mariadb_readonly_verification",
        source_key: SOURCE_KEY,
        object_group: OBJECT_GROUP,
        canonical_neon_table: CANONICAL_NEON_TABLE,
        error: "mariadb_readonly_verification_failed",
        detail: message,
        rule_gate: {
          mariadb_verification_status: "FEIL",
          truth_status: "not_approved",
          migration_allowed: false,
        },
        svar_til_chatgpt: [
          "NEON RULE MARIADB VERIFICATION:",
          "MariaDB read-only query: FEIL",
          `Error: ${message}`,
          "Migration allowed: false",
        ].join("\n"),
      },
      500
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
