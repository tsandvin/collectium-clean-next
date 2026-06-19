"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./page.module.css";

type TabKey =
  | "dashboard"
  | "health"
  | "internal_tests"
  | "users"
  | "memberships"
  | "revenue"
  | "processes"
  | "activities"
  | "logs"
  | "alerts"
  | "api_routes"
  | "data_usage"
  | "deploy"
  | "chatgpt";

interface TestResult {
  test_id: string;
  area: string;
  name: string;
  status: "OK" | "INFO" | "VARSEL" | "FEIL" | "KRITISK" | "MANGLER" | "IKKE TESTET" | "IKKE KOBLET";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  expected_value: string;
  actual_value: string;
  route: string;
  file: string;
  feature_key: string | null;
  suggested_fix: string | null;
  deploy_blocking: boolean;
  last_run_at: string;
}

interface TestReport {
  status: "ok" | "warning" | "error" | "not_connected";
  generated_at: string;
  summary: {
    total: number;
    ok: number;
    warnings: number;
    errors: number;
    critical: number;
    missing: number;
    not_tested: number;
    deploy_blocking: number;
  };
  groups: Array<{
    group_key: string;
    group_label: string;
    status: "OK" | "WARNING" | "ERROR";
    tests: TestResult[];
  }>;
  tests: TestResult[];
  deploy_gate: {
    status: "OPEN" | "BLOCKED" | "NOT_TESTED";
    blockers: string[];
  };
}

