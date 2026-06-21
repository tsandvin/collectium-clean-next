"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Object Presentation Client UI 8.6
 *
 * Definering / formål:
 * React-klient for objektpresentasjon etter kilde, objektgruppe, object_id og bilde.
 * Inneholder demo-/presentasjonsmodus med 10 dummyobjekter, auth-gate for ekte
 * objektvisning, shared-link modus, medlemskapsstyrte felt, skins og høyre Min samling-panel.
 *
 * Berørte routes:
 * - /objektpresentasjon
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 * - collection.add
 * - collection.favorite.toggle
 * - collection.wishlist.toggle
 * - object.share.create
 *
 * Berørte API-ruter:
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 *
 * Berørte tabeller / views:
 * - ct_v_object_presentation_resolved
 * - ct_v_no_banknote_object_presentation
 * - ct_v_object_relations_resolved
 * - ct_v_object_market_resolved
 * - ct_v_object_user_state_resolved
 */

import { useMemo, useState } from "react";
import styles from "./CollectiumObjectPresentationClient.module.css";

type Tab = "samler" | "historie" | "finans" | "samling" | "relasjoner";
type Mode = "objekt" | "museum" | "kompakt" | "finans";
type Membership = "guest" | "free" | "bronze" | "silver" | "gold" | "platinum";

type TimelineItem = {
  label: string;
  sub: string;
  left: string;
  width: string;
  href: string;
  lane: "regent" | "history" | "finance" | "object";
  match: (item: ObjectItem) => boolean;
};

type ObjectItem = {
  objectId: string;
  sourceKey: string;
  objectGroup: string;
  catalogNumber: string;
  title: string;
  denomination: string;
  year: string;
  litra: string;
  issue: string;
  variant: string;
  signatures: string;
  regent: string;
  regentPeriod: string;
  rarity: string;
  quantity: string;
  noteNumber: string;
  noteText: string;
  serial: string;
};

type Props = {
  mode: "demo" | "object";
  isLoggedIn?: boolean;
  isSharedLink?: boolean;
  routeObject?: {
    sourceKey: string;
    objectGroup: string;
    objectId: string;
  };
};

