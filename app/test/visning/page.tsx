"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Test Visning Live Editor v7
 *
 * Definering / formal:
 * En-fils Next.js/React testside for live redigering av Collectium UI 8.6.
 * Siden tester visningskort, objektpresentasjon, relasjonspresentasjon,
 * brytere, API, views, felt og bokser med inspector/editor pa side-, boks-,
 * felt-, bryter- og tekstniva.
 *
 * Bruksomrade:
 * /test/visning. Brukes som kontrollert UI-lab for a se hvilken CSS, selector,
 * token, feature_key, API-route og view som styrer valgt element.
 *
 * Berorte sider / routes:
 * - /test/visning
 *
 * Berorte DB-brytere / feature_keys:
 * - Testside bruker statisk data, men viser forventede keys:
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 * - catalog.object.open
 *
 * Berorte API-ruter:
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 * - GET /api/period86/timeline
 * - GET /api/catalog/filters
 *
 * Berorte tabeller / views:
 * - ct_v_object_presentation_resolved
 * - ct_v_no_banknote_object_presentation
 * - ct_v_object_relations_resolved
 * - ct_v_object_market_resolved
 * - ct_v_object_user_state_resolved
 * - ct_v_period_filter_options
 *
 * Dataretning:
 * Statisk UI-testdata -> Next.js -> React -> UI.
 * Produksjon: Neon DB -> API/backend -> Next.js -> React -> UI.
 *
 * Logging:
 * Ikke aktivert pa testside.
 *
 * Versjon:
 * UI86-TEST-VISNING-LIVE-EDITOR-V7
 */

import React, { CSSProperties, useMemo, useState } from "react";

type Skin = "collectium" | "enkel" | "museum" | "finans";
type MainTab = "visningskort" | "objekt" | "relasjon" | "brytere" | "api" | "view" | "felt" | "bokser";
type ObjectTab = "samler" | "historie" | "finans" | "samling";
type EditLevel = "side" | "boks" | "felt" | "bryter" | "tekst";

type InspectMeta = {
  id: string;
  label: string;
  level: EditLevel;
  file: string;
  selector: string;
  cssGroup: string;
  description: string;
  featureKey?: string;
  api?: string;
  view?: string;
  field?: string;
  href?: string;
  defaultText?: string;
};

type OverrideStyle = {
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
  background?: string;
  color?: string;
  borderColor?: string;
  borderRadius?: string;
  fontSize?: string;
  transform?: string;
};

const FILE_PATH = "app/test/visning/page.tsx";

const cssGroups = [
  {
    key: "global",
    label: "Global testside",
    selectors: [":root", ".ctPage", ".ctWorkspace", ".ctPanel", ".ctSignature"],
  },
  {
    key: "filter",
    label: "Filter og periode",
    selectors: [".ctFilterRail", ".ctFilterCard", ".ctSelect", ".ctTimeline", ".ctLane", ".ctPeriodBar"],
  },
  {
    key: "visningskort",
    label: "Visningskort",
    selectors: [".ctCard", ".ctCardHorizontal", ".ctCardList", ".ctCardMuseum", ".ctCardStanding"],
  },
  {
    key: "objekt",
    label: "Objektpresentasjon",
    selectors: [".ctObjectHero", ".ctNote", ".ctObjectTabs", ".ctObjectGrid", ".ctSideActions"],
  },
  {
    key: "relasjon",
    label: "Relasjonspresentasjon",
    selectors: [".ctRelationHero", ".ctRelationTimeline", ".ctRelationList"],
  },
  {
    key: "editor",
    label: "Inspector/editor",
    selectors: [".ctSplit", ".ctCodePanel", ".ctInspectorMark", ".ctResizeHandle"],
  },
];

