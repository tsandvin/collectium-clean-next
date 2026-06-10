/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Object Preview React Component
 *
 * Definering / formal:
 * React template content for UI 8.5. Shows object presentation, collector
 * actions, finance small-field accent, clean icons and text underline hover.
 *
 * Bruksomrade:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berorte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - collection.wishlist.view
 * - collection.favorite.view
 * - collection.item.add.preview
 * - object.share.preview
 *
 * Berorte API-ruter:
 * - Ingen i preview. Production action buttons must connect to API/backend.
 *
 * Berorte tabeller / views:
 * - Ingen i preview.
 *
 * Dataretning:
 * Static preview. Production object data must use object_id + object_group + source_key.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.object.preview
 *
 * Versjon:
 * UI85-REACT-TEMPLATE-V17C / CHANGE-UI85-2026-06-11-0017
 */

import { HeartIcon, PlusIcon, ShareIcon, StarIcon } from "./CollectiumUi85Icons";
import type { CollectiumUi85Action } from "./collectium-ui85-types";
import styles from "./CollectiumUi85ObjectPreview.module.css";

const actions: CollectiumUi85Action[] = [
  { label: "Hjerte", meta: "Onskeliste", count: "0", icon: "heart" },
  { label: "Stjerne", meta: "Favoritt", count: "0", icon: "star" },
  { label: "Legg i samling", meta: "Min samling", icon: "plus" },
  { label: "Del objekt", meta: "Tidslenke", icon: "share" },
];

function IconFor({ icon }: { icon: CollectiumUi85Action["icon"] }) {
  if (icon === "heart") return <HeartIcon />;
  if (icon === "star") return <StarIcon />;
  if (icon === "plus") return <PlusIcon />;
  return <ShareIcon />;
}

export function CollectiumUi85ObjectPreview() {
  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>Collectium UI 8.5 / React template</p>
      <h1>Objektpresentasjon med standard skall, rammer og handlingsfelt</h1>
      <p className={styles.lead}>Dette er en React-template, ikke en HTML-installasjon. Skall, sidebar, topbar, page frame, signaturhjorner og skins ligger i template-komponentene. Produksjonsdata skal fortsatt komme via API/backend.</p>

      <section className={styles.hero} aria-label="Objektpresentasjon preview">
        <div className={styles.imagePanel}>
          <div className={styles.note}>1 kr<span>1917 / Litra A</span></div>
        </div>

        <div className={styles.identity}>
          <p className={styles.objectMeta}>NSNR 23a · Norske sedler · banknote · object_id 1459</p>
          <h2>1 krone · 1917-serien · 1917 · Litra A · Seddelpapir</h2>
          <div className={styles.factGrid}>
            <div><span>Valør</span><b>1 krone</b></div>
            <div><span>Årstall</span><b>1917</b></div>
            <div><span>Valørutgave / serie</span><b>1917-serien</b></div>
            <div><span>Regent</span><b>Haakon VII</b></div>
            <div><span>Signatur</span><b>Winge / Getz</b></div>
            <div><span>Marked</span><b>Ikke vurdert</b></div>
          </div>
        </div>

        <div className={styles.actionPanel} aria-label="Objekthandlinger preview">
          {actions.map((action) => (
            <button className={styles.action} key={action.label} type="button">
              <span className={styles.actionIcon}><IconFor icon={action.icon} /></span>
              <span><b>{action.label}</b><small>{action.meta}</small></span>
              {action.count ? <em>{action.count}</em> : null}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid} aria-label="Template standardfelt">
        <article className={styles.card}><h3>Rammer og skall</h3><p>Template-komponenten eier ramme, page frame, sidebar, topbar, signaturhjørne og skin tokens.</p></article>
        <article className={styles.card}><h3>Finans-regel</h3><p>Knapper og brytere bruker 6px. Små felt bruker gul/amber aksent der grønn blir for svak.</p></article>
        <article className={styles.card}><h3>Ikonregel</h3><p>Ikoner er store inline SVG-symboler uten egen ramme, boks eller bakgrunn.</p></article>
        <article className={styles.card}><h3>Hoverregel</h3><p>Mouse-over gir en tydeligere farget bunnlinje under tekst/rad, ikke hard ramme rundt feltet.</p></article>
      </section>
    </div>
  );
}
