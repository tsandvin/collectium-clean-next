"use client";

/**
 * CollectiumPeriodFilterTest
 * Purpose: React UI test for locked period filter + view cards.
 * Uses global Collectium skin variables when available and local fallbacks only.
 * No DB truth in frontend; data comes from /api/test/period-catalog.
 */

import { useEffect, useMemo, useState } from "react";
import type { CollectiumResultView, CollectiumSegment, PeriodCatalogObject, PeriodCatalogResponse } from "@/lib/collectium-period-card-types";
import styles from "./CollectiumPeriodFilterTest.module.css";

type RowSelector = "ruler" | "national" | "signature" | "finance" | "object" | "currency";

const rowLabels: Record<RowSelector, string> = {
  ruler: "Konge / regent",
  national: "Nasjonal periode",
  signature: "Signatur / person",
  finance: "Finans / marked",
  object: "Objekt / kilde",
  currency: "Valuta / metall",
};

const segmentLabels: Record<CollectiumSegment, string> = {
  samler: "Samler",
  historie: "Historie",
  finans: "Finans",
};

const viewLabels: Record<CollectiumResultView, string> = {
  liste: "Liste",
  horisontal: "Horisontal",
  museum: "Museum",
};

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
  { type: "signature", title: "O. B. BÃ¸ggild", from: 1883, to: 1899, tone: "purple" },
  { type: "signature", title: "J. H. L. Vogt", from: 1899, to: 1924, tone: "purple" },
  { type: "signature", title: "C. J. Hambro", from: 1924, to: 1945, tone: "purple" },
  { type: "signature", title: "Knut LiestÃ¸l", from: 1953, to: 2024, tone: "purple" },
  { type: "finance", title: "SÃ¸lvstandard", from: 1816, to: 1875, tone: "gray" },
  { type: "finance", title: "Gullstandard", from: 1875, to: 1914, tone: "gray" },
  { type: "finance", title: "KPI / moderne indeks", from: 1945, to: 2024, tone: "green" },
  { type: "object", title: "Norske sedler", from: 1814, to: 2024, tone: "blue" },
  { type: "currency", title: "Krone", from: 1875, to: 2024, tone: "teal" },
] as const;

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function yearNumber(row: PeriodCatalogObject) {
  const text = row.object_year_label || row.publication_year_label || "";
  const match = text.match(/[0-9]{3,4}/);
  return match ? Number(match[0]) : null;
}

function objectImage(row: PeriodCatalogObject) {
  return row.presentation_image_path || row.banknote_image_path || row.image_path;
}

function displayValue(row: PeriodCatalogObject) {
  const value = row.market_value_raw_no || row.value_raw_no;
  if (!value || value === "0" || value === "0 kr") return "Ikke estimert";
  return value;
}

function statusText(row: PeriodCatalogObject) {
  const value = row.market_value_raw_no || row.value_raw_no;
  if (!value || value === "0" || value === "0 kr") return "â†— 0 % pr mnd";
  return row.market_value_status_no || "Vurdert";
}

