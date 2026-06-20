"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Test / Visning live editor v6
 *
 * Definering / formål:
 * Én-fil Next.js/React testside for Collectium UI/UX 8.6. Siden tester
 * visningskort, objektpresentasjon, relasjonspresentasjon, brytere, API,
 * views, felt og bokser med live CSS-/tekst-/størrelseseditor.
 *
 * Bruksområde:
 * Route: /test/visning
 * Brukes som visuell og teknisk informasjonseditor før komponentene deles opp
 * i globale komponenter, CSS-moduler og API-koblede Neon views.
 *
 * Berørte sider / routes:
 * - /test/visning
 * - senere referanse for /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - senere referanse for /relasjon/[relationType]/[relationKey]
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.master.view
 * - filter.period.simple.view
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 * - relation.presentation.view
 * - catalog.object.open
 * - collection.item.add
 * - collection.wishlist.toggle
 * - collection.favorite.toggle
 *
 * Berørte API-ruter:
 * - GET /api/filter/master
 * - GET /api/filter/period/simple
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 * - GET /api/relations/[relationType]/[relationKey]
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_object_presentation_resolved
 * - ct_v_no_banknote_object_presentation
 * - ct_v_object_relations_resolved
 * - ct_v_object_market_resolved
 * - ct_v_object_user_state_resolved
 *
 * Dataretning:
 * Neon resolved views → API route → React state → UI editor preview
 *
 * Logging:
 * Ikke aktiv logging. Testside markerer feature/API/view i editorpanelet.
 *
 * Versjon:
 * UI86-TEST-VISNING-LIVE-EDITOR-V6
 */

import React, { useMemo, useState } from "react";

type Skin = "collectium" | "enkel" | "museum" | "finans";
type MainTab = "visningskort" | "objekt" | "relasjon" | "brytere" | "api" | "view" | "felt" | "bokser";
type Segment = "samler" | "historie" | "finans" | "minsamling";

type InspectMeta = {
  id: string;
  title: string;
  selector: string;
  cssSection: keyof typeof CSS_SECTIONS;
  feature: string;
  api: string;
  view: string;
  href: string;
  level: "side" | "boks" | "felt" | "bryter" | "tekst";
};

