"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB Neon Control Page
 *
 * Definering / formål:
 * Kontrollside for MariaDB -> Neon overgang, sidekrav, API-ruter, DB-brytere,
 * template, skin, layout og linjemappet inventory.
 *
 * Bruksområde:
 * Viser MariaDB og Neon på samme linjenummer slik at manglende tabeller,
 * kontrolltabeller og ikke-migrerbare backup-tabeller kan ses direkte.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.mariadb_neon.control
 * - system.db.overview
 * - system.schema.inventory
 * - system.mariadb_neon.bootstrap
 * - system.page.content.control
 * - system.template.control
 * - system.skin.control
 * - system.layout.control
 *
 * Berørte API-ruter:
 * - GET /api/system/db-overview
 * - GET /api/system/schema-inventory
 * - GET /api/system/mariadb-neon-bootstrap
 *
 * Berørte tabeller / views:
 * - MariaDB information_schema.tables
 * - MariaDB information_schema.columns
 * - Neon information_schema.tables
 * - Neon information_schema.columns
 * - Neon ct_* kontrolltabeller
 *
 * Dataretning:
 * MariaDB + Neon -> API/backend -> kontrollside
 *
 * Logging:
 * log_category: system
 * log_action: mariadb_neon.control.view
 *
 * Versjon:
 * CT-FILE-MARIADB-NEON-CONTROL-PAGE-0003
 *
 * Endringsregel:
 * Dette er en read-only kontrollside. Den skal ikke migrere kildedata.
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type LoadState = "idle" | "loading" | "ok" | "error";
type LineStatus = "OK" | "FEIL" | "VARSEL" | "INFO" | "BLOKKERT";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

type RawSampleTable = {
  table_name?: string;
  table_type?: string;
};

type InventoryPair = {
  lineNo: number;
  sourceTableName: string;
  sourceTableType: string;
  neonTableName: string;
  neonTableType: string;
  mariaStatus: LineStatus;
  neonStatus: LineStatus;
  mappingStatus: LineStatus;
  message: string;
  suggestion: string;
};

type ControlLine = {
  lineNo: number;
  status: LineStatus;
  title: string;
  detail: string;
  group: string;
  route?: string;
  featureKey?: string;
  suggestion: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(source: unknown, path: string[]): unknown {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return current;
}

function asString(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function asCount(value: unknown): string {
  if (value === null || value === undefined || value === "") return "0";
  return String(value);
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function lineStatusClass(status: LineStatus): string {
  if (status === "OK") return styles.lineOk;
  if (status === "FEIL") return styles.lineError;
  if (status === "BLOKKERT") return styles.lineBlocked;
  if (status === "VARSEL") return styles.lineWarn;
  return styles.lineInfo;
}

function badgeClass(status: LineStatus): string {
  if (status === "OK") return styles.badgeOk;
  if (status === "FEIL") return styles.badgeError;
  if (status === "BLOKKERT") return styles.badgeBlocked;
  if (status === "VARSEL") return styles.badgeWarn;
  return styles.badgeInfo;
}

function sampleTablesFrom(value: unknown): RawSampleTable[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      table_name: asString(item.table_name, ""),
      table_type: asString(item.table_type, ""),
    }));
}

function isBackupTable(tableName: string): boolean {
  return (
    tableName.startsWith("backup_") ||
    tableName.startsWith("bak_") ||
    tableName.includes("_backup_") ||
    tableName.includes("_before_")
  );
}

function normalizeTableName(tableName: string): string {
  return tableName.trim().toLowerCase();
}

function possibleNeonNames(mariaTableName: string): string[] {
  const clean = normalizeTableName(mariaTableName);

  return Array.from(
    new Set([
      clean,
      `ct_${clean}`,
      clean.replace(/^ct_/, ""),
      clean.replace(/^catalog_/, "ct_catalog_"),
      clean.replace(/^collection_/, "ct_collection_"),
      clean.replace(/^auction_/, "ct_auction_"),
      clean.replace(/^user_/, "ct_user_"),
    ])
  );
}

