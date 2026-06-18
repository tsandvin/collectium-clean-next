"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest UI/UX 8.6
 *
 * Definering / formål:
 * React-komponent for periodefilter-test. Bruker API-data og viser tre radnivåer samt Bio og Samler/Historie/Finans.
 *
 * Bruksområde:
 * Brukes av /test/periodefilter.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - filter.master.resolve
 *
 * Berørte API-ruter:
 * - GET /api/filter/period/options
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Logging:
 * log_category: filter
 * log_action: period_test_component_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0003 / CHANGE-2026-06-18-0001
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

type RelationSummary = {
  relation_type: string;
  relation_count: number;
};

type PeriodApiResponse = {
  ok: boolean;
  message?: string;
  rows: PeriodOption[];
  relationSummary?: RelationSummary[];
  updatedAt?: string;
};

function label(row: PeriodOption | null | undefined): string {
  if (!row) return "Ikke valgt";
  return row.display_name_no || row.period_slug;
}

function yearRange(row: PeriodOption | null | undefined): string {
  if (!row) return "";
  if (row.start_year === null && row.end_year === null) return "Tidsrom mangler";
  if (row.start_year !== null && row.end_year !== null) return `${row.start_year}–${row.end_year}`;
  if (row.start_year !== null) return `${row.start_year} →`;
  return `→ ${row.end_year}`;
}

function overlaps(parent: PeriodOption | null, child: PeriodOption): boolean {
  if (!parent) return true;
  if (child.parent_period_slug === parent.period_slug) return true;
  if (parent.start_year === null || child.start_year === null) return false;

  const parentEnd = parent.end_year ?? 999999;
  const childEnd = child.end_year ?? 999999;
  return child.start_year <= parentEnd && childEnd >= parent.start_year;
}

function uniqueBySlug(rows: PeriodOption[]): PeriodOption[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.period_slug)) return false;
    seen.add(row.period_slug);
    return true;
  });
}

function hasMeaningfulText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function segmentRows(segment: SegmentKey, selected: PeriodOption | null, relationSummary: RelationSummary[]) {
  const baseName = label(selected);
  if (segment === "samler") {
    return [
      ["Objektantall", relationSummary.length ? `${relationSummary.reduce((sum, row) => sum + row.relation_count, 0).toLocaleString("nb-NO")} relasjonskoblinger kontrollert` : "Hentes fra katalog/resultat-API"],
      ["Valør / utgave / variant", "Skal komme fra objekt- og relasjonsdata, ikke som egen hovedperiode"],
      ["Signatur / person", "Vises som relasjon når valgt node eller objekt har personkobling"],
      ["Kvalitet / sjeldenhet", "Vises når kilde- eller objektpresentasjonsview har verdier"],
      ["Samlingsrelevans", selected?.collectium_relevance_no || `Vurderes ut fra ${baseName}`],
      ["Relaterte objekter", selected?.relation_href ? `Kan åpne ${selected.relation_href}` : "Venter på relation_href eller objektliste"],
    ];
  }

  if (segment === "historie") {
    return [
      ["Periode", yearRange(selected) || "Tidsrom ikke valgt"],
      ["Regent / personer", "Skal vises som relasjonschips fra relasjons-API"],
      ["Historiske hendelser", "Hentes fra periode-/historie-views når koblet"],
      ["Kriger / sykdommer", "Overlappende relasjonsperioder, ikke egne Rad 1-hovedperioder"],
      ["Funn / proveniens", "Skal kunne være Rad 3-undernode eller relasjon"],
      ["Relasjonskart", selected?.relation_href || "Relasjonsside mangler/ikke koblet"],
    ];
  }

  return [
    ["Markedsverdi", "Vises bare når API har reell verdi. 0 kr skal ikke tolkes som verdi."],
    ["Prisobservasjoner", "Hentes fra markeds-/auksjons-/nettbutikkdata når tilgjengelig"],
    ["Trend", "Krever valgt trendperiode og prisgrunnlag"],
    ["Likviditet", "Beregnes fra observasjoner/transaksjoner når datagrunnlag finnes"],
    ["Valutakontekst / inflasjon", "Kobles mot index/finanshistorisk datagrunnlag"],
    ["Finanshistorisk kontekst", selected?.collectium_relevance_no || `Ikke beregnet for ${baseName}`],
  ];
}

