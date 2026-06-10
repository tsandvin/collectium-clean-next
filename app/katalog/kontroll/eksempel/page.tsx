"use client";

/**
 * COLLECTIUM FILE HEADER
 * Fil: app/katalog/kontroll/eksempel/page.tsx
 * Definering/formål:
 * - Viser ti eksempelobjekter fra MariaDB og Neon staging.
 *
 * Bruksområde:
 * - Kontrollside før full katalogoverføring.
 *
 * Berørte DB-brytere/feature_keys:
 * - catalog.sample_objects
 * - catalog.control_data
 *
 * Berørte sider/routes:
 * - /katalog/kontroll/eksempel
 * - /api/catalog/sample-objects
 */

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type SampleGroup = {
  source_key: string;
  object_group: string;
  label_no: string;
  mariadb_table: string | null;
  neon_table: string;
  status: "OK" | "VARSEL" | "MANGLER" | "INFO";
  message_no: string;
  mariadb_samples: Array<Record<string, unknown>>;
  neon_samples: Array<Record<string, unknown>>;
};

type SampleResponse = {
  ok: boolean;
  source: string;
  checked_at: string;
  limit: number;
  groups: SampleGroup[];
};

function objectTitle(row: Record<string, unknown>): string {
  const title =
    row.object_title_no ||
    row.collectium_title ||
    row.denomination_raw_no ||
    row.source_catalog_number ||
    row.object_reference_key ||
    row.source_object_id ||
    row.source_row_id;

  return title ? String(title) : "Uten tittel";
}

function objectMeta(row: Record<string, unknown>): string {
  const parts = [
    row.source_catalog_number ? `nr ${row.source_catalog_number}` : null,
    row.object_year_label ? `år ${row.object_year_label}` : null,
    row.litra_raw_no ? `litra ${row.litra_raw_no}` : null,
    row.material_raw_no ? String(row.material_raw_no) : null,
    row.ruler_name_raw_no ? String(row.ruler_name_raw_no) : null
  ].filter(Boolean);

  return parts.join(" · ");
}

function statusClass(status: SampleGroup["status"]): string {
  if (status === "OK") return styles.statusOk;
  if (status === "INFO") return styles.statusInfo;
  if (status === "VARSEL") return styles.statusWarning;
  return styles.statusMissing;
}

export default function CatalogSampleObjectsPage() {
  const [data, setData] = useState<SampleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSamples() {
    setError(null);

    try {
      const response = await fetch(`/api/catalog/sample-objects?limit=10&ts=${Date.now()}`, {
        cache: "no-store"
      });

      const json = (await response.json()) as SampleResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil.");
    }
  }

  useEffect(() => {
    loadSamples();
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Katalogkontroll</p>
          <h1>Eksempel på ti objekter</h1>
          <p>
            Viser konkrete eksempelrader fra MariaDB og Neon staging. Dette er bare kontrollvisning,
            ikke import og ikke Neon truth-godkjenning.
          </p>
        </div>

        <button className={styles.button} type="button" onClick={loadSamples}>
          Oppdater
        </button>
      </section>

      {error ? (
        <section className={styles.errorBox}>
          <h2>Feil</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!data ? (
        <section className={styles.panel}>Laster eksempelobjekter...</section>
      ) : (
        <section className={styles.stack}>
          {data.groups.map((group) => (
            <article className={styles.group} key={`${group.source_key}:${group.object_group}:${group.mariadb_table}`}>
              <header className={styles.groupHeader}>
                <div>
                  <h2>{group.label_no}</h2>
                  <p>
                    {group.source_key} / {group.object_group}
                  </p>
                  <p>
                    MariaDB: <code>{group.mariadb_table || "—"}</code> · Neon:{" "}
                    <code>{group.neon_table}</code>
                  </p>
                </div>

                <span className={`${styles.statusPill} ${statusClass(group.status)}`}>
                  {group.status}
                </span>
              </header>

              <p className={styles.message}>{group.message_no}</p>

              <div className={styles.columns}>
                <section>
                  <h3>MariaDB-eksempler</h3>
                  {group.mariadb_samples.length === 0 ? (
                    <p className={styles.empty}>Ingen MariaDB-eksempler.</p>
                  ) : (
                    <ol className={styles.objectList}>
                      {group.mariadb_samples.map((row, index) => (
                        <li key={`maria-${group.source_key}-${index}`}>
                          <strong>{objectTitle(row)}</strong>
                          <small>{objectMeta(row)}</small>
                          <code>{JSON.stringify(row)}</code>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>

                <section>
                  <h3>Neon staging-eksempler</h3>
                  {group.neon_samples.length === 0 ? (
                    <p className={styles.empty}>Ingen Neon staging-eksempler.</p>
                  ) : (
                    <ol className={styles.objectList}>
                      {group.neon_samples.map((row, index) => (
                        <li key={`neon-${group.source_key}-${index}`}>
                          <strong>{objectTitle(row)}</strong>
                          <small>{objectMeta(row)}</small>
                          <code>{JSON.stringify(row)}</code>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
