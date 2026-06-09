"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB Neon Control Page
 *
 * Definering / formål:
 * Kontrollside for MariaDB -> Neon overgang.
 *
 * Bruksområde:
 * Viser databasekobling, schema inventory, migreringsstatus, fasekontroll,
 * diagnose, JSON og Svar til ChatGPT.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.mariadb_neon.control
 * - system.db.overview
 * - system.schema.inventory
 *
 * Berørte API-ruter:
 * - GET /api/system/db-overview
 * - GET /api/system/schema-inventory
 *
 * Berørte tabeller / views:
 * - MariaDB information_schema.tables
 * - MariaDB information_schema.columns
 * - Neon information_schema.tables
 * - Neon information_schema.columns
 *
 * Dataretning:
 * MariaDB + Neon -> API/backend -> Next.js route -> React -> UI
 *
 * Logging:
 * log_category: system
 * log_action: mariadb_neon.control.view
 *
 * Versjon:
 * CT-FILE-MARIADB-NEON-CONTROL-PAGE-0001
 *
 * Endringsregel:
 * Dette er en read-only kontrollside. Den skal ikke migrere kildedata.
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type LoadState = "idle" | "loading" | "ok" | "error";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

type DiagnosticStatus = "OK" | "Varsel" | "Feil" | "Info" | "Blokkert";

type DiagnosticRow = {
  status: DiagnosticStatus;
  area: string;
  test: string;
  detail: string;
  path: string;
  suggestion: string;
};

