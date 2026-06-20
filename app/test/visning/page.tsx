"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Test Visning Live Editor 8.6 v5
 *
 * Definering / formål:
 * Én selvstendig Next.js/React-side for /test/visning. Siden tester global skin,
 * visningskort, objektpresentasjon, relasjonspresentasjon, periode/tidslinje,
 * filterrad og live CSS-editor med inspect/right-click, split-screen, resize og reset.
 *
 * Bruksområde:
 * - /test/visning
 * - Intern UI/UX 8.6 testflate før komponenter splittes til egne filer.
 *
 * Berørte sider / routes:
 * - app/test/visning/page.tsx
 *
 * Berørte DB-brytere / feature_keys:
 * - test.visning.view
 * - test.visning.css_edit.preview
 * - catalog.object.open
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 * - period86.timeline.view
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 * - GET /api/period86/timeline
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 * - ct_v_no_banknote_object_presentation
 * - ct_v_object_relations_resolved
 * - ct_v_object_market_resolved
 * - ct_v_object_user_state_resolved
 * - ct_v_period_filter_options
 *
 * Dataretning:
 * Statisk testdata -> Next.js page -> React client state -> CSS editor -> UI preview
 *
 * Logging:
 * Ingen produksjonslogging. Testside.
 *
 * Versjon:
 * UI86-TEST-VISNING-LIVE-EDITOR-V5-ONEFILE
 */

import React, { useMemo, useRef, useState } from "react";

type Skin = "collectium" | "samler" | "museum" | "finans";
type ViewMode = "cards" | "object" | "relation" | "user" | "all";
type TimelineMode = "object" | "relation" | "period" | "index";

type CssNode = {
  id: string;
  title: string;
  selector: string;
  file: string;
  feature: string;
  api: string;
  view: string;
  code: string;
  children?: CssNode[];
};

type InspectState = {
  id: string;
  title: string;
  selector: string;
  file: string;
  feature: string;
  api: string;
  view: string;
  x: number;
  y: number;
};

type SizeMap = Record<string, { width?: number; height?: number }>;