const baseCss = `/* Collectium test/visning v7 - original CSS-kilde */
:root {
  --ct-bg: #f6f3ec;
  --ct-page: #fffdf8;
  --ct-panel: #ffffff;
  --ct-panel-2: #f2f7ef;
  --ct-text: #173c2f;
  --ct-muted: #7f9288;
  --ct-line: rgba(25, 80, 55, .18);
  --ct-line-soft: rgba(25, 80, 55, .10);
  --ct-accent: #2f805d;
  --ct-accent-2: #c9a55b;
  --ct-red: #ef7d72;
  --ct-blue: #6aa5de;
  --ct-radius: 14px;
  --ct-shadow: 0 24px 70px rgba(27, 48, 38, .12);
  --ct-font-serif: Georgia, 'Times New Roman', serif;
  --ct-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

[data-skin="collectium"] {
  --ct-bg: #0e1724; --ct-page: #111c2c; --ct-panel: #162235; --ct-panel-2: #1c2b44;
  --ct-text: #f2f7ff; --ct-muted: #9fb1c8; --ct-line: rgba(125, 179, 255, .28);
  --ct-line-soft: rgba(125, 179, 255, .13); --ct-accent: #7db3ff; --ct-accent-2: #b8d6ff;
}
[data-skin="enkel"] {
  --ct-bg: #eef2f6; --ct-page: #f8fafc; --ct-panel: #ffffff; --ct-panel-2: #f7f9fb;
  --ct-text: #162332; --ct-muted: #697789; --ct-line: rgba(42, 70, 95, .20);
  --ct-line-soft: rgba(42, 70, 95, .09); --ct-accent: #2d5f90; --ct-accent-2: #234d76;
}
[data-skin="museum"] {
  --ct-bg: #0b0b0a; --ct-page: #11100f; --ct-panel: #171717; --ct-panel-2: #1b1b1a;
  --ct-text: #f4efe7; --ct-muted: #aaa296; --ct-line: rgba(203, 163, 83, .26);
  --ct-line-soft: rgba(203, 163, 83, .12); --ct-accent: #c9a55b; --ct-accent-2: #e4c46e;
}
[data-skin="finans"] {
  --ct-bg: #07110c; --ct-page: #0d1711; --ct-panel: #111d15; --ct-panel-2: #142319;
  --ct-text: #eefaf0; --ct-muted: #9db8a6; --ct-line: rgba(69, 190, 112, .26);
  --ct-line-soft: rgba(69, 190, 112, .11); --ct-accent: #42c46e; --ct-accent-2: #b8f5c8;
}

.ctPage { min-height: 100vh; background: radial-gradient(circle at 28% 0%, color-mix(in srgb, var(--ct-accent) 18%, transparent), transparent 35%), var(--ct-bg); color: var(--ct-text); font-family: var(--ct-font-serif); }
.ctWorkspace { width: 90%; margin: 0 auto; padding: 22px 0 90px; }
.ctPanel { position: relative; border: 1px solid var(--ct-line); border-radius: var(--ct-radius); background: linear-gradient(180deg, color-mix(in srgb, var(--ct-panel) 94%, white), var(--ct-panel)); box-shadow: var(--ct-shadow); }
.ctSignature::after { content: "____________ Collectium"; position: absolute; right: 16px; bottom: 8px; color: var(--ct-accent); font-size: 8px; letter-spacing: .12em; opacity: .78; }
.ctFilterRail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 14px 0; }
.ctFilterCard { padding: 13px; border: 1px solid var(--ct-line); border-radius: 13px; background: color-mix(in srgb, var(--ct-panel) 90%, var(--ct-accent) 5%); }
.ctSelect { width: 100%; border: 1px solid var(--ct-line); border-radius: 10px; padding: 10px 12px; background: var(--ct-page); color: var(--ct-text); }
.ctTimeline { padding: 18px; margin: 14px 0 28px; overflow: hidden; }
.ctTimelineScale { display: grid; grid-template-columns: repeat(9, 1fr); font-size: 12px; color: var(--ct-muted); margin-bottom: 14px; }
.ctLane { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 12px; align-items: center; margin: 8px 0; }
.ctLaneTrack { position: relative; height: 35px; border: 1px solid var(--ct-line-soft); border-radius: 9px; background: color-mix(in srgb, var(--ct-panel-2) 80%, transparent); }
.ctPeriodBar { position: absolute; top: 4px; bottom: 4px; border-radius: 8px; background: linear-gradient(180deg, var(--ct-accent-2), var(--ct-accent)); color: var(--ct-page); font: 700 11px var(--ct-font-sans); display: grid; place-items: center; padding: 0 8px; overflow: hidden; white-space: nowrap; }
.ctTabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
.ctTab { border: 1px solid var(--ct-line); color: var(--ct-muted); background: var(--ct-panel); border-radius: 999px; padding: 9px 13px; cursor: pointer; }
.ctTabActive { color: var(--ct-page); background: linear-gradient(180deg, var(--ct-accent-2), var(--ct-accent)); border-color: transparent; }
.ctCardGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.ctCard { padding: 12px; min-height: 150px; }
.ctCardHorizontal { display: grid; grid-template-columns: 170px minmax(0, 1fr) 138px; gap: 12px; }
.ctCardList { display: grid; grid-template-columns: 250px minmax(0, 1fr) 130px; gap: 12px; min-height: 126px; }
.ctCardMuseum { display: grid; grid-template-columns: 1fr; gap: 12px; min-height: 230px; }
.ctCardStanding { min-height: 430px; display: flex; flex-direction: column; gap: 12px; }
.ctNote { position: relative; min-height: 125px; border: 1px solid var(--ct-line); border-radius: 10px; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--ct-panel-2) 82%, transparent), color-mix(in srgb, var(--ct-panel-2) 82%, transparent) 8px, transparent 8px, transparent 16px); overflow: hidden; }
.ctNoteNumber { position: absolute; left: 18px; top: 8px; font-size: 52px; color: color-mix(in srgb, var(--ct-text) 18%, transparent); }
.ctNoteSeal { position: absolute; right: 22px; bottom: 18px; width: 58px; height: 72px; border-radius: 50% 50% 12px 12px; background: radial-gradient(circle at 45% 35%, var(--ct-accent-2), color-mix(in srgb, var(--ct-accent) 50%, #000)); opacity: .72; }
.ctObjectHero { display: grid; grid-template-columns: minmax(360px, 1fr) minmax(420px, 1.25fr); gap: 24px; padding: 22px; }
.ctObjectTitle { font-size: clamp(34px, 4vw, 58px); line-height: .98; margin: 18px 0; letter-spacing: -.03em; }
.ctObjectGrid { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 18px; }
.ctBoxGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.ctInfoBox { padding: 18px; min-height: 150px; }
.ctField { display: flex; justify-content: space-between; gap: 14px; border-bottom: 1px dashed var(--ct-line-soft); padding: 9px 0; color: var(--ct-muted); }
.ctField strong { color: var(--ct-text); text-align: right; }
.ctSideActions { display: flex; flex-direction: column; gap: 12px; }
.ctAction { border: 1px solid var(--ct-line); border-radius: 11px; background: var(--ct-panel); color: var(--ct-text); padding: 12px; text-align: left; cursor: pointer; }
.ctRelationHero { padding: 22px; }
.ctRelationList { display: grid; gap: 10px; }
.ctRelationRow { display: flex; justify-content: space-between; gap: 12px; border: 1px solid var(--ct-line-soft); border-radius: 12px; padding: 13px; }
.ctCodePanel { width: 450px; flex: 0 0 450px; min-height: 100vh; background: #071018; color: #d8edf2; border-right: 1px solid #1e4256; padding: 14px; overflow: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.ctInspectorMark { outline: 2px solid #0877ff !important; outline-offset: 2px; box-shadow: 0 0 0 9999px rgba(0, 20, 40, .10); }
.ctResizeHandle { position: absolute; width: 12px; height: 12px; border: 2px solid #0877ff; background: white; z-index: 20; }
`;

