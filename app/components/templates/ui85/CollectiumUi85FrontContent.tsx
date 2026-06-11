/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Front Content
 *
 * Definering / formal:
 * Ren React-front for Collectium. Komponenten er faktisk frontsiden, ikke demo,
 * preview eller canvas. Den viser produksjonsrettet inngang til katalog,
 * samling, marked, historikk og systemflater.
 *
 * Bruksomrade:
 * - /
 *
 * Berorte sider / routes:
 * - app/page.tsx
 *
 * Berorte DB-brytere / feature_keys:
 * - landing.view
 * - catalog.view
 * - collection.view
 * - market.index.view
 *
 * Berorte API-ruter:
 * - Ingen direkte i denne komponenten.
 *
 * Berorte tabeller / views:
 * - Ingen direkte.
 *
 * Dataretning:
 * MariaDB/Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: front
 * log_action: ui85.front.view
 *
 * Versjon:
 * UI85-FRONT-CONTENT-V1 / CHANGE-UI85-2026-06-11-FRONT-0002
 */

import styles from "./CollectiumUi85FrontContent.module.css";

const frontCards = [
  {
    eyebrow: "Katalog",
    title: "Objekter, kilder og relasjoner",
    body: "Utforsk samlerobjekter med kilde, objektgruppe, historikk, relasjoner og marked i samme arbeidsflate.",
    href: "/katalog",
    action: "Ã…pne katalog",
  },
  {
    eyebrow: "Min side",
    title: "Samling, prosesser og aktivitet",
    body: "Se samling, medlemskap, varsler, meldinger, kjÃ¸p, salg og pÃ¥gÃ¥ende prosesser samlet i Ã©n flate.",
    href: "/min-side",
    action: "GÃ¥ til Min side",
  },
  {
    eyebrow: "Marked",
    title: "Historie og finansiell innsikt",
    body: "Koble objekter mot perioder, markedsdata, verdiutvikling, auksjon, nettbutikk og personlig samlingsanalyse.",
    href: "/katalog",
    action: "Se markedsflate",
  },
];

const statusItems = [
  "Next.js React-front",
  "Global Collectium layout",
  "Katalog og relasjoner",
  "Samling og medlemskap",
  "Marked og historikk",
];

export function CollectiumUi85FrontContent() {
  return (
    <main className={styles.front} aria-label="Collectium front">
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Collectium app</p>
          <h1>Applikasjonen for katalog, samling og markedsinnsikt.</h1>
          <p className={styles.lead}>
            Collectium samler katalog, relasjoner, historikk, brukerfunksjoner
            og markedsdata i en kontrollert React-front.
          </p>

          <div className={styles.actions} aria-label="Hovedhandlinger">
            <a className={styles.primary} href="/katalog">
              Ã…pne katalog
            </a>
            <a className={styles.secondary} href="/login">
              Logg inn
            </a>
            <a className={styles.secondary} href="/min-side">
              Min side
            </a>
          </div>
        </div>

        <aside className={styles.statusPanel} aria-label="Systemflate">
          <p className={styles.panelLabel}>Collectium arbeidsflate</p>
          <ul>
            {statusItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className={styles.cardGrid} aria-label="HovedomrÃ¥der">
        {frontCards.map((card) => (
          <article className={styles.card} key={card.title}>
            <p className={styles.cardEyebrow}>{card.eyebrow}</p>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <a href={card.href}>{card.action}</a>
          </article>
        ))}
      </section>

      <section className={styles.domainPanel} aria-label="Domenemodell">
        <p className={styles.cardEyebrow}>LÃ¥st domenemodell</p>
        <h2>collectium.no og app.collectium.no har ulike roller.</h2>
        <p>
          app.collectium.no er arbeidsflaten for innlogging, katalog, samling,
          markedsinnsikt og kontrollerte systemflater. Den offentlige nettsiden
          kan ligge separat pÃ¥ collectium.no.
        </p>
      </section>
    </main>
  );
}
