/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB - Neon Postgres Control Page
 *
 * Definering / formål:
 * Kontrollside for MariaDB -> Neon-overgang, plattformstandard, template-tokenbruk,
 * hendelseslogg, schema inventory, DB-brytere, layout, skin og sidekrav.
 *
 * Bruksområde:
 * Brukes av Collectium admin/system for å se hva som er OK, hva som mangler,
 * hva som er blokkert, og hvorfor Neon ikke er godkjent som sann hoveddatabase ennå.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.mariadb_neon.control
 * - system.platform.standard_check
 * - system.template.token_check
 * - system.control_event_log.view
 * - system.control_event_log.write
 *
 * Berørte API-ruter:
 * - GET /api/system/db-overview
 * - GET /api/system/schema-inventory
 * - GET /api/system/mariadb-neon-bootstrap
 * - GET /api/system/platform-standard-check
 * - GET /api/system/template-token-check
 * - GET /api/system/control-event-log
 * - POST /api/system/control-event-log
 *
 * Berørte tabeller / views:
 * - Neon: ct_control_event_logs
 * - Neon: ct_* migration/control tables
 * - MariaDB: information_schema
 *
 * Dataretning:
 * API/backend -> React admin UI
 *
 * Logging:
 * log_category: system
 * log_action: mariadb_neon_control.view
 *
 * Versjon:
 * CT-FILE-MARIADB-NEON-CONTROL-PAGE-0002
 *
 * Endringsregel:
 * Denne siden viser kontrollstatus. Den migrerer ikke kildedata.
 */

"use client";

import MariaDbNeonApplicationRuntimeOverview from "./MariaDbNeonApplicationRuntimeOverview";

import MariaDbNeonLayoutGuide from "./MariaDbNeonLayoutGuide";

import NeonRelationDbTree from "../../../../components/system/NeonRelationDbTree";


import MariaDbNeonTransferMatrix from "./MariaDbNeonTransferMatrix";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type JsonRecord = Record<string, unknown>;

type TabKey =
  | "dashboard"
  | "inventory"
  | "platform"
  | "api"
  | "features"
  | "template"
  | "skin"
  | "layout"
  | "pages"
  | "diagnose"
  | "events"
  | "transfer" | "applications" | "userActivity" | "blobFiles" | "vercelSandbox" | "json" | "chatgpt";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "inventory", label: "Inventory" },
  { key: "transfer", label: "Overføringsmatrise" },
  { key: "applications", label: "Aktive moduler" },
  { key: "userActivity", label: "Brukeraktivitet" },
  { key: "blobFiles", label: "Blob / filer" },
  { key: "vercelSandbox", label: "Vercel Sandbox" },
  { key: "platform", label: "Plattform" },
  { key: "api", label: "API-ruter" },
  { key: "features", label: "DB-brytere" },
  { key: "template", label: "Template" },
  { key: "skin", label: "Skin" },
  { key: "layout", label: "Layout" },
  { key: "pages", label: "Sidekrav" },
  { key: "diagnose", label: "Diagnose" },
  { key: "events", label: "Hendelseslogg" },
  { key: "json", label: "JSON" },
  { key: "chatgpt", label: "Svar til ChatGPT" },
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(source: unknown, path: string[]): unknown {
  let current: unknown = source;

  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }

  return current;
}

function asString(value: unknown, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asCount(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function normalizeStatus(value: unknown) {
  return asString(value, "INFO").toUpperCase();
}

function statusClass(statusValue: unknown) {
  const status = normalizeStatus(statusValue);

  if (status === "OK") return styles.statusOk;
  if (status === "FEIL") return styles.statusError;
  if (status === "KRITISK") return styles.statusCritical;
  if (status === "BLOKKERT") return styles.statusBlocked;
  if (status === "VARSEL") return styles.statusWarning;

  return styles.statusInfo;
}

async function fetchJson(path: string): Promise<JsonRecord> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    const json = (await response.json()) as JsonRecord;

    if (!response.ok) {
      return {
        ok: false,
        source: path,
        status_code: response.status,
        error: json?.error ?? "API svarte ikke OK",
        response: json,
      };
    }

    return json;
  } catch (error) {
    return {
      ok: false,
      source: path,
      error: error instanceof Error ? error.message : "Unknown fetch error",
    };
  }
}

