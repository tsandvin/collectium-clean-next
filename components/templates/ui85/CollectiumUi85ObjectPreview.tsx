/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Object Preview React Component v19
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
 * UI85-REACT-TEMPLATE-V19 / CHANGE-UI85-2026-06-11-0019
 */

import { HeartIcon, PlusIcon, ShareIcon, StarIcon } from "./CollectiumUi85Icons";
import type { CollectiumUi85Action, CollectiumUi85Skin } from "./collectium-ui85-types";
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

export function CollectiumUi85ObjectPreview({ activeSkin }: { activeSkin?: CollectiumUi85Skin }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.eyebrow}>Collectium UI 8.5 / aktiv skin: {activeSkin ?? "finans"}</p>
      <h1>Objektpresentasjon inne i eksisterende Collectium-skall</h1>
      <p className={styles.lead}>Tema-knappen over bytter mellom Collectium, Samler, Museum og Finans. Dette er lokal React-state for previewmodulen, ikke global produksjons-designmotor.</p>

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
        <article className={styles.card}><h3>Fire skins</h3><p>Collectium, Samler, Museum og Finans styres av tokenverdier i UI85-modulen.</p></article>
        <article className={styles.card}><h3>Ingen dobbel sidebar</h3><p>Eksisterende global sidebar beholdes. Previewen lager ikke egen sidemeny.</p></article>
        <article className={styles.card}><h3>Ingen dobbel topbar</h3><p>Eksisterende topbar beholdes. Tema-knapp ligger inne i modulen.</p></article>
        <article className={styles.card}><h3>Senere API-kobling</h3><p>Produksjonsdata skal kobles via API/backend og object_id + object_group + source_key.</p></article>
      </section>
    </div>
  );
}
