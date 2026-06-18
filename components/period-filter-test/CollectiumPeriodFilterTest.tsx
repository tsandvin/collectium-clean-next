"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest UI/UX 8.6 - sammenlignende periodefilter
 *
 * Definering / formal:
 * Testside for Filter Master + periodefilter hvor hovedpoenget er sammenligning
 * av parallelle perioder, ikke trestruktur. Rad 1, Rad 2 og Rad 3 er
 * sammenligningsakser som legger lag pa samme tidslinje.
 *
 * Bruksomrade:
 * Brukes av /test/periodefilter.
 *
 * Berorte sider / routes:
 * - /test/periodefilter
 *
 * Berorte DB-brytere / feature_keys:
 * - filter.master.resolve
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - relation.timeline.compare
 * - object.relations.view
 *
 * Berorte API-ruter:
 * - GET /api/filter/period/options
 *
 * Berorte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_object_relations_resolved
 * - fremtidig: ct_v_period_timeline_compare_resolved
 *
 * Dataretning:
 * Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: filter
 * log_action: period_compare_timeline_test_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0006 / CHANGE-2026-06-18-0004
 */

import { useMemo, useState } from "react";
import styles from "./CollectiumPeriodFilterTest.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type TimelineMode = "timeline" | "table";
type LaneKey = "ruler" | "national" | "war" | "finance" | "person" | "object";

type TimelineItem = {
  id: string;
  lane: LaneKey;
  label: string;
  subLabel: string;
  start: number;
  end: number;
  kind: "ruler" | "national" | "war" | "finance" | "person" | "object";
  relationHref?: string;
  collectorNote: string;
  historyNote: string;
  financeNote: string;
};

type CompareAxis = {
  id: string;
  label: string;
  description: string;
  laneKeys: LaneKey[];
};

const COMPARE_AXES: CompareAxis[] = [
  {
    id: "ruler_issuer",
    label: "Konge / regent + utgiver",
    description: "Vis hvem som styrte og hvilken utgiver-/objektperiode som ligger under.",
    laneKeys: ["ruler", "object"],
  },
  {
    id: "national_period",
    label: "Nasjonal periode",
    description: "Vis hovedperioder som union, selvstendighet, okkupasjon og etterkrigstid.",
    laneKeys: ["national"],
  },
  {
    id: "war_conflict",
    label: "Krig / konflikt",
    description: "Vis krig, okkupasjon og konflikt som overlapper med objekter og regenter.",
    laneKeys: ["war"],
  },
  {
    id: "finance_economy",
    label: "Finans / økonomi",
    description: "Vis pengepolitikk, inflasjon, kriser og finanshistorisk kontekst.",
    laneKeys: ["finance"],
  },
  {
    id: "person_signature",
    label: "Signatur / person",
    description: "Vis personer, signaturer og administrativ/personhistorisk relasjon.",
    laneKeys: ["person"],
  },
  {
    id: "object_issue",
    label: "Objekt / utgaveperiode",
    description: "Vis utgave, seddelserie eller objektperiode som kan kobles til katalogresultat.",
    laneKeys: ["object"],
  },
];