const CSS_SECTIONS = {
  "01 Global / testside": `.ctLivePage{\n  --bg:#f7f4eb;\n  --panel:#fffdf7;\n  --ink:#173e32;\n  --muted:#7f938a;\n  --line:#d7cdbb;\n  --accent:#c8a75a;\n  --accent2:#2d7f63;\n  --danger:#d96767;\n  --blue:#3f86bc;\n  min-height:100vh;\n  background:var(--bg);\n  color:var(--ink);\n  font-family:Georgia, 'Times New Roman', serif;\n}\n.ctPreviewInner{\n  width:90%;\n  margin:0 auto;\n  padding:26px 0 70px;\n}\n.ctTopTitle h1{font-size:38px;line-height:1;margin:0;letter-spacing:-.03em;}\n.ctTopTitle p{margin:0 0 6px;text-transform:uppercase;font-size:11px;letter-spacing:.14em;color:var(--muted);font-weight:800;}\n.ctTopTitle span{font-size:13px;color:var(--muted);}\n`,
  "02 Skins": `.ctLivePage[data-skin='collectium']{--bg:#f7f4eb;--panel:#fffdf7;--ink:#173e32;--muted:#789088;--line:#d8cfbf;--accent:#c8a75a;--accent2:#317c62;}\n.ctLivePage[data-skin='enkel']{--bg:#eef5fb;--panel:#ffffff;--ink:#163c65;--muted:#6f89a7;--line:#c9ddef;--accent:#1d5f9e;--accent2:#2e82bd;}\n.ctLivePage[data-skin='museum']{--bg:#12110f;--panel:#1e1e1f;--ink:#fff6df;--muted:#9b8d77;--line:#4c3f2c;--accent:#d0aa55;--accent2:#71a575;}\n.ctLivePage[data-skin='finans']{--bg:#0d1a20;--panel:#182832;--ink:#e9f7ff;--muted:#83a6b5;--line:#294552;--accent:#28b783;--accent2:#2ed39c;}\n`,
  "03 Layout / filter": `.ctControlBar{display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:12px;margin:18px 0 10px;}\n.ctFilterBox{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.05);}\n.ctFilterBox label{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);font-weight:800;margin-bottom:6px;}\n.ctFilterBox select,.ctFilterBox input{width:100%;height:38px;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--panel) 85%,var(--bg));color:var(--ink);font-weight:800;padding:0 10px;}\n.ctAreaRow{display:flex;gap:8px;flex-wrap:wrap;border-top:1px dashed var(--line);border-bottom:1px dashed var(--line);padding:10px 0;margin:12px 0;}\n.ctChip{border:1px solid var(--line);background:color-mix(in srgb,var(--panel) 75%,var(--bg));color:var(--ink);border-radius:999px;padding:8px 13px;font-weight:800;font-size:12px;}\n`,
  "04 Tidslinje / periode": `.ctTimelinePanel{border:1px solid var(--line);background:var(--panel);border-radius:16px;padding:16px;margin:14px 0 24px;overflow:hidden;}\n.ctTimelineHeader{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;margin-bottom:14px;}\n.ctTimelineGrid{display:grid;grid-template-columns:96px 1fr;gap:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:color-mix(in srgb,var(--panel) 88%,var(--bg));}\n.ctTimelineYears{grid-column:2;display:grid;grid-template-columns:repeat(12,1fr);font-size:11px;color:var(--muted);border-bottom:1px solid var(--line);}\n.ctTimelineYears span{padding:8px;border-left:1px solid color-mix(in srgb,var(--line) 70%,transparent);}\n.ctLaneLabel{padding:11px 12px;font-weight:900;font-size:12px;border-top:1px solid var(--line);background:color-mix(in srgb,var(--panel) 80%,var(--bg));}\n.ctLane{position:relative;height:42px;border-top:1px solid var(--line);background:repeating-linear-gradient(90deg,transparent 0,transparent 8.25%,color-mix(in srgb,var(--line) 45%,transparent) 8.33%);}\n.ctPeriodBar{position:absolute;top:8px;height:25px;border-radius:8px;background:var(--accent);color:#fff;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0 10px;box-shadow:0 6px 14px rgba(0,0,0,.16);}\n.ctPeriodBar.green{background:var(--accent2);}\n.ctPeriodBar.purple{background:#8e62b7;}\n.ctPeriodBar.blue{background:#2d6fa7;}\n`,
  "05 Visningskort": `.ctCardGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}\n.ctObjectCard{position:relative;border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:14px;box-shadow:0 18px 42px rgba(0,0,0,.08);}\n.ctObjectCard::after,.ctPanel::after{content:'Collectium';position:absolute;right:14px;bottom:7px;font-size:8px;color:var(--muted);font-style:italic;}\n.ctHorizontalCard{display:grid;grid-template-columns:170px 1fr 145px;gap:12px;min-height:166px;}\n.ctListCard{display:grid;grid-template-columns:220px 1fr 160px;gap:14px;align-items:center;min-height:124px;}\n.ctMuseumGrid,.ctStandingGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}\n.ctNote{position:relative;border:1px solid var(--line);border-radius:10px;min-height:132px;background:repeating-linear-gradient(135deg,rgba(0,0,0,.025) 0,rgba(0,0,0,.025) 8px,transparent 8px,transparent 18px),color-mix(in srgb,var(--panel) 70%,var(--bg));overflow:hidden;}\n.ctNote strong{font-size:48px;opacity:.18;margin:18px;display:block;}\n.ctNote em{position:absolute;left:18px;bottom:18px;letter-spacing:.24em;font-size:11px;font-weight:900;font-style:normal;}\n.ctNote i{position:absolute;right:22px;bottom:24px;width:52px;height:72px;border-radius:50% 50% 10px 10px;background:radial-gradient(circle at 45% 30%,#fff7df,var(--accent));opacity:.75;}\n.ctObjectTitle{font-size:24px;margin:0 0 10px;line-height:1.05;letter-spacing:-.02em;}\n.ctFieldGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 18px;}\n.ctMiniField{border-bottom:1px dashed var(--line);padding:0 0 7px;}\n.ctMiniField span{display:block;text-transform:uppercase;font-size:9px;letter-spacing:.14em;color:var(--muted);font-weight:900;}\n.ctMiniField strong{font-size:14px;}\n`,
  "06 Objektpresentasjon": `.ctObjectPresentation{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start;}\n.ctHero{display:grid;grid-template-columns:minmax(380px,.92fr) 1fr;gap:22px;border:1px solid var(--line);background:var(--panel);border-radius:18px;padding:20px;position:relative;margin-bottom:22px;}\n.ctHeroNote{min-height:260px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(140deg,rgba(0,0,0,.18),transparent),color-mix(in srgb,var(--panel) 70%,var(--bg));position:relative;}\n.ctHeroNote strong{font-size:58px;color:var(--accent);opacity:.38;position:absolute;left:28px;top:20px;}\n.ctHero h2{font-size:44px;line-height:.96;margin:16px 0 16px;letter-spacing:-.04em;}\n.ctKicker{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:7px 14px;color:var(--accent);font-size:11px;text-transform:uppercase;letter-spacing:.18em;font-weight:900;}\n.ctStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-top:18px;}\n.ctStats div{padding:12px;border-left:1px solid var(--line);}\n.ctStats div:first-child{border-left:0;}\n.ctStats span{display:block;text-transform:uppercase;font-size:9px;color:var(--muted);letter-spacing:.14em;font-weight:900;}\n.ctStats strong{font-size:18px;}\n.ctObjectTabs{display:flex;gap:12px;margin:0 0 16px;}\n.ctObjectTabs button{background:transparent;border:0;color:var(--muted);font-size:15px;text-transform:uppercase;letter-spacing:.08em;font-family:inherit;padding:10px 0;border-bottom:1px solid transparent;cursor:pointer;}\n.ctObjectTabs button.active{color:var(--ink);border-color:var(--accent);font-weight:900;}\n.ctPanelGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;}\n.ctPanel{position:relative;border:1px solid var(--line);background:var(--panel);border-radius:12px;padding:16px;min-height:145px;}\n.ctPanel.wide{grid-column:1/-1;}\n.ctRow{display:grid;grid-template-columns:140px 1fr;gap:10px;border-bottom:1px dashed var(--line);padding:8px 0;font-size:13px;}\n.ctRow span{color:var(--muted);text-transform:uppercase;font-size:10px;letter-spacing:.12em;font-weight:900;}\n.ctRow strong{text-align:right;}\n.ctSidePanel{position:sticky;top:16px;display:grid;gap:12px;}\n.ctActionButton{display:flex;align-items:center;gap:12px;width:100%;border:1px solid var(--line);border-radius:10px;background:color-mix(in srgb,var(--panel) 78%,var(--bg));color:var(--ink);font-weight:900;padding:12px;cursor:pointer;}\n.ctActionButton.gold{background:var(--accent);color:#fff;}\n`,
  "07 Relasjonspresentasjon": `.ctRelationPage{border:1px solid var(--line);background:var(--panel);border-radius:18px;padding:20px;display:grid;grid-template-columns:.8fr 1.2fr;gap:18px;}\n.ctRelationBadge{width:88px;height:88px;border-radius:20px;display:grid;place-items:center;background:var(--accent);color:#fff;font-size:38px;font-weight:900;}\n.ctBioGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}\n.ctBioCard{border:1px solid var(--line);border-radius:12px;padding:12px;background:color-mix(in srgb,var(--panel) 82%,var(--bg));}\n.ctBioCard span{display:block;text-transform:uppercase;letter-spacing:.13em;font-size:9px;color:var(--muted);font-weight:900;margin-bottom:6px;}\n.ctRelationList{display:grid;gap:9px;margin-top:14px;}\n.ctRelationLink{display:flex;justify-content:space-between;gap:12px;border:1px solid var(--line);border-radius:10px;padding:12px;color:var(--ink);text-decoration:none;background:color-mix(in srgb,var(--panel) 80%,var(--bg));}\n`,
  "08 Editor / inspector": `.ctEditorShell{position:fixed;inset:0;z-index:9999;background:var(--bg);display:grid;grid-template-columns:450px 1fr;}\n.ctCodePanel{border-right:1px solid var(--line);background:color-mix(in srgb,var(--panel) 88%,#000);padding:14px;overflow:auto;}\n.ctCodePanel textarea{width:100%;min-height:330px;resize:vertical;border:1px solid var(--line);border-radius:10px;background:#071016;color:#d6fff0;font:12px/1.45 Consolas,monospace;padding:12px;}\n.ctPreviewSplit{overflow:auto;}\n.ctInspectorMark{outline:2px solid #1677ff!important;outline-offset:3px;box-shadow:0 0 0 9999px rgba(0,0,0,.04),0 0 0 6px rgba(22,119,255,.12)!important;}\n.ctResizeMode{resize:both!important;overflow:auto!important;min-width:80px;min-height:44px;}\n.ctResizeMode::before{content:'';position:absolute;inset:-7px;border:1px dashed #1677ff;pointer-events:none;}\n.ctContextMenu{position:fixed;z-index:10000;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:8px;display:grid;gap:6px;min-width:220px;}\n.ctContextMenu button{border:1px solid var(--line);border-radius:9px;background:transparent;color:var(--ink);padding:9px;text-align:left;font-weight:800;cursor:pointer;}\n`,
};

