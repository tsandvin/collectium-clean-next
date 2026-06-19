"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter UI/UX 8.6 - dynamisk Rad 1-4 + tidslinje
 *
 * Definering / formÃ¥l:
 * Testside for periodefilter der Rad 1 styrer Rad 2, Rad 2 styrer Rad 3,
 * Rad 3 styrer Rad 4, og tidslinjen bygges dynamisk etter valgene.
 *
 * BruksomrÃ¥de:
 * Brukes av /test/periodefilter.
 *
 * BerÃ¸rte API-ruter:
 * - GET /api/filter/period/options
 *
 * Dataretning:
 * Neon/API -> React -> UI
 */

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import styles from "./CollectiumPeriodFilterTest.module.css";
import { useCollectiumLayout } from "../layout/CollectiumLayoutModeProvider";
import { CollectiumWorkspaceLanes } from "../layout/CollectiumWorkspaceLanes";

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

type PeriodApiResponse = {
  ok: boolean;
  message?: string;
  rows: PeriodOption[];
  relationNodes?: RelationNode[];
  updatedAt?: string;
};

type SelectItem = {
  key: string;
  label: string;
  group: string;
  description: string;
  startYear?: number | null;
  endYear?: number | null;
};

type TimelineTone = "blue" | "gold" | "green" | "red" | "purple" | "steel";

type TimelineItem = {
  id: string;
  laneKey: "row1" | "row2" | "row3" | "row4" | "object";
  lane: string;
  label: string;
  start: number;
  end: number;
  tone: TimelineTone;
  note: string;
};

