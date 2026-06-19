/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side dashboard client component
 *
 * Definering / formål:
 * React-klient for brukerens private Min side panel. Viser faner for
 * oversikt, profil, medlemskap, samling, ønsker, kjøp/salg, logger,
 * varsler, meldinger, dokumenter, innstillinger og sikkerhet.
 * Integrerer med de nye API fallback-rutene.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.view
 * - account.overview.view
 * - profile.view
 * - profile.edit
 * - membership.view
 * - membership.upgrade
 * - collection.view
 * - collection.add_object
 * - wishlist.view
 * - favorites.view
 * - transactions.view
 * - processes.view
 * - notifications.view
 * - notifications.mark_read
 * - messages.view
 * - documents.view
 * - documents.upload
 * - security.view
 * - auth.logout
 *
 * Berørte API-ruter:
 * - GET /api/account/overview
 * - GET /api/account/profile
 * - GET /api/account/membership
 * - GET /api/account/collection
 * - GET /api/account/wishlist
 * - GET /api/account/favorites
 * - GET /api/account/transactions
 * - GET /api/account/processes
 * - GET /api/account/notifications
 * - GET /api/account/messages
 * - GET /api/account/documents
 * - GET /api/account/security
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Logging:
 * log_category: account
 * log_action: view
 */

"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import {
  User,
  CreditCard,
  Archive,
  Heart,
  Star,
  ArrowLeftRight,
  History,
  Activity,
  Bell,
  MessageSquare,
  FileText,
  Settings,
  Shield,
  ClipboardCopy,
  AlertTriangle,
  Info,
  Check,
  CheckSquare
} from "lucide-react";

type TabKey =
  | "overview"
  | "profile"
  | "membership"
  | "collection"
  | "wishlist"
  | "favorites"
  | "trades"
  | "transactions"
  | "processes"
  | "notifications"
  | "messages"
  | "documents"
  | "settings"
  | "security"
  | "chatgpt";

interface TabConfig {
  key: TabKey;
  label: string;
  icon: any;
}

const TABS: TabConfig[] = [
  { key: "overview", label: "Oversikt", icon: Activity },
  { key: "profile", label: "Profil", icon: User },
  { key: "membership", label: "Medlemskap", icon: CreditCard },
  { key: "collection", label: "Min samling", icon: Archive },
  { key: "wishlist", label: "Ønskeliste", icon: Heart },
  { key: "favorites", label: "Favoritter", icon: Star },
  { key: "trades", label: "Kjøp / salg", icon: ArrowLeftRight },
  { key: "transactions", label: "Transaksjonslogg", icon: History },
  { key: "processes", label: "Prosesser", icon: CheckSquare },
  { key: "notifications", label: "Varsler", icon: Bell },
  { key: "messages", label: "Meldinger", icon: MessageSquare },
  { key: "documents", label: "Dokumenter", icon: FileText },
  { key: "settings", label: "Innstillinger", icon: Settings },
  { key: "security", label: "Sikkerhet", icon: Shield },
  { key: "chatgpt", label: "Svar til ChatGPT", icon: ClipboardCopy },
];