const META: Record<string, InspectMeta> = {
  page: { id: "page", title: "Global testside", selector: ".ctLivePage", cssSection: "01 Global / testside", feature: "template.test.view", api: "Ingen", view: "Ingen", href: "/test/visning", level: "side" },
  filters: { id: "filters", title: "Filter Master", selector: ".ctControlBar .ctFilterBox", cssSection: "03 Layout / filter", feature: "filter.master.view", api: "GET /api/filter/master", view: "ct_filter_master_registry / ct_v_period_filter_options", href: "/admin/system/filter-master", level: "boks" },
  timeline: { id: "timeline", title: "Periodefilter tidslinje", selector: ".ctTimelinePanel", cssSection: "04 Tidslinje / periode", feature: "filter.period.simple.view", api: "GET /api/filter/period/simple", view: "ct_v_period_filter_options", href: "/filter/periode", level: "boks" },
  card: { id: "card", title: "Visningskort", selector: ".ctObjectCard", cssSection: "05 Visningskort", feature: "catalog.object.open", api: "GET /api/object/presentation", view: "ct_v_object_presentation_resolved", href: "/objekt/norske_sedler/banknote/1459", level: "boks" },
  objectHero: { id: "objectHero", title: "Objektpresentasjon hero", selector: ".ctHero", cssSection: "06 Objektpresentasjon", feature: "object.presentation.view", api: "GET /api/object/presentation", view: "ct_v_no_banknote_object_presentation", href: "/objekt/norske_sedler/banknote/1459", level: "boks" },
  objectTabs: { id: "objectTabs", title: "Objektpresentasjon faner", selector: ".ctObjectTabs button", cssSection: "06 Objektpresentasjon", feature: "object.presentation.view", api: "GET /api/object/presentation", view: "ct_v_object_presentation_resolved", href: "/objekt/norske_sedler/banknote/1459?segment=historie", level: "bryter" },
  sideActions: { id: "sideActions", title: "Brukerhandlinger / I min samling", selector: ".ctSidePanel .ctActionButton", cssSection: "06 Objektpresentasjon", feature: "object.user_state.view / collection.item.add", api: "GET /api/object/user-state", view: "ct_v_object_user_state_resolved", href: "/min-side/samling", level: "bryter" },
  relation: { id: "relation", title: "Relasjonspresentasjon", selector: ".ctRelationPage", cssSection: "07 Relasjonspresentasjon", feature: "relation.presentation.view", api: "GET /api/relations/[relationType]/[relationKey]", view: "relation detail views", href: "/relasjon/regent/oscar-ii", level: "boks" },
  apiList: { id: "apiList", title: "API / view / bryter-liste", selector: ".ctApiMatrix", cssSection: "08 Editor / inspector", feature: "admin.system.api_map.view", api: "GET /api/system/api-map", view: "ct_feature_action_routes", href: "/admin/system/mariadb-neon", level: "felt" },
};