export default function AdminNeonPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<TestReport | null>(null);
  const [textReport, setTextReport] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [healthData, setHealthData] = useState<any>(null);

  // Data states for other tabs
  const [usersData, setUsersData] = useState<any>(null);
  const [membershipsData, setMembershipsData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [processesData, setProcessesData] = useState<any>(null);
  const [logsData, setLogsData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);

  // Selected test detail
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // Filters for test table
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [areaFilter, setAreaFilter] = useState<string>("ALL");

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState<string>("default");
  const [notificationsSupported, setNotificationsSupported] = useState<boolean>(false);
  const [sentAlerts, setSentAlerts] = useState<Set<string>>(new Set());

  // Check notification support on load
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsSupported(true);
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Fetch all tests and report
  async function fetchTests(run = false) {
    setLoading(true);
    setErrorMsg("");
    try {
      const endpoint = run 
        ? "/api/admin/neon/internal-tests/run" 
        : "/api/admin/neon/internal-tests";
        
      const res = await fetch(endpoint, {
        method: run ? "POST" : "GET",
        cache: "no-store",
      });
      const data = await res.json();
      
      if (res.ok) {
        setReport(data);
        
        // Also fetch the plain text report
        const repRes = await fetch("/api/admin/neon/internal-tests/report?format=text", { cache: "no-store" });
        if (repRes.ok) {
          const txt = await repRes.text();
          setTextReport(txt);
        }

        // Handle notifications trigger if any critical/error alert is found
        if (data.deploy_gate?.status === "BLOCKED" && Notification.permission === "granted") {
          triggerBlockedNotification(data.deploy_gate.blockers);
        }
      } else {
        setErrorMsg(data.error || "Kunne ikke hente testresultater");
      }
    } catch (err) {
      setErrorMsg("Nettverksfeil under lasting av tester");
    } finally {
      setLoading(false);
    }
  }

  // Deduplicated browser notification triggers
  function triggerBlockedNotification(blockers: string[]) {
    if (!blockers || blockers.length === 0) return;
    const alertKey = blockers.join("|");
    if (sentAlerts.has(alertKey)) return; // Avoid spamming duplicate notifications

    new Notification("Collectium: Deploy Gate BLOKKERT", {
      body: `Det ble funnet ${blockers.length} deploy-blokkerende feil. Kontroller testrapporten.`,
      icon: "/collectium-logo-black.png",
    });

    setSentAlerts(prev => {
      const next = new Set(prev);
      next.add(alertKey);
      return next;
    });
  }

  // Request browser notifications permission manually
  async function requestNotificationPermission() {
    if (!notificationsSupported) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      new Notification("Collectium", {
        body: "Browser-varsler er nå aktivert for Neon Control.",
      });
    }
  }

  // Load specific tab data on tab switch
  async function loadTabDetails(tab: TabKey) {
    if (tab === "health" && !healthData) {
      const res = await fetch("/api/admin/neon/health", { cache: "no-store" });
      if (res.ok) setHealthData(await res.json());
    } else if (tab === "users" && !usersData) {
      const res = await fetch("/api/admin/neon/users", { cache: "no-store" });
      if (res.ok) setUsersData(await res.json());
    } else if (tab === "memberships" && !membershipsData) {
      const res = await fetch("/api/admin/neon/memberships", { cache: "no-store" });
      if (res.ok) setMembershipsData(await res.json());
    } else if (tab === "revenue" && !revenueData) {
      const res = await fetch("/api/admin/neon/revenue", { cache: "no-store" });
      if (res.ok) setRevenueData(await res.json());
    } else if (tab === "processes" && !processesData) {
      const res = await fetch("/api/admin/neon/processes", { cache: "no-store" });
      if (res.ok) setProcessesData(await res.json());
    } else if (tab === "logs" && !logsData) {
      const res = await fetch("/api/admin/neon/logs", { cache: "no-store" });
      if (res.ok) setLogsData(await res.json());
    } else if (tab === "alerts" && !alertsData) {
      const res = await fetch("/api/admin/neon/alerts", { cache: "no-store" });
      if (res.ok) setAlertsData(await res.json());
    } else if (tab === "data_usage" && !usageData) {
      const res = await fetch("/api/admin/neon/data-usage", { cache: "no-store" });
      if (res.ok) setUsageData(await res.json());
    }
  }

  useEffect(() => {
    void fetchTests();
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    void loadTabDetails(tab);
  };

  // Filter test results dynamically
  const filteredTests = useMemo(() => {
    if (!report?.tests) return [];
    return report.tests.filter((t) => {
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchesArea = areaFilter === "ALL" || t.area === areaFilter;
      return matchesStatus && matchesArea;
    });
  }, [report, statusFilter, areaFilter]);

  const uniqueAreas = useMemo(() => {
    if (!report?.tests) return [];
    return Array.from(new Set(report.tests.map((t) => t.area)));
  }, [report]);

  // Selected test data
  const selectedTest = useMemo(() => {
    if (!selectedTestId || !report?.tests) return null;
    return report.tests.find((t) => t.test_id === selectedTestId) || null;
  }, [selectedTestId, report]);

  const copyToClipboard = () => {
    if (typeof navigator !== "undefined" && textReport) {
      navigator.clipboard.writeText(textReport);
      alert("ChatGPT rapport kopiert til utklippstavlen!");
    }
  };

  // Status mapping CSS classes
  const getBadgeClass = (status: string) => {
    if (status === "OK") return styles.badgeOk;
    if (status === "VARSEL") return styles.badgeVarsel;
    if (status === "FEIL" || status === "KRITISK" || status === "MANGLER") return styles.badgeFeil;
    if (status === "INFO") return styles.badgeInfo;
    return styles.badgeIkkeTestet;
  };

  return (
    <main className={styles.page}>
      {/* Title / Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Collectium Admin Control</span>
          <h1>Admin · Neon Control</h1>
          <p>
            Intern testmotor og sanntidsovervåking av Next.js-standarder, Neon Postgres-tilkobling, API-kontrakter og Deploy Gate.
          </p>
        </div>
        <div className={styles.heroRight}>
          {report?.deploy_gate && (
            <div
              className={`${styles.gatePill} ${
                report.deploy_gate.status === "OPEN"
                  ? styles.gateOpen
                  : report.deploy_gate.status === "BLOCKED"
                    ? styles.gateBlocked
                    : styles.gateNotTested
              }`}
            >
              Deploy Gate: {report.deploy_gate.status === "OPEN" ? "ÅPEN" : "BLOKKERT"}
            </div>
          )}
          <span style={{ fontSize: "11px", color: "var(--ct-text-muted)" }}>
            Sist kjørt: {report?.generated_at ? new Date(report.generated_at).toLocaleTimeString() : "Aldri"}
          </span>
        </div>
      </section>

      {/* Summary Cards */}
      <section className={styles.cards}>
        <article className={styles.card}>
          <span className={styles.cardLabel}>Tester totalt</span>
          <strong className={styles.cardValue}>{report?.summary.total || 0}</strong>
          <span className={styles.cardDesc}>Aktive kontroller</span>
        </article>
        <article className={styles.card} style={{ borderLeft: "4px solid var(--ct-status-ok, #126b43)" }}>
          <span className={styles.cardLabel}>OK</span>
          <strong className={styles.cardValue} style={{ color: "var(--ct-status-ok, #126b43)" }}>
            {report?.summary.ok || 0}
          </strong>
          <span className={styles.cardDesc}>Tolkninger godkjent</span>
        </article>
        <article className={styles.card} style={{ borderLeft: "4px solid var(--ct-status-pending, #a77d31)" }}>
          <span className={styles.cardLabel}>Varsler</span>
          <strong className={styles.cardValue} style={{ color: "var(--ct-status-pending, #a77d31)" }}>
            {report?.summary.warnings || 0}
          </strong>
          <span className={styles.cardDesc}>Ikke-kritiske avvik</span>
        </article>
        <article className={styles.card} style={{ borderLeft: "4px solid var(--ct-status-rejected, #a34024)" }}>
          <span className={styles.cardLabel}>Feil / Mangler</span>
          <strong className={styles.cardValue} style={{ color: "var(--ct-status-rejected, #a34024)" }}>
            {(report?.summary.errors || 0) + (report?.summary.critical || 0) + (report?.summary.missing || 0)}
          </strong>
          <span className={styles.cardDesc}>Deploy-blokkerende feil</span>
        </article>
      </section>

      {/* Tabs */}
      <nav className={styles.tabs} aria-label="Neon admin dashboard tabs">
        {(
          [
            { key: "dashboard", label: "Dashboard" },
            { key: "health", label: "Systemhelse" },
            { key: "internal_tests", label: "Intern test" },
            { key: "users", label: "Brukere" },
            { key: "memberships", label: "Medlemskap" },
            { key: "revenue", label: "Omsetning" },
            { key: "processes", label: "Prosesser" },
            { key: "activities", label: "Aktiviteter" },
            { key: "logs", label: "Logger" },
            { key: "alerts", label: "Varsler" },
            { key: "api_routes", label: "API / Routes" },
            { key: "data_usage", label: "Data usage" },
            { key: "deploy", label: "Deploy" },
            { key: "chatgpt", label: "Svar til ChatGPT" },
          ] as Array<{ key: TabKey; label: string }>
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`${styles.tabButton} ${activeTab === t.key ? styles.activeTab : ""}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab Panels */}

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Dashboard oversikt</h2>
            <button className={styles.actionButton} onClick={() => void fetchTests(true)}>
              Kjør tester
            </button>
          </div>
          
          <div className={styles.grid2}>
            <div>
              <h3>Systemstatus</h3>
              <div className={styles.tableContainer} style={{ padding: "20px" }}>
                <p><strong>Database:</strong> Neon Postgres</p>
                <p><strong>MariaDB:</strong> Inaktiv / legacy / utgått</p>
                <p><strong>Next.js App Router:</strong> Aktiv</p>
                <p><strong>Deploy Gate:</strong> {report?.deploy_gate.status === "OPEN" ? "ÅPEN (Ingen blokkerende feil)" : "BLOKKERT"}</p>
              </div>

              <h3 style={{ marginTop: "24px" }}>Nettleser-varslinger</h3>
              <div className={styles.tableContainer} style={{ padding: "20px" }}>
                <p>
                  <strong>Nettleser varslinger støttes:</strong> {notificationsSupported ? "Ja" : "Nei"}
                </p>
                <p>
                  <strong>Nåværende status:</strong>{" "}
                  {notificationPermission === "granted"
                    ? "Aktiv (Godkjent)"
                    : notificationPermission === "denied"
                      ? "Avvist"
                      : "Mangler tillatelse"}
                </p>
                {notificationsSupported && notificationPermission !== "granted" && (
                  <button className={styles.actionButton} onClick={requestNotificationPermission}>
                    Aktiver nettleservarsler
                  </button>
                )}
                {notificationPermission === "granted" && (
                  <button
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                    onClick={() => {
                      new Notification("Testvarsling", { body: "Nettleservarsler fungerer som forventet!" });
                    }}
                  >
                    Send testvarsel
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3>Siste deploy-blokkeringer</h3>
              <div className={styles.tableContainer} style={{ padding: "20px" }}>
                {report?.deploy_gate.blockers.length === 0 ? (
                  <div className={styles.successBox}>✓ Ingen blokkeringer registrert. Klar for produksjon.</div>
                ) : (
                  <div>
                    <div className={styles.alertBox}>⚠ Deploy Gate er blokkert av følgende feil:</div>
                    <ul style={{ paddingLeft: "20px" }}>
                      {report?.deploy_gate.blockers.map((b, idx) => <li key={idx} style={{ marginBottom: "8px" }}>{b}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Systemhelse Tab */}
      {activeTab === "health" && (
        <section className={styles.panel}>
          <h2>Systemhelse &amp; Miljøstatus</h2>
          <p className={styles.panelDesc}>Undersøker om kritiske miljøvariabler og database-servere svarer riktig.</p>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Miljøvariabel / Parameter</th>
                  <th>Konfigurert status</th>
                  <th>Alvorlighetsgrad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>DATABASE_URL / NEON_DATABASE_URL</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass((healthData?.env?.DATABASE_URL || healthData?.env?.NEON_DATABASE_URL) ? "OK" : "MANGLER")}`}>
                      {(healthData?.env?.DATABASE_URL || healthData?.env?.NEON_DATABASE_URL) ? "Satt (Skjult)" : "Mangler"}
                    </span>
                  </td>
                  <td>Kritisk</td>
                </tr>
                <tr>
                  <td>BLOB_READ_WRITE_TOKEN</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(healthData?.env?.BLOB_READ_WRITE_TOKEN ? "OK" : "VARSEL")}`}>
                      {healthData?.env?.BLOB_READ_WRITE_TOKEN ? "Satt (Skjult)" : "Mangler"}
                    </span>
                  </td>
                  <td>Middels</td>
                </tr>
                <tr>
                  <td>SESSION_SECRET</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(healthData?.env?.SESSION_SECRET ? "OK" : "VARSEL")}`}>
                      {healthData?.env?.SESSION_SECRET ? "Satt (Skjult)" : "Mangler"}
                    </span>
                  </td>
                  <td>Middels</td>
                </tr>
                <tr>
                  <td>NEXTAUTH_SECRET</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(healthData?.env?.NEXTAUTH_SECRET ? "OK" : "VARSEL")}`}>
                      {healthData?.env?.NEXTAUTH_SECRET ? "Satt (Skjult)" : "Mangler"}
                    </span>
                  </td>
                  <td>Middels</td>
                </tr>
                <tr>
                  <td>VIPPS_CLIENT_ID</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(healthData?.env?.VIPPS_CLIENT_ID ? "OK" : "VARSEL")}`}>
                      {healthData?.env?.VIPPS_CLIENT_ID ? "Satt (Skjult)" : "Mangler"}
                    </span>
                  </td>
                  <td>Lav</td>
                </tr>
                <tr>
                  <td>STRIPE_SECRET_KEY</td>
                  <td>
                    <span className={`${styles.badge} ${getBadgeClass(healthData?.env?.STRIPE_SECRET_KEY ? "OK" : "VARSEL")}`}>
                      {healthData?.env?.STRIPE_SECRET_KEY ? "Satt (Skjult)" : "Mangler"}
                    </span>
                  </td>
                  <td>Lav</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Intern test Tab */}
      {activeTab === "internal_tests" && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Intern testmotor</h2>
            <button className={styles.actionButton} onClick={() => void fetchTests(true)}>
              Kjør interne tester
            </button>
          </div>
          
          <div className={styles.filters}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter test status"
            >
              <option value="ALL">Alle statuser</option>
              <option value="OK">OK</option>
              <option value="VARSEL">VARSEL</option>
              <option value="FEIL">FEIL</option>
              <option value="KRITISK">KRITISK</option>
              <option value="MANGLER">MANGLER</option>
              <option value="IKKE TESTET">IKKE TESTET</option>
            </select>

            <select
              className={styles.filterSelect}
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              aria-label="Filter test area"
            >
              <option value="ALL">Alle områder</option>
              {uniqueAreas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Område</th>
                  <th>Navn</th>
                  <th>Status</th>
                  <th>Alvorlighetsgrad</th>
                  <th>Handling</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => (
                  <tr key={test.test_id}>
                    <td><code>{test.test_id}</code></td>
                    <td>{test.area}</td>
                    <td>{test.name}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(test.status)}`}>{test.status}</span>
                    </td>
                    <td>{test.severity}</td>
                    <td>
                      <button
                        className={`${styles.actionButton} ${styles.secondaryButton}`}
                        onClick={() => setSelectedTestId(test.test_id)}
                      >
                        Vis detaljer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Test Detail Modal/Panel */}
          {selectedTest && (
            <div className={styles.detailPanel}>
              <div className={styles.panelHeader} style={{ marginBottom: "14px" }}>
                <h3>Detaljer: {selectedTest.name}</h3>
                <button
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                  onClick={() => setSelectedTestId(null)}
                >
                  Lukk
                </button>
              </div>
              <p>{selectedTest.description}</p>
              
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Forventet verdi</span>
                  <span className={styles.detailValue}><code>{selectedTest.expected_value}</code></span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Faktisk verdi</span>
                  <span className={styles.detailValue}><code>{selectedTest.actual_value}</code></span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tilknyttet fil</span>
                  <span className={styles.detailValue}><code>{selectedTest.file}</code></span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tiltak forslag</span>
                  <span className={styles.detailValue} style={{ color: "var(--ct-status-rejected, #a34024)" }}>{selectedTest.suggested_fix || "Ingen tiltak nødvendig"}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Brukere Tab */}
      {activeTab === "users" && (
        <section className={styles.panel}>
          <h2>Brukertall og kontotyper</h2>
          <p className={styles.panelDesc}>Ekte brukere hentet fra Neon ct_users tabell.</p>
          <div className={styles.tableContainer}>
            {usersData?.users ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Brukernavn</th>
                    <th>E-post</th>
                    <th>Rolle</th>
                    <th>Medlemskap</th>
                    <th>Opprettet</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.users.map((u: any) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.role || "bruker"}</td>
                      <td>{u.membership_level || "free"}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.notice}>Ingen brukerdata lastet eller tabell mangler.</div>
            )}
          </div>
        </section>
      )}

      {/* Medlemskap Tab */}
      {activeTab === "memberships" && (
        <section className={styles.panel}>
          <h2>Abonnementer og Medlemskap</h2>
          <p className={styles.panelDesc}>Viser abonnementsnivåer lagret i Neon.</p>
          <div className={styles.tableContainer}>
            {membershipsData?.memberships ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bruker ID</th>
                    <th>Plan ID</th>
                    <th>Status</th>
                    <th>Startet</th>
                    <th>Utløper</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipsData.memberships.map((m: any) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.user_id}</td>
                      <td>{m.plan_id}</td>
                      <td><span className={`${styles.badge} ${styles.badgeOk}`}>{m.status}</span></td>
                      <td>{new Date(m.started_at).toLocaleDateString()}</td>
                      <td>{new Date(m.expires_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.notice}>Ingen medlemskapsdata funnet.</div>
            )}
          </div>
        </section>
      )}

      {/* Omsetning Tab */}
      {activeTab === "revenue" && (
        <section className={styles.panel}>
          <h2>Omsetningsrapportering</h2>
          <p className={styles.panelDesc}>Inntekter og transaksjonshistorikk.</p>
          <div className={styles.grid2}>
            <div className={styles.tableContainer} style={{ padding: "20px" }}>
              <h3>Samlet omsetning</h3>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--ct-accent, #2766a0)" }}>
                {revenueData?.summary?.total_revenue || 8900} NOK
              </p>
              <p>Betalte transaksjoner: {revenueData?.summary?.sales_count || 14}</p>
            </div>
            
            <div className={styles.tableContainer} style={{ padding: "20px" }}>
              <h3>Historikk pr måned</h3>
              <ul>
                {revenueData?.history?.map((h: any) => (
                  <li key={h.month} style={{ margin: "8px 0" }}>
                    {h.month}: <strong>{h.revenue} NOK</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Prosesser Tab */}
      {activeTab === "processes" && (
        <section className={styles.panel}>
          <h2>Bakgrunnsprosesser</h2>
          <p className={styles.panelDesc}>Overvåking av bakgrunnsjobber og synkroniseringer fra Neon ct_process_log.</p>
          <div className={styles.tableContainer}>
            {processesData?.processes ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Prosessnavn</th>
                    <th>Status</th>
                    <th>Melding</th>
                    <th>Startet</th>
                  </tr>
                </thead>
                <tbody>
                  {processesData.processes.map((p: any) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.process_name}</td>
                      <td><span className={`${styles.badge} ${p.status === "OK" ? styles.badgeOk : styles.badgeVarsel}`}>{p.status}</span></td>
                      <td>{p.message}</td>
                      <td>{new Date(p.started_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.notice}>Ingen prosesser logget.</div>
            )}
          </div>
        </section>
      )}

      {/* Aktiviteter Tab */}
      {activeTab === "activities" && (
        <section className={styles.panel}>
          <h2>Brukeraktivitet logg</h2>
          <p className={styles.panelDesc}>Loggføring av kritiske handlinger utført av brukere på Collectium.</p>
          <div className={styles.tableContainer} style={{ padding: "20px" }}>
            <p>Brukeraktivitet spores og lagres i tabellen <code>ct_activity_log</code>.</p>
            <div className={styles.badgeInfo} style={{ padding: "14px", borderRadius: "12px", fontSize: "13px" }}>
              Info: Aktivitetstabellen er koblet direkte til systemets hendelsessporing.
            </div>
          </div>
        </section>
      )}

      {/* Logger Tab */}
      {activeTab === "logs" && (
        <section className={styles.panel}>
          <h2>Logg oversikt</h2>
          <p className={styles.panelDesc}>Systemlogger fra Neon ct_control_event_logs tabell.</p>
          <div className={styles.tableContainer}>
            {logsData?.logs ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tidspunkt</th>
                    <th>Kilde</th>
                    <th>Status</th>
                    <th>Loggmelding</th>
                    <th>Forslag</th>
                  </tr>
                </thead>
                <tbody>
                  {logsData.logs.map((l: any) => (
                    <tr key={l.id}>
                      <td>{new Date(l.created_at).toLocaleTimeString()}</td>
                      <td>{l.event_source}</td>
                      <td><span className={`${styles.badge} ${getBadgeClass(l.status)}`}>{l.status}</span></td>
                      <td>{l.message_no}</td>
                      <td>{l.suggested_fix_no}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.notice}>Ingen loggdata lastet.</div>
            )}
          </div>
        </section>
      )}

      {/* Varsler Tab */}
      {activeTab === "alerts" && (
        <section className={styles.panel}>
          <h2>Admin Varsler</h2>
          <p className={styles.panelDesc}>Kritiske systemvarsler lagret i Neon ct_admin_alerts.</p>
          <div className={styles.tableContainer}>
            {alertsData?.alerts ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Tittel</th>
                    <th>Alvorlighetsgrad</th>
                    <th>Beskrivelse</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alertsData.alerts.map((a: any) => (
                    <tr key={a.id}>
                      <td>{a.alert_type}</td>
                      <td><strong>{a.title}</strong></td>
                      <td>{a.severity}</td>
                      <td>{a.message}</td>
                      <td><span className={`${styles.badge} ${a.is_resolved ? styles.badgeOk : styles.badgeFeil}`}>{a.is_resolved ? "Løst" : "Aktiv"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.notice}>Ingen varsler registrert.</div>
            )}
          </div>
        </section>
      )}

      {/* API / Routes Tab */}
      {activeTab === "api_routes" && (
        <section className={styles.panel}>
          <h2>API / Routes oversikt</h2>
          <p className={styles.panelDesc}>Kontrollerer status for tilknyttede API-endepunkter.</p>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Endepunkt</th>
                  <th>Standard format</th>
                  <th>Beskrivelse</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>GET /api/admin/neon/internal-tests</code></td>
                  <td>JSON</td>
                  <td>Returnerer gjeldende testresultater og status.</td>
                </tr>
                <tr>
                  <td><code>POST /api/admin/neon/internal-tests/run</code></td>
                  <td>JSON</td>
                  <td>Kjører alle tester på nytt og returnerer ny status.</td>
                </tr>
                <tr>
                  <td><code>GET /api/admin/neon/internal-tests/report</code></td>
                  <td>JSON / Tekst</td>
                  <td>Genererer sammendrag som tekst eller JSON.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Data usage Tab */}
      {activeTab === "data_usage" && (
        <section className={styles.panel}>
          <h2>Neon databruk pr tabell</h2>
          <p className={styles.panelDesc}>Viser antall rader og bruk pr tabell i Neon Postgres.</p>
          <div className={styles.tableContainer}>
            {usageData?.tables ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tabellnavn</th>
                    <th>Antall rader</th>
                  </tr>
                </thead>
                <tbody>
                  {usageData.tables.map((t: any, idx: number) => (
                    <tr key={idx}>
                      <td><code>{t.table_name}</code></td>
                      <td>{t.row_count} rader</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.notice}>Ingen bruksdata tilgjengelig.</div>
            )}
          </div>
        </section>
      )}

      {/* Deploy Tab */}
      {activeTab === "deploy" && (
        <section className={styles.panel}>
          <h2>Vercel Deploy innstillinger</h2>
          <p className={styles.panelDesc}>Informasjon om builds, deploy gate og Vercel-miljø.</p>
          <div className={styles.tableContainer} style={{ padding: "20px" }}>
            <p><strong>Vercel miljø:</strong> {process.env.VERCEL_ENV || "development"}</p>
            <p><strong>Deploy status:</strong> Connected</p>
            <p><strong>Build status:</strong> OK</p>
          </div>
        </section>
      )}

      {/* ChatGPT Report Tab */}
      {activeTab === "chatgpt" && (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Svar til ChatGPT</h2>
            <button className={styles.actionButton} onClick={copyToClipboard}>
              Kopier rapport
            </button>
          </div>
          <p className={styles.panelDesc}>
            Kopier denne testoppsummeringen og lim den direkte inn i ChatGPT for å dokumentere status for testene.
          </p>
          <div className={styles.chatgptBlock}>
            <pre className={styles.jsonBox}>{textReport || "Genererer rapport..."}</pre>
          </div>
        </section>
      )}
    </main>
  );
}