const DEFAULT_ITEMS: TimelineItem[] = [
  {
    id: "ruler-karl-johan",
    lane: "ruler",
    label: "Karl XIV Johan",
    subLabel: "1814-1844",
    start: 1814,
    end: 1844,
    kind: "ruler",
    relationHref: "/relasjon/regent/karl-xiv-johan",
    collectorNote: "Regentperioden kan brukes som samlerfilter for objekter preget av tidlig unionskontekst.",
    historyNote: "Kobler 1814, union og norsk statsbygging etter Napoleonskrigene.",
    financeNote: "Relevant for tidlig penge- og banksystem etter 1814.",
  },
  {
    id: "ruler-oscar-i",
    lane: "ruler",
    label: "Oscar I",
    subLabel: "1844-1859",
    start: 1844,
    end: 1859,
    kind: "ruler",
    relationHref: "/relasjon/regent/oscar-i",
    collectorNote: "Smal regentperiode som kan gi presis objektavgrensing.",
    historyNote: "Unionstid og modernisering.",
    financeNote: "Kobles til gradvis institusjonell utvikling.",
  },
  {
    id: "ruler-oscar-ii",
    lane: "ruler",
    label: "Oscar II",
    subLabel: "1872-1905",
    start: 1872,
    end: 1905,
    kind: "ruler",
    relationHref: "/relasjon/regent/oscar-ii",
    collectorNote: "Viktig regent for objekter fra sen unionstid.",
    historyNote: "Siste unionskonge for Norge; direkte relevant mot 1905.",
    financeNote: "Kan sammenlignes med unionsoppløsning og penge-/bankkontekst.",
  },
  {
    id: "ruler-haakon-vii",
    lane: "ruler",
    label: "Haakon VII",
    subLabel: "1905-1957",
    start: 1905,
    end: 1957,
    kind: "ruler",
    relationHref: "/relasjon/regent/haakon-vii",
    collectorNote: "Bred objektperiode med mange norske sedler og overgang mellom fred, krig og etterkrig.",
    historyNote: "Selvstendighet, første verdenskrig, mellomkrigstid, andre verdenskrig og gjenreisning.",
    financeNote: "Sterk finansiell kontekst: bank, krig, inflasjon, valuta og pengepolitikk.",
  },
  {
    id: "ruler-olav-v",
    lane: "ruler",
    label: "Olav V",
    subLabel: "1957-1991",
    start: 1957,
    end: 1991,
    kind: "ruler",
    relationHref: "/relasjon/regent/olav-v",
    collectorNote: "Relevant for moderne seddelserier og høy objektmengde.",
    historyNote: "Etterkrigstid, velferdsstat, oljealder og modernisering.",
    financeNote: "Kobles til inflasjon, oljeøkonomi og moderne markedstall.",
  },
  {
    id: "ruler-harald-v",
    lane: "ruler",
    label: "Harald V",
    subLabel: "1991-",
    start: 1991,
    end: 2024,
    kind: "ruler",
    relationHref: "/relasjon/regent/harald-v",
    collectorNote: "Aktuell for nyere sedler, moderne katalog og nåværende referanser.",
    historyNote: "Norge etter den kalde krigen, EU/EØS-kontekst og digitalisering.",
    financeNote: "Kobles til moderne prisobservasjoner, valuta og markedstrender.",
  },
  {
    id: "national-union-sweden",
    lane: "national",
    label: "Union med Sverige",
    subLabel: "1814-1905",
    start: 1814,
    end: 1905,
    kind: "national",
    relationHref: "/relasjon/periode/unionen-mellom-sverige-og-norge",
    collectorNote: "Brukes til å skille objekter fra unionsperioden.",
    historyNote: "Nasjonal hovedperiode som overlapper flere konger og administrative endringer.",
    financeNote: "Gir ramme for økonomisk og monetær utvikling før selvstendighet.",
  },
  {
    id: "national-independent",
    lane: "national",
    label: "Selvstendig Norge",
    subLabel: "1905-1940",
    start: 1905,
    end: 1940,
    kind: "national",
    relationHref: "/relasjon/periode/selvstendig-norge",
    collectorNote: "Skiller norske objekter etter 1905 fra unionsobjekter.",
    historyNote: "Nasjonal selvstendighet før okkupasjonen.",
    financeNote: "Relevant mot bank-, valuta- og kriseperioder før 1940.",
  },
  {
    id: "national-occupation",
    lane: "national",
    label: "Okkupasjonstid",
    subLabel: "1940-1945",
    start: 1940,
    end: 1945,
    kind: "national",
    relationHref: "/relasjon/periode/okkupasjonstid",
    collectorNote: "Kritisk periodemerke for krigsrelaterte objekter.",
    historyNote: "Tysk okkupasjon og norsk eksil-/motstandshistorie.",
    financeNote: "Kobles til krigsøkonomi, knapphet og særskilte pris-/verdiobservasjoner.",
  },
  {
    id: "national-postwar",
    lane: "national",
    label: "Etterkrigstiden",
    subLabel: "1945-",
    start: 1945,
    end: 2024,
    kind: "national",
    relationHref: "/relasjon/periode/etterkrigstiden",
    collectorNote: "Stor objektmengde og moderne samlermarked.",
    historyNote: "Gjenreisning, velferdsstat og moderne Norge.",
    financeNote: "Sterk kobling til inflasjon, valuta, oljeøkonomi og moderne prisdata.",
  },
  {
    id: "war-napoleonic",
    lane: "war",
    label: "Napoleonskrigene / 1814",
    subLabel: "1814",
    start: 1814,
    end: 1815,
    kind: "war",
    relationHref: "/relasjon/hendelse/1814-grunnlovsperioden",
    collectorNote: "Forklarer startpunkt for flere norske perioder.",
    historyNote: "Bakgrunn for 1814, grunnlov og ny union.",
    financeNote: "Relevant for overgang til ny stats- og pengeorden.",
  },
  {
    id: "war-ww1",
    lane: "war",
    label: "Første verdenskrig",
    subLabel: "1914-1918",
    start: 1914,
    end: 1918,
    kind: "war",
    relationHref: "/relasjon/hendelse/forste-verdenskrig",
    collectorNote: "Kan påvirke objektetterspørsel og historisk kontekst.",
    historyNote: "Nøytralitet, forsyning og geopolitisk press.",
    financeNote: "Sammenlignes med inflasjon, vareknapphet og valutaeffekter.",
  },
  {
    id: "war-ww2",
    lane: "war",
    label: "Andre verdenskrig",
    subLabel: "1940-1945",
    start: 1940,
    end: 1945,
    kind: "war",
    relationHref: "/relasjon/hendelse/andre-verdenskrig",
    collectorNote: "Egen sterk samlerkontekst for okkupasjon, krig og nød.",
    historyNote: "Overlapper Haakon VII og okkupasjonstid.",
    financeNote: "Krigsøkonomi, rasjonering og særskilt markedsinteresse.",
  },
  {
    id: "war-coldwar",
    lane: "war",
    label: "Kald krig",
    subLabel: "1947-1991",
    start: 1947,
    end: 1991,
    kind: "war",
    relationHref: "/relasjon/hendelse/kald-krig",
    collectorNote: "Bakgrunn for etterkrigsobjekter og nasjonal symbolbruk.",
    historyNote: "Sikkerhetspolitisk ramme for Olav V-perioden.",
    financeNote: "Kobles til statsbygging, oljealder og internasjonal økonomi.",
  },
  {
    id: "finance-bank",
    lane: "finance",
    label: "Bank- og pengebygging",
    subLabel: "1816-1905",
    start: 1816,
    end: 1905,
    kind: "finance",
    relationHref: "/relasjon/finans/bank-og-pengebygging",
    collectorNote: "Gir økonomisk forklaring til tidlige seddelperioder.",
    historyNote: "Finansiell institusjonsbygging gjennom unionstiden.",
    financeNote: "Basis for pengehistorisk analyse og kilde-/utgiverkobling.",
  },
  {
    id: "finance-interwar",
    lane: "finance",
    label: "Mellomkrig / kriseøkonomi",
    subLabel: "1918-1939",
    start: 1918,
    end: 1939,
    kind: "finance",
    relationHref: "/relasjon/finans/mellomkrigstid-kriseokonomi",
    collectorNote: "Kan forklare knapphet, utgaver og objektinteresse.",
    historyNote: "Mellomkrigstid og økonomisk uro.",
    financeNote: "Sammenlignes med marked, inflasjon og kriseperioder.",
  },
  {
    id: "finance-war-economy",
    lane: "finance",
    label: "Krigsøkonomi",
    subLabel: "1940-1945",
    start: 1940,
    end: 1945,
    kind: "finance",
    relationHref: "/relasjon/finans/krigsokonomi",
    collectorNote: "Finansielt viktig lag for krigsobjekter.",
    historyNote: "Forklarer økonomisk press under okkupasjonen.",
    financeNote: "Viktig for verdi-, knapphets- og markedsanalyse.",
  },
  {
    id: "finance-oil",
    lane: "finance",
    label: "Olje- og inflasjonsperiode",
    subLabel: "1970-1990",
    start: 1970,
    end: 1990,
    kind: "finance",
    relationHref: "/relasjon/finans/olje-og-inflasjon",
    collectorNote: "Forklarer mange moderne utgaver og prisutvikling.",
    historyNote: "Oljeøkonomi, modernisering og sterk samfunnsendring.",
    financeNote: "Kobles til inflasjon, valuta og samlermarkedets historikk.",
  },
  {
    id: "person-christie",
    lane: "person",
    label: "J. S. Christie",
    subLabel: "1871-1883",
    start: 1871,
    end: 1883,
    kind: "person",
    relationHref: "/relasjon/person/j-s-christie",
    collectorNote: "Signatur/person som kan avgrense objektvarianter.",
    historyNote: "Personrelasjon under unionsperioden.",
    financeNote: "Kan påvirke variant- og sjeldenhetsanalyse.",
  },
  {
    id: "person-boggild",
    lane: "person",
    label: "O. B. Bøggild",
    subLabel: "1883-1899",
    start: 1883,
    end: 1899,
    kind: "person",
    relationHref: "/relasjon/person/o-b-boggild",
    collectorNote: "Signatur/person for katalog- og variantfilter.",
    historyNote: "Personlag i sen unionstid.",
    financeNote: "Kan forklares sammen med objektmengde og variantdata.",
  },
  {
    id: "person-vogt",
    lane: "person",
    label: "J. H. L. Vogt",
    subLabel: "1899-1924",
    start: 1899,
    end: 1924,
    kind: "person",
    relationHref: "/relasjon/person/j-h-l-vogt",
    collectorNote: "Lang signaturperiode over 1905-skillet.",
    historyNote: "Overlapper unionsoppløsning og selvstendig Norge.",
    financeNote: "Særlig interessant fordi den krysser historisk/finansiell overgang.",
  },
  {
    id: "person-hambro",
    lane: "person",
    label: "C. J. Hambro",
    subLabel: "1924-1945",
    start: 1924,
    end: 1945,
    kind: "person",
    relationHref: "/relasjon/person/c-j-hambro",
    collectorNote: "Person/signatur inn mot krigstid.",
    historyNote: "Overlapper mellomkrig og andre verdenskrig.",
    financeNote: "God sammenligning mot krise- og krigsøkonomi.",
  },
  {
    id: "person-wilse",
    lane: "person",
    label: "Wilse",
    subLabel: "1945-1953",
    start: 1945,
    end: 1953,
    kind: "person",
    relationHref: "/relasjon/person/wilse",
    collectorNote: "Etterkrigsrelasjon for utgave-/personlag.",
    historyNote: "Koblet til gjenreisningstid.",
    financeNote: "Relevant for etterkrigsøkonomisk kontekst.",
  },
  {
    id: "person-liestoel",
    lane: "person",
    label: "Knut Liestøl",
    subLabel: "1953-",
    start: 1953,
    end: 2024,
    kind: "person",
    relationHref: "/relasjon/person/knut-liestol",
    collectorNote: "Lang moderne person-/signaturkontekst.",
    historyNote: "Overlapper Olav V og Harald V.",
    financeNote: "Kan settes mot moderne markeds- og inflasjonsdata.",
  },
  {
    id: "object-banknote-5th",
    lane: "object",
    label: "Norske sedler / 5. utgave",
    subLabel: "1966-1983",
    start: 1966,
    end: 1983,
    kind: "object",
    relationHref: "/relasjon/utgave/5-utgave",
    collectorNote: "Eksempel på objektperiode som bør kunne sammenlignes med konge, person og finans.",
    historyNote: "Ligger under Olav V og moderne etterkrigstid.",
    financeNote: "Kan kobles mot inflasjon/oljeøkonomi og markedstall.",
  },
];