const FILTERS = {
  land: ["Norge", "Sverige", "Danmark", "Skandinavia"],
  source: ["norske_sedler", "norske_mynter", "verdibrev", "ct_sn_relasjoner"],
  objectGroup: ["banknote", "coin", "security", "relation"],
  regent: ["Oscar II", "Karl XV", "Haakon VII", "Olav V", "Harald V"],
  period: ["1810-2024", "1872-1905", "1905-1957", "1957-1991"],
};

const API_ROWS = [
  ["Filter Master", "filter.master.view", "GET /api/filter/master", "ct_filter_master_registry"],
  ["Periodefilter", "filter.period.simple.view", "GET /api/filter/period/simple", "ct_v_period_filter_options"],
  ["Objektpresentasjon", "object.presentation.view", "GET /api/object/presentation", "ct_v_object_presentation_resolved"],
  ["Relasjoner", "object.relations.view", "GET /api/object/relations", "ct_v_object_relations_resolved"],
  ["Marked", "object.market.view", "GET /api/object/market", "ct_v_object_market_resolved"],
  ["I min samling", "object.user_state.view", "GET /api/object/user-state", "ct_v_object_user_state_resolved"],
  ["Relasjonsside", "relation.presentation.view", "GET /api/relations/regent/oscar-ii", "relation detail views"],
];

function mergeCss(parts: Record<string, string>) {
  return Object.values(parts).join("\n\n");
}

function useTextOverrides() {
  const [text, setText] = useState<Record<string, string>>({});
  const get = (key: string, fallback: string) => text[key] ?? fallback;
  const set = (key: string, value: string) => setText((old) => ({ ...old, [key]: value }));
  return { get, set, text };
}

export default function TestVisningLiveEditor() {
  const [skin, setSkin] = useState<Skin>("collectium");
  const [mainTab, setMainTab] = useState<MainTab>("objekt");
  const [segment, setSegment] = useState<Segment>("samler");
  const [split, setSplit] = useState(false);
  const [selected, setSelected] = useState<InspectMeta>(META.objectHero);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [resizeId, setResizeId] = useState<string | null>(null);
  const [cssParts, setCssParts] = useState<Record<string, string>>(CSS_SECTIONS);
  const textEditor = useTextOverrides();

  const css = useMemo(() => mergeCss(cssParts), [cssParts]);

  const inspect = (event: React.MouseEvent<HTMLElement>, key: keyof typeof META) => {
    event.preventDefault();
    setSelected(META[key]);
    setContext({ x: event.clientX, y: event.clientY });
  };

  const selectedClass = (key: keyof typeof META) => [
    selected.id === META[key].id ? "ctInspectorMark" : "",
    resizeId === META[key].id ? "ctResizeMode" : "",
  ].filter(Boolean).join(" ");

  const updateSelectedCss = (value: string) => {
    setCssParts((old) => ({ ...old, [selected.cssSection]: value }));
  };

  const resetSelectedCss = () => {
    setCssParts((old) => ({ ...old, [selected.cssSection]: CSS_SECTIONS[selected.cssSection] }));
  };

  const page = (
    <div className="ctLivePage" data-skin={skin} onClick={() => setContext(null)} onContextMenu={(e) => inspect(e, "page")}>
      <style>{css}</style>
      <div className="ctPreviewInner">
        <TopHeader skin={skin} setSkin={setSkin} split={split} setSplit={setSplit} selected={selected} />
        <FilterHeader inspect={inspect} selectedClass={selectedClass} />
        <TimelinePanel inspect={inspect} selectedClass={selectedClass} />

        <nav className="ctObjectTabs" onContextMenu={(e) => inspect(e, "objectTabs")}>
          {(["visningskort", "objekt", "relasjon", "brytere", "api", "view", "felt", "bokser"] as MainTab[]).map((tab) => (
            <button key={tab} className={mainTab === tab ? "active" : ""} onClick={() => setMainTab(tab)}>{tab}</button>
          ))}
        </nav>

        {mainTab === "visningskort" && <Visningskort inspect={inspect} selectedClass={selectedClass} getText={textEditor.get} />}
        {mainTab === "objekt" && <ObjectPresentation inspect={inspect} selectedClass={selectedClass} segment={segment} setSegment={setSegment} getText={textEditor.get} />}
        {mainTab === "relasjon" && <RelationPresentation inspect={inspect} selectedClass={selectedClass} getText={textEditor.get} />}
        {mainTab === "brytere" && <Matrix title="Brytere / feature keys" rows={API_ROWS.map(r => [r[0], r[1], r[2], r[3]])} inspect={inspect} />}
        {mainTab === "api" && <Matrix title="API-ruter" rows={API_ROWS.map(r => [r[0], r[2], r[1], r[3]])} inspect={inspect} />}
        {mainTab === "view" && <Matrix title="Views / kilde" rows={API_ROWS.map(r => [r[0], r[3], r[1], r[2]])} inspect={inspect} />}
        {mainTab === "felt" && <Matrix title="Feltstruktur" rows={fieldRows()} inspect={inspect} />}
        {mainTab === "bokser" && <Matrix title="Bokser / CSS-nivå" rows={boxRows()} inspect={inspect} />}
      </div>
      {context && <ContextMenu x={context.x} y={context.y} selected={selected} onEdit={() => setSplit(true)} onResize={() => setResizeId(selected.id)} onText={() => setSplit(true)} />}
      {!split && <FloatingEditorButton onClick={() => setSplit(true)} />}
    </div>
  );

  if (split) {
    return (
      <div className="ctLivePage ctEditorShell" data-skin={skin}>
        <style>{css}</style>
        <aside className="ctCodePanel">
          <h2>Live CSS-editor</h2>
          <p><strong>Valgt:</strong> {selected.title}</p>
          <p><strong>Fil:</strong> app/test/visning/page.tsx</p>
          <p><strong>Selector:</strong> <code>{selected.selector}</code></p>
          <p><strong>Nivå:</strong> {selected.level}</p>
          <div style={{ display: "grid", gap: 8, margin: "12px 0" }}>
            <button className="ctActionButton gold" onClick={() => setSplit(false)}>Lukk full screen split</button>
            <button className="ctActionButton" onClick={resetSelectedCss}>Reset original CSS for valgt område</button>
            <button className="ctActionButton" onClick={() => setResizeId(selected.id)}>Endre størrelse på valgt felt</button>
          </div>
          <h3>CSS-trestruktur</h3>
          {Object.keys(CSS_SECTIONS).map((key) => (
            <button key={key} className="ctActionButton" onClick={() => setSelected({ ...selected, cssSection: key as keyof typeof CSS_SECTIONS })}>{key}</button>
          ))}
          <h3>Original kode</h3>
          <textarea readOnly value={CSS_SECTIONS[selected.cssSection]} />
          <h3>Editert kode</h3>
          <textarea value={cssParts[selected.cssSection]} onChange={(event) => updateSelectedCss(event.target.value)} />
          <h3>Tekst for valgt felt</h3>
          <input style={{ width: "100%", height: 38 }} value={textEditor.text[selected.id] ?? ""} placeholder="Skriv ny tekst for valgt felt..." onChange={(event) => textEditor.set(selected.id, event.target.value)} />
          <h3>Kilde / bryter / API / view</h3>
          <p><strong>Feature:</strong> {selected.feature}</p>
          <p><strong>API:</strong> {selected.api}</p>
          <p><strong>View:</strong> {selected.view}</p>
          <p><strong>Link:</strong> {selected.href}</p>
        </aside>
        <section className="ctPreviewSplit">{page}</section>
      </div>
    );
  }

  return page;
}

