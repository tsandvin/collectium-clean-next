/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Object Preview
 *
 * Definering / formål:
 * Låst UI85 objektkortstandard med flere layoutvisninger. Skin bytter kun
 * tokens/farger. Layout bytter mellom horisontal, stående, liste og museum.
 *
 * Bruksområde:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berørte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - object.card.horizontal.view
 * - object.card.standing.view
 * - object.card.museum.view
 *
 * Berørte API-ruter:
 * - Ingen i preview. Produksjonsdata kobles senere via API/backend.
 *
 * Dataretning:
 * Static preview -> React -> UI.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.object_card.preview
 *
 * Versjon:
 * UI85-DESIGN-STANDARD-V21
 */

import Link from "next/link";
import { HeartIcon, PlusIcon, ShareIcon, StarIcon } from "./CollectiumUi85Icons";
import type { CollectiumUi85Action, CollectiumUi85Layout, CollectiumUi85Skin } from "./collectium-ui85-types";
import styles from "./CollectiumUi85ObjectPreview.module.css";

const actions: CollectiumUi85Action[] = [
  { label: "Hjerte", meta: "Ønskeliste", count: "0", icon: "heart" },
  { label: "Stjerne", meta: "Favoritt", count: "0", icon: "star" },
  { label: "Auksjon", meta: "Aktive treff", count: "3", icon: "share" },
  { label: "Nettbutikk", meta: "Aktive salg", count: "1", icon: "plus" },
];

const facts = [
  { label: "Valørutgave", value: "100 kroner" },
  { label: "Utgave", value: "1. utgave" },
  { label: "Variant", value: "Standardutgave" },
  { label: "Sjeldenhet", value: "Sjelden" },
  { label: "Signatur", value: "Winge / Getz" },
  { label: "Konge", value: "Oscar II" },
];

const history = [
  { label: "Regent / konge", value: "Oscar II" },
  { label: "Motiv / person", value: "Riksvåpen" },
  { label: "Periode", value: "1872-1905" },
  { label: "Historisk kontekst", value: "Unionstid, norsk seddelhistorie" },
  { label: "Signatur", value: "Winge / Getz" },
  { label: "Kort forklaring", value: "Objektet kobles til regent, signatur og motiv som egne relasjoner." },
];

const layoutMeta: Record<CollectiumUi85Layout, { marker: string; label: string; hint: string }> = {
  all: { marker: "A", label: "Horisontal", hint: "grid 300-1fr-248" },
  horizontal: { marker: "A", label: "Horisontal", hint: "grid 300-1fr-248" },
  standing: { marker: "B", label: "Stående", hint: "maks 380px - vertikal" },
  list: { marker: "C", label: "Liste", hint: "rad - kompakt" },
  museum: { marker: "D", label: "Museum", hint: "galleri - 1.05fr-1fr" },
};

function IconFor({ icon }: { icon: CollectiumUi85Action["icon"] }) {
  if (icon === "heart") return <HeartIcon />;
  if (icon === "star") return <StarIcon />;
  if (icon === "plus") return <PlusIcon />;
  return <ShareIcon />;
}

function Banknote({ museum = false }: { museum?: boolean }) {
  return (
    <div className={museum ? `${styles.banknote} ${styles.banknoteMuseum}` : styles.banknote} aria-label="Objektbilde">
      <strong>100</strong>
      {!museum ? <div className={styles.portrait} /> : <div className={styles.museumGlow} />}
      <div className={styles.banknoteLine} />
      <span>Norges Bank - Oscar II - 1877</span>
      {!museum ? <em>A 045 921</em> : null}
    </div>
  );
}

function PrimaryActions() {
  return (
    <div className={styles.primaryActions} aria-label="Kortkommandoer">
      <Link href="/katalog">Åpne objekt</Link>
      <Link href="/katalog/kontroll">Se relasjon</Link>
    </div>
  );
}

function AddActions() {
  return (
    <div className={styles.addActions} aria-label="Samling">
      <Link href="/min-side">Legg i samling</Link>
      <button type="button" aria-label="Flere valg">...</button>
    </div>
  );
}

