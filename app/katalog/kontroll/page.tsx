"use client";

/**
 * COLLECTIUM FILE HEADER
 * Fil: app/katalog/kontroll/page.tsx
 * Definering/formål:
 * - Enkel katalogside for kontroll av MariaDB-data mot Neon/Node API.
 *
 * Bruksområde:
 * - Viser status for katalogkilder før full overføring.
 * - Brukes til å se om sedler, mynter og Neon-first grupper er klare.
 *
 * Berørte DB-brytere/feature_keys:
 * - catalog.control_data
 * - migration.catalog_object_staging
 *
 * Berørte sider/routes:
 * - /katalog/kontroll
 * - /api/catalog/control-data
 */

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type CatalogControlRow = {
  line_no: number;
  source_key: string;
  object_group: string;
  label_no: string;
  mariadb_table: string | null;
  neon_table: string;
  mariadb_expected_rows: number | null;
  mariadb_actual_rows: number | null;
  neon_staging_rows: number | null;
  status: "OK" | "VARSEL" | "MANGLER" | "INFO";
  status_color: "green" | "yellow" | "red" | "blue";
  deviation_no: string;
  next_action_no: string;
};

type CatalogControlResponse = {
  ok: boolean;
  source: string;
  checked_at: string;
  summary: {
    total: number;
    ok: number;
    varsel: number;
    mangler: number;
    info: number;
  };
  rows: CatalogControlRow[];
};

function statusClass(color: CatalogControlRow["status_color"]): string {
  if (color === "green") return styles.statusGreen;
  if (color === "yellow") return styles.statusYellow;
  if (color === "blue") return styles.statusBlue;
  return styles.statusRed;
}

export default function CatalogControlPage() {
  const [data, setData] = useState<CatalogControlResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadControlData() {
    setError(null);

    try {
      const response = await fetch(`/api/catalog/control-data?ts=${Date.now()}`, {
        cache: "no-store"
      });

      const json = (await response.json()) as CatalogControlResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil ved lasting.");
    }
  }

  useEffect(() => {
    loadControlData();
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Collectium katalogkontroll</p>
          <h1>Kontroll av katalogdata</h1>
          <p>
            Enkel side for å kontrollere MariaDB-kilder mot Neon staging gjennom Node.js API.
            Siden migrerer ikke data og godkjenner ikke Neon som truth.
          </p>
        </div>

        <button className={styles.refreshButton} type="button" onClick={loadControlData}>
          Oppdater kontroll
        </button>
      </section>

      {error ? (
        <section className={styles.errorBox}>
          <h2>Feil</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!data ? (
        <section className={styles.panel}>
          <p>Laster katalogkontroll...</p>
        </section>
      ) : (
        <>
          <section className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <span>Kilder</span>
              <strong>{data.summary.total}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span>OK</span>
              <strong>{data.summary.ok}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span>Varsel</span>
              <strong>{data.summary.varsel}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span>Mangler</span>
              <strong>{data.summary.mangler}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span>Info</span>
              <strong>{data.summary.info}</strong>
            </article>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Kildekontroll</h2>
                <p>Sist sjekket: {data.checked_at}</p>
              </div>
              <span className={data.ok ? styles.mainOk : styles.mainWarning}>
                {data.ok ? "Klar" : "Ikke klar"}
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Kilde</th>
                    <th>MariaDB</th>
                    <th>Neon staging</th>
                    <th>Status</th>
                    <th>Neste tiltak</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={`${row.source_key}:${row.object_group}:${row.mariadb_table}`}>
                      <td>{row.line_no}</td>
                      <td>
                        <strong>{row.label_no}</strong>
                        <small>{row.source_key} / {row.object_group}</small>
                      </td>
                      <td>
                        <code>{row.mariadb_table || "—"}</code>
                        <small>
                          rader: {row.mariadb_actual_rows ?? "—"}
                          {row.mariadb_expected_rows !== null ? ` / forventet ${row.mariadb_expected_rows}` : ""}
                        </small>
                      </td>
                      <td>
                        <code>{row.neon_table}</code>
                        <small>rader: {row.neon_staging_rows ?? "—"}</small>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${statusClass(row.status_color)}`}>
                          {row.status}
                        </span>
                        <small>{row.deviation_no}</small>
                      </td>
                      <td>{row.next_action_no}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