function TopHeader({ skin, setSkin, split, setSplit, selected }: { skin: Skin; setSkin: (s: Skin) => void; split: boolean; setSplit: (v: boolean) => void; selected: InspectMeta }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
      <div className="ctTopTitle">
        <p>Periodefilter · Masterfilter · UI/UX 8.6</p>
        <h1>Test / Visning live editor</h1>
        <span>Høyreklikk felt, boks, bryter eller tekst for CSS, størrelse, lenke, API, view og redigering.</span>
      </div>
      <div style={{ minWidth: 420, display: "grid", gap: 10 }}>
        <div className="ctAreaRow" style={{ justifyContent: "flex-end", margin: 0, border: 0 }}>
          {(["collectium", "enkel", "museum", "finans"] as Skin[]).map((s) => <button key={s} className="ctChip" style={{ background: skin === s ? "var(--accent)" : undefined, color: skin === s ? "#fff" : undefined }} onClick={() => setSkin(s)}>{s}</button>)}
        </div>
        <button className="ctChip" onClick={() => setSplit(!split)}>Global CSS / full screen split</button>
        <small>Valgt: {selected.title} · {selected.selector}</small>
      </div>
    </header>
  );
}

function FilterHeader({ inspect, selectedClass }: { inspect: (e: React.MouseEvent<HTMLElement>, key: keyof typeof META) => void; selectedClass: (key: keyof typeof META) => string }) {
  return (
    <section className={selectedClass("filters")} onContextMenu={(e) => inspect(e, "filters")}>
      <div className="ctControlBar">
        <div className="ctFilterBox"><label>Master filter</label><select><option>{FILTERS.land[0]} · {FILTERS.source[0]} · {FILTERS.objectGroup[0]}</option>{FILTERS.land.map(v => <option key={v}>{v}</option>)}</select></div>
        <div className="ctFilterBox"><label>Samler filter</label><select><option>Hjerte · Stjerne · Min samling · Deling</option><option>Ønskeliste</option><option>Favoritter</option></select></div>
        <div className="ctFilterBox"><label>Forhandler filter</label><select><option>Auksjon · Nettbutikk · Innlevering · Fee</option><option>Aktive auksjoner</option><option>Nettbutikk salg</option></select></div>
        <div className="ctFilterBox"><label>Objektfilter</label><select><option>Valør · År · Litra · Utgave · Variant</option><option>100 kroner</option><option>Oscar II</option></select></div>
      </div>
      <div className="ctAreaRow"><strong style={{ marginRight: 8 }}>Område</strong>{["Norge", "Sedler", "Norske sedler", "Standardutgave", "1877", "Oscar II"].map(v => <button className="ctChip" key={v}>{v}</button>)}</div>
    </section>
  );
}