const cssTree: CssNode[] = [
  {
    id: "global",
    title: "Global kode for testsiden",
    selector: ".ctLivePage",
    file: "app/test/visning/page.tsx :: GLOBAL_TEST_CSS",
    feature: "test.visning.view",
    api: "Ingen produksjons-API",
    view: "Ingen DB-view",
    code: `.ctLivePage {
  --ct-bg: #f7f3eb;
  --ct-panel: rgba(255, 253, 247, 0.92);
  --ct-ink: #173d31;
  --ct-muted: #6b8b7e;
  --ct-line: rgba(27, 78, 60, 0.23);
  --ct-soft: rgba(45, 108, 78, 0.08);
  --ct-gold: #c8a34f;
  --ct-radius: 14px;
  --ct-shadow: 0 18px 42px rgba(29, 54, 42, 0.12);
  min-height: 100vh;
  background: var(--ct-bg);
  color: var(--ct-ink);
}`,
    children: [
      {
        id: "global-skins",
        title: "Skin tokens",
        selector: ".ctLivePage[data-skin='museum']",
        file: "app/test/visning/page.tsx :: SKIN_TOKENS",
        feature: "template.skin.view",
        api: "GET /api/account/preferences senere",
        view: "ct_user_preferences / global token registry senere",
        code: `.ctLivePage[data-skin='museum'] {
  --ct-bg: #11110f;
  --ct-panel: rgba(31, 31, 30, 0.94);
  --ct-ink: #fff7df;
  --ct-muted: #b8ad91;
  --ct-line: rgba(214, 178, 90, 0.32);
  --ct-soft: rgba(214, 178, 90, 0.08);
  --ct-gold: #d0aa55;
  --ct-shadow: 0 22px 52px rgba(0, 0, 0, 0.28);
}`,
      },
    ],
  },
  {
    id: "layout",
    title: "Page/layout: full innholdsbredde med 5% margin og split-screen",
    selector: ".ctCanvasWrap, .ctSplitActive",
    file: "app/test/visning/page.tsx :: PAGE_LAYOUT_CSS",
    feature: "test.visning.layout.preview",
    api: "Ingen",
    view: "Ingen",
    code: `.ctCanvasWrap {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 22px 5% 80px;
}
.ctSplitActive {
  display: grid;
  grid-template-columns: 450px minmax(0, 1fr);
  gap: 0;
  min-height: 100vh;
}
.ctCodeRail {
  width: 450px;
  border-right: 1px solid var(--ct-line);
  background: rgba(10, 12, 11, 0.96);
}`,
  },
  {
    id: "filters",
    title: "Masterfilter / samler / forhandler / objekt / periode",
    selector: ".ctFilterDeck",
    file: "app/test/visning/page.tsx :: FILTER_CSS",
    feature: "filter.master.view",
    api: "GET /api/catalog/filters",
    view: "ct_v_catalog_filter_counts + ct_v_period_filter_options",
    code: `.ctFilterDeck {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 10px;
  margin: 14px 0 12px;
}
.ctFilterGroup {
  border: 1px solid var(--ct-line);
  border-radius: var(--ct-radius);
  background: var(--ct-panel);
  padding: 10px;
}`,
  },
  {
    id: "timeline",
    title: "Periodefilter / tidslinje med 4 valg",
    selector: ".ctTimeline",
    file: "app/test/visning/page.tsx :: TIMELINE_CSS",
    feature: "period86.timeline.view",
    api: "GET /api/period86/timeline",
    view: "ct_v_period_filter_options",
    code: `.ctTimeline {
  border: 1px solid var(--ct-line);
  border-radius: var(--ct-radius);
  background: var(--ct-panel);
  padding: 14px;
  margin: 10px 0 24px;
}
.ctTimelineTrack {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  padding-top: 22px;
}
.ctTimelineTrack::before {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  top: 36px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--ct-gold), transparent);
}`,
  },
  {
    id: "cards",
    title: "Visningskort: horisontal/liste/museum/stående",
    selector: ".ctObjectCard",
    file: "app/test/visning/page.tsx :: CARD_CSS",
    feature: "catalog.object.open",
    api: "GET /api/catalog/search",
    view: "ct_v_catalog_objects_resolved",
    code: `.ctObjectCard {
  position: relative;
  border: 1px solid var(--ct-line);
  border-radius: var(--ct-radius);
  background: var(--ct-panel);
  box-shadow: var(--ct-shadow);
  overflow: hidden;
}
.ctHorizontalCards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ctMuseumCards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ctStandingCards { grid-template-columns: repeat(2, minmax(260px, 1fr)); }`,
  },
  {
    id: "object",
    title: "Objektpresentasjon",
    selector: ".ctObjectPresentation",
    file: "app/test/visning/page.tsx :: OBJECT_PRESENTATION_CSS",
    feature: "object.presentation.view",
    api: "GET /api/object/presentation",
    view: "ct_v_no_banknote_object_presentation",
    code: `.ctObjectPresentation {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
  gap: 24px;
  border: 1px solid var(--ct-line);
  border-radius: calc(var(--ct-radius) + 4px);
  background: var(--ct-panel);
  padding: 24px;
}`,
  },
  {
    id: "relation",
    title: "Relasjonpresentasjon",
    selector: ".ctRelationPresentation",
    file: "app/test/visning/page.tsx :: RELATION_PRESENTATION_CSS",
    feature: "object.relations.view",
    api: "GET /api/object/relations",
    view: "ct_v_object_relations_resolved",
    code: `.ctRelationPresentation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  border: 1px solid var(--ct-line);
  border-radius: var(--ct-radius);
  background: var(--ct-panel);
  padding: 18px;
}`,
  },
  {
    id: "inspector",
    title: "Inspector / høyreklikk / resize-håndtak",
    selector: ".ctSelectedInspect",
    file: "app/test/visning/page.tsx :: INSPECTOR_CSS",
    feature: "test.visning.css_edit.preview",
    api: "Ingen",
    view: "Ingen",
    code: `.ctSelectedInspect {
  outline: 2px solid #44a3ff !important;
  outline-offset: 3px;
  box-shadow: 0 0 0 5px rgba(68, 163, 255, 0.18), var(--ct-shadow) !important;
}
.ctResizeHandle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #44a3ff;
  border: 2px solid white;
  border-radius: 999px;
  z-index: 30;
}`,
  },
];

const flatNodes = (nodes: CssNode[]): CssNode[] => nodes.flatMap((n) => [n, ...(n.children ? flatNodes(n.children) : [])]);
const allNodes = flatNodes(cssTree);
const baseCss = allNodes.map((n) => `/* ${n.title} */\n${n.code}`).join("\n\n");

const objectData = {
  title: "100 kroner · 1. utgave · 1877 · Seddelpapir",
  titleSmall: "1 øre · 1876 · Bronse · 1",
  source: "norske_sedler · banknote · NS 1 459",
  market: "15 000 kr",
  trend: "+4,2 %",
  rarity: "RRR",
  regent: "Oscar II",
  period: "1872–1905",
  motif: "Riksvåpen",
  signature: "Winge / Getz",
};

const timelineItems = [
  { year: "1877", title: "1. utgave", text: "Objektår / publisering" },
  { year: "1905", title: "Unionsbrudd", text: "Relasjon til maktstruktur" },
  { year: "1940", title: "Krig / okkupasjon", text: "Historisk kontekst" },
  { year: "1969", title: "Oljealder", text: "Finanshistorisk lag" },
  { year: "2000", title: "Ny markedsfase", text: "Index / samleraktivitet" },
  { year: "2026", title: "Collectium", text: "Digital relasjonskatalog" },
];