function DynamicField({ row, segment }: { row: PeriodCatalogObject; segment: CollectiumSegment }) {
  const relations = row.relations || [];
  const relation = (type: string) => relations.find((r) => r.relation_type === type)?.relation_label_no || relations.find((r) => r.relation_type === type)?.relation_slug || "Ikke registrert";

  const data = {
    samler: {
      icon: "â™¡",
      title: "Samler",
      rows: [
        ["Status", row.collection_status_raw_no || "Ikke i samling"],
        ["Sjeldenhet", row.rarity_raw_no || "Ikke registrert"],
        ["Kvalitet", row.grade_raw_no || "Ikke registrert"],
        ["Katalog", row.source_catalog_number || "Mangler"],
        ["Variant", row.variant_type_raw_no || "Mangler"],
        ["Handling", "Hjerte Â· stjerne Â· legg i samling"],
      ],
    },
    historie: {
      icon: "â–¥",
      title: "Historie",
      rows: [
        ["Regent", row.ruler_name_raw_no || relation("regent")],
        ["Ã…r", row.object_year_label || relation("ar")],
        ["Utgave", row.denomination_issue_raw_no || relation("utgave")],
        ["Signatur", row.signature_raw_no || relation("person")],
        ["Periode", row.historical_period_label_no || "Ikke registrert"],
        ["Relasjon", row.relation_href || relations[0]?.relation_href || "Mangler relation_href"],
      ],
    },
    finans: {
      icon: "âˆ‘",
      title: "Finans",
      rows: [
        ["Verdi", displayValue(row)],
        ["Trend", row.trend_raw_no || "Ikke beregnet"],
        ["Auksjon", row.auction_status_raw_no || "Ikke registrert"],
        ["Nettbutikk", row.shop_status_raw_no || "Ikke registrert"],
        ["Likviditet", "Mangler datagrunnlag"],
        ["Prisgrunnlag", row.market_value_status_no || "Mangler markedsverdi"],
      ],
    },
  }[segment];

  return (
    <section className={styles.dynamicField} data-segment={segment}>
      <div className={styles.dynamicIcon}>{data.icon}</div>
      <div className={styles.dynamicContent}>
        <h4>{data.title}</h4>
        <div className={styles.dynamicRows}>
          {data.rows.map(([label, value]) => (
            <div className={styles.dynamicRow} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BanknoteSurface({ row }: { row: PeriodCatalogObject }) {
  const image = objectImage(row);
  return (
    <div className={styles.banknoteSurface}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={row.title_no} />
      ) : (
        <>
          <strong>{row.denomination_raw_no?.replace(/[^0-9]/g, "") || "C"}</strong>
          <span>{row.source_key.replaceAll("_", " ")} Â· {row.ruler_name_raw_no || "Collectium"} Â· {row.object_year_label || "Ã¥r mangler"}</span>
        </>
      )}
    </div>
  );
}

function RightRail({ row }: { row: PeriodCatalogObject }) {
  return (
    <aside className={styles.rightRail}>
      <div className={styles.rightStats}>
        <div className={styles.rightStat}><i>â™¡</i><span>Hjerte<small>Ã˜nskeliste</small></span><strong>{row.wishlist_count}</strong></div>
        <div className={styles.rightStat}><i>â˜†</i><span>Stjerne<small>Favoritt</small></span><strong>{row.favorite_count}</strong></div>
        <div className={styles.rightStat}><i>âŒ˜</i><span>Auksjon<small>Aktive treff</small></span><strong>{row.auction_count}</strong></div>
        <div className={styles.rightStat}><i>â–£</i><span>Nettbutikk<small>Aktive salg</small></span><strong>{row.shop_count}</strong></div>
      </div>
      <div className={styles.pricePanel}>
        <span>Estimert pris</span>
        <strong>{displayValue(row)}</strong>
        <small>{statusText(row)}</small>
      </div>
    </aside>
  );
}

function ObjectCard({ row, segment, view }: { row: PeriodCatalogObject; segment: CollectiumSegment; view: CollectiumResultView }) {
  const href = `/objekt/${row.source_key}/${row.object_group}/${row.object_id}`;
  const isHorizontal = view === "horisontal";
  const isMuseum = view === "museum";

  if (isMuseum) {
    return (
      <article className={`${styles.objectCard} ${styles.museumCard}`}>
        <BanknoteSurface row={row} />
        <section className={styles.museumInfo}>
          <h3>Museum Â· {row.title_no}</h3>
          <dl>
            <div><dt>Periode</dt><dd>{row.historical_period_label_no || row.ruler_name_raw_no || "Ikke registrert"}</dd></div>
            <div><dt>Ã…rstall</dt><dd>{row.object_year_label || row.publication_year_label || "Mangler"}</dd></div>
            <div><dt>Regent</dt><dd>{row.ruler_name_raw_no || "Ikke registrert"}</dd></div>
            <div><dt>Relasjoner</dt><dd>{row.relations.length} koblinger</dd></div>
          </dl>
          <div className={styles.actionRow}>
            <a href={href}>Ã…pne objekt</a>
            {row.relation_href ? <a href={row.relation_href}>Se relasjon</a> : <button disabled>Relasjon mangler</button>}
          </div>
        </section>
      </article>
    );
  }

  if (isHorizontal) {
    return (
      <article className={`${styles.objectCard} ${styles.horizontalCard}`}>
        <div className={styles.horizontalLayout}>
          <div className={styles.horizontalLeft}>
            <div className={styles.topIdentity}>
              <BanknoteSurface row={row} />
              <section className={styles.cardMain}>
                <h3>{row.title_no}</h3>
                <div className={styles.fieldGrid}>
                  <div><span>ValÃ¸r</span><strong>{row.denomination_raw_no || "Mangler"}</strong></div>
                  <div><span>Ã…r</span><strong>{row.object_year_label || row.publication_year_label || "Mangler"}</strong></div>
                  <div><span>Utgave</span><strong>{row.denomination_issue_raw_no || "Mangler"}</strong></div>
                  <div><span>Variant</span><strong>{row.variant_type_raw_no || "Mangler"}</strong></div>
                </div>
                <p>{row.source_key} Â· {row.object_group} Â· {row.source_catalog_number || "uten katalognr."}</p>
              </section>
            </div>
            <DynamicField row={row} segment={segment} />
          </div>
          <RightRail row={row} />
        </div>
      </article>
    );
  }

  return (
    <article className={`${styles.objectCard} ${styles.listCard}`}>
      <div className={styles.topIdentity}>
        <BanknoteSurface row={row} />
        <section className={styles.cardMain}>
          <h3>{row.title_no}</h3>
          <div className={styles.fieldGrid}>
            <div><span>ValÃ¸r</span><strong>{row.denomination_raw_no || "Mangler"}</strong></div>
            <div><span>Ã…r</span><strong>{row.object_year_label || row.publication_year_label || "Mangler"}</strong></div>
            <div><span>Utgave</span><strong>{row.denomination_issue_raw_no || "Mangler"}</strong></div>
            <div><span>Sjeldenhet</span><strong>{row.rarity_raw_no || "Mangler"}</strong></div>
          </div>
          <div className={styles.actionRow}>
            <a href={href}>Ã…pne objekt</a>
            {row.relation_href ? <a href={row.relation_href}>Se relasjon</a> : <button disabled>Relasjon mangler</button>}
            <button>Legg i samling</button>
          </div>
        </section>
        <RightRail row={row} />
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

  const query = useMemo(() => {
    const p = new URLSearchParams({
      sourceKey,
      objectGroup,
      yearFrom: String(yearFrom),
      yearTo: String(yearTo),
      segment,
      view,
      limit: "24",
    });
    return p.toString();
  }, [sourceKey, objectGroup, yearFrom, yearTo, segment, view]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/test/period-catalog?${query}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: PeriodCatalogResponse) => {
        if (alive) setData(json);
      })
      .catch((error) => {
        if (alive) setData({ ok: false, source: "fallback", message: String(error), filters: { sourceKey, objectGroup, yearFrom, yearTo, segment, view }, rows: [] });
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [query, sourceKey, objectGroup, yearFrom, yearTo, segment, view]);

  const ticks = useMemo(() => {
    const span = Math.max(1, yearTo - yearFrom);
    return Array.from({ length: 8 }, (_, i) => Math.round(yearFrom + (span / 7) * i));
  }, [yearFrom, yearTo]);

  const visiblePeriodRows = useMemo(() => {
    const wanted = [row1, row2, row3];
    return wanted.map((type) => ({ type, label: rowLabels[type], items: periodRows.filter((row) => row.type === type && row.to >= yearFrom && row.from <= yearTo) }));
  }, [row1, row2, row3, yearFrom, yearTo]);

  const rows = data?.rows ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Periodefilter Â· DB-test</h1>
          <p>Layout og design er lÃ¥st. Denne siden leser virkelige verdier via API nÃ¥r DB er koblet.</p>
        </div>
        <div className={styles.dbStatus} data-ok={data?.source === "db"}>
          <strong>{loading ? "Laster" : data?.source === "db" ? "DB OK" : "Fallback"}</strong>
          <span>{data?.message || "Venter pÃ¥ API"}</span>
        </div>
      </header>

      <section className={styles.filterPanel}>
        <div className={styles.masterGrid}>
          <label> Kilde <select value={sourceKey} onChange={(e) => setSourceKey(e.target.value)}><option value="norske_sedler">Norske sedler</option></select></label>
          <label> Objektgruppe <select value={objectGroup} onChange={(e) => setObjectGroup(e.target.value)}><option value="banknote">Banknote</option><option value="coin">Coin</option></select></label>
          <label> Ã…r fra <input type="number" value={yearFrom} onChange={(e) => setYearFrom(Number(e.target.value))} /></label>
          <label> Ã…r til <input type="number" value={yearTo} onChange={(e) => setYearTo(Number(e.target.value))} /></label>
        </div>
        <div className={styles.derivedRows}>
          <label>Rad 1 Â· objekt/enhet<select value={row1} onChange={(e) => setRow1(e.target.value as RowSelector)}>{Object.entries(rowLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><small>Land: Norge Â· Objekt: {objectGroup}</small></label>
          <label>Rad 2 Â· periodeverdi<select value={row2} onChange={(e) => setRow2(e.target.value as RowSelector)}>{Object.entries(rowLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><small>Valgt periode: {yearFrom}â€“{yearTo}</small></label>
          <label>Rad 3 Â· periodeverdi<select value={row3} onChange={(e) => setRow3(e.target.value as RowSelector)}>{Object.entries(rowLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><small>Resultat: {rows.length} treff</small></label>
        </div>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.segmentTabs}>{(["samler", "historie", "finans"] as CollectiumSegment[]).map((s) => <button key={s} className={segment === s ? styles.active : ""} onClick={() => setSegment(s)}>{segmentLabels[s]}</button>)}</div>
        <h2>Periodens tidslinje</h2>
        <div className={styles.timeline}>
          {visiblePeriodRows.map((lane) => (
            <div className={styles.laneRow} key={lane.type}>
              <strong>{lane.label}</strong>
              <div className={styles.laneTrack}>
                {lane.items.map((item) => {
                  const left = clampPct(((Math.max(item.from, yearFrom) - yearFrom) / Math.max(1, yearTo - yearFrom)) * 100);
                  const right = clampPct(((Math.min(item.to, yearTo) - yearFrom) / Math.max(1, yearTo - yearFrom)) * 100);
                  return <span key={`${item.type}-${item.title}`} className={`${styles.periodBox} ${styles[item.tone]}`} style={{ left: `${left}%`, width: `${Math.max(4, right - left)}%` }}>{item.title}<small>{item.from}â€“{item.to}</small></span>;
                })}
              </div>
            </div>
          ))}
          <div className={styles.yearAxis}>{ticks.map((t) => <span key={t}>{t}</span>)}</div>
        </div>
      </section>

      <section className={styles.resultsPanel}>
        <div className={styles.resultHeader}>
          <div>
            <h2>Katalogresultat</h2>
            <p>{sourceKey} Â· {objectGroup} Â· {yearFrom}â€“{yearTo} Â· {rows.length} treff</p>
          </div>
          <div className={styles.viewTabs}>{(["liste", "horisontal", "museum"] as CollectiumResultView[]).map((v) => <button key={v} className={view === v ? styles.active : ""} onClick={() => setView(v)}>{viewLabels[v]}</button>)}</div>
        </div>

        <div className={styles.cardGrid} data-view={view}>
          {rows.length ? rows.map((row) => <ObjectCard key={`${row.source_key}-${row.object_group}-${row.object_id}`} row={row} segment={segment} view={view} />) : <div className={styles.empty}>Ingen objekter i valgt tidsrom. Endre Ã¥r eller kontroller API/DB.</div>}
        </div>
      </section>
    </main>
  );
}
