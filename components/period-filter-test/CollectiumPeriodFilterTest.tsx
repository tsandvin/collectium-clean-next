"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter test UI/UX 8.6 - stÃ¥ende masterfilter + Rad 1-4
 *
 * Definering / formÃ¥l:
 * Testside for periodefilter der Masterfilter og Rad 1-4 vises som kompakte
 * rullegardin-lister. Rad 1-3 fÃ¸lger tidligere periodemodell, mens Rad 4
 * viser alle perioder / konkrete periodeverdier fra API.
 *
 * BruksomrÃ¥de:
 * Brukes av /test/periodefilter.
 *
 * BerÃ¸rte API-ruter:
 * - GET /api/filter/period/options
 *
 * Retning:
 * Neon -> API -> React testvisning.
 */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import styles from "./CollectiumPeriodFilterTest.module.css";

type SegmentKey = "samler" | "historie" | "finans";

type PeriodOption = {
  period_slug: string;
  display_name_no: string | null;
  period_type_key: string | null;
  period_type_label_no: string | null;
  period_level: number | null;
  parent_period_slug: string | null;
  start_year: number | null;
  end_year: number | null;
  summary_short_no: string | null;
  collectium_relevance_no: string | null;
  relation_href: string | null;
};

type RelationNode = {
  relation_type: string;
  relation_label_no: string | null;
  relation_slug: string;
  relation_href: string | null;
  relation_count: number;
};

type RelationSummary = {
  relation_type: string;
  relation_count: number;
};

type PeriodApiResponse = {
  ok: boolean;
  message?: string;
  rows: PeriodOption[];
  relationNodes?: RelationNode[];
  relationSummary?: RelationSummary[];
  updatedAt?: string;
};

type SelectItem = {
  key: string;
  label: string;
  group: string;
  description: string;
  startYear?: number | null;
  endYear?: number | null;
  rangeType?: "period" | "century" | "decade" | "era" | "relation" | "other";
};

type TimelineItem = {
  id: string;
  lane: string;
  label: string;
  start: number;
  end: number;
  tone: "blue" | "gold" | "green" | "red" | "purple" | "steel";
  note: string;
};

const MASTER_FILTERS: SelectItem[] = [
  { key: "filter_master", label: "Filter Master", group: "Master", description: "Alle hovedfiltre styres herfra." },
  { key: "catalog", label: "Katalog", group: "Master", description: "Objekter, kilde, produsent, utgave, valÃ¸r og variant." },
  { key: "period", label: "Periode", group: "Master", description: "Historiske perioder, regent, krig, finans og hendelser." },
  { key: "relation", label: "Relasjon", group: "Master", description: "Konge, person, motiv, funn, produsent, utgave og objektkoblinger." },
  { key: "collection", label: "Samling", group: "Master", description: "Min samling, Ã¸nskeliste, favoritt og brukerstatus." },
  { key: "market", label: "Marked / finans", group: "Master", description: "Verdi, trend, prisobservasjoner, auksjon og nettbutikk." },
];

const COUNTRIES: SelectItem[] = [
  { key: "no", label: "Norge", group: "Land", description: "Norske objekter og norske relasjoner." },
  { key: "sn", label: "Skandinavia", group: "Region", description: "Skandinaviske relasjoner, konger/personer/motiv." },
  { key: "eu", label: "Europa", group: "Region", description: "Europeisk kontekst." },
  { key: "gl", label: "Global", group: "Region", description: "Global historisk og finansiell kontekst." },
];

const OBJECT_TYPES: SelectItem[] = [
  { key: "banknote", label: "Seddel", group: "Objekt", description: "Sedler / banknote." },
  { key: "coin", label: "Mynt", group: "Objekt", description: "Mynter." },
  { key: "security", label: "Verdibrev", group: "Objekt", description: "Aksjebrev, obligasjoner og verdipapirer." },
  { key: "document", label: "Dokument", group: "Objekt", description: "Historiske dokumenter." },
  { key: "medal", label: "Medalje", group: "Objekt", description: "Medaljer og hederstegn." },
];