const fieldInfo: Record<string, Partial<InspectState>> = {
  "master-filter": { title: "Master filter", selector: ".ctFilterDeck .ctFilterGroup", file: "app/test/visning/page.tsx", feature: "filter.master.view", api: "GET /api/catalog/filters", view: "ct_v_catalog_filter_counts" },
  timeline: { title: "Periode tidslinje", selector: ".ctTimeline", file: "app/test/visning/page.tsx", feature: "period86.timeline.view", api: "GET /api/period86/timeline", view: "ct_v_period_filter_options" },
  horizontal: { title: "Horisontalt visningskort", selector: ".ctHorizontalCards .ctObjectCard", file: "app/test/visning/page.tsx", feature: "catalog.object.open", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  list: { title: "Listevisningskort", selector: ".ctListCards .ctObjectCard", file: "app/test/visning/page.tsx", feature: "catalog.object.open", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  museum: { title: "Museum visningskort", selector: ".ctMuseumCards .ctObjectCard", file: "app/test/visning/page.tsx", feature: "catalog.object.open", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  standing: { title: "Stående visningskort", selector: ".ctStandingCards .ctObjectCard", file: "app/test/visning/page.tsx", feature: "catalog.object.open", api: "GET /api/catalog/search", view: "ct_v_catalog_objects_resolved" },
  object: { title: "Objektpresentasjon", selector: ".ctObjectPresentation", file: "app/test/visning/page.tsx", feature: "object.presentation.view", api: "GET /api/object/presentation", view: "ct_v_no_banknote_object_presentation" },
  relation: { title: "Relasjonpresentasjon", selector: ".ctRelationPresentation", file: "app/test/visning/page.tsx", feature: "object.relations.view", api: "GET /api/object/relations", view: "ct_v_object_relations_resolved" },
  user: { title: "Bruker/I min samling", selector: ".ctUserPanel", file: "app/test/visning/page.tsx", feature: "object.user_state.view", api: "GET /api/object/user-state", view: "ct_v_object_user_state_resolved" },
};

function NoteImage({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "ctNote ctNoteCompact" : "ctNote"} data-inspect-id="horizontal"><b>100</b><span>NORGES BANK</span><i /></div>;
}

function Signature() { return <span className="ctSignature">Collectium</span>; }

function ResizeHandles({ id, active, onStart }: { id: string; active: boolean; onStart: (id: string, corner: string, event: React.MouseEvent) => void }) {
  if (!active) return null;
  return <>
    {['nw','ne','sw','se'].map((corner) => <button key={corner} className={`ctResizeHandle ctResize${corner.toUpperCase()}`} onMouseDown={(e) => onStart(id, corner, e)} aria-label={`Resize ${corner}`} />)}
  </>;
}

function InspectBox({ id, children, className = "", style, selectedId, resizeEnabled, onResizeStart }: { id: string; children: React.ReactNode; className?: string; style?: React.CSSProperties; selectedId: string | null; resizeEnabled: boolean; onResizeStart: (id: string, corner: string, event: React.MouseEvent) => void }) {
  return <div data-inspect-id={id} className={`${className} ${selectedId === id ? "ctSelectedInspect" : ""}`} style={style}>
    {children}
    <ResizeHandles id={id} active={selectedId === id && resizeEnabled} onStart={onResizeStart} />
  </div>;
}

function FilterDeck({ timelineMode, setTimelineMode }: { timelineMode: TimelineMode; setTimelineMode: (m: TimelineMode) => void }) {
  const rows = [
    ["Master filter", "Land · Kilde · Objektgruppe · Marked"],
    ["Samler filter", "Hjerte · Stjerne · Min samling · Deling"],
    ["Forhandler filter", "Auksjon · Nettbutikk · Innlevering · Fee"],
    ["Objektfilter", "Valør · År · Litra · Serie · Variant"],
  ];
  return <>
    <section className="ctFilterDeck" data-inspect-id="master-filter">
      {rows.map(([a, b]) => <div className="ctFilterGroup" key={a}><strong>{a}</strong><span>{b}</span><button>Åpne</button></div>)}
    </section>
    <div className="ctAreaRow" data-inspect-id="master-filter">
      <b>Område</b><button>Norge</button><button>Sedler</button><button>Norske sedler</button><button>Standardutgave</button><button>1877</button>
    </div>
    <section className="ctTimeline" data-inspect-id="timeline">
      <header><div><b>Periodefilter / tidslinje</b><span>4 valg styrer kontekst for visningskort, objektpresentasjon og relasjon.</span></div><nav>{[
        ["object", "Objektpresentasjon"], ["relation", "Relasjonpresentasjon"], ["period", "Periode 8.6"], ["index", "Index / Finans"]
      ].map(([key, label]) => <button key={key} onClick={() => setTimelineMode(key as TimelineMode)} className={timelineMode === key ? "isActive" : ""}>{label}</button>)}</nav></header>
      <div className="ctTimelineTrack">
        {timelineItems.map((item) => <article key={item.year} className={timelineMode === "period" && Number(item.year) < 1940 ? "isHot" : ""}><strong>{item.year}</strong><b>{item.title}</b><span>{item.text}</span></article>)}
      </div>
    </section>
  </>;
}

function ObjectCard({ kind }: { kind: "horizontal" | "list" | "museum" | "standing" }) {
  const inspectId = kind;
  return <article className={`ctObjectCard ctCard${kind}`} data-inspect-id={inspectId}>
    <NoteImage compact={kind === "list"} />
    <section className="ctCardText">
      <h3>{kind === "museum" ? `Museum · ${objectData.titleSmall}` : objectData.titleSmall}</h3>
      <div className="ctSpecGrid"><span>Valør</span><b>1 øre</b><span>Utgave</span><b>1876–1902</b><span>Variant</span><b>Ikke registrert</b><span>Sjeldenhet</span><b>Ikke vurdert</b></div>
      <p>{objectData.source}</p>
      <div className="ctHistoryMini"><b>Historie</b><span>Frederik VI · 1808–1814</span><span>Relasjon tilgjengelig</span></div>
      <nav><button>Åpne objekt</button><button>Se relasjon</button><button>Legg i samling</button></nav>
    </section>
    <aside className="ctStatusMini"><span>♥ Hjerte 0</span><span>★ Stjerne 0</span><span>⚑ Auksjon 3</span><span>◆ Nettbutikk 1</span><b>Ikke estimert</b></aside>
    <Signature />
  </article>;
}

function CardsSection({ selectedId, resizeEnabled, sizes, onResizeStart }: { selectedId: string | null; resizeEnabled: boolean; sizes: SizeMap; onResizeStart: (id: string, corner: string, e: React.MouseEvent) => void }) {
  const styleOf = (id: string): React.CSSProperties => ({ width: sizes[id]?.width, height: sizes[id]?.height });
  return <section className="ctSection">
    <h2>Visningskort</h2>
    <h3>Horisontal · kompakt · to i bredden</h3>
    <div className="ctCardGrid ctHorizontalCards"><InspectBox id="horizontal" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart} style={styleOf("horizontal")}><ObjectCard kind="horizontal" /></InspectBox><InspectBox id="horizontal-2" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart}><ObjectCard kind="horizontal" /></InspectBox></div>
    <h3>Liste · kompakt</h3>
    <div className="ctCardGrid ctListCards"><InspectBox id="list" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart} style={styleOf("list")}><ObjectCard kind="list" /></InspectBox></div>
    <h3>Museum · stablet to i bredden</h3>
    <div className="ctCardGrid ctMuseumCards"><InspectBox id="museum" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart} style={styleOf("museum")}><ObjectCard kind="museum" /></InspectBox><InspectBox id="museum-2" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart}><ObjectCard kind="museum" /></InspectBox></div>
    <h3>Stående · to i bredden</h3>
    <div className="ctCardGrid ctStandingCards"><InspectBox id="standing" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart} style={styleOf("standing")}><ObjectCard kind="standing" /></InspectBox><InspectBox id="standing-2" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart}><ObjectCard kind="standing" /></InspectBox></div>
  </section>;
}