const demoObjects: ObjectItem[] = [
  { objectId: "9", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 1005", title: "10 kroner · 1979 · 1 005 · BH", denomination: "10 kroner", year: "1979", litra: "BH", issue: "5. utgave (1966-1983)", variant: "Standardutgave", signatures: "Getz Wold / Sagård", regent: "Olav V", regentPeriod: "1957-1991", rarity: "Vanlig", quantity: "4 939 000", noteNumber: "10", noteText: "Norges Bank · Olav V · 1979", serial: "BH 1 005" },
  { objectId: "1459", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 1459", title: "100 kroner · 1. utgave · 1877 · Seddelpapir", denomination: "100 kroner", year: "1877", litra: "A", issue: "1. utgave", variant: "Standardutgave", signatures: "Winge / Getz", regent: "Oscar II", regentPeriod: "1872-1905", rarity: "RRR", quantity: "Ekstremt sjelden", noteNumber: "100", noteText: "Norges Bank · Oscar II · 1877", serial: "A 045 921" },
  { objectId: "23", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 23a", title: "1 krone · 1917 · Litra A", denomination: "1 krone", year: "1917", litra: "A", issue: "2. utgave", variant: "Litra A", signatures: "Direktør / kasserer", regent: "Haakon VII", regentPeriod: "1905-1957", rarity: "Sjelden", quantity: "Lav", noteNumber: "1", noteText: "Norges Bank · Haakon VII · 1917", serial: "A 023" },
  { objectId: "44", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 44", title: "5 kroner · 1942 · London", denomination: "5 kroner", year: "1942", litra: "L", issue: "Krigsutgave", variant: "London", signatures: "Regjeringen i London", regent: "Haakon VII", regentPeriod: "1905-1957", rarity: "Sjelden", quantity: "Krigsperiode", noteNumber: "5", noteText: "Norges Bank · London · 1942", serial: "L 1942" },
  { objectId: "71", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 71", title: "50 kroner · 1948 · etterkrig", denomination: "50 kroner", year: "1948", litra: "B", issue: "Etterkrigsutgave", variant: "Standard", signatures: "Norges Bank", regent: "Haakon VII", regentPeriod: "1905-1957", rarity: "Normal", quantity: "Middels", noteNumber: "50", noteText: "Norges Bank · Haakon VII · 1948", serial: "B 071" },
  { objectId: "110", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 110", title: "100 kroner · 1964 · Olav V", denomination: "100 kroner", year: "1964", litra: "C", issue: "4. utgave", variant: "Standard", signatures: "Norges Bank", regent: "Olav V", regentPeriod: "1957-1991", rarity: "Normal", quantity: "Middels", noteNumber: "100", noteText: "Norges Bank · Olav V · 1964", serial: "C 110" },
  { objectId: "190", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 190", title: "500 kroner · 1976 · skipsmotiv", denomination: "500 kroner", year: "1976", litra: "D", issue: "5. utgave", variant: "Skipsmotiv", signatures: "Norges Bank", regent: "Olav V", regentPeriod: "1957-1991", rarity: "Sjelden", quantity: "Begrenset", noteNumber: "500", noteText: "Norges Bank · Olav V · 1976", serial: "D 190" },
  { objectId: "240", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 240", title: "1000 kroner · 1982 · 5. utgave", denomination: "1000 kroner", year: "1982", litra: "E", issue: "5. utgave", variant: "Standard", signatures: "Norges Bank", regent: "Olav V", regentPeriod: "1957-1991", rarity: "Sjelden", quantity: "Lav", noteNumber: "1000", noteText: "Norges Bank · Olav V · 1982", serial: "E 240" },
  { objectId: "310", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 310", title: "50 kroner · 1991 · Harald V", denomination: "50 kroner", year: "1991", litra: "F", issue: "6. utgave", variant: "Modernisert", signatures: "Norges Bank", regent: "Harald V", regentPeriod: "1991-", rarity: "Normal", quantity: "Høy", noteNumber: "50", noteText: "Norges Bank · Harald V · 1991", serial: "F 310" },
  { objectId: "420", sourceKey: "norske_sedler", objectGroup: "banknote", catalogNumber: "NS 420", title: "200 kroner · 1994 · moderne serie", denomination: "200 kroner", year: "1994", litra: "G", issue: "7. utgave", variant: "Moderne", signatures: "Norges Bank", regent: "Harald V", regentPeriod: "1991-", rarity: "Normal", quantity: "Høy", noteNumber: "200", noteText: "Norges Bank · Harald V · 1994", serial: "G 420" },
];

const timelineItems: TimelineItem[] = [
  { label: "Oscar II", sub: "1872-1905 · svensk-norsk union", left: "0%", width: "28%", href: "/relasjon/regent/oscar-ii", lane: "regent", match: (item) => item.regent === "Oscar II" },
  { label: "Haakon VII", sub: "1905-1957 · selvstendig Norge", left: "28%", width: "38%", href: "/relasjon/regent/haakon-vii", lane: "regent", match: (item) => item.regent === "Haakon VII" },
  { label: "Olav V", sub: "1957-1991 · etterkrig/oljealder", left: "66%", width: "20%", href: "/relasjon/regent/olav-v", lane: "regent", match: (item) => item.regent === "Olav V" },
  { label: "Harald V", sub: "1991- · moderne Norge", left: "86%", width: "14%", href: "/relasjon/regent/harald-v", lane: "regent", match: (item) => item.regent === "Harald V" },
  { label: "Unionstid", sub: "1814-1905 · politisk periode", left: "0%", width: "28%", href: "/relasjon/periode/unionstid", lane: "history", match: (item) => Number(item.year) <= 1905 },
  { label: "Selvstendig Norge", sub: "1905- · nasjonal periode", left: "28%", width: "72%", href: "/relasjon/periode/selvstendig-norge", lane: "history", match: (item) => Number(item.year) > 1905 },
  { label: "Bank- og pengehistorie", sub: "1816-1905", left: "5%", width: "32%", href: "/relasjon/finans/bank-og-pengehistorie", lane: "finance", match: (item) => Number(item.year) < 1905 },
  { label: "Mellomkrig / krigsøkonomi", sub: "1918-1945", left: "40%", width: "20%", href: "/relasjon/finans/krigsokonomi", lane: "finance", match: (item) => Number(item.year) >= 1918 && Number(item.year) <= 1945 },
  { label: "Olje- og velferdsperiode", sub: "1969-1990", left: "70%", width: "20%", href: "/relasjon/finans/oljealder", lane: "finance", match: (item) => Number(item.year) >= 1969 && Number(item.year) < 1991 },
];

const membershipRank: Record<Membership, number> = {
  guest: 0,
  free: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
  platinum: 5,
};

function canSee(level: Membership, required: Membership) {
  return membershipRank[level] >= membershipRank[required];
}

function Field({ label, value, required = "free", membership, href }: { label: string; value: string; required?: Membership; membership: Membership; href?: string }) {
  const allowed = canSee(membership, required);
  return (
    <div className={styles.field}>
      <span>{label}</span>
      <strong>{allowed ? (href ? <a href={href}>{value}</a> : value) : "Tomt felt · krever Bronze+"}</strong>
    </div>
  );
}

function DemoSelector({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <section className={styles.demoStrip}>
      <div className={styles.demoHeader}>
        <div>
          <h1>Objektpresentasjon · demo for nye brukere</h1>
          <p>Velg ett av 10 dummyobjekter for å se hvordan objektpresentasjon, relasjoner og brukerpanel fungerer. Globalt skinn styres fra Collectium designpanelet.</p>
        </div>
      </div>
      <div className={styles.demoObjects}>
        {demoObjects.map((item) => (
          <button key={item.objectId} type="button" className={`${styles.demoObject} ${selectedId === item.objectId ? styles.demoObjectActive : ""}`} onClick={() => onSelect(item.objectId)}>
            <span className={styles.demoNumber}>{item.noteNumber}</span>
            <span className={styles.demoName}>{item.title}</span>
            <span className={styles.demoMeta}>{item.catalogNumber}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function CollectiumObjectPresentationClient({ mode, isLoggedIn = false, isSharedLink = false, routeObject }: Props) {
  const [tab, setTab] = useState<Tab>("samler");
  const [viewMode, setViewMode] = useState<Mode>("objekt");
  const [membership, setMembership] = useState<Membership>(mode === "demo" ? "guest" : isLoggedIn ? "bronze" : "guest");
  const [selectedId, setSelectedId] = useState(routeObject?.objectId ?? "9");
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});

  const selectedObject = useMemo(() => {
    const found = demoObjects.find((item) => item.objectId === selectedId) ?? demoObjects[0];
    if (!routeObject) return found;
    return {
      ...found,
      sourceKey: routeObject.sourceKey,
      objectGroup: routeObject.objectGroup,
      objectId: routeObject.objectId,
      catalogNumber: `${routeObject.sourceKey} ${routeObject.objectId}`,
    };
  }, [selectedId, routeObject]);

  const isDemo = mode === "demo";
  const hasAccess = isDemo || isLoggedIn || isSharedLink;
  const effectiveMembership: Membership = isSharedLink && !isLoggedIn ? "free" : membership;
  const onlyCore = !canSee(effectiveMembership, "bronze");

  const keyData = viewMode === "finans"
    ? [["Markedsverdi", "Mangler", "ikke vis 0 kr"], ["Trend 12 mnd", "Ikke beregnet", "market view"], ["Auksjon", "Ikke registrert", "status"], ["Nettbutikk", "Ikke registrert", "status"], ["Grade values", "Mangler", "{}"], ["Prisgrunnlag", "Mangler", "observasjoner"]]
    : [["Valør", selectedObject.denomination, selectedObject.objectGroup], ["Utgave", selectedObject.issue, selectedObject.year], ["Variant", selectedObject.litra, selectedObject.catalogNumber], ["Signatur", selectedObject.signatures, "signaturgruppe"], ["Regent", selectedObject.regent, selectedObject.regentPeriod], ["Objektnøkkel", selectedObject.objectId, "source + group + id"]];

  return (
    <div className={styles.shell} data-view={viewMode}>
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.modeBar}>
            <div className={styles.membershipSelect}>
              <span className={styles.inlineNote}>{mode === "demo" ? "Test tilgang:" : "Tilgang:"}</span>
              <select className={styles.selectLike} value={membership} onChange={(event) => setMembership(event.target.value as Membership)}>
                <option value="guest">Gjest / demo</option>
                <option value="free">Free</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
          </div>

          {isDemo && membership === "guest" ? <DemoSelector selectedId={selectedId} onSelect={setSelectedId} /> : null}

          {!hasAccess ? (
            <section className={styles.authNotice}>
              <strong>Logg inn for å se objektpresentasjon.</strong>
              <p>Denne ruten er bruker-/medlemsside. Direkte delte objektlenker kan vise ett spesifikt objekt med begrenset innhold, men full objektpresentasjon krever innlogging og medlemskap.</p>
              <button className={`${styles.topButton} ${styles.topButtonPrimary}`}>Logg inn</button>
            </section>
          ) : null}

          {isSharedLink && !isLoggedIn ? (
            <div className={styles.sharedBanner}>Delt visningslenke: viser ett spesifikt objekt med begrenset Free-tilgang. Min samling og private felt er låst.</div>
          ) : null}

          {hasAccess ? (
            <>
              <section className={styles.hero}>
                <div className={styles.heroGrid}>
                  <div className={styles.noteImage}>
                    <div className={styles.notePaper}>
                      <div className={styles.num}>{selectedObject.noteNumber}</div>
                      <div className={styles.seal} />
                      <div className={styles.noteLine} />
                      <div className={styles.noteText}>{selectedObject.noteText}</div>
                      <div className={styles.noteSerial}>{selectedObject.serial}</div>
                    </div>
                    <div className={styles.imageControls}>
                      {['Forside','Bakside','Gjennomlysning','Variant','Detalj'].map((label, index) => <button key={label} className={`${styles.pill} ${index === 0 ? styles.pillActive : ""}`} type="button">{label}</button>)}
                    </div>
                    <div className={styles.fallback}>Bildekilde: variant_obverse / reverse / transmitted light. Dersom alle er null: Bilde ikke registrert.</div>
                  </div>
                  <div className={styles.heroText}>
                    <span className={styles.badge}>Objekt info · hovedobjekt fra katalogen</span>
                    <h1 className={styles.title}>{selectedObject.title}</h1>
                    <p className={styles.lead}>Objektpresentasjon for hovedobjekt fra katalogen. Viser {selectedObject.denomination}, {selectedObject.issue}, variant {selectedObject.litra}, signaturgruppe {selectedObject.signatures} og regent {selectedObject.regent}.</p>
                    <div className={styles.metaMini}>
                      <div className={styles.mini}><span className={styles.label}>Kilde</span><span className={styles.value}>Norske sedler</span><span className={styles.sub}>{selectedObject.sourceKey}</span></div>
                      <div className={styles.mini}><span className={styles.label}>Objektgruppe</span><span className={styles.value}>Banknote</span><span className={styles.sub}>{selectedObject.objectGroup}</span></div>
                      <div className={styles.mini}><span className={`${styles.value} ${styles.valueBig}`}>{selectedObject.objectId}</span><span className={styles.sub}>source + group + id</span></div>
                    </div>
                    <div className={styles.modeNarrative}>{onlyCore ? "Free/gjest ser kjerneinformasjon. Tomme felt viser hva Bronze+ åpner." : "Bronze+ viser samler-, historie-, finans- og min samling-felter etter tilgang."}</div>
                  </div>
                </div>
              </section>

              <div className={styles.tabsRow}>
                <div className={styles.leftTabs}>
                  {[["samler","I Samler"],["historie","II Historie"],["finans","III Finans"]].map(([key, label]) => <button key={key} className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`} type="button" aria-pressed={tab === key} onClick={() => setTab(key as Tab)}>{label}</button>)}
                </div>
                <div className={styles.rightTabs}>
                  {[["samling","IV I min samling"],["relasjoner","V Relasjon objekter"]].map(([key, label]) => <button key={key} className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`} type="button" aria-pressed={tab === key} onClick={() => setTab(key as Tab)}>{label}</button>)}
                  {[["objekt","Objekt info"],["museum","Museum"],["kompakt","Kompakt"],["finans","Finans"]].map(([key, label]) => <button key={key} className={`${styles.mode} ${viewMode === key ? styles.modeActive : ""}`} type="button" aria-pressed={viewMode === key} onClick={() => { setViewMode(key as Mode); if (key === "finans") setTab("finans"); }}>{label}</button>)}
                </div>
              </div>

              <section className={styles.keyrow}>
                <div className={styles.keygrid}>
                  {keyData.map(([label, value, sub]) => <div className={styles.key} key={`${label}-${value}`}><span className={styles.label}>{label}</span><span className={styles.value}>{value}</span><span className={styles.sub}>{sub}</span></div>)}
                </div>
              </section>

              <section className={styles.timeline}>
                <div className={styles.timelineHeader}>
                  <div>
                    <span className={styles.timelineKicker}>Periodefilter · relasjonstidslinje</span>
                    <h2>Tidslinje for {selectedObject.year}</h2>
                  </div>
                  <a className={styles.timelineYearLink} href={`/relasjon/publiseringsar/${selectedObject.year}`} title={`Åpne publiseringsår ${selectedObject.year}`}>{selectedObject.year}</a>
                </div>
                <div className={styles.timelineTicks}><span>1870</span><span>1905</span><span>1940</span><span>1969</span><span>1991</span><span>2024</span></div>
                <div className={styles.timelineGrid}>
                  <div className={styles.timelineLabel}>Konge / regent</div>
                  <div className={styles.timelineLane}>
                    {timelineItems.filter((item) => item.lane === "regent").map((item) => (
                      <a key={item.label} href={item.href} title={`${item.label}: ${item.sub}. Klikk for relasjonskort.`} className={`${styles.timelineBar} ${item.match(selectedObject) ? styles.timelineBarCurrent : ""}`} style={{ left: item.left, width: item.width }}>{item.label}</a>
                    ))}
                  </div>
                  <div className={styles.timelineLabel}>Historisk periode</div>
                  <div className={styles.timelineLane}>
                    {timelineItems.filter((item) => item.lane === "history").map((item) => (
                      <a key={item.label} href={item.href} title={`${item.label}: ${item.sub}. Klikk for relasjonskort.`} className={`${styles.timelineBar} ${styles.timelineBarGreen} ${item.match(selectedObject) ? styles.timelineBarCurrent : ""}`} style={{ left: item.left, width: item.width }}>{item.label}</a>
                    ))}
                  </div>
                  <div className={styles.timelineLabel}>Finans / økonomi</div>
                  <div className={styles.timelineLane}>
                    {timelineItems.filter((item) => item.lane === "finance").map((item) => (
                      <a key={item.label} href={item.href} title={`${item.label}: ${item.sub}. Klikk for relasjonskort.`} className={`${styles.timelineBar} ${styles.timelineBarFinance} ${item.match(selectedObject) ? styles.timelineBarCurrent : ""}`} style={{ left: item.left, width: item.width }}>{item.label}</a>
                    ))}
                  </div>
                  <div className={styles.timelineLabel}>Objekt / utgiver</div>
                  <div className={styles.timelineLane}>
                    <a href={`/relasjon/utgave/${selectedObject.issue.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}`} title={`${selectedObject.issue}. Klikk for utgave-/objektperiode.`} className={`${styles.timelineBar} ${styles.timelineBarPurple} ${styles.timelineBarCurrent}`} style={{ left: selectedObject.regent === "Oscar II" ? "10%" : selectedObject.regent === "Haakon VII" ? "38%" : selectedObject.regent === "Olav V" ? "66%" : "86%", width: selectedObject.regent === "Olav V" ? "18%" : "14%" }}>{selectedObject.issue}</a>
                  </div>
                </div>
                <p className={styles.timelineHelp}>Aktiv periode er større og lysere. Hold over for rask info. Klikk på konge, periode, finanslag, objektperiode eller årstall for relasjonspresentasjon.</p>
              </section>

              <div className={styles.layout}>
                <main className={styles.mainPanels}>
                  <section className={`${styles.panelGrid} ${tab !== 'samler' ? styles.hidden : ''}`}>
                    <div className={styles.panel}><h3>Identitet</h3><Field membership={effectiveMembership} label="Katalognummer" value={selectedObject.catalogNumber} /><Field membership={effectiveMembership} label="Collectium-tittel" value={selectedObject.title} /><Field membership={effectiveMembership} label="Valør" value={selectedObject.denomination} href="/relasjon/valor/10-kroner" /><Field membership={effectiveMembership} label="År" value={selectedObject.year} href={`/relasjon/ar/${selectedObject.year}`} /><Field membership={effectiveMembership} label="Litra" value={selectedObject.litra} /></div>
                    <div className={`${styles.panel} ${onlyCore ? styles.lockedPanel : ''}`}><h3>Utgave og variant</h3><Field membership={effectiveMembership} required="bronze" label="Valørutgave / serie" value={selectedObject.issue} /><Field membership={effectiveMembership} required="bronze" label="Variant" value={selectedObject.variant} /><Field membership={effectiveMembership} required="bronze" label="Signatur" value={selectedObject.signatures} /><Field membership={effectiveMembership} required="bronze" label="Regent" value={selectedObject.regent} /></div>
                    <div className={`${styles.panel} ${onlyCore ? styles.lockedPanel : ''}`}><h3>Sjeldenhet og mengde</h3><Field membership={effectiveMembership} required="bronze" label="Katalogvurdering" value={selectedObject.rarity} /><Field membership={effectiveMembership} required="bronze" label="Estimert mengde" value={selectedObject.quantity} /><Field membership={effectiveMembership} required="silver" label="Signaturmengde" value="Hentes fra seddel-view" /><Field membership={effectiveMembership} required="silver" label="Status" value="Basis klar" /></div>
                    <div className={styles.panel} style={{ gridColumn: '1 / -1' }}><h3>Bilde og fallback</h3><Field membership={effectiveMembership} label="Forside" value="variant_obverse_image_path · henter" /><Field membership={effectiveMembership} label="Bakside" value="variant_reverse_image_path · henter" /><Field membership={effectiveMembership} label="Gjennomlysning" value="transmitted_light · henter" /><div className={styles.fallback}>Hvis alle bildefelter er null, skal UI vise: Bilde ikke registrert.</div></div>
                  </section>

                  <section className={`${styles.panelGrid} ${styles.panelGridTwo} ${tab !== 'historie' ? styles.hidden : ''}`}>
                    <div className={styles.panel}><h3>Periodekoblinger</h3>{["Objektår", "Publiseringsår", "Utgaveperiode", "Regentperiode", "Hovedperiode"].map((label) => <span key={label} className={styles.periodBadge}><span className={styles.periodType}>{label}</span>{label.includes('Regent') ? selectedObject.regentPeriod : label.includes('Utgave') ? selectedObject.issue : selectedObject.year}</span>)}</div>
                    <div className={styles.panel}><h3>Regent · signatur · motiv</h3><Field membership={effectiveMembership} required="bronze" label="Regent" value={selectedObject.regent} /><Field membership={effectiveMembership} required="bronze" label="Regentperiode" value={selectedObject.regentPeriod} /><Field membership={effectiveMembership} required="bronze" label="Signaturgruppe" value={selectedObject.signatures} /><Field membership={effectiveMembership} required="silver" label="Hovedperiode" value="Selvstendig Norge / Unionstid" /></div>
                    <div className={styles.panel} style={{ gridColumn: '1 / -1' }}><h3>Relasjoner fra ct_v_object_relations_resolved</h3>{[["År", selectedObject.year], ["Regent", selectedObject.regent], ["Utgave", selectedObject.issue], ["Valør", selectedObject.denomination]].map(([label, value]) => <div key={`${label}-${value}`} className={styles.listItem}><div><strong>{label} · {value}</strong><small>/relasjon/{label.toLowerCase()}/{String(value).toLowerCase().replaceAll(' ', '-')}</small></div><span className={styles.arrow}>→</span></div>)}</div>
                  </section>

                  <section className={`${styles.panelGrid} ${styles.panelGridTwo} ${tab !== 'finans' ? styles.hidden : ''}`}>
                    <div className={`${styles.panel} ${!canSee(effectiveMembership, 'silver') ? styles.lockedPanel : ''}`}><h3>Markedsverdi per kvalitet</h3>{canSee(effectiveMembership, 'silver') ? <div className={styles.barChart}>{[10,15,20,28,40,58,74,92].map((height) => <div key={height} className={styles.bar} style={{ height: `${height}%` }} />)}</div> : <div className={styles.lockedText}>Finansdata krever Silver+.</div>}</div>
                    <div className={styles.panel}><h3>Marked og salg</h3><Field membership={effectiveMembership} required="silver" label="Markedsverdi" value="Mangler markedsverdi" /><Field membership={effectiveMembership} required="silver" label="Trend 12 mnd" value="Ikke beregnet trend" /><Field membership={effectiveMembership} required="bronze" label="Auksjon" value="Ikke registrert på auksjon" /><Field membership={effectiveMembership} required="bronze" label="Nettbutikk" value="Ikke registrert i nettbutikk" /></div>
                    <div className={styles.panel}><h3>Indexkobling</h3><Field membership={effectiveMembership} required="silver" label="Kjøpekraft" value="Henter" /><Field membership={effectiveMembership} required="silver" label="Lønn / befolkning" value="Henter" /><Field membership={effectiveMembership} required="silver" label="Rente / metall" value="Henter" /></div>
                    <div className={styles.panel}><h3>Finansperiode</h3>{["6 mnd", "12 mnd", "24 mnd", "Alle år"].map((label) => <span key={label} className={styles.periodBadge}><span className={styles.periodType}>{label}</span>trend</span>)}</div>
                  </section>

                  <section className={`${styles.panelGrid} ${styles.panelGridTwo} ${tab !== 'samling' ? styles.hidden : ''}`}>
                    <div className={`${styles.panel} ${!canSee(effectiveMembership, 'bronze') ? styles.lockedPanel : ''}`}><h3>Kjøp</h3><Field membership={effectiveMembership} required="bronze" label="Dato" value="Ikke registrert" /><Field membership={effectiveMembership} required="bronze" label="Sted" value="Ikke registrert" /><Field membership={effectiveMembership} required="bronze" label="Kjøpt av/fra" value="Ikke registrert" /><Field membership={effectiveMembership} required="bronze" label="Pris" value="Ikke registrert" /></div>
                    <div className={`${styles.panel} ${!canSee(effectiveMembership, 'bronze') ? styles.lockedPanel : ''}`}><h3>Kvalitet og notat</h3><Field membership={effectiveMembership} required="bronze" label="Min kvalitet" value="Ikke vurdert" /><Field membership={effectiveMembership} required="bronze" label="Gradering" value="Ikke registrert" /><Field membership={effectiveMembership} required="bronze" label="Synlighet" value="Privat" /><div className={styles.fallback}>Private samlingsdata hentes fra brukerstatus/user collection views når user_id finnes.</div></div>
                    <div className={styles.panel} style={{ gridColumn: '1 / -1' }}><h3>Egne spesifikasjoner</h3><Field membership={effectiveMembership} required="bronze" label="Papirfølelse" value="Henter fra ct_user_collection_object_specs" /><Field membership={effectiveMembership} required="bronze" label="Hjørner" value="Henter" /><Field membership={effectiveMembership} required="bronze" label="Vannmerke" value="Henter" /><Field membership={effectiveMembership} required="bronze" label="Proveniens" value="Samtykkestyrt / privat" /></div>
                  </section>

                  <section className={`${styles.panelGrid} ${styles.panelGridOne} ${tab !== 'relasjoner' ? styles.hidden : ''}`}>
                    <div className={styles.panel}><h3>Relasjon objekter</h3>{[["Samme regent", selectedObject.regent], ["Samme utgaveperiode", selectedObject.issue], ["Samme valør", selectedObject.denomination], ["Samme variant", selectedObject.variant], ["Samme signaturgruppe", selectedObject.signatures]].map(([label, value]) => <div key={`${label}-${value}`} className={styles.listItem}><div><strong>{label} · {value}</strong><small>Vis objekter og kunnskapsnode for relasjonen.</small></div><span className={styles.arrow}>→</span></div>)}</div>
                  </section>

                  <section className={`${styles.panelGrid} ${styles.panelGridOne}`} style={{ marginTop: 16 }}>
                    <div className={styles.panel}><h3>API / view-kjede og status</h3><div className={styles.techGrid}>{["ct_v_object_presentation_resolved", "ct_v_no_banknote_object_presentation", "ct_v_object_relations_resolved", "ct_v_object_market_resolved", "ct_v_object_user_state_resolved"].map((view) => <div key={view} className={styles.tech}>View<strong>{view}</strong></div>)}</div><div className={styles.field}><span>Page key</span><strong className={styles.statusOK}>object.presentation · OK</strong></div><div className={styles.field}><span>Route</span><strong className={styles.statusOK}>/objekt/[sourceKey]/[objectGroup]/[objectId] · OK</strong></div><div className={styles.field}><span>Datadekning</span><strong className={styles.statusWarn}>Markedsdata, bilder, historisk kontekst og brukerstatus · DELVIS</strong></div></div>
                  </section>
                </main>

                <aside className={styles.side}>
                  <div className={styles.panel}><h3>Aktiv visning</h3><div className={styles.shareBtns}>{[["objekt","Objekt info"],["museum","Museum"],["kompakt","Kompakt"],["finans","Finans"]].map(([key, label]) => <button key={key} className={`${styles.mode} ${viewMode === key ? styles.modeActive : ""}`} type="button" aria-pressed={viewMode === key} onClick={() => { setViewMode(key as Mode); if (key === "finans") setTab("finans"); }}>{label}</button>)}</div></div>
                  <div className={styles.panel}><h3>Status</h3>{[["heart","♡","Hjerte","Ønskeliste"],["star","★","Stjerne","Favoritt"],["collect","＋","Legg i samling","Min samling"],["share","↗","Del objekt","Visningslenke"],["compare","⇄","Sammenlign","Mot andre objekter"]].map(([id, icon, label, sub]) => <button key={id} className={`${styles.action} ${savedStates[id] ? styles.actionPrimary : ""}`} type="button" onClick={() => setSavedStates((prev) => ({ ...prev, [id]: !prev[id] }))}><span className={styles.icon}>{icon}</span><span>{label}<br/><small>{sub}</small></span></button>)}</div>
                  <div className={styles.panel}><h3>Del visning</h3><div className={styles.shareBtns}>{["6t", "12t", "18t", "24t", "48t"].map((item) => <button key={item} className={`${styles.pill} ${item === '12t' ? styles.pillActive : ''}`}>{item}</button>)}</div><div className={styles.field}><span>Katalog</span><strong>{selectedObject.catalogNumber}</strong></div><div className={styles.field}><span>Tilgang</span><strong>12 timer</strong></div><button className={`${styles.pill} ${styles.pillActive}`}>Generer lenke</button></div>
                </aside>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