function TimelinePanel({ inspect, selectedClass }: { inspect: (e: React.MouseEvent<HTMLElement>, key: keyof typeof META) => void; selectedClass: (key: keyof typeof META) => string }) {
  const years = [1810, 1830, 1850, 1870, 1890, 1910, 1930, 1950, 1970, 1990, 2010, 2024];
  return (
    <section className={`ctTimelinePanel ${selectedClass("timeline")}`} onContextMenu={(e) => inspect(e, "timeline")}>
      <div className="ctTimelineHeader"><div><p className="ctKicker">Periodefilter / tidslinje</p><h2 style={{ margin: "8px 0 0" }}>Konger, perioder og objektkontekst</h2></div><div className="ctAreaRow" style={{ border: 0, margin: 0 }}><button className="ctChip">Objektpresentasjon</button><button className="ctChip">Relasjonpresentasjon</button><button className="ctChip">Periode 8.6</button><button className="ctChip">Index / Finans</button></div></div>
      <div className="ctTimelineGrid">
        <div />
        <div className="ctTimelineYears">{years.map(y => <span key={y}>{y}</span>)}</div>
        <div className="ctLaneLabel">Konge / regent</div><div className="ctLane"><div className="ctPeriodBar" style={{ left: "25%", width: "24%" }}>Oscar II 1872-1905</div><div className="ctPeriodBar" style={{ left: "50%", width: "24%" }}>Haakon VII 1905-1957</div><div className="ctPeriodBar" style={{ left: "74%", width: "19%" }}>Olav V 1957-1991</div></div>
        <div className="ctLaneLabel">Historisk periode</div><div className="ctLane"><div className="ctPeriodBar green" style={{ left: "0%", width: "50%" }}>Unionstid</div><div className="ctPeriodBar green" style={{ left: "50%", width: "50%" }}>Selvstendig Norge</div></div>
        <div className="ctLaneLabel">Finans / økonomi</div><div className="ctLane"><div className="ctPeriodBar blue" style={{ left: "26%", width: "28%" }}>Bank- og pengeutvikling</div><div className="ctPeriodBar blue" style={{ left: "70%", width: "16%" }}>Oljealder</div></div>
        <div className="ctLaneLabel">Signatur / person</div><div className="ctLane"><div className="ctPeriodBar purple" style={{ left: "29%", width: "20%" }}>Winge / Getz</div><div className="ctPeriodBar purple" style={{ left: "50%", width: "30%" }}>Hambro / Lie</div></div>
      </div>
    </section>
  );
}

function Visningskort({ inspect, selectedClass, getText }: { inspect: (e: React.MouseEvent<HTMLElement>, key: keyof typeof META) => void; selectedClass: (key: keyof typeof META) => string; getText: (k: string, f: string) => string }) {
  return (
    <section onContextMenu={(e) => inspect(e, "card")}>
      <h2>Visningskort</h2>
      <h3>Horisontal · kompakt · to i bredden</h3>
      <div className="ctCardGrid">
        {[1, 2].map((n) => <ObjectCard key={n} type="horizontal" selectedClass={selectedClass("card")} getText={getText} />)}
      </div>
      <h3>Liste · kompakt</h3>
      <ObjectCard type="list" selectedClass={selectedClass("card")} getText={getText} />
      <h3>Museum · to i bredden</h3>
      <div className="ctMuseumGrid"><ObjectCard type="museum" selectedClass={selectedClass("card")} getText={getText} /><ObjectCard type="museum" selectedClass={selectedClass("card")} getText={getText} /></div>
      <h3>Stående · to i bredden</h3>
      <div className="ctStandingGrid"><ObjectCard type="standing" selectedClass={selectedClass("card")} getText={getText} /><ObjectCard type="standing" selectedClass={selectedClass("card")} getText={getText} /></div>
    </section>
  );
}

function Note() { return <div className="ctNote"><strong>100</strong><i /><em>NORGES BANK</em></div>; }

function ObjectCard({ type, selectedClass, getText }: { type: "horizontal" | "list" | "museum" | "standing"; selectedClass: string; getText: (k: string, f: string) => string }) {
  const className = type === "horizontal" ? "ctHorizontalCard" : type === "list" ? "ctListCard" : "";
  return (
    <article className={`ctObjectCard ${className} ${selectedClass}`}>
      <Note />
      <div>
        <h2 className="ctObjectTitle">{getText("card", "100 kroner · 1. utgave · 1877 · Seddelpapir")}</h2>
        <div className="ctFieldGrid">
          <MiniField label="Valør" value="100 kroner" /><MiniField label="Utgave" value="1877–1902" /><MiniField label="Variant" value="Ikke registrert" /><MiniField label="Sjeldenhet" value="RRR" />
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>norske_sedler · banknote · NS 1459</p>
        <div className="ctAreaRow" style={{ border: 0, padding: 0 }}><button className="ctChip">Åpne objekt</button><button className="ctChip">Se relasjon</button><button className="ctChip">Legg i samling</button></div>
      </div>
      <div><MiniField label="Hjerte" value="0" /><MiniField label="Stjerne" value="0" /><MiniField label="Auksjon" value="3" /><MiniField label="Nettbutikk" value="1" /><MiniField label="Estimert" value="Ikke vurdert" /></div>
    </article>
  );
}

