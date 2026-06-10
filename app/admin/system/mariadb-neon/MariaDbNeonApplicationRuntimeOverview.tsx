"use client";

/*
 * Overskrift:
 * MariaDB - Neon Application Runtime Overview
 *
 * Definering / formål:
 * Viser aktive applikasjoner, deploy-kilde, GitHub, Vercel, Next.js, React, Neon og siste prosess.
 *
 * Bruksområde:
 * Brukes som kontrollfane på /admin/system/mariadb-neon.
 *
 * Berørte DB-brytere / feature_keys:
 * system.application_runtime_overview
 * system.mariadb_neon.control
 * system.active_integrations.control
 *
 * Berørte sider/routes:
 * /admin/system/mariadb-neon
 * /api/system/application-runtime-overview
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./MariaDbNeonApplicationRuntimeOverview.module.css";

type RuntimeOverview = {
  ok?: boolean;
  generated_at?: string;
  collectium?: Record<string, unknown>;
  vercel?: Record<string, unknown>;
  github?: Record<string, unknown>;
  framework?: Record<string, unknown>;
  neon?: Record<string, unknown>;
  integrations?: Array<Record<string, unknown>>;
  last_human_process?: Record<string, unknown>;
};

function valueToText(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Mangler";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function StatusBadge({ value }: { value: unknown }) {
  const text = valueToText(value);
  const normalized = text.toLowerCase();

  let className = styles.badgeInfo;
  if (normalized.includes("ok")) className = styles.badgeOk;
  if (normalized.includes("missing") || normalized.includes("mangler")) className = styles.badgeMissing;
  if (normalized.includes("unknown") || normalized.includes("placeholder")) className = styles.badgeWarn;

  return <span className={className}>{text}</span>;
}

function InfoGrid({ title, data }: { title: string; data?: Record<string, unknown> }) {
  const entries = Object.entries(data || {});

  return (
    <section className={styles.panel}>
      <h3>{title}</h3>

      <div className={styles.infoGrid}>
        {entries.map(([key, value]) => (
          <div className={styles.infoItem} key={key}>
            <span>{key}</span>
            <strong>{valueToText(value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MariaDbNeonApplicationRuntimeOverview() {
  const [data, setData] = useState<RuntimeOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/system/application-runtime-overview", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API svarte ${response.status}`);
      }

      const payload = (await response.json()) as RuntimeOverview;
      setData(payload);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Ukjent feil");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const integrations = useMemo(() => data?.integrations || [], [data]);

  if (isLoading) {
    return (
      <section className={styles.runtimeBox}>
        <h2>Aktive applikasjoner / tilknytninger</h2>
        <p>Laster aktiv runtime-status ...</p>
      </section>
    );
  }

  if (errorText) {
    return (
      <section className={styles.runtimeBox}>
        <h2>Aktive applikasjoner / tilknytninger</h2>
        <p className={styles.errorText}>Kunne ikke hente status: {errorText}</p>
        <button type="button" onClick={loadData}>Prøv igjen</button>
      </section>
    );
  }

  return (
    <section className={styles.runtimeBox}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Runtime truth</p>
          <h2>Aktive applikasjoner / tilknytninger</h2>
          <p>
            Denne fanen viser hvilken Vercel-deploy, GitHub-commit, Next.js/React-versjon og Neon-kobling som faktisk kjører.
          </p>
        </div>

        <button type="button" onClick={loadData}>Oppdater</button>
      </header>

      <div className={styles.summaryGrid}>
        <article>
          <span>Aktiv side</span>
          <strong>{valueToText(data?.collectium?.control_page_name)}</strong>
          <small>{valueToText(data?.collectium?.control_page)}</small>
        </article>

        <article>
          <span>Vercel miljø</span>
          <strong>{valueToText(data?.vercel?.environment)}</strong>
          <small>{valueToText(data?.vercel?.project_url)}</small>
        </article>

        <article>
          <span>GitHub commit</span>
          <strong>{valueToText(data?.github?.commit_short_sha)}</strong>
          <small>{valueToText(data?.github?.branch)}</small>
        </article>

        <article>
          <span>Neon kobling</span>
          <strong>{valueToText(data?.neon?.active_connection_hint)}</strong>
          <small>{valueToText((data?.neon?.database_url as Record<string, unknown> | undefined)?.host)}</small>
        </article>
      </div>

      <section className={styles.panel}>
        <h3>Integrasjonsstatus</h3>

        <div className={styles.integrationList}>
          {integrations.map((item, index) => (
            <article key={`${valueToText(item.name)}-${index}`}>
              <div>
                <strong>{valueToText(item.name)}</strong>
                <span>{valueToText(item.detail)}</span>
              </div>
              <StatusBadge value={item.status} />
            </article>
          ))}
        </div>
      </section>

      <div className={styles.columns}>
        <InfoGrid title="Vercel" data={data?.vercel} />
        <InfoGrid title="GitHub" data={data?.github} />
      </div>

      <div className={styles.columns}>
        <InfoGrid title="Next.js / React" data={data?.framework} />
        <InfoGrid title="Collectium" data={data?.collectium} />
      </div>

      <InfoGrid title="Neon / databasekoblinger" data={data?.neon} />

      <section className={styles.panel}>
        <h3>Sist registrert menneskelig prosess</h3>
        <div className={styles.processBox}>
          <StatusBadge value={data?.last_human_process?.status} />
          <p>{valueToText(data?.last_human_process?.text)}</p>

          <div className={styles.infoGrid}>
            {Object.entries((data?.last_human_process?.fallback_process as Record<string, unknown>) || {}).map(([key, value]) => (
              <div className={styles.infoItem} key={key}>
                <span>{key}</span>
                <strong>{valueToText(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className={styles.generatedAt}>
        Sist hentet: {valueToText(data?.generated_at)}
      </p>
    </section>
  );
}
