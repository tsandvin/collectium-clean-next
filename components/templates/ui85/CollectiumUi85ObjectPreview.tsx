/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Object Preview React Component v18
 *
 * Definering / formål:
 * React template content for UI 8.5. Shows object presentation, collector
 * actions, finance small-field accent, clean icons and text underline hover.
 *
 * Bruksområde:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berørte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - collection.wishlist.view
 * - collection.favorite.view
 * - collection.item.add.preview
 * - object.share.preview
 *
 * Berørte API-ruter:
 * - Ingen i preview. Production action buttons must connect to API/backend.
 *
 * Berørte tabeller / views:
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
 * UI85-REACT-TEMPLATE-V18 / CHANGE-UI85-2026-06-11-0018
 */

import { HeartIcon, PlusIcon, ShareIcon, StarIcon } from "./CollectiumUi85Icons";
import type { CollectiumUi85Action } from "./collectium-ui85-types";
import styles from "./CollectiumUi85ObjectPreview.module.css";

const actions: CollectiumUi85Action[] = [
  { label: "Hjerte", meta: "Ønskeliste", count: "0", icon: "heart" },
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
      <p className={styles.eyebrow}>Collectium UI 8.5 / React innholdsmodul</p>
      <h1>Objektpresentasjon inne i eksisterende Collectium-skall</h1>
      <p className={styles.lead}>Denne versjonen lager ikke egen sidebar eller topbar. Eksisterende AppShell eier skall, meny og global responsivitet. UI85 leverer bare innhold, rammer, kort og handlingsfelt.</p>

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
        <article className={styles.card}><h3>Ingen dobbel sidebar</h3><p>UI85-modulen bruker eksisterende global sidebar og lager ikke egen sidemeny inne i innholdet.</p></article>
        <article className={styles.card}><h3>Ingen dobbel topbar</h3><p>Topbar beholdes fra global AppShell. Modulen viser kun en lokal modulheader inne i content frame.</p></article>
        <article className={styles.card}><h3>Riktig innholdsmodul</h3><p>Dette er riktig Next.js/React-retning for preview inne i eksisterende frontend.</p></article>
        <article className={styles.card}><h3>Senere API-kobling</h3><p>Produksjonsdata skal kobles via API/backend og object_id + object_group + source_key.</p></article>
      </section>
    </div>
  );
}