function buildInventoryPairs(
  mariaTables: RawSampleTable[],
  neonTables: RawSampleTable[]
): InventoryPair[] {
  const neonByName = new Map<string, RawSampleTable>();

  for (const table of neonTables) {
    const name = asString(table.table_name, "");
    if (name) {
      neonByName.set(normalizeTableName(name), table);
    }
  }

  return mariaTables.map((maria, index) => {
    const sourceTableName = asString(maria.table_name, "");
    const sourceTableType = asString(maria.table_type, "");
    const isBackup = isBackupTable(sourceTableName);

    let neonMatch: RawSampleTable | null = null;
    for (const candidate of possibleNeonNames(sourceTableName)) {
      if (neonByName.has(candidate)) {
        neonMatch = neonByName.get(candidate) ?? null;
        break;
      }
    }

    if (isBackup) {
      return {
        lineNo: index + 1,
        sourceTableName,
        sourceTableType,
        neonTableName: "Skal ikke direkte migreres",
        neonTableType: "—",
        mariaStatus: "FEIL",
        neonStatus: "BLOKKERT",
        mappingStatus: "BLOKKERT",
        message: "Backup-/midlertidig tabell",
        suggestion:
          "Marker som ikke-migrerbar i table mapping. Ikke opprett som kildetabell i Neon.",
      };
    }

    if (neonMatch) {
      return {
        lineNo: index + 1,
        sourceTableName,
        sourceTableType,
        neonTableName: asString(neonMatch.table_name, ""),
        neonTableType: asString(neonMatch.table_type, ""),
        mariaStatus: "OK",
        neonStatus: "OK",
        mappingStatus: "OK",
        message: "Match funnet",
        suggestion: "Kontroller feltmapping og radtelling.",
      };
    }

    return {
      lineNo: index + 1,
      sourceTableName,
      sourceTableType,
      neonTableName: "Mangler i Neon",
      neonTableType: "—",
      mariaStatus: "OK",
      neonStatus: "FEIL",
      mappingStatus: "FEIL",
      message: "Ingen Neon-match funnet",
      suggestion:
        "Legg inn table mapping før eventuell struktur- eller datamigrering.",
    };
  });
}

function extraNeonTables(
  mariaTables: RawSampleTable[],
  neonTables: RawSampleTable[]
): RawSampleTable[] {
  const mariaCandidateNames = new Set<string>();

  for (const table of mariaTables) {
    const name = asString(table.table_name, "");
    for (const candidate of possibleNeonNames(name)) {
      mariaCandidateNames.add(candidate);
    }
  }

  return neonTables.filter((table) => {
    const neonName = normalizeTableName(asString(table.table_name, ""));
    return !mariaCandidateNames.has(neonName);
  });
}

