"use client";

import { useEffect, useMemo, useState } from "react";
import type { CollectiumResultView, CollectiumSegment, PeriodCatalogObject, PeriodCatalogResponse } from "@/lib/collectium-period-card-types";
import styles from "./CollectiumPeriodFilterTest.module.css";

type RowSelector = "ruler" | "national" | "signature";

const segmentLabels: Record<CollectiumSegment, string> = { samler: "Samler", historie: "Historie", finans: "Finans" };
const viewLabels: Record<CollectiumResultView, string> = { liste: "Liste", horisontal: "Horisontal", museum: "Museum" };
const rowLabels: Record<RowSelector, string> = { ruler: "Konge / regent", national: "Nasjonal periode", signature: "Signatur / person" };

const periodRows = [
  { type: "ruler", title: "Karl XIV Johan", from: 1814, to: 1844, tone: "gold" },
  { type: "ruler", title: "Oscar I", from: 1844, to: 1859, tone: "gold" },
  { type: "ruler", title: "Oscar II", from: 1872, to: 1905, tone: "green" },
  { type: "ruler", title: "Haakon VII", from: 1905, to: 1957, tone: "teal" },
  { type: "ruler", title: "Olav V", from: 1957, to: 1991, tone: "blue" },
  { type: "ruler", title: "Harald V", from: 1991, to: 2024, tone: "purple" },
  { type: "national", title: "Union med Sverige", from: 1814, to: 1905, tone: "sand" },
  { type: "national", title: "Selvstendig Norge", from: 1905, to: 1940, tone: "blueSoft" },
  { type: "national", title: "Andre verdenskrig", from: 1940, to: 1945, tone: "red" },
  { type: "national", title: "Etterkrigstiden", from: 1945, to: 2024, tone: "blueSoft" },
  { type: "signature", title: "J. S. Christie", from: 1871, to: 1883, tone: "purple" },
  { type: "signature", title: "O. B. Boggild", from: 1883, to: 1899, tone: "purple" },
  { type: "signature", title: "J. H. L. Vogt", from: 1899, to: 1924, tone: "purple" },
  { type: "signature", title: "C. J. Hambro", from: 1924, to: 1945, tone: "purple" },
  { type: "signature", title: "Knut Liestol", from: 1953, to: 2024, tone: "purple" },
] as const;

function pct(year: number, from: number, to: number) {
  const span = Math.max(1, to - from);
  return Math.max(0, Math.min(100, ((year - from) / span) * 100));
}

function displayValue(row: PeriodCatalogObject) {
  const value = row.market_value_raw_no || row.value_raw_no;
  if (!value || value === "0" || value === "0 kr") return "Ikke estimert";
  return value;
}

function banknoteLabel(row: PeriodCatalogObject) {
  if (row.object_group === "coin") return "MYNT";
  if (row.object_group === "security") return "VERDIBREV";
  return "NORSKE SEDLER";
}

function dynamicRows(row: PeriodCatalogObject, segment: CollectiumSegment) {
  if (segment === "samler") {
    return [
      ["Status", row.collection_status_raw_no || "Ikke i samling"],
      ["Sjeldenhet", row.rarity_raw_no || "Ikke vurdert"],
      ["Katalog", row.source_catalog_number || "Mangler"],
      ["Objekttype", row.object_group],
      ["Variant", row.variant_type_raw_no || "Standard"],
      ["Merknad", "Samlerfeltet viser brukerstatus og katalogiske nokkeltall."],
    ];
  }
  if (segment === "finans") {
    return [
      ["Verdi", displayValue(row)],
      ["Trend", row.trend_raw_no || "Ikke beregnet"],
      ["Auksjon", row.auction_status_raw_no || "Ingen data"],
      ["Nettbutikk", row.shop_status_raw_no || "Ingen data"],
      ["Status", row.market_value_status_no || "Ikke estimert"],
      ["Merknad", "Finansfeltet viser verdi, marked, trend og likviditet."],
    ];
  }
  return [
    ["Regent", row.ruler_name_raw_no || "Ikke registrert"],
    ["Ar", row.object_year_label || row.publication_year_label || "Mangler"],
    ["Utgave", row.denomination_issue_raw_no || "Mangler"],
    ["Signatur", row.signature_raw_no || "Ikke registrert"],
    ["Periode", row.historical_period_label_no || "Mangler"],
    ["Relasjon", row.relation_href || "Mangler relasjon"],
  ];
}