function ActionPanel() {
  return (
    <div className={styles.actionPanel} aria-label="Objekthandlinger">
      {actions.map((action) => (
        <button className={styles.action} key={action.label} type="button">
          <span className={styles.actionIcon}>
            <IconFor icon={action.icon} />
          </span>
          <span>
            <b>{action.label}</b>
            <small>{action.meta}</small>
          </span>
          <em>{action.count}</em>
        </button>
      ))}
    </div>
  );
}

function PriceBox() {
  return (
    <section className={styles.priceBox} aria-label="Estimert pris">
      <span>Estimert pris</span>
      <strong>15 000 kr</strong>
      <small>Vurdert</small>
    </section>
  );
}

function Facts({ compact = false }: { compact?: boolean }) {
  const rows = compact ? facts.slice(0, 4) : facts;

  return (
    <dl className={styles.factGrid}>
      {rows.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HistoryPanel({ museum = false }: { museum?: boolean }) {
  return (
    <section className={museum ? `${styles.historyPanel} ${styles.historyPanelMuseum}` : styles.historyPanel} aria-label="Historic dynamisk felt">
      <div className={styles.historyHeader}>
        <span className={styles.bookIcon} aria-hidden="true">H</span>
        <strong>Historie</strong>
        <small>dynamisk felt</small>
      </div>

      <dl>
        {(museum ? history : history.slice(0, 4)).map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HorizontalCard({ layout }: { layout: CollectiumUi85Layout }) {
  const listMode = layout === "list";

  return (
    <article className={listMode ? `${styles.card} ${styles.horizontalCard} ${styles.listCard}` : `${styles.card} ${styles.horizontalCard}`} data-layout={layout}>
      <div className={styles.mediaColumn}>
        <Banknote />
        <PrimaryActions />
      </div>

      <div className={styles.identityColumn}>
        <div className={styles.taxonomy}>Norge - Seddel - Norske sedler - Standardutgave</div>
        <h2>100 kroner - 1877</h2>
        <Facts />
        <p className={styles.meta}>Seddel - Norske sedler - Oscar II - NS 1459</p>
        <AddActions />
      </div>

      <aside className={styles.sideColumn} aria-label="Handlinger og pris">
        <ActionPanel />
        <PriceBox />
      </aside>
    </article>
  );
}

function StandingCard() {
  return (
    <article className={`${styles.card} ${styles.standingCard}`} data-layout="standing">
      <Banknote />
      <h2>100 kroner 1877</h2>
      <Facts compact />
      <p className={styles.meta}>Seddel - Norske sedler - Oscar II - NS 1459</p>

      <div className={styles.standingDetails}>
        <HistoryPanel />
        <ActionPanel />
      </div>

      <PriceBox />
      <PrimaryActions />
      <AddActions />
    </article>
  );
}

function MuseumCard() {
  return (
    <article className={`${styles.card} ${styles.museumCard}`} data-layout="museum">
      <Banknote museum />

      <div className={styles.museumInfo}>
        <h2>Museum - 100 kroner 1877</h2>
        <HistoryPanel museum />
        <div className={styles.museumActions}>
          <PrimaryActions />
          <AddActions />
        </div>
      </div>
    </article>
  );
}

export function CollectiumUi85ObjectPreview({
  activeSkin,
  activeLabel,
  activeLayout,
}: {
  activeSkin: CollectiumUi85Skin;
  activeLabel: string;
  activeLayout: CollectiumUi85Layout;
}) {
  const normalizedLayout = activeLayout === "all" ? "horizontal" : activeLayout;
  const meta = layoutMeta[activeLayout];

  return (
    <section className={styles.preview} data-skin={activeSkin} data-layout={normalizedLayout} aria-label={`UI85 ${meta.label} objektkort ${activeLabel}`}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Collectium - UI 8.5 - visningskort</p>
        <h1>Objektkort - last layout, fire skinn</h1>
        <p>
          Samme markup i alle fire layouts. Skinn bytter kun tokens, mens
          layoutknappen velger struktur.
        </p>
      </div>

      <div className={styles.sectionTitle}>
        <span>{meta.marker}</span>
        <strong>{meta.label}</strong>
        <i>{meta.hint}</i>
      </div>

      {normalizedLayout === "museum" ? <MuseumCard /> : null}
      {normalizedLayout === "standing" ? <StandingCard /> : null}
      {normalizedLayout === "horizontal" || normalizedLayout === "list" ? <HorizontalCard layout={normalizedLayout} /> : null}
    </section>
  );
}
