/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Source Relation Overview API
 *
 * Definering / formål:
 * Intern system-API for MariaDB -> Neon Control. Ruten lager en read-only oversikt
 * over kilder, objektgrupper, relasjonsregistre, relasjonsbaner og mangler.
 *
 * Bruksområde:
 * Brukes av /admin/system/mariadb-neon og kontrollflyten for migrering.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.mariadb_neon.view
 * - admin.system.source_relation_overview.view
 * - admin.system.relation_paths.view
 *
 * Berørte API-ruter:
 * - GET /api/system/source-relation-overview
 *
 * Berørte tabeller / views:
 * MariaDB:
 * - ct_catalog_objects / tilsvarende katalogtabell hvis finnes
 * - ct_object_relations / ct_catalog_relations hvis finnes
 * - ct_relation_type_registry hvis finnes
 * - ct_relation_path_registry hvis finnes
 *
 * Neon:
 * - ct_source_inventory
 * - ct_object_group_inventory
 * - ct_relation_type_registry
 * - ct_relation_path_registry
 * - ct_relation_missing_links
 *
 * Dataretning:
 * MariaDB / Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: system
 * log_action: source_relation_overview
 *
 * Versjon:
 * CT-FILE-SYSTEM-0007 / CHANGE-2026-06-10-0001
 *
 * Endringsregel:
 * Read-only kontrollrute. Skal ikke migrere, opprette eller skrive kildedata.
 */

import { NextResponse } from "next/server";

const runNeonQuery = neonQuery;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbStatus = "OK" | "VARSEL" | "FEIL" | "IKKE_KOBLET";

type QueryResult = {
  ok: boolean;
  rows: any[];
  error?: string;
};

type TableSummary = {
  table: string;
  exists: boolean;
  row_count: number | null;
  status: DbStatus;
  note: string;
};

const dynamicImport = new Function(
  "modulePath",
  "return import(modulePath)"
) as (modulePath: string) => Promise<any>;

function jsonResponse(payload: any, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function getMariaEnv() {
  return {
    host: process.env.MARIADB_HOST || process.env.DB_HOST || "",
    port: Number(process.env.MARIADB_PORT || process.env.DB_PORT || 3306),
    database: process.env.MARIADB_DATABASE || process.env.DB_NAME || "",
    user: process.env.MARIADB_USER || process.env.DB_USER || "",
    password: process.env.MARIADB_PASSWORD || process.env.DB_PASSWORD || "",
  };
}

function hasMariaConfig() {
  const env = getMariaEnv();
  return Boolean(env.host && env.database && env.user);
}

function hasNeonConfig() {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL
  );
}

async function mariaQuery(sql: string, params: any[] = []): Promise<QueryResult> {
  if (!hasMariaConfig()) {
    return {
      ok: false,
      rows: [],
      error: "MariaDB env mangler. Bruk MARIADB_HOST/MARIADB_DATABASE/MARIADB_USER eller DB_HOST/DB_NAME/DB_USER.",
    };
  }

  let connection: any = null;

  try {
    const mysql = await dynamicImport("mysql2/promise");
    connection = await mysql.createConnection({
      host: getMariaEnv().host,
      port: getMariaEnv().port,
      database: getMariaEnv().database,
      user: getMariaEnv().user,
      password: getMariaEnv().password,
      namedPlaceholders: false,
      multipleStatements: false,
    });

    const [rows] = await connection.execute(sql, params);
    return {
      ok: true,
      rows: Array.isArray(rows) ? rows : [],
    };
  } catch (error: any) {
    return {
      ok: false,
      rows: [],
      error: error?.message || String(error),
    };
  } finally {
    if (connection) {
      await connection.end().catch(() => undefined);
    }
  }
}

async function neonQuery(sql: string, params: any[] = []): Promise<QueryResult> {
  if (!hasNeonConfig()) {
    return {
      ok: false,
      rows: [],
      error: "Neon/Postgres env mangler. Bruk DATABASE_URL, NEON_DATABASE_URL eller POSTGRES_URL.",
    };
  }

  try {
    const rows = await runNeonQuery(sql, params);
    return {
      ok: true,
      rows: Array.isArray(rows) ? rows : [],
    };
  } catch (error: any) {
    return {
      ok: false,
      rows: [],
      error: error?.message || String(error),
    };
  }
}

