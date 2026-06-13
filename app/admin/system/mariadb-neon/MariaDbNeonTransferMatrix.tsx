"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./MariaDbNeonTransferMatrix.module.css";

type TransferStatus = "OK" | "VARSEL" | "MANGLER" | "INFO" | "BLOKKERT" | string;
type TransferStatusColor = "green" | "yellow" | "red" | "blue" | string;

type TransferRow = {
  line_no: number;
  source_key: string;
  object_group: string;
  source_role?: string | null;
  source_role_label?: string | null;
  mariadb_table: string | null;
  neon_table: string | null;
  mariadb_exists: boolean;
  neon_exists: boolean;
  mariadb_rows: number | null;
  neon_rows: number | null;
  status: TransferStatus;
  status_color: TransferStatusColor;
  deviation_no: string;
  next_action_no: string;
};

type SourceRuleRow = {
  line_no: number;
  source_key: string;
  object_group: string;
  source_role: string;
  source_role_label: string;
  primary_source_table: string | null;
  legacy_control_source: string | null;
  neon_target_table: string | null;
  import_method: string;
  mapping_rule: string;
  validation_rule: string;
  utf8_rule: string;
  id_rule: string;
  relation_rule: string;
  filter_rule: string;
  migration_allowed: boolean;
  truth_approval_allowed: boolean;
  status: string;
  blocking_level: string;
  next_action: string | null;
  notes: string | null;
};

type TransferMatrixResponse = {
  ok: boolean;
  checked_at: string;
  summary: {
    total: number;
    ok: number;
    varsel: number;
    mangler: number;
    info: number;
    rules_defined?: number;
    methods_defined?: number;
    migration_allowed?: number;
    truth_approval_allowed?: number;
    blocked?: number;
  };
  database_summary: {
    mariadb_table_or_view_count: number;
    neon_table_or_view_count: number;
  };
  rows: TransferRow[];
  source_rules?: SourceRuleRow[];
  collectium_rule?: {
    migration_allowed: boolean;
    neon_truth_approval_allowed: boolean;
    reason: string;
  };
};

type MatrixView = "source_status" | "rules_methods";

function normalizeStatus(status: string | null | undefined): string {
  return String(status || "INFO").toUpperCase();
}

function getStatusClass(status: string | null | undefined): string {
  const normalized = normalizeStatus(status);
  if (normalized === "OK") return styles.statusOK;
  if (normalized === "VARSEL") return styles.statusVARSEL;
  if (normalized === "MANGLER") return styles.statusMANGLER;
  if (normalized === "BLOKKERT") return styles.statusMANGLER;
  return styles.statusINFO;
}

function getBadgeClass(status: string | null | undefined): string {
  const normalized = normalizeStatus(status);
  if (normalized === "OK") return styles.badgeOK;
  if (normalized === "VARSEL") return styles.badgeVARSEL;
  if (normalized === "MANGLER") return styles.badgeMANGLER;
  if (normalized === "BLOKKERT") return styles.badgeMANGLER;
  return styles.badgeINFO;
}

function roleLabel(role: string | null | undefined): string {
  if (role === "primary_import" || role === "primary_source") return "Primær importkilde";
  if (role === "legacy_control" || role === "legacy_resolved_table") return "Kontrollkilde";
  if (role === "neon_first") return "Neon-first";
  if (role === "staging_source") return "Stagingkilde";
  if (role === "control_source") return "Kontrollkilde";
  return role || "Ukjent rolle";
}

function boolLabel(value: boolean): string {
  return value ? "Ja" : "Nei";
}