const metaList: InspectMeta[] = [
  { id: "page", label: "Testsiden", level: "side", file: FILE_PATH, selector: ".ctPage, .ctWorkspace", cssGroup: "global", description: "Global sideflate, 5% margin og skin-token-basert bakgrunn.", featureKey: "test.visning.view", api: "none", view: "none" },
  { id: "filter.master", label: "Masterfilter", level: "boks", file: FILE_PATH, selector: ".ctFilterRail .ctFilterCard", cssGroup: "filter", description: "Filterrad med Neon-lignende rullegardiner for land/kilde/type/marked.", featureKey: "catalog.filters", api: "GET /api/catalog/filters", view: "ct_filter_master_registry" },
  { id: "timeline", label: "Periode/tidslinje", level: "boks", file: FILE_PATH, selector: ".ctTimeline, .ctLane, .ctPeriodBar", cssGroup: "filter", description: "Tidslinje med konger/regenter, historisk periode, finans/okonomi og objekt/utgiver.", featureKey: "period86.timeline.view", api: "GET /api/period86/timeline", view: "ct_v_period_filter_options" },
  { id: "card.horizontal", label: "Horisontalt visningskort", level: "boks", file: FILE_PATH, selector: ".ctCard.ctCardHorizontal", cssGroup: "visningskort", description: "Kompakt horisontalt kort, to i bredden pa desktop.", featureKey: "catalog.object.open", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  { id: "card.list", label: "Listekort", level: "boks", file: FILE_PATH, selector: ".ctCard.ctCardList", cssGroup: "visningskort", description: "Kompakt listevisning med bilde, identitet og statusfelt.", featureKey: "catalog.view", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  { id: "card.museum", label: "Museumskort", level: "boks", file: FILE_PATH, selector: ".ctCard.ctCardMuseum", cssGroup: "visningskort", description: "Museumvisning, stablet to i bredden pa desktop.", featureKey: "catalog.museum.view", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  { id: "card.standing", label: "Staende kort", level: "boks", file: FILE_PATH, selector: ".ctCard.ctCardStanding", cssGroup: "visningskort", description: "Staende visningskort, to i bredden pa desktop.", featureKey: "catalog.view", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  { id: "object.hero", label: "Objektpresentasjon hero", level: "boks", file: FILE_PATH, selector: ".ctObjectHero", cssGroup: "objekt", description: "Toppfelt for full objektpresentasjon, bygget etter opplastet objektpresentasjon v10.", featureKey: "object.presentation.view", api: "GET /api/object/presentation", view: "ct_v_no_banknote_object_presentation" },
  { id: "object.title", label: "Objekttittel", level: "tekst", file: FILE_PATH, selector: ".ctObjectTitle", cssGroup: "objekt", description: "Tittelmodell for objektpresentasjon.", featureKey: "object.presentation.view", api: "GET /api/object/presentation", view: "ct_v_no_banknote_object_presentation", field: "collectium_title_no", defaultText: "10 kroner · 1979 · 1 005 · BH" },
  { id: "object.box.identity", label: "Identitet-boks", level: "boks", file: FILE_PATH, selector: ".ctInfoBox.identity", cssGroup: "objekt", description: "Boks for katalognummer, tittel, valor, ar, litra.", featureKey: "object.presentation.view", api: "GET /api/object/presentation", view: "ct_v_no_banknote_object_presentation" },
  { id: "field.value", label: "Felt: Valør", level: "felt", file: FILE_PATH, selector: ".ctField[data-field='denomination_raw_no']", cssGroup: "objekt", description: "Feltverdi for valor i objektpresentasjon.", featureKey: "object.presentation.view", api: "GET /api/object/presentation", view: "ct_v_no_banknote_object_presentation", field: "denomination_raw_no", defaultText: "10 kroner" },
  { id: "action.collection", label: "Bryter: Legg i samling", level: "bryter", file: FILE_PATH, selector: ".ctAction.primary", cssGroup: "objekt", description: "Handling for a legge objekt i brukerens samling.", featureKey: "collection.item.add", api: "POST /api/collection/items", view: "ct_v_object_user_state_resolved" },
  { id: "relation.hero", label: "Relasjonspresentasjon", level: "boks", file: FILE_PATH, selector: ".ctRelationHero", cssGroup: "relasjon", description: "Relasjonsside for node, for eksempel Olav V eller 1979.", featureKey: "object.relations.view", api: "GET /api/object/relations", view: "ct_v_object_relations_resolved" },
];

const metaMap = Object.fromEntries(metaList.map((m) => [m.id, m]));

const tabs: { key: MainTab; label: string }[] = [
  { key: "visningskort", label: "Visningskort" },
  { key: "objekt", label: "Objektpresentasjon" },
  { key: "relasjon", label: "Relasjonpresentasjon" },
  { key: "brytere", label: "Brytere" },
  { key: "api", label: "API" },
  { key: "view", label: "View" },
  { key: "felt", label: "Felt" },
  { key: "bokser", label: "Bokser" },
];

const objectTabs: { key: ObjectTab; label: string }[] = [
  { key: "samler", label: "Samler" },
  { key: "historie", label: "Historie" },
  { key: "finans", label: "Finans" },
  { key: "samling", label: "I min samling" },
];

const periodRows = [
  {
    label: "Konge / regent",
    bars: [
      { label: "Karl XV 1859-1872", left: 5, width: 18 },
      { label: "Oscar II 1872-1905", left: 22, width: 32 },
      { label: "Haakon VII 1905-1957", left: 54, width: 46 },
    ],
  },
  {
    label: "Historisk periode",
    bars: [
      { label: "Unionstid", left: 0, width: 54 },
      { label: "Selvstendig Norge", left: 54, width: 46 },
    ],
  },
  {
    label: "Finans / okonomi",
    bars: [
      { label: "Bank- og pengekrise 1816-1905", left: 10, width: 44 },
      { label: "Mellomkrig / kriseokonomi 1918-1939", left: 62, width: 21 },
    ],
  },
  {
    label: "Objekt / utgiver",
    bars: [{ label: "Norske sedler / 5. utgave 1966-1983", left: 78, width: 14 }],
  },
];

function cssSnippet(meta: InspectMeta, override?: OverrideStyle, text?: string) {
  const overrideLines = override
    ? Object.entries(override)
        .filter(([, value]) => value)
        .map(([key, value]) => `  ${key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}: ${value};`)
        .join("\n")
    : "";
  const textLine = text && meta.level === "tekst" ? `\n/* textContent: ${text} */` : "";
  return `/* ${meta.label}\n   file: ${meta.file}\n   selector: ${meta.selector}\n   level: ${meta.level}\n   feature_key: ${meta.featureKey ?? "none"}\n   api: ${meta.api ?? "none"}\n   view: ${meta.view ?? "none"}\n   field: ${meta.field ?? "none"}\n   description: ${meta.description}\n*/\n${meta.selector} {\n${overrideLines || "  /* bruk editoren til a legge inn width, height, color, background, padding osv. */"}\n}${textLine}`;
}

function makeStyle(style?: OverrideStyle): CSSProperties {
  if (!style) return {};
  return {
    width: style.width,
    height: style.height,
    padding: style.padding,
    margin: style.margin,
    background: style.background,
    color: style.color,
    borderColor: style.borderColor,
    borderRadius: style.borderRadius,
    fontSize: style.fontSize,
    transform: style.transform,
  };
}

export default function TestVisningEditorV7() {
  const [skin, setSkin] = useState<Skin>("museum");
  const [mainTab, setMainTab] = useState<MainTab>("objekt");
  const [objectTab, setObjectTab] = useState<ObjectTab>("samler");
  const [selectedId, setSelectedId] = useState("object.hero");
  const [split, setSplit] = useState(false);
  const [resizeMode, setResizeMode] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, OverrideStyle>>({});
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const selected = metaMap[selectedId] || metaMap["page"];

  const inspect = (id: string) => {
    setSelectedId(id);
    setSplit(true);
  };

  const editStyle = (key: keyof OverrideStyle, value: string) => {
    setOverrides((prev) => ({ ...prev, [selectedId]: { ...(prev[selectedId] || {}), [key]: value || undefined } }));
  };

  const resetSelected = () => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedId];
      return next;
    });
    setTextOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedId];
      return next;
    });
    setResizeMode(false);
  };

  const copySelected = async () => {
    const code = cssSnippet(selected, overrides[selectedId], textOverrides[selectedId]);
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const helper = (id: string, className = "", extra?: CSSProperties) => ({
    className: `${className} ${selectedId === id ? "ctInspectorMark" : ""}`,
    style: { ...makeStyle(overrides[id]), ...extra },
    onContextMenu: (event: React.MouseEvent) => {
      event.preventDefault();
      inspect(id);
    },
    onClick: (event: React.MouseEvent) => {
      if ((event.altKey || event.metaKey) && metaMap[id]) inspect(id);
    },
    "data-edit-id": id,
  });

  const currentCode = useMemo(() => cssSnippet(selected, overrides[selectedId], textOverrides[selectedId]), [selected, overrides, selectedId, textOverrides]);

  const preview = (
    <div data-skin={skin} {...helper("page", "ctPage")}>
      <style dangerouslySetInnerHTML={{ __html: baseCss }} />
      <div className="ctWorkspace">
        <TopBar skin={skin} setSkin={setSkin} split={split} setSplit={setSplit} />

        <section {...helper("filter.master", "ctFilterRail")}>
          <FilterCard title="Masterfilter" labels={["Land", "Kilde", "Objektgruppe", "Marked"]} values={["Norge", "Norske sedler", "Banknote", "Alle"]} />
          <FilterCard title="Samlerfilter" labels={["Hjerte", "Stjerne", "Min samling", "Deling"]} values={["Alle", "Alle", "Alle", "12t"]} />
          <FilterCard title="Forhandlerfilter" labels={["Auksjon", "Nettbutikk", "Innlevering", "Fee"]} values={["Alle", "Alle", "Under kontroll", "Standard"]} />
          <FilterCard title="Objektfilter" labels={["Valør", "År", "Litra", "Utgave"]} values={["10 kroner", "1979", "BH", "5. utgave"]} />
        </section>

        <section {...helper("timeline", "ctTimeline ctPanel ctSignature")}>
          <div className="ctTimelineScale">{[1810, 1840, 1870, 1900, 1930, 1960, 1990, 2020, 2024].map((y) => <span key={y}>{y}</span>)}</div>
          {periodRows.map((row) => (
            <div className="ctLane" key={row.label}>
              <strong>{row.label}</strong>
              <div className="ctLaneTrack">
                {row.bars.map((bar) => (
                  <span key={bar.label} className="ctPeriodBar" style={{ left: `${bar.left}%`, width: `${bar.width}%` }}>{bar.label}</span>
                ))}
              </div>
            </div>
          ))}
        </section>

        <nav className="ctTabs">
          {tabs.map((tab) => <button key={tab.key} className={`ctTab ${mainTab === tab.key ? "ctTabActive" : ""}`} onClick={() => setMainTab(tab.key)}>{tab.label}</button>)}
        </nav>

        {mainTab === "visningskort" && <DisplayCards helper={helper} />}
        {mainTab === "objekt" && <ObjectPresentation helper={helper} objectTab={objectTab} setObjectTab={setObjectTab} textOverrides={textOverrides} />}
        {mainTab === "relasjon" && <RelationPresentation helper={helper} />}
        {mainTab === "brytere" && <SystemList title="Brytere / feature_keys" rows={metaList.filter((m) => m.featureKey).map((m) => [m.label, m.featureKey || "", m.api || ""])} />}
        {mainTab === "api" && <SystemList title="API-ruter" rows={metaList.filter((m) => m.api).map((m) => [m.api || "", m.label, m.featureKey || ""])} />}
        {mainTab === "view" && <SystemList title="Views" rows={metaList.filter((m) => m.view).map((m) => [m.view || "", m.label, m.field || ""])} />}
        {mainTab === "felt" && <SystemList title="Felt" rows={metaList.filter((m) => m.level === "felt" || m.field).map((m) => [m.field || m.label, m.selector, m.view || ""])} />}
        {mainTab === "bokser" && <SystemList title="Bokser" rows={metaList.filter((m) => m.level === "boks" || m.level === "side").map((m) => [m.label, m.selector, m.description])} />}
      </div>
    </div>
  );

  return split ? (
    <div className="ctSplit" style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <CodePanel
        selected={selected}
        selectedId={selectedId}
        overrides={overrides[selectedId] || {}}
        textValue={textOverrides[selectedId] ?? selected.defaultText ?? ""}
        setTextValue={(value: string) => setTextOverrides((prev) => ({ ...prev, [selectedId]: value }))}
        editStyle={editStyle}
        resetSelected={resetSelected}
        copySelected={copySelected}
        copied={copied}
        currentCode={currentCode}
        resizeMode={resizeMode}
        setResizeMode={setResizeMode}
        close={() => setSplit(false)}
      />
      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        {preview}
        {resizeMode && <ResizeOverlay />}
      </div>
    </div>
  ) : preview;
}