export default function CollectiumPeriodFilterTest() {
  const [data, setData] = useState<PeriodApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow1Slug, setSelectedRow1Slug] = useState<string | null>(null);
  const [selectedRow2Slug, setSelectedRow2Slug] = useState<string | null>(null);
  const [selectedRow3Slug, setSelectedRow3Slug] = useState<string | null>(null);
  const [segment, setSegment] = useState<SegmentKey>("samler");

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

  const rows = data?.rows || [];
  const relationSummary = data?.relationSummary || [];

  const row1Options = useMemo(() => uniqueBySlug(rows.filter((row) => row.period_level === 1)), [rows]);
  const selectedRow1 = row1Options.find((row) => row.period_slug === selectedRow1Slug) || null;

  const row2Options = useMemo(() => {
    return uniqueBySlug(
      rows
        .filter((row) => row.period_level === 2)
        .filter((row) => row.period_slug !== selectedRow1Slug)
        .filter((row) => overlaps(selectedRow1, row)),
    );
  }, [rows, selectedRow1, selectedRow1Slug]);

  const selectedRow2 = row2Options.find((row) => row.period_slug === selectedRow2Slug) || null;

  const row3Options = useMemo(() => {
    const parent = selectedRow2 || selectedRow1;
    return uniqueBySlug(
      rows
        .filter((row) => row.period_level === 3)
        .filter((row) => row.period_slug !== selectedRow1Slug)
        .filter((row) => row.period_slug !== selectedRow2Slug)
        .filter((row) => overlaps(parent, row)),
    );
  }, [rows, selectedRow1, selectedRow2, selectedRow1Slug, selectedRow2Slug]);

  const selectedRow3 = row3Options.find((row) => row.period_slug === selectedRow3Slug) || null;
  const selectedNode = selectedRow3 || selectedRow2 || selectedRow1;
  const bioNode = selectedNode || null;
  const dynamicRows = segmentRows(segment, bioNode, relationSummary);

  function chooseRow1(slug: string) {
    setSelectedRow1Slug(slug);
    setSelectedRow2Slug(null);
    setSelectedRow3Slug(null);
  }

  function chooseRow2(slug: string) {
    setSelectedRow2Slug(slug);
    setSelectedRow3Slug(null);
  }

  function chooseRow3(slug: string) {
    setSelectedRow3Slug(slug);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Periodefilter · DB-test · UI/UX 8.6</p>
          <h1>Periodefilter</h1>
          <p>
            Testen bruker tre radnivåer: <strong>Nasjonal hovedperiode</strong>, <strong>Hovedperiode</strong> og <strong>Underperiode / relasjon</strong>. Valgt verdi fjernes fra lavere rader slik at samme node ikke kan velges flere ganger.
          </p>
        </div>
        <aside className={styles.statusBox}>
          <span className={loading ? styles.statusWarn : error ? styles.statusError : styles.statusOk}>
            {loading ? "Henter" : error ? "Feil" : "OK"}
          </span>
          <small>{data?.updatedAt ? `Oppdatert ${new Date(data.updatedAt).toLocaleString("nb-NO")}` : "Ingen tidsstempel"}</small>
        </aside>
      </section>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <section className={styles.grid}>
        <FilterRow
          title="Rad 1"
          subtitle="Nasjonal / overordnet hovedperiode"
          rows={row1Options}
          selectedSlug={selectedRow1Slug}
          onSelect={chooseRow1}
        />
        <FilterRow
          title="Rad 2"
          subtitle="Hovedperiode innenfor valgt Rad 1"
          rows={row2Options}
          selectedSlug={selectedRow2Slug}
          onSelect={chooseRow2}
          disabled={!selectedRow1}
          disabledText="Velg Rad 1 først"
        />
        <FilterRow
          title="Rad 3"
          subtitle="Underperiode / relasjon / objektperiode"
          rows={row3Options}
          selectedSlug={selectedRow3Slug}
          onSelect={chooseRow3}
          disabled={!selectedRow1 && !selectedRow2}
          disabledText="Velg Rad 1 eller Rad 2 først"
        />
      </section>

      <section className={styles.selectionPanel}>
        <div className={styles.pathBox}>
          <span>{label(selectedRow1)}</span>
          <span>→</span>
          <span>{label(selectedRow2)}</span>
          <span>→</span>
          <span>{label(selectedRow3)}</span>
        </div>
      </section>

      <section className={styles.dynamicGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>Dynamisk område 1</p>
            <h2>Bio / definisjon</h2>
          </div>

          {bioNode ? (
            <div className={styles.bioContent}>
              <h3>{label(bioNode)}</h3>
              <p className={styles.metaLine}>{bioNode.period_type_label_no || bioNode.period_type_key || "Periodetype mangler"} · {yearRange(bioNode)}</p>
              <BioQuestion title="Hva er dette?" value={bioNode.summary_short_no || "Kort definisjon mangler i periodedata."} />
              <BioQuestion title="Hvorfor er det viktig?" value={bioNode.collectium_relevance_no || "Collectium-relevans mangler i periodedata."} />
              <BioQuestion title="Når eksisterte det?" value={yearRange(bioNode)} />
              <BioQuestion title="Hvilke objekter er relatert?" value="Hentes via katalog-, objekt- og relasjons-API når perioden/relasjonen brukes i katalogen." />
              <BioQuestion title="Hva betyr det for samlere, historie og finans?" value="Se segmentpanelet til høyre. Innholdet skifter etter Samler, Historie og Finans." />
              {hasMeaningfulText(bioNode.relation_href) ? (
                <a className={styles.relationLink} href={bioNode.relation_href}>Åpne relasjon: {bioNode.relation_href}</a>
              ) : (
                <p className={styles.missing}>Relation_href mangler for valgt node.</p>
              )}
            </div>
          ) : (
            <p className={styles.empty}>Velg en node i Rad 1, Rad 2 eller Rad 3 for å vise Bio.</p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>Dynamisk område 2</p>
            <h2>Samler · Historie · Finans</h2>
          </div>
          <div className={styles.segmentSwitch} role="tablist" aria-label="Segment">
            <button type="button" data-active={segment === "samler"} onClick={() => setSegment("samler")}>Samler</button>
            <button type="button" data-active={segment === "historie"} onClick={() => setSegment("historie")}>Historie</button>
            <button type="button" data-active={segment === "finans"} onClick={() => setSegment("finans")}>Finans</button>
          </div>

          <div className={styles.factList}>
            {dynamicRows.map(([key, value]) => (
              <div className={styles.factRow} key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.eyebrow}>Kontroll</p>
          <h2>Relasjonstyper fra Norske sedler</h2>
        </div>
        {relationSummary.length ? (
          <div className={styles.relationGrid}>
            {relationSummary.map((row) => (
              <div className={styles.relationPill} key={row.relation_type}>
                <span>{row.relation_type}</span>
                <strong>{row.relation_count.toLocaleString("nb-NO")}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Relasjonsoppsummering er ikke tilgjengelig fra API-et.</p>
        )}
      </section>
    </main>
  );
}

function FilterRow(props: {
  title: string;
  subtitle: string;
  rows: PeriodOption[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  disabled?: boolean;
  disabledText?: string;
}) {
  return (
    <article className={styles.panel} data-disabled={props.disabled ? "true" : "false"}>
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>{props.title}</p>
        <h2>{props.subtitle}</h2>
      </div>
      {props.disabled ? <p className={styles.empty}>{props.disabledText}</p> : null}
      {!props.disabled && props.rows.length === 0 ? <p className={styles.empty}>Ingen tilgjengelige valg for denne raden.</p> : null}
      <div className={styles.optionList}>
        {props.rows.map((row) => (
          <button
            type="button"
            key={row.period_slug}
            data-active={props.selectedSlug === row.period_slug}
            onClick={() => props.onSelect(row.period_slug)}
          >
            <span>{label(row)}</span>
            <small>{row.period_type_label_no || row.period_type_key || "Ukjent type"} · {yearRange(row)}</small>
          </button>
        ))}
      </div>
    </article>
  );
}

function BioQuestion(props: { title: string; value: string }) {
  return (
    <div className={styles.bioQuestion}>
      <span>{props.title}</span>
      <p>{props.value}</p>
    </div>
  );
}
