"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB Neon Application Runtime Overview
 *
 * Definering / formål:
 * Viser aktive moduler, brukeraktivitet, Blob/filer og Vercel Sandbox
 * på MariaDB -> Neon kontrollsiden.
 *
 * Bruksområde:
 * - /admin/system/mariadb-neon
 *
 * Berørte API-ruter:
 * - GET /api/system/application-runtime-overview
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.active_modules.view
 * - admin.system.user_activity.view
 * - admin.system.blob_files.view
 * - admin.system.vercel_sandbox.view
 *
 * Dataretning:
 * Runtime/API -> React-komponent -> admin UI
 *
 * Logging:
 * log_category: system
 * log_action: application_runtime_overview.view
 *
 * Versjon:
 * CT-COMPONENT-APPLICATION-RUNTIME-OVERVIEW-0002 / CHANGE-2026-06-10-RUNTIME-MODES
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./MariaDbNeonApplicationRuntimeOverview.module.css";

type RuntimeMode = "modules" | "userActivity" | "blobFiles" | "vercelSandbox" | "all";

type JsonRecord = Record<string, unknown>;

type RuntimeData = {
  ok?: boolean;
  source?: string;
  route?: string;
  checked_at?: string;
  project?: JsonRecord;
  env_status?: JsonRecord;
  summary?: JsonRecord;
  active_modules?: JsonRecord[];
  module_activity?: JsonRecord[];
  user_activity?: JsonRecord;
  blob_activity?: JsonRecord[];
  sandbox_activity?: JsonRecord[];
  svar_til_chatgpt?: JsonRecord;
};

function asString(value: unknown, fallback = "Mangler") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Ja" : "Nei";
  return String(value);
}

function asRows(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((row): row is JsonRecord => Boolean(row && typeof row === "object")) : [];
}

function statusClass(value: unknown) {
  const status = asString(value, "").toLowerCase();

  if (status.includes("ok") || status.includes("klar") || status.includes("aktiv")) return styles.ok;
  if (status.includes("varsel") || status.includes("venter")) return styles.warning;
  if (status.includes("mangler") || status.includes("not_installed")) return styles.missing;
  if (status.includes("feil")) return styles.error;
  if (status.includes("blokkert")) return styles.blocked;
  if (status.includes("planlagt")) return styles.planned;

  return styles.neutral;
}

function getValue(row: JsonRecord, keys: string[], fallback = "Mangler") {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return fallback;
}