async function mariaTableExists(tableName: string): Promise<boolean> {
  const res = await mariaQuery(
    `
      select count(*) as table_count
      from information_schema.tables
      where table_schema = database()
        and table_name = ?
    `,
    [tableName]
  );

  if (!res.ok) return false;
  return Number(res.rows?.[0]?.table_count || 0) > 0;
}

async function mariaColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const res = await mariaQuery(
    `
      select count(*) as column_count
      from information_schema.columns
      where table_schema = database()
        and table_name = ?
        and column_name = ?
    `,
    [tableName, columnName]
  );

  if (!res.ok) return false;
  return Number(res.rows?.[0]?.column_count || 0) > 0;
}

async function neonTableExists(tableName: string): Promise<boolean> {
  const res = await neonQuery(
    `
      select count(*)::int as table_count
      from information_schema.tables
      where table_schema = 'public'
        and table_name = $1
    `,
    [tableName]
  );

  if (!res.ok) return false;
  return Number(res.rows?.[0]?.table_count || 0) > 0;
}

async function mariaRowCount(tableName: string): Promise<number | null> {
  const exists = await mariaTableExists(tableName);
  if (!exists) return null;

  const res = await mariaQuery(`select count(*) as row_count from \`${tableName}\``);
  if (!res.ok) return null;
  return Number(res.rows?.[0]?.row_count || 0);
}

async function neonRowCount(tableName: string): Promise<number | null> {
  const exists = await neonTableExists(tableName);
  if (!exists) return null;

  const res = await neonQuery(`select count(*)::int as row_count from public.${tableName}`);
  if (!res.ok) return null;
  return Number(res.rows?.[0]?.row_count || 0);
}

async function summarizeMariaTable(tableName: string): Promise<TableSummary> {
  const exists = await mariaTableExists(tableName);
  const rowCount = exists ? await mariaRowCount(tableName) : null;

  return {
    table: tableName,
    exists,
    row_count: rowCount,
    status: exists ? "OK" : "VARSEL",
    note: exists ? "Finnes i MariaDB." : "Mangler i MariaDB eller har annet navn.",
  };
}

async function summarizeNeonTable(tableName: string): Promise<TableSummary> {
  const exists = await neonTableExists(tableName);
  const rowCount = exists ? await neonRowCount(tableName) : null;

  return {
    table: tableName,
    exists,
    row_count: rowCount,
    status: exists ? "OK" : "VARSEL",
    note: exists ? "Finnes i Neon." : "Mangler i Neon kontrollstruktur.",
  };
}

async function findMariaObjectTable() {
  const candidates = [
    "ct_catalog_objects",
    "ct_catalog_object",
    "ct_objects",
    "catalog_objects",
  ];

  for (const table of candidates) {
    const exists = await mariaTableExists(table);
    if (!exists) continue;

    const hasSource = await mariaColumnExists(table, "source_key");
    const hasGroup = await mariaColumnExists(table, "object_group");

    if (hasSource && hasGroup) {
      return table;
    }
  }

  return null;
}

async function getMariaSourceInventory() {
  const objectTable = await findMariaObjectTable();

  if (!objectTable) {
    return {
      status: "VARSEL",
      object_table: null,
      rows: [],
      note: "Fant ingen MariaDB-katalogtabell med source_key og object_group.",
    };
  }

  const hasObjectId = await mariaColumnExists(objectTable, "object_id");
  const countExpression = hasObjectId
    ? "count(distinct object_id)"
    : "count(*)";

  const res = await mariaQuery(
    `
      select
        coalesce(nullif(source_key, ''), '__missing_source__') as source_key,
        coalesce(nullif(object_group, ''), '__missing_object_group__') as object_group,
        ${countExpression} as object_count
      from \`${objectTable}\`
      group by
        coalesce(nullif(source_key, ''), '__missing_source__'),
        coalesce(nullif(object_group, ''), '__missing_object_group__')
      order by object_count desc, source_key asc, object_group asc
      limit 500
    `
  );

  return {
    status: res.ok ? "OK" : "FEIL",
    object_table: objectTable,
    rows: res.rows,
    note: res.ok
      ? "Kilde- og objektgruppeoversikt hentet fra MariaDB."
      : res.error,
  };
}

