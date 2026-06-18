"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter test UI/UX 8.6 - Masterfilter 40 + sammenlignende tidslinje
 *
 * Definering / formål:
 * Testside for Filter Master der perioden ikke behandles som trestruktur, men som
 * sammenlignbare lag på samme tidsakse: konge/regent, nasjonal periode, krig,
 * finans/økonomi, signatur/person og samleobjektspesifikasjoner.
 *
 * Bruksområde:
 * Brukes av /test/periodefilter.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/filter/period/options
 *
 * Berørte datalag:
 * - ct_v_period_filter_options
 * - ct_v_object_relations_resolved via period options API når relationNodes finnes
 *
 * Retning:
 * Neon -> API -> React testvisning.
 */

import { useEffect, useMemo, useState } from "react";
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

type FilterItem = {
  key: string;
  label: string;
  group: string;
  description: string;
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

const MASTER_FILTERS: FilterItem[] = [
  { key: "country", label: "Land / område", group: "Geografi", description: "Norge, Sverige, Skandinavia, Europa, globalt." },
  { key: "source_key", label: "Kilde", group: "Kilde", description: "Norske sedler, mynter, verdibrev og andre kilder." },
  { key: "object_group", label: "Objekttype", group: "Objekt", description: "Seddel, mynt, verdibrev, medalje, dokument." },
  { key: "producer", label: "Produsent / trykkeri", group: "Objekt", description: "Trykkeri, myntverk, utsteder, produsent." },
  { key: "issuer", label: "Utgiver / autoritet", group: "Objekt", description: "Norges Bank, stat, konge, institusjon, selskap." },
  { key: "denomination", label: "Valør", group: "Objekt", description: "1 krone, 5 kroner, 10 kroner, aksjebeløp, pålydende verdi." },
  { key: "denomination_issue", label: "Valørutgave / serie", group: "Objekt", description: "Valør + utgave/serie som egen samlelogikk." },
  { key: "edition", label: "Utgave", group: "Objekt", description: "Utgave, serie, emisjon eller katalogutgave." },
  { key: "edition_period", label: "Utgaveperiode", group: "Periode", description: "Perioden utgaven var aktiv eller ble produsert." },
  { key: "publication_year", label: "Publiseringsår", group: "Periode", description: "Året objektet er publisert/utstedt." },
  { key: "object_year", label: "År / objektår", group: "Periode", description: "Året objektet tilhører." },
  { key: "period", label: "Historisk periode", group: "Historie", description: "Nasjonal eller overordnet historisk periode." },
  { key: "regent", label: "Konge / regent", group: "Historie", description: "Regent, konge, styreperiode og utgiverkontekst." },
  { key: "dynasty", label: "Dynasti / maktstruktur", group: "Historie", description: "Kongehus, union, styreform, maktstruktur." },
  { key: "war", label: "Krig / konflikt", group: "Historie", description: "Krig, okkupasjon, opprør, politisk konflikt." },
  { key: "crisis", label: "Sykdom / krise", group: "Historie", description: "Pandemi, krise, knapphet og samfunnsendringer." },
  { key: "economy_period", label: "Økonomisk periode", group: "Finans", description: "Inflasjon, krise, vekst, pengehistorie." },
  { key: "currency_context", label: "Valuta / pengehistorie", group: "Finans", description: "Valutaregime, pengepolitikk, seddelreformer." },
  { key: "market_period", label: "Marked / prisperiode", group: "Finans", description: "Markedsperiode, prisobservasjoner, likviditet." },
  { key: "index_period", label: "Index / sammenligning", group: "Finans", description: "KPI, valuta, gull/sølv, aksjeindeks." },
  { key: "person", label: "Person / signatur", group: "Relasjon", description: "Signatur, gravør, politiker, direktør, historisk person." },
  { key: "signature", label: "Signaturgruppe", group: "Objekt", description: "Signaturkombinasjoner og signaturperiode." },
  { key: "motif", label: "Motiv / symbol", group: "Objekt", description: "Portrett, riksvåpen, motiv, symbol, design." },
  { key: "variant", label: "Variant / type", group: "Objekt", description: "Variant, type, litra, detaljavvik." },
  { key: "litra", label: "Litra / detaljer", group: "Objekt", description: "Litra, plateskille, nummerserie, detaljfelt." },
  { key: "material", label: "Materiale", group: "Objekt", description: "Papir, metall, legering, sikkerhetspapir." },
  { key: "metal", label: "Metall / legering", group: "Objekt", description: "Gull, sølv, kobber, nikkel, legering." },
  { key: "paper", label: "Papir / sikkerhet", group: "Objekt", description: "Papirtype, vannmerke, sikkerhetselementer." },
  { key: "grade", label: "Kvalitet", group: "Samler", description: "Kvalitet, gradering, slitasje, bevaring." },
  { key: "damage", label: "Skade / tilstand", group: "Samler", description: "Rift, brett, flekker, hull, rengjøring, skade." },
  { key: "rarity", label: "Sjeldenhet", group: "Samler", description: "Sjeldenhet, kjent antall, katalogvurdering." },
  { key: "provenance", label: "Proveniens", group: "Historie", description: "Eierhistorikk, samling, funn, offentlig/privat proveniens." },
  { key: "find", label: "Funn", group: "Historie", description: "Funnsted, funnår, arkeologisk eller historisk funn." },
  { key: "catalog_number", label: "Katalognummer", group: "Katalog", description: "Kildekatalognummer og sorteringsnøkkel." },
  { key: "auction", label: "Auksjon", group: "Marked", description: "Auksjonsstatus, bud, resultat, historikk." },
  { key: "shop", label: "Nettbutikk", group: "Marked", description: "Butikkstatus, pris, tilgjengelighet." },
  { key: "collection", label: "Samling", group: "Bruker", description: "I min samling, ønskeliste, favoritt, lister." },
  { key: "user_state", label: "Brukerstatus", group: "Bruker", description: "Hjerte, stjerne, eierstatus, private handlinger." },
  { key: "trend", label: "Trend", group: "Finans", description: "Trend 6/12/18/24 måneder." },
  { key: "value", label: "Verdi", group: "Finans", description: "Markedsverdi, historisk pris, estimat." },
];

const COMPARE_LAYERS: FilterItem[] = [
  { key: "regent", label: "Konge / regent + utgiver", group: "Historie", description: "Hvem styrte, og hvilken utgiverautoritet lå bak objektet?" },
  { key: "national_period", label: "Nasjonal periode", group: "Historie", description: "Hvilken hovedperiode eller union lå objektet innenfor?" },
  { key: "war", label: "Krig / konflikt", group: "Historie", description: "Var objektet samtidig med krig, okkupasjon eller konflikt?" },
  { key: "finance", label: "Finans / økonomi", group: "Finans", description: "Var det inflasjon, krise, valutaskifte eller pengehistorisk endring?" },
  { key: "person", label: "Signatur / person", group: "Relasjon", description: "Hvilke signaturer/personer overlapper perioden?" },
  { key: "object_spec", label: "Samleobjekt-spesifikasjon", group: "Objekt", description: "Produsent, utgave, variant, signatur, motiv, materiale." },
];

const SPEC_BY_LAYER: Record<string, FilterItem[]> = {
  regent: [
    { key: "regent", label: "Regent", group: "Historie", description: "Konge/regent som historisk ramme." },
    { key: "issuer", label: "Utgiver", group: "Objekt", description: "Utgiverautoritet." },
    { key: "dynasty", label: "Dynasti / union", group: "Historie", description: "Styreform og maktstruktur." },
  ],
  national_period: [
    { key: "period", label: "Historisk hovedperiode", group: "Historie", description: "Overordnet periode." },
    { key: "edition_period", label: "Utgaveperiode", group: "Objekt", description: "Objektets utgaveperiode." },
    { key: "publication_year", label: "Publiseringsår", group: "Periode", description: "Årstall som kobling." },
  ],
  war: [
    { key: "war", label: "Krig", group: "Historie", description: "Krig/konflikt." },
    { key: "occupation", label: "Okkupasjon", group: "Historie", description: "Okkupasjonsperiode." },
    { key: "crisis", label: "Krise", group: "Historie", description: "Samfunnskrise." },
  ],
  finance: [
    { key: "economy_period", label: "Økonomisk periode", group: "Finans", description: "Inflasjon, krise, vekst." },
    { key: "currency_context", label: "Valuta / pengehistorie", group: "Finans", description: "Pengehistorisk kontekst." },
    { key: "market_period", label: "Marked / prisperiode", group: "Finans", description: "Prisobservasjoner og trend." },
  ],
  person: [
    { key: "person", label: "Person", group: "Relasjon", description: "Person/signaturrelasjon." },
    { key: "signature", label: "Signaturgruppe", group: "Objekt", description: "Signaturer på objektet." },
    { key: "role", label: "Rolle", group: "Relasjon", description: "Direktør, gravør, politiker, autoritet." },
  ],
  object_spec: [
    { key: "producer", label: "Produsent / trykkeri", group: "Objekt", description: "Hvem produserte objektet?" },
    { key: "edition", label: "Utgave / serie", group: "Objekt", description: "Hvilken utgave/serie?" },
    { key: "variant", label: "Variant / type", group: "Objekt", description: "Hvilken variant/type?" },
    { key: "signature", label: "Signatur", group: "Objekt", description: "Hvilken signatur?" },
    { key: "motif", label: "Motiv / symbol", group: "Objekt", description: "Motiv, portrett eller symbol." },
    { key: "material", label: "Materiale", group: "Objekt", description: "Papir/metall/materialtype." },
  ],
};

const TIMELINE_ITEMS: TimelineItem[] = [
  { id: "karl-johan", lane: "Konge/regent", label: "Karl XIV Johan", start: 1814, end: 1844, tone: "gold", note: "Unionstid og tidlig moderne norsk stat." },
  { id: "oscar-i", lane: "Konge/regent", label: "Oscar I", start: 1844, end: 1859, tone: "gold", note: "Konge under svensk-norsk union." },
  { id: "oscar-ii", lane: "Konge/regent", label: "Oscar II", start: 1872, end: 1905, tone: "gold", note: "Siste unionskonge før 1905." },
  { id: "haakon-vii", lane: "Konge/regent", label: "Haakon VII", start: 1905, end: 1957, tone: "gold", note: "Selvstendig Norge, krig og etterkrigstid." },
  { id: "olav-v", lane: "Konge/regent", label: "Olav V", start: 1957, end: 1991, tone: "blue", note: "Etterkrigstid, oljealder og moderne pengebruk." },
  { id: "harald-v", lane: "Konge/regent", label: "Harald V", start: 1991, end: 2024, tone: "purple", note: "Digitalisering og moderne samlermarked." },

  { id: "union", lane: "Nasjonal periode", label: "Union med Sverige", start: 1814, end: 1905, tone: "gold", note: "Union og nasjonal institusjonsbygging." },
  { id: "selvstendig", lane: "Nasjonal periode", label: "Selvstendig Norge", start: 1905, end: 1940, tone: "blue", note: "Selvstendig stat før andre verdenskrig." },
  { id: "etterkrig", lane: "Nasjonal periode", label: "Etterkrigstiden", start: 1945, end: 1990, tone: "blue", note: "Gjenoppbygging, velferdsstat og økonomisk utvikling." },

  { id: "ww1", lane: "Krig/konflikt", label: "1. verdenskrig", start: 1914, end: 1918, tone: "red", note: "Krigsøkonomi og internasjonal uro." },
  { id: "ww2", lane: "Krig/konflikt", label: "2. verdenskrig / okkupasjon", start: 1940, end: 1945, tone: "red", note: "Direkte relevant for seddel-, valuta- og krigshistorie." },

  { id: "krigsokonomi", lane: "Finans/økonomi", label: "Krigsøkonomi", start: 1940, end: 1945, tone: "steel", note: "Knappe ressurser, regulering og pengepolitisk press." },
  { id: "oljeinflasjon", lane: "Finans/økonomi", label: "Olje / inflasjon", start: 1970, end: 1990, tone: "green", note: "Inflasjon, oljeøkonomi og endret kjøpekraft." },
  { id: "finanskrise", lane: "Finans/økonomi", label: "Finanskrise", start: 2008, end: 2011, tone: "green", note: "Marked, likviditet og priskontekst." },

  { id: "christie", lane: "Signatur/person", label: "J. S. Christie", start: 1871, end: 1883, tone: "purple", note: "Signatur/person som objektkobling." },
  { id: "vogt", lane: "Signatur/person", label: "J. H. L. Vogt", start: 1899, end: 1924, tone: "purple", note: "Personperiode overlapper regent og nasjonal periode." },
  { id: "hambro", lane: "Signatur/person", label: "C. J. Hambro", start: 1924, end: 1945, tone: "purple", note: "Overlapper mellomkrigstid og krig." },
  { id: "liestoel", lane: "Signatur/person", label: "Knut Liestøl", start: 1953, end: 1985, tone: "purple", note: "Etterkrigstids- og seddelkontekst." },

  { id: "norges-bank", lane: "Produsent/utgiver/objekt", label: "Norges Bank", start: 1816, end: 2024, tone: "steel", note: "Utgiverrelasjon for norske sedler." },
  { id: "femte-utgave", lane: "Produsent/utgiver/objekt", label: "5. utgave sedler", start: 1966, end: 1983, tone: "steel", note: "Eksempel på utgaveperiode som må sammenlignes med regent/økonomi/person." },
];

const RELATION_TYPE_BY_SPEC: Record<string, string[]> = {
  regent: ["regent"],
  person: ["person"],
  signature: ["person"],
  edition: ["utgave"],
  variant: ["variant"],
  denomination: ["valor"],
  publication_year: ["ar", "publiseringsar"],
  source_key: ["kilde"],
};

function labelFromKey(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function itemStyle(item: TimelineItem, fromYear: number, toYear: number): React.CSSProperties {
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

function relationCount(summary: RelationSummary[], type: string): number | null {
  const row = summary.find((entry) => entry.relation_type === type);
  return row ? row.relation_count : null;
}

function relationOptionsForSpec(specKey: string, relationNodes: RelationNode[]): FilterItem[] {
  const wanted = RELATION_TYPE_BY_SPEC[specKey] || [];
  if (!wanted.length) return [];
  return relationNodes
    .filter((node) => wanted.includes(node.relation_type))
    .slice(0, 80)
    .map((node) => ({
      key: `${node.relation_type}:${node.relation_slug}`,
      label: node.relation_label_no || labelFromKey(node.relation_slug),
      group: node.relation_type,
      description: `${node.relation_count.toLocaleString("nb-NO")} objektkoblinger`,
    }));
}

function periodOptions(periodRows: PeriodOption[]): FilterItem[] {
  return periodRows
    .filter((row) => row.start_year !== null)
    .slice(0, 80)
    .map((row) => ({
      key: row.period_slug,
      label: row.display_name_no || labelFromKey(row.period_slug),
      group: row.period_type_label_no || row.period_type_key || "Periode",
      description: row.start_year !== null && row.end_year !== null ? `${row.start_year}-${row.end_year}` : "Tidsrom mangler",
    }));
}

function selectedLabel(items: FilterItem[], key: string): string {
  return items.find((item) => item.key === key)?.label || "Ikke valgt";
}

export default function CollectiumPeriodFilterTest() {
  const [data, setData] = useState<PeriodApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromYear, setFromYear] = useState(1814);
  const [toYear, setToYear] = useState(2024);
  const [zoom, setZoom] = useState(1);
  const [timelineOnly, setTimelineOnly] = useState(false);

  const [segment, setSegment] = useState<SegmentKey>("historie");
  const [row1, setRow1] = useState("period");
  const [row2, setRow2] = useState("regent");
  const [row3, setRow3] = useState("regent");
  const [row4, setRow4] = useState("");

  const [masterSearch, setMasterSearch] = useState("");
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(TIMELINE_ITEMS.find((item) => item.id === "ww2") || null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/filter/period/options", { cache: "no-store" });
        const json = (await response.json()) as PeriodApiResponse;
        if (!mounted) return;
        if (!response.ok || !json.ok) {
          setError(json.message || "Periodefilter-API svarte med feil.");
          setData(json);
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

  const relationSummary = data?.relationSummary || [];
  const relationNodes = data?.relationNodes || [];
  const periodRows = data?.rows || [];

  const visibleMasterFilters = useMemo(() => {
    const q = masterSearch.trim().toLowerCase();
    if (!q) return MASTER_FILTERS;
    return MASTER_FILTERS.filter((item) =>
      `${item.label} ${item.group} ${item.description}`.toLowerCase().includes(q),
    );
  }, [masterSearch]);

  const row3Options = SPEC_BY_LAYER[row2] || [];
  const row4Options = useMemo(() => {
    if (row3 === "period" || row3 === "edition_period") return periodOptions(periodRows);
    const relationOptions = relationOptionsForSpec(row3, relationNodes);
    if (relationOptions.length) return relationOptions;

    const fallbackCount = relationCount(relationSummary, row3);
    return [
      {
        key: `${row3}:dynamic`,
        label: `${labelFromKey(row3)} fra API`,
        group: "Dynamisk",
        description: fallbackCount ? `${fallbackCount.toLocaleString("nb-NO")} koblinger finnes` : "Krever resolved view/API for konkret verdi",
      },
    ];
  }, [periodRows, relationNodes, relationSummary, row3]);

  const visibleTimelineItems = TIMELINE_ITEMS.filter((item) => item.end >= fromYear && item.start <= toYear);
  const lanes = Array.from(new Set(visibleTimelineItems.map((item) => item.lane)));
  const decades = decadeYears(fromYear, toYear);

  const selectedMaster = MASTER_FILTERS.find((item) => item.key === row1);
  const selectedLayer = COMPARE_LAYERS.find((item) => item.key === row2);
  const selectedSpec = row3Options.find((item) => item.key === row3);
  const selectedValue = row4Options.find((item) => item.key === row4);

  function zoomIn() {
    setZoom((value) => Math.min(2.4, Number((value + 0.2).toFixed(1))));
  }

  function zoomOut() {
    setZoom((value) => Math.max(0.7, Number((value - 0.2).toFixed(1))));
  }

  return (
    <main className={styles.page} data-timeline-only={timelineOnly ? "true" : "false"}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Periodefilter · Masterfilter · sammenligning</p>
          <h1>Periodefilter · 40 filter · sammenlignende tidslinje</h1>
          <p>
            Denne testen bruker ikke trestruktur som hovedmodell. Radene velger filter og sammenligningslag,
            mens tidslinjen viser hvordan konge, krig, finans, signatur, utgiver og objektperiode overlapper.
          </p>
        </div>
        <aside className={styles.statusBox}>
          <strong>{loading ? "Henter" : error ? "Feil" : "OK"}</strong>
          <span>{data?.updatedAt ? new Date(data.updatedAt).toLocaleString("nb-NO") : "Ingen tidsstempel"}</span>
        </aside>
      </section>

      {error ? <section className={styles.errorBox}>{error}</section> : null}

      <section className={styles.masterPanel}>
        <div className={styles.masterTop}>
          <div>
            <p className={styles.eyebrow}>Masterfilter</p>
            <h2>40 filterområder</h2>
          </div>
          <input
            value={masterSearch}
            onChange={(event) => setMasterSearch(event.target.value)}
            placeholder="Søk i 40 filter: produsent, utgave, variant, signatur, motiv..."
          />
        </div>

        <div className={styles.masterGrid}>
          {visibleMasterFilters.map((item) => (
            <button
              type="button"
              key={item.key}
              data-active={row1 === item.key}
              onClick={() => {
                setRow1(item.key);
                if (item.key === "regent") setRow2("regent");
                if (item.key === "war") setRow2("war");
                if (item.key === "economy_period" || item.key === "value" || item.key === "trend") setRow2("finance");
                if (item.key === "person" || item.key === "signature") setRow2("person");
                if (["producer", "edition", "variant", "motif", "material"].includes(item.key)) setRow2("object_spec");
              }}
            >
              <span>{item.label}</span>
              <small>{item.group}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.rowGrid}>
        <FilterSelect
          title="Rad 1"
          subtitle="Masterfilterområde"
          value={row1}
          onChange={setRow1}
          items={MASTER_FILTERS}
        />
        <FilterSelect
          title="Rad 2"
          subtitle="Sammenligningslag"
          value={row2}
          onChange={(value) => {
            setRow2(value);
            const nextSpec = SPEC_BY_LAYER[value]?.[0]?.key || "";
            setRow3(nextSpec);
            setRow4("");
          }}
          items={COMPARE_LAYERS}
        />
        <FilterSelect
          title="Rad 3"
          subtitle="Spesifikasjon"
          value={row3}
          onChange={(value) => {
            setRow3(value);
            setRow4("");
          }}
          items={row3Options}
        />
        <FilterSelect
          title="Rad 4"
          subtitle="Konkret verdi"
          value={row4}
          onChange={setRow4}
          items={row4Options}
        />
      </section>

      <section className={styles.selectionLine}>
        <strong>Valgt sammenligning:</strong>
        <span>{selectedMaster?.label || "Masterfilter"}</span>
        <span>+</span>
        <span>{selectedLayer?.label || "Sammenligningslag"}</span>
        <span>+</span>
        <span>{selectedSpec?.label || "Spesifikasjon"}</span>
        <span>+</span>
        <span>{selectedValue?.label || "Konkret verdi ikke valgt"}</span>
      </section>

      <section className={styles.timelineShell}>
        <div className={styles.timelineHeader}>
          <div>
            <p className={styles.eyebrow}>Sammenlignende periodetidslinje</p>
            <h2>Overlapp mellom konge, krig, finans, signatur og objekt</h2>
          </div>
          <div className={styles.timelineTools}>
            <button type="button" onClick={zoomOut} aria-label="Zoom ut">−</button>
            <button type="button" onClick={zoomIn} aria-label="Zoom inn">+</button>
            <button type="button" data-active={timelineOnly} onClick={() => setTimelineOnly((value) => !value)}>
              {timelineOnly ? "Lukk tidslinje" : "Kun tidslinje"}
            </button>
          </div>
        </div>

        <div className={styles.yearInputs}>
          <label>
            År fra
            <input type="number" value={fromYear} onChange={(event) => setFromYear(safeNumber(event.target.value) || 1814)} />
          </label>
          <label>
            År til
            <input type="number" value={toYear} onChange={(event) => setToYear(safeNumber(event.target.value) || 2024)} />
          </label>
          <span>Zoom: {zoom.toFixed(1)}x</span>
        </div>

        <div className={styles.timelineViewport}>
          <div className={styles.timelineCanvas} style={{ minWidth: `${1100 * zoom}px` }}>
            <div className={styles.decadeBand}>
              {decades.map((year, index) => (
                <div
                  className={styles.decadeBlock}
                  data-even={index % 2 === 0 ? "true" : "false"}
                  key={year}
                  style={itemStyle({ id: `d${year}`, lane: "decade", label: String(year), start: year, end: year + 10, tone: "steel", note: "" }, fromYear, toYear)}
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
                        <span>{item.start}–{item.end}</span>
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
            <span>{selectedTimelineItem.lane}</span>
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
              <h2>{segment === "samler" ? "Samlerfelt" : segment === "historie" ? "Historiefelt" : "Finansfelt"}</h2>
              <Fact label="Masterfilter" value={selectedMaster?.label || "Ikke valgt"} />
              <Fact label="Sammenligningslag" value={selectedLayer?.label || "Ikke valgt"} />
              <Fact label="Spesifikasjon" value={selectedSpec?.label || "Ikke valgt"} />
              <Fact label="Konkret verdi" value={selectedValue?.label || "Ikke valgt"} />
              <Fact label="Tidslinjevalg" value={selectedTimelineItem ? `${selectedTimelineItem.label} (${selectedTimelineItem.start}–${selectedTimelineItem.end})` : "Ikke valgt"} />
            </article>

            <article className={styles.infoPanel}>
              <p className={styles.eyebrow}>Periode dynamiske felt</p>
              <h2>Hva feltet skal forklare</h2>
              {segment === "samler" ? (
                <>
                  <Fact label="Samleobjekt" value="Produsent, utgave, variant, signatur, motiv, materiale, kvalitet og sjeldenhet." />
                  <Fact label="Objektkobling" value="Hvilke objekter ligger innenfor valgt periode eller relasjon." />
                  <Fact label="Katalogbruk" value="Brukes til filtrering, relasjonschips og objektpresentasjon." />
                </>
              ) : null}
              {segment === "historie" ? (
                <>
                  <Fact label="Historisk sammenheng" value="Konge/regent, krig, periode, person og proveniens vises parallelt." />
                  <Fact label="Overlapp" value="Tidslinjen viser hva som skjer samtidig, ikke bare hva som er underordnet." />
                  <Fact label="Relasjon" value="Konge kan være utgiverkontekst, men sammenlignes også med krig og finans." />
                </>
              ) : null}
              {segment === "finans" ? (
                <>
                  <Fact label="Økonomisk kontekst" value="Inflasjon, krise, pengehistorie, valuta og markedsperiode." />
                  <Fact label="Marked" value="Trend, verdi, prisobservasjoner, auksjon og nettbutikk." />
                  <Fact label="Regel" value="0 kr skal ikke tolkes som reell markedsverdi." />
                </>
              ) : null}
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function FilterSelect(props: {
  title: string;
  subtitle: string;
  value: string;
  onChange: (value: string) => void;
  items: FilterItem[];
}) {
  return (
    <article className={styles.selectPanel}>
      <label>
        <span>{props.title}</span>
        <strong>{props.subtitle}</strong>
        <select value={props.value} onChange={(event) => props.onChange(event.target.value)}>
          {props.items.map((item) => (
            <option value={item.key} key={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p>{props.items.find((item) => item.key === props.value)?.description || "Velg verdi."}</p>
    </article>
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