function MiniField({ label, value }: { label: string; value: string }) { return <div className="ctMiniField"><span>{label}</span><strong>{value}</strong></div>; }

function ObjectPresentation({ inspect, selectedClass, segment, setSegment, getText }: { inspect: (e: React.MouseEvent<HTMLElement>, key: keyof typeof META) => void; selectedClass: (key: keyof typeof META) => string; segment: Segment; setSegment: (s: Segment) => void; getText: (k: string, f: string) => string }) {
  return (
    <section className="ctObjectPresentation">
      <main>
        <article className={`ctHero ${selectedClass("objectHero")}`} onContextMenu={(e) => inspect(e, "objectHero")}>
          <div className="ctHeroNote"><strong>100</strong></div>
          <div><span className="ctKicker">Norge · seddel · Norske sedler · standardutgave</span><h2>{getText("objectHero", "100 kroner · 1. utgave · 1877 · Seddelpapir")}</h2><p>Tidlig hovedvalør fra den norske seddelhistorien — utgitt under Oscar II i unionstiden. Sjelden i alle kvaliteter, ekstremt sjelden over 45 XF.</p><div className="ctStats"><div><span>Markedsverdi</span><strong>15 000 kr</strong></div><div><span>Trend 12 mnd</span><strong>↗ 4,2 %</strong></div><div><span>Sjeldenhet</span><strong>RRR</strong></div><div><span>Konge</span><strong>Oscar II</strong></div></div></div>
        </article>
        <nav className={`ctObjectTabs ${selectedClass("objectTabs")}`} onContextMenu={(e) => inspect(e, "objectTabs")}>
          {(["samler", "historie", "finans", "minsamling"] as Segment[]).map((s) => <button key={s} className={segment === s ? "active" : ""} onClick={() => setSegment(s)}>{s === "minsamling" ? "I min samling" : s}</button>)}
        </nav>
        {segment === "samler" && <SamlerPanels />}
        {segment === "historie" && <HistoriePanels />}
        {segment === "finans" && <FinansPanels />}
        {segment === "minsamling" && <MinSamlingPanels />}
      </main>
      <aside className={`ctSidePanel ${selectedClass("sideActions")}`} onContextMenu={(e) => inspect(e, "sideActions")}><SideActions /></aside>
    </section>
  );
}

function SamlerPanels() { return <div className="ctPanelGrid"><Panel title="Identitet" rows={[['Katalognummer','NS 1 459'],['Valør','100 kroner'],['Objektår','1877–1905'],['Land','Norge']]} /><Panel title="Utgave" rows={[['Valørutgave','100 kroner'],['Litra','Ikke registrert'],['Variant','Ikke registrert'],['Utgivelsesår','1877–1905']]} /><Panel title="Raritet" rows={[['Estimert sjeldenhet','Sjelden'],['Katalogvurdering','Sjelden'],['Signaturmengde','Winge/Getz']]} /><Panel title="Bilder" wide rows={[['Forside','Henter'],['Bakside','Henter'],['Gjennomlysning FS','Henter'],['Variant bakside','Henter']]} /></div>; }
function HistoriePanels() { return <div className="ctPanelGrid"><Panel title="Konge · regent" rows={[['Regent','Oscar II'],['Tidsrom','1872–1905'],['Union','Svensk-norsk']]} /><Panel title="Signatur · motiv" rows={[['Signatur','Winge / Getz'],['Motiv','Riksvåpen'],['Kilde','ct_v_catalog_relations']]} /><Panel title="Historisk kontekst" wide rows={[['Historiske hendelser','Industrialisering, jernbanevekst'],['Statsminister','Frederik Stang'],['Relasjon','/relasjon/regent/oscar-ii']]} /><Panel title="Relasjoner" wide rows={[['Konge','Oscar II'],['Signatur','Winge/Getz'],['Utgave','1. utgave'],['Kilde','Norske sedler']]} /></div>; }
function FinansPanels() { return <div className="ctPanelGrid"><Panel title="Markedsverdi per kvalitet" rows={[['Verdi 45 XF','15 000 kr'],['Trend 12 mnd','↗ 4,2 %'],['Likviditet','Moderat']]} /><Panel title="Marked og salg" rows={[['Auksjoner i år','3'],['Nettbutikk','Ikke listet'],['Sist solgt','19 200 kr · sept 2025']]} /><Panel title="Publiseringsår" rows={[['Publisert','1877'],['Relaterte sedler','4 valører'],['Kjøpekraft i dag','~ 7 850 kr']]} /><Panel title="Renter · metall" rows={[['Utlånsrente','Henter'],['Gull USD/oz','$20,67'],['SEK-DKK','Henter']]} /></div>; }
function MinSamlingPanels() { return <div className="ctPanelGrid"><Panel title="Kjøp" rows={[['Dato','Ikke registrert'],['Sted','Ikke registrert'],['Pris','Ikke registrert']]} /><Panel title="Kvalitet" rows={[['Min kvalitet','Ikke vurdert'],['Gradering','Ikke vurdert'],['Synlighet','Privat']]} /><Panel title="Notater" rows={[['Egne notater','Skriv ditt notat ...'],['Historikk','Åpne']]} /><Panel title="Filer" rows={[['Kvittering','Ingen'],['Egne bilder','0'],['Forside scan','Ingen']]} /><Panel title="Egne spesifikasjoner" wide rows={[['Papirfølelse','Henter fra ct_user_collection_object_specs'],['Hjørner','Henter'],['Farge','Henter'],['Vannmerke','Henter'],['Proveniens','Henter'],['Egen tagg','Henter']]} /></div>; }