async function getNeonSourceInventory() {
  const exists = await neonTableExists("ct_source_inventory");

  if (!exists) {
    return {
      status: "VARSEL",
      table: "ct_source_inventory",
      rows: [],
      note: "ct_source_inventory finnes ikke i Neon.",
    };
  }

  const res = await neonQuery(
    `
      select *
      from public.ct_source_inventory
      order by source_key asc
      limit 500
    `
  );

  return {
    status: res.ok ? "OK" : "FEIL",
    table: "ct_source_inventory",
    rows: res.rows,
    note: res.ok ? "Kildeoversikt hentet fra Neon." : res.error,
  };
}

async function getMariaRelationTables() {
  const candidates = [
    "ct_relation_type_registry",
    "ct_relation_path_registry",
    "ct_object_relations",
    "ct_catalog_relations",
    "ct_catalog_object_relations",
    "ct_relation_missing_links",
  ];

  const results: TableSummary[] = [];

  for (const table of candidates) {
    results.push(await summarizeMariaTable(table));
  }

  return results;
}

async function getNeonRelationTables() {
  const candidates = [
    "ct_relation_type_registry",
    "ct_relation_path_registry",
    "ct_relation_missing_links",
    "ct_source_inventory",
    "ct_object_group_inventory",
    "ct_object_inventory_summary",
  ];

  const results: TableSummary[] = [];

  for (const table of candidates) {
    results.push(await summarizeNeonTable(table));
  }

  return results;
}

async function readRegistryRows(db: "maria" | "neon", tableName: string) {
  const exists = db === "maria"
    ? await mariaTableExists(tableName)
    : await neonTableExists(tableName);

  if (!exists) {
    return {
      status: "VARSEL",
      table: tableName,
      rows: [],
      note: `${tableName} finnes ikke i ${db === "maria" ? "MariaDB" : "Neon"}.`,
    };
  }

  const query = db === "maria"
    ? () => mariaQuery(`select * from \`${tableName}\` limit 250`)
    : () => neonQuery(`select * from public.${tableName} limit 250`);

  const res = await query();

  return {
    status: res.ok ? "OK" : "FEIL",
    table: tableName,
    rows: res.rows,
    note: res.ok ? `${tableName} lest fra ${db}.` : res.error,
  };
}

function makeDiagnosis(input: {
  mariaConnected: boolean;
  neonConnected: boolean;
  mariaSourceInventory: any;
  neonSourceInventory: any;
  mariaRelationTables: TableSummary[];
  neonRelationTables: TableSummary[];
}) {
  const rows: any[] = [];

  rows.push({
    status: input.mariaConnected ? "OK" : "FEIL",
    area: "Database",
    test: "MariaDB-kobling",
    detail: input.mariaConnected ? "MariaDB svarer." : "MariaDB svarer ikke eller env mangler.",
    suggestion: input.mariaConnected ? "OK" : "Kontroller MARIADB_HOST/MARIADB_DATABASE/MARIADB_USER/MARIADB_PASSWORD.",
  });

  rows.push({
    status: input.neonConnected ? "OK" : "FEIL",
    area: "Database",
    test: "Neon-kobling",
    detail: input.neonConnected ? "Neon svarer." : "Neon svarer ikke eller env/pakke mangler.",
    suggestion: input.neonConnected ? "OK" : "Kontroller NEON_DATABASE_URL/POSTGRES_URL/DATABASE_URL og @neondatabase/serverless.",
  });

  rows.push({
    status: input.mariaSourceInventory.status,
    area: "Kilder",
    test: "MariaDB source_key/object_group",
    detail: input.mariaSourceInventory.note,
    suggestion: input.mariaSourceInventory.status === "OK"
      ? "Bruk dette som kildesannhet før mapping."
      : "Finn riktig katalogtabell eller opprett resolved view med source_key og object_group.",
  });

  rows.push({
    status: input.neonSourceInventory.status,
    area: "Kilder",
    test: "Neon ct_source_inventory",
    detail: input.neonSourceInventory.note,
    suggestion: input.neonSourceInventory.status === "OK"
      ? "Sammenlign mot MariaDB source inventory."
      : "Opprett/bootstrapp ct_source_inventory før kildedata migreres.",
  });

  const missingNeonRelationTables = input.neonRelationTables
    .filter((row) => !row.exists)
    .map((row) => row.table);

  rows.push({
    status: missingNeonRelationTables.length === 0 ? "OK" : "VARSEL",
    area: "Relasjoner",
    test: "Neon relasjonskontrolltabeller",
    detail: missingNeonRelationTables.length === 0
      ? "Alle forventede relasjonskontrolltabeller finnes."
      : `Mangler: ${missingNeonRelationTables.join(", ")}`,
    suggestion: missingNeonRelationTables.length === 0
      ? "OK"
      : "Kjor bootstrap for relasjonstype-, relasjonsbane- og missing-links-register.",
  });

  return rows;
}