function ObjectCard({ row, view, segment }: { row: PeriodCatalogObject; view: CollectiumResultView; segment: CollectiumSegment }) {
  const href = `/objekt/${row.source_key}/${row.object_group}/${row.object_id}?segment=${segment}&from=periodefilter&view=${view}`;
  const fields = [
    ["Valor", row.denomination_raw_no || row.title_no],
    ["Ar", row.object_year_label || row.publication_year_label || "-"],
    ["Utgave", row.denomination_issue_raw_no || "-"],
    ["Variant", row.variant_type_raw_no || "-"],
  ];

  if (view === "museum") {
    return (
      <article className={`${styles.objectCard} ${styles.museumCard}`}>
        <div className={styles.banknoteSurface}><strong>100</strong><span>{banknoteLabel(row)}</span></div>
        <div className={styles.museumInfo}>
          <h3>{row.title_no}</h3>
          <p>{row.source_key} - {row.object_group} - {row.source_catalog_number}</p>
          <div className={styles.dynamicRows}>{dynamicRows(row, "historie").map(([k, v]) => <div key={k} className={styles.dynamicRow}><span>{k}</span><strong>{v}</strong></div>)}</div>
          <div className={styles.actionRow}><a href={href}>Apne objekt</a><a href={row.relation_href || href}>Se relasjon</a></div>
        </div>
      </article>
    );
  }

  return (
    <article className={`${styles.objectCard} ${view === "horisontal" ? styles.horizontalCard : styles.listCard}`}>
      <div className={view === "horisontal" ? styles.horizontalLayout : undefined}>
        <div className={styles.horizontalLeft}>
          <div className={styles.topIdentity}>
            <div className={styles.banknoteSurface}><strong>100</strong><span>{banknoteLabel(row)} - {row.object_year_label}</span></div>
            <div className={styles.cardMain}>
              <h3>{row.title_no}</h3>
              <div className={styles.fieldGrid}>{fields.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
              <p>{row.source_key} - {row.object_group} - {row.source_catalog_number || `ID ${row.object_id}`}</p>
              {view !== "horisontal" && <div className={styles.actionRow}><a href={href}>Apne objekt</a><a href={row.relation_href || href}>Se relasjon</a><button>Legg i samling</button></div>}
            </div>
          </div>
          {view === "horisontal" && (
            <div className={styles.dynamicField}>
              <div className={styles.dynamicIcon}>{segment === "finans" ? "F" : segment === "historie" ? "H" : "S"}</div>
              <div className={styles.dynamicContent}>
                <h4>{segmentLabels[segment]}</h4>
                <div className={styles.dynamicRows}>{dynamicRows(row, segment).map(([k, v]) => <div key={k} className={styles.dynamicRow}><span>{k}</span><strong>{v}</strong></div>)}</div>
              </div>
            </div>
          )}
        </div>
        {view === "horisontal" && (
          <aside className={styles.rightRail}>
            <div className={styles.rightStats}>
              <div className={styles.rightStat}><span>H</span><span>Hjerte</span><strong>{row.wishlist_count}</strong></div>
              <div className={styles.rightStat}><span>S</span><span>Stjerne</span><strong>{row.favorite_count}</strong></div>
              <div className={styles.rightStat}><span>A</span><span>Auksjon</span><strong>{row.auction_count}</strong></div>
              <div className={styles.rightStat}><span>N</span><span>Nettbutikk</span><strong>{row.shop_count}</strong></div>
            </div>
            <div className={styles.pricePanel}><span>Estimert pris</span><strong>{displayValue(row)}</strong><small>{row.market_value_status_no || "Ikke estimert"}</small></div>
          </aside>
        )}
      </div>
    </article>
  );
}

export default function CollectiumPeriodFilterTest() {
  const [segment, setSegment] = useState<CollectiumSegment>("historie");
  const [view, setView] = useState<CollectiumResultView>("horisontal");
  const [sourceKey, setSourceKey] = useState("norske_sedler");
  const [objectGroup, setObjectGroup] = useState("banknote");
  const [yearFrom, setYearFrom] = useState(1814);
  const [yearTo, setYearTo] = useState(2024);
  const [row1, setRow1] = useState<RowSelector>("ruler");
  const [row2, setRow2] = useState<RowSelector>("national");
  const [row3, setRow3] = useState<RowSelector>("signature");
  const [data, setData] = useState<PeriodCatalogResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ sourceKey, objectGroup, yearFrom: String(yearFrom), yearTo: String(yearTo), segment, view, limit: "24" });
    fetch(`/api/test/period-catalog?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json: PeriodCatalogResponse) => setData(json))
      .catch((error) => {
        if (error?.name !== "AbortError") setData(null);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [sourceKey, objectGroup, yearFrom, yearTo, segment, view]);

  const selectedRows = useMemo(() => [row1, row2, row3], [row1, row2, row3]);
  const rows = data?.rows ?? [];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Periodefilter - DB-test</h1>
          <p>Layout og design er globalt styrt. Denne siden leser verdier via API nar DB er koblet.</p>
        </div>
        <div className={styles.dbStatus} data-ok={data?.ok === true}><strong>{data?.source === "db" ? "DB aktiv" : "Fallback"}</strong><span>{loading ? "Laster..." : data?.message || "Venter pa API"}</span></div>
      </header>

      <section className={styles.filterPanel}>
        <div className={styles.masterGrid}>
          <label>Kilde<select value={sourceKey} onChange={(e) => setSourceKey(e.target.value)}><option value="norske_sedler">Norske sedler</option></select></label>
          <label>Objektgruppe<select value={objectGroup} onChange={(e) => setObjectGroup(e.target.value)}><option value="banknote">Banknote</option><option value="coin">Coin</option><option value="security">Verdibrev</option></select></label>
          <label>Ar fra<input value={yearFrom} onChange={(e) => setYearFrom(Number(e.target.value) || 1814)} /></label>
          <label>Ar til<input value={yearTo} onChange={(e) => setYearTo(Number(e.target.value) || 2024)} /></label>
        </div>
        <div className={styles.derivedRows}>
          <label>Rad 1<select value={row1} onChange={(e) => setRow1(e.target.value as RowSelector)}><option value="ruler">Konge / regent</option><option value="national">Nasjonal periode</option><option value="signature">Signatur / person</option></select></label>
          <label>Rad 2<select value={row2} onChange={(e) => setRow2(e.target.value as RowSelector)}><option value="ruler">Konge / regent</option><option value="national">Nasjonal periode</option><option value="signature">Signatur / person</option></select></label>
          <label>Rad 3<select value={row3} onChange={(e) => setRow3(e.target.value as RowSelector)}><option value="ruler">Konge / regent</option><option value="national">Nasjonal periode</option><option value="signature">Signatur / person</option></select></label>
        </div>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.segmentTabs}>{(["samler", "historie", "finans"] as CollectiumSegment[]).map((item) => <button key={item} className={item === segment ? styles.active : ""} onClick={() => setSegment(item)}>{segmentLabels[item]}</button>)}</div>
        <div className={styles.timeline}>
          <h2>Periodens tidslinje</h2>
          {selectedRows.map((type) => <div key={type} className={styles.laneRow}><span>{rowLabels[type]}</span><div className={styles.laneTrack}>{periodRows.filter((p) => p.type === type).map((p) => <div key={p.title} className={styles.periodBox} data-tone={p.tone} style={{ left: `${pct(p.from, yearFrom, yearTo)}%`, width: `${Math.max(6, pct(p.to, yearFrom, yearTo) - pct(p.from, yearFrom, yearTo))}%` }}>{p.title}</div>)}</div></div>)}
          <div className={styles.yearAxis}>{[1814, 1844, 1874, 1904, 1934, 1964, 1994, 2024].map((year) => <span key={year}>{year}</span>)}</div>
        </div>
      </section>

      <section className={styles.resultsPanel}>
        <div className={styles.resultHeader}>
          <div><h2>Katalogresultat</h2><p>{sourceKey} - {objectGroup} - {yearFrom}-{yearTo} - {rows.length} treff</p></div>
          <div className={styles.viewTabs}>{(["liste", "horisontal", "museum"] as CollectiumResultView[]).map((item) => <button key={item} className={item === view ? styles.active : ""} onClick={() => setView(item)}>{viewLabels[item]}</button>)}</div>
        </div>
        <div className={styles.cardGrid}>{rows.length ? rows.map((row) => <ObjectCard key={`${row.source_key}-${row.object_group}-${row.object_id}`} row={row} view={view} segment={segment} />) : <div className={styles.empty}>Ingen treff i valgt periode.</div>}</div>
      </section>
    </section>
  );
}
