/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Front Content
 *
 * Definering / formal:
 * Ren React-front for Collectium. Komponenten er produksjonsrettet
 * frontinnhold, ikke demo, preview eller canvas.
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
 * UI85-FRONT-CONTENT-V2 / CHANGE-UI85-2026-06-11-FRONT-0005
 */

import styles from "./CollectiumUi85FrontContent.module.css";

const frontCards = [
  {
    label: "Katalog",
    title: "Objekter, kilder og relasjoner",
    body: "Utforsk objekter med kilde, objektgruppe, historikk, relasjoner, marked og samlerstatus i samme arbeidsflate.",
    href: "/katalog",
    action: "Ã…pne katalog",
  },
  {
    label: "Min side",
    title: "Samling, prosesser og aktivitet",
    body: "Se samling, medlemskap, varsler, meldinger, kjÃ¸p, salg og pÃ¥gÃ¥ende prosesser samlet pÃ¥ ett sted.",
    href: "/min-side",
    action: "GÃ¥ til Min side",
  },
  {
    label: "Marked",
    title: "Historie og finansiell innsikt",
    body: "Koble objekter mot perioder, verdiutvikling, auksjon, nettbutikk og personlig samlingsanalyse.",
    href: "/katalog",
    action: "Se markedsflate",
  },
];

export function CollectiumUi85FrontContent() {
  return (
    <main className={styles.front} aria-label="Collectium front">
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Collectium app</p>
          <h1>Applikasjonen for katalog, samling og markedsinnsikt.</h1>
          <p className={styles.lead}>
            Collectium samler katalog, relasjoner, historikk,
            brukerfunksjoner og markedsdata i en kontrollert React-front.
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
      </section>

      <section className={styles.cardGrid} aria-label="HovedomrÃ¥der">
        {frontCards.map((card) => (
          <article className={styles.card} key={card.title}>
            <p className={styles.cardEyebrow}>{card.label}</p>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
            <a href={card.href}>{card.action}</a>
          </article>
        ))}
      </section>

      <section className={styles.domainPanel} aria-label="Collectium arbeidsflate">
        <p className={styles.cardEyebrow}>Collectium arbeidsflate</p>
        <h2>Ã‰n front for katalog, samling, relasjoner og marked.</h2>
        <p>
          app.collectium.no er arbeidsflaten for innlogging, katalog, samling,
          markedsinnsikt og kontrollerte systemflater. Fronten viser React-UI,
          mens data, tilgang og handlinger skal kontrolleres av API og database.
        </p>
      </section>
    </main>
  );
}
