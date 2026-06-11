/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Standing Object Card
 *
 * Definering / formal:
 * Laast staende objektkort for UI85. Fire skins bytter kun tokens/farger,
 * mens markup, rekkefolge og safe-zone er identisk.
 *
 * Bruksomrade:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berorte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - object.card.standing.view
 *
 * Berorte API-ruter:
 * - Ingen i preview. Produksjonsdata kobles senere via API/backend.
 *
 * Dataretning:
 * Static preview -> React -> UI.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.object_card.standing
 *
 * Versjon:
 * UI85-DESIGN-STANDARD-V20
 */

import { HeartIcon, PlusIcon, ShareIcon, StarIcon } from "./CollectiumUi85Icons";
import type { CollectiumUi85Action, CollectiumUi85Skin } from "./collectium-ui85-types";
import styles from "./CollectiumUi85ObjectPreview.module.css";

const actions: CollectiumUi85Action[] = [
  { label: "Hjerte", meta: "0", count: "0", icon: "heart" },
  { label: "Stjerne", meta: "0", count: "0", icon: "star" },
  { label: "Auksjon", meta: "3", count: "3", icon: "share" },
  { label: "Nettbutikk", meta: "1", count: "1", icon: "plus" },
];

const facts = [
  { label: "Valorutgave", value: "100 kroner" },
  { label: "Utgave", value: "1. utgave" },
  { label: "Variant", value: "Standardutgave" },
  { label: "Sjeldenhet", value: "Sjelden" },
];

const history = [
  { label: "Regent / konge", value: "Oscar II" },
  { label: "Motiv / person", value: "Riksvapen" },
  { label: "Periode", value: "1872-1905" },
  { label: "Signatur", value: "Winge / Getz" },
];

function IconFor({ icon }: { icon: CollectiumUi85Action["icon"] }) {
  if (icon === "heart") return <HeartIcon />;
  if (icon === "star") return <StarIcon />;
  if (icon === "plus") return <PlusIcon />;
  return <ShareIcon />;
}

export function CollectiumUi85ObjectPreview({
  activeSkin,
  activeLabel,
}: {
  activeSkin: CollectiumUi85Skin;
  activeLabel: string;
}) {
  return (
    <section className={styles.preview} aria-label="UI85 staende objektkort">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Collectium - UI 8.5 - visningskort</p>
        <h1>Objektkort - last layout, fire skinn</h1>
        <p>
          Samme markup i alle fire skins. Skin bytter kun tokens, mens staende
          objektkort, safe-zone og hjornesignatur beholdes.
        </p>
      </div>

      <div className={styles.sectionTitle}>
        <span>B</span>
        <strong>Staende</strong>
        <i>maks 380px - vertikal</i>
      </div>

      <article className={styles.card} data-skin={activeSkin} aria-label={`Objektkort ${activeLabel}`}>
        <div className={styles.banknote} aria-label="Objektbilde">
          <strong>100</strong>
          <div className={styles.portrait} />
          <div className={styles.banknoteLine} />
          <span>Norges Bank - Oscar II - 1877</span>
          <em>A 045 921</em>
        </div>

        <h2>100 kroner 1877</h2>

        <dl className={styles.factGrid}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <p className={styles.meta}>Seddel - Norske sedler - Oscar II - NS 1459</p>

        <div className={styles.detailRow}>
          <section className={styles.historyPanel} aria-label="Historic dynamisk felt">
            <div className={styles.historyHeader}>
              <span className={styles.bookIcon} aria-hidden="true">H</span>
              <strong>Historic</strong>
              <small>dynamisk felt</small>
            </div>

            <dl>
              {history.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className={styles.actionPanel} aria-label="Objekthandlinger">
            {actions.map((action) => (
              <button className={styles.action} key={action.label} type="button">
                <span className={styles.actionIcon}>
                  <IconFor icon={action.icon} />
                </span>
                <b>{action.label}</b>
                <em>{action.count}</em>
              </button>
            ))}
          </div>
        </div>

        <section className={styles.priceBox} aria-label="Estimert pris">
          <span>Estimert pris</span>
          <strong>15 000 kr</strong>
          <small>Vurdert</small>
        </section>

        <div className={styles.cardActions} aria-label="Kortkommandoer">
          <a href="/katalog">Apne objekt</a>
          <a href="/katalog/kontroll">Se relasjon</a>
          <a href="/min-side">Legg i samling</a>
        </div>
      </article>
    </section>
  );
}