const LANE_LABELS: Record<LaneKey, string> = {
  ruler: "Konge / regent",
  national: "Nasjonal periode",
  war: "Krig / konflikt",
  finance: "Finans / økonomi",
  person: "Signatur / person",
  object: "Objekt / utgiver",
};

const LANE_ORDER: LaneKey[] = ["ruler", "national", "war", "finance", "person", "object"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function makeTicks(startYear: number, endYear: number) {
  const first = Math.ceil(startYear / 10) * 10;
  const ticks: number[] = [];
  for (let year = first; year <= endYear; year += 10) ticks.push(year);
  return ticks;
}

function percentForYear(year: number, startYear: number, endYear: number) {
  return ((year - startYear) / (endYear - startYear)) * 100;
}

function getAxis(id: string) {
  return COMPARE_AXES.find((axis) => axis.id === id) || COMPARE_AXES[0];
}

function getVisibleLanes(axis1: string, axis2: string, axis3: string): LaneKey[] {
  const set = new Set<LaneKey>();
  [getAxis(axis1), getAxis(axis2), getAxis(axis3)].forEach((axis) => axis.laneKeys.forEach((lane) => set.add(lane)));
  return LANE_ORDER.filter((lane) => set.has(lane));
}

function getLaneItems(items: TimelineItem[], lanes: LaneKey[], startYear: number, endYear: number) {
  return items.filter((item) => lanes.includes(item.lane) && item.start <= endYear && item.end >= startYear);
}

function selectedText(item: TimelineItem | null, segment: SegmentKey) {
  if (!item) return "Trykk på en tidslinjeboks for å vise valgt node med bio, nøkkellinje og referanse.";
  if (segment === "samler") return item.collectorNote;
  if (segment === "historie") return item.historyNote;
  return item.financeNote;
}

export default function CollectiumPeriodFilterTest() {
  const [country, setCountry] = useState("Norge");
  const [objectType, setObjectType] = useState("Verdibrev");
  const [startYear, setStartYear] = useState(1810);
  const [endYear, setEndYear] = useState(2024);
  const [axis1, setAxis1] = useState("ruler_issuer");
  const [axis2, setAxis2] = useState("war_conflict");
  const [axis3, setAxis3] = useState("finance_economy");
  const [segment, setSegment] = useState<SegmentKey>("historie");
  const [mode, setMode] = useState<TimelineMode>("timeline");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const visibleLanes = useMemo(() => getVisibleLanes(axis1, axis2, axis3), [axis1, axis2, axis3]);
  const visibleItems = useMemo(() => getLaneItems(DEFAULT_ITEMS, visibleLanes, startYear, endYear), [visibleLanes, startYear, endYear]);
  const ticks = useMemo(() => makeTicks(startYear, endYear), [startYear, endYear]);
  const selectedItem = visibleItems.find((item) => item.id === selectedItemId) || null;

  const decadeBands = useMemo(() => {
    const bands: Array<{ year: number; left: number; width: number; odd: boolean }> = [];
    const first = Math.floor(startYear / 10) * 10;
    for (let year = first; year <= endYear; year += 10) {
      const bandStart = clamp(year, startYear, endYear);
      const bandEnd = clamp(year + 10, startYear, endYear);
      if (bandEnd <= bandStart) continue;
      bands.push({
        year,
        left: percentForYear(bandStart, startYear, endYear),
        width: percentForYear(bandEnd, startYear, endYear) - percentForYear(bandStart, startYear, endYear),
        odd: Math.floor(year / 10) % 2 === 0,
      });
    }
    return bands;
  }, [startYear, endYear]);

  const compareSummary = `${getAxis(axis1).label} sammenlignes med ${getAxis(axis2).label} og ${getAxis(axis3).label}`;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Periodefilter · Masterfilter · UI/UX 8.6</p>
          <h1>Periodefilter · sammenligning</h1>
          <p>
            Denne testen viser perioder som parallelle lag på samme tidsakse. Målet er å sammenligne hva som skjer samtidig: konge/regent, nasjonal periode, krig/konflikt, finans/økonomi, signatur/person og objekt-/utgiverperiode.
          </p>
        </div>
        <aside className={styles.statusBox}>
          <span>v20</span>
          <small>Tre rader er sammenligningsakser, ikke trestruktur</small>
        </aside>
      </section>

      <section className={styles.masterPanel}>
        <div className={styles.masterHeader}>
          <span>Masterfilter</span>
          <strong>{compareSummary}</strong>
        </div>
        <div className={styles.masterGrid}>
          <label>
            Land
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option>Norge</option>
              <option>Skandinavia</option>
              <option>Europa</option>
            </select>
          </label>
          <label>
            Type objekt
            <select value={objectType} onChange={(event) => setObjectType(event.target.value)}>
              <option>Verdibrev</option>
              <option>Norske sedler</option>
              <option>Norske mynter</option>
              <option>Alle objekttyper</option>
            </select>
          </label>
          <label>
            År fra
            <input type="number" value={startYear} onChange={(event) => setStartYear(Number(event.target.value))} />
          </label>
          <label>
            År til
            <input type="number" value={endYear} onChange={(event) => setEndYear(Number(event.target.value))} />
          </label>
          <label>
            Visning
            <select value={mode} onChange={(event) => setMode(event.target.value as TimelineMode)}>
              <option value="timeline">Tidslinje</option>
              <option value="table">Tabell</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.axisGrid}>
        <AxisSelect title="Rad 1 · hovedanker" value={axis1} onChange={setAxis1} />
        <AxisSelect title="Rad 2 · sammenlign med" value={axis2} onChange={setAxis2} />
        <AxisSelect title="Rad 3 · sammenlign med" value={axis3} onChange={setAxis3} />
      </section>

      <section className={styles.segmentPanel}>
        <button type="button" data-active={segment === "samler"} onClick={() => setSegment("samler")}>Samler</button>
        <button type="button" data-active={segment === "historie"} onClick={() => setSegment("historie")}>Historie</button>
        <button type="button" data-active={segment === "finans"} onClick={() => setSegment("finans")}>Finans</button>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.panelTitle}>
          <div>
            <p className={styles.eyebrow}>Sammenlignende periodetidslinje</p>
            <h2>Hva skjedde samtidig?</h2>
          </div>
          <strong>{country} · {objectType} · {startYear}-{endYear}</strong>
        </div>

        {mode === "timeline" ? (
          <div className={styles.timelineShell}>
            <div className={styles.timelineHeader}>
              <div className={styles.laneHeader}>Lag</div>
              <div className={styles.scale}>
                {decadeBands.map((band) => (
                  <span
                    key={band.year}
                    className={band.odd ? styles.decadeBandA : styles.decadeBandB}
                    style={{ left: `${band.left}%`, width: `${band.width}%` }}
                  />
                ))}
                {ticks.map((tick) => (
                  <span key={tick} className={styles.tick} style={{ left: `${percentForYear(tick, startYear, endYear)}%` }}>
                    <i />
                    <b>{tick}</b>
                  </span>
                ))}
              </div>
            </div>

            {visibleLanes.map((lane) => (
              <div className={styles.timelineRow} key={lane}>
                <div className={styles.laneName}>{LANE_LABELS[lane]}</div>
                <div className={styles.laneTrack}>
                  {decadeBands.map((band) => (
                    <span
                      key={`${lane}-${band.year}`}
                      className={band.odd ? styles.decadeBandA : styles.decadeBandB}
                      style={{ left: `${band.left}%`, width: `${band.width}%` }}
                    />
                  ))}
                  {ticks.map((tick) => (
                    <span key={`${lane}-${tick}`} className={styles.verticalTick} style={{ left: `${percentForYear(tick, startYear, endYear)}%` }} />
                  ))}
                  {visibleItems.filter((item) => item.lane === lane).map((item) => {
                    const left = clamp(percentForYear(item.start, startYear, endYear), 0, 100);
                    const right = clamp(percentForYear(item.end, startYear, endYear), 0, 100);
                    const width = Math.max(1.5, right - left);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={styles.timelineItem}
                        data-kind={item.kind}
                        data-active={selectedItemId === item.id}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <span>{item.label}</span>
                        <small>{item.subLabel}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Lag</th>
                  <th>Navn</th>
                  <th>Periode</th>
                  <th>Samler</th>
                  <th>Historie</th>
                  <th>Finans</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedItemId(item.id)}>
                    <td>{LANE_LABELS[item.lane]}</td>
                    <td>{item.label}</td>
                    <td>{item.subLabel}</td>
                    <td>{item.collectorNote}</td>
                    <td>{item.historyNote}</td>
                    <td>{item.financeNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.detailGrid}>
        <article className={styles.infoPanel}>
          <div className={styles.panelTitle}>
            <div>
              <p className={styles.eyebrow}>Dynamisk område 1</p>
              <h2>{segment === "samler" ? "Samlerforklaring" : segment === "historie" ? "Historisk sammenheng" : "Finansiell sammenheng"}</h2>
            </div>
            <span>{segment}</span>
          </div>
          <div className={styles.factGrid}>
            <InfoCell title="Sammenligning" value={compareSummary} />
            <InfoCell title="Hovedregel" value="Radene skal ikke låse hverandre som trestruktur. De legger ulike periodetyper oppå samme tidsakse." />
            <InfoCell title="Overlapp" value="Konge kan være utgiver/regent samtidig som krig, finanskrise, signatur og objektperiode skjer." />
            <InfoCell title="DB-mål" value="Senere bør dette komme fra en resolved timeline-view med relation_type, start_year, end_year, lane og relation_href." />
          </div>
        </article>

        <article className={styles.infoPanel}>
          <div className={styles.panelTitle}>
            <div>
              <p className={styles.eyebrow}>Dynamisk område 2</p>
              <h2>Valgt tidslinjeinnhold</h2>
            </div>
            <span>{selectedItem ? LANE_LABELS[selectedItem.lane] : "Ingen valgt"}</span>
          </div>
          <div className={styles.selectedBox}>
            <div className={styles.logoMark}>C</div>
            <div>
              <h3>{selectedItem?.label || "Velg en boks i tidslinjen"}</h3>
              <p>{selectedItem ? `${selectedItem.subLabel} · ${LANE_LABELS[selectedItem.lane]}` : "Klikk på konge, krig, finans, person eller objektperiode for å se hva den betyr i valgt segment."}</p>
              <strong>{selectedText(selectedItem, segment)}</strong>
              {selectedItem?.relationHref ? <a href={selectedItem.relationHref}>Åpne relasjon: {selectedItem.relationHref}</a> : null}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

function AxisSelect(props: { title: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={styles.axisBox}>
      <span>{props.title}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {COMPARE_AXES.map((axis) => (
          <option key={axis.id} value={axis.id}>{axis.label}</option>
        ))}
      </select>
      <small>{getAxis(props.value).description}</small>
    </label>
  );
}

function InfoCell(props: { title: string; value: string }) {
  return (
    <div className={styles.infoCell}>
      <span>{props.title}</span>
      <strong>{props.value}</strong>
    </div>
  );
}
