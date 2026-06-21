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

import { useEffect, useMemo, useState } from "react";
import styles from "./CollectiumObjectPresentationClient.module.css";

type Tab = "samler" | "historie" | "finans" | "samling" | "relasjoner";
type Mode = "objekt" | "museum" | "kompakt" | "finans";
type Membership = "guest" | "free" | "bronze" | "silver" | "gold" | "platinum";
type ImageSourceMode = "collectium" | "own";
type ImageRole =
  | "forside"
  | "bakside"
  | "gjennomlysning"
  | "variant"
  | "detalj";

type GradingOption = {
  key: string;
  label: string;
  count: number;
  rarityTitleNo?: string;
  collectiumDescriptionNo?: string;
  gradeTitleNo?: string;
  gradeNameEn?: string;
  qualityLabelNo?: string;
};

type TimelineItem = {
  label: string;
  sub: string;
  startYear: number;
  endYear: number;
  href: string;
  lane: "regent" | "history" | "finance" | "object";
  match: (item: ObjectItem) => boolean;
};

type OwnImage = {
  id: string;
  role: ImageRole;
  label: string;
  url: string;
  description: string;
};

type ChangeLogEntry = {
  id: string;
  field: string;
  value: string;
  at: string;
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
  {
    objectId: "9",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 1005",
    title: "10 kroner · 1979 · 1 005 · BH",
    denomination: "10 kroner",
    year: "1979",
    litra: "BH",
    issue: "5. utgave (1966-1983)",
    variant: "Standardutgave",
    signatures: "Getz Wold / Sagård",
    regent: "Olav V",
    regentPeriod: "1957-1991",
    rarity: "Vanlig",
    quantity: "4 939 000",
    noteNumber: "10",
    noteText: "Norges Bank · Olav V · 1979",
    serial: "BH 1 005",
  },
  {
    objectId: "1459",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 1459",
    title: "100 kroner · 1. utgave · 1877 · Seddelpapir",
    denomination: "100 kroner",
    year: "1877",
    litra: "A",
    issue: "1. utgave",
    variant: "Standardutgave",
    signatures: "Winge / Getz",
    regent: "Oscar II",
    regentPeriod: "1872-1905",
    rarity: "RRR",
    quantity: "Ekstremt sjelden",
    noteNumber: "100",
    noteText: "Norges Bank · Oscar II · 1877",
    serial: "A 045 921",
  },
  {
    objectId: "23",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 23a",
    title: "1 krone · 1917 · Litra A",
    denomination: "1 krone",
    year: "1917",
    litra: "A",
    issue: "2. utgave",
    variant: "Litra A",
    signatures: "Direktør / kasserer",
    regent: "Haakon VII",
    regentPeriod: "1905-1957",
    rarity: "Sjelden",
    quantity: "Lav",
    noteNumber: "1",
    noteText: "Norges Bank · Haakon VII · 1917",
    serial: "A 023",
  },
  {
    objectId: "44",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 44",
    title: "5 kroner · 1942 · London",
    denomination: "5 kroner",
    year: "1942",
    litra: "L",
    issue: "Krigsutgave",
    variant: "London",
    signatures: "Regjeringen i London",
    regent: "Haakon VII",
    regentPeriod: "1905-1957",
    rarity: "Sjelden",
    quantity: "Krigsperiode",
    noteNumber: "5",
    noteText: "Norges Bank · London · 1942",
    serial: "L 1942",
  },
  {
    objectId: "71",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 71",
    title: "50 kroner · 1948 · etterkrig",
    denomination: "50 kroner",
    year: "1948",
    litra: "B",
    issue: "Etterkrigsutgave",
    variant: "Standard",
    signatures: "Norges Bank",
    regent: "Haakon VII",
    regentPeriod: "1905-1957",
    rarity: "Normal",
    quantity: "Middels",
    noteNumber: "50",
    noteText: "Norges Bank · Haakon VII · 1948",
    serial: "B 071",
  },
  {
    objectId: "110",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 110",
    title: "100 kroner · 1964 · Olav V",
    denomination: "100 kroner",
    year: "1964",
    litra: "C",
    issue: "4. utgave",
    variant: "Standard",
    signatures: "Norges Bank",
    regent: "Olav V",
    regentPeriod: "1957-1991",
    rarity: "Normal",
    quantity: "Middels",
    noteNumber: "100",
    noteText: "Norges Bank · Olav V · 1964",
    serial: "C 110",
  },
  {
    objectId: "190",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 190",
    title: "500 kroner · 1976 · skipsmotiv",
    denomination: "500 kroner",
    year: "1976",
    litra: "D",
    issue: "5. utgave",
    variant: "Skipsmotiv",
    signatures: "Norges Bank",
    regent: "Olav V",
    regentPeriod: "1957-1991",
    rarity: "Sjelden",
    quantity: "Begrenset",
    noteNumber: "500",
    noteText: "Norges Bank · Olav V · 1976",
    serial: "D 190",
  },
  {
    objectId: "240",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 240",
    title: "1000 kroner · 1982 · 5. utgave",
    denomination: "1000 kroner",
    year: "1982",
    litra: "E",
    issue: "5. utgave",
    variant: "Standard",
    signatures: "Norges Bank",
    regent: "Olav V",
    regentPeriod: "1957-1991",
    rarity: "Sjelden",
    quantity: "Lav",
    noteNumber: "1000",
    noteText: "Norges Bank · Olav V · 1982",
    serial: "E 240",
  },
  {
    objectId: "310",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 310",
    title: "50 kroner · 1991 · Harald V",
    denomination: "50 kroner",
    year: "1991",
    litra: "F",
    issue: "6. utgave",
    variant: "Modernisert",
    signatures: "Norges Bank",
    regent: "Harald V",
    regentPeriod: "1991-",
    rarity: "Normal",
    quantity: "Høy",
    noteNumber: "50",
    noteText: "Norges Bank · Harald V · 1991",
    serial: "F 310",
  },
  {
    objectId: "420",
    sourceKey: "norske_sedler",
    objectGroup: "banknote",
    catalogNumber: "NS 420",
    title: "200 kroner · 1994 · moderne serie",
    denomination: "200 kroner",
    year: "1994",
    litra: "G",
    issue: "7. utgave",
    variant: "Moderne",
    signatures: "Norges Bank",
    regent: "Harald V",
    regentPeriod: "1991-",
    rarity: "Normal",
    quantity: "Høy",
    noteNumber: "200",
    noteText: "Norges Bank · Harald V · 1994",
    serial: "G 420",
  },
];