export default function MariaDbNeonTransferMatrix() {
  const [activeView, setActiveView] = useState<MatrixView>("source_status");
  const [data, setData] = useState<TransferMatrixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/system/mariadb-neon-transfer-matrix", {
          cache: "no-store"
        });

        const json = (await response.json()) as TransferMatrixResponse;

        if (!response.ok) {
          throw new Error(JSON.stringify(json));
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Ukjent feil");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const sourceRules = useMemo(() => data?.source_rules || [], [data]);

  if (error) {
    return (
      <section className={styles.transferMatrixSection}>
        <div className={styles.transferMatrixHeader}>
          <h2>Overføringsmatrise</h2>
          <p>Feil ved lasting: {error}</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={styles.transferMatrixSection}>
        <div className={styles.transferMatrixHeader}>
          <h2>Overføringsmatrise</h2>
          <p>Laster MariaDB-Neon-overføring...</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.transferMatrixSection}>
      <div className={styles.transferMatrixHeader}>
        <p className={styles.eyebrow}>MariaDB - Neon</p>
        <h2>Overføringsmatrise</h2>
        <p>
          Kilder: {data.summary.total}. OK: {data.summary.ok}. Varsel: {data.summary.varsel}. Mangler:{" "}
          {data.summary.mangler}. Info: {data.summary.info}.
        </p>
        <p>
          MariaDB tabeller/views: {data.database_summary.mariadb_table_or_view_count}. Neon tabeller/views:{" "}
          {data.database_summary.neon_table_or_view_count}.
        </p>
      </div>

      <div className={styles.summaryGrid}>
        <article>
          <span>Regler/metoder</span>
          <strong>{data.summary.rules_defined ?? sourceRules.length}</strong>
          <small>Definerte kilderegler i Neon</small>
        </article>
        <article>
          <span>Migrering tillatt</span>
          <strong>{data.summary.migration_allowed ?? 0}</strong>
          <small>Skal være 0 til mapping/validering er OK</small>
        </article>
        <article>
          <span>Truth-godkjenning</span>
          <strong>{data.summary.truth_approval_allowed ?? 0}</strong>
          <small>Skal være 0 før Neon er kontrollert</small>
        </article>
        <article>
          <span>Blokkert</span>
          <strong>{data.summary.blocked ?? sourceRules.length}</strong>
          <small>Kilder som ikke kan godkjennes ennå</small>
        </article>
      </div>

      <div className={styles.matrixSubTabs} aria-label="Overføringsmatrise visning">
        <button
          type="button"
          className={activeView === "source_status" ? styles.activeMatrixSubTab : ""}
          onClick={() => setActiveView("source_status")}
        >
          Kilde- og radstatus
        </button>
        <button
          type="button"
          className={activeView === "rules_methods" ? styles.activeMatrixSubTab : ""}
          onClick={() => setActiveView("rules_methods")}
        >
          Regler og metoder
        </button>
      </div>

      {activeView === "source_status" ? (
        <div className={styles.transferMatrixTableWrap}>
          <table className={styles.transferMatrixTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Kilde</th>
                <th>Rolle</th>
                <th>MariaDB</th>
                <th>Neon</th>
                <th>Status</th>
                <th>Tiltak</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={`${row.source_key}:${row.object_group}:${row.source_role}:${row.mariadb_table}`} className={getStatusClass(row.status)}>
                  <td>{row.line_no}</td>
                  <td>
                    <strong>{row.source_key}</strong>
                    <small>{row.object_group}</small>
                  </td>
                  <td>
                    <strong>{row.source_role_label || roleLabel(row.source_role)}</strong>
                    <small>{row.source_role || "—"}</small>
                  </td>
                  <td>
                    <code>{row.mariadb_table || "—"}</code>
                    <small>{row.mariadb_exists ? "finnes" : "mangler"} - rader: {row.mariadb_rows ?? "ukjent"}</small>
                  </td>
                  <td>
                    <code>{row.neon_table || "—"}</code>
                    <small>{row.neon_exists ? "finnes" : "mangler"} - rader: {row.neon_rows ?? 0}</small>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getBadgeClass(row.status)}`}>{row.status}</span>
                    <small>{row.deviation_no}</small>
                  </td>
                  <td>{row.next_action_no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeView === "rules_methods" ? (
        <div className={styles.transferMatrixTableWrap}>
          <table className={`${styles.transferMatrixTable} ${styles.rulesTable}`}>
            <thead>
              <tr>
                <th>#</th>
                <th>Kilde</th>
                <th>Rolle</th>
                <th>Kilder</th>
                <th>Metode</th>
                <th>Regler</th>
                <th>Godkjenning</th>
                <th>Status / tiltak</th>
              </tr>
            </thead>
            <tbody>
              {sourceRules.length === 0 ? (
                <tr className={styles.statusMANGLER}>
                  <td>1</td>
                  <td colSpan={7}>
                    <strong>Regelregister mangler</strong>
                    <small>Opprett ct_migration_source_rules og ct_v_migration_transfer_matrix_full i Neon.</small>
                  </td>
                </tr>
              ) : (
                sourceRules.map((rule) => (
                  <tr key={`${rule.source_key}:${rule.object_group}:${rule.source_role}`} className={getStatusClass(rule.status)}>
                    <td>{rule.line_no}</td>
                    <td>
                      <strong>{rule.source_key}</strong>
                      <small>{rule.object_group}</small>
                    </td>
                    <td>
                      <strong>{rule.source_role_label || roleLabel(rule.source_role)}</strong>
                      <small>{rule.source_role}</small>
                    </td>
                    <td>
                      <code>MariaDB: {rule.primary_source_table || "—"}</code>
                      <code>Kontroll: {rule.legacy_control_source || "—"}</code>
                      <code>Neon: {rule.neon_target_table || "—"}</code>
                    </td>
                    <td>
                      <strong>{rule.import_method}</strong>
                      <small>{rule.mapping_rule}</small>
                      <small>{rule.validation_rule}</small>
                    </td>
                    <td>
                      <small>UTF-8: {rule.utf8_rule}</small>
                      <small>ID: {rule.id_rule}</small>
                      <small>Relasjon: {rule.relation_rule}</small>
                      <small>Filter: {rule.filter_rule}</small>
                    </td>
                    <td>
                      <small>Migrering: {boolLabel(rule.migration_allowed)}</small>
                      <small>Truth: {boolLabel(rule.truth_approval_allowed)}</small>
                      <small>Blokkering: {rule.blocking_level}</small>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getBadgeClass(rule.status)}`}>{rule.status}</span>
                      <small>{rule.next_action || "Ingen tiltak registrert."}</small>
                      {rule.notes ? <small>{rule.notes}</small> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className={styles.matrixRuleBox}>
        <strong>Kontrollregel</strong>
        <p>
          Denne fanen viser status og regler. Den migrerer ikke data, og den kan ikke godkjenne Neon som sann database.
          Alle kilder skal ha migration_allowed=false og truth_approval_allowed=false til mapping, UTF-8, ID,
          relasjoner, filter og radkontroll er godkjent.
        </p>
      </div>
    </section>
  );
}