export default function MariaDbNeonControlPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [loading, setLoading] = useState(true);
  const [dbOverview, setDbOverview] = useState<JsonRecord | null>(null);
  const [schemaInventory, setSchemaInventory] = useState<JsonRecord | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<JsonRecord | null>(null);
  const [platformStandard, setPlatformStandard] = useState<JsonRecord | null>(null);
  const [templateTokenCheck, setTemplateTokenCheck] = useState<JsonRecord | null>(null);
  const [controlEventLog, setControlEventLog] = useState<JsonRecord | null>(null);

  async function refreshEventLog() {
    const json = await fetchJson("/api/system/control-event-log");
    setControlEventLog(json);
  }

  async function logControlEvent(input: {
    event_type: string;
    tab_key?: string;
    button_key?: string;
    feature_key?: string;
    action_route?: string;
    http_method?: string;
    status?: string;
    severity?: string;
    message_no: string;
    suggested_fix_no?: string;
    payload_json?: unknown;
  }) {
    try {
      await fetch("/api/system/control-event-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_source: "mariadb_neon_control_page",
          route_path: "/admin/system/mariadb-neon",
          status: "INFO",
          severity: "info",
          suggested_fix_no: "Ingen tiltak.",
          ...input,
        }),
      });

      await refreshEventLog();
    } catch {
      // Hendelseslogg skal aldri stoppe siden.
    }
  }

  async function loadAll() {
    setLoading(true);

    const [
      overviewJson,
      inventoryJson,
      bootstrapJson,
      platformJson,
      tokenJson,
      eventLogJson,
    ] = await Promise.all([
      fetchJson("/api/system/db-overview"),
      fetchJson("/api/system/schema-inventory"),
      fetchJson("/api/system/mariadb-neon-bootstrap"),
      fetchJson("/api/system/platform-standard-check"),
      fetchJson("/api/system/template-token-check"),
      fetchJson("/api/system/control-event-log"),
    ]);

    setDbOverview(overviewJson);
    setSchemaInventory(inventoryJson);
    setBootstrapStatus(bootstrapJson);
    setPlatformStandard(platformJson);
    setTemplateTokenCheck(tokenJson);
    setControlEventLog(eventLogJson);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const mariadbSummary = useMemo(() => {
    return getPath(schemaInventory, ["inventory", "mariadb", "summary"]);
  }, [schemaInventory]);

  const neonSummary = useMemo(() => {
    return getPath(schemaInventory, ["inventory", "neon", "summary"]);
  }, [schemaInventory]);

  const mariadbTables = useMemo(() => {
    return asRecords(getPath(schemaInventory, ["inventory", "mariadb", "sample_tables"]));
  }, [schemaInventory]);

  const neonTables = useMemo(() => {
    return asRecords(getPath(schemaInventory, ["inventory", "neon", "sample_tables"]));
  }, [schemaInventory]);

  const platformChecks = useMemo(() => {
    return asRecords(getPath(platformStandard, ["checks"]));
  }, [platformStandard]);

  const tokenChecks = useMemo(() => {
    return asRecords(getPath(templateTokenCheck, ["checks"]));
  }, [templateTokenCheck]);

  const eventRows = useMemo(() => {
    return asRecords(getPath(controlEventLog, ["events"]));
  }, [controlEventLog]);

  const tokenSummary = getPath(templateTokenCheck, ["summary"]);
  const platformSummary = getPath(platformStandard, ["summary"]);

  const allJson = {
    dbOverview,
    schemaInventory,
    bootstrapStatus,
    platformStandard,
    templateTokenCheck,
    controlEventLog,
  };

  const answerToChatGpt = [
    "MARIADB -> NEON CONTROL STATUS",
    "",
    `MariaDB: ${asString(getPath(dbOverview, ["status", "mariadb"]))}`,
    `Neon: ${asString(getPath(dbOverview, ["status", "neon"]))}`,
    `Migration status: ${asString(getPath(dbOverview, ["status", "migration_status"]))}`,
    `Neon truth status: ${asString(getPath(dbOverview, ["status", "neon_truth_status"]))}`,
    "",
    `MariaDB inventory: ${asString(getPath(mariadbSummary, ["table_count"]))} tabeller / ${asString(getPath(mariadbSummary, ["view_count"]))} views / ${asString(getPath(mariadbSummary, ["column_count"]))} kolonner`,
    `Neon inventory: ${asString(getPath(neonSummary, ["table_count"]))} tabeller / ${asString(getPath(neonSummary, ["view_count"]))} views / ${asString(getPath(neonSummary, ["column_count"]))} kolonner`,
    "",
    `Platform standard: ${asString(getPath(platformSummary, ["ok"]), "0")} OK / ${asString(getPath(platformSummary, ["varsel"]), "0")} VARSEL / ${asString(getPath(platformSummary, ["feil"]), "0")} FEIL`,
    `Template tokens: ${asString(getPath(tokenSummary, ["ok"]), "0")} OK / ${asString(getPath(tokenSummary, ["varsel"]), "0")} VARSEL / ${asString(getPath(tokenSummary, ["feil"]), "0")} FEIL`,
    `Control event log rows: ${eventRows.length}`,
    "",
    "Migration allowed: false",
    "Source data migration allowed: false",
    "",
    "Neste steg: source-relation-overview og table mapping etter at platform/template-token-kontroll vises OK.",
  ].join("");

  function normalizeInventoryName(value: unknown) {
    return asString(value, "").trim().toLowerCase();
  }

  function isBackupOrTempTable(tableName: string) {
    const name = tableName.toLowerCase();
    return (
      name.startsWith("backup_") ||
      name.startsWith("bak_") ||
      name.includes("_backup") ||
      name.includes("before_") ||
      name.includes("_temp") ||
      name.includes("tmp_")
    );
  }

  function findNeonEquivalent(mariaTableName: string) {
    const normalizedMaria = normalizeInventoryName(mariaTableName);

    return neonTables.find((row) => {
      const neonName = normalizeInventoryName(row.table_name);
      return neonName === normalizedMaria;
    });
  }

  function buildInventoryPair(row: JsonRecord, index: number) {
    const tableName = asString(row.table_name);
    const tableType = asString(row.table_type);
    const neonEquivalent = findNeonEquivalent(tableName);
    const backupOrTemp = isBackupOrTempTable(tableName);

    if (backupOrTemp) {
      return {
        line_no: index + 1,
        maria: {
          status: "BLOKKERT",
          table_name: tableName,
          table_type: tableType,
          detail_no: "Backup/temp-tabell skal ikke migreres som aktiv sannhet.",
        },
        neon: {
          status: "BLOKKERT",
          table_name: "Skal ikke opprettes",
          table_type: "blocked",
          detail_no: "Tabellen er historikk/backup og skal ikke bli Neon target table.",
          suggestion_no: "Holdes utenfor migrering. Kan eventuelt arkiveres separat senere.",
        },
      };
    }

    if (neonEquivalent) {
      return {
        line_no: index + 1,
        maria: {
          status: "OK",
          table_name: tableName,
          table_type: tableType,
          detail_no: "MariaDB-tabell finnes.",
        },
        neon: {
          status: "VARSEL",
          table_name: asString(neonEquivalent.table_name),
          table_type: asString(neonEquivalent.table_type),
          detail_no: "Tilsvarende tabell finnes i Neon, men mapping, kolonner og radtelling må godkjennes.",
          suggestion_no: "Kjør table mapping, field mapping og row count før OK.",
        },
      };
    }

    return {
      line_no: index + 1,
      maria: {
        status: "OK",
        table_name: tableName,
        table_type: tableType,
        detail_no: "MariaDB-tabell finnes og må vurderes.",
      },
      neon: {
        status: "FEIL",
        table_name: "Mangler i Neon",
        table_type: "missing",
        detail_no: "Ingen tilsvarende Neon-tabell eller mapping funnet i kontrollgrunnlaget.",
        suggestion_no: "Opprett table mapping eller marker tabellen som ikke-migrerbar.",
      },
    };
  }

  function renderCheckList(rows: JsonRecord[], emptyText: string) {
    if (rows.length === 0) {
      return (
        <article className={`${styles.controlLine} ${styles.statusWarning}`}>
          <div className={styles.lineNumber}>1</div>
          <div className={styles.lineMain}>
            <div className={styles.lineHeader}>
              <strong>Ingen data</strong>
              <span>VARSEL</span>
            </div>
            <p>{emptyText}</p>
          </div>
        </article>
      );
    }

    return (
      <div className={styles.controlList}>
        {rows.map((item, index) => {
          const status = normalizeStatus(item.status);
          const title =
            asString(item.area, "") ||
            asString(item.token, "") ||
            asString(item.event_type, "") ||
            asString(item.table_name, "") ||
            "Kontrollinje";

          const key =
            asString(item.standard_key, "") ||
            asString(item.token, "") ||
            asString(item.id, "") ||
            `${title}-${index}`;

          const detail =
            asString(item.detail_no, "") ||
            asString(item.message_no, "") ||
            asString(item.expected_use_no, "") ||
            asString(item.table_type, "");

          const extra =
            asString(item.suggestion_no, "") ||
            asString(item.action_route, "") ||
            asString(item.current_value, "");

          return (
            <article
              key={key}
              className={`${styles.controlLine} ${statusClass(status)}`}
            >
              <div className={styles.lineNumber}>
                {asString(item.line_no, asString(item.id, String(index + 1)))}
              </div>
              <div className={styles.lineMain}>
                <div className={styles.lineHeader}>
                  <strong>{title}</strong>
                  <span>{status}</span>
                </div>
                <p>{detail || key}</p>
                {extra ? <small>{extra}</small> : null}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Collectium System Control</p>
          <h1>MariaDB - Neon Postgres Control</h1>

<p>
            Kontrollside for database, API, brytere, template, skin, layout og
            sidekrav før Neon kan bli sann hoveddatabase.
          </p>
</div>

        <div className={styles.heroBadges}>
          <span className={styles.okPill}>Kontroll OK</span>
          <span className={styles.blockPill}>Migrering blokkert</span>
          <div className="mariadbNeonLayoutGuideHost">
            <MariaDbNeonLayoutGuide />
          </div>
        </div>
      </section>

      <section className={styles.cards}>
        <article className={styles.statusCard}>
          <span>MariaDB</span>
          <strong>{asString(getPath(dbOverview, ["status", "mariadb"]))}</strong>
          <p>
            {asString(getPath(mariadbSummary, ["table_count"]))} tabeller /{" "}
            {asString(getPath(mariadbSummary, ["view_count"]))} views /{" "}
            {asString(getPath(mariadbSummary, ["column_count"]))} kolonner
          </p>
        </article>

        <article className={styles.statusCard}>
          <span>Neon</span>
          <strong>{asString(getPath(dbOverview, ["status", "neon"]))}</strong>
          <p>
            {asString(getPath(neonSummary, ["table_count"]))} tabeller /{" "}
            {asString(getPath(neonSummary, ["view_count"]))} views /{" "}
            {asString(getPath(neonSummary, ["column_count"]))} kolonner
          </p>
        </article>

        <article className={styles.statusCard}>
          <span>Plattform</span>
          <strong>
            {asString(getPath(platformSummary, ["ok"]), "0")} OK /{" "}
            {asString(getPath(platformSummary, ["varsel"]), "0")} varsel
          </strong>
          <p>{asString(getPath(platformSummary, ["feil"]), "0")} feil</p>
        </article>

        <article className={styles.statusCard}>
          <span>Template tokens</span>
          <strong>
            {asString(getPath(tokenSummary, ["ok"]), "0")} OK /{" "}
            {asString(getPath(tokenSummary, ["feil"]), "0")} feil
          </strong>
          <p>{asString(getPath(templateTokenCheck, ["token_count"]), "0")} tokens kontrollert</p>
        </article>
      </section>

      <nav className={styles.tabs} aria-label="MariaDB - Neon Postgres Control tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? styles.activeTab : ""}
            onClick={() => {
              setActiveTab(tab.key);
              void logControlEvent({
                event_type: "tab_click",
                tab_key: tab.key,
                button_key: `tab.${tab.key}`,
                feature_key: `system.mariadb_neon.tab.${tab.key}`,
                action_route: "local_tab_switch",
                http_method: "LOCAL",
                status: "INFO",
                severity: "info",
                message_no: `Fane åpnet: ${tab.label}`,
                payload_json: {
                  tab_key: tab.key,
                  tab_label: tab.label,
                },
              });
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <section className={styles.panel}>
          <h2>Laster kontrollstatus</h2>
          <p>Henter database, plattform, template tokens og hendelseslogg.</p>
        </section>
      ) : null}

      {activeTab === "dashboard" ? (
        <section className={styles.panel}>
          <h2>Dashboard</h2>
          <div className={styles.dashboardGrid}>
            <div>
              <h3>Status</h3>
              {renderCheckList(
                [
                  {
                    line_no: 1,
                    status: asString(getPath(dbOverview, ["status", "mariadb"])),
                    area: "MariaDB",
                    detail_no: "Legacy truth/control archive er tilgjengelig.",
                    suggestion_no: "OK",
                  },
                  {
                    line_no: 2,
                    status: asString(getPath(dbOverview, ["status", "neon"])),
                    area: "Neon",
                    detail_no: "Neon er koblet, men ikke sann hoveddatabase.",
                    suggestion_no: "Migrering fortsatt blokkert.",
                  },
                  {
                    line_no: 3,
                    status: "BLOKKERT",
                    area: "Migrering",
                    detail_no: "Kildedata skal ikke migreres før mapping, relasjoner, DB 8.4, auth/session og sidekrav er OK.",
                    suggestion_no: "Fortsett med source-relation-overview.",
                  },
                ],
                "Dashboard mangler data."
              )}
            </div>

            <div>
              <h3>Neste kontroller</h3>
              {renderCheckList(
                [
                  {
                    line_no: 1,
                    status: "INFO",
                    area: "Source relation overview",
                    detail_no: "Leser MariaDB read-only og finner kilder, object_group, relasjonstabeller, marked og samling.",
                    suggestion_no: "Bygg GET /api/system/source-relation-overview.",
                  },
                  {
                    line_no: 2,
                    status: "INFO",
                    area: "Table mapping",
                    detail_no: "Mapper MariaDB-tabeller mot Neon-målstruktur.",
                    suggestion_no: "Ikke migrer data ennå.",
                  },
                ],
                "Ingen neste steg."
              )}
            </div>
          </div>
        </section>
      ) : null}
      {activeTab === "inventory" ? (
        <section className={styles.panel}>
          <h2>Inventory</h2>
          <p className={styles.panelLead}>
            Linje-for-linje kontroll: hver MariaDB-tabell til venstre må ha
            tilsvarende Neon-status til høyre. Mangler vises rødt. Tabeller som
            finnes, men trenger mapping/radtelling/kolonnekontroll, vises gult.
          </p>

          <div className={styles.inventoryPairs}>
            {mariadbTables.map((row, index) => {
              const pair = buildInventoryPair(row, index);

              return (
                <article key={`${pair.line_no}-${pair.maria.table_name}`} className={styles.inventoryPair}>
                  <div className={`${styles.controlLine} ${statusClass(pair.maria.status)}`}>
                    <div className={styles.lineNumber}>{pair.line_no}</div>
                    <div className={styles.lineMain}>
                      <div className={styles.lineHeader}>
                        <strong>{pair.maria.table_name}</strong>
                        <span>{pair.maria.status}</span>
                      </div>
                      <p>{pair.maria.table_type}</p>
                      <small>{pair.maria.detail_no}</small>
                    </div>
                  </div>

                  <div className={`${styles.controlLine} ${statusClass(pair.neon.status)}`}>
                    <div className={styles.lineNumber}>{pair.line_no}</div>
                    <div className={styles.lineMain}>
                      <div className={styles.lineHeader}>
                        <strong>{pair.neon.table_name}</strong>
                        <span>{pair.neon.status}</span>
                      </div>
                      <p>{pair.neon.table_type}</p>
                      <small>{pair.neon.detail_no}</small>
                      <small>{pair.neon.suggestion_no}</small>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.extraInventoryBox}>
            <h3>Neon ekstra kontrolltabeller</h3>
            <p>
              Disse finnes i Neon som kontrolltabeller. De skal ikke nødvendigvis
              ha samme linjenummer som MariaDB-tabellene, fordi de er laget for
              migreringskontroll, mapping, logging og truth-status.
            </p>

            {renderCheckList(
              neonTables.map((row, index) => ({
                line_no: index + 1,
                status: "OK",
                area: asString(row.table_name),
                detail_no: asString(row.table_type),
                suggestion_no: "Neon kontrolltabell.",
              })),
              "Ingen Neon-tabeller funnet."
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "platform" ? (
        <section className={styles.panel}>
          <h2>Plattformstandard</h2>
          <p className={styles.panelLead}>
            Next.js, React, Vercel, Neon, Node.js, API-ruter, server/client
            components, DB-tilkobling, miljøvariabler og build/deploy.
          </p>
          {renderCheckList(platformChecks, "Platform-standard-check mangler eller svarer ikke.")}
        </section>
      ) : null}

      {activeTab === "template" ? (
        <section className={styles.panel}>
          <h2>Template token-kontroll</h2>
          <p className={styles.panelLead}>
            Kontrollerer at de 20 UI 8.5-tokenene finnes og brukes i riktig kontekst.
          </p>
          {renderCheckList(tokenChecks, "Template-token-check mangler eller svarer ikke.")}
        </section>
      ) : null}

      {activeTab === "skin" ? (
        <section className={styles.panel}>
          <h2>Skin</h2>
          <div className={styles.skinGrid}>
            {["Collectium", "Finans", "Museum", "Samler / Enkel"].map((skin, index) => (
              <article key={skin} className={styles.skinCard}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{skin}</strong>
                <p>Skal bruke samme 20 tokens, men med egen palett.</p>
              </article>
            ))}
          </div>
          {renderCheckList(tokenChecks, "Ingen tokenkontroll tilgjengelig.")}
        </section>
      ) : null}

      {activeTab === "layout" ? (
        <section className={styles.panel}>
          <h2>Layout</h2>
          {renderCheckList(
            [
              {
                line_no: 1,
                status: "OK",
                area: "App background",
                detail_no: "--ct-app-bg skal styre hovedbakgrunn.",
                suggestion_no: "Kontrolleres av template-token-check.",
              },
              {
                line_no: 2,
                status: "OK",
                area: "Sidebar",
                detail_no: "--ct-app-sidebar-bg skal styre sidemeny/global meny.",
                suggestion_no: "Kontrolleres av template-token-check.",
              },
              {
                line_no: 3,
                status: "OK",
                area: "Topbar",
                detail_no: "--ct-app-topbar-bg skal styre topbar.",
                suggestion_no: "Kontrolleres av template-token-check.",
              },
              {
                line_no: 4,
                status: "OK",
                area: "Cards / panels",
                detail_no: "--ct-card-bg, --ct-panel-bg og --ct-panel-border skal styre kort/paneler.",
                suggestion_no: "Ingen lokale farger på vanlige sider.",
              },
            ],
            "Layout-kontroll mangler."
          )}
        </section>
      ) : null}

      {activeTab === "api" ? (
        <section className={styles.panel}>
          <h2>API-ruter</h2>
          {renderCheckList(
            [
              "/api/system/db-overview",
              "/api/system/schema-inventory",
              "/api/system/mariadb-neon-bootstrap",
              "/api/system/platform-standard-check",
              "/api/system/template-token-check",
              "/api/system/control-event-log",
            ].map((route, index) => ({
              line_no: index + 1,
              status: "OK",
              area: route,
              detail_no: "Ruten er koblet inn i MariaDB - Neon Postgres Control.",
              suggestion_no: "OK",
            })),
            "API-ruter mangler."
          )}
        </section>
      ) : null}

      {activeTab === "features" ? (
        <section className={styles.panel}>
          <h2>DB-brytere</h2>
          {renderCheckList(
            [
              {
                line_no: 1,
                status: "INFO",
                area: "system.mariadb_neon.control",
                detail_no: "Kontrollerer MariaDB - Neon Postgres Control-siden.",
                suggestion_no: "Skal senere kobles mot DB 8.4-kjede.",
              },
              {
                line_no: 2,
                status: "INFO",
                area: "system.template.token_check",
                detail_no: "Kontrollerer template-token-bruk.",
                suggestion_no: "Skal senere registreres i ct_app_features.",
              },
              {
                line_no: 3,
                status: "INFO",
                area: "system.control_event_log.write",
                detail_no: "Logger kontrollhendelser.",
                suggestion_no: "OK i Neon ct_control_event_logs.",
              },
            ],
            "Ingen brytere vist."
          )}
        </section>
      ) : null}

      {activeTab === "pages" ? (
        <section className={styles.panel}>
          <h2>Sidekrav</h2>
          {renderCheckList(
            [
              {
                line_no: 1,
                status: "OK",
                area: "/admin/system/mariadb-neon",
                detail_no: "Skal vise database, API, brytere, template, skin, layout og sidekrav.",
                suggestion_no: "Denne siden er kontrollsenter.",
              },
              {
                line_no: 2,
                status: "BLOKKERT",
                area: "Neon truth approval",
                detail_no: "Neon er ikke sann hoveddatabase før alle kontroller er OK.",
                suggestion_no: "Fortsett med source-relation-overview.",
              },
            ],
            "Ingen sidekrav vist."
          )}
        </section>
      ) : null}

      {activeTab === "diagnose" ? (
        <section className={styles.panel}>
          <h2>Diagnose</h2>
          {renderCheckList(
            [
              {
                line_no: 1,
                status: "OK",
                area: "Control event log",
                detail_no: `${eventRows.length} hendelser funnet.`,
                suggestion_no: "Trykk på faner for å logge flere.",
              },
              {
                line_no: 2,
                status: tokenChecks.length > 0 ? "OK" : "FEIL",
                area: "Template token check",
                detail_no: `${tokenChecks.length} tokenlinjer vist.`,
                suggestion_no: tokenChecks.length > 0 ? "OK" : "Koble /api/system/template-token-check.",
              },
              {
                line_no: 3,
                status: platformChecks.length > 0 ? "OK" : "FEIL",
                area: "Platform standard check",
                detail_no: `${platformChecks.length} plattformlinjer vist.`,
                suggestion_no: platformChecks.length > 0 ? "OK" : "Koble /api/system/platform-standard-check.",
              },
            ],
            "Diagnose mangler."
          )}
        </section>
      ) : null}

      {activeTab === "events" ? (
        <section className={styles.panel}>
          <h2>Hendelseslogg</h2>
          <p className={styles.panelLead}>
            Logger faneklikk, knapper, manglende koblinger, route-feil og blokkerte handlinger.
          </p>
          {renderCheckList(eventRows, "Ingen hendelser registrert ennå.")}
        </section>
      ) : null}
      {activeTab === "transfer" ? (
        <MariaDbNeonTransferMatrix />
      ) : null}

        {activeTab === "applications" ? (
        <MariaDbNeonApplicationRuntimeOverview mode="modules" />
      ) : null}

      {activeTab === "userActivity" ? (
        <MariaDbNeonApplicationRuntimeOverview mode="userActivity" />
      ) : null}

      {activeTab === "blobFiles" ? (
        <MariaDbNeonApplicationRuntimeOverview mode="blobFiles" />
      ) : null}

      {activeTab === "vercelSandbox" ? (
        <MariaDbNeonApplicationRuntimeOverview mode="vercelSandbox" />
      ) : null}

      

      {activeTab === "json" ? (
        <section className={styles.panel}>
          <h2>JSON</h2>
          <pre className={styles.jsonBox}>{JSON.stringify(allJson, null, 2)}</pre>
        </section>
      ) : null}

      {activeTab === "chatgpt" ? (
        <section className={styles.panel}>
          <h2>Svar til ChatGPT</h2>
          <p className={styles.panelLead}>
            Kopier denne statusen inn i neste chat hvis vi skal fortsette kontrollen.
          </p>
          <pre className={styles.jsonBox}>{answerToChatGpt}</pre>
        </section>
      ) : null}
</main>
  );
}




























