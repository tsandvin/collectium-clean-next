/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side generic panel
 *
 * Definering / formål:
 * Første versjon av innholdspaneler for alle arkivfaner utenom Oversikt.
 * Panelene er strukturert for senere API-kobling og rolle-/feature-kontroll.
 *
 * Bruksområde:
 * Brukes av MinSideShell for Profil, Medlemskap, Samling, Logg osv.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - profile.view
 * - membership.view
 * - collection.view
 * - transactions.view
 * - notifications.view
 * - messages.view
 * - documents.view
 * - security.sessions.view
 * - dealer.dashboard.view
 * - admin.dashboard.view
 *
 * Berørte API-ruter:
 * - GET /api/account/profile
 * - GET /api/account/membership
 * - GET /api/account/transactions
 * - GET /api/account/security
 *
 * Berørte tabeller / views:
 * - ct_users
 * - ct_collection_items
 * - ct_collection_transactions
 * - ct_notifications
 * - ct_messages
 * - ct_user_sessions
 *
 * Dataretning:
 * API/backend -> React -> UI
 *
 * Logging:
 * log_category: account
 * log_action: min_side.panel_view
 *
 * Versjon:
 * CT-FILE-MINSIDE-0007 / CHANGE-2026-06-11-0001
 */

import styles from "./MinSide.module.css";
import type { MinSideTabKey } from "./min-side-types";

type Props = {
  tabKey: MinSideTabKey;
};

const panelCopy: Record<MinSideTabKey, { title: string; intro: string; items: string[]; action: string }> = {
  overview: {
    title: "Oversikt",
    intro: "Samlet status for Min side.",
    items: [],
    action: "Oppdater oversikt",
  },
  profile: {
    title: "Profil",
    intro: "Personlig informasjon, offentlig navn, språk og profilstatus.",
    items: ["Visningsnavn", "Offentlig navn", "E-poststatus", "Språk", "Personvernvalg"],
    action: "Rediger profil",
  },
  membership: {
    title: "Medlemskap",
    intro: "Nåværende plan, tilgang, begrensninger og oppgraderingsvalg.",
    items: ["Silver", "Avansert filter", "Samlingsanalyse", "Fakturaer", "Tilgangslogg"],
    action: "Se tilgang",
  },
  collection: {
    title: "Min samling",
    intro: "Brukerens egne objekter, lister, verdi, bilder og dokumentasjon.",
    items: ["142 objekter", "37 uten verdi", "9 uten bilde", "Egne lister", "Deling"],
    action: "Åpne samling",
  },
  wishlist: {
    title: "Ønskeliste",
    intro: "Hjerte-markerte objekter og fulgte objekter.",
    items: ["22 objekter", "Følg marked", "Følg auksjon", "Legg i samling"],
    action: "Åpne ønskeliste",
  },
  favorites: {
    title: "Favoritter",
    intro: "Stjerne-markerte objekter, referanser og viktige katalogposter.",
    items: ["14 favoritter", "Relasjoner", "Historikk", "Sammenligning"],
    action: "Åpne favoritter",
  },
  trade: {
    title: "Kjøp / salg",
    intro: "Aktive kjøp, salg, bud, auksjon og forhandlerprosesser.",
    items: ["Aktive kjøp", "Aktive salg", "Bud", "Auksjoner", "Forhandlerforslag"],
    action: "Se handel",
  },
  transactions: {
    title: "Transaksjonslogg",
    intro: "Kjøp, salg, bud, betaling, oppgjør, gebyr og Collectium-fee.",
    items: ["Dato", "Objekt", "Motpart", "Pris", "Betalingsstatus", "Dokumenter"],
    action: "Åpne logg",
  },
  processes: {
    title: "Prosesser",
    intro: "Saker som pågår: dokumentasjon, forhandler, auksjon, betaling og deling.",
    items: ["Krever handling", "Venter", "Under behandling", "Godkjent", "Arkivert"],
    action: "Åpne prosesser",
  },
  notifications: {
    title: "Varsler",
    intro: "System-, medlemskap-, betaling-, auksjon- og sikkerhetsvarsler.",
    items: ["Uleste", "Krever handling", "System", "Betaling", "Auksjon"],
    action: "Se varsler",
  },
  messages: {
    title: "Meldinger",
    intro: "Dialog med admin, forhandler, kjøper/selger og system.",
    items: ["Admin", "Forhandler", "Kjøper/selger", "System", "Arkiv"],
    action: "Åpne meldinger",
  },
  documents: {
    title: "Dokumenter",
    intro: "Kvitteringer, sertifikater, bilder, avtaler og dokumentasjon.",
    items: ["Kvitteringer", "Sertifikater", "Avtaler", "Objektbilder", "Oppgjør"],
    action: "Åpne dokumenter",
  },
  settings: {
    title: "Innstillinger",
    intro: "Språk, varsler, profilvalg og brukerpreferanser.",
    items: ["Språk", "Varselvalg", "Profilvalg", "Samlingssynlighet", "Personvern"],
    action: "Endre innstillinger",
  },
  security: {
    title: "Sikkerhet",
    intro: "Sessioner, siste innlogging, konto-status og passordflyt.",
    items: ["Aktive sessioner", "Siste innlogging", "E-poststatus", "Passord", "Logg ut av alle enheter"],
    action: "Se sikkerhet",
  },
  dealer: {
    title: "Forhandler",
    intro: "Rolleflate for innleveringer, lager, auksjon, nettbutikk, oppgjør og avtaler.",
    items: ["Forhandlerstatus", "Objektgrupper", "Innleveringer", "Auksjon", "Oppgjør"],
    action: "Krever forhandlerrolle",
  },
  admin: {
    title: "Admin kontroll",
    intro: "Inngang til systemkontroll, brukere, katalog, forhandlere, API, logger og Neon/MariaDB.",
    items: ["Brukere", "Katalog", "DB-brytere", "API-ruter", "MariaDB → Neon Control"],
    action: "Krever adminrolle",
  },
};

export default function MinSidePanel({ tabKey }: Props) {
  const panel = panelCopy[tabKey];

  return (
    <section className={styles.genericPanel}>
      <div className={styles.genericIntro}>
        <span>Arkivmappe</span>
        <h3>{panel.title}</h3>
        <p>{panel.intro}</p>
      </div>

      <div className={styles.fileRows}>
        {panel.items.map((item) => (
          <article key={item} className={styles.fileRow}>
            <span className={styles.fileMarker} aria-hidden="true" />
            <div>
              <strong>{item}</strong>
              <p>Feltet skal kobles til feature/access/API før produksjon.</p>
            </div>
            <span className={styles.fileStatus}>Klar for API</span>
          </article>
        ))}
      </div>

      <footer className={styles.panelFooter}>
        <button type="button" className={styles.actionButton}>{panel.action}</button>
        <span>Ingen produksjonshandling kjøres i denne preview-komponenten.</span>
      </footer>
    </section>
  );
}