function TopBar({ skin, setSkin, split, setSplit }: { skin: Skin; setSkin: (skin: Skin) => void; split: boolean; setSplit: (value: boolean) => void }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 18 }}>
      <div>
        <p style={{ margin: 0, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--ct-muted)", fontSize: 12 }}>Collectium UI/UX 8.6 · Live editor</p>
        <h1 style={{ margin: "4px 0 0", fontSize: 34, fontFamily: "var(--ct-font-sans)" }}>Test / Visning</h1>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {(["collectium", "enkel", "museum", "finans"] as Skin[]).map((s) => <button key={s} className={`ctTab ${skin === s ? "ctTabActive" : ""}`} onClick={() => setSkin(s)}>{s}</button>)}
        <button className="ctTab ctTabActive" onClick={() => setSplit(!split)}>{split ? "Lukk split" : "Global CSS / split"}</button>
      </div>
    </header>
  );
}

function FilterCard({ title, labels, values }: { title: string; labels: string[]; values: string[] }) {
  return (
    <div className="ctFilterCard">
      <strong style={{ display: "block", marginBottom: 8, letterSpacing: ".12em", textTransform: "uppercase", fontSize: 12 }}>{title}</strong>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {labels.map((label, index) => (
          <label key={label} style={{ fontSize: 11, color: "var(--ct-muted)", display: "grid", gap: 4 }}>
            {label}
            <select className="ctSelect" defaultValue={values[index]}>
              <option>{values[index]}</option>
              <option>Alle</option>
              <option>Norge</option>
              <option>Oscar II</option>
              <option>Olav V</option>
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

function NoteImage({ wide = false }: { wide?: boolean }) {
  return (
    <div className="ctNote" style={{ minHeight: wide ? 170 : undefined }}>
      <span className="ctNoteNumber">100</span>
      <span className="ctNoteSeal" />
      <span style={{ position: "absolute", left: 16, bottom: 16, letterSpacing: ".18em", fontSize: 11, fontWeight: 700 }}>NORGES BANK</span>
    </div>
  );
}

function MiniStatus() {
  return <div style={{ display: "grid", gap: 7 }}><button className="ctAction">♥ Hjerte 0</button><button className="ctAction">★ Stjerne 0</button><button className="ctAction">⚑ Auksjon 3</button><button className="ctAction">◆ Nettbutikk 1</button><button className="ctAction">Ikke estimert</button></div>;
}

function DisplayCards({ helper }: { helper: (id: string, className?: string, extra?: CSSProperties) => any }) {
  return (
    <section style={{ display: "grid", gap: 20 }}>
      <h2>Visningskort</h2>
      <div className="ctCardGrid">
        <article {...helper("card.horizontal", "ctCard ctCardHorizontal ctPanel ctSignature")}><NoteImage /><CardText /><MiniStatus /></article>
        <article {...helper("card.horizontal", "ctCard ctCardHorizontal ctPanel ctSignature")}><NoteImage /><CardText /><MiniStatus /></article>
      </div>
      <h3>Liste · kompakt</h3>
      <div className="ctCardGrid"><article {...helper("card.list", "ctCard ctCardList ctPanel ctSignature")}><NoteImage wide /><CardText /><MiniStatus /></article><article {...helper("card.list", "ctCard ctCardList ctPanel ctSignature")}><NoteImage wide /><CardText /><MiniStatus /></article></div>
      <h3>Museum · to i bredden</h3>
      <div className="ctCardGrid"><article {...helper("card.museum", "ctCard ctCardMuseum ctPanel ctSignature")}><NoteImage wide /><CardText /></article><article {...helper("card.museum", "ctCard ctCardMuseum ctPanel ctSignature")}><NoteImage wide /><CardText /></article></div>
      <h3>Stående · to i bredden</h3>
      <div className="ctCardGrid"><article {...helper("card.standing", "ctCard ctCardStanding ctPanel ctSignature")}><NoteImage wide /><CardText /><MiniStatus /></article><article {...helper("card.standing", "ctCard ctCardStanding ctPanel ctSignature")}><NoteImage wide /><CardText /><MiniStatus /></article></div>
    </section>
  );
}

function CardText() {
  return <div><h3 style={{ margin: "0 0 8px", fontSize: 24 }}>10 kroner · 1979 · BH</h3><div className="ctField"><span>Valør</span><strong>10 kroner</strong></div><div className="ctField"><span>Utgave</span><strong>1966-1983</strong></div><div className="ctField"><span>Variant</span><strong>Standard</strong></div><p style={{ color: "var(--ct-muted)", fontSize: 13 }}>norske_sedler · banknote · NS 1005</p></div>;
}

function ObjectPresentation({ helper, objectTab, setObjectTab, textOverrides }: { helper: any; objectTab: ObjectTab; setObjectTab: (t: ObjectTab) => void; textOverrides: Record<string, string> }) {
  return (
    <section>
      <article {...helper("object.hero", "ctObjectHero ctPanel ctSignature")}>
        <NoteImage wide />
        <div>
          <span className="ctTab ctTabActive">Norge · Seddel · Norske sedler · Standardutgave</span>
          <h2 {...helper("object.title", "ctObjectTitle")}>{textOverrides["object.title"] || "10 kroner · 1979 · 1 005 · BH"}</h2>
          <p style={{ fontSize: 17, color: "var(--ct-muted)", maxWidth: 720 }}>Objektpresentasjon for hovedobjekt fra hovedkatalogen. Ikke relasjonsside. Relasjoner vises som klikkbare noder og egne faner.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, border: "1px solid var(--ct-line-soft)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 14 }}><small>Valør</small><strong style={{ display: "block" }}>10 kroner</strong></div><div style={{ padding: 14 }}><small>Regent</small><strong style={{ display: "block" }}>Olav V</strong></div><div style={{ padding: 14 }}><small>Utgave</small><strong style={{ display: "block" }}>1966-1983</strong></div>
          </div>
        </div>
      </article>
      <nav className="ctTabs">{objectTabs.map((tab) => <button key={tab.key} className={`ctTab ${objectTab === tab.key ? "ctTabActive" : ""}`} onClick={() => setObjectTab(tab.key)}>{tab.label}</button>)}</nav>
      <div className="ctObjectGrid">
        <main>
          {objectTab === "samler" && <div className="ctBoxGrid"><InfoBox helper={helper} id="object.box.identity" title="Identitet" rows={[ ["Katalognummer", "NS 1005"], ["Collectium tittel", "10 kroner · 1979"], ["Valør", "10 kroner"], ["År", "1979"], ["Litra", "BH"] ]} /><InfoBox title="Utgave" rows={[ ["Valørutgave", "5. utgave"], ["Variant", "Standardutgave"], ["Signatur", "Getz Wold / Sagård"], ["Regent", "Olav V"] ]} /><InfoBox title="Sjeldenhet" rows={[ ["Katalogvurdering", "Vanlig"], ["Mengde", "4 939 000"], ["Status", "Basis klar"] ]} /></div>}
          {objectTab === "historie" && <div className="ctBoxGrid"><InfoBox title="Periode" rows={[ ["Regentperiode", "1957-1991"], ["Utgaveperiode", "1966-1983"], ["Hovedperiode", "Selvstendig Norge"] ]} /><InfoBox title="Relasjoner" rows={[ ["Regent", "Olav V"], ["År", "1979"], ["Signatur", "Getz Wold / Sagård"] ]} /><InfoBox title="Kontekst" rows={[ ["Finanshistorie", "Oljealder"], ["Objektperiode", "5. utgave"] ]} /></div>}
          {objectTab === "finans" && <div className="ctBoxGrid"><InfoBox title="Marked" rows={[ ["Markedsverdi", "Mangler"], ["Trend", "Ikke beregnet"], ["Auksjon", "Ikke registrert"] ]} /><InfoBox title="Prisgrunnlag" rows={[ ["Observasjoner", "Mangler"], ["Grade values", "Mangler"] ]} /><InfoBox title="Index" rows={[ ["Kjøpekraft", "Henter"], ["Rente/metall", "Henter"] ]} /></div>}
          {objectTab === "samling" && <div className="ctBoxGrid"><InfoBox title="Kjøp" rows={[ ["Dato", "Ikke registrert"], ["Sted", "Ikke registrert"], ["Pris", "Ikke registrert"] ]} /><InfoBox title="Kvalitet" rows={[ ["Min kvalitet", "Ikke vurdert"], ["Synlighet", "Privat"] ]} /><InfoBox title="Egne spesifikasjoner" rows={[ ["Papirfølelse", "Henter"], ["Proveniens", "Privat/samtykke"] ]} /></div>}
        </main>
        <aside className="ctSideActions"><button {...helper("action.collection", "ctAction ctTabActive")}>＋ Legg i samling</button><button className="ctAction">♡ Hjerte</button><button className="ctAction">★ Stjerne</button><button className="ctAction">↗ Del objekt</button></aside>
      </div>
    </section>
  );
}

function InfoBox({ title, rows, helper, id }: { title: string; rows: string[][]; helper?: any; id?: string }) {
  const props = helper && id ? helper(id, "ctInfoBox ctPanel ctSignature identity") : { className: "ctInfoBox ctPanel ctSignature" };
  return <section {...props}><h3>{title}</h3>{rows.map(([k, v]) => <div key={k} className="ctField" data-field={k === "Valør" ? "denomination_raw_no" : undefined}><span>{k}</span><strong>{v}</strong></div>)}</section>;
}

function RelationPresentation({ helper }: { helper: any }) {
  return <section {...helper("relation.hero", "ctRelationHero ctPanel ctSignature")}><h2 style={{ fontSize: 42, marginTop: 0 }}>Relasjon · Olav V</h2><p style={{ color: "var(--ct-muted)", fontSize: 16 }}>Kunnskapsside for relasjonsnode. Viser periode, objekter, videre relasjoner og tidskontekst.</p><div className="ctRelationList"><div className="ctRelationRow"><strong>Regentperiode</strong><span>1957-1991</span></div><div className="ctRelationRow"><strong>Relaterte sedler</strong><span>5. utgave · 1966-1983</span></div><div className="ctRelationRow"><strong>Periodefilter</strong><span>Selvstendig Norge · Oljealder</span></div><div className="ctRelationRow"><strong>Href</strong><span>/relasjon/regent/olav-v</span></div></div></section>;
}

function SystemList({ title, rows }: { title: string; rows: string[][] }) {
  return <section className="ctPanel ctSignature" style={{ padding: 20 }}><h2>{title}</h2><div style={{ display: "grid", gap: 8 }}>{rows.map((row, i) => <div key={i} className="ctRelationRow">{row.map((cell, j) => <span key={j}>{cell}</span>)}</div>)}</div></section>;
}

function CodePanel({ selected, overrides, textValue, setTextValue, editStyle, resetSelected, copySelected, copied, currentCode, resizeMode, setResizeMode, close }: any) {
  return (
    <aside className="ctCodePanel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><strong>Inspector / CSS editor</strong><button onClick={close}>Lukk</button></div>
      <p style={{ color: "#88b8c8", fontSize: 12 }}>Høyreklikk element i forhåndsvisning for å velge. Feltet markeres som Inspect i Chrome.</p>
      <h3>{selected.label}</h3>
      <div style={{ fontSize: 12, lineHeight: 1.65 }}>
        <div>Level: <b>{selected.level}</b></div><div>File: <b>{selected.file}</b></div><div>Selector: <b>{selected.selector}</b></div><div>Feature: <b>{selected.featureKey || "none"}</b></div><div>API: <b>{selected.api || "none"}</b></div><div>View: <b>{selected.view || "none"}</b></div><div>Field: <b>{selected.field || "none"}</b></div>
      </div>
      <h4>Rediger boks/felt/bryter</h4>
      <EditorInput label="Width" value={overrides.width || ""} onChange={(v: string) => editStyle("width", v)} placeholder="340px / 100%" />
      <EditorInput label="Height" value={overrides.height || ""} onChange={(v: string) => editStyle("height", v)} placeholder="180px" />
      <EditorInput label="Padding" value={overrides.padding || ""} onChange={(v: string) => editStyle("padding", v)} placeholder="20px" />
      <EditorInput label="Margin" value={overrides.margin || ""} onChange={(v: string) => editStyle("margin", v)} placeholder="0 0 12px" />
      <EditorInput label="Bakgrunn" value={overrides.background || ""} onChange={(v: string) => editStyle("background", v)} placeholder="#1b1b1a / var(--ct-panel)" />
      <EditorInput label="Tekstfarge" value={overrides.color || ""} onChange={(v: string) => editStyle("color", v)} placeholder="#fff / var(--ct-text)" />
      <EditorInput label="Border color" value={overrides.borderColor || ""} onChange={(v: string) => editStyle("borderColor", v)} placeholder="var(--ct-accent)" />
      <EditorInput label="Radius" value={overrides.borderRadius || ""} onChange={(v: string) => editStyle("borderRadius", v)} placeholder="12px" />
      <EditorInput label="Font size" value={overrides.fontSize || ""} onChange={(v: string) => editStyle("fontSize", v)} placeholder="18px" />
      <EditorInput label="Transform" value={overrides.transform || ""} onChange={(v: string) => editStyle("transform", v)} placeholder="translateX(10px)" />
      {selected.level === "tekst" || selected.defaultText ? <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 12 }}>Tekst<textarea value={textValue} onChange={(e) => setTextValue(e.target.value)} rows={3} style={{ background: "#0b1a23", color: "#d8edf2", border: "1px solid #24485a", borderRadius: 8, padding: 8 }} /></label> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}><button onClick={() => setResizeMode(!resizeMode)}>{resizeMode ? "Lukk resize" : "Endre størrelse"}</button><button onClick={copySelected}>{copied ? "Kopiert" : "Kopier kode"}</button><button onClick={resetSelected}>Reset original</button></div>
      <h4>CSS-trestruktur</h4>
      <details open><summary>{selected.cssGroup}</summary><pre style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>{currentCode}</pre></details>
      {cssGroups.map((group) => <details key={group.key}><summary>{group.label}</summary><ul>{group.selectors.map((s) => <li key={s}>{s}</li>)}</ul></details>)}
      <h4>Original global CSS</h4><details><summary>Vis originalkilde</summary><pre style={{ whiteSpace: "pre-wrap", fontSize: 10 }}>{baseCss}</pre></details>
    </aside>
  );
}

function EditorInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <label style={{ display: "grid", gap: 4, marginTop: 8, fontSize: 12 }}>{label}<input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ background: "#0b1a23", color: "#d8edf2", border: "1px solid #24485a", borderRadius: 8, padding: 8 }} /></label>;
}

function ResizeOverlay() {
  return <div style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 50 }}><span className="ctResizeHandle" style={{ left: 460, top: 20 }} /><span className="ctResizeHandle" style={{ right: 20, top: 20 }} /><span className="ctResizeHandle" style={{ right: 20, bottom: 20 }} /><span className="ctResizeHandle" style={{ left: 460, bottom: 20 }} /></div>;
}
