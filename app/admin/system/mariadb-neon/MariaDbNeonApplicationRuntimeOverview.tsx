"use client";

/*
 * MariaDB - Neon Application Runtime Overview
 *
 * Formål:
 * Viser aktive applikasjoner, deploy, GitHub, Vercel, Next.js, React, Neon og siste prosess.
 */

import { useEffect, useState } from "react";
import styles from "./MariaDbNeonApplicationRuntimeOverview.module.css";

type RuntimeData = Record<string, any>;

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Mangler";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Badge({ value }: { value: unknown }) {
  const label = text(value);
  const lower = label.toLowerCase();

  let className = styles.badgeInfo;
  if (lower.includes("ok")) className = styles.badgeOk;
  if (lower.includes("mangler")) className = styles.badgeMissing;
  if (lower.includes("ukjent") || lower.includes("ikke koblet")) className = styles.badgeWarn;

  return <span className={className}>{label}</span>;
}

function InfoPanel({ title, data }: { title: string; data?: RuntimeData }) {
  return (
    <section className={styles.panel}>
      <h3>{title}</h3>
      <div className={styles.infoGrid}>
        {Object.entries(data || {}).map(([key, value]) => (
          <article key={key}>
            <span>{key}</span>
            <strong>{text(value)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MariaDbNeonApplicationRuntimeOverview() {
  const [data, setData] = useState<RuntimeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    try {
      const response = await fetch("/api/system/application-runtime-overview", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API svarte ${response.status}`);
      }

      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <section className={styles.runtimeBox}>
        <h2>Aktive applikasjoner / tilknytninger</h2>
        <p className={styles.error}>Kunne ikke hente runtime-status: {error}</p>
        <button type="button" onClick={load}>Prøv igjen</button>
      </section>
    );
  }

  if (!data) {
    return (
      <section className={styles.runtimeBox}>
        <h2>Aktive applikasjoner / tilknytninger</h2>
        <p>Laster runtime-status ...</p>
      </section>
    );
  }

  return (
    <section className={styles.runtimeBox}>
      <header className={styles.header}>
        <div>
          <p>Runtime truth</p>
          <h2>Aktive applikasjoner / tilknytninger</h2>
          <span>
            Viser hvilken Vercel-deploy, GitHub-commit, Next.js/React-versjon og Neon-kobling som faktisk kjører.
          </span>
        </div>
        <button type="button" onClick={load}>Oppdater</button>
      </header>

      <div className={styles.summaryGrid}>
        <article>
          <span>Aktiv side</span>
          <strong>{text(data.collectium?.active_page_name)}</strong>
          <small>{text(data.collectium?.active_page)}</small>
        </article>

        <article>
          <span>Vercel miljø</span>
          <strong>{text(data.vercel?.environment)}</strong>
          <small>{text(data.vercel?.production_url || data.vercel?.deployment_url)}</small>
        </article>

        <article>
          <span>GitHub commit</span>
          <strong>{text(data.github?.commit_short_sha)}</strong>
          <small>{text(data.github?.branch)}</small>
        </article>

        <article>
          <span>Neon</span>
          <strong>{text(data.neon?.active_connection)}</strong>
          <small>{text(data.neon?.database_url?.host || data.neon?.direct_url?.host || data.neon?.neon_database_url?.host)}</small>
        </article>
      </div>

      <section className={styles.panel}>
        <h3>Integrasjonsstatus</h3>
        <div className={styles.integrationList}>
          {(data.integrations || []).map((item: RuntimeData, index: number) => (
            <article key={`${item.name}-${index}`}>
              <div>
                <strong>{text(item.name)}</strong>
                <span>{text(item.detail)}</span>
              </div>
              <Badge value={item.status} />
            </article>
          ))}
        </div>
      </section>

      <div className={styles.columns}>
        <InfoPanel title="Vercel" data={data.vercel} />
        <InfoPanel title="GitHub" data={data.github} />
      </div>

      <div className={styles.columns}>
        <InfoPanel title="Next.js / React" data={data.framework} />
        <InfoPanel title="Collectium" data={data.collectium} />
      </div>

      <InfoPanel title="Neon / database" data={data.neon} />

      <section className={styles.panel}>
        <h3>Sist registrert menneskelig prosess</h3>
        <div className={styles.processBox}>
          <Badge value={data.last_human_process?.status} />
          <p>{text(data.last_human_process?.explanation)}</p>
          <InfoPanel title="Teknisk fallback / siste deploy" data={data.last_human_process?.fallback} />
        </div>
      </section>

      <p className={styles.generated}>Sist hentet: {text(data.generated_at)}</p>
    </section>
  );
}