function ObjectPresentation({ selectedId, resizeEnabled, sizes, onResizeStart }: { selectedId: string | null; resizeEnabled: boolean; sizes: SizeMap; onResizeStart: (id: string, corner: string, e: React.MouseEvent) => void }) {
  return <InspectBox id="object" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart} style={{ width: sizes.object?.width, height: sizes.object?.height }} className="ctObjectPresentation">
    <div className="ctObjectHero"><NoteImage /><div className="ctObjectTabs"><button>Forside</button><button>Bakside</button><button>Gjennomlysning</button><button>Variant</button><button>Detalj</button></div></div>
    <div className="ctObjectInfo"><p className="ctBreadcrumb">Norge · Seddel · Norske sedler · Standardutgave</p><h1>{objectData.title}</h1><p>Tidlig hovedvalør fra den norske seddelhistorien — utgitt under Oscar II i unionstiden. Sjelden i alle kvaliteter, ekstremt sjelden over 45 XF.</p><div className="ctMetricRow"><span><em>Markedsverdi</em><b>{objectData.market}</b></span><span><em>Trend 12 mnd</em><b>{objectData.trend}</b></span><span><em>Sjeldenhet</em><b>{objectData.rarity}</b></span><span><em>Konge</em><b>{objectData.regent}</b></span></div></div>
    <Signature />
  </InspectBox>;
}