function makePageControlRows(args: {
  dbMariaStatus: string;
  dbNeonStatus: string;
  schemaOk: boolean;
  mariaTables: string;
  neonTables: string;
  migrationStatus: string;
  neonTruthStatus: string;
}): ControlLine[] {
  return [
    {
      lineNo: 1,
      status: args.dbMariaStatus === "OK" ? "OK" : "FEIL",
      group: "Database",
      title: "MariaDB-kobling",
      detail: `${args.dbMariaStatus} / ${args.mariaTables} tabeller`,
      route: "/api/system/mariadb-health",
      featureKey: "system.mariadb.health",
      suggestion: args.dbMariaStatus === "OK" ? "OK" : "Sjekk CT_DB_* i Vercel.",
    },
    {
      lineNo: 2,
      status: args.dbNeonStatus === "OK" ? "OK" : "FEIL",
      group: "Database",
      title: "Neon-kobling",
      detail: `${args.dbNeonStatus} / ${args.neonTables} tabeller`,
      route: "/api/system/neon-health",
      featureKey: "system.neon.health",
      suggestion: args.dbNeonStatus === "OK" ? "OK" : "Sjekk Neon env vars i Vercel.",
    },
    {
      lineNo: 3,
      status: args.schemaOk ? "OK" : "FEIL",
      group: "API",
      title: "Schema inventory",
      detail: args.schemaOk ? "Schema inventory svarer OK" : "Schema inventory feiler",
      route: "/api/system/schema-inventory",
      featureKey: "system.schema.inventory",
      suggestion: "Brukes som grunnlag for table mapping.",
    },
    {
      lineNo: 4,
      status: Number(args.neonTables) > 0 ? "OK" : "VARSEL",
      group: "API",
      title: "Bootstrap / Neon kontrollstruktur",
      detail: `${args.neonTables} Neon-tabeller i inventory`,
      route: "/api/system/mariadb-neon-bootstrap",
      featureKey: "system.mariadb_neon.bootstrap",
      suggestion:
        Number(args.neonTables) > 0
          ? "Kontrollstruktur finnes."
          : "Kjør eller oppdater schema inventory etter bootstrap.",
    },
    {
      lineNo: 5,
      status: "BLOKKERT",
      group: "Migrering",
      title: "Kildedata",
      detail: args.migrationStatus,
      featureKey: "system.source_data.migration",
      suggestion:
        "Kildedata er blokkert til mapping, ID-kontroll, relasjoner og sidekrav er OK.",
    },
    {
      lineNo: 6,
      status: args.neonTruthStatus === "not_approved" ? "BLOKKERT" : "OK",
      group: "Truth",
      title: "Neon som sann database",
      detail: args.neonTruthStatus,
      featureKey: "system.database.truth_status",
      suggestion: "Neon skal ikke godkjennes før hele kontrollkjeden er OK.",
    },
    {
      lineNo: 7,
      status: "VARSEL",
      group: "Template",
      title: "Template-kontroll per side",
      detail: "Trenger egen kontroll for template, skin og layout per side.",
      featureKey: "system.template.control",
      suggestion: "Neste utvidelse: lag side-control registry for alle sider.",
    },
    {
      lineNo: 8,
      status: "VARSEL",
      group: "Skin",
      title: "Skin-kontroll",
      detail: "Skin må kontrolleres mot valgt standard.",
      featureKey: "system.skin.control",
      suggestion: "Legg inn skin_status per side.",
    },
    {
      lineNo: 9,
      status: "VARSEL",
      group: "Layout",
      title: "Layout-kontroll",
      detail: "Layout må kontrollere desktop, tablet, mobil og bredskjerm.",
      featureKey: "system.layout.control",
      suggestion: "Legg inn layout_status per side.",
    },
    {
      lineNo: 10,
      status: "VARSEL",
      group: "Sidekrav",
      title: "Side- og innholdskontroll",
      detail: "Hver side må ha krav til komponenter, API, brytere, tabeller og innhold.",
      featureKey: "system.page.content.control",
      suggestion: "Neste API: source-relation-overview og page-control-overview.",
    },
  ];
}

