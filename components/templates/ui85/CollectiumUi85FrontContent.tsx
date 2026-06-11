/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Front Content
 *
 * Definering / formal:
 * Produksjonsrettet frontinnhold for app.collectium.no.
 * Forsiden viser nå UI 8.5 v36-standard som faktisk arbeidsflate:
 * kompakt objektkort, objektpresentasjon-link, fire skinn og låst kortstruktur.
 * Dette erstatter gammel landing/hero som hovedinnhold.
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
 * - local.template.theme_ui85
 * - catalog.card.compact_view
 * - catalog.object_presentation.link
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
 * UI85-FRONT-CONTENT-V3 / CHANGE-UI85-2026-06-12-FRONT-V36-STANDARD
 */

import { CollectiumUi85ObjectPreview } from "./CollectiumUi85ObjectPreview";
import styles from "./CollectiumUi85FrontContent.module.css";

const standardPoints = [
  "Én global skin-standard: Collectium, Samler, Museum og Finans.",
  "Objektkortet bruker samme struktur på tvers av skinn; bare tokens byttes.",
  "Visning-lenke peker mot objektpresentasjon og skal ikke være løs demoknapp.",
  "Hjerte, stjerne, auksjon, nettbutikk og pris ligger samlet i statusfelt.",
];

export function CollectiumUi85FrontContent() {
  return (
    <main className={styles.front} aria-label="Collectium UI 8.5 v36 front">
      <section className={styles.standardHero}>
        <div>
          <p className={styles.eyebrow}>Collectium UI 8.5 v36</p>
          <h1>Kompakt visningskort med objektpresentasjon-link.</h1>
          <p className={styles.lead}>
            Dette er ny aktiv standard for app.collectium.no. Forsiden viser nå
            kortsystemet som skal brukes videre i katalog, samling, relasjoner,
            auksjon, nettbutikk og markedsflater.
          </p>
        </div>

        <div className={styles.standardStatus} aria-label="UI 8.5 v36 status">
          <strong>Aktiv standard</strong>
          <span>html[data-theme]</span>
          <em>Collectium · Samler · Museum · Finans</em>
        </div>
      </section>

      <section className={styles.standardPanel} aria-label="Låste UI-regler">
        <p className={styles.cardEyebrow}>Låst metode</p>
        <h2>Samme komponent. Fire skinn. Én tokenmodell.</h2>
        <div className={styles.pointGrid}>
          {standardPoints.map((point) => (
            <div className={styles.point} key={point}>
              {point}
            </div>
          ))}
        </div>
      </section>

      <CollectiumUi85ObjectPreview
        activeSkin="collectium"
        activeLabel="Collectium"
        activeLayout="horizontal"
      />
    </main>
  );
}