const timelineItems: TimelineItem[] = [
  {
    label: "Oscar II",
    sub: "1872-1905 · svensk-norsk union",
    startYear: 1872,
    endYear: 1905,
    href: "/relasjon/regent/oscar-ii",
    lane: "regent",
    match: (item) => item.regent === "Oscar II",
  },
  {
    label: "Haakon VII",
    sub: "1905-1957 · selvstendig Norge",
    startYear: 1905,
    endYear: 1957,
    href: "/relasjon/regent/haakon-vii",
    lane: "regent",
    match: (item) => item.regent === "Haakon VII",
  },
  {
    label: "Olav V",
    sub: "1957-1991 · etterkrig/oljealder",
    startYear: 1957,
    endYear: 1991,
    href: "/relasjon/regent/olav-v",
    lane: "regent",
    match: (item) => item.regent === "Olav V",
  },
  {
    label: "Harald V",
    sub: "1991- · moderne Norge",
    startYear: 1991,
    endYear: 2024,
    href: "/relasjon/regent/harald-v",
    lane: "regent",
    match: (item) => item.regent === "Harald V",
  },
  {
    label: "Unionstid",
    sub: "1814-1905 · politisk periode",
    startYear: 1814,
    endYear: 1905,
    href: "/relasjon/periode/unionstid",
    lane: "history",
    match: (item) => Number(item.year) <= 1905,
  },
  {
    label: "Selvstendig Norge",
    sub: "1905-2024 · nasjonal periode",
    startYear: 1905,
    endYear: 2024,
    href: "/relasjon/periode/selvstendig-norge",
    lane: "history",
    match: (item) => Number(item.year) > 1905,
  },
  {
    label: "Bank- og pengehistorie",
    sub: "1816-1905",
    startYear: 1816,
    endYear: 1905,
    href: "/relasjon/finans/bank-og-pengehistorie",
    lane: "finance",
    match: (item) => Number(item.year) < 1905,
  },
  {
    label: "Mellomkrig / krigsøkonomi",
    sub: "1918-1945",
    startYear: 1918,
    endYear: 1945,
    href: "/relasjon/finans/krigsokonomi",
    lane: "finance",
    match: (item) => Number(item.year) >= 1918 && Number(item.year) <= 1945,
  },
  {
    label: "Olje- og velferdsperiode",
    sub: "1969-1990",
    startYear: 1969,
    endYear: 1990,
    href: "/relasjon/finans/oljealder",
    lane: "finance",
    match: (item) => Number(item.year) >= 1969 && Number(item.year) < 1991,
  },
];

const issuePeriodByIssue: Record<
  string,
  { startYear: number; endYear: number; href: string }
> = {
  "1. utgave": {
    startYear: 1877,
    endYear: 1901,
    href: "/relasjon/utgave/1-utgave",
  },
  "2. utgave": {
    startYear: 1901,
    endYear: 1945,
    href: "/relasjon/utgave/2-utgave",
  },
  Krigsutgave: {
    startYear: 1940,
    endYear: 1945,
    href: "/relasjon/utgave/krigsutgave",
  },
  Etterkrigsutgave: {
    startYear: 1945,
    endYear: 1962,
    href: "/relasjon/utgave/etterkrigsutgave",
  },
  "4. utgave": {
    startYear: 1948,
    endYear: 1976,
    href: "/relasjon/utgave/4-utgave",
  },
  "5. utgave": {
    startYear: 1966,
    endYear: 1983,
    href: "/relasjon/utgave/5-utgave-1966-1983",
  },
  "5. utgave (1966-1983)": {
    startYear: 1966,
    endYear: 1983,
    href: "/relasjon/utgave/5-utgave-1966-1983",
  },
  "6. utgave": {
    startYear: 1991,
    endYear: 2001,
    href: "/relasjon/utgave/6-utgave",
  },
  "7. utgave": {
    startYear: 1994,
    endYear: 2017,
    href: "/relasjon/utgave/7-utgave",
  },
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function timelineStyle(
  startYear: number,
  endYear: number,
  horizonStart: number,
  horizonEnd: number,
) {
  const span = Math.max(1, horizonEnd - horizonStart);
  const visibleStart = Math.max(startYear, horizonStart);
  const visibleEnd = Math.min(endYear, horizonEnd);
  const left = clampPercent(((visibleStart - horizonStart) / span) * 100);
  const right = clampPercent(((visibleEnd - horizonStart) / span) * 100);
  return { left: `${left}%`, width: `${Math.max(2, right - left)}%` };
}

function makeTimelineTicks(start: number, end: number) {
  const span = end - start;
  return Array.from({ length: 6 }, (_, index) =>
    Math.round(start + (span / 5) * index),
  );
}

const imageRoles: Array<{
  key: ImageRole;
  label: string;
  description: string;
}> = [
  {
    key: "forside",
    label: "Forside",
    description: "Hovedbilde/front fra valgt bildekilde.",
  },
  {
    key: "bakside",
    label: "Bakside",
    description: "Bakside/revers for objektet.",
  },
  {
    key: "gjennomlysning",
    label: "Gjennomlysning",
    description:
      "Gjennomlysning/transmitted light for kontroll av papir og vannmerke.",
  },
  {
    key: "variant",
    label: "Variant",
    description: "Variant-/detaljbilde koblet til utgave eller litra.",
  },
  {
    key: "detalj",
    label: "Detalj",
    description:
      "Detaljbilde av kvalitet, skade, signatur, hjørne eller annen observasjon.",
  },
];

const banknoteGradingOptions: GradingOption[] = [
  {
    key: "banknote_unc",
    label: "UNC / Usirkulert",
    count: 12,
    rarityTitleNo: "Usirkulert",
    collectiumDescriptionNo:
      "Seddel uten synlig sirkulasjonsslitasje. Kontroller hjørner, press, vask, rifter og lysgjennomgang.",
    qualityLabelNo: "Seddel · topp kvalitet",
  },
  {
    key: "banknote_01",
    label: "01 / Nesten usirkulert",
    count: 31,
    rarityTitleNo: "Nesten usirkulert",
    collectiumDescriptionNo:
      "Svært høy kvalitet med minimal håndtering. Små merker eller svak fold kan forekomme.",
    qualityLabelNo: "Seddel · høy kvalitet",
  },
  {
    key: "banknote_1plus",
    label: "1+ / Pen sirkulert",
    count: 64,
    rarityTitleNo: "Pen sirkulert",
    collectiumDescriptionNo:
      "Sirkulert seddel med tydelige, men moderate bruksspor. Kontroller flekker, hjørner og papirfølelse.",
    qualityLabelNo: "Seddel · samlerkvalitet",
  },
  {
    key: "banknote_1",
    label: "1 / Sirkulert",
    count: 108,
    rarityTitleNo: "Sirkulert",
    collectiumDescriptionNo:
      "Vanlig sirkulert kvalitet. Slitasje, folder og mindre merker må beskrives i tilstandsmerknad.",
    qualityLabelNo: "Seddel · sirkulert",
  },
  {
    key: "banknote_2",
    label: "2 / Svak kvalitet",
    count: 17,
    rarityTitleNo: "Svak kvalitet",
    collectiumDescriptionNo:
      "Betydelig slitasje eller skader. Dokumenter rifter, hull, tape, vask, restaurering og mangler.",
    qualityLabelNo: "Seddel · skadet/slitt",
  },
];

const coinGradingOptions: GradingOption[] = [
  {
    key: "coin_unc",
    label: "UNC / MS",
    count: 9,
    gradeTitleNo: "Usirkulert",
    gradeNameEn: "Uncirculated",
    qualityLabelNo: "Mynt · usirkulert",
  },
  {
    key: "coin_xf",
    label: "XF / 01",
    count: 27,
    gradeTitleNo: "Svært pen",
    gradeNameEn: "Extremely Fine",
    qualityLabelNo: "Mynt · høy kvalitet",
  },
  {
    key: "coin_vf",
    label: "VF / 1+",
    count: 73,
    gradeTitleNo: "Pen",
    gradeNameEn: "Very Fine",
    qualityLabelNo: "Mynt · samlerkvalitet",
  },
  {
    key: "coin_f",
    label: "F / 1",
    count: 101,
    gradeTitleNo: "Sirkulert",
    gradeNameEn: "Fine",
    qualityLabelNo: "Mynt · sirkulert",
  },
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

function Field({
  label,
  value,
  required,
  membership,
  href,
}: {
  label: string;
  value?: string | number | null;
  required: Membership;
  membership: Membership;
  href?: string;
}) {
  const allowed = canSee(membership, required);
  const displayValue = value === null || value === undefined || value === "" ? "Ikke registrert" : value;

  return (
    <div className={styles.field}>
      <span>{label}</span>
      <strong>
        {allowed ? (
          href ? (
            <a href={href}>{displayValue}</a>
          ) : (
            displayValue
          )
        ) : (
          "Tomt felt · krever Bronze+"
        )}
      </strong>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  required = "bronze",
  membership,
  placeholder = "Ikke registrert",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: Membership;
  membership: Membership;
  placeholder?: string;
}) {
  const allowed = canSee(membership, required);
}
  return (
    <label
      className={`${styles.editField} ${!allowed ? styles.editFieldLocked : ""}`}
    >
      <span>{label}</span>
      <input
        value={allowed ? value : ""}
        placeholder={allowed ? placeholder : "Låst · krever Bronze+"}
        disabled={!allowed}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = "bronze",
  membership,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ key: string; label: string; count?: number }>;
  required?: Membership;
  membership: Membership;
  helper?: string;
}) {
  const allowed = canSee(membership, required);
}
  return (
    <label
      className={`${styles.editField} ${!allowed ? styles.editFieldLocked : ""}`}
    >
      <span>{label}</span>
      <select
        value={allowed ? value : ""}
        disabled={!allowed}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {allowed ? "Velg kvalitet" : "Låst · krever Bronze+"}
        </option>
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
            {typeof option.count === "number" ? ` · ${option.count}` : ""}
          </option>
        ))}
      </select>
      {helper ? <small className={styles.fieldHelper}>{helper}</small> : null}
    </label>
  );
}

function DemoSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
}
  return (
    <section className={styles.demoStrip}>
      <div className={styles.demoHeader}>
        <div>
          <h1>Objektpresentasjon · demo for nye brukere</h1>
          <p>
            Velg ett av 10 dummyobjekter for å se hvordan objektpresentasjon,
            relasjoner og brukerpanel fungerer. Globalt skinn styres fra
            Collectium designpanelet.
          </p>
        </div>
      </div>
      <div className={styles.demoObjects}>
        {demoObjects.map((item) => (
          <button
            key={item.objectId}
            type="button"
            className={`${styles.demoObject} ${selectedId === item.objectId ? styles.demoObjectActive : ""}`}
            onClick={() => onSelect(item.objectId)}
          >
            <span className={styles.demoNumber}>{item.noteNumber}</span>
            <span className={styles.demoName}>{item.title}</span>
            <span className={styles.demoMeta}>{item.catalogNumber}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function CollectiumObjectPresentationClient({
  mode,
  isLoggedIn = false,
  isSharedLink = false,
  routeObject,
}: Props) {
  const [tab, setTab] = useState<Tab>("samler");
  const [viewMode, setViewMode] = useState<Mode>("objekt");
  const [membership, setMembership] = useState<Membership>(
    mode === "demo" ? "guest" : isLoggedIn ? "bronze" : "guest",
  );
  const [selectedId, setSelectedId] = useState(routeObject?.objectId ?? "9");
  const [timelineSpan, setTimelineSpan] = useState(154);
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [shareDuration, setShareDuration] = useState<6 | 12 | 18 | 24 | 48>(12);
  const [generatedShareLink, setGeneratedShareLink] = useState<string>("");
  const [shareStatus, setShareStatus] = useState<string>("");
  const [sharedRecipients, setSharedRecipients] = useState<Array<{
    email: string;
    accessLabel: string;
    expiresAt: string;
    membershipOffer: string;
  }>>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number | null>>({
    heart: null,
    star: null,
    collect: null,
    auction: null,
    shop: null,
    share: null,
    compare: null,
  });
  const [imageSourceMode, setImageSourceMode] =
    useState<ImageSourceMode>("collectium");
  const [activeImageRole, setActiveImageRole] = useState<ImageRole>("forside");
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [ownImages, setOwnImages] = useState<OwnImage[]>([]);
  const [ownInfo, setOwnInfo] = useState<Record<string, string>>({
    purchaseDate: "",
    purchaseYear: "",
    purchasePrice: "",
    dealer: "",
    auction: "",
    sellerNotes: "",
    quality: "",
    grade: "",
    condition: "",
    conditionNotes: "",
    provenance: "",
  });
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);

  const selectedObject = useMemo(() => {
    const found =
      demoObjects.find((item) => item.objectId === selectedId) ??
      demoObjects[0];
    if (!routeObject) return found;
    return {
      ...found,
      sourceKey: routeObject.sourceKey,
      objectGroup: routeObject.objectGroup,
      objectId: routeObject.objectId,
      catalogNumber: `${routeObject.sourceKey} ${routeObject.objectId}`,
    };
  }, [selectedId, routeObject]);

  useEffect(() => {
    let cancelled = false;

    async function loadStatusCounts() {
      const params = new URLSearchParams({
        source_key: selectedObject.sourceKey,
        object_group: selectedObject.objectGroup,
        object_id: selectedObject.objectId,
      });

      try {
        const response = await fetch(`/api/object/user-state?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Kunne ikke hente statustall: ${response.status}`);
        }

        const payload = await response.json();

        const counts =
          payload?.counts ??
          payload?.status_counts ??
          payload?.object_status_counts ??
          payload?.summary ??
          payload?.data?.counts ??
          payload?.data?.status_counts ??
          payload?.data?.summary ??
          payload;

        const nextCounts: Record<string, number | null> = {
          heart:
            Number(counts?.heart ?? counts?.wishlist ?? counts?.heart_count ?? counts?.wishlist_count) || 0,
          star:
            Number(counts?.star ?? counts?.favorite ?? counts?.star_count ?? counts?.favorite_count) || 0,
          collect:
            Number(counts?.collect ?? counts?.collection ?? counts?.collection_count ?? counts?.in_collection_count) || 0,
          auction:
            Number(counts?.auction ?? counts?.auction_count ?? counts?.active_auction_count) || 0,
          shop:
            Number(counts?.shop ?? counts?.webshop ?? counts?.shop_count ?? counts?.active_shop_count) || 0,
          share:
            Number(counts?.share ?? counts?.share_count ?? counts?.active_share_count) || 0,
          compare:
            Number(counts?.compare ?? counts?.compare_count ?? counts?.related_compare_count) || 0,
        };

        if (!cancelled) {
          setStatusCounts(nextCounts);
        }
      } catch (error) {
        console.warn("Collectium: faktiske statustall mangler fra API", error);

        if (!cancelled) {
          setStatusCounts({
            heart: null,
            star: null,
            collect: null,
            auction: null,
            shop: null,
            share: null,
            compare: null,
          });
        }
      }
    }

    void loadStatusCounts();
}
  return () => {
      cancelled = true;
    };
  }, [selectedObject.sourceKey, selectedObject.objectGroup, selectedObject.objectId]);

  const shareDurations: Array<6 | 12 | 18 | 24 | 48> = [6, 12, 18, 24, 48];
useEffect(() => {
    let cancelled = false;

    async function loadShareRecipients() {
      const params = new URLSearchParams({
        source_key: selectedObject.sourceKey,
        object_group: selectedObject.objectGroup,
        object_id: selectedObject.objectId,
      });

      try {
        const response = await fetch(`/api/object/share-list?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Kunne ikke hente delingsliste: ${response.status}`);
        }

        const payload = await response.json();

        const rows =
          payload?.shares ??
          payload?.items ??
          payload?.data?.shares ??
          payload?.data?.items ??
          [];

        const nextRows = Array.isArray(rows)
          ? rows.map((row) => ({
              email: String(row.email ?? row.recipient_email ?? row.recipientEmail ?? "Ukjent mottaker"),
              accessLabel: String(row.access_label ?? row.accessLabel ?? row.duration_label ?? "Delt visning"),
              expiresAt: String(row.expires_at ?? row.expiresAt ?? row.valid_until ?? ""),
              membershipOffer: String(
                row.membership_offer ??
                  row.membershipOffer ??
                  row.receiver_offer ??
                  "Mottaker kan få medlemsrabatt etter delingsregel",
              ),
            }))
          : [];

        if (!cancelled) {
          setSharedRecipients(nextRows);
        }
      } catch (error) {
        console.warn("Collectium: delingsliste mangler eller krever innlogging", error);

        if (!cancelled) {
          setSharedRecipients([]);
        }
      }
    }

    void loadShareRecipients();

    return () => {
      cancelled = true;
    };
  }, [selectedObject.sourceKey, selectedObject.objectGroup, selectedObject.objectId]);

  async function generateObjectShareLink() {
    setShareStatus("Genererer lenke ...");

    const payload = {
      source_key: selectedObject.sourceKey,
      object_group: selectedObject.objectGroup,
      object_id: selectedObject.objectId,
      duration_hours: shareDuration,
      access_scope: "object_view",
      catalog_label: objectCatalogLabel,
      membership_offer: {
        enabled: true,
        receiver_rule: "shared_object_trial_or_discount",
        note_no:
          "Mottaker får tidsbegrenset tilgang til objektet og kan få medlemsrabatt etter Collectium delingsregel.",
      },
    };

    try {
      const response = await fetch("/api/object/share-create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Kunne ikke generere delingslenke: ${response.status}`);
      }
}
  function buildObjectCatalogLabel() {
    const objectFields = selectedObject as typeof selectedObject & {
      catalogNumber?: string;
      sourceCatalogNumber?: string;
      localCatalogNumber?: string;
    };

    return (
      objectFields.catalogNumber ||
      objectFields.sourceCatalogNumber ||
      objectFields.localCatalogNumber ||
      `NS ${selectedObject.objectId}`
    );
  }

  const objectCatalogLabel = buildObjectCatalogLabel();
  const isDemo = mode === "demo";
  const hasAccess = isDemo || isLoggedIn || isSharedLink;
  const effectiveMembership: Membership =
    isSharedLink && !isLoggedIn ? "free" : membership;
  const onlyCore = !canSee(effectiveMembership, "bronze");
  const objectYear = Number(selectedObject.year) || 1979;
  const halfSpan = Math.max(22, timelineSpan / 2);
  const horizonStart = Math.max(800, Math.floor(objectYear - halfSpan));
  const horizonEnd = Math.min(2026, Math.ceil(objectYear + halfSpan));
  const timelineTicks = makeTimelineTicks(horizonStart, horizonEnd);
  const issuePeriod = issuePeriodByIssue[selectedObject.issue] ?? {
    startYear: Math.max(horizonStart, objectYear - 8),
    endYear: Math.min(horizonEnd, objectYear + 8),
    href: `/relasjon/utgave/${selectedObject.issue.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}`,
  };

  const activeImageMeta =
    imageRoles.find((role) => role.key === activeImageRole) ?? imageRoles[0];
  const activeOwnImage = ownImages.find(
    (image) => image.role === activeImageRole,
  );
  const activeImageUrl =
    imageSourceMode === "own" ? activeOwnImage?.url : undefined;
  const activeImageDescription =
    imageSourceMode === "own"
      ? (activeOwnImage?.description ??
        "Eget bilde er ikke registrert for denne fanen ennå.")
      : `Collectium-bilde: ${activeImageMeta.description} Kilde: variant_obverse / reverse / transmitted_light / variant / detail.`;

  function writeLog(field: string, value: string) {
    setChangeLog((prev) => [
      {
        id: `${field}-${Date.now()}`,
        field,
        value: value || "Tomt felt",
        at: new Date().toLocaleString("no-NO"),
      },
      ...prev.slice(0, 19),
    ]);
  }

  function updateOwnInfo(field: string, value: string) {
    setOwnInfo((prev) => ({ ...prev, [field]: value }));
    writeLog(field, value);
  }

  function addOwnImages(files: FileList | null) {
    if (!files?.length) return;
    const remaining = Math.max(0, 10 - ownImages.length);
    const selected = Array.from(files).slice(0, remaining);
    if (!selected.length) return;
    const created = selected.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      role: activeImageRole,
      label: file.name,
      url: URL.createObjectURL(file),
      description: `Eget ${activeImageMeta.label.toLowerCase()}-bilde lagt til av bruker.`,
    }));
    setOwnImages((prev) => [...prev, ...created]);
    writeLog(
      "bilder",
      `${created.length} bilde(r) lagt til under ${activeImageMeta.label}`,
    );
    setImageSourceMode("own");
  }

  const gradingOptions =
    selectedObject.objectGroup === "coin"
      ? coinGradingOptions
      : banknoteGradingOptions;

  function applyGradingChoice(choiceKey: string) {
    const choice = gradingOptions.find((option) => option.key === choiceKey);
    if (!choice) {
      updateOwnInfo("grade", "");
      return;
    }

    if (selectedObject.objectGroup === "coin") {
      setOwnInfo((prev) => ({
        ...prev,
        grade: choice.key,
        quality: choice.qualityLabelNo ?? "",
        condition: choice.gradeTitleNo ?? "",
        conditionNotes: choice.gradeNameEn
          ? `Hentet fra grade_name_en / quality_label_no: ${choice.gradeNameEn}`
          : "",
      }));
      writeLog(
        "Gradering",
        `${choice.label} → grade_title_no=${choice.gradeTitleNo ?? ""}, grade_name_en=${choice.gradeNameEn ?? ""}, quality_label_no=${choice.qualityLabelNo ?? ""}`,
      );
      return;
    }

    setOwnInfo((prev) => ({
      ...prev,
      grade: choice.key,
      quality: choice.qualityLabelNo ?? "",
      condition: choice.rarityTitleNo ?? "",
      conditionNotes: choice.collectiumDescriptionNo ?? "",
    }));
    writeLog(
      "Gradering",
      `${choice.label} → rarity_title_no=${choice.rarityTitleNo ?? ""}, collectium_description_no=${choice.collectiumDescriptionNo ?? ""}`,
    );
  }

  function toggleStatus(id: string, label: string) {
    setSavedStates((prev) => {
      const nextValue = !prev[id];
      writeLog(label, nextValue ? "Valgt / aktivert" : "Fjernet / deaktivert");
      return { ...prev, [id]: nextValue };
    });
  }

  const keyData =
    viewMode === "finans"
      ? [
          ["Markedsverdi", "Mangler", "ikke vis 0 kr"],
          ["Trend 12 mnd", "Ikke beregnet", "market view"],
          ["Auksjon", "Ikke registrert", "status"],
          ["Nettbutikk", "Ikke registrert", "status"],
          ["Grade values", "Mangler", "{}"],
          ["Prisgrunnlag", "Mangler", "observasjoner"],
        ]
      : [
          ["Valør", selectedObject.denomination, selectedObject.objectGroup],
          ["Utgave", selectedObject.issue, selectedObject.year],
          ["Variant", selectedObject.litra, selectedObject.catalogNumber],
          ["Signatur", selectedObject.signatures, "signaturgruppe"],
          ["Regent", selectedObject.regent, selectedObject.regentPeriod],
          ["Objektnøkkel", selectedObject.objectId, "source + group + id"],
        ];
}
  return (
    <div className={styles.shell} data-view={viewMode}>
      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.modeBar}>
            <div className={styles.membershipSelect}>
              <span className={styles.inlineNote}>
                {mode === "demo" ? "Test tilgang:" : "Tilgang:"}
              </span>
              <select
                className={styles.selectLike}
                value={membership}
                onChange={(event) =>
                  setMembership(event.target.value as Membership)
                }
              >
                <option value="guest">Gjest / demo</option>
                <option value="free">Free</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
          </div>

          {isDemo && membership === "guest" ? (
            <DemoSelector selectedId={selectedId} onSelect={setSelectedId} />
          ) : null}

          {!hasAccess ? (
            <section className={styles.authNotice}>
              <strong>Logg inn for å se objektpresentasjon.</strong>
              <p>
                Denne ruten er bruker-/medlemsside. Direkte delte objektlenker
                kan vise ett spesifikt objekt med begrenset innhold, men full
                objektpresentasjon krever innlogging og medlemskap.
              </p>
              <button
                className={`${styles.topButton} ${styles.topButtonPrimary}`}
              >
                Logg inn
              </button>
            </section>
          ) : null}

          {isSharedLink && !isLoggedIn ? (
            <div className={styles.sharedBanner}>
              Delt visningslenke: viser ett spesifikt objekt med begrenset
              Free-tilgang. Min samling og private felt er låst.
            </div>
          ) : null}

          {hasAccess ? (
            <>
              <section className={styles.hero}>
                <div className={styles.heroViewTabs} aria-label="Objektvisning">
                  <span className={styles.heroViewLabel}>Visning</span>
                  {[
                    ["objekt", "Objekt info"],
                    ["museum", "Museum"],
                    ["kompakt", "Kompakt"],
                    ["finans", "Finans"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={`${styles.viewTab} ${viewMode === key ? styles.viewTabActive : ""}`}
                      type="button"
                      aria-pressed={viewMode === key}
                      onClick={() => {
                        setViewMode(key as Mode);
                        if (key === "finans") setTab("finans");
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className={styles.heroGrid}>
                  <div className={styles.noteImage}>
                    <button
                      type="button"
                      className={styles.notePaperButton}
                      onClick={() => setIsImageOpen(true)}
                      title="Åpne bilde i fullskjerm"
                    >
                      {activeImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className={styles.ownImagePreview}
                          src={activeImageUrl}
                          alt={`${activeImageMeta.label} eget bilde`}
                        />
                      ) : (
                        <div className={styles.notePaper}>
                          <div className={styles.num}>
                            {selectedObject.noteNumber}
                          </div>
                          <div className={styles.seal} />
                          <div className={styles.noteLine} />
                          <div className={styles.noteText}>
                            {selectedObject.noteText}
                          </div>
                          <div className={styles.noteSerial}>
                            {selectedObject.serial}
                          </div>
                        </div>
                      )}
                    </button>
                    <div className={styles.imageMetaBar}>
                      <div>
                        <span className={styles.imageMetaKicker}>
                          Bildefelt
                        </span>
                        <strong>{selectedObject.noteText}</strong>
                      </div>
                      <div className={styles.imageSourceSwitch}>
                        <button
                          type="button"
                          className={`${styles.sourceTab} ${imageSourceMode === "collectium" ? styles.sourceTabActive : ""}`}
                          onClick={() => setImageSourceMode("collectium")}
                        >
                          Collectium
                        </button>
                        <button
                          type="button"
                          className={`${styles.sourceTab} ${imageSourceMode === "own" ? styles.sourceTabActive : ""}`}
                          onClick={() => setImageSourceMode("own")}
                        >
                          Egne ({ownImages.length}/10)
                        </button>
                      </div>
                    </div>
                    <div className={styles.imageNavRow}>
                      <div className={styles.imageControls}>
                        {imageRoles.map((role) => (
                          <button
                            key={role.key}
                            className={`${styles.imageRoleTab} ${activeImageRole === role.key ? styles.imageRoleTabActive : ""}`}
                            type="button"
                            onClick={() => setActiveImageRole(role.key)}
                          >
                            {role.label}
                          </button>
                        ))}
                      </div>
                      <div className={styles.imageCaption}>
                        <span>{activeImageMeta.label}</span>
                        <p>{activeImageDescription}</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.heroText}>
                    <span className={styles.badge}>
                      Objekt info · hovedobjekt fra katalogen
                    </span>
                    <h1 className={styles.title}>{selectedObject.title}</h1>
                    <p className={styles.lead}>
                      Objektpresentasjon for hovedobjekt fra katalogen. Viser{" "}
                      {selectedObject.denomination}, {selectedObject.issue},
                      variant {selectedObject.litra}, signaturgruppe{" "}
                      {selectedObject.signatures} og regent{" "}
                      {selectedObject.regent}.
                    </p>
                    <div className={styles.metaMini}>
                      <div className={styles.mini}>
                        <span className={styles.label}>Kilde</span>
                        <span className={styles.value}>Norske sedler</span>
                        <span className={styles.sub}>
                          {selectedObject.sourceKey}
                        </span>
                      </div>
                      <div className={styles.mini}>
                        <span className={styles.label}>Objektgruppe</span>
                        <span className={styles.value}>Banknote</span>
                        <span className={styles.sub}>
                          {selectedObject.objectGroup}
                        </span>
                      </div>
                      <div className={styles.mini}>
                        <span className={`${styles.value} ${styles.valueBig}`}>
                          {selectedObject.objectId}
                        </span>
                        <span className={styles.sub}>source + group + id</span>
                      </div>
                    </div>
                    <div className={styles.modeNarrative}>
                      {onlyCore
                        ? "Free/gjest ser kjerneinformasjon. Tomme felt viser hva Bronze+ åpner."
                        : "Bronze+ viser samler-, historie-, finans- og min samling-felter etter tilgang."}
                    </div>
                  </div>
                </div>
              </section>

              {isImageOpen ? (
                <div
                  className={styles.imageModal}
                  role="dialog"
                  aria-modal="true"
                >
                  <button
                    type="button"
                    className={styles.imageModalBackdrop}
                    aria-label="Lukk bildevisning"
                    onClick={() => setIsImageOpen(false)}
                  />
                  <section className={styles.imageModalPanel}>
                    <button
                      type="button"
                      className={styles.imageModalClose}
                      onClick={() => setIsImageOpen(false)}
                    >
                      ×
                    </button>
                    <div className={styles.imageModalImage}>
                      {activeImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activeImageUrl}
                          alt={`${activeImageMeta.label} eget bilde`}
                        />
                      ) : (
                        <div className={styles.notePaper}>
                          <div className={styles.num}>
                            {selectedObject.noteNumber}
                          </div>
                          <div className={styles.seal} />
                          <div className={styles.noteLine} />
                          <div className={styles.noteText}>
                            {selectedObject.noteText}
                          </div>
                          <div className={styles.noteSerial}>
                            {selectedObject.serial}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={styles.imageModalFooter}>
                      <div>
                        <strong>{activeImageMeta.label}</strong>
                        <p>{activeImageDescription}</p>
                      </div>
                      <div className={styles.imageControls}>
                        {imageRoles.map((role) => (
                          <button
                            key={role.key}
                            className={`${styles.pill} ${activeImageRole === role.key ? styles.pillActive : ""}`}
                            type="button"
                            onClick={() => setActiveImageRole(role.key)}
                          >
                            {role.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}

              <div className={styles.tabsRow}>
                <div
                  className={styles.segmentTabs}
                  aria-label="Objektpresentasjon faner"
                >
                  {[
                    ["samler", "I Samler"],
                    ["historie", "II Historie"],
                    ["finans", "III Finans"],
                    ["samling", "IV I min samling"],
                    ["relasjoner", "V Relasjon objekter"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={`${styles.segmentTab} ${tab === key ? styles.segmentTabActive : ""}`}
                      type="button"
                      aria-pressed={tab === key}
                      onClick={() => setTab(key as Tab)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <section className={styles.keyrow}>
                <div className={styles.keygrid}>
                  {keyData.map(([label, value, sub]) => (
                    <div className={styles.key} key={`${label}-${value}`}>
                      <span className={styles.label}>{label}</span>
                      <span className={styles.value}>{value}</span>
                      <span className={styles.sub}>{sub}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.timeline}>
                <div className={styles.timelineHeader}>
                  <div>
                    <span className={styles.timelineKicker}>
                      Periodefilter · relasjonstidslinje
                    </span>
                    <h2>Tidslinje for {selectedObject.year}</h2>
                    <p className={styles.timelineRange}>
                      Horisont {horizonStart}-{horizonEnd}. Alle felt/brytere
                      beregnes fra samme årsskala.
                    </p>
                  </div>
                  <div className={styles.timelineControls}>
                    <button
                      type="button"
                      onClick={() =>
                        setTimelineSpan((value) => Math.max(44, value - 30))
                      }
                      title="Zoom inn / kortere tidshorisont"
                    >
                      −
                    </button>
                    <a
                      className={styles.timelineYearLink}
                      href={`/relasjon/publiseringsar/${selectedObject.year}`}
                      title={`Åpne publiseringsår ${selectedObject.year}`}
                    >
                      {selectedObject.year}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setTimelineSpan((value) => Math.min(1226, value + 30))
                      }
                      title="Zoom ut / lengre tidshorisont"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className={styles.timelineTicks}>
                  {timelineTicks.map((year) => (
                    <span key={year}>{year}</span>
                  ))}
                </div>
                <div className={styles.timelineGrid}>
                  <div className={styles.timelineLabel}>Konge / regent</div>
                  <div className={styles.timelineLane}>
                    {timelineItems
                      .filter((item) => item.lane === "regent")
                      .map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          title={`${item.label}: ${item.sub}. Klikk for relasjonskort.`}
                          className={`${styles.timelineBar} ${item.match(selectedObject) ? styles.timelineBarCurrent : ""}`}
                          style={timelineStyle(
                            item.startYear,
                            item.endYear,
                            horizonStart,
                            horizonEnd,
                          )}
                        >
                          {item.label}
                        </a>
                      ))}
                  </div>
                  <div className={styles.timelineLabel}>Historisk periode</div>
                  <div className={styles.timelineLane}>
                    {timelineItems
                      .filter((item) => item.lane === "history")
                      .map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          title={`${item.label}: ${item.sub}. Klikk for relasjonskort.`}
                          className={`${styles.timelineBar} ${styles.timelineBarGreen} ${item.match(selectedObject) ? styles.timelineBarCurrent : ""}`}
                          style={timelineStyle(
                            item.startYear,
                            item.endYear,
                            horizonStart,
                            horizonEnd,
                          )}
                        >
                          {item.label}
                        </a>
                      ))}
                  </div>
                  <div className={styles.timelineLabel}>Finans / økonomi</div>
                  <div className={styles.timelineLane}>
                    {timelineItems
                      .filter((item) => item.lane === "finance")
                      .map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          title={`${item.label}: ${item.sub}. Klikk for relasjonskort.`}
                          className={`${styles.timelineBar} ${styles.timelineBarFinance} ${item.match(selectedObject) ? styles.timelineBarCurrent : ""}`}
                          style={timelineStyle(
                            item.startYear,
                            item.endYear,
                            horizonStart,
                            horizonEnd,
                          )}
                        >
                          {item.label}
                        </a>
                      ))}
                  </div>
                  <div className={styles.timelineLabel}>Objekt / utgiver</div>
                  <div className={styles.timelineLane}>
                    <a
                      href={issuePeriod.href}
                      title={`${selectedObject.issue}. Klikk for utgave-/objektperiode.`}
                      className={`${styles.timelineBar} ${styles.timelineBarPurple} ${styles.timelineBarCurrent}`}
                      style={timelineStyle(
                        issuePeriod.startYear,
                        issuePeriod.endYear,
                        horizonStart,
                        horizonEnd,
                      )}
                    >
                      {selectedObject.issue}
                    </a>
                  </div>
                </div>
                <p className={styles.timelineHelp}>
                  Aktiv periode er større og lysere. Hold over for rask info.
                  Klikk på konge, periode, finanslag, objektperiode eller
                  årstall for relasjonspresentasjon.
                </p>
              </section>

              <div className={styles.layout}>
                <main className={styles.mainPanels}>
                  <section
                    className={`${styles.panelGrid} ${tab !== "samler" ? styles.hidden : ""}`}
                  >
                    <div className={styles.panel}>
                      <h3>Identitet</h3>
                      <Field
                        membership={effectiveMembership}
                        label="Katalognummer"
                        value={selectedObject.catalogNumber}
                      />
                      <Field
                        membership={effectiveMembership}
                        label="Collectium-tittel"
                        value={selectedObject.title}
                      />
                      <Field
                        membership={effectiveMembership}
                        label="Valør"
                        value={selectedObject.denomination}
                        href="/relasjon/valor/10-kroner"
                      />
                      <Field
                        membership={effectiveMembership}
                        label="År"
                        value={selectedObject.year}
                        href={`/relasjon/ar/${selectedObject.year}`}
                      />
                      <Field
                        membership={effectiveMembership}
                        label="Litra"
                        value={selectedObject.litra}
                      />
                    </div>
                    <div
                      className={`${styles.panel} ${onlyCore ? styles.lockedPanel : ""}`}
                    >
                      <h3>Utgave og variant</h3>
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Valørutgave / serie"
                        value={selectedObject.issue}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Variant"
                        value={selectedObject.variant}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Signatur"
                        value={selectedObject.signatures}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Regent"
                        value={selectedObject.regent}
                      />
                    </div>
                    <div
                      className={`${styles.panel} ${onlyCore ? styles.lockedPanel : ""}`}
                    >
                      <h3>Sjeldenhet og mengde</h3>
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Katalogvurdering"
                        value={selectedObject.rarity}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Estimert mengde"
                        value={selectedObject.quantity}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Signaturmengde"
                        value="Hentes fra seddel-view"
                      />
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Status"
                        value="Basis klar"
                      />
                    </div>
                    <div
                      className={styles.panel}
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <h3>Bilde og fallback</h3>
                      <Field
                        membership={effectiveMembership}
                        label="Forside"
                        value="variant_obverse_image_path · henter"
                      />
                      <Field
                        membership={effectiveMembership}
                        label="Bakside"
                        value="variant_reverse_image_path · henter"
                      />
                      <Field
                        membership={effectiveMembership}
                        label="Gjennomlysning"
                        value="transmitted_light · henter"
                      />
                      <div className={styles.fallback}>
                        Hvis alle bildefelter er null, skal UI vise: Bilde ikke
                        registrert.
                      </div>
                    </div>
                  </section>

                  <section
                    className={`${styles.panelGrid} ${styles.panelGridTwo} ${tab !== "historie" ? styles.hidden : ""}`}
                  >
                    <div className={styles.panel}>
                      <h3>Periodekoblinger</h3>
                      {[
                        "Objektår",
                        "Publiseringsår",
                        "Utgaveperiode",
                        "Regentperiode",
                        "Hovedperiode",
                      ].map((label) => (
                        <span key={label} className={styles.periodBadge}>
                          <span className={styles.periodType}>{label}</span>
                          {label.includes("Regent")
                            ? selectedObject.regentPeriod
                            : label.includes("Utgave")
                              ? selectedObject.issue
                              : selectedObject.year}
                        </span>
                      ))}
                    </div>
                    <div className={styles.panel}>
                      <h3>Regent · signatur · motiv</h3>
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Regent"
                        value={selectedObject.regent}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Regentperiode"
                        value={selectedObject.regentPeriod}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Signaturgruppe"
                        value={selectedObject.signatures}
                      />
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Hovedperiode"
                        value="Selvstendig Norge / Unionstid"
                      />
                    </div>
                    <div
                      className={styles.panel}
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <h3>Relasjoner fra ct_v_object_relations_resolved</h3>
                      {[
                        ["År", selectedObject.year],
                        ["Regent", selectedObject.regent],
                        ["Utgave", selectedObject.issue],
                        ["Valør", selectedObject.denomination],
                      ].map(([label, value]) => (
                        <div
                          key={`${label}-${value}`}
                          className={styles.listItem}
                        >
                          <div>
                            <strong>
                              {label} · {value}
                            </strong>
                            <small>
                              /relasjon/{label.toLowerCase()}/
                              {String(value).toLowerCase().replaceAll(" ", "-")}
                            </small>
                          </div>
                          <span className={styles.arrow}>→</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section
                    className={`${styles.panelGrid} ${styles.panelGridTwo} ${tab !== "finans" ? styles.hidden : ""}`}
                  >
                    <div
                      className={`${styles.panel} ${!canSee(effectiveMembership, "silver") ? styles.lockedPanel : ""}`}
                    >
                      <h3>Markedsverdi per kvalitet</h3>
                      {canSee(effectiveMembership, "silver") ? (
                        <div className={styles.barChart}>
                          {[10, 15, 20, 28, 40, 58, 74, 92].map((height) => (
                            <div
                              key={height}
                              className={styles.bar}
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className={styles.lockedText}>
                          Finansdata krever Silver+.
                        </div>
                      )}
                    </div>
                    <div className={styles.panel}>
                      <h3>Marked og salg</h3>
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Markedsverdi"
                        value="Mangler markedsverdi"
                      />
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Trend 12 mnd"
                        value="Ikke beregnet trend"
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Auksjon"
                        value="Ikke registrert på auksjon"
                      />
                      <Field
                        membership={effectiveMembership}
                        required="bronze"
                        label="Nettbutikk"
                        value="Ikke registrert i nettbutikk"
                      />
                    </div>
                    <div className={styles.panel}>
                      <h3>Indexkobling</h3>
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Kjøpekraft"
                        value="Henter"
                      />
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Lønn / befolkning"
                        value="Henter"
                      />
                      <Field
                        membership={effectiveMembership}
                        required="silver"
                        label="Rente / metall"
                        value="Henter"
                      />
                    </div>
                    <div className={styles.panel}>
                      <h3>Finansperiode</h3>
                      {["6 mnd", "12 mnd", "24 mnd", "Alle år"].map((label) => (
                        <span key={label} className={styles.periodBadge}>
                          <span className={styles.periodType}>{label}</span>
                          trend
                        </span>
                      ))}
                    </div>
                  </section>

                  <section
                    className={`${styles.panelGrid} ${styles.panelGridTwo} ${tab !== "samling" ? styles.hidden : ""}`}
                  >
                    <div
                      className={`${styles.panel} ${!canSee(effectiveMembership, "bronze") ? styles.lockedPanel : ""}`}
                    >
                      <h3>Kjøp</h3>
                      <EditableField
                        membership={effectiveMembership}
                        label="Kjøpeår"
                        value={ownInfo.purchaseYear}
                        onChange={(value: string) =>
                          updateOwnInfo("purchaseYear", value)
                        }
                        placeholder="f.eks. 2025"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Kjøpsdato"
                        value={ownInfo.purchaseDate}
                        onChange={(value: string) =>
                          updateOwnInfo("purchaseDate", value)
                        }
                        placeholder="f.eks. 2025-09-14"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Pris"
                        value={ownInfo.purchasePrice}
                        onChange={(value: string) =>
                          updateOwnInfo("purchasePrice", value)
                        }
                        placeholder="f.eks. 1 250 NOK"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Forhandler"
                        value={ownInfo.dealer}
                        onChange={(value: string) =>
                          updateOwnInfo("dealer", value)
                        }
                        placeholder="Forhandler/navn"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Auksjon"
                        value={ownInfo.auction}
                        onChange={(value: string) =>
                          updateOwnInfo("auction", value)
                        }
                        placeholder="Auksjonshus / lot / nummer"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Merknad fra selger"
                        value={ownInfo.sellerNotes}
                        onChange={(value: string) =>
                          updateOwnInfo("sellerNotes", value)
                        }
                        placeholder="Tekst fra selger, kvittering eller auksjonsbeskrivelse"
                      />
                    </div>
                    <div
                      className={`${styles.panel} ${!canSee(effectiveMembership, "bronze") ? styles.lockedPanel : ""}`}
                    >
                      <h3>Kvalitet og tilstand</h3>
                      <SelectField
                        membership={effectiveMembership}
                        label="Gradering"
                        value={ownInfo.grade}
                        onChange={applyGradingChoice}
                        options={gradingOptions}
                        helper={
                          selectedObject.objectGroup === "coin"
                            ? "Mynt: grade_title_no + grade_name_en joines til quality_label_no."
                            : "Seddel: rarity_title_no fyller gradering, collectium_description_no fyller tilstand/merknad."
                        }
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Egen kvalitet"
                        value={ownInfo.quality}
                        onChange={(value: string) =>
                          updateOwnInfo("quality", value)
                        }
                        placeholder="Fylles fra valgt gradering eller overstyres av bruker"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Tilstand"
                        value={ownInfo.condition}
                        onChange={(value: string) =>
                          updateOwnInfo("condition", value)
                        }
                        placeholder="Fylles fra valgt gradering"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Tilstandsmerknad"
                        value={ownInfo.conditionNotes}
                        onChange={(value: string) =>
                          updateOwnInfo("conditionNotes", value)
                        }
                        placeholder="Autofyll fra Collectium-beskrivelse eller fri tekst"
                      />
                      <EditableField
                        membership={effectiveMembership}
                        label="Proveniens"
                        value={ownInfo.provenance}
                        onChange={(value: string) =>
                          updateOwnInfo("provenance", value)
                        }
                        placeholder="Privat/samtykkestyrt proveniens"
                      />
                      <div className={styles.fallback}>
                        Innlogget Bronze+ kan endre kvalitet og egne felt. Valg
                        bokføres i endringsloggen og skal senere skrives via
                        collection/user-state API, ikke direkte til
                        katalogsannheten.
                      </div>
                    </div>
                    <div
                      className={`${styles.panel} ${!canSee(effectiveMembership, "bronze") ? styles.lockedPanel : ""}`}
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <h3>Bilder</h3>
                      <div className={styles.imageUploadRow}>
                        <div>
                          <strong>Egne bilder</strong>
                          <p>
                            Legg inn maks 10 bilder. Bildene kan vises i
                            bildefeltet øverst når bryteren står på Egne.
                          </p>
                        </div>
                        <label className={styles.uploadButton}>
                          Legg til bilde
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={
                              !canSee(effectiveMembership, "bronze") ||
                              ownImages.length >= 10
                            }
                            onChange={(event) =>
                              addOwnImages(event.target.files)
                            }
                          />
                        </label>
                      </div>
                      <div className={styles.ownImageGrid}>
                        {ownImages.length ? (
                          ownImages.map((image) => (
                            <button
                              key={image.id}
                              type="button"
                              className={styles.ownImageThumb}
                              onClick={() => {
                                setActiveImageRole(image.role);
                                setImageSourceMode("own");
                                setIsImageOpen(true);
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={image.url} alt={image.label} />
                              <span>{image.label}</span>
                            </button>
                          ))
                        ) : (
                          <div className={styles.lockedText}>
                            Ingen egne bilder registrert.
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={styles.panel}
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <h3>Endringslogg</h3>
                      {changeLog.length ? (
                        <div className={styles.logList}>
                          {changeLog.map((entry) => (
                            <div key={entry.id} className={styles.logEntry}>
                              <span>{entry.at}</span>
                              <strong>{entry.field}</strong>
                              <em>{entry.value}</em>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.fallback}>
                          Ingen endringer bokført i denne forhåndsvisningen.
                        </div>
                      )}
                    </div>
                  </section>

                  <section
                    className={`${styles.panelGrid} ${styles.panelGridOne} ${tab !== "relasjoner" ? styles.hidden : ""}`}
                  >
                    <div className={styles.panel}>
                      <h3>Relasjon objekter</h3>
                      {[
                        ["Samme regent", selectedObject.regent],
                        ["Samme utgaveperiode", selectedObject.issue],
                        ["Samme valør", selectedObject.denomination],
                        ["Samme variant", selectedObject.variant],
                        ["Samme signaturgruppe", selectedObject.signatures],
                      ].map(([label, value]) => (
                        <div
                          key={`${label}-${value}`}
                          className={styles.listItem}
                        >
                          <div>
                            <strong>
                              {label} · {value}
                            </strong>
                            <small>
                              Vis objekter og kunnskapsnode for relasjonen.
                            </small>
                          </div>
                          <span className={styles.arrow}>→</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section
                    className={`${styles.panelGrid} ${styles.panelGridOne}`}
                    style={{ marginTop: 16 }}
                  >
                    <div className={styles.panel}>
                      <h3>API / view-kjede og status</h3>
                      <div className={styles.techGrid}>
                        {[
                          "ct_v_object_presentation_resolved",
                          "ct_v_no_banknote_object_presentation",
                          "ct_v_object_relations_resolved",
                          "ct_v_object_market_resolved",
                          "ct_v_object_user_state_resolved",
                        ].map((view) => (
                          <div key={view} className={styles.tech}>
                            View<strong>{view}</strong>
                          </div>
                        ))}
                      </div>
                      <div className={styles.field}>
                        <span>Page key</span>
                        <strong className={styles.statusOK}>
                          object.presentation · OK
                        </strong>
                      </div>
                      <div className={styles.field}>
                        <span>Route</span>
                        <strong className={styles.statusOK}>
                          /objekt/[sourceKey]/[objectGroup]/[objectId] · OK
                        </strong>
                      </div>
                      <div className={styles.field}>
                        <span>Datadekning</span>
                        <strong className={styles.statusWarn}>
                          Markedsdata, bilder, historisk kontekst og
                          brukerstatus · DELVIS
                        </strong>
                      </div>
                    </div>
                  </section>
                </main>

                <aside className={styles.side}>
                  <div className={styles.panel}>
                    <h3>Status</h3>
                    {[
                      {
                        id: "heart",
                        icon: savedStates.heart ? "♥" : "♡",
                        label: "Hjerte",
                        sub: "Ønskeliste",
                      },
                      {
                        id: "star",
                        icon: savedStates.star ? "★" : "☆",
                        label: "Stjerne",
                        sub: "Favoritt",
                      },
                      {
                        id: "collect",
                        icon: "＋",
                        label: "Legg i samling",
                        sub: "Min samling",
                      },
                      {
                        id: "auction",
                        icon: "⚑",
                        label: "Auksjon",
                        sub: "Aktive treff",
                      },
                      {
                        id: "shop",
                        icon: "◆",
                        label: "Nettbutikk",
                        sub: "Aktive salg",
                      },
                      {
                        id: "share",
                        icon: "↗",
                        label: "Del objekt",
                        sub: "Visningslenke",
                      },
                      {
                        id: "compare",
                        icon: "⇄",
                        label: "Sammenlign",
                        sub: "Mot andre objekter",
                      },
                    ].map((action) => (
                      <button
                        key={action.id}
                        className={`${styles.action} ${savedStates[action.id] ? styles.actionPrimary : ""}`}
                        data-action={action.id}
                        data-active={savedStates[action.id] ? "true" : "false"}
                        type="button"
                        onClick={() => toggleStatus(action.id, action.label)}
                      >
                        <span className={styles.icon}>{action.icon}</span>
                        <span className={styles.actionText}>
                          {action.label}
                          <br />
                          <small>{action.sub}</small>
                        </span>
                        <span
                          className={styles.actionCount}
                          title="Antall brukere/objekter med tilsvarende status"
                        >
                          {statusCounts[action.id] ?? "–"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.panel}>
                    <h3>Del visning</h3>
                    <div className={styles.shareBtns}>
                      {["6t", "12t", "18t", "24t", "48t"].map((item) => (
                        <button
                          key={item}
                          className={`${styles.pill} ${item === "12t" ? styles.pillActive : ""}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className={styles.field}>
                      <span>Katalog</span>
                      <strong>{objectCatalogLabel}</strong>
                    </div>
                    <div className={styles.field}>
                      <span>Tilgang</span>
                      <strong>12 timer</strong>
                    </div>
                    <button className={`${styles.pill} ${styles.pillActive}`}>
                      Generer lenke
                    </button>
                  </div>
      {/* v18-share-panel-start */}
      <div className={`${styles.panel} ${styles.shareViewPanel}`}>
        <h3>Del visning</h3>

        <div className={styles.shareDurationRow} aria-label="Velg tilgangstid for delt visning">
          {shareDurations.map((duration) => (
            <button
              key={duration}
              type="button"
              className={`${styles.shareDurationButton} ${
                shareDuration === duration ? styles.shareDurationButtonActive : ""
              }`}
              onClick={() => setShareDuration(duration)}
              aria-pressed={shareDuration === duration}
            >
              {duration}t
            </button>
          ))}
        </div>

        <div className={styles.shareMetaGrid}>
          <div className={styles.shareMetaField}>
            <span>Katalog</span>
            <strong>{objectCatalogLabel}</strong>
          </div>
          <div className={styles.shareMetaField}>
            <span>Tilgang</span>
            <strong>{shareDuration} timer</strong>
          </div>
        </div>

        <button
          type="button"
          className={styles.shareGenerateButton}
          onClick={generateObjectShareLink}
        >
          Generer lenke
        </button>

        {shareStatus ? (
          <p className={styles.shareStatusText}>{shareStatus}</p>
        ) : null}

        {generatedShareLink ? (
          <div className={styles.generatedShareLink}>
            <span>Lenke</span>
            <a href={generatedShareLink} target="_blank" rel="noreferrer">
              {generatedShareLink}
            </a>
          </div>
        ) : null}

        <div className={styles.shareOfferBox}>
          <strong>Mottakerfordel</strong>
          <span>
            Mottaker får tidsbegrenset tilgang til objektet. Ved registrering kan mottaker
            kobles til Collectium medlemsrabatt etter delingsregelen.
          </span>
        </div>

        <div className={styles.shareRecipientList}>
          <strong>Delte e-poster</strong>
          {sharedRecipients.length > 0 ? (
            sharedRecipients.map((recipient) => (
              <div key={`${recipient.email}-${recipient.expiresAt}`} className={styles.shareRecipientItem}>
                <span>{recipient.email}</span>
                <small>
                  {recipient.accessLabel}
                  {recipient.expiresAt ? ` · ${recipient.expiresAt}` : ""}
                </small>
                <small>{recipient.membershipOffer}</small>
              </div>
            ))
          ) : (
            <p>
              Ingen registrerte e-postmottakere vises ennå. Listen fylles fra
              /api/object/share-list når innlogget bruker har delt objektet.
            </p>
          )}
        </div>
      </div>
      {/* v18-share-panel-end */}

                </aside>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}