const MASTER_FILTERS: SelectItem[] = [
  { key: "period", label: "Periode", group: "Master", description: "Historiske perioder, regent, krig, finans og hendelser." },
  { key: "catalog", label: "Katalog", group: "Master", description: "Objekter, kilde, produsent, utgave, valÃ¸r og variant." },
  { key: "relation", label: "Relasjon", group: "Master", description: "Konge, person, motiv, funn, produsent, utgave og objektkoblinger." },
  { key: "market", label: "Marked / finans", group: "Master", description: "Verdi, trend, prisobservasjoner, auksjon og nettbutikk." },
  { key: "collection", label: "Samling", group: "Master", description: "Min samling, Ã¸nskeliste, favoritt og brukerstatus." },
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

const ROW1: SelectItem[] = [
  { key: "national_period", label: "Nasjonal hovedperiode", group: "Rad 1", description: "Overordnet historisk/nasjonal periode." },
  { key: "regent_period", label: "Konge / regentperiode", group: "Rad 1", description: "Regent, konge, styreperiode og utgiverkontekst." },
  { key: "financial_period", label: "Finans / pengehistorie", group: "Rad 1", description: "Ã˜konomi, valuta, inflasjon, marked og pengehistorie." },
  { key: "collector_period", label: "Samler / katalogperiode", group: "Rad 1", description: "Objekt, kilde, utgave, variant og samlerkontekst." },
];

const ROW2_BY_ROW1: Record<string, SelectItem[]> = {
  national_period: [
    { key: "historical_main", label: "Historisk hovedperiode", group: "Rad 2", description: "Hovedperiode innenfor valgt nasjonal tidsramme." },
    { key: "union", label: "Union / statsperiode", group: "Rad 2", description: "Union, selvstendighet eller statlig overgang." },
    { key: "war", label: "Krig / konflikt", group: "Rad 2", description: "Krig, okkupasjon eller politisk konflikt." },
    { key: "crisis", label: "Krise / samfunnsendring", group: "Rad 2", description: "Sykdom, krise eller stor samfunnsendring." },
  ],
  regent_period: [
    { key: "regent_rule", label: "Regent / konge", group: "Rad 2", description: "Hvem styrte i perioden?" },
    { key: "dynasty", label: "Dynasti / maktstruktur", group: "Rad 2", description: "Dynasti, kongehus, union og maktstruktur." },
    { key: "issuer_authority", label: "Utgiver / autoritet", group: "Rad 2", description: "Hvem stod bak objektets autoritet eller utgiverrolle?" },
    { key: "regent_war", label: "Regent under krig", group: "Rad 2", description: "Regentperioder som overlapper konflikt." },
  ],
  financial_period: [
    { key: "economy", label: "Ã˜konomisk periode", group: "Rad 2", description: "Ã˜konomisk hovedperiode." },
    { key: "money_history", label: "Pengehistorie", group: "Rad 2", description: "Valuta, sedler, reformer og pengepolitikk." },
    { key: "market", label: "Marked / verdi", group: "Rad 2", description: "Marked, verdi, trend og prisobservasjoner." },
    { key: "index", label: "Index / sammenligning", group: "Rad 2", description: "Sammenligning mot finansielle indekser." },
  ],
  collector_period: [
    { key: "source", label: "Kilde / katalog", group: "Rad 2", description: "Katalogkilde og objekttype." },
    { key: "edition", label: "Utgave / serie", group: "Rad 2", description: "Utgave, serie og valÃ¸rutgave." },
    { key: "variant", label: "Variant / type", group: "Rad 2", description: "Variant, litra, signatur og motiv." },
    { key: "material", label: "Materiale / kvalitet", group: "Rad 2", description: "Papir, metall, kvalitet og sjeldenhet." },
  ],
};

const ROW3_BY_ROW2: Record<string, SelectItem[]> = {
  historical_main: [
    { key: "period", label: "Periode", group: "Rad 3", description: "Velg konkret historisk periode." },
    { key: "event", label: "Historisk hendelse", group: "Rad 3", description: "Hendelse knyttet til perioden." },
    { key: "year", label: "Ã…r / Ã¥rhundre", group: "Rad 3", description: "Ã…r, tiÃ¥r eller Ã¥rhundre." },
  ],
  union: [
    { key: "union_period", label: "Union / statsform", group: "Rad 3", description: "Union, selvstendighet eller statsform." },
    { key: "regent", label: "Konge / regent", group: "Rad 3", description: "Regent i valgt statsperiode." },
    { key: "country", label: "Land / omrÃ¥de", group: "Rad 3", description: "Land eller omrÃ¥de." },
  ],
  war: [
    { key: "war", label: "Krig / konflikt", group: "Rad 3", description: "Krig eller konflikt." },
    { key: "regent", label: "Regent under konflikt", group: "Rad 3", description: "Regent som overlapper konflikten." },
    { key: "finance", label: "KrigsÃ¸konomi", group: "Rad 3", description: "Finans og pengepolitikk under konflikt." },
  ],
  crisis: [
    { key: "crisis", label: "Krise", group: "Rad 3", description: "Sykdom, krise eller samfunnsendring." },
    { key: "finance", label: "KriseÃ¸konomi", group: "Rad 3", description: "Finansiell effekt av krise." },
  ],
  regent_rule: [
    { key: "regent", label: "Konge / regent", group: "Rad 3", description: "Regent/person som historisk relasjon." },
    { key: "period", label: "Styreperiode", group: "Rad 3", description: "Regentens styreperiode." },
    { key: "object", label: "Objekter i regentperioden", group: "Rad 3", description: "Objekter som faller innenfor regentens periode." },
  ],
  dynasty: [
    { key: "dynasty", label: "Dynasti / kongehus", group: "Rad 3", description: "Dynasti, kongehus eller maktstruktur." },
    { key: "regent", label: "Regenter i dynasti", group: "Rad 3", description: "Regenter knyttet til valgt dynasti." },
  ],
  issuer_authority: [
    { key: "issuer", label: "Utgiver / autoritet", group: "Rad 3", description: "Utgiver, autoritet, bank eller stat." },
    { key: "producer", label: "Produsent / trykkeri", group: "Rad 3", description: "Produsent, trykkeri eller myntverk." },
  ],
  regent_war: [
    { key: "regent", label: "Regent", group: "Rad 3", description: "Regent som overlapper krig." },
    { key: "war", label: "Krig", group: "Rad 3", description: "Krig som overlapper regent." },
  ],
  economy: [
    { key: "finance", label: "Finansperiode", group: "Rad 3", description: "Finansiell periode." },
    { key: "inflation", label: "Inflasjon / kjÃ¸pekraft", group: "Rad 3", description: "Inflasjon, lÃ¸nn og kjÃ¸pekraft." },
  ],
  money_history: [
    { key: "currency", label: "Valuta / pengehistorie", group: "Rad 3", description: "Valuta, seddelserie, pengepolitikk." },
    { key: "issuer", label: "Utgiver / bank", group: "Rad 3", description: "Norges Bank, stat eller utsteder." },
    { key: "edition", label: "Seddelutgave", group: "Rad 3", description: "Utgave eller serie." },
  ],
  market: [
    { key: "market", label: "Marked", group: "Rad 3", description: "Verdi, trend, auksjon og nettbutikk." },
    { key: "trend", label: "Trend", group: "Rad 3", description: "Trend og verdiutvikling." },
  ],
  index: [
    { key: "index", label: "Index", group: "Rad 3", description: "Index, sammenligning og utvikling." },
    { key: "finance", label: "Finansiell kontekst", group: "Rad 3", description: "Finansdata i valgt tidsrom." },
  ],
  source: [
    { key: "source_key", label: "Kilde", group: "Rad 3", description: "Katalogkilde." },
    { key: "object_group", label: "Objekttype", group: "Rad 3", description: "Seddel, mynt, verdibrev osv." },
    { key: "producer", label: "Produsent / utsteder", group: "Rad 3", description: "Produsent, trykkeri, bank eller utsteder." },
  ],
  edition: [
    { key: "edition", label: "Utgave / serie", group: "Rad 3", description: "Utgave eller serie." },
    { key: "denomination_issue", label: "ValÃ¸rutgave / serie", group: "Rad 3", description: "ValÃ¸r + utgave/serie." },
    { key: "year", label: "PubliseringsÃ¥r / objektÃ¥r", group: "Rad 3", description: "Ã…r som objektspesifikasjon." },
  ],
  variant: [
    { key: "variant", label: "Variant / type", group: "Rad 3", description: "Variant eller type." },
    { key: "signature", label: "Signatur / person", group: "Rad 3", description: "Signaturgruppe eller person." },
    { key: "motif", label: "Motiv / symbol", group: "Rad 3", description: "Motiv eller symbol." },
  ],
  material: [
    { key: "material", label: "Materiale", group: "Rad 3", description: "Papir, metall eller materiale." },
    { key: "grade", label: "Kvalitet", group: "Rad 3", description: "Kvalitet og tilstand." },
    { key: "rarity", label: "Sjeldenhet", group: "Rad 3", description: "Sjeldenhet og katalogvurdering." },
  ],
};

const BASE_TIMELINE: TimelineItem[] = [
  { id: "union", laneKey: "row1", lane: "Nasjonal hovedperiode", label: "Union med Sverige", start: 1814, end: 1905, tone: "blue", note: "Norge i union med Sverige." },
  { id: "selvstendig", laneKey: "row1", lane: "Nasjonal hovedperiode", label: "Selvstendig Norge", start: 1905, end: 1940, tone: "blue", note: "Selvstendig stat fÃ¸r krig." },
  { id: "etterkrig", laneKey: "row1", lane: "Nasjonal hovedperiode", label: "Etterkrigstiden", start: 1945, end: 1990, tone: "blue", note: "Gjenoppbygging og moderne Ã¸konomi." },

  { id: "oscar-ii", laneKey: "row2", lane: "Konge / regent", label: "Oscar II", start: 1872, end: 1905, tone: "gold", note: "Siste unionskonge." },
  { id: "haakon-vii", laneKey: "row2", lane: "Konge / regent", label: "Haakon VII", start: 1905, end: 1957, tone: "gold", note: "Selvstendig Norge, krig og etterkrigstid." },
  { id: "olav-v", laneKey: "row2", lane: "Konge / regent", label: "Olav V", start: 1957, end: 1991, tone: "gold", note: "Etterkrigstid og oljeperiode." },
  { id: "harald-v", laneKey: "row2", lane: "Konge / regent", label: "Harald V", start: 1991, end: 2024, tone: "gold", note: "Moderne periode." },

  { id: "ww1", laneKey: "row3", lane: "Krig / konflikt", label: "1. verdenskrig", start: 1914, end: 1918, tone: "green", note: "Internasjonal krig og Ã¸konomisk uro." },
  { id: "ww2", laneKey: "row3", lane: "Krig / konflikt", label: "2. verdenskrig / okkupasjon", start: 1940, end: 1945, tone: "green", note: "Direkte relevant for seddel-, valuta- og krigshistorie." },

  { id: "krigsokonomi", laneKey: "row4", lane: "Finans / Ã¸konomi", label: "KrigsÃ¸konomi", start: 1940, end: 1945, tone: "purple", note: "Regulering, knapphet og pengepolitisk press." },
  { id: "oljeinflasjon", laneKey: "row4", lane: "Finans / Ã¸konomi", label: "Olje / inflasjon", start: 1970, end: 1990, tone: "purple", note: "OljeÃ¸konomi, inflasjon og endret kjÃ¸pekraft." },
  { id: "finanskrise", laneKey: "row4", lane: "Finans / Ã¸konomi", label: "Finanskrise", start: 2008, end: 2011, tone: "purple", note: "Marked og likviditet." },

  { id: "hambro", laneKey: "object", lane: "Signatur / person", label: "C. J. Hambro", start: 1924, end: 1945, tone: "steel", note: "Person/signatur overlapper krigsperioden." },
  { id: "liestoel", laneKey: "object", lane: "Signatur / person", label: "Knut LiestÃ¸l", start: 1953, end: 1985, tone: "steel", note: "Etterkrigstid og seddelkontekst." },
  { id: "norges-bank", laneKey: "object", lane: "Produsent / utgiver / objekt", label: "Norges Bank", start: 1816, end: 2024, tone: "steel", note: "Utgiverrelasjon for norske sedler." },
  { id: "femte-utgave", laneKey: "object", lane: "Produsent / utgiver / objekt", label: "5. utgave sedler", start: 1966, end: 1983, tone: "steel", note: "Eksempel pÃ¥ utgaveperiode." },
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

function yearsOverlap(start: number, end: number, fromYear: number, toYear: number): boolean {
  return start <= toYear && end >= fromYear;
}

function itemStyle(item: TimelineItem, fromYear: number, toYear: number): CSSProperties {
  const span = Math.max(1, toYear - fromYear);
  const start = Math.max(fromYear, item.start);
  const end = Math.min(toYear, item.end);
  const left = ((start - fromYear) / span) * 100;
  const width = Math.max(1.6, ((end - start) / span) * 100);
  return { left: `${left}%`, width: `${width}%` };
}

function decadeYears(fromYear: number, toYear: number): number[] {
  const first = Math.ceil(fromYear / 10) * 10;
  const years: number[] = [];
  for (let year = first; year <= toYear; year += 10) years.push(year);
  return years;
}

function groupSelectItems(items: SelectItem[]): Array<[string, SelectItem[]]> {
  const groups: Record<string, SelectItem[]> = {};

  for (const item of items) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  return Object.entries(groups);
}

function row4GroupForPeriod(period: PeriodOption, fromYear: number, toYear: number): string {
  const start = period.start_year;
  const end = period.end_year;

  if (start != null && end != null && yearsOverlap(start, end, fromYear, toYear)) {
    return "Gjeldende periode";
  }

  if (period.period_level === 1) return "Overordnede perioder";
  if (period.period_level === 2) return "Hovedperioder";
  if (period.period_level === 3) return "Underperioder / relasjoner";

  return "Andre perioder";
}

function relationTypesForRow3(row3: string): string[] {
  if (row3 === "regent") return ["regent"];
  if (row3 === "signature" || row3 === "person") return ["person"];
  if (row3 === "edition" || row3 === "denomination_issue") return ["utgave", "valor"];
  if (row3 === "variant") return ["variant"];
  if (row3 === "source_key" || row3 === "issuer" || row3 === "producer") return ["kilde"];
  if (row3 === "year") return ["ar", "publiseringsar"];
  return [];
}

function makeRow4Items(
  periods: PeriodOption[],
  relations: RelationNode[],
  row1: string,
  row2: string,
  row3: string,
  fromYear: number,
  toYear: number,
): SelectItem[] {
  const items: SelectItem[] = [];

  const relevantWords = [row1, row2, row3]
    .join(" ")
    .replaceAll("_", " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  for (const period of periods) {
    if (!period.period_slug) continue;

    const text = `${period.display_name_no || ""} ${period.period_type_key || ""} ${period.period_type_label_no || ""} ${period.summary_short_no || ""} ${period.collectium_relevance_no || ""}`.toLowerCase();

    const overlap = period.start_year != null && period.end_year != null && yearsOverlap(period.start_year, period.end_year, fromYear, toYear);
    const wordMatch = relevantWords.some((word) => word.length > 3 && text.includes(word));

    if (overlap || wordMatch || items.length < 60) {
      items.push({
        key: period.period_slug,
        label: period.display_name_no || labelFromKey(period.period_slug),
        group: row4GroupForPeriod(period, fromYear, toYear),
        description: period.collectium_relevance_no || period.summary_short_no || "Periode fra API.",
        startYear: period.start_year,
        endYear: period.end_year,
      });
    }
  }

  const wantedRelations = relationTypesForRow3(row3);

  for (const relation of relations) {
    if (!wantedRelations.includes(relation.relation_type)) continue;

    items.push({
      key: `${relation.relation_type}:${relation.relation_slug}`,
      label: relation.relation_label_no || labelFromKey(relation.relation_slug),
      group: "Relevante relasjoner",
      description: `${relation.relation_count.toLocaleString("nb-NO")} objektkoblinger`,
      startYear: null,
      endYear: null,
    });
  }

  items.push(
    { key: `century:${Math.floor(fromYear / 100) * 100}`, label: `${Math.floor(fromYear / 100) * 100}-tallet`, group: "Ã…rhundre innenfor valgt periode", description: "Ã…rhundre fra valgt tidsrom.", startYear: Math.floor(fromYear / 100) * 100, endYear: Math.floor(fromYear / 100) * 100 + 99 },
    { key: `decade:${Math.floor(fromYear / 10) * 10}`, label: `${Math.floor(fromYear / 10) * 10}â€“${Math.floor(fromYear / 10) * 10 + 9}`, group: "TiÃ¥r innenfor valgt periode", description: "TiÃ¥r fra valgt tidsrom.", startYear: Math.floor(fromYear / 10) * 10, endYear: Math.floor(fromYear / 10) * 10 + 9 },
  );

  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    })
    .slice(0, 160);
}

