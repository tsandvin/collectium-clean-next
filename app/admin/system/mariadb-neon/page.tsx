/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Aktiv drift adminside
 *
 * Definering / formål:
 * Viser aktiv teknisk drift for Collectium: runtime, Vercel, Blob, Sandbox, Neon, MariaDB, Git, brukere online og kapasitetsmodell.
 *
 * Bruksområde:
 * Intern admin/systemside for å se aktive koblinger, bruker-/medlemskapstatus og vurdere når DB, Vercel, Blob, cache eller søk må oppgraderes.
 *
 * Berørte sider / routes:
 * - /admin/system/aktiv-drift
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.active_operations.view
 * - admin.system.runtime_status.view
 * - admin.system.online_users.view
 *
 * Berørte API-ruter:
 * - GET /api/system/runtime-status
 *
 * Berørte tabeller / views:
 * - Senere: ct_usage_events
 * - Senere: ct_usage_daily_summary
 * - Senere: ct_usage_user_daily_summary
 * - Senere: ct_login_geo_summary
 * - Senere: ct_membership_usage_summary
 *
 * Dataretning:
 * Runtime/API -> Next.js server component -> UI
 *
 * Logging:
 * log_category: system
 * log_action: active_operations.view
 *
 * Versjon:
 * CT-FILE-ACTIVE-OPERATIONS-0002 / CHANGE-2026-06-10-0002
 *
 * Endringsregel:
 * Oppdaterer aktiv drift-side med bruker online-seksjon og sammenleggbare lag.
 */

import styles from "./page.module.css";

type RuntimeModule = {
  group: string;
  name: string;
  packageName: string;
  declared: string;
  installed: string;
  status: string;
  note: string;
};

type UserOnlineModel = {
  status: string;
  source: string;
  summary: Record<string, number>;
  windows: Array<{
    label: string;
    definition: string;
    status: string;
  }>;
  perUserFields: string[];
  privacyRule: string;
};

type RuntimeStatus = {
  ok: boolean;
  generatedAt: string;
  project: {
    name: string;
    version: string;
  };
  env: Record<string, string>;
  git: {
    branch: string;
    commit: string;
    statusShort: string;
    clean: boolean;
  };
  modules: RuntimeModule[];
  services: Record<string, any>;
  usageModel: {
    status: string;
    summary: string;
    plannedTables: string[];
    plannedMetrics: string[];
  };
  userOnlineModel?: UserOnlineModel;
  audit: {
    status: string;
    finding: string;
    action: string;
  };
  deployGate: {
    status: string;
    reason: string;
  };
  warnings: string[];
  answerToChatGPT: string;
};

