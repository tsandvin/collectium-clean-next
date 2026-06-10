/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * NeonRuleEstablishmentPanel
 *
 * Definering / formål:
 * Viser status for første Neon-regel etablering på admin/system/mariadb-neon.
 *
 * Bruksområde:
 * Importeres i app/admin/system/mariadb-neon/page.tsx og plasseres under Dashboard / Tiltak.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.neon_rule_establishment.view
 * - admin.system.neon_rule_establishment.run
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-rule-establishment
 *
 * Berørte tabeller / views:
 * - ct_neon_rule_control_runs
 * - ct_neon_rule_control_steps
 * - ct_neon_rule_truth_gate
 *
 * Dataretning:
 * Neon/MariaDB kontroll -> API -> React -> Admin UI
 *
 * Logging:
 * log_category: system.mariadb_neon
 * log_action: neon_rule_establishment.view
 *
 * Versjon:
 * CT-COMP-0001 / CHANGE-2026-06-10-0001
 */

import styles from "./NeonRuleEstablishmentPanel.module.css";

type ApiStatus = "OK" | "VARSEL" | "FEIL" | "BLOKKERT" | "INFO";

type ApiStep = {
  id: string;
  label: string;
  status: ApiStatus;
  detail: string;
  blocking: boolean;
};

type ApiResponse = {
  ok: boolean;
  route: string;
  mode: "test" | "live";
  source_key: string;
  object_group: string;
  canonical_neon_table: string;
  rule_gate: {
    structure_status: ApiStatus;
    rules_status: ApiStatus;
    source_data_status: ApiStatus;
    truth_status: string;
    migration_allowed: boolean;
  };
  steps: ApiStep[];
  svar_til_chatgpt: string;
  next_step: string;
};

async function getNeonRuleEstablishment(): Promise<ApiResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const res = await fetch(`${baseUrl}/api/system/neon-rule-establishment`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Neon rule establishment API svarte ${res.status}`);
  }

  return (await res.json()) as ApiResponse;
}

function statusClass(status: ApiStatus | string): string {
  switch (status) {
    case "OK":
      return styles.ok;
    case "VARSEL":
      return styles.warning;
    case "FEIL":
      return styles.error;
    case "BLOKKERT":
      return styles.blocked;
    default:
      return styles.info;
  }
}

export default async function NeonRuleEstablishmentPanel() {
  let data: ApiResponse | null = null;
  let error: string | null = null;

  try {
    data = await getNeonRuleEstablishment();
  } catch (err) {
    error = err instanceof Error ? err.message : "Ukjent feil ved henting av Neon-regelstatus.";
  }

  if (error) {
    return (
      <section className={styles.panel} aria-label="Neon regelstatus">
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>MariaDB → Neon</p>
            <h2>Neon regel-etablering</h2>
          </div>
          <span className={`${styles.badge} ${styles.error}`}>FEIL</span>
        </div>
        <p className={styles.errorText}>{error}</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className={styles.panel} aria-label="Neon regelstatus">
      <div className={styles.headerRow}>
        <div>
          <p className={styles.kicker}>MariaDB → Neon</p>
          <h2>Neon regel-etablering</h2>
          <p className={styles.subtitle}>
            Første kontrollscope: <strong>{data.source_key}</strong> / <strong>{data.object_group}</strong>
          </p>
        </div>
        <span className={`${styles.badge} ${data.ok ? styles.ok : styles.blocked}`}>
          {data.ok ? "OK" : "IKKE GODKJENT"}
        </span>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.label}>Canonical Neon-tabell</span>
          <strong>{data.canonical_neon_table}</strong>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Truth status</span>
          <strong>{data.rule_gate.truth_status}</strong>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Migrering tillatt</span>
          <strong>{data.rule_gate.migration_allowed ? "Ja" : "Nei"}</strong>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>API</span>
          <strong>{data.route}</strong>
        </div>
      </div>

      <div className={styles.steps}>
        {data.steps.map((step) => (
          <article className={styles.step} key={step.id}>
            <span className={styles.stepId}>{step.id}</span>
            <div>
              <div className={styles.stepTitleRow}>
                <h3>{step.label}</h3>
                <span className={`${styles.badge} ${statusClass(step.status)}`}>{step.status}</span>
              </div>
              <p>{step.detail}</p>
              {step.blocking ? <span className={styles.blockingText}>Blokkerer godkjenning</span> : null}
            </div>
          </article>
        ))}
      </div>

      <div className={styles.answerBox}>
        <div className={styles.answerHeader}>Svar til ChatGPT</div>
        <textarea readOnly value={data.svar_til_chatgpt} className={styles.textarea} />
      </div>

      <p className={styles.nextStep}><strong>Neste steg:</strong> {data.next_step}</p>
    </section>
  );
}