function RelationPresentation({ selectedId, resizeEnabled, sizes, onResizeStart }: { selectedId: string | null; resizeEnabled: boolean; sizes: SizeMap; onResizeStart: (id: string, corner: string, e: React.MouseEvent) => void }) {
  return <InspectBox id="relation" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart} style={{ width: sizes.relation?.width, height: sizes.relation?.height }} className="ctRelationPresentation">
    <section><p className="ctBreadcrumb">Relasjon · Regent · Skandinavia</p><h2>Oscar II</h2><p>Regentperiode 1872–1905. Knytter norske sedler, unionstid, motiv, signaturer, kongemakt og historiske hendelser.</p><div className="ctRelationList">{["Relaterte sedler", "Relaterte mynter", "Unionstid", "Winge / Getz", "Riksvåpen", "Publiseringsår 1877"].map((x) => <button key={x}>{x} →</button>)}</div></section>
    <aside className="ctRelationAside"><b>API og view</b><span>GET /api/object/relations</span><span>ct_v_object_relations_resolved</span><span>relation_href: /relasjon/regent/oscar-ii</span></aside>
    <Signature />
  </InspectBox>;
}

function UserPanel({ selectedId, resizeEnabled, sizes, onResizeStart }: { selectedId: string | null; resizeEnabled: boolean; sizes: SizeMap; onResizeStart: (id: string, corner: string, e: React.MouseEvent) => void }) {
  return <InspectBox id="user" selectedId={selectedId} resizeEnabled={resizeEnabled} onResizeStart={onResizeStart} style={{ width: sizes.user?.width, height: sizes.user?.height }} className="ctUserPanel">
    <h2>I min samling / brukerkort</h2><div className="ctUserGrid"><article><b>Kjøp</b><span>Dato: Ikke registrert</span><span>Pris: Ikke registrert</span></article><article><b>Kvalitet</b><span>Min kvalitet: Ikke vurdert</span><span>Synlighet: Privat</span></article><article><b>Status</b><button>♥ Hjerte</button><button>★ Stjerne</button><button>+ Legg i samling</button></article><article><b>Deling</b><button>6t</button><button>12t</button><button>24t</button><button>48t</button></article></div><Signature />
  </InspectBox>;
}

function CodeRail({ selectedNode, setSelectedNode, code, setCode, onReset, fullSplit, setFullSplit }: { selectedNode: CssNode; setSelectedNode: (n: CssNode) => void; code: string; setCode: (v: string) => void; onReset: () => void; fullSplit: boolean; setFullSplit: (v: boolean) => void }) {
  const renderNode = (node: CssNode, depth = 0) => <div key={node.id}><button className={selectedNode.id === node.id ? "isActive" : ""} style={{ paddingLeft: 10 + depth * 14 }} onClick={() => setSelectedNode(node)}>▸ {node.title}</button>{node.children?.map((c) => renderNode(c, depth + 1))}</div>;
  return <aside className="ctCodeRail">
    <header><b>CSS / kodefelt</b><button onClick={() => setFullSplit(!fullSplit)}>{fullSplit ? "Lukk full split" : "Full split"}</button></header>
    <div className="ctCodeMeta"><span>Fil: {selectedNode.file}</span><span>Selector: {selectedNode.selector}</span><span>Feature: {selectedNode.feature}</span><span>API: {selectedNode.api}</span><span>View: {selectedNode.view}</span></div>
    <div className="ctCodeTree">{cssTree.map((n) => renderNode(n))}</div>
    <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
    <footer><button onClick={onReset}>Reset original kode</button><button onClick={() => navigator.clipboard?.writeText(code)}>Kopier</button></footer>
  </aside>;
}

function ApiList() {
  const rows = [
    ["Kilde", "norske_sedler / norske_mynter", "source_key"],
    ["Bryter", "catalog.object.open", "GET /api/catalog/search"],
    ["Objektpresentasjon", "object.presentation.view", "ct_v_no_banknote_object_presentation"],
    ["Relasjon", "object.relations.view", "ct_v_object_relations_resolved"],
    ["Marked", "object.market.view", "ct_v_object_market_resolved"],
    ["Periode", "period86.timeline.view", "ct_v_period_filter_options"],
  ];
  return <section className="ctApiList"><h2>Kilde · bryter · felt · API · view</h2>{rows.map(([a, b, c]) => <div key={a} data-inspect-id="relation"><b>{a}</b><span>{b}</span><code>{c}</code></div>)}</section>;
}