export default function CollectiumMinSideClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Local state for checking API connection status
  const [apiStatus, setApiStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    async function checkAPIs() {
      const endpoints = [
        "overview",
        "profile",
        "membership",
        "collection",
        "wishlist",
        "favorites",
        "transactions",
        "processes",
        "notifications",
        "messages",
        "documents",
        "security"
      ];
      
      const statusMap: Record<string, string> = {};
      
      await Promise.all(
        endpoints.map(async (key) => {
          try {
            const res = await fetch(`/api/account/${key}`);
            const data = await res.json();
            if (data.status === "not_connected") {
              statusMap[key] = "Ikke koblet";
            } else {
              statusMap[key] = "Tilkoblet";
            }
          } catch {
            statusMap[key] = "Feil ved henting";
          }
        })
      );
      
      setApiStatus(statusMap);
    }

    void checkAPIs();
  }, []);

  const chatGptStatusText = `SVAR TIL CHATGPT — MIN SIDE STATUS

Route: /min-side
Session: Ikke koblet / Aktiv
Medlemskap: ${apiStatus.membership || "Ikke koblet"}
Samling: ${apiStatus.collection || "Ikke koblet"}
Varsler: ${apiStatus.notifications || "Ikke koblet"}
Prosesser: ${apiStatus.processes || "Ikke koblet"}
Transaksjoner: ${apiStatus.transactions || "Ikke koblet"}
Dokumenter: ${apiStatus.documents || "Ikke koblet"}
Sikkerhet: ${apiStatus.security || "Ikke koblet"}

Status:
Frontend: OK
API fallback: OK
Neon user data: Ikke koblet
Neste tiltak:
1. Koble /api/account/overview til session
2. Koble medlemskap til Neon
3. Koble varsler/prosesser til logg og activity system`;

  const copyToClipboard = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(chatGptStatusText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="ct-page">
      <div className={styles.page}>
        
        {/* Sideheader */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Min side</h1>
            <p>
              Ditt kontrollsenter for profil, medlemskap, samling, kjøp, salg, varsler, meldinger og prosesser.
            </p>
          </div>
          
          {/* Status chips */}
          <div className={styles.statusChips}>
            <div className={styles.statusChip}>
              Innlogging: <span className={styles.statusValue}>Ikke koblet</span>
            </div>
            <div className={styles.statusChip}>
              Medlemskap: <span className={styles.statusValue}>{apiStatus.membership || "Laster..."}</span>
            </div>
            <div className={styles.statusChip}>
              Varsler: <span className={styles.statusValue}>{apiStatus.notifications || "Laster..."}</span>
            </div>
            <div className={styles.statusChip}>
              Prosesser: <span className={styles.statusValue}>{apiStatus.processes || "Laster..."}</span>
            </div>
          </div>

          {/* Not connected banner */}
          <div className={styles.banner}>
            <AlertTriangle size={18} />
            <span>Ikke koblet til reell brukerdata ennå</span>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className={styles.tabs} aria-label="Min side fanemeny">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ""}`}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon size={16} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Tab Panel Renderings */}
        <section className={styles.panel} aria-label="Aktiv fanevisning">
          
          {/* OVERSIRT */}
          {activeTab === "overview" && (
            <div>
              <h2 className={styles.panelTitle}>Kontooversikt</h2>
              <p className={styles.panelDesc}>Hurtigstatus for alle kontoens funksjoner og samlinger.</p>
              
              <div className={styles.dashboardGrid}>
                <article className={styles.card}>
                  <span className={styles.cardLabel}>Medlemskap</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Plan: Ingen aktiv plan</span>
                </article>
                
                <article className={styles.card}>
                  <span className={styles.cardLabel}>Objekter i Min samling</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Totalt antall registrerte</span>
                </article>
                
                <article className={styles.card}>
                  <span className={styles.cardLabel}>Estimert samlingsverdi</span>
                  <strong className={styles.cardValue}>Ikke vurdert / Ikke koblet</strong>
                  <span className={styles.cardMeta}>Basert på markedstrender</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Ønskeliste</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Objekter merket med hjerte</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Favoritter</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Objekter merket med stjerne</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Aktive kjøp</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Pågående handelsprosesser</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Aktive salg</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Dine objekter til salgs</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Fulgte auksjoner</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Budrunder du følger</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Pågående prosesser</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Bakgrunn- eller oppgjørsprosesser</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Uleste varsler</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>System- og handelsmeldinger</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Uleste meldinger</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Direkte meldinger</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Dokumenter</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>Sertifikater og kvitteringer</span>
                </article>

                <article className={styles.card}>
                  <span className={styles.cardLabel}>Sikkerhetsstatus</span>
                  <strong className={styles.cardValue}>Ikke koblet</strong>
                  <span className={styles.cardMeta}>To-faktor og økter</span>
                </article>
              </div>
            </div>
          )}

          {/* PROFIL */}
          {activeTab === "profile" && (
            <div>
              <h2 className={styles.panelTitle}>Brukerprofil</h2>
              <p className={styles.panelDesc}>Administrer dine personopplysninger og profilinformasjon.</p>
              
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Navn</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </label>
                
                <label className={styles.field}>
                  <span className={styles.label}>E-post</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </label>
                
                <label className={styles.field}>
                  <span className={styles.label}>Rolle</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </label>
                
                <label className={styles.field}>
                  <span className={styles.label}>Konto-status</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </label>
                
                <label className={styles.field}>
                  <span className={styles.label}>E-poststatus</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </label>
                
                <label className={styles.field}>
                  <span className={styles.label}>Sist aktiv</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </label>
                
                <label className={styles.field}>
                  <span className={styles.label}>Registrert dato</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </label>
              </div>

              <div className={styles.btnRow}>
                <button type="button" className={styles.btn} disabled>
                  <span>Rediger profil</span>
                  <span style={{ fontSize: "10px", opacity: 0.8 }}>(Ikke koblet ennå)</span>
                </button>
                <button type="button" className={styles.btn} disabled>
                  <span>Bekreft e-post</span>
                  <span style={{ fontSize: "10px", opacity: 0.8 }}>(Ikke koblet ennå)</span>
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} disabled>
                  <span>Logg ut</span>
                  <span style={{ fontSize: "10px", opacity: 0.8 }}>(Ikke koblet ennå)</span>
                </button>
              </div>
            </div>
          )}

          {/* MEDLEMSKAP */}
          {activeTab === "membership" && (
            <div>
              <h2 className={styles.panelTitle}>Ditt Medlemskap</h2>
              <p className={styles.panelDesc}>Se ditt nåværende nivå og oppgraderingsmuligheter.</p>

              <div className={styles.formGrid} style={{ marginBottom: "28px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Aktivt nivå</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Planstatus</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Neste fornyelse</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Betalingsstatus</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "12px", fontFamily: "var(--ct-font-display, serif)" }}>Tilgjengelige nivåer</h3>
              <div className={styles.levelGrid}>
                {[
                  { name: "Free", desc: "Grunnleggende tilgang til katalog og registrering av inntil 10 samleobjekter uten markedsverdihistorikk." },
                  { name: "Bronze", desc: "Registrering av inntil 100 objekter, tilgang til grunnleggende statistikk og trendvisninger." },
                  { name: "Silver", desc: "Ubegrenset antall objekter, full verdivurderinghistorikk og mulighet for eksport av data." },
                  { name: "Gold", desc: "Tilgang til markedstorg, lavere provisjoner på bud og auksjonsregistreringer." },
                  { name: "Gold+", desc: "Avanserte verktøy for forhandlere, mulighet for API-synkronisering med nettbutikk." },
                  { name: "Gold++", desc: "Integrert regnskapseksport og utvidede markedsrapporter for profesjonelle aktører." },
                  { name: "Gold+++", desc: "Prioritert plassering på markedstorget og dedikert rådgiver for verdivurdering." },
                  { name: "Platinum", desc: "Skreddersydd medlemskap med alle funksjoner inkludert, pluss fysiske sertifiseringstjenester." },
                ].map((level, idx) => (
                  <article key={level.name} className={`${styles.levelCard} ${idx === 0 ? styles.levelCardActive : ""}`}>
                    <div className={styles.levelHeader}>
                      <span className={styles.levelName}>{level.name}</span>
                      <span className={`${styles.levelBadge} ${idx === 0 ? styles.levelBadgeActive : ""}`}>
                        {idx === 0 ? "Aktiv" : "Nivå"}
                      </span>
                    </div>
                    <p className={styles.levelDesc}>{level.desc}</p>
                    <button type="button" className={`${styles.btn} ${styles.btnSecondary} ${styles.btn}`} style={{ padding: "6px 12px", fontSize: "0.75rem" }} disabled>
                      {idx === 0 ? "Se detaljer" : "Oppgrader (Ikke koblet)"}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* MIN SAMLING */}
          {activeTab === "collection" && (
            <div>
              <h2 className={styles.panelTitle}>Min samling</h2>
              <p className={styles.panelDesc}>Oversikt over registrerte mynter, sedler og andre samleobjekter.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Mine objekter</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Objekter uten bilde</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Objekter uten verdi</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Sist lagt til</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Delte objekter</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <div className={styles.emptyState}>
                <Archive size={36} />
                <h3 className={styles.emptyStateTitle}>Ingen objekter vist ennå</h3>
                <p className={styles.emptyStateText}>
                  Når samlings-API er koblet til Neon, vil dine registrerte objekter vises her med valør, kvalitet og estimater.
                </p>
              </div>

              <div className={styles.btnRow}>
                <button type="button" className={styles.btn} disabled>Åpne samling</button>
                <button type="button" className={styles.btn} disabled>Legg til objekt</button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} disabled>Importer objekt</button>
              </div>
            </div>
          )}

          {/* ØNSKELISTE */}
          {activeTab === "wishlist" && (
            <div>
              <h2 className={styles.panelTitle}>Ønskeliste</h2>
              <p className={styles.panelDesc}>Objekter du ønsker å kjøpe eller holde et øye med.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Objekter på ønskeliste</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Favorittobjekter</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Sist oppdatert</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <div className={styles.emptyState}>
                <Heart size={36} style={{ color: "var(--ct-accent)" }} />
                <h3 className={styles.emptyStateTitle}>Ingen objekter vist ennå</h3>
                <p className={styles.emptyStateText}>
                  Her vil du se mynter og sedler du har markert med hjerte i katalogen for senere anskaffelse.
                </p>
              </div>
            </div>
          )}

          {/* FAVORITTER */}
          {activeTab === "favorites" && (
            <div>
              <h2 className={styles.panelTitle}>Favorittobjekter</h2>
              <p className={styles.panelDesc}>Dine absolutte favoritter eller stoltheter i samlingen.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Favorittobjekter</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Sist oppdatert</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <div className={styles.emptyState}>
                <Star size={36} style={{ color: "var(--ct-border-strong)" }} />
                <h3 className={styles.emptyStateTitle}>Ingen objekter vist ennå</h3>
                <p className={styles.emptyStateText}>
                  Favoritter er objekter du har stjernemerket i din egen samling for rask tilgang og spesiell fremheving.
                </p>
              </div>
            </div>
          )}

          {/* KJØP / SALG */}
          {activeTab === "trades" && (
            <div>
              <h2 className={styles.panelTitle}>Kjøp og Salg</h2>
              <p className={styles.panelDesc}>Administrer dine pågående auksjoner, bud og direkte handler.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Aktive kjøp</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Aktive salg</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Bud</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Auksjoner</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Venter betaling</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Venter oppgjør</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <div className={styles.emptyState}>
                <ArrowLeftRight size={36} />
                <h3 className={styles.emptyStateTitle}>Ingen transaksjoner eller bud funnet</h3>
                <p className={styles.emptyStateText}>
                  Når handelsplattform-API er koblet, kan du administrere kjøp, salg, motpartskommunikasjon og oppgjørslinker her.
                </p>
              </div>
            </div>
          )}

          {/* TRANSAKSJONSLOGG */}
          {activeTab === "transactions" && (
            <div>
              <h2 className={styles.panelTitle}>Transaksjonslogg</h2>
              <p className={styles.panelDesc}>Historisk oversikt over alle fullførte kjøp og salg på din konto.</p>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Dato</th>
                      <th>Type</th>
                      <th>Objekt</th>
                      <th>Motpart</th>
                      <th>Pris</th>
                      <th>Valuta</th>
                      <th>Status</th>
                      <th>Dokument</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={8} className={styles.notice} style={{ textAlign: "center", padding: "32px" }}>
                        Ingen transaksjoner vist ennå.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROSESSER */}
          {activeTab === "processes" && (
            <div>
              <h2 className={styles.panelTitle}>Pågående prosesser</h2>
              <p className={styles.panelDesc}>Følg status på auksjonsoppgjør, graderinger, import og systemprosesser.</p>

              {/* Filter chips */}
              <div className={styles.filterChips}>
                {[
                  "Alle",
                  "Kjøp",
                  "Salg",
                  "Auksjon",
                  "Forhandler",
                  "Dokumentasjon",
                  "Betaling",
                  "Oppgjør",
                  "Deling",
                  "System",
                ].map((chip, idx) => (
                  <button
                    key={chip}
                    type="button"
                    className={`${styles.chip} ${idx === 0 ? styles.chipActive : ""}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Prosess</th>
                      <th>Objekt</th>
                      <th>Siste steg</th>
                      <th>Frist</th>
                      <th>Handling</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={6} className={styles.notice} style={{ textAlign: "center", padding: "32px" }}>
                        Ingen prosess-logger funnet for øyeblikket.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "16px", fontSize: "0.8rem", color: "var(--ct-muted)" }}>
                <span style={{ fontWeight: 800 }}>Tillatte prosess-statuser:</span> Utkast, Sendt, Venter, Krever handling, Under behandling, Godkjent, Avvist, Fullført, Kansellert, Arkivert.
              </div>
            </div>
          )}

          {/* VARSLER */}
          {activeTab === "notifications" && (
            <div>
              <h2 className={styles.panelTitle}>Varsler</h2>
              <p className={styles.panelDesc}>Systemvarsler, betalingsoppfordringer og auksjonsvarsler.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Uleste varsler</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Handling kreves</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Systemvarsler</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Betaling</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Auksjon</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Forhandler</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Dokumentasjon</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <div className={styles.emptyState}>
                <Bell size={36} />
                <h3 className={styles.emptyStateTitle}>Ingen nye varsler</h3>
                <p className={styles.emptyStateText}>
                  Du har ingen nye eller ubehandlede varsler på denne kontoen.
                </p>
              </div>

              <div className={styles.btnRow}>
                <button type="button" className={styles.btn} disabled>
                  Marker alle som lest
                </button>
              </div>
            </div>
          )}

          {/* MELDINGER */}
          {activeTab === "messages" && (
            <div>
              <h2 className={styles.panelTitle}>Direkte meldinger</h2>
              <p className={styles.panelDesc}>Kommuniser med administratorer, forhandlere og andre brukere.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Meldinger fra admin</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Meldinger fra forhandler</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Meldinger om kjøp/salg</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Systemmeldinger</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <div className={styles.emptyState}>
                <MessageSquare size={36} />
                <h3 className={styles.emptyStateTitle}>Ingen meldinger funnet</h3>
                <p className={styles.emptyStateText}>
                  Ingen meldinger vist ennå. Koble til API for å hente dine samtaler.
                </p>
              </div>
            </div>
          )}

          {/* DOKUMENTER */}
          {activeTab === "documents" && (
            <div>
              <h2 className={styles.panelTitle}>Mine Dokumenter</h2>
              <p className={styles.panelDesc}>Arkiv for kvitteringer, eierskapssertifikater og takstdokumenter.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Kvitteringer</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Sertifikater</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Avtaler</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Opplastet dokumentasjon</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Delte dokumenter</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
              </div>

              <div className={styles.emptyState}>
                <FileText size={36} />
                <h3 className={styles.emptyStateTitle}>Ingen lagrede dokumenter</h3>
                <p className={styles.emptyStateText}>
                  Du kan laste opp eller se dine offisielle eierskapsbevis og auksjonskvitteringer når dokument-APIet er koblet til.
                </p>
              </div>

              <div className={styles.btnRow}>
                <button type="button" className={styles.btn} disabled>Last opp dokument</button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} disabled>Se dokumenter</button>
              </div>
            </div>
          )}

          {/* INNSTILLINGER */}
          {activeTab === "settings" && (
            <div>
              <h2 className={styles.panelTitle}>Innstillinger</h2>
              <p className={styles.panelDesc}>Konfigurer dine kontopreferanser og deling.</p>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <span className={styles.label}>Språk</span>
                  <select className={styles.select} defaultValue="nb" aria-label="Velg språk">
                    <option value="nb">Norsk (Bokmål)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Varselpreferanser</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                      <input type="checkbox" defaultChecked /> E-postvarsling ved viktige hendelser
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                      <input type="checkbox" /> SMS-varsling ved nye bud på mine auksjoner
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                      <input type="checkbox" defaultChecked /> Push-varsling i nettleser
                    </label>
                  </div>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Profilvisning</span>
                  <select className={styles.select} defaultValue="samlere" aria-label="Profilsynlighet">
                    <option value="public">Offentlig (Alle kan se min samling)</option>
                    <option value="samlere">Kun registrerte samlere</option>
                    <option value="private">Privat (Kun meg selv)</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Samlingsdeling</span>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", marginTop: "4px" }}>
                    <input type="checkbox" defaultChecked /> Tillat andre å sende meg bytteforespørsler
                  </label>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Personvern</span>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", marginTop: "4px" }}>
                    <input type="checkbox" defaultChecked disabled /> Godta systemets brukervilkår og GDPR-policy
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SIKKERHET */}
          {activeTab === "security" && (
            <div>
              <h2 className={styles.panelTitle}>Sikkerhet &amp; Innlogging</h2>
              <p className={styles.panelDesc}>Administrer passord, aktive økter og to-faktor-autentisering.</p>

              <div className={styles.formGrid} style={{ marginBottom: "24px" }}>
                <div className={styles.field}>
                  <span className={styles.label}>Aktiv session</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Sist innlogging</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Aktive enheter</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>Passordstatus</span>
                  <div className={styles.readOnlyValue}>Ikke koblet</div>
                </div>
                <div className={styles.field}>
                  <span className={styles.label}>To-faktor status</span>
                  <div className={styles.readOnlyValue}>Ikke koblet (Tilgjengelig senere)</div>
                </div>
              </div>

              <div className={styles.btnRow}>
                <button type="button" className={styles.btn} disabled>Endre passord</button>
                <button type="button" className={styles.btn} disabled>Logg ut av alle enheter</button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} disabled>Aktiver to-faktor</button>
              </div>
            </div>
          )}

          {/* SVAR TIL CHATGPT */}
          {activeTab === "chatgpt" && (
            <div>
              <h2 className={styles.panelTitle}>Svar til ChatGPT status</h2>
              <p className={styles.panelDesc}>Statusrapport for Min side klar til å kopieres og sendes i chatten.</p>

              <div className={styles.chatgptBlock}>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={copyToClipboard}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {copySuccess ? <Check size={14} /> : <ClipboardCopy size={14} />}
                    {copySuccess ? "Kopiert!" : "Kopier status"}
                  </span>
                </button>
                
                <pre className={styles.preText}>
                  {chatGptStatusText}
                </pre>
              </div>
            </div>
          )}

        </section>

        {/* ChatGPT Summary Area (Persistently shown at bottom as requested) */}
        <section className={styles.chatgptSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, fontFamily: "var(--ct-font-display, serif)" }}>
              SVAR TIL CHATGPT — MIN SIDE STATUS
            </h2>
            <button
              type="button"
              className={styles.btn}
              style={{ padding: "6px 12px", fontSize: "0.75rem" }}
              onClick={copyToClipboard}
            >
              {copySuccess ? "Kopiert!" : "Kopier status"}
            </button>
          </div>
          <div className={styles.chatgptBlock} style={{ marginTop: "12px" }}>
            <pre className={styles.preText} style={{ maxHeight: "250px", overflow: "auto" }}>
              {chatGptStatusText}
            </pre>
          </div>
        </section>

      </div>
    </div>
  );
}