const ROW1_MAIN_PERIODS: SelectItem[] = [
  { key: "national_period", label: "Nasjonal / overordnet hovedperiode", group: "Rad 1", description: "Overordnet historisk/nasjonal hovedperiode." },
  { key: "regent_period", label: "Konge / regentperiode", group: "Rad 1", description: "Regent som tidsramme, ikke bare undernode." },
  { key: "financial_period", label: "Finans / pengehistorisk hovedperiode", group: "Rad 1", description: "Ã˜konomisk og pengepolitisk hovedperiode." },
  { key: "collector_period", label: "Samler-/katalogperiode", group: "Rad 1", description: "Periode styrt av objekt, katalog, utgave eller samlermarked." },
];

const ROW2_CONTEXTS: SelectItem[] = [
  { key: "historical_main", label: "Historisk hovedperiode", group: "Rad 2", description: "Hovedperiode innenfor valgt Rad 1." },
  { key: "union", label: "Union / statlig periode", group: "Rad 2", description: "Union, selvstendighet, statsform." },
  { key: "war", label: "Krig / konflikt", group: "Rad 2", description: "Krig, okkupasjon eller politisk konflikt." },
  { key: "economy", label: "Ã˜konomisk periode", group: "Rad 2", description: "Inflasjon, krise, valuta, pengepolitikk." },
  { key: "disease_crisis", label: "Sykdom / krise", group: "Rad 2", description: "Krise, sykdom, samfunnsendring." },
  { key: "money_history", label: "Pengehistorie", group: "Rad 2", description: "Seddelreform, valuta, betalingssystem og pengehistorie." },
];

const ROW3_RELATIONS: SelectItem[] = [
  { key: "regent", label: "Konge / regent", group: "Historie", description: "Regent/person som historisk relasjon." },
  { key: "person", label: "Signatur / person", group: "Relasjon", description: "Signatur, person eller rolle." },
  { key: "producer", label: "Produsent / trykkeri", group: "Objekt", description: "Trykkeri, myntverk, produsent eller utsteder." },
  { key: "issuer", label: "Utgiver / autoritet", group: "Objekt", description: "Norges Bank, stat, konge, institusjon." },
  { key: "edition", label: "Utgave / serie", group: "Objekt", description: "Utgave, serie, emisjon, katalogutgave." },
  { key: "denomination_issue", label: "ValÃ¸rutgave / serie", group: "Objekt", description: "ValÃ¸r + utgave/serie." },
  { key: "variant", label: "Variant / type", group: "Objekt", description: "Variant, type, litra, detaljavvik." },
  { key: "signature", label: "Signaturgruppe", group: "Objekt", description: "Signaturkombinasjon." },
  { key: "motif", label: "Motiv / symbol", group: "Objekt", description: "Motiv, portrett, riksvÃ¥pen, symbol." },
  { key: "material", label: "Materiale", group: "Objekt", description: "Papir, metall, legering, sikkerhetspapir." },
  { key: "provenance", label: "Funn / proveniens", group: "Historie", description: "Funn, eierhistorikk, proveniensperiode." },
  { key: "market", label: "Marked / verdi", group: "Finans", description: "Verdi, trend, prisobservasjoner." },
];

