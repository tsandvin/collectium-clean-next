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
import {
  HeartIcon,
  PlusIcon,
  ShareIcon,
  StarIcon,
  TagIcon,
  CalendarIcon,
  LayersIcon,
  ShieldIcon,
  BookOpenIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GlobeIcon,
  CheckCircleIcon,
} from "./CollectiumUi85Icons";
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

function Banknote({ museum = false, realImage = false, list = false }: { museum?: boolean; realImage?: boolean; list?: boolean }) {
  if (realImage) {
    return (
      <div className={`${styles.banknote} ${museum ? styles.banknoteMuseum : ""} ${list ? styles.banknoteList : ""}`} aria-label="Objektbilde">
        <img src="/100_kroner_1877.jpg" alt="100 kroner 1877" className={styles.banknoteImg} />
      </div>
    );
  }

  return (
    <div className={`${styles.banknote} ${museum ? styles.banknoteMuseum : ""} ${list ? styles.banknoteList : ""}`} aria-label="Objektbilde">
      <strong>100</strong>
      {!museum ? <div className={styles.portrait} /> : <div className={styles.museumGlow} />}
      <div className={styles.banknoteLine} />
      <span>Norges Bank - Oscar II - 1877</span>
      {!museum ? <em>A 045 921</em> : null}
    </div>
  );
}

function ActionButtons() {
  return (
    <div className={styles.actionButtonsRow} aria-label="Kortkommandoer">
      <Link href="/katalog" className={styles.btnAction}>
        <span className={styles.btnActionIcon}><ExternalLinkIcon /></span>
        <span>Åpne objekt</span>
      </Link>
      <Link href="/katalog/kontroll" className={styles.btnAction}>
        <span className={styles.btnActionIcon}><GitBranchIcon /></span>
        <span>Se relasjon</span>
      </Link>
      <Link href="/min-side" className={styles.btnAction}>
        <span className={styles.btnActionIcon}><GlobeIcon /></span>
        <span>Legg i samling</span>
      </Link>
      <button type="button" className={styles.btnActionMore} aria-label="Flere valg">
        <span>...</span>
      </button>
    </div>
  );
}

function ActionPanel({ listMode = false }: { listMode?: boolean }) {
  return (
    <div className={`${styles.actionPanel} ${listMode ? styles.actionPanelList : ""}`} aria-label="Objekthandlinger">
      {actions.map((action) => (
        <button className={`${styles.action} ${listMode ? styles.actionList : ""}`} key={action.label} type="button">
          <span className={styles.actionIcon}>
            <IconFor icon={action.icon} />
          </span>
          {!listMode ? (
            <span>
              <b>{action.label}</b>
              <small>{action.meta}</small>
            </span>
          ) : (
            <b>{action.label}</b>
          )}
          <em>{action.count}</em>
        </button>
      ))}
    </div>
  );
}

function PriceBox({ listMode = false }: { listMode?: boolean }) {
  return (
    <section className={`${styles.priceBox} ${listMode ? styles.priceBoxList : ""}`} aria-label="Estimert pris">
      <span>Estimert pris</span>
      <strong>15 000 kr</strong>
      <small>
        <span className={styles.checkIcon}>
          <CheckCircleIcon />
        </span>
        <span>Vurdert</span>
      </small>
    </section>
  );
}

function Facts({ compact = false }: { compact?: boolean }) {
  const rows = compact ? facts.slice(0, 4) : facts;

  return (
    <dl className={styles.factGrid}>
      {rows.map((fact) => {
        let IconComponent = TagIcon;
        if (fact.label === "Utgave") IconComponent = CalendarIcon;
        else if (fact.label === "Variant") IconComponent = LayersIcon;
        else if (fact.label === "Sjeldenhet") IconComponent = ShieldIcon;
        else if (fact.label === "Signatur") IconComponent = GitBranchIcon;
        else if (fact.label === "Konge") IconComponent = ShieldIcon;

        return (
          <div key={fact.label} className={styles.factItem}>
            <dt>
              <span className={styles.specIcon}>
                <IconComponent />
              </span>
              <span>{fact.label}</span>
            </dt>
            <dd>{fact.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function HistoryPanel({ museum = false, showActions = false }: { museum?: boolean; showActions?: boolean }) {
  return (
    <section className={`${styles.historyPanel} ${museum ? styles.historyPanelMuseum : ""} ${showActions ? styles.historyPanelWithActions : ""}`} aria-label="Historic dynamisk felt">
      <div className={styles.historyHeader}>
        <span className={styles.bookIcon} aria-hidden="true">
          <BookOpenIcon />
        </span>
        <strong>Historie</strong>
        <small>· dynamisk felt</small>
      </div>

      <dl className={styles.historyGrid}>
        {(museum ? history : history.slice(0, 6)).map((item) => (
          <div key={item.label} className={styles.historyItem}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      {showActions && (
        <div className={styles.historyActions}>
          <ActionButtons />
        </div>
      )}
    </section>
  );
}

function ListCard() {
  return (
    <article className={`${styles.card} ${styles.listCard}`} data-layout="list">
      <div className={styles.listMedia}>
        <Banknote list />
      </div>

      <div className={styles.listInfo}>
        <h2>100 kroner 1877</h2>
        <div className={styles.listSpecs}>
          <div>
            <span>Valørutgave</span>
            <strong>100 kroner</strong>
          </div>
          <div>
            <span>Utgave</span>
            <strong>1. utgave</strong>
          </div>
          <div>
            <span>Variant</span>
            <strong>Standardutgave</strong>
          </div>
          <div>
            <span>Sjeldenhet</span>
            <strong>Sjelden</strong>
          </div>
        </div>
        <p className={styles.meta}>Seddel · Norske sedler · Oscar II · NS 1459</p>
      </div>

      <div className={styles.listActions}>
        <ActionButtons />
      </div>

      <div className={styles.listBadges}>
        <ActionPanel listMode />
      </div>

      <div className={styles.listPrice}>
        <PriceBox listMode />
      </div>
    </article>
  );
}

function HorizontalCard({ layout }: { layout: CollectiumUi85Layout }) {
  if (layout === "list") {
    return <ListCard />;
  }

  return (
    <article className={`${styles.card} ${styles.horizontalCard}`} data-layout="horizontal">
      <div className={styles.mainContentFlow}>
        <div className={styles.topSection}>
          <div className={styles.mediaContainer}>
            <Banknote realImage />
          </div>
          <div className={styles.infoContainer}>
            <h2>100 kroner 1877</h2>
            <Facts />
            <p className={styles.meta}>Seddel · Norske sedler · Oscar II · NS 1459</p>
          </div>
        </div>
        <div className={styles.bottomSection}>
          <HistoryPanel showActions />
        </div>
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
      <p className={styles.meta}>Seddel · Norske sedler · Oscar II · NS 1459</p>

      <div className={styles.standingDetails}>
        <div className={styles.standingLeftColumn}>
          <HistoryPanel />
        </div>
        <div className={styles.standingRightColumn}>
          <ActionPanel />
          <PriceBox />
        </div>
      </div>

      <div className={styles.standingBottomActions}>
        <ActionButtons />
      </div>
    </article>
  );
}

function MuseumCard() {
  return (
    <article className={`${styles.card} ${styles.museumCard}`} data-layout="museum">
      <div className={styles.museumLeft}>
        <Banknote museum />
      </div>

      <div className={styles.museumRight}>
        <h2>Museum · 100 kroner 1877</h2>
        <HistoryPanel museum />
        <div className={styles.museumActions}>
          <ActionButtons />
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