export default function TestVisningLiveEditorPage() {
  const [skin, setSkin] = useState<Skin>("collectium");
  const [mode, setMode] = useState<ViewMode>("all");
  const [timelineMode, setTimelineMode] = useState<TimelineMode>("object");
  const [split, setSplit] = useState(false);
  const [fullSplit, setFullSplit] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CssNode>(allNodes[0]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [inspect, setInspect] = useState<InspectState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [sizes, setSizes] = useState<SizeMap>({});
  const drag = useRef<{ id: string; startX: number; startY: number; width: number; height: number } | null>(null);

  const currentCode = edits[selectedNode.id] ?? selectedNode.code;
  const liveCss = useMemo(() => `${baseCss}\n\n/* LIVE EDITS */\n${Object.entries(edits).map(([id, css]) => `/* edited:${id} */\n${css}`).join("\n\n")}`, [edits]);

  function openInspector(id: string, x: number, y: number) {
    const f = fieldInfo[id] ?? fieldInfo[id.replace(/-2$/, "")] ?? fieldInfo.horizontal;
    setSelectedId(id);
    setInspect({ id, x, y, title: f.title ?? id, selector: f.selector ?? ".ctObjectCard", file: f.file ?? "app/test/visning/page.tsx", feature: f.feature ?? "test.visning.view", api: f.api ?? "Ingen", view: f.view ?? "Ingen" });
    const node = allNodes.find((n) => n.selector === f.selector || n.id === id || n.id === id.replace(/-2$/, ""));
    if (node) setSelectedNode(node);
    setSplit(true);
  }

  function handleContextMenu(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest("[data-inspect-id]") as HTMLElement | null;
    if (!target) return;
    e.preventDefault();
    openInspector(target.dataset.inspectId ?? "horizontal", e.clientX, e.clientY);
  }

  function startResize(id: string, _corner: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = (e.currentTarget as HTMLElement).parentElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    drag.current = { id, startX: e.clientX, startY: e.clientY, width: rect.width, height: rect.height };
    window.addEventListener("mousemove", moveResize);
    window.addEventListener("mouseup", stopResize);
  }

  function moveResize(e: MouseEvent) {
    const d = drag.current;
    if (!d) return;
    setSizes((prev) => ({ ...prev, [d.id]: { width: Math.max(220, d.width + e.clientX - d.startX), height: Math.max(120, d.height + e.clientY - d.startY) } }));
  }

  function stopResize() {
    drag.current = null;
    window.removeEventListener("mousemove", moveResize);
    window.removeEventListener("mouseup", stopResize);
  }

  const show = (m: ViewMode) => mode === "all" || mode === m;
  const chromeClass = `${split || fullSplit ? "ctSplitActive" : ""} ${fullSplit ? "ctFullSplit" : ""}`;

  return <main className="ctLivePage" data-skin={skin} onContextMenu={handleContextMenu}>
    <style>{liveCss}</style>
    <style>{staticCss}</style>
    <div className={chromeClass}>
      {(split || fullSplit) && <CodeRail selectedNode={selectedNode} setSelectedNode={(n) => { setSelectedNode(n); setEdits((p) => ({ ...p, [n.id]: p[n.id] ?? n.code })); }} code={currentCode} setCode={(v) => setEdits((p) => ({ ...p, [selectedNode.id]: v }))} onReset={() => setEdits((p) => ({ ...p, [selectedNode.id]: selectedNode.code }))} fullSplit={fullSplit} setFullSplit={setFullSplit} />}
      <div className="ctPreviewPane">
        <div className="ctCanvasWrap">
          <header className="ctTopBar"><div><p>Collectium UI/UX 8.6</p><h1>Test / Visning live editor</h1></div><nav>{(["collectium", "samler", "museum", "finans"] as Skin[]).map((s) => <button key={s} onClick={() => setSkin(s)} className={skin === s ? "isActive" : ""}>{s}</button>)}</nav><nav>{(["all", "cards", "object", "relation", "user"] as ViewMode[]).map((m) => <button key={m} onClick={() => setMode(m)} className={mode === m ? "isActive" : ""}>{m}</button>)}</nav><button onClick={() => setSplit(!split)}>Global CSS / split</button></header>
          <FilterDeck timelineMode={timelineMode} setTimelineMode={setTimelineMode} />
          {show("cards") && <CardsSection selectedId={selectedId} resizeEnabled={resizeEnabled} sizes={sizes} onResizeStart={startResize} />}
          {show("object") && <section className="ctSection"><h2>Objektpresentasjon</h2><ObjectPresentation selectedId={selectedId} resizeEnabled={resizeEnabled} sizes={sizes} onResizeStart={startResize} /></section>}
          {show("relation") && <section className="ctSection"><h2>Relasjonpresentasjon</h2><RelationPresentation selectedId={selectedId} resizeEnabled={resizeEnabled} sizes={sizes} onResizeStart={startResize} /></section>}
          {show("user") && <section className="ctSection"><UserPanel selectedId={selectedId} resizeEnabled={resizeEnabled} sizes={sizes} onResizeStart={startResize} /></section>}
          <ApiList />
        </div>
      </div>
    </div>
    {inspect && <div className="ctContextMenu" style={{ left: inspect.x, top: inspect.y }}><b>{inspect.title}</b><button onClick={() => { setSplit(true); setInspect(null); }}>Vis CSS i kodefelt</button><button onClick={() => { setResizeEnabled(true); setInspect(null); }}>Endre størrelse</button><button onClick={() => { setResizeEnabled(false); setInspect(null); }}>Slå av resize</button><span>Fil: {inspect.file}</span><span>Selector: {inspect.selector}</span><span>API: {inspect.api}</span><span>View: {inspect.view}</span></div>}
  </main>;
}

const staticCss = `
.ctLivePage * { box-sizing: border-box; }
.ctLivePage button { font: inherit; cursor: pointer; }
.ctPreviewPane { min-width: 0; width: 100%; overflow-x: hidden; }
.ctLivePage { width: 100%; }
.ctLivePage:not(.ctSplitActive) .ctPreviewPane { width: 100%; }
.ctFullSplit { position: fixed; inset: 0; z-index: 9999; background: var(--ct-bg); }
.ctFullSplit .ctCanvasWrap { width: 100%; max-width: none; margin: 0; padding-left: 5%; padding-right: 5%; }
.ctTopBar { position: sticky; top: 0; z-index: 20; display: grid; grid-template-columns: 1fr auto auto auto; gap: 12px; align-items: center; padding: 12px 0; backdrop-filter: blur(14px); }
.ctTopBar h1 { margin: 0; font-size: clamp(22px, 3vw, 42px); letter-spacing: -0.03em; }
.ctTopBar p, .ctTopBar button, .ctFilterGroup span, .ctTimeline span, .ctApiList span { color: var(--ct-muted); }
.ctTopBar nav { display: flex; gap: 6px; flex-wrap: wrap; }
.ctTopBar button, .ctObjectTabs button, .ctObjectCard button, .ctTimeline button, .ctAreaRow button, .ctFilterGroup button { border: 1px solid var(--ct-line); background: var(--ct-soft); color: var(--ct-ink); border-radius: 999px; padding: 7px 12px; }
.ctTopBar button.isActive, .ctTimeline button.isActive, .ctObjectTabs button:first-child { background: var(--ct-gold); color: #fff7df; }
.ctFilterGroup { display: grid; gap: 8px; min-height: 92px; }
.ctFilterGroup strong { text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
.ctAreaRow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border: 1px dashed var(--ct-line); border-radius: var(--ct-radius); padding: 10px; margin-bottom: 10px; }
.ctTimeline header { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
.ctTimeline header nav { display: flex; gap: 6px; flex-wrap: wrap; }
.ctTimelineTrack article { position: relative; z-index: 1; border: 1px solid var(--ct-line); background: var(--ct-bg); border-radius: 12px; padding: 14px 10px; min-height: 112px; }
.ctTimelineTrack article strong { display: block; color: var(--ct-gold); font-size: 20px; }
.ctTimelineTrack article b { display: block; margin: 6px 0; }
.ctTimelineTrack article.isHot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-gold) 28%, transparent); }
.ctSection { margin-top: 28px; }
.ctSection h2 { font-size: 26px; margin: 0 0 12px; }
.ctSection h3 { margin: 18px 0 8px; color: var(--ct-muted); font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
.ctCardGrid { display: grid; gap: 14px; margin-bottom: 12px; }
.ctCardGrid > [data-inspect-id] { min-width: 0; }
.ctHorizontalCards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ctListCards { grid-template-columns: 1fr; }
.ctMuseumCards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ctStandingCards { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
.ctObjectCard { display: grid; grid-template-columns: 190px minmax(0, 1fr) 150px; gap: 12px; min-height: 220px; padding: 12px; }
.ctCardlist { min-height: 132px; }
.ctCardlist, .ctCardlist .ctObjectCard { grid-template-columns: 320px minmax(0, 1fr) 200px; }
.ctCardmuseum .ctObjectCard, .ctCardstanding .ctObjectCard { grid-template-columns: 1fr; }
.ctNote { min-height: 180px; border: 1px solid var(--ct-line); border-radius: 10px; background: repeating-linear-gradient(-35deg, rgba(255,255,255,.06) 0 8px, transparent 8px 16px), var(--ct-soft); position: relative; overflow: hidden; padding: 18px; }
.ctNoteCompact { min-height: 120px; }
.ctNote b { font-size: 62px; opacity: .28; }
.ctNote span { position: absolute; left: 18px; bottom: 18px; letter-spacing: .18em; font-weight: 800; }
.ctNote i { position: absolute; right: 24px; top: 42%; width: 54px; height: 72px; border-radius: 35px 35px 8px 8px; background: radial-gradient(circle at 40% 30%, #fff3d0, var(--ct-gold)); opacity: .74; }
.ctCardText h3 { margin: 0 0 8px; font-size: 22px; }
.ctSpecGrid { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 6px 10px; border-bottom: 1px dashed var(--ct-line); padding-bottom: 8px; }
.ctSpecGrid span { color: var(--ct-muted); text-transform: uppercase; font-size: 10px; }
.ctHistoryMini { display: grid; gap: 4px; margin: 8px 0; padding: 9px; border: 1px solid var(--ct-line); border-radius: 10px; background: var(--ct-soft); }
.ctCardText nav { display: flex; flex-wrap: wrap; gap: 7px; }
.ctStatusMini { display: grid; gap: 6px; align-content: start; }
.ctStatusMini span, .ctStatusMini b { border: 1px solid var(--ct-line); border-radius: 10px; padding: 8px; background: var(--ct-soft); }
.ctSignature { position: absolute; right: 18px; bottom: 8px; color: var(--ct-muted); font-style: italic; font-size: 11px; opacity: .75; }
.ctObjectHero { display: grid; gap: 10px; }
.ctObjectTabs { display: flex; gap: 8px; flex-wrap: wrap; }
.ctBreadcrumb { display: inline-flex; border: 1px solid var(--ct-line); border-radius: 999px; color: var(--ct-gold); padding: 6px 12px; letter-spacing: .12em; text-transform: uppercase; font-size: 11px; }
.ctObjectInfo h1 { margin: 10px 0 12px; font-size: clamp(34px, 4vw, 62px); line-height: .95; }
.ctMetricRow { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--ct-line); margin-top: 18px; }
.ctMetricRow span { padding: 12px; border-right: 1px solid var(--ct-line); display: grid; gap: 5px; }
.ctMetricRow em { color: var(--ct-muted); text-transform: uppercase; font-size: 10px; }
.ctMetricRow b { font-size: 20px; }
.ctRelationList { display: grid; gap: 8px; margin-top: 14px; }
.ctRelationList button { text-align: left; border: 1px solid var(--ct-line); border-radius: 10px; background: var(--ct-soft); color: var(--ct-ink); padding: 12px; }
.ctRelationAside { display: grid; gap: 10px; align-content: start; border: 1px solid var(--ct-line); border-radius: 12px; padding: 12px; background: var(--ct-soft); }
.ctUserGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ctUserGrid article { display: grid; gap: 8px; border: 1px solid var(--ct-line); border-radius: 12px; padding: 12px; background: var(--ct-soft); }
.ctApiList { margin-top: 30px; display: grid; gap: 8px; }
.ctApiList div { display: grid; grid-template-columns: 190px 1fr 1fr; gap: 12px; border: 1px solid var(--ct-line); border-radius: 10px; padding: 10px; background: var(--ct-panel); }
.ctCodeRail { position: sticky; top: 0; height: 100vh; overflow: auto; padding: 12px; color: #f7f3eb; }
.ctCodeRail header, .ctCodeRail footer { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.ctCodeRail button { border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: #f7f3eb; border-radius: 8px; padding: 7px 10px; }
.ctCodeRail button.isActive { background: #c8a34f; color: #191815; }
.ctCodeMeta { display: grid; gap: 4px; font-size: 11px; color: #bdb6a4; border: 1px solid rgba(255,255,255,.12); border-radius: 10px; padding: 8px; margin: 10px 0; }
.ctCodeTree { display: grid; gap: 3px; margin-bottom: 10px; }
.ctCodeTree button { text-align: left; width: 100%; }
.ctCodeRail textarea { width: 100%; min-height: 50vh; resize: vertical; background: #070807; color: #f4eddc; border: 1px solid rgba(255,255,255,.16); border-radius: 10px; padding: 12px; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.ctContextMenu { position: fixed; z-index: 10000; display: grid; gap: 6px; width: 320px; border: 1px solid var(--ct-line); border-radius: 12px; background: var(--ct-panel); color: var(--ct-ink); box-shadow: var(--ct-shadow); padding: 10px; }
.ctContextMenu button { border: 1px solid var(--ct-line); background: var(--ct-soft); border-radius: 8px; padding: 8px; color: var(--ct-ink); text-align: left; }
.ctContextMenu span { font-size: 11px; color: var(--ct-muted); word-break: break-word; }
.ctSelectedInspect { position: relative; }
.ctResizeNW { left: -7px; top: -7px; cursor: nwse-resize; }
.ctResizeNE { right: -7px; top: -7px; cursor: nesw-resize; }
.ctResizeSW { left: -7px; bottom: -7px; cursor: nesw-resize; }
.ctResizeSE { right: -7px; bottom: -7px; cursor: nwse-resize; }
.ctLivePage[data-skin='samler'] { --ct-bg: #f5f7f2; --ct-panel: #ffffff; --ct-ink: #163f31; --ct-muted: #6a8c7c; --ct-line: rgba(24, 91, 67, .22); --ct-soft: rgba(55, 132, 92, .08); --ct-gold: #6e9b74; }
.ctLivePage[data-skin='finans'] { --ct-bg: #09121a; --ct-panel: rgba(9, 21, 31, .96); --ct-ink: #e9f6ff; --ct-muted: #91aac0; --ct-line: rgba(68, 158, 220, .28); --ct-soft: rgba(68, 158, 220, .1); --ct-gold: #38c690; }
@media (max-width: 1200px) { .ctFilterDeck, .ctHorizontalCards, .ctMuseumCards, .ctStandingCards, .ctUserGrid { grid-template-columns: 1fr; } .ctObjectPresentation, .ctRelationPresentation, .ctObjectCard { grid-template-columns: 1fr; } .ctSplitActive { grid-template-columns: 1fr; } .ctCodeRail { position: relative; width: auto; height: auto; } .ctTimelineTrack { grid-template-columns: repeat(2, 1fr); } }
`;