const STATIC_TIMELINE: TimelineItem[] = [
  { id: "karl-johan", lane: "Konge/regent", label: "Karl XIV Johan", start: 1814, end: 1844, tone: "gold", note: "Tidlig unionstid." },
  { id: "oscar-i", lane: "Konge/regent", label: "Oscar I", start: 1844, end: 1859, tone: "gold", note: "Svensk-norsk union." },
  { id: "oscar-ii", lane: "Konge/regent", label: "Oscar II", start: 1872, end: 1905, tone: "gold", note: "Siste unionskonge." },
  { id: "haakon-vii", lane: "Konge/regent", label: "Haakon VII", start: 1905, end: 1957, tone: "gold", note: "Selvstendig Norge, krig og etterkrigstid." },
  { id: "olav-v", lane: "Konge/regent", label: "Olav V", start: 1957, end: 1991, tone: "blue", note: "Etterkrigstid og oljeperiode." },
  { id: "harald-v", lane: "Konge/regent", label: "Harald V", start: 1991, end: 2024, tone: "purple", note: "Moderne periode." },

  { id: "union", lane: "Nasjonal periode", label: "Union med Sverige", start: 1814, end: 1905, tone: "gold", note: "Norge i union med Sverige." },
  { id: "selvstendig", lane: "Nasjonal periode", label: "Selvstendig Norge", start: 1905, end: 1940, tone: "blue", note: "Selvstendig stat fÃ¸r krig." },
  { id: "etterkrig", lane: "Nasjonal periode", label: "Etterkrigstiden", start: 1945, end: 1990, tone: "blue", note: "Gjenoppbygging og moderne Ã¸konomi." },

  { id: "ww1", lane: "Krig/konflikt", label: "1. verdenskrig", start: 1914, end: 1918, tone: "red", note: "Internasjonal krig og Ã¸konomisk uro." },
  { id: "ww2", lane: "Krig/konflikt", label: "2. verdenskrig / okkupasjon", start: 1940, end: 1945, tone: "red", note: "Direkte relevant for seddel-, valuta- og krigshistorie." },

  { id: "krigsokonomi", lane: "Finans/Ã¸konomi", label: "KrigsÃ¸konomi", start: 1940, end: 1945, tone: "steel", note: "Regulering, knapphet og pengepolitisk press." },
  { id: "oljeinflasjon", lane: "Finans/Ã¸konomi", label: "Olje / inflasjon", start: 1970, end: 1990, tone: "green", note: "OljeÃ¸konomi, inflasjon og endret kjÃ¸pekraft." },
  { id: "finanskrise", lane: "Finans/Ã¸konomi", label: "Finanskrise", start: 2008, end: 2011, tone: "green", note: "Marked og likviditet." },

  { id: "hambro", lane: "Signatur/person", label: "C. J. Hambro", start: 1924, end: 1945, tone: "purple", note: "Person/signatur overlapper krigsperioden." },
  { id: "liestoel", lane: "Signatur/person", label: "Knut LiestÃ¸l", start: 1953, end: 1985, tone: "purple", note: "Etterkrigstid og seddelkontekst." },

  { id: "norges-bank", lane: "Produsent/utgiver/objekt", label: "Norges Bank", start: 1816, end: 2024, tone: "steel", note: "Utgiverrelasjon for norske sedler." },
  { id: "femte-utgave", lane: "Produsent/utgiver/objekt", label: "5. utgave sedler", start: 1966, end: 1983, tone: "steel", note: "Eksempel pÃ¥ utgaveperiode." },
];