function Panel({ title, rows, wide }: { title: string; rows: [string, string][]; wide?: boolean }) { return <section className={`ctPanel ${wide ? 'wide' : ''}`}><h3>{title}</h3>{rows.map(([a,b]) => <div className="ctRow" key={a}><span>{a}</span><strong>{b}</strong></div>)}</section>; }
function SideActions() { return <><Panel title="Aktiv visning" rows={[['Horisontal','aktiv'],['Museum','valg'],['Kompakt','valg']]} /><section className="ctPanel"><h3>Status</h3>{['Hjerte','Stjerne','Legg i samling','Del objekt','Sammenlign'].map((v,i) => <button key={v} className={`ctActionButton ${i===2?'gold':''}`}>{v}</button>)}</section><Panel title="Del visning" rows={[['6t','valg'],['12t','aktiv'],['Katalog','NS 1 459'],['Tilgang','12 timer']]} /></>; }

function RelationPresentation({ inspect, selectedClass, getText }: { inspect: (e: React.MouseEvent<HTMLElement>, key: keyof typeof META) => void; selectedClass: (key: keyof typeof META) => string; getText: (k: string, f: string) => string }) {
  return <section className={`ctRelationPage ${selectedClass("relation")}`} onContextMenu={(e) => inspect(e, "relation")}><div><div className="ctRelationBadge">O2</div><h2>{getText("relation", "Oscar II")}</h2><p>Regentperiode 1872–1905. Koblet til unionstid, 1. utgave, Winge/Getz, Riksvåpen og norske sedler.</p><div className="ctRelationList"><a className="ctRelationLink" href="/relasjon/regent/oscar-ii">Regentperiode <span>→</span></a><a className="ctRelationLink" href="/relasjon/periode/unionstid">Unionstid <span>→</span></a><a className="ctRelationLink" href="/katalog?regent=oscar-ii">Filtrert katalog <span>→</span></a></div></div><div><h3>Bio / definisjon</h3><div className="ctBioGrid">{['Hva er dette?','Hvorfor er det viktig?','Når eksisterte det?','Hvem var involvert?','Hva betyr det historisk?','Hva betyr det finansielt?'].map(v => <div className="ctBioCard" key={v}><span>{v}</span><strong>Henter fra relation detail view</strong></div>)}</div></div></section>;
}

function Matrix({ title, rows, inspect }: { title: string; rows: string[][]; inspect: (e: React.MouseEvent<HTMLElement>, key: keyof typeof META) => void }) { return <section className="ctPanel wide ctApiMatrix" onContextMenu={(e) => inspect(e, "apiList")}><h2>{title}</h2>{rows.map((r) => <div className="ctRow" key={r.join('|')} style={{ gridTemplateColumns: "1fr 1.3fr 1.4fr 1.5fr" }}>{r.map(c => <strong key={c} style={{ textAlign: 'left' }}>{c}</strong>)}</div>)}</section>; }
function fieldRows() { return [['Objektnøkkel','source_key + object_group + object_id','ct_v_object_presentation_resolved','/api/object/presentation'],['Relasjon','relation_type + relation_slug + relation_href','ct_v_object_relations_resolved','/api/object/relations'],['Marked','market_value + trend + grade_values','ct_v_object_market_resolved','/api/object/market'],['Brukerstatus','wishlist + favorite + collection','ct_v_object_user_state_resolved','/api/object/user-state']]; }
function boxRows() { return [['Global side','.ctLivePage','01 Global / testside','page'],['Filterbokser','.ctFilterBox','03 Layout / filter','boks'],['Tidslinje','.ctTimelinePanel / .ctPeriodBar','04 Tidslinje / periode','boks'],['Visningskort','.ctObjectCard','05 Visningskort','boks'],['Objektpresentasjon','.ctHero / .ctPanel','06 Objektpresentasjon','boks/felt'],['Relasjonsside','.ctRelationPage','07 Relasjonspresentasjon','boks']]; }

function ContextMenu({ x, y, selected, onEdit, onResize, onText }: { x: number; y: number; selected: InspectMeta; onEdit: () => void; onResize: () => void; onText: () => void }) { return <div className="ctContextMenu" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}><strong>{selected.title}</strong><small>{selected.selector}</small><button onClick={onEdit}>Åpne CSS i kodefelt</button><button onClick={onResize}>Endre størrelse på valgt felt</button><button onClick={onText}>Endre tekst</button><a className="ctChip" href={selected.href}>Åpne link: {selected.href}</a></div>; }
function FloatingEditorButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 999, borderRadius: 999, padding: '12px 16px', background: 'var(--accent)', color: '#fff', border: 0, fontWeight: 900 }}>CSS / split</button>; }