function RuntimeTable({ rows }: { rows: JsonRecord[] }) {
  const columns = useMemo(() => {
    const priority = [
      "line_no",
      "module_name",
      "package_name",
      "version",
      "status",
      "activity_status",
      "usage_no",
      "next_action_no",
      "token_present",
      "last_seen_no",
    ];

    const keys = new Set<string>();

    for (const column of priority) {
      if (rows.some((row) => Object.prototype.hasOwnProperty.call(row, column))) {
        keys.add(column);
      }
    }

    for (const row of rows) {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }
    }

    return Array.from(keys);
  }, [rows]);

  if (!rows.length) {
    return <p className={styles.empty}>Ingen rader i denne kontrollen ennå.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => {
                const value = row[column];

                return (
                  <td key={column}>
                    {column === "status" || column === "activity_status" ? (
                      <span className={`${styles.badge} ${statusClass(value)}`}>{asString(value)}</span>
                    ) : (
                      <span>{asString(value, "-")}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({
  label,
  value,
  status,
}: {
  label: string;
  value: unknown;
  status?: unknown;
}) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>
      <strong>{asString(value)}</strong>
      {status !== undefined ? <em className={statusClass(status)}>{asString(status)}</em> : null}
    </article>
  );
}

export default function MariaDbNeonApplicationRuntimeOverview({
  mode = "modules",
}: {
  mode?: RuntimeMode;
}) {
  const [data, setData] = useState<RuntimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  async function loadRuntime() {
    setLoading(true);
    setErrorText("");

    try {
      const response = await fetch("/api/system/application-runtime-overview", {
        cache: "no-store",
      });

      const json = (await response.json()) as RuntimeData;

      if (!response.ok) {
        throw new Error(`API svarte ${response.status}`);
      }

      setData(json);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Ukjent runtime-feil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRuntime();
  }, []);

  const title = {
    modules: "Aktive moduler",
    userActivity: "Brukeraktivitet",
    blobFiles: "Blob / filer",
    vercelSandbox: "Vercel Sandbox",
    all: "Aktive applikasjoner / tilknytninger",
  }[mode];

  const lead = {
    modules: "Viser installerte og aktive runtime-moduler som Next.js, React, Neon, pg, MariaDB, Blob og Sandbox.",
    userActivity: "Viser planlagt og faktisk brukeraktivitet, online-brukere, medlemskap og nødvendige usage-tabeller.",
    blobFiles: "Viser status for Vercel Blob, token, fil-/bildelagring og neste test.",
    vercelSandbox: "Viser status for Vercel Sandbox og neste kontrollerte sandbox-test.",
    all: "Viser hvilken Vercel-deploy, GitHub-commit, Next.js/React-versjon og Neon-kobling som faktisk kjører.",
  }[mode];

  const activeModules = asRows(data?.active_modules);
  const moduleActivity = asRows(data?.module_activity);
  const blobActivity = asRows(data?.blob_activity);
  const sandboxActivity = asRows(data?.sandbox_activity);
  const userActivity = (data?.user_activity || {}) as JsonRecord;
  const envStatus = (data?.env_status || {}) as JsonRecord;
  const summary = (data?.summary || {}) as JsonRecord;
  const project = (data?.project || {}) as JsonRecord;

  const renderedRows =
    mode === "modules"
      ? activeModules.length
        ? activeModules
        : moduleActivity
      : mode === "blobFiles"
        ? blobActivity
        : mode === "vercelSandbox"
          ? sandboxActivity
          : [];

  return (
    <section className={styles.runtimePanel}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Runtime truth</p>
          <h2>{title}</h2>
          <p>{lead}</p>
        </div>

        <button type="button" className={styles.refreshButton} onClick={() => void loadRuntime()}>
          Oppdater
        </button>
      </div>

      {loading ? (
        <div className={styles.notice}>Henter runtime-status...</div>
      ) : null}

      {errorText ? (
        <div className={`${styles.notice} ${styles.errorBox}`}>
          Kunne ikke hente /api/system/application-runtime-overview: {errorText}
        </div>
      ) : null}

      {!loading && !errorText ? (
        <>
          <div className={styles.metrics}>
            <MetricCard label="API source" value={data?.source} status={data?.ok ? "OK" : "VARSEL"} />
            <MetricCard label="Prosjekt" value={project.name} />
            <MetricCard label="Node" value={project.node} />
            <MetricCard label="Vercel miljø" value={envStatus.vercel_env} status={envStatus.vercel ? "OK" : "LOCAL"} />
            <MetricCard label="Neon env" value={envStatus.database_url_present} status={envStatus.database_url_present ? "OK" : "VARSEL"} />
            <MetricCard label="MariaDB env" value={envStatus.mariadb_env_present} status={envStatus.mariadb_env_present ? "OK" : "VARSEL"} />
            <MetricCard label="Blob token" value={envStatus.blob_token_present} status={envStatus.blob_token_present ? "OK" : "VARSEL"} />
            <MetricCard label="Sist hentet" value={data?.checked_at} />
          </div>

          {mode === "modules" || mode === "all" ? (
            <div className={styles.sectionBlock}>
              <h3>Aktive moduler</h3>
              <RuntimeTable rows={activeModules.length ? activeModules : moduleActivity} />
            </div>
          ) : null}

          {mode === "userActivity" || mode === "all" ? (
            <div className={styles.sectionBlock}>
              <h3>Brukeraktivitet</h3>

              <div className={styles.metrics}>
                <MetricCard label="Status" value={userActivity.status} status={userActivity.status} />
                <MetricCard label="Online nå" value={userActivity.online_now} />
                <MetricCard label="Anonyme online" value={userActivity.anonymous_online} />
                <MetricCard label="Innloggede online" value={userActivity.logged_in_online} />
                <MetricCard label="Aktive 24 timer" value={userActivity.active_24h} />
                <MetricCard label="Aktive 7 dager" value={userActivity.active_7d} />
                <MetricCard label="Free" value={userActivity.free_users_active} />
                <MetricCard label="Bronze" value={userActivity.bronze_users_active} />
                <MetricCard label="Silver" value={userActivity.silver_users_active} />
                <MetricCard label="Gold" value={userActivity.gold_users_active} />
                <MetricCard label="Platinum" value={userActivity.platinum_users_active} />
                <MetricCard label="Forhandlere" value={userActivity.dealers_active} />
                <MetricCard label="Admin" value={userActivity.admins_active} />
              </div>

              <div className={styles.infoBox}>
                <strong>Datagrunnlag:</strong> {asString(userActivity.source_no)}
              </div>

              <div className={styles.infoBox}>
                <strong>Neste tiltak:</strong> {asString(userActivity.next_action_no)}
              </div>

              <h4>Nødvendige tabeller</h4>
              <div className={styles.chips}>
                {Array.isArray(userActivity.required_tables)
                  ? userActivity.required_tables.map((table) => (
                      <span key={String(table)}>{String(table)}</span>
                    ))
                  : null}
              </div>
            </div>
          ) : null}

          {mode === "blobFiles" || mode === "all" ? (
            <div className={styles.sectionBlock}>
              <h3>Blob / filer</h3>
              <RuntimeTable rows={blobActivity} />
            </div>
          ) : null}

          {mode === "vercelSandbox" || mode === "all" ? (
            <div className={styles.sectionBlock}>
              <h3>Vercel Sandbox</h3>
              <RuntimeTable rows={sandboxActivity} />
            </div>
          ) : null}

          <div className={styles.footerLine}>
            <span>Moduler totalt: {asString(summary.active_modules_total, "0")}</span>
            <span>OK: {asString(summary.active_modules_ok, "0")}</span>
            <span>Mangler: {asString(summary.active_modules_missing, "0")}</span>
            <span>Neon truth: {asString(summary.neon_truth_status)}</span>
            <span>Migrering tillatt: {asString(summary.migration_allowed)}</span>
          </div>
        </>
      ) : null}
    </section>
  );
}