function labelFromKey(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function yearText(start?: number | null, end?: number | null): string {
  if (start == null && end == null) return "Tidsrom mangler";
  if (start != null && end != null) return `${start}â€“${end}`;
  if (start != null) return `${start}â€“`;
  return `â€“${end}`;
}

function decadeYears(fromYear: number, toYear: number): number[] {
  const first = Math.ceil(fromYear / 10) * 10;
  const years: number[] = [];
  for (let year = first; year <= toYear; year += 10) years.push(year);
  return years;
}

function itemStyle(item: TimelineItem, fromYear: number, toYear: number): CSSProperties {
  const span = Math.max(1, toYear - fromYear);
  const start = Math.max(fromYear, item.start);
  const end = Math.min(toYear, item.end);
  const left = ((start - fromYear) / span) * 100;
  const width = Math.max(1.4, ((end - start) / span) * 100);
  return { left: `${left}%`, width: `${width}%` };
}

function periodRowsToItems(rows: PeriodOption[]): SelectItem[] {
  return rows
    .filter((row) => row.period_slug)
    .sort((a, b) => {
      const ay = a.start_year ?? 999999;
      const by = b.start_year ?? 999999;
      return ay - by || String(a.display_name_no || a.period_slug).localeCompare(String(b.display_name_no || b.period_slug), "nb");
    })
    .map((row) => ({
      key: row.period_slug,
      label: row.display_name_no || labelFromKey(row.period_slug),
      group: row.period_type_label_no || row.period_type_key || "Periode",
      description: row.collectium_relevance_no || row.summary_short_no || "Periode fra API.",
      startYear: row.start_year,
      endYear: row.end_year,
    }));
}

function relationRowsToItems(nodes: RelationNode[], wanted: string): SelectItem[] {
  return nodes
    .filter((node) => node.relation_type === wanted)
    .slice(0, 120)
    .map((node) => ({
      key: `${node.relation_type}:${node.relation_slug}`,
      label: node.relation_label_no || labelFromKey(node.relation_slug),
      group: node.relation_type,
      description: `${node.relation_count.toLocaleString("nb-NO")} objektkoblinger`,
      startYear: null,
      endYear: null,
    }));
}


function yearsOverlap(
  itemStart: number | null | undefined,
  itemEnd: number | null | undefined,
  fromYear: number,
  toYear: number,
): boolean {
  if (itemStart == null && itemEnd == null) return false;
  const start = itemStart ?? itemEnd ?? fromYear;
  const end = itemEnd ?? itemStart ?? toYear;
  return start <= toYear && end >= fromYear;
}

function centuryLabel(year: number): string {
  if (year < 0) {
    const century = Math.ceil(Math.abs(year) / 100);
    return `${century}. århundre f.Kr.`;
  }

  const centuryStart = Math.floor(year / 100) * 100;
  return `${centuryStart}-tallet`;
}

function decadeLabel(year: number): string {
  const start = Math.floor(year / 10) * 10;
  const end = start + 9;
  if (end < 0) return `${Math.abs(end)}–${Math.abs(start)} f.Kr.`;
  if (start < 0 && end >= 0) return `${Math.abs(start)} f.Kr.–${end} e.Kr.`;
  return `${start}–${end}`;
}

function makeRangeSuggestions(fromYear: number, toYear: number): SelectItem[] {
  const items: SelectItem[] = [];

  if (fromYear < 0) {
    items.push({
      key: "era:bc",
      label: "f.Kr.",
      group: "Tidsregning",
      description: "Perioder før år 0.",
      startYear: fromYear,
      endYear: Math.min(toYear, -1),
      rangeType: "era",
    });
  }

  if (toYear >= 0) {
    items.push({
      key: "era:ad",
      label: "e.Kr.",
      group: "Tidsregning",
      description: "Perioder etter år 0.",
      startYear: Math.max(fromYear, 0),
      endYear: toYear,
      rangeType: "era",
    });
  }

  const firstCentury = Math.floor(fromYear / 100) * 100;
  const lastCentury = Math.floor(toYear / 100) * 100;

  for (let year = firstCentury; year <= lastCentury; year += 100) {
    const start = year;
    const end = year + 99;

    if (end < fromYear || start > toYear) continue;

    items.push({
      key: `century:${start}`,
      label: centuryLabel(start),
      group: "Århundre innenfor valgt periode",
      description: `${Math.max(start, fromYear)}–${Math.min(end, toYear)}`,
      startYear: Math.max(start, fromYear),
      endYear: Math.min(end, toYear),
      rangeType: "century",
    });
  }

  const firstDecade = Math.floor(fromYear / 10) * 10;
  const lastDecade = Math.floor(toYear / 10) * 10;

  for (let year = firstDecade; year <= lastDecade; year += 10) {
    const start = year;
    const end = year + 9;

    if (end < fromYear || start > toYear) continue;

    items.push({
      key: `decade:${start}`,
      label: decadeLabel(start),
      group: "Tiår innenfor valgt periode",
      description: `${Math.max(start, fromYear)}–${Math.min(end, toYear)}`,
      startYear: Math.max(start, fromYear),
      endYear: Math.min(end, toYear),
      rangeType: "decade",
    });
  }

  return items;
}

function periodRowsToGroupedRad4Items(
  rows: PeriodOption[],
  fromYear: number,
  toYear: number,
): SelectItem[] {
  const current: SelectItem[] = [];
  const other: SelectItem[] = [];

  for (const row of rows) {
    if (!row.period_slug) continue;

    const item: SelectItem = {
      key: row.period_slug,
      label: row.display_name_no || labelFromKey(row.period_slug),
      group: yearsOverlap(row.start_year, row.end_year, fromYear, toYear)
        ? "Gjeldende periode"
        : "Andre perioder",
      description: row.collectium_relevance_no || row.summary_short_no || "Periode fra API.",
      startYear: row.start_year,
      endYear: row.end_year,
      rangeType: yearsOverlap(row.start_year, row.end_year, fromYear, toYear) ? "period" : "other",
    };

    if (item.group === "Gjeldende periode") current.push(item);
    else other.push(item);
  }

  current.sort((a, b) => {
    const ay = a.startYear ?? 999999;
    const by = b.startYear ?? 999999;
    return ay - by || a.label.localeCompare(b.label, "nb");
  });

  other.sort((a, b) => {
    const ay = a.startYear ?? 999999;
    const by = b.startYear ?? 999999;
    return ay - by || a.label.localeCompare(b.label, "nb");
  });

  return [...current, ...makeRangeSuggestions(fromYear, toYear), ...other.slice(0, 80)];
}

function relationTypesForRad4(row3: string): string[] {
  if (row3 === "regent") return ["regent"];
  if (row3 === "person" || row3 === "signature") return ["person"];
  if (row3 === "edition") return ["utgave"];
  if (row3 === "variant") return ["variant"];
  if (row3 === "denomination_issue") return ["valor"];
  if (row3 === "issuer" || row3 === "producer") return ["kilde"];
  return [];
}

function relationRowsToGroupedRad4Items(nodes: RelationNode[], row3: string): SelectItem[] {
  const wanted = relationTypesForRad4(row3);

  if (!wanted.length) return [];

  return nodes
    .filter((node) => wanted.includes(node.relation_type))
    .slice(0, 120)
    .map((node) => ({
      key: `${node.relation_type}:${node.relation_slug}`,
      label: node.relation_label_no || labelFromKey(node.relation_slug),
      group: "Relevante relasjoner",
      description: `${node.relation_count.toLocaleString("nb-NO")} objektkoblinger`,
      startYear: null,
      endYear: null,
      rangeType: "relation" as const,
    }));
}

function groupSelectItems(items: SelectItem[]): Array<[string, SelectItem[]]> {
  const groups: Record<string, SelectItem[]> = {};

  for (const item of items) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  const order = [
    "Gjeldende periode",
    "Tidsregning",
    "Århundre innenfor valgt periode",
    "Tiår innenfor valgt periode",
    "Relevante relasjoner",
    "Andre perioder",
  ];

  return Object.entries(groups).sort(([a], [b]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);

    if (ai === -1 && bi === -1) return a.localeCompare(b, "nb");
    if (ai === -1) return 1;
    if (bi === -1) return -1;

    return ai - bi;
  });
}