export async function GET() {
  const startedAt = new Date().toISOString();

  const mariaPing = await mariaQuery("select 1 as ok");
  const neonPing = await neonQuery("select 1 as ok");

  const [
    mariaSourceInventory,
    neonSourceInventory,
    mariaRelationTables,
    neonRelationTables,
    mariaRelationTypeRegistry,
    mariaRelationPathRegistry,
    neonRelationTypeRegistry,
    neonRelationPathRegistry,
  ] = await Promise.all([
    getMariaSourceInventory(),
    getNeonSourceInventory(),
    getMariaRelationTables(),
    getNeonRelationTables(),
    readRegistryRows("maria", "ct_relation_type_registry"),
    readRegistryRows("maria", "ct_relation_path_registry"),
    readRegistryRows("neon", "ct_relation_type_registry"),
    readRegistryRows("neon", "ct_relation_path_registry"),
  ]);

  const diagnosis = makeDiagnosis({
    mariaConnected: mariaPing.ok,
    neonConnected: neonPing.ok,
    mariaSourceInventory,
    neonSourceInventory,
    mariaRelationTables,
    neonRelationTables,
  });

  const hasCriticalFailure = diagnosis.some((row) => row.status === "FEIL");
  const hasWarnings = diagnosis.some((row) => row.status === "VARSEL");

  const response = {
    ok: !hasCriticalFailure,
    route: "/api/system/source-relation-overview",
    generated_at: new Date().toISOString(),
    started_at: startedAt,

    summary: {
      maria_status: mariaPing.ok ? "OK" : "FEIL",
      neon_status: neonPing.ok ? "OK" : "FEIL",
      source_inventory_status: mariaSourceInventory.status,
      neon_source_inventory_status: neonSourceInventory.status,
      relation_registry_status: hasCriticalFailure ? "FEIL" : hasWarnings ? "VARSEL" : "OK",
      migration_allowed: false,
      neon_truth_status: "not_approved",
      note: "Read-only kontroll. Ruten migrerer ikke data.",
    },

    maria: {
      connected: mariaPing.ok,
      error: mariaPing.error || null,
      source_inventory: mariaSourceInventory,
      relation_tables: mariaRelationTables,
      relation_type_registry: mariaRelationTypeRegistry,
      relation_path_registry: mariaRelationPathRegistry,
    },

    neon: {
      connected: neonPing.ok,
      error: neonPing.error || null,
      source_inventory: neonSourceInventory,
      relation_tables: neonRelationTables,
      relation_type_registry: neonRelationTypeRegistry,
      relation_path_registry: neonRelationPathRegistry,
    },

    diagnosis,

    next_steps: [
      "Sammenlign MariaDB source_key/object_group mot Neon ct_source_inventory.",
      "Opprett manglende Neon kontrolltabeller hvis de ikke finnes.",
      "Definer ct_relation_type_registry og ct_relation_path_registry før kildedata migreres.",
      "Ikke godkjenn Neon som sann hoveddatabase før kontrollen viser OK.",
    ],

    svar_til_chatgpt: {
      api_route: "/api/system/source-relation-overview",
      status: hasCriticalFailure ? "FEIL" : hasWarnings ? "VARSEL" : "OK",
      maria_status: mariaPing.ok ? "OK" : "FEIL",
      neon_status: neonPing.ok ? "OK" : "FEIL",
      source_inventory_status: mariaSourceInventory.status,
      neon_source_inventory_status: neonSourceInventory.status,
      relation_registry_status: hasCriticalFailure ? "FEIL" : hasWarnings ? "VARSEL" : "OK",
      migration_allowed: false,
      message: "Kopier denne seksjonen tilbake til ChatGPT etter test.",
    },
  };

  return jsonResponse(response);
}