async function getRuntimeStatus(): Promise<RuntimeStatus | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const response = await fetch(`${baseUrl}/api/system/runtime-status`, {
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function statusClass(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("ok")) return styles.ok;
  if (normalized.includes("varsel")) return styles.warning;
  if (normalized.includes("mangler")) return styles.missing;
  if (normalized.includes("feil")) return styles.error;
  if (normalized.includes("planlagt")) return styles.planned;

  return styles.neutral;
}

function labelForUserMetric(key: string) {
  const labels: Record<string, string> = {
    anonymousOnline: "Anonyme online",
    loggedInOnline: "Innloggede online",
    totalOnline: "Totalt online",
    freeUsersOnline: "Free",
    bronzeUsersOnline: "Bronze",
    silverUsersOnline: "Silver",
    goldUsersOnline: "Gold",
    platinumUsersOnline: "Platinum",
    dealersOnline: "Forhandlere",
    adminsOnline: "Admin",
  };

  return labels[key] || key;
}

export default async function AktivDriftPage() {
  const data = await getRuntimeStatus();

  if (!data) {
    return (
      <main className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Admin · System</p>
          <h1>Aktiv drift</h1>
          <p>Kunne ikke lese /api/system/runtime-status.</p>
        </section>
      </main>
    );
  }

  const grouped = data.modules.reduce<Record<string, RuntimeModule[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const userOnline = data.userOnlineModel || {
    status: "PLANLAGT",
    source: "Ikke returnert fra API ennå.",
    summary: {
      anonymousOnline: 0,
      loggedInOnline: 0,
      totalOnline: 0,
      freeUsersOnline: 0,
      bronzeUsersOnline: 0,
      silverUsersOnline: 0,
      goldUsersOnline: 0,
      platinumUsersOnline: 0,
      dealersOnline: 0,
      adminsOnline: 0,
    },
    windows: [],
    perUserFields: [],
    privacyRule: "Per-bruker-visning skal være anonymisert.",
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Admin · System · Aktiv drift</p>
          <h1>Aktive applikasjoner, brukere, drift og kapasitet</h1>
          <p>
            Aktiv kontroll for Next.js, React, Vercel, Blob, Sandbox, Neon, MariaDB,
            Git, audit, brukere online, medlemskap og fremtidig forbruksanalyse.
          </p>
        </div>

        <div className={`${styles.statusBadge} ${statusClass(data.deployGate.status)}`}>
          Deploy gate: {data.deployGate.status}
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Prosjekt</h2>
          <dl className={styles.metaList}>
            <div><dt>Navn</dt><dd>{data.project.name}</dd></div>
            <div><dt>Versjon</dt><dd>{data.project.version}</dd></div>
            <div><dt>Node</dt><dd>{data.env.node}</dd></div>
            <div><dt>npm</dt><dd>{data.env.npm}</dd></div>
            <div><dt>Miljø</dt><dd>{data.env.vercelEnv}</dd></div>
          </dl>
        </article>

        <article className={styles.card}>
          <h2>Git / Vercel</h2>
          <dl className={styles.metaList}>
            <div><dt>Branch</dt><dd>{data.git.branch}</dd></div>
            <div><dt>Commit</dt><dd>{data.git.commit}</dd></div>
            <div><dt>Clean</dt><dd>{data.git.clean ? "Ja" : "Nei"}</dd></div>
            <div><dt>Vercel</dt><dd>{data.env.vercel === "1" ? "Aktiv" : "Lokal"}</dd></div>
            <div><dt>Vercel URL</dt><dd>{data.env.vercelUrl || "Ikke satt"}</dd></div>
          </dl>
        </article>

        <article className={styles.card}>
          <h2>Audit</h2>
          <div className={`${styles.statusLine} ${statusClass(data.audit.status)}`}>
            {data.audit.status}
          </div>
          <p>{data.audit.finding}</p>
          <p className={styles.strong}>{data.audit.action}</p>
        </article>

        <article className={styles.card}>
          <h2>Kapasitet / brukerforbruk</h2>
          <div className={`${styles.statusLine} ${statusClass(data.usageModel.status)}`}>
            {data.usageModel.status}
          </div>
          <p>{data.usageModel.summary}</p>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Brukere · medlemskap · online</p>
            <h2>Brukere online</h2>
          </div>
          <span className={`${styles.statusPill} ${statusClass(userOnline.status)}`}>
            {userOnline.status}
          </span>
        </div>

        <p className={styles.sectionLead}>{userOnline.source}</p>

        <div className={styles.userMetricGrid}>
          {Object.entries(userOnline.summary).map(([key, value]) => (
            <article className={styles.userMetric} key={key}>
              <span>{labelForUserMetric(key)}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <div className={styles.subGrid}>
          <article className={styles.subPanel}>
            <h3>Tidsvinduer</h3>
            <div className={styles.timelineList}>
              {userOnline.windows.map((item) => (
                <div className={styles.timelineItem} key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.definition}</span>
                  <em>{item.status}</em>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.subPanel}>
            <h3>Per bruker / anonymisert feltmodell</h3>
            <div className={styles.chips}>
              {userOnline.perUserFields.map((field) => (
                <span className={styles.chip} key={field}>{field}</span>
              ))}
            </div>
          </article>
        </div>

        <div className={styles.privacyBox}>
          <strong>Personvernregel:</strong> {userOnline.privacyRule}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Moduler og påkoblinger</h2>

        {Object.entries(grouped).map(([group, items]) => (
          <div className={styles.group} key={group}>
            <h3>{group}</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Modul</th>
                    <th>Pakke</th>
                    <th>package.json</th>
                    <th>Installert</th>
                    <th>Status</th>
                    <th>Merknad</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.group}-${item.packageName}`}>
                      <td>{item.name}</td>
                      <td><code>{item.packageName}</code></td>
                      <td>{item.declared}</td>
                      <td>{item.installed}</td>
                      <td>
                        <span className={`${styles.statusPill} ${statusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Vercel Blob</h2>
          <pre>{JSON.stringify(data.services.vercelBlob, null, 2)}</pre>
        </article>

        <article className={styles.card}>
          <h2>Vercel Sandbox</h2>
          <pre>{JSON.stringify(data.services.vercelSandbox, null, 2)}</pre>
        </article>

        <article className={styles.card}>
          <h2>Neon</h2>
          <pre>{JSON.stringify(data.services.neon, null, 2)}</pre>
        </article>

        <article className={styles.card}>
          <h2>MariaDB</h2>
          <pre>{JSON.stringify(data.services.mariadb, null, 2)}</pre>
        </article>
      </section>

      <section className={styles.section}>
        <h2>Planlagte usage-tabeller</h2>
        <div className={styles.chips}>
          {data.usageModel.plannedTables.map((table) => (
            <span className={styles.chip} key={table}>{table}</span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Planlagte kapasitetsmålinger</h2>
        <div className={styles.chips}>
          {data.usageModel.plannedMetrics.map((metric) => (
            <span className={styles.chip} key={metric}>{metric}</span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Varsler</h2>
        <ul className={styles.warningList}>
          {data.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Kontrollag</h2>

        <div className={styles.layerButtons}>
          <details className={styles.layer}>
            <summary>Åpne JSON</summary>
            <pre className={styles.answerBox}>{JSON.stringify(data, null, 2)}</pre>
          </details>

          <details className={styles.layer}>
            <summary>Åpne Svar til ChatGPT</summary>
            <pre className={styles.answerBox}>{data.answerToChatGPT}</pre>
          </details>
        </div>
      </section>
    </main>
  );
}