export default function CollectiumPeriodFilterTest() {
  const [data, setData] = useState<PeriodApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [master, setMaster] = useState("period");
  const [country, setCountry] = useState("no");
  const [objectType, setObjectType] = useState("banknote");

  const [row1, setRow1] = useState("national_period");
  const [row2, setRow2] = useState("historical_main");
  const [row3, setRow3] = useState("regent");
  const [row4, setRow4] = useState("");

  const [fromYear, setFromYear] = useState(1814);
  const [toYear, setToYear] = useState(2024);
  const [zoom, setZoom] = useState(1);
  const [timelineOnly, setTimelineOnly] = useState(false);
  const [segment, setSegment] = useState<SegmentKey>("historie");
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(STATIC_TIMELINE.find((item) => item.id === "ww2") || null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/filter/period/options", { cache: "no-store" });
        const json = (await response.json()) as PeriodApiResponse;

        if (!mounted) return;

        if (!response.ok || !json.ok) {
          setData(json);
          setError(json.message || "Periodefilter-API svarte med feil.");
          return;
        }

        setData(json);
        setError(null);

        const firstPeriod = json.rows?.find((period) => period.period_slug);
        if (firstPeriod) setRow4(firstPeriod.period_slug);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Ukjent feil ved lasting av periodefilter.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const periodItems = useMemo(() => periodRowsToItems(data?.rows || []), [data?.rows]);
  const relationNodes = data?.relationNodes || [];

  const row4Items = useMemo(() => {
    const periodSuggestions = periodRowsToGroupedRad4Items(data?.rows || [], fromYear, toYear);
    const relationSuggestions = relationRowsToGroupedRad4Items(data?.relationNodes || [], row3);

    const combined = [...periodSuggestions, ...relationSuggestions];

    const seen = new Set<string>();
    return combined.filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  }, [data?.rows, data?.relationNodes, fromYear, toYear, row3]);

  const selectedMaster = MASTER_FILTERS.find((item) => item.key === master);
  const selectedCountry = COUNTRIES.find((item) => item.key === country);
  const selectedObjectType = OBJECT_TYPES.find((item) => item.key === objectType);
  const selectedRow1 = ROW1_MAIN_PERIODS.find((item) => item.key === row1);
  const selectedRow2 = ROW2_CONTEXTS.find((item) => item.key === row2);
  const selectedRow3 = ROW3_RELATIONS.find((item) => item.key === row3);
  const selectedRow4 = row4Items.find((item) => item.key === row4);

  const decades = decadeYears(fromYear, toYear);
  const visibleTimelineItems = STATIC_TIMELINE.filter((item) => item.end >= fromYear && item.start <= toYear);
  const lanes = Array.from(new Set(visibleTimelineItems.map((item) => item.lane)));

  function setSelectedPeriod(key: string) {
    setRow4(key);
    const item = row4Items.find((entry) => entry.key === key);
    if (item?.startYear != null) setFromYear(Math.max(0, item.startYear - 20));
    if (item?.endYear != null) setToYear(Math.min(2100, item.endYear + 20));
  }

  return (
    <main className={styles.page} data-timeline-only={timelineOnly ? "true" : "false"}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Periodefilter Â· Masterfilter Â· Rad 1-4</p>
          <h1>Periodefilter</h1>
          <p>
            Masterfilteret er nÃ¥ kompakt og stÃ¥ende. Rad 1-3 fÃ¸lger periodemodellen,
            mens Rad 4 viser alle perioder og konkrete verdier fra API.
          </p>
        </div>
        <aside className={styles.statusBox}>
          <strong>{loading ? "Henter" : error ? "Feil" : "OK"}</strong>
          <span>{data?.updatedAt ? new Date(data.updatedAt).toLocaleString("nb-NO") : "Ingen tidsstempel"}</span>
        </aside>
      </section>

      {error ? <section className={styles.errorBox}>{error}</section> : null}

      <section className={styles.layout}>
        <aside className={styles.filterColumn}>
          <div className={styles.filterColumnHeader}>
            <p className={styles.eyebrow}>StÃ¥ende filterfelt</p>
            <h2>Master + Rad 1-4</h2>
          </div>

          <SelectBox title="Masterfilter" value={master} onChange={setMaster} items={MASTER_FILTERS} />
          <SelectBox title="Land / omrÃ¥de" value={country} onChange={setCountry} items={COUNTRIES} />
          <SelectBox title="Objekttype" value={objectType} onChange={setObjectType} items={OBJECT_TYPES} />

          <div className={styles.filterDivider}>Periodefilter</div>

          <SelectBox title="Rad 1 Â· HovednivÃ¥" value={row1} onChange={setRow1} items={ROW1_MAIN_PERIODS} />
          <SelectBox title="Rad 2 Â· Hovedperiode / tema" value={row2} onChange={setRow2} items={ROW2_CONTEXTS} />
          <SelectBox title="Rad 3 Â· Underperiode / relasjon" value={row3} onChange={setRow3} items={ROW3_RELATIONS} />
          <SelectBox title="Rad 4 Â· Alle perioder / verdi" value={row4} onChange={setSelectedPeriod} items={row4Items} />

          <div className={styles.selectedStack}>
            <strong>Valgt:</strong>
            <span>{selectedMaster?.label}</span>
            <span>{selectedCountry?.label}</span>
            <span>{selectedObjectType?.label}</span>
            <span>{selectedRow1?.label}</span>
            <span>{selectedRow2?.label}</span>
            <span>{selectedRow3?.label}</span>
            <span>{selectedRow4?.label || "Ingen Rad 4 valgt"}</span>
          </div>
        </aside>

        <section className={styles.mainColumn}>
          <section className={styles.timelineShell}>
            <div className={styles.timelineHeader}>
              <div>
                <p className={styles.eyebrow}>Sammenlignende tidslinje</p>
                <h2>Konge Â· periode Â· krig Â· finans Â· signatur Â· objekt</h2>
              </div>
              <div className={styles.timelineTools}>
                <button type="button" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.2).toFixed(1))))}>âˆ’</button>
                <button type="button" onClick={() => setZoom((value) => Math.min(2.4, Number((value + 0.2).toFixed(1))))}>+</button>
                <button type="button" data-active={timelineOnly} onClick={() => setTimelineOnly((value) => !value)}>
                  {timelineOnly ? "Lukk tidslinje" : "Kun tidslinje"}
                </button>
              </div>
            </div>

            <div className={styles.yearInputs}>
              <label>
                Ã…r fra
                <input type="number" value={fromYear} onChange={(event) => setFromYear(Number(event.target.value) || 1814)} />
              </label>
              <label>
                Ã…r til
                <input type="number" value={toYear} onChange={(event) => setToYear(Number(event.target.value) || 2024)} />
              </label>
              <span>Zoom {zoom.toFixed(1)}x</span>
            </div>

            <div className={styles.timelineViewport}>
              <div className={styles.timelineCanvas} style={{ minWidth: `${1100 * zoom}px` }}>
                <div className={styles.decadeBand}>
                  {decades.map((year, index) => (
                    <div
                      className={styles.decadeBlock}
                      data-even={index % 2 === 0 ? "true" : "false"}
                      key={year}
                      style={itemStyle({ id: String(year), lane: "decade", label: String(year), start: year, end: year + 10, tone: "steel", note: "" }, fromYear, toYear)}
                    >
                      <span>{year}</span>
                    </div>
                  ))}
                </div>

                {lanes.map((lane) => (
                  <div className={styles.timelineLane} key={lane}>
                    <div className={styles.laneLabel}>{lane}</div>
                    <div className={styles.laneTrack}>
                      {visibleTimelineItems
                        .filter((item) => item.lane === lane)
                        .map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            className={styles.timelineItem}
                            data-tone={item.tone}
                            data-active={selectedTimelineItem?.id === item.id}
                            style={itemStyle(item, fromYear, toYear)}
                            onClick={() => setSelectedTimelineItem(item)}
                          >
                            <strong>{item.label}</strong>
                            <span>{item.start}â€“{item.end}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}

                <div className={styles.axisLine}>
                  {decades.map((year) => (
                    <span key={year} style={{ left: `${((year - fromYear) / Math.max(1, toYear - fromYear)) * 100}%` }}>
                      {year}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {selectedTimelineItem ? (
              <div className={styles.timelineInfo}>
                <strong>{selectedTimelineItem.label}</strong>
                <span>{selectedTimelineItem.lane} Â· {selectedTimelineItem.start}â€“{selectedTimelineItem.end}</span>
                <p>{selectedTimelineItem.note}</p>
              </div>
            ) : null}
          </section>

          {!timelineOnly ? (
            <section className={styles.dynamicArea}>
              <div className={styles.segmentTabs}>
                <button type="button" data-active={segment === "samler"} onClick={() => setSegment("samler")}>Samler</button>
                <button type="button" data-active={segment === "historie"} onClick={() => setSegment("historie")}>Historie</button>
                <button type="button" data-active={segment === "finans"} onClick={() => setSegment("finans")}>Finans</button>
              </div>

              <div className={styles.dynamicGrid}>
                <article className={styles.infoPanel}>
                  <p className={styles.eyebrow}>Gjeldende dynamiske felt</p>
                  <h2>{segment === "samler" ? "Samler" : segment === "historie" ? "Historie" : "Finans"}</h2>
                  <Fact label="Rad 1" value={selectedRow1?.label || "Ikke valgt"} />
                  <Fact label="Rad 2" value={selectedRow2?.label || "Ikke valgt"} />
                  <Fact label="Rad 3" value={selectedRow3?.label || "Ikke valgt"} />
                  <Fact label="Rad 4" value={selectedRow4 ? `${selectedRow4.label} Â· ${yearText(selectedRow4.startYear, selectedRow4.endYear)}` : "Ikke valgt"} />
                </article>

                <article className={styles.infoPanel}>
                  <p className={styles.eyebrow}>Periode dynamiske felt</p>
                  <h2>Hva skal forklares</h2>
                  {segment === "samler" ? (
                    <>
                      <Fact label="Samleobjekt" value="Produsent, utgave, variant, signatur, motiv, materiale, kvalitet og sjeldenhet." />
                      <Fact label="Katalogbruk" value="Rad 4 styrer konkret periode/verdi som katalogen kan filtrere pÃ¥." />
                    </>
                  ) : null}
                  {segment === "historie" ? (
                    <>
                      <Fact label="Sammenligning" value="Konge, krig, finans, person og objektperiode vises parallelt pÃ¥ samme akse." />
                      <Fact label="Poeng" value="Perioder trenger ikke vÃ¦re foreldre/barn; de kan overlappe og forklare hverandre." />
                    </>
                  ) : null}
                  {segment === "finans" ? (
                    <>
                      <Fact label="Finans" value="Inflasjon, valuta, pengehistorie, marked, verdi og trend." />
                      <Fact label="Regel" value="0 kr skal ikke tolkes som reell markedsverdi." />
                    </>
                  ) : null}
                </article>
              </div>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function SelectBox(props: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  items: SelectItem[];
}) {
  const selected = props.items.find((item) => item.key === props.value);

  return (
    <label className={styles.selectBox}>
      <span>{props.title}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {groupSelectItems(props.items).map(([group, items]) => (
            <optgroup label={group} key={group}>
              {items.map((item) => (
                <option value={item.key} key={item.key}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
      </select>
      <small>{selected?.description || "Velg verdi."}</small>
    </label>
  );
}

function Fact(props: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}