export default function MariaDbNeonControlPage() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [dbOverview, setDbOverview] = useState<JsonObject | null>(null);
  const [schemaInventory, setSchemaInventory] = useState<JsonObject | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<JsonObject | null>(null);
  const [platformStandard, setPlatformStandard] = useState<JsonObject | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [focusedLine, setFocusedLine] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadControlData() {
      setLoadState("loading");
      setErrorMessage("");

      try {
        const [overviewResponse, inventoryResponse, bootstrapResponse, platformResponse] =
          await Promise.all([
            fetch("/api/system/db-overview", { cache: "no-store" }),
            fetch("/api/system/schema-inventory", { cache: "no-store" }),
            fetch("/api/system/mariadb-neon-bootstrap", { cache: "no-store" }),
            fetch("/api/system/platform-standard-check", { cache: "no-store" }),
          ]);

        const overviewJson = (await overviewResponse.json()) as JsonObject;
        const inventoryJson = (await inventoryResponse.json()) as JsonObject;
        const bootstrapJson = (await bootstrapResponse.json()) as JsonObject;
        const platformJson = (await platformResponse.json()) as JsonObject;

        if (!cancelled) {
          setDbOverview(overviewJson);
          setSchemaInventory(inventoryJson);
          setBootstrapStatus(bootstrapJson);
          setLoadState("ok");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Ukjent feil ved lasting"
          );
        }
      }
    }

    loadControlData();

    return () => {
      cancelled = true;
    };
  }, []);

  const dbMariaStatus = asString(getPath(dbOverview, ["status", "mariadb"]), "...");
  const dbNeonStatus = asString(getPath(dbOverview, ["status", "neon"]), "...");
  const migrationStatus = asString(
    getPath(dbOverview, ["status", "migration_status"]),
    "not_started"
  );
  const neonTruthStatus = asString(
    getPath(dbOverview, ["status", "neon_truth_status"]),
    "not_approved"
  );

  const mariaTables = asCount(
    getPath(schemaInventory, ["inventory", "mariadb", "summary", "table_count"])
  );
  const mariaViews = asCount(
    getPath(schemaInventory, ["inventory", "mariadb", "summary", "view_count"])
  );
  const mariaColumns = asCount(
    getPath(schemaInventory, ["inventory", "mariadb", "summary", "column_count"])
  );

  const neonTables = asCount(
    getPath(schemaInventory, ["inventory", "neon", "summary", "table_count"])
  );
  const neonViews = asCount(
    getPath(schemaInventory, ["inventory", "neon", "summary", "view_count"])
  );
  const neonColumns = asCount(
    getPath(schemaInventory, ["inventory", "neon", "summary", "column_count"])
  );

  const schemaOk = asBoolean(getPath(schemaInventory, ["ok"]));

  const mariaSampleTables = sampleTablesFrom(
    getPath(schemaInventory, ["inventory", "mariadb", "sample_tables"])
  );

  const neonSampleTables = sampleTablesFrom(
    getPath(schemaInventory, ["inventory", "neon", "sample_tables"])
  );

  const inventoryPairs = useMemo(
    () => buildInventoryPairs(mariaSampleTables, neonSampleTables),
    [mariaSampleTables, neonSampleTables]
  );

  const extraNeon = useMemo(
    () => extraNeonTables(mariaSampleTables, neonSampleTables),
    [mariaSampleTables, neonSampleTables]
  );

  const missingLines = inventoryPairs.filter((row) => row.mappingStatus === "FEIL");
  const okLines = inventoryPairs.filter((row) => row.mappingStatus === "OK");
  const blockedLines = inventoryPairs.filter((row) => row.mappingStatus === "BLOKKERT");

  const visibleInventoryPairs = focusedLine
    ? inventoryPairs.filter((row) => row.lineNo === focusedLine)
    : inventoryPairs;

  const controlRows = useMemo(
    () =>
      makePageControlRows({
        dbMariaStatus,
        dbNeonStatus,
        schemaOk,
        mariaTables,
        neonTables,
        migrationStatus,
        neonTruthStatus,
      }),
    [
      dbMariaStatus,
      dbNeonStatus,
      schemaOk,
      mariaTables,
      neonTables,
      migrationStatus,
      neonTruthStatus,
    ]
  );

  const chatGptReport = useMemo(() => {
    return [
      "SVAR TIL CHATGPT",
      "",
      "MariaDB -> Neon Control status:",
      `Lastestatus: ${loadState}`,
      `MariaDB: ${dbMariaStatus}`,
      `Neon: ${dbNeonStatus}`,
      `Schema inventory: ${schemaOk ? "OK" : "ukjent"}`,
      "",
      `MariaDB tabeller: ${mariaTables}`,
      `MariaDB views: ${mariaViews}`,
      `MariaDB kolonner: ${mariaColumns}`,
      "",
      `Neon tabeller: ${neonTables}`,
      `Neon views: ${neonViews}`,
      `Neon kolonner: ${neonColumns}`,
      "",
      `Mangler i Neon sample: ${missingLines.length}`,
      `OK i sample: ${okLines.length}`,
      `Blokkert / backup i sample: ${blockedLines.length}`,
      `Ekstra Neon kontrolltabeller: ${extraNeon.length}`,
      "",
      `Migrering: ${migrationStatus}`,
      `Neon truth status: ${neonTruthStatus}`,
      `Neste steg: ${asString(
        getPath(schemaInventory, ["status", "next_step"]),
        "source_relation_overview / table_mapping"
      )}`,
      "",
      "Kritisk regel:",
      "Ingen kildedata migreres før struktur, regler, prosesser, table mapping, field mapping, ID mapping, relasjonsbaner, DB 8.4, auth/session, bruker/samling, admin/action-routes, sidekrav og innholdskrav er kontrollert.",
    ].join("\n");
  }, [
    loadState,
    dbMariaStatus,
    dbNeonStatus,
    schemaOk,
    mariaTables,
    mariaViews,
    mariaColumns,
    neonTables,
    neonViews,
    neonColumns,
    missingLines.length,
    okLines.length,
    blockedLines.length,
    extraNeon.length,
    migrationStatus,
    neonTruthStatus,
    schemaInventory,
  ]);

  const platformChecks = useMemo(() => {
    const checks = getPath(platformStandard, ["checks"]);
    return Array.isArray(checks) ? checks.filter(isRecord) : [];
  }, [platformStandard]);

  const tabs = [
    ["dashboard", "Dashboard"],
    ["inventory", "Inventory"],
    ["platform", "Plattform"],
    ["api", "API-ruter"],
    ["features", "DB-brytere"],
    ["template", "Template"],
    ["skin", "Skin"],
    ["layout", "Layout"],
    ["pages", "Sidekrav"],
    ["diagnose", "Diagnose"],
    ["json", "JSON"],
    ["chatgpt", "Svar til ChatGPT"],
  ];

  const renderControlRows = (filter?: string) => {
    const rows = filter ? controlRows.filter((row) => row.group === filter) : controlRows;

    return (
      <div className={styles.controlList}>
        {rows.map((row) => (
          <article key={`${row.group}-${row.lineNo}`} className={`${styles.controlLine} ${lineStatusClass(row.status)}`}>
            <div className={styles.lineNumber}>{row.lineNo}</div>
            <div className={styles.lineMain}>
              <div className={styles.lineHeader}>
                <strong>{row.title}</strong>
                <span className={`${styles.badge} ${badgeClass(row.status)}`}>{row.status}</span>
              </div>
              <p>{row.detail}</p>
              <small>
                {row.route ? `Route: ${row.route} · ` : ""}
                {row.featureKey ? `Feature: ${row.featureKey}` : ""}
              </small>
              <em>{row.suggestion}</em>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Collectium System Control</p>
          <h1>MariaDB → Neon Control</h1>
          <p className={styles.lead}>
            Kontrollside for database, API, brytere, template, skin, layout og
            sidekrav før Neon kan bli sann hoveddatabase.
          </p>
        </div>

        <div className={styles.heroStatus}>
          <span className={loadState === "ok" ? styles.pillOk : styles.pillWarn}>
            {loadState === "ok" ? "Kontroll OK" : loadState}
          </span>
          <span className={styles.pillBlocked}>Migrering blokkert</span>
        </div>
      </section>

      {loadState === "error" ? (
        <section className={styles.errorBox}>
          <strong>Feil ved lasting:</strong> {errorMessage}
        </section>
      ) : null}

      <section className={styles.cards}>
        <article className={styles.card}>
          <span>MariaDB</span>
          <strong>{dbMariaStatus}</strong>
          <small>
            {mariaTables} tabeller / {mariaViews} views / {mariaColumns} kolonner
          </small>
        </article>

        <article className={styles.card}>
          <span>Neon</span>
          <strong>{dbNeonStatus}</strong>
          <small>
            {neonTables} tabeller / {neonViews} views / {neonColumns} kolonner
          </small>
        </article>

        <article className={styles.card}>
          <span>Mapping sample</span>
          <strong>{okLines.length} OK / {missingLines.length} feil</strong>
          <small>{blockedLines.length} blokkert / backup</small>
        </article>

        <article className={styles.card}>
          <span>Truth status</span>
          <strong>{neonTruthStatus}</strong>
          <small>Neon er koblet, men ikke godkjent</small>
        </article>
      </section>

      <nav className={styles.tabs} aria-label="MariaDB Neon Control tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? styles.activeTab : ""}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "dashboard" ? (
        <section className={styles.gridTwo}>
          <article className={styles.panel}>
            <h2>Kontrollstatus</h2>
            {renderControlRows()}
          </article>

          <article className={styles.panel}>
            <h2>Neste tiltak</h2>
            <ol className={styles.actionList}>
              <li>Bygg full table mapping, ikke bare sample-visning.</li>
              <li>Lag source-relation-overview.</li>
              <li>Lag page-control-overview for alle sider.</li>
              <li>Legg template, skin og layout inn som kontroller per side.</li>
              <li>Ikke migrer kildedata før mapping og relasjoner er OK.</li>
            </ol>
          </article>
        </section>
      ) : null}

      {activeTab === "inventory" ? (
        <section className={styles.panel}>
          <h2>Linjemappet inventory</h2>

          <div className={styles.mappingSummary}>
            <div>
              <strong>Mangler i Neon</strong>
              <div className={styles.numberPills}>
                {missingLines.map((row) => (
                  <button key={`missing-${row.lineNo}`} type="button" className={styles.redPill} onClick={() => setFocusedLine(row.lineNo)}>
                    {row.lineNo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <strong>OK</strong>
              <div className={styles.numberPills}>
                {okLines.map((row) => (
                  <button key={`ok-${row.lineNo}`} type="button" className={styles.greenPill} onClick={() => setFocusedLine(row.lineNo)}>
                    {row.lineNo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <strong>Backup / blokkert</strong>
              <div className={styles.numberPills}>
                {blockedLines.map((row) => (
                  <button key={`blocked-${row.lineNo}`} type="button" className={styles.purplePill} onClick={() => setFocusedLine(row.lineNo)}>
                    {row.lineNo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <strong>Visning</strong>
              <div className={styles.numberPills}>
                <button type="button" className={styles.neutralPill} onClick={() => setFocusedLine(null)}>
                  Alle
                </button>
              </div>
            </div>
          </div>

          <div className={styles.pairedInventoryGrid}>
            <article>
              <h3>MariaDB sample tables</h3>
              <div className={styles.pairedList}>
                {visibleInventoryPairs.map((row) => (
                  <div key={`maria-${row.lineNo}`} className={`${styles.tableLine} ${lineStatusClass(row.mariaStatus)}`}>
                    <span className={styles.lineNumber}>{row.lineNo}</span>
                    <strong>{row.sourceTableName}</strong>
                    <span>{row.sourceTableType}</span>
                    <span className={`${styles.badge} ${badgeClass(row.mariaStatus)}`}>{row.mariaStatus}</span>
                  </div>
                ))}
              </div>
            </article>

            <article>
              <h3>Neon mapped result</h3>
              <div className={styles.pairedList}>
                {visibleInventoryPairs.map((row) => (
                  <div key={`neon-${row.lineNo}`} className={`${styles.tableLine} ${lineStatusClass(row.neonStatus)}`}>
                    <span className={styles.lineNumber}>{row.lineNo}</span>
                    <strong>{row.neonTableName}</strong>
                    <span>{row.neonTableType}</span>
                    <span className={`${styles.badge} ${badgeClass(row.neonStatus)}`}>{row.neonStatus}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className={styles.mappingDetails}>
            <h3>Linjedetaljer</h3>
            {visibleInventoryPairs.map((row) => (
              <article key={`detail-${row.lineNo}`} className={`${styles.controlLine} ${lineStatusClass(row.mappingStatus)}`}>
                <div className={styles.lineNumber}>{row.lineNo}</div>
                <div className={styles.lineMain}>
                  <div className={styles.lineHeader}>
                    <strong>{row.sourceTableName}</strong>
                    <span className={`${styles.badge} ${badgeClass(row.mappingStatus)}`}>{row.mappingStatus}</span>
                  </div>
                  <p>{row.message}</p>
                  <small>MariaDB: {row.sourceTableName} → Neon: {row.neonTableName}</small>
                  <em>{row.suggestion}</em>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.extraNeonBox}>
            <h3>Ekstra Neon-tabeller uten MariaDB-linje</h3>
            <p>
              Dette er normalt etter bootstrap. Disse er kontrolltabeller og skal
              ikke bety at kildedata er migrert.
            </p>
            <div className={styles.tagGrid}>
              {extraNeon.map((table) => (
                <span key={asString(table.table_name, "")}>{asString(table.table_name, "")}</span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "platform" ? (
        <section className={styles.panel}>
          <h2>Plattformstandard</h2>
          <p className={styles.panelLead}>
            Kontroll av Next.js, React, Vercel, Neon, Node.js, API-ruter,
            server/client components, DB-tilkobling, miljøvariabler og build/deploy.
          </p>

          {platformChecks.length === 0 ? (
            <article className={`${styles.controlLine} ${styles.lineWarn}`}>
              <div className={styles.lineNumber}>1</div>
              <div className={styles.lineMain}>
                <div className={styles.lineHeader}>
                  <strong>Platform standard check mangler</strong>
                  <span className={`${styles.badge} ${styles.badgeWarn}`}>VARSEL</span>
                </div>
                <p>Fant ingen checks fra /api/system/platform-standard-check.</p>
                <small>Route: /api/system/platform-standard-check</small>
                <em>Kjør API-ruten og kontroller at den returnerer checks.</em>
              </div>
            </article>
          ) : (
            <div className={styles.controlList}>
              {platformChecks.map((check, index) => {
                const status = asString(check.status, "INFO") as LineStatus;
                const lineNo = asString(check.line_no, String(index + 1));
                const area = asString(check.area, "Platform");
                const standardKey = asString(check.standard_key, "—");
                const currentValue = asString(check.current_value, "—");
                const expectedValue = asString(check.expected_value, "—");
                const detail = asString(check.detail_no, "—");
                const suggestion = asString(check.suggestion_no, "—");

                return (
                  <article
                    key={`${standardKey}-${lineNo}`}
                    className={`${styles.controlLine} ${lineStatusClass(status)}`}
                  >
                    <div className={styles.lineNumber}>{lineNo}</div>
                    <div className={styles.lineMain}>
                      <div className={styles.lineHeader}>
                        <strong>{area}</strong>
                        <span className={`${styles.badge} ${badgeClass(status)}`}>
                          {status}
                        </span>
                      </div>
                      <p>{standardKey}</p>
                      <small>
                        Nå: {currentValue} · Forventet: {expectedValue}
                      </small>
                      <em>{detail}</em>
                      <em>{suggestion}</em>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
      {activeTab === "api" ? (
        <section className={styles.panel}>
          <h2>API-ruter</h2>
          {renderControlRows("API")}
        </section>
      ) : null}

      {activeTab === "features" ? (
        <section className={styles.panel}>
          <h2>DB-brytere / feature_keys</h2>
          {renderControlRows()}
        </section>
      ) : null}

      {activeTab === "template" ? (
        <section className={styles.panel}>
          <h2>Template-kontroll</h2>
          {renderControlRows("Template")}
        </section>
      ) : null}

      {activeTab === "skin" ? (
        <section className={styles.panel}>
          <h2>Skin-kontroll</h2>
          {renderControlRows("Skin")}
        </section>
      ) : null}

      {activeTab === "layout" ? (
        <section className={styles.panel}>
          <h2>Layout-kontroll</h2>
          {renderControlRows("Layout")}
        </section>
      ) : null}

      {activeTab === "pages" ? (
        <section className={styles.panel}>
          <h2>Sidekrav / innholdskrav</h2>
          {renderControlRows("Sidekrav")}
        </section>
      ) : null}

      {activeTab === "diagnose" ? (
        <section className={styles.panel}>
          <h2>Diagnose med linjenummer</h2>
          {renderControlRows()}
        </section>
      ) : null}

      {activeTab === "json" ? (
        <section className={styles.panel}>
          <h2>JSON</h2>
          <pre className={styles.codeBlock}>
            {JSON.stringify({ dbOverview, schemaInventory, bootstrapStatus, platformStandard }, null, 2)}
          </pre>
        </section>
      ) : null}

      {activeTab === "chatgpt" ? (
        <section className={styles.panel}>
          <h2>Svar til ChatGPT</h2>
          <textarea className={styles.textarea} readOnly value={chatGptReport} />
        </section>
      ) : null}
    </main>
  );
}

