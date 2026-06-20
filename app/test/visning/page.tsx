/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Test Visningkort 8.6
 *
 * Definering / formål:
 * Standalone testside for Collectium visningskort UI 8.6 med horisontal, liste,
 * museum og stående visning. Siden bruker kun statisk eksempeldata og er ment som
 * visuell testflate før integrasjon mot katalog/API.
 *
 * Bruksområde:
 * Brukes på /test/visning for å kontrollere layout, skins, fargekoder,
 * responsivitet og kortstruktur.
 *
 * Berørte sider / routes:
 * - /test/visning
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen. Dette er en ren testside uten systemhandlinger.
 *
 * Berørte API-ruter:
 * - Ingen.
 *
 * Berørte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Statisk testdata -> Next.js -> React -> UI
 *
 * Logging:
 * Ikke relevant for testside.
 *
 * Versjon:
 * UI86-TEST-VISNING-0001
 */

import styles from "./visning.module.css";

const object = {
  title: "1 øre • 1876 • Bronse • 1",
  value: "1 øre",
  issue: "1876-1902",
  variant: "Ikke registrert",
  rarity: "Ikke vurdert",
  meta: "norske_mynter · coin · 1876 · Frederik VI",
  regent: "Frederik VI",
  year: "1876",
  signature: "Ikke registrert",
  motif: "1 øre • 1876 • Bronse • 1",
  context: "Konge",
  relation: "Relasjon tilgjengelig",
  estimate: "Ikke estimert",
};

const skins = [
  { key: "collectium", label: "Collectium" },
  { key: "samler", label: "Samler" },
  { key: "museum", label: "Museum" },
  { key: "finans", label: "Finans" },
];

function NoteImage({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`${styles.noteImage} ${wide ? styles.noteImageWide : ""}`} aria-label="Objektbilde placeholder">
      <span className={styles.noteNumber}>100</span>
      <span className={styles.noteBank}>NORGES&nbsp;&nbsp;BANK</span>
      <span className={styles.noteSeal} />
      <span className={styles.noteLine} />
    </div>
  );
}

function Field({ icon, label, value }: { icon?: string; label: string; value: string }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{icon ? <span>{icon}</span> : null}{label}</div>
      <div className={styles.fieldValue}>{value}</div>
    </div>
  );
}

function HistoryPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`${styles.historyPanel} ${compact ? styles.historyPanelCompact : ""}`}>
      <header className={styles.historyHeader}>
        <span className={styles.historyIcon}>▣</span>
        <span>Historie</span>
        <small>1808–1814</small>
      </header>
      <div className={styles.historyGrid}>
        <Field label="Regent / konge" value={object.regent} />
        <Field label="Motiv / person" value={object.motif} />
        <Field label="Årstall" value={object.year} />
        <Field label="Historisk kontekst" value={object.context} />
        <Field label="Signatur" value={object.signature} />
        <Field label="Relasjon" value={object.relation} />
      </div>
    </section>
  );
}

function StatusStack({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`${styles.statusStack} ${compact ? styles.statusStackCompact : ""}`}>
      <div className={`${styles.statusPill} ${styles.heart}`}><span>♥</span><strong>Hjerte</strong><em>Ønskeliste</em><b>0</b></div>
      <div className={`${styles.statusPill} ${styles.star}`}><span>★</span><strong>Stjerne</strong><em>Favoritt</em><b>0</b></div>
      <div className={`${styles.statusPill} ${styles.auction}`}><span>⚑</span><strong>Auksjon</strong><em>Aktive treff</em><b>3</b></div>
      <div className={`${styles.statusPill} ${styles.shop}`}><span>◆</span><strong>Nettbutikk</strong><em>Aktive salg</em><b>1</b></div>
      <div className={styles.priceBox}>
        <span>Estimert pris</span>
        <strong>{object.estimate}</strong>
        <em>⌁ Mangler markedsverdi</em>
      </div>
    </aside>
  );
}

function Actions() {
  return (
    <nav className={styles.actions} aria-label="Objekthandlinger">
      <button type="button">↗ Åpne objekt</button>
      <button type="button">⌘ Se relasjon</button>
      <button type="button">◎ Legg i samling</button>
      <button type="button" aria-label="Flere valg">•••</button>
    </nav>
  );
}

function IdentityBlock() {
  return (
    <section className={styles.identityBlock}>
      <h2>{object.title}</h2>
      <div className={styles.identityGrid}>
        <Field icon="◇" label="Valør / utgave" value={object.value} />
        <Field icon="▣" label="Utgave" value={object.issue} />
        <Field icon="▱" label="Variant" value={object.variant} />
        <Field icon="♢" label="Sjeldenhet" value={object.rarity} />
      </div>
      <p className={styles.metaLine}>{object.meta}</p>
    </section>
  );
}

function HorizontalCard() {
  return (
    <article className={`${styles.objectCard} ${styles.horizontalCard}`}>
      <div className={styles.leftColumn}>
        <NoteImage />
        <IdentityBlock />
        <HistoryPanel />
        <Actions />
      </div>
      <StatusStack />
      <span className={styles.signature}>Collectium</span>
    </article>
  );
}

function ListCard() {
  return (
    <article className={`${styles.objectCard} ${styles.listCard}`}>
      <NoteImage wide />
      <IdentityBlock />
      <HistoryPanel compact />
      <StatusStack compact />
      <span className={styles.signature}>Collectium</span>
    </article>
  );
}

function MuseumCard() {
  return (
    <article className={`${styles.objectCard} ${styles.museumCard}`}>
      <NoteImage wide />
      <section className={styles.museumContent}>
        <h2>Museum · {object.title}</h2>
        <HistoryPanel />
        <Actions />
      </section>
      <span className={styles.signature}>Collectium</span>
    </article>
  );
}

function StandingCard() {
  return (
    <article className={`${styles.objectCard} ${styles.standingCard}`}>
      <NoteImage />
      <IdentityBlock />
      <div className={styles.standingMiddle}>
        <HistoryPanel />
        <StatusStack compact />
      </div>
      <Actions />
      <span className={styles.signature}>Collectium</span>
    </article>
  );
}

export default function TestVisningPage() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p>Collectium UI/UX 8.6</p>
          <h1>Test / Visning</h1>
          <span>Visningskort med felles struktur, fire skins og fargekoder.</span>
        </div>
        <div className={styles.skinLegend}>
          {skins.map((skin) => (
            <a key={skin.key} href={`#${skin.key}`}>{skin.label}</a>
          ))}
        </div>
      </header>

      {skins.map((skin) => (
        <section id={skin.key} key={skin.key} className={styles.skinSection} data-skin={skin.key}>
          <header className={styles.skinHeader}>
            <h2>Skin: {skin.label}</h2>
            <p>Samme markup. Kun tokens for farge, kontrast og stemning endres.</p>
          </header>
          <div className={styles.cardGrid}>
            <div>
              <h3>Horisontal</h3>
              <HorizontalCard />
            </div>
            <div>
              <h3>Liste</h3>
              <ListCard />
            </div>
            <div>
              <h3>Museum</h3>
              <MuseumCard />
            </div>
            <div>
              <h3>Stående</h3>
              <StandingCard />
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