type SampleTable = {
  table_name?: string;
  table_type?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(source: unknown, path: string[]): unknown {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function asString(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function asCount(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  return String(value);
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function statusClass(status: DiagnosticStatus): string {
  if (status === "OK") return styles.statusOk;
  if (status === "Varsel") return styles.statusWarn;
  if (status === "Feil") return styles.statusError;
  if (status === "Blokkert") return styles.statusBlocked;
  return styles.statusInfo;
}

function sampleTablesFrom(value: unknown): SampleTable[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      table_name: asString(item.table_name, ""),
      table_type: asString(item.table_type, ""),
    }));
}

export default function MariaDbNeonControlPage() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [dbOverview, setDbOverview] = useState<JsonObject | null>(null);
  const [schemaInventory, setSchemaInventory] = useState<JsonObject | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadControlData() {
      setLoadState("loading");
      setErrorMessage("");

      try {
        const [overviewResponse, inventoryResponse] = await Promise.all([
          fetch("/api/system/db-overview", { cache: "no-store" }),
          fetch("/api/system/schema-inventory", { cache: "no-store" }),
        ]);

        const overviewJson = (await overviewResponse.json()) as JsonObject;
        const inventoryJson = (await inventoryResponse.json()) as JsonObject;

        if (!cancelled) {
          setDbOverview(overviewJson);
          setSchemaInventory(inventoryJson);
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

  const mariaSampleTables = sampleTablesFrom(
    getPath(schemaInventory, ["inventory", "mariadb", "sample_tables"])
  );

  const neonSampleTables = sampleTablesFrom(
    getPath(schemaInventory, ["inventory", "neon", "sample_tables"])
  );

  const diagnosticRows = useMemo<DiagnosticRow[]>(() => {
    const mariaDbName = asString(
      getPath(dbOverview, ["databases", "mariadb", "database", "database_name"])
    );
    const mariaVersion = asString(
      getPath(dbOverview, ["databases", "mariadb", "database", "mariadb_version"])
    );
    const neonDbName = asString(
      getPath(dbOverview, ["databases", "neon", "database", "database_name"])
    );
    const neonUser = asString(
      getPath(dbOverview, ["databases", "neon", "database", "database_user"])
    );

    const schemaOk = asBoolean(getPath(schemaInventory, ["ok"]));

    return [
      {
        status: dbMariaStatus === "OK" ? "OK" : "Feil",
        area: "Database",
        test: "MariaDB-kobling",
        detail: `${mariaDbName} / ${mariaVersion}`,
        path: "/api/system/mariadb-health",
        suggestion: dbMariaStatus === "OK" ? "OK" : "Sjekk CT_DB_* i Vercel.",
      },
      {
        status: dbNeonStatus === "OK" ? "OK" : "Feil",
        area: "Database",
        test: "Neon-kobling",
        detail: `${neonDbName} / ${neonUser}`,
        path: "/api/system/neon-health",
        suggestion: dbNeonStatus === "OK" ? "OK" : "Sjekk Neon env vars i Vercel.",
      },
      {
        status: schemaOk ? "OK" : "Feil",
        area: "Schema",
        test: "MariaDB inventory",
        detail: `${mariaTables} tabeller, ${mariaViews} views, ${mariaColumns} kolonner`,
        path: "MariaDB information_schema",
        suggestion: "Start source-relation overview og table mapping.",
      },
      {
        status: Number(neonTables) === 0 ? "Varsel" : "OK",
        area: "Neon",
        test: "Neon målstruktur",
        detail: `${neonTables} tabeller, ${neonViews} views, ${neonColumns} kolonner`,
        path: "Neon public schema",
        suggestion:
          Number(neonTables) === 0
            ? "Kjør M-N bootstrap for kontrolltabeller."
            : "Kontroller struktur mot MariaDB mapping.",
      },
      {
        status: "Blokkert",
        area: "Migrering",
        test: "Kildedata",
        detail: "Kildedata skal ikke migreres ennå.",
        path: "migration_allowed=false",
        suggestion:
          "Bygg struktur, regler, prosesser, mapping, ID-kontroll og relasjonsbaner først.",
      },
      {
        status: "Varsel",
        area: "Relasjoner",
        test: "Relasjonsbaner",
        detail: "Relasjonsbane-register er ikke opprettet i Neon ennå.",
        path: "ct_relation_path_registry",
        suggestion:
          "Legg inn relation path registry: objekt -> kilde -> regent/person -> periode -> funn -> samling -> marked.",
      },
      {
        status: "Info",
        area: "Truth status",
        test: "Neon som sann database",
        detail: neonTruthStatus,
        path: "ct_database_truth_status",
        suggestion:
          "Neon kan ikke godkjennes før struktur, regler, relasjoner og sidekrav er OK.",
      },
    ];
  }, [
    dbOverview,
    schemaInventory,
    dbMariaStatus,
    dbNeonStatus,
    mariaTables,
    mariaViews,
    mariaColumns,
    neonTables,
    neonViews,
    neonColumns,
    neonTruthStatus,
  ]);

  const chatGptReport = useMemo(() => {
    return [
      "SVAR TIL CHATGPT",
      "",
      "MariaDB -> Neon Control status:",
      `Lastestatus: ${loadState}`,
      `MariaDB: ${dbMariaStatus}`,
      `Neon: ${dbNeonStatus}`,
      `Schema inventory: ${asBoolean(getPath(schemaInventory, ["ok"])) ? "OK" : "ukjent"}`,
      "",
      `MariaDB tabeller: ${mariaTables}`,
      `MariaDB views: ${mariaViews}`,
      `MariaDB kolonner: ${mariaColumns}`,
      "",
      `Neon tabeller: ${neonTables}`,
      `Neon views: ${neonViews}`,
      `Neon kolonner: ${neonColumns}`,
      "",
      `Migrering: ${migrationStatus}`,
      `Neon truth status: ${neonTruthStatus}`,
      `Neste steg: ${asString(
        getPath(schemaInventory, ["status", "next_step"]),
        "source_relation_overview / table_mapping"
      )}`,
      "",
      "Kritisk regel:",
      "Ingen kildedata migreres før struktur, regler, prosesser, table mapping, field mapping, ID mapping, relasjonsbaner, DB 8.4, sidekrav og innholdskrav er kontrollert.",
    ].join("\n");
  }, [
    loadState,
    dbMariaStatus,
    dbNeonStatus,
    schemaInventory,
    mariaTables,
    mariaViews,
    mariaColumns,
    neonTables,
    neonViews,
    neonColumns,
    migrationStatus,
    neonTruthStatus,
  ]);

  const tabs = [
    ["dashboard", "Dashboard / tiltak"],
    ["structure", "Struktur"],
    ["relations", "Relasjoner"],
    ["inventory", "Inventory"],
    ["diagnose", "Diagnose"],
    ["json", "JSON"],
    ["chatgpt", "Svar til ChatGPT"],
  ];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Collectium System Control</p>
          <h1>MariaDB → Neon Control</h1>
          <p className={styles.lead}>
            Kontrollside for struktur, regler, prosesser, kilder, relasjoner og
            kildedata før Neon kan bli sann hoveddatabase.
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
          <span>Migrering</span>
          <strong>{migrationStatus}</strong>
          <small>Kildedata er blokkert</small>
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
            <h2>Faser</h2>
            <div className={styles.phaseList}>
              <div>
                <strong>1. Struktur først</strong>
                <span>Ikke startet / bootstrap mangler</span>
              </div>
              <div>
                <strong>2. Regler / metoder / prosesser</strong>
                <span>Ikke startet / kontrolltabeller mangler</span>
              </div>
              <div>
                <strong>3. Kildedata til slutt</strong>
                <span>Blokkert til struktur og relasjoner er OK</span>
              </div>
            </div>
          </article>

          <article className={styles.panel}>
            <h2>Neste tiltak</h2>
            <ol className={styles.actionList}>
              <li>Opprett Neon kontrolltabeller.</li>
              <li>Lag source-relation-overview.</li>
              <li>Lag table mapping.</li>
              <li>Lag relation path registry.</li>
              <li>Lagre MariaDB-Neon rapport i Neon.</li>
            </ol>
          </article>
        </section>
      ) : null}

      {activeTab === "structure" ? (
        <section className={styles.panel}>
          <h2>Struktur som må opprettes i Neon</h2>
          <div className={styles.tagGrid}>
            {[
              "ct_migration_control_runs",
              "ct_migration_control_steps",
              "ct_migration_control_logs",
              "ct_migration_table_inventory",
              "ct_migration_table_map",
              "ct_migration_field_map",
              "ct_migration_report_files",
              "ct_database_truth_status",
              "ct_system_control_status",
              "ct_source_inventory",
              "ct_object_group_inventory",
              "ct_object_inventory_summary",
              "ct_relation_type_registry",
              "ct_relation_path_registry",
              "ct_relation_path_check_results",
              "ct_relation_missing_links",
              "ct_relation_privacy_rules",
              "ct_market_channel_summary",
              "ct_collection_summary",
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "relations" ? (
        <section className={styles.panel}>
          <h2>Relasjonsbaner som må kontrolleres</h2>

          <div className={styles.pathBox}>
            <strong>Eksempelbane</strong>
            <p>
              Mynt → Konge Oscar II → Periode → Årstall → Produsent → Familie /
              dynasti → Land → død / gravlagt → Funn → Samling → Auksjon →
              Nettbutikk → Marked
            </p>
          </div>

          <div className={styles.tagGrid}>
            {[
              "object_to_source",
              "object_to_country",
              "object_to_producer",
              "object_to_year",
              "object_to_period",
              "object_to_ruler",
              "object_to_dynasty",
              "object_to_person",
              "object_to_find",
              "object_to_provenance",
              "object_to_collection",
              "object_to_auction",
              "object_to_shop",
              "object_to_market_observation",
              "ruler_to_family",
              "ruler_to_burial_place",
              "find_to_location",
              "find_to_person",
            ].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "inventory" ? (
        <section className={styles.gridTwo}>
          <article className={styles.panel}>
            <h2>MariaDB sample tables</h2>
            <div className={styles.scrollList}>
              {mariaSampleTables.map((row) => (
                <div key={row.table_name}>
                  <strong>{row.table_name}</strong>
                  <span>{row.table_type}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <h2>Neon sample tables</h2>
            <div className={styles.scrollList}>
              {neonSampleTables.length === 0 ? (
                <p>Neon har ingen tabeller ennå.</p>
              ) : (
                neonSampleTables.map((row) => (
                  <div key={row.table_name}>
                    <strong>{row.table_name}</strong>
                    <span>{row.table_type}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "diagnose" ? (
        <section className={styles.panel}>
          <h2>Diagnose / sortering</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Område</th>
                  <th>Test</th>
                  <th>Detalj</th>
                  <th>Bane / SQL / fil</th>
                  <th>Forslag</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticRows.map((row, index) => (
                  <tr key={`${row.area}-${row.test}-${index}`}>
                    <td>
                      <span className={`${styles.status} ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.area}</td>
                    <td>{row.test}</td>
                    <td>{row.detail}</td>
                    <td>{row.path}</td>
                    <td>{row.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "json" ? (
        <section className={styles.panel}>
          <h2>JSON</h2>
          <pre className={styles.codeBlock}>
            {JSON.stringify({ dbOverview, schemaInventory }, null, 2)}
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