function makeDynamicTimeline(
  base: TimelineItem[],
  periods: PeriodOption[],
  selectedRow1: SelectItem | undefined,
  selectedRow2: SelectItem | undefined,
  selectedRow3: SelectItem | undefined,
  selectedRow4: SelectItem | undefined,
  row1: string,
  row2: string,
  row3: string,
  fromYear: number,
  toYear: number,
): TimelineItem[] {
  const items: TimelineItem[] = [];

  const row1Filter = row1 === "national_period"
    ? ["Nasjonal hovedperiode"]
    : row1 === "regent_period"
      ? ["Konge / regent"]
      : row1 === "financial_period"
        ? ["Finans / Ã¸konomi"]
        : ["Produsent / utgiver / objekt", "Signatur / person"];

  const row2Filter = row2.includes("war")
    ? ["Krig / konflikt"]
    : row2.includes("regent") || row2.includes("dynasty") || row2.includes("issuer")
      ? ["Konge / regent", "Produsent / utgiver / objekt"]
      : row2.includes("economy") || row2.includes("money") || row2.includes("market") || row2.includes("index")
        ? ["Finans / Ã¸konomi"]
        : ["Nasjonal hovedperiode", "Krig / konflikt"];

  const row3Filter = row3 === "regent"
    ? ["Konge / regent"]
    : row3 === "war"
      ? ["Krig / konflikt"]
      : row3 === "finance" || row3 === "market" || row3 === "currency"
        ? ["Finans / Ã¸konomi"]
        : row3 === "signature" || row3 === "person"
          ? ["Signatur / person"]
          : row3 === "edition" || row3 === "variant" || row3 === "producer" || row3 === "issuer" || row3 === "source_key"
            ? ["Produsent / utgiver / objekt"]
            : ["Nasjonal hovedperiode", "Konge / regent"];

  for (const item of base) {
    if (!yearsOverlap(item.start, item.end, fromYear, toYear)) continue;

    if (row1Filter.includes(item.lane)) {
      items.push({ ...item, id: `r1-${item.id}`, laneKey: "row1", lane: selectedRow1?.label || "Rad 1", tone: "blue" });
    }

    if (row2Filter.includes(item.lane)) {
      items.push({ ...item, id: `r2-${item.id}`, laneKey: "row2", lane: selectedRow2?.label || "Rad 2", tone: "gold" });
    }

    if (row3Filter.includes(item.lane)) {
      items.push({ ...item, id: `r3-${item.id}`, laneKey: "row3", lane: selectedRow3?.label || "Rad 3", tone: "green" });
    }
  }

  for (const period of periods) {
    if (period.start_year == null || period.end_year == null) continue;
    if (!yearsOverlap(period.start_year, period.end_year, fromYear, toYear)) continue;

    const label = period.display_name_no || labelFromKey(period.period_slug);
    const type = `${period.period_type_key || ""} ${period.period_type_label_no || ""}`.toLowerCase();

    let laneKey: TimelineItem["laneKey"] = "row4";
    let tone: TimelineTone = "purple";
    let lane = selectedRow4?.label || "Rad 4";

    if (type.includes("regent") || type.includes("konge")) {
      laneKey = "row2";
      tone = "gold";
      lane = selectedRow2?.label || "Rad 2";
    }

    if (type.includes("krig") || type.includes("konflikt")) {
      laneKey = "row3";
      tone = "green";
      lane = selectedRow3?.label || "Rad 3";
    }

    items.push({
      id: `api-${period.period_slug}`,
      laneKey,
      lane,
      label,
      start: period.start_year,
      end: period.end_year,
      tone,
      note: period.collectium_relevance_no || period.summary_short_no || "Periode fra API.",
    });
  }

  if (selectedRow4?.startYear != null && selectedRow4?.endYear != null) {
    items.push({
      id: `selected-row4-${selectedRow4.key}`,
      laneKey: "row4",
      lane: selectedRow4.label,
      label: selectedRow4.label,
      start: selectedRow4.startYear,
      end: selectedRow4.endYear,
      tone: "purple",
      note: selectedRow4.description,
    });
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.laneKey}-${item.label}-${item.start}-${item.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function timelineBio(item: TimelineItem | null): string {
  if (!item) return "Velg en boks i tidslinjen for Ã¥ vise kort bio og nÃ¸kkelinformasjon.";

  if (item.laneKey === "row1") return `${item.label} viser hovedrammen for perioden. Denne raden skal forklare den overordnede perioden som de andre radene mÃ¥ forstÃ¥s innenfor.`;
  if (item.laneKey === "row2") return `${item.label} viser valgt hovedtema under Rad 1. Denne raden skal forklare hvordan regent, statsperiode, krig eller finans henger sammen med hovedperioden.`;
  if (item.laneKey === "row3") return `${item.label} viser valgt underperiode, relasjon eller objektspesifikasjon. Denne raden gir mer presis forklaring enn Rad 1 og Rad 2.`;
  if (item.laneKey === "row4") return `${item.label} er konkret valgt periode/verdi. Denne skal styre detaljert forklaring, relasjon og filtrert innhold.`;

  return item.note;
}

function timelineKeyFacts(item: TimelineItem | null): Array<[string, string]> {
  if (!item) {
    return [
      ["Status", "Ingen tidslinjeboks valgt"],
      ["Bruk", "Trykk pÃ¥ en boks i tidslinjen"],
    ];
  }

  return [
    ["Navn", item.label],
    ["Kategori", item.lane],
    ["Rad", item.laneKey.toUpperCase()],
    ["Periode", `${item.start}â€“${item.end}`],
    ["Kort forklaring", item.note],
  ];
}

export default function CollectiumPeriodFilterTest() {
  const { activeScreenMode } = useCollectiumLayout();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [data, setData] = useState<PeriodApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [master, setMaster] = useState("period");
  const [country, setCountry] = useState("no");
  const [objectType, setObjectType] = useState("banknote");

  const [row1, setRow1] = useState("national_period");
  const [row2, setRow2] = useState("historical_main");
  const [row3, setRow3] = useState("period");
  const [row4, setRow4] = useState("");

  const [fromYear, setFromYear] = useState(1899);
  const [toYear, setToYear] = useState(2025);
  const [zoom, setZoom] = useState(1);
  const [timelineOnly, setTimelineOnly] = useState(false);
  const [segment, setSegment] = useState<SegmentKey>("historie");
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);

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

  const row2Items = useMemo(() => ROW2_BY_ROW1[row1] || [], [row1]);
  const row3Items = useMemo(() => ROW3_BY_ROW2[row2] || [], [row2]);

  useEffect(() => {
    const firstRow2 = row2Items[0]?.key || "";
    if (firstRow2 && !row2Items.some((item) => item.key === row2)) {
      setRow2(firstRow2);
      setRow3("");
      setRow4("");
    }
  }, [row1, row2, row2Items]);

  useEffect(() => {
    const firstRow3 = row3Items[0]?.key || "";
    if (firstRow3 && !row3Items.some((item) => item.key === row3)) {
      setRow3(firstRow3);
      setRow4("");
    }
  }, [row2, row3, row3Items]);

  const row4Items = useMemo(() => {
    return makeRow4Items(data?.rows || [], data?.relationNodes || [], row1, row2, row3, fromYear, toYear);
  }, [data?.rows, data?.relationNodes, row1, row2, row3, fromYear, toYear]);

  useEffect(() => {
    if (!row4Items.length) return;
    if (!row4Items.some((item) => item.key === row4)) {
      setRow4(row4Items[0].key);
    }
  }, [row4Items, row4]);

  const selectedMaster = MASTER_FILTERS.find((item) => item.key === master);
  const selectedCountry = COUNTRIES.find((item) => item.key === country);
  const selectedObjectType = OBJECT_TYPES.find((item) => item.key === objectType);
  const selectedRow1 = ROW1.find((item) => item.key === row1);
  const selectedRow2 = row2Items.find((item) => item.key === row2);
  const selectedRow3 = row3Items.find((item) => item.key === row3);
  const selectedRow4 = row4Items.find((item) => item.key === row4);

  const timelineItems = useMemo(() => {
    return makeDynamicTimeline(
      BASE_TIMELINE,
      data?.rows || [],
      selectedRow1,
      selectedRow2,
      selectedRow3,
      selectedRow4,
      row1,
      row2,
      row3,
      fromYear,
      toYear,
    );
  }, [data?.rows, selectedRow1, selectedRow2, selectedRow3, selectedRow4, row1, row2, row3, fromYear, toYear]);

  useEffect(() => {
    if (!timelineItems.length) {
      setSelectedTimelineItem(null);
      return;
    }

    if (!selectedTimelineItem || !timelineItems.some((item) => item.id === selectedTimelineItem.id)) {
      setSelectedTimelineItem(timelineItems[0]);
    }
  }, [timelineItems, selectedTimelineItem]);

  const decades = decadeYears(fromYear, toYear);
  const lanes: Array<{ key: TimelineItem["laneKey"]; label: string }> = [
    { key: "row1", label: selectedRow1?.label || "Rad 1" },
    { key: "row2", label: selectedRow2?.label || "Rad 2" },
    { key: "row3", label: selectedRow3?.label || "Rad 3" },
    { key: "row4", label: selectedRow4?.label || "Rad 4" },
    { key: "object", label: "Objekt / relasjon" },
  ];

  function setSelectedPeriod(key: string) {
    setRow4(key);
    const item = row4Items.find((entry) => entry.key === key);
    if (item?.startYear != null && item?.endYear != null) {
      setFromYear(Math.max(-3000, item.startYear - 10));
      setToYear(Math.min(2100, item.endYear + 10));
    }
  }

  const asideContent = (
    <aside className={styles.filterColumn}>
      <div className={styles.filterColumnHeader}>
        <p className={styles.eyebrow}>Filterfelt</p>
      </div>

      <SelectBox title="Masterfilter" value={master} onChange={setMaster} items={MASTER_FILTERS} />
      <SelectBox title="Land / omrÃ¥de" value={country} onChange={setCountry} items={COUNTRIES} />
      <SelectBox title="Objekttype" value={objectType} onChange={setObjectType} items={OBJECT_TYPES} />

      <div className={styles.filterDivider}>Periodefilter</div>

      <SelectBox
        title="Rad 1 Â· HovednivÃ¥"
        value={row1}
        onChange={(value) => {
          setRow1(value);
          setRow4("");
        }}
        items={ROW1}
      />

      <SelectBox
        title="Rad 2 Â· Innhold styres av Rad 1"
        value={row2}
        onChange={(value) => {
          setRow2(value);
          setRow3("");
          setRow4("");
        }}
        items={row2Items}
      />

      <SelectBox
        title="Rad 3 Â· Innhold styres av Rad 2"
        value={row3}
        onChange={(value) => {
          setRow3(value);
          setRow4("");
        }}
        items={row3Items}
      />

      <SelectBox
        title="Rad 4 Â· Forslag fra Rad 1-3"
        value={row4}
        onChange={setSelectedPeriod}
        items={row4Items}
      />

      <div className={styles.selectedStack}>
        <strong>Valgt</strong>
        <span>{selectedMaster?.label}</span>
        <span>{selectedCountry?.label}</span>
        <span>{selectedObjectType?.label}</span>
        <span>{selectedRow1?.label}</span>
        <span>{selectedRow2?.label}</span>
        <span>{selectedRow3?.label}</span>
        <span>{selectedRow4?.label || "Ingen Rad 4 valgt"}</span>
      </div>
    </aside>
  );

  const mainContent = (
    <section className={styles.mainColumn}>
      <section className={styles.timelineShell}>
        <div className={styles.timelineHeader}>
          <div>
            <p className={styles.eyebrow}>Sammenlignende tidslinje</p>
            <h2>{selectedRow1?.label} Â· {selectedRow2?.label} Â· {selectedRow3?.label}</h2>
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
            <input type="number" value={fromYear} onChange={(event) => setFromYear(Number(event.target.value) || 0)} />
          </label>
          <label>
            Ã…r til
            <input type="number" value={toYear} onChange={(event) => setToYear(Number(event.target.value) || 2025)} />
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
                  style={{
                    left: `${((year - fromYear) / Math.max(1, toYear - fromYear)) * 100}%`,
                    width: `${(10 / Math.max(1, toYear - fromYear)) * 100}%`,
                  }}
                >
                  <span>{year}</span>
                </div>
              ))}
            </div>

            {lanes.map((lane) => {
              const laneItems = timelineItems.filter((item) => item.laneKey === lane.key);

              return (
                <div className={styles.timelineLane} data-row={lane.key} key={lane.key}>
                  <div className={styles.laneLabel}>{lane.label}</div>
                  <div className={styles.laneTrack}>
                    {laneItems.map((item) => (
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
              );
            })}

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
              <h2>{selectedTimelineItem ? selectedTimelineItem.label : "Velg tidslinjeboks"}</h2>
              <p className={styles.bioText}>{timelineBio(selectedTimelineItem)}</p>
              {timelineKeyFacts(selectedTimelineItem).map(([key, value]) => (
                <Fact key={key} label={key} value={value} />
              ))}
            </article>
          </div>
        </section>
      ) : null}
    </section>
  );

  const isMobile = activeScreenMode === "mobile";
  const isTablet = activeScreenMode === "tablet";
  const isWide = activeScreenMode === "wide";

  const gridStyle: CSSProperties = useMemo(() => {
    if (isMobile || isTablet) {
      return { display: "grid", gridTemplateColumns: "1fr", gap: "18px", minWidth: 0, width: "100%" };
    }
    // Desktop layout
    return { display: "grid", gridTemplateColumns: "280px 1fr", gap: "18px", minWidth: 0, width: "100%" };
  }, [isMobile, isTablet]);

  return (
    <main className={styles.page} data-timeline-only={timelineOnly ? "true" : "false"}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Collectium System Control</p>
          <h1>Periodefilter Control</h1>
          <p>
            Control page for Filter Master, period filter, Samler/Historie/Finans,
            relation links and timeline. The page follows the same control-page
            structure as MariaDB Neon, while keeping the period filter test data.
          </p>
        </div>
        <aside className={styles.statusBox}>
          <strong>{loading ? "HENTER" : error ? "FEIL" : "OK"}</strong>
          <span>{data?.updatedAt ? new Date(data.updatedAt).toLocaleString("nb-NO") : "Ingen tidsstempel"}</span>
        </aside>
      </section>

      {error ? <section className={styles.errorBox}>{error}</section> : null}

      {!timelineOnly ? (
        <>
          <section className={styles.ctSystemStatusGrid} aria-label="Periodefilter systemstatus">
            <article className={styles.ctSystemStatusCard}>
              <span>API</span>
              <strong>{error ? "Feil" : loading ? "Henter" : "OK"}</strong>
              <small>/api/filter/period/options</small>
            </article>
            <article className={styles.ctSystemStatusCard}>
              <span>Perioder</span>
              <strong>{data?.rows?.length || 0}</strong>
              <small>aktive valg og tidslinjegrunnlag</small>
            </article>
            <article className={styles.ctSystemStatusCard}>
              <span>Relasjoner</span>
              <strong>{data?.relationNodes?.length || 0}</strong>
              <small>kobles mot objekt, periode og segment</small>
            </article>
            <article className={styles.ctSystemStatusCard}>
              <span>Deploy gate</span>
              <strong>{error ? "Blokkert" : "Apen"}</strong>
              <small>build ma vaere gronn for push</small>
            </article>
          </section>

          <nav className={styles.ctSystemTabs} aria-label="Periodefilter kontrollfaner">
            <span data-active="true">Dashboard</span>
            <span>Struktur</span>
            <span>Filter Master</span>
            <span>Periodefilter</span>
            <span>Relasjoner</span>
            <span>Samler</span>
            <span>Historie</span>
            <span>Finans</span>
            <span>Diagnose</span>
            <span>Svar til ChatGPT</span>
          </nav>

          <section className={styles.ctSystemDashboard}>
            <article className={styles.infoPanel}>
              <p className={styles.eyebrow}>Dashboard</p>
              <h2>Filter Master og periodehierarki</h2>
              <Fact label="Masterfilter" value={selectedMaster?.label || "Ikke valgt"} />
              <Fact label="Land / omrade" value={selectedCountry?.label || "Ikke valgt"} />
              <Fact label="Objekttype" value={selectedObjectType?.label || "Ikke valgt"} />
              <Fact label="Valgt periode" value={selectedRow4?.label || selectedTimelineItem?.label || "Ikke valgt"} />
            </article>

            <article className={styles.infoPanel}>
              <p className={styles.eyebrow}>Diagnose / tiltak</p>
              <h2>Kontrollside-status</h2>
              <Fact label="Kontrollside-identitet" value="Collectium System Control" />
              <Fact label="Dashboard-struktur" value="OK" />
              <Fact label="Diagnosefelt" value="OK" />
              <Fact label="Svar til ChatGPT" value="OK" />
            </article>
          </section>
        </>
      ) : null}

      {isMobile && (
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="ct-btn ct-btn-primary"
            style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 700 }}
            onClick={() => setIsFilterOpen(true)}
          >
            ðŸ” Vis filter &amp; filtervalg
          </button>

          {isFilterOpen && (
            <div style={{
              position: "fixed",
              inset: 0,
              zIndex: 150,
              background: "var(--ct-app-bg)",
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--ct-border)", paddingBottom: "12px" }}>
                <h3 style={{ margin: 0, fontFamily: "var(--ct-font-ui)", fontWeight: 750 }}>Filter og valg</h3>
                <button
                  type="button"
                  className="ct-btn"
                  onClick={() => setIsFilterOpen(false)}
                  style={{ padding: "6px 12px", fontSize: "13px", fontWeight: 700 }}
                >
                  Lukk âœ•
                </button>
              </div>
              <div onClick={() => setIsFilterOpen(false)}>
                {asideContent}
              </div>
            </div>
          )}
        </div>
      )}

      {isWide ? (
        <CollectiumWorkspaceLanes>
          {asideContent}
          {mainContent}
        </CollectiumWorkspaceLanes>
      ) : (
        <section className={styles.layout} style={gridStyle}>
          {!isMobile && asideContent}
          {mainContent}
        </section>
      )}
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