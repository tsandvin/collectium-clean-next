"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Test Visning Live Editor 8.6 v2
 *
 * Definering / formål:
 * En selvstendig Next.js/React testside for visningskort, objektpresentasjon,
 * relasjonspresentasjon, brukerkort, filterrad, periodefilter og live CSS-editor.
 * Siden er laget som en test-/designflate og bruker statisk eksempeldata.
 *
 * Bruksområde:
 * Route: /test/visning
 * Brukes for å sammenligne global skin, originalkode og redigert kode med split-screen.
 *
 * Berørte sider / routes:
 * - /test/visning
 *
 * Berørte DB-brytere / feature_keys:
 * - test.visning.view
 * - test.visning.css_edit.preview
 * - catalog.object.open
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 * - ct_v_object_presentation_resolved
 * - ct_v_no_banknote_object_presentation
 * - ct_v_object_relations_resolved
 * - ct_v_object_market_resolved
 * - ct_v_object_user_state_resolved
 *
 * Dataretning:
 * Statisk testdata -> Next.js page -> React client state -> UI preview
 *
 * Logging:
 * Ingen produksjonslogging. Testside.
 *
 * Versjon:
 * UI86-TEST-VISNING-LIVE-EDITOR-V2-ONEFILE
 */

import React, { useMemo, useState } from "react";

type SkinKey = "collectium" | "samler" | "museum" | "finans";
type PreviewMode = "cards" | "object" | "relation" | "user" | "switches";
type CodeTarget = "global" | "page" | "layout" | "cards" | "object" | "relation" | "api";

type InspectInfo = {
  title: string;
  file: string;
  selector: string;
  feature: string;
  api: string;
  view: string;
  href: string;
  x: number;
  y: number;
};

const skins: { key: SkinKey; label: string }[] = [
  { key: "collectium", label: "Collectium" },
  { key: "samler", label: "Samler" },
  { key: "museum", label: "Museum" },
  { key: "finans", label: "Finans" },
];

const modes: { key: PreviewMode; label: string }[] = [
  { key: "cards", label: "Visningskort" },
  { key: "object", label: "Objektpresentasjon" },
  { key: "relation", label: "Relasjonpresentasjon" },
  { key: "user", label: "Brukerkort" },
  { key: "switches", label: "Brytere / linker" },
];

const codeTargets: { key: CodeTarget; label: string; file: string }[] = [
  { key: "global", label: "Global CSS", file: "app/test/visning/page.tsx :: ORIGINAL_GLOBAL_CSS" },
  { key: "page", label: "Page", file: "app/test/visning/page.tsx :: TestVisningLiveEditorPage" },
  { key: "layout", label: "Layout", file: "components/layout/CollectiumAppShell.tsx + app/layout.tsx" },
  { key: "cards", label: "Visningskort", file: "app/test/visning/page.tsx :: ViewCards" },
  { key: "object", label: "Objektpresentasjon", file: "app/test/visning/page.tsx :: ObjectPresentation" },
  { key: "relation", label: "Relasjon", file: "app/test/visning/page.tsx :: RelationPresentation" },
  { key: "api", label: "API / views", file: "app/api/object/* + Neon resolved views" },
];

const ORIGINAL_GLOBAL_CSS = `
/* Collectium /test/visning live editor CSS v2 */
.ct86-page {
  --ct-bg: #f7f4ec;
  --ct-surface: rgba(255, 255, 250, 0.92);
  --ct-surface-2: rgba(247, 251, 246, 0.92);
  --ct-text: #153c30;
  --ct-muted: #779083;
  --ct-border: rgba(30, 82, 63, 0.26);
  --ct-line: rgba(177, 146, 97, 0.34);
  --ct-accent: #2e7a5d;
  --ct-accent-2: #c9a44f;
  --ct-danger: #e67b72;
  --ct-blue: #4c8fc8;
  --ct-shadow: 0 18px 44px rgba(25, 48, 38, 0.11);
  --ct-radius: 16px;
  --ct-font-main: Georgia, "Times New Roman", serif;
  --ct-font-ui: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  min-height: 100vh;
  padding: 28px;
  color: var(--ct-text);
  background:
    radial-gradient(circle at top left, rgba(204, 171, 101, 0.14), transparent 28rem),
    linear-gradient(135deg, var(--ct-bg), #ffffff 62%, #eff5ee);
  font-family: var(--ct-font-ui);
}

.ct86-page[data-skin="museum"] {
  --ct-bg: #11110f;
  --ct-surface: rgba(31, 31, 31, 0.95);
  --ct-surface-2: rgba(25, 25, 25, 0.92);
  --ct-text: #f3eee2;
  --ct-muted: #a89b82;
  --ct-border: rgba(204, 164, 84, 0.36);
  --ct-line: rgba(204, 164, 84, 0.35);
  --ct-accent: #c9a44f;
  --ct-accent-2: #8a6a2f;
  --ct-shadow: 0 22px 60px rgba(0, 0, 0, 0.35);
  background: linear-gradient(135deg, #0b0b0a, #151515 55%, #090909);
}

.ct86-page[data-skin="samler"] {
  --ct-bg: #f2f8f3;
  --ct-surface: rgba(250, 255, 251, 0.96);
  --ct-surface-2: rgba(238, 250, 240, 0.92);
  --ct-text: #113d2a;
  --ct-muted: #658575;
  --ct-border: rgba(52, 126, 88, 0.26);
  --ct-accent: #28704c;
  --ct-accent-2: #7ebf8c;
}

.ct86-page[data-skin="finans"] {
  --ct-bg: #07111f;
  --ct-surface: rgba(10, 24, 42, 0.96);
  --ct-surface-2: rgba(7, 32, 46, 0.94);
  --ct-text: #e8f7ff;
  --ct-muted: #88abc1;
  --ct-border: rgba(80, 168, 218, 0.34);
  --ct-line: rgba(72, 155, 195, 0.28);
  --ct-accent: #55b6e8;
  --ct-accent-2: #8ee3bd;
  --ct-shadow: 0 18px 52px rgba(0, 21, 44, 0.4);
  background: linear-gradient(135deg, #05101b, #0b1c2d 62%, #07131d);
}

.ct86-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 14px;
  margin-bottom: 18px;
  border: 1px solid var(--ct-border);
  border-radius: 22px;
  background: color-mix(in srgb, var(--ct-surface) 92%, transparent);
  box-shadow: var(--ct-shadow);
  backdrop-filter: blur(12px);
}

.ct86-title h1 {
  margin: 0;
  font-family: var(--ct-font-main);
  font-size: clamp(26px, 3vw, 48px);
  letter-spacing: -0.03em;
}

.ct86-title p,
.ct86-title small {
  color: var(--ct-muted);
  margin: 4px 0 0;
}

.ct86-toolbar,
.ct86-filter-row,
.ct86-period-row,
.ct86-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.ct86-pill,
.ct86-toolbar button,
.ct86-code-link,
.ct86-action {
  min-height: 34px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--ct-border);
  color: var(--ct-text);
  background: color-mix(in srgb, var(--ct-surface) 72%, transparent);
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

.ct86-pill[data-active="true"],
.ct86-toolbar button[data-active="true"],
.ct86-period[data-active="true"] {
  color: #fff;
  background: var(--ct-accent);
  border-color: color-mix(in srgb, var(--ct-accent) 70%, #fff);
}

.ct86-main[data-split="true"] {
  display: grid;
  grid-template-columns: 450px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.ct86-code-panel {
  display: none;
  position: sticky;
  top: 110px;
  height: calc(100vh - 130px);
  min-height: 560px;
  border: 1px solid var(--ct-border);
  border-radius: 18px;
  overflow: hidden;
  background: #0f1117;
  color: #e8edf7;
  box-shadow: var(--ct-shadow);
}

.ct86-main[data-split="true"] .ct86-code-panel {
  display: flex;
  flex-direction: column;
}

.ct86-code-panel header {
  padding: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.13);
  background: rgba(255,255,255,0.06);
}

.ct86-code-panel textarea {
  flex: 1;
  width: 100%;
  resize: none;
  border: 0;
  outline: 0;
  padding: 14px;
  color: #dbe8ff;
  background: #0b0d12;
  font-family: "IBM Plex Mono", Consolas, monospace;
  font-size: 12px;
  line-height: 1.48;
}

.ct86-preview {
  min-width: 0;
}

.ct86-panel,
.ct86-card,
.ct86-object,
.ct86-relation,
.ct86-user-card {
  position: relative;
  border: 1px solid var(--ct-border);
  border-radius: var(--ct-radius);
  background: var(--ct-surface);
  box-shadow: var(--ct-shadow);
}

.ct86-panel::after,
.ct86-card::after,
.ct86-object::after,
.ct86-relation::after,
.ct86-user-card::after {
  content: "________ Collectium";
  position: absolute;
  right: 14px;
  bottom: 8px;
  color: color-mix(in srgb, var(--ct-accent) 58%, transparent);
  font-family: var(--ct-font-main);
  font-size: 8px;
  font-style: italic;
  pointer-events: none;
}

.ct86-filter-panel {
  padding: 14px;
  margin-bottom: 16px;
}

.ct86-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 10px;
}

.ct86-filter-box {
  padding: 10px;
  border: 1px solid var(--ct-border);
  border-radius: 14px;
  background: var(--ct-surface-2);
}

.ct86-filter-box strong,
.ct86-section-title,
.ct86-label {
  display: block;
  color: var(--ct-accent);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.ct86-period-table {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 8px;
}

.ct86-period {
  padding: 10px 12px;
  text-align: left;
  border: 1px solid var(--ct-border);
  border-radius: 14px;
  background: var(--ct-surface);
  color: var(--ct-text);
  cursor: pointer;
}

.ct86-code-links {
  display: grid;
  grid-template-columns: repeat(7, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.ct86-card-grid {
  display: grid;
  gap: 14px;
}

.ct86-view-row {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
}

.ct86-view-row[data-view="horizontal"] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ct86-view-row[data-view="list"] {
  grid-template-columns: 1fr;
}

.ct86-view-row[data-view="museum"] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ct86-view-row[data-view="standing"] {
  grid-template-columns: repeat(2, minmax(280px, 1fr));
}

.ct86-card {
  padding: 14px;
  overflow: hidden;
}

.ct86-horizontal-card {
  display: grid;
  grid-template-columns: 172px minmax(0, 1fr) 170px;
  gap: 12px;
}

.ct86-list-card {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 330px 170px;
  gap: 12px;
  align-items: stretch;
  min-height: 148px;
}

.ct86-museum-card {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(0, 1.1fr);
  gap: 14px;
}

.ct86-standing-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.ct86-note {
  position: relative;
  min-height: 132px;
  border: 1px solid color-mix(in srgb, var(--ct-border) 74%, #fff);
  border-radius: 10px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.4), transparent),
    repeating-linear-gradient(135deg, rgba(76,111,94,0.08) 0 3px, transparent 3px 15px),
    color-mix(in srgb, var(--ct-surface-2) 88%, #fff);
}

.ct86-note[data-wide="true"] {
  min-height: 178px;
}

.ct86-note-number {
  position: absolute;
  left: 18px;
  top: 12px;
  font-family: var(--ct-font-main);
  font-size: clamp(60px, 8vw, 118px);
  line-height: 0.8;
  color: color-mix(in srgb, var(--ct-text) 16%, transparent);
}

.ct86-note-bank {
  position: absolute;
  left: 20px;
  bottom: 18px;
  color: color-mix(in srgb, var(--ct-text) 64%, transparent);
  letter-spacing: 0.28em;
  font-weight: 900;
  font-size: 11px;
}

.ct86-note-seal {
  position: absolute;
  right: 22px;
  top: 42px;
  width: 54px;
  height: 82px;
  border-radius: 999px 999px 12px 12px;
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.55), transparent 28%), color-mix(in srgb, var(--ct-accent-2) 34%, #fff);
  filter: blur(0.2px);
}

.ct86-card h3,
.ct86-object h2,
.ct86-relation h2 {
  margin: 0 0 8px;
  font-family: var(--ct-font-main);
  font-size: clamp(22px, 2.2vw, 36px);
  line-height: 0.98;
}

.ct86-mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.ct86-field {
  border-bottom: 1px dashed var(--ct-line);
  padding: 6px 0;
  cursor: context-menu;
}

.ct86-field label {
  display: block;
  color: color-mix(in srgb, var(--ct-accent) 82%, var(--ct-text));
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.ct86-field strong {
  display: block;
  margin-top: 3px;
  font-family: var(--ct-font-main);
  font-size: 15px;
}

.ct86-history {
  padding: 10px;
  border: 1px solid var(--ct-border);
  border-radius: 12px;
  background: var(--ct-surface-2);
}

.ct86-status {
  display: grid;
  gap: 7px;
}

.ct86-status-item,
.ct86-price {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px;
  border: 1px solid var(--ct-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--ct-surface-2) 86%, transparent);
}

.ct86-status-item span {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ct-accent) 15%, transparent);
  color: var(--ct-accent);
  font-weight: 900;
}

.ct86-status-item small,
.ct86-meta {
  display: block;
  color: var(--ct-muted);
  font-size: 11px;
}

.ct86-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.ct86-object-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: start;
}

.ct86-object-hero {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
  padding: 18px;
}

.ct86-segment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.ct86-segment-card,
.ct86-side-box {
  padding: 14px;
  border: 1px solid var(--ct-border);
  border-radius: 14px;
  background: var(--ct-surface);
}

.ct86-relation,
.ct86-user-card {
  padding: 16px;
}

.ct86-relation-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.ct86-relation-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--ct-border);
  border-radius: 14px;
  background: var(--ct-surface-2);
}

.ct86-inspector {
  position: fixed;
  z-index: 80;
  width: min(340px, calc(100vw - 24px));
  padding: 12px;
  border: 1px solid var(--ct-border);
  border-radius: 16px;
  background: var(--ct-surface);
  color: var(--ct-text);
  box-shadow: 0 28px 70px rgba(0,0,0,0.28);
}

.ct86-inspector code {
  display: block;
  padding: 6px;
  margin-top: 5px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--ct-surface-2) 80%, transparent);
  word-break: break-word;
}

.ct86-modal {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgba(0,0,0,0.56);
}

.ct86-modal-body {
  width: min(1180px, 100%);
  height: min(820px, calc(100vh - 44px));
  border: 1px solid var(--ct-border);
  border-radius: 20px;
  overflow: hidden;
  background: #0d1017;
  color: #e9eef9;
  box-shadow: 0 40px 90px rgba(0,0,0,0.45);
  display: grid;
  grid-template-rows: auto 1fr;
}

.ct86-modal-body header {
  padding: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.ct86-modal-body textarea {
  border: 0;
  resize: none;
  outline: 0;
  padding: 14px;
  background: #090b10;
  color: #e6eeff;
  font-family: Consolas, "IBM Plex Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 1200px) {
  .ct86-main[data-split="true"] { grid-template-columns: 1fr; }
  .ct86-code-panel { position: relative; top: auto; height: 520px; }
  .ct86-filter-grid,
  .ct86-view-row[data-view="horizontal"],
  .ct86-view-row[data-view="museum"],
  .ct86-view-row[data-view="standing"],
  .ct86-object-grid,
  .ct86-object-hero,
  .ct86-list-card { grid-template-columns: 1fr; }
  .ct86-code-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 720px) {
  .ct86-page { padding: 12px; }
  .ct86-topbar { grid-template-columns: 1fr; }
  .ct86-period-table,
  .ct86-filter-grid,
  .ct86-segment-grid { grid-template-columns: 1fr; }
  .ct86-horizontal-card,
  .ct86-list-card,
  .ct86-museum-card { grid-template-columns: 1fr; }
}
`;

const PAGE_CODE = `export default function TestVisningLiveEditorPage() {
  const [skin, setSkin] = useState<SkinKey>("collectium");
  const [mode, setMode] = useState<PreviewMode>("cards");
  const [split, setSplit] = useState(false);
  const [editedCss, setEditedCss] = useState(ORIGINAL_GLOBAL_CSS);

  return (
    <main className="ct86-page" data-skin={skin}>
      <style>{editedCss}</style>
      <Topbar />
      <FilterAndTimeline />
      <main className="ct86-main" data-split={split}>
        <CodePanel />
        <Preview />
      </main>
    </main>
  );
}`;

const LAYOUT_CODE = `// Globalt skall rundt siden ligger fortsatt i prosjektets vanlige layout.
// Denne testfilen skal ikke lage egen sidebar/topbar for produksjon.

app/layout.tsx
components/layout/CollectiumAppShell.tsx
components/layout/CollectiumAppShell.module.css

/test/visning er en testflate inne i globalt Collectium-skall.
Skin-testen her er lokal preview av tokens, ikke sann global skinmotor.`;

const CARD_CODE = `.ct86-horizontal-card { grid-template-columns: 172px minmax(0, 1fr) 170px; }
.ct86-list-card { grid-template-columns: 300px minmax(0, 1fr) 330px 170px; }
.ct86-museum-card { grid-template-columns: minmax(220px, .9fr) minmax(0, 1.1fr); }
.ct86-view-row[data-view="museum"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ct86-view-row[data-view="standing"] { grid-template-columns: repeat(2, minmax(280px, 1fr)); }`;

const OBJECT_CODE = `ObjectPresentation
- route: /objekt/[sourceKey]/[objectGroup]/[objectId]
- feature: object.presentation.view
- api: GET /api/object/presentation
- view: ct_v_object_presentation_resolved
- source view: ct_v_no_banknote_object_presentation`;

const RELATION_CODE = `RelationPresentation
- route: /relasjon/[relationType]/[slug]
- feature: object.relations.view
- api: GET /api/object/relations
- view: ct_v_object_relations_resolved
- href source: relation_href`;

const API_CODE = `KILDE / BRYTER / FELT
catalog.object.open -> GET /objekt/[sourceKey]/[objectGroup]/[objectId]
object.presentation.view -> GET /api/object/presentation -> ct_v_object_presentation_resolved
object.relations.view -> GET /api/object/relations -> ct_v_object_relations_resolved
object.market.view -> GET /api/object/market -> ct_v_object_market_resolved
object.user_state.view -> GET /api/object/user-state -> ct_v_object_user_state_resolved
catalog.search -> GET /api/catalog/search -> ct_v_catalog_objects_resolved`;

const objectData = {
  title: "1 øre · 1876 · Bronse · 1",
  museumTitle: "Museum · 1 øre · 1876 · Bronse · 1",
  largeTitle: "100 kroner · 1. utgave · 1877 · Seddelpapir",
  value: "1 øre",
  issue: "1876–1902",
  variant: "Ikke registrert",
  rarity: "Ikke vurdert",
  source: "norske_mynter · coin · 1876 · Frederik VI",
  regent: "Frederik VI",
  year: "1876",
  context: "Konge",
  relation: "Relasjon tilgjengelig",
  estimate: "Ikke estimert",
};

function getCode(target: CodeTarget, editedCss: string) {
  if (target === "global") return editedCss;
  if (target === "page") return PAGE_CODE;
  if (target === "layout") return LAYOUT_CODE;
  if (target === "cards") return CARD_CODE;
  if (target === "object") return OBJECT_CODE;
  if (target === "relation") return RELATION_CODE;
  return API_CODE;
}

function useInspect(setInspect: React.Dispatch<React.SetStateAction<InspectInfo | null>>) {
  return (event: React.MouseEvent<HTMLElement>, info: Omit<InspectInfo, "x" | "y">) => {
    event.preventDefault();
    setInspect({ ...info, x: event.clientX, y: event.clientY });
  };
}

function DataField({
  label,
  value,
  selector,
  setInspect,
}: {
  label: string;
  value: string;
  selector: string;
  setInspect: React.Dispatch<React.SetStateAction<InspectInfo | null>>;
}) {
  const inspect = useInspect(setInspect);
  return (
    <div
      className="ct86-field"
      onContextMenu={(event) =>
        inspect(event, {
          title: label,
          file: "app/test/visning/page.tsx",
          selector,
          feature: "object.presentation.view",
          api: "GET /api/object/presentation",
          view: "ct_v_object_presentation_resolved",
          href: `/relasjon/felt/${label.toLowerCase().replaceAll(" ", "-")}`,
        })
      }
    >
      <label>{label}</label>
      <strong>{value}</strong>
    </div>
  );
}

function NoteImage({ wide = false }: { wide?: boolean }) {
  return (
    <div className="ct86-note" data-wide={wide}>
      <span className="ct86-note-number">100</span>
      <span className="ct86-note-bank">NORGES BANK</span>
      <span className="ct86-note-seal" />
    </div>
  );
}

function StatusColumn({ setInspect }: { setInspect: React.Dispatch<React.SetStateAction<InspectInfo | null>> }) {
  const inspect = useInspect(setInspect);
  const items = [
    ["♥", "Hjerte", "Ønskeliste", "0", "collection.wishlist.toggle"],
    ["★", "Stjerne", "Favoritt", "0", "collection.favorite.toggle"],
    ["⚑", "Auksjon", "Aktive treff", "3", "auction.object.view"],
    ["◆", "Nettbutikk", "Aktive salg", "1", "shop.object.view"],
  ];
  return (
    <aside className="ct86-status">
      {items.map(([icon, title, sub, count, feature]) => (
        <div
          key={title}
          className="ct86-status-item"
          onContextMenu={(event) =>
            inspect(event, {
              title,
              file: "app/test/visning/page.tsx :: StatusColumn",
              selector: ".ct86-status-item",
              feature,
              api: feature.includes("auction") ? "GET /api/auction/object" : "GET /api/object/user-state",
              view: feature.includes("auction") ? "ct_v_auction_objects_resolved" : "ct_v_object_user_state_resolved",
              href: `/api-info/${feature}`,
            })
          }
        >
          <span>{icon}</span>
          <div>
            <strong>{title}</strong>
            <small>{sub}</small>
          </div>
          <b>{count}</b>
        </div>
      ))}
      <div className="ct86-price">
        <span>⌁</span>
        <div>
          <strong>Estimert pris</strong>
          <small>Mangler markedsverdi</small>
        </div>
        <b>{objectData.estimate}</b>
      </div>
    </aside>
  );
}

function HistoryBox({ setInspect }: { setInspect: React.Dispatch<React.SetStateAction<InspectInfo | null>> }) {
  return (
    <section className="ct86-history">
      <strong className="ct86-section-title">Historie · 1808–1814</strong>
      <div className="ct86-mini-grid">
        <DataField label="Regent / konge" value={objectData.regent} selector=".ct86-history .regent" setInspect={setInspect} />
        <DataField label="Motiv / person" value={objectData.title} selector=".ct86-history .motif" setInspect={setInspect} />
        <DataField label="Årstall" value={objectData.year} selector=".ct86-history .year" setInspect={setInspect} />
        <DataField label="Historisk kontekst" value={objectData.context} selector=".ct86-history .context" setInspect={setInspect} />
        <DataField label="Signatur" value="Ikke registrert" selector=".ct86-history .signature" setInspect={setInspect} />
        <DataField label="Relasjon" value={objectData.relation} selector=".ct86-history .relation" setInspect={setInspect} />
      </div>
    </section>
  );
}

function Actions() {
  return (
    <div className="ct86-actions">
      <button className="ct86-action" type="button">↗ Åpne objekt</button>
      <button className="ct86-action" type="button">⌘ Se relasjon</button>
      <button className="ct86-action" type="button">◎ Legg i samling</button>
      <button className="ct86-action" type="button">•••</button>
    </div>
  );
}

function Identity({ setInspect }: { setInspect: React.Dispatch<React.SetStateAction<InspectInfo | null>> }) {
  return (
    <section>
      <h3>{objectData.title}</h3>
      <div className="ct86-mini-grid">
        <DataField label="Valør / utgave" value={objectData.value} selector=".ct86-mini-grid .value" setInspect={setInspect} />
        <DataField label="Utgave" value={objectData.issue} selector=".ct86-mini-grid .issue" setInspect={setInspect} />
        <DataField label="Variant" value={objectData.variant} selector=".ct86-mini-grid .variant" setInspect={setInspect} />
        <DataField label="Sjeldenhet" value={objectData.rarity} selector=".ct86-mini-grid .rarity" setInspect={setInspect} />
      </div>
      <p className="ct86-meta">{objectData.source}</p>
    </section>
  );
}

function ViewCards({ setInspect }: { setInspect: React.Dispatch<React.SetStateAction<InspectInfo | null>> }) {
  return (
    <section className="ct86-card-grid">
      <div>
        <h2 className="ct86-label">Horisontal · kompakt · to i bredden</h2>
        <div className="ct86-view-row" data-view="horizontal">
          {[0, 1].map((index) => (
            <article className="ct86-card ct86-horizontal-card" key={`h-${index}`}>
              <NoteImage />
              <div>
                <Identity setInspect={setInspect} />
                <HistoryBox setInspect={setInspect} />
                <Actions />
              </div>
              <StatusColumn setInspect={setInspect} />
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="ct86-label">Liste · kompakt</h2>
        <div className="ct86-view-row" data-view="list">
          <article className="ct86-card ct86-list-card">
            <NoteImage wide />
            <Identity setInspect={setInspect} />
            <HistoryBox setInspect={setInspect} />
            <StatusColumn setInspect={setInspect} />
          </article>
        </div>
      </div>

      <div>
        <h2 className="ct86-label">Museum · stablet to</h2>
        <div className="ct86-view-row" data-view="museum">
          {[0, 1].map((index) => (
            <article className="ct86-card ct86-museum-card" key={`m-${index}`}>
              <NoteImage wide />
              <div>
                <h3>{objectData.museumTitle}</h3>
                <HistoryBox setInspect={setInspect} />
                <Actions />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div>
        <h2 className="ct86-label">Stående · to i bredden</h2>
        <div className="ct86-view-row" data-view="standing">
          {[0, 1].map((index) => (
            <article className="ct86-card ct86-standing-card" key={`s-${index}`}>
              <NoteImage />
              <Identity setInspect={setInspect} />
              <div className="ct86-mini-grid">
                <HistoryBox setInspect={setInspect} />
                <StatusColumn setInspect={setInspect} />
              </div>
              <Actions />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ObjectPresentation({ setInspect }: { setInspect: React.Dispatch<React.SetStateAction<InspectInfo | null>> }) {
  return (
    <section className="ct86-object">
      <div className="ct86-object-hero">
        <NoteImage wide />
        <div>
          <span className="ct86-pill">Norge · Seddel · Norske sedler · Standardutgave</span>
          <h2>{objectData.largeTitle}</h2>
          <p>Tidlig hovedvalør fra den norske seddelhistorien. Sjelden i alle kvaliteter, ekstremt sjelden over 45 XF.</p>
          <div className="ct86-mini-grid">
            <DataField label="Markedsverdi" value="15 000 kr" selector=".ct86-object .market" setInspect={setInspect} />
            <DataField label="Trend 12 mnd" value="↗ 4,2 %" selector=".ct86-object .trend" setInspect={setInspect} />
            <DataField label="Sjeldenhet" value="RRR" selector=".ct86-object .rarity" setInspect={setInspect} />
            <DataField label="Konge" value="Oscar II" selector=".ct86-object .king" setInspect={setInspect} />
          </div>
        </div>
      </div>
      <div className="ct86-object-grid">
        <div>
          <div className="ct86-chip-row">
            <button className="ct86-pill" data-active="true">I Samler</button>
            <button className="ct86-pill">II Historie</button>
            <button className="ct86-pill">III Finans</button>
            <button className="ct86-pill">IV I min samling</button>
          </div>
          <div className="ct86-segment-grid">
            <div className="ct86-segment-card"><strong>Identitet</strong><DataField label="Katalognummer" value="NS 1 459" selector=".ct86-segment-card .catalog" setInspect={setInspect} /><DataField label="Valør" value="100 kroner" selector=".ct86-segment-card .value" setInspect={setInspect} /></div>
            <div className="ct86-segment-card"><strong>Historie</strong><DataField label="Regent" value="Oscar II" selector=".ct86-segment-card .regent" setInspect={setInspect} /><DataField label="Signatur" value="Winge / Getz" selector=".ct86-segment-card .signature" setInspect={setInspect} /></div>
            <div className="ct86-segment-card"><strong>Finans</strong><DataField label="Sist solgt" value="19 200 kr · sept 2025" selector=".ct86-segment-card .sold" setInspect={setInspect} /><DataField label="Likviditet" value="Moderat" selector=".ct86-segment-card .liquidity" setInspect={setInspect} /></div>
          </div>
        </div>
        <aside className="ct86-side-box">
          <strong>Status</strong>
          <StatusColumn setInspect={setInspect} />
          <strong className="ct86-section-title">Del visning</strong>
          <div className="ct86-chip-row"><button className="ct86-pill">6t</button><button className="ct86-pill" data-active="true">12t</button><button className="ct86-pill">18t</button><button className="ct86-pill">24t</button></div>
        </aside>
      </div>
    </section>
  );
}

function RelationPresentation() {
  return (
    <section className="ct86-relation">
      <span className="ct86-pill">Relasjon / regent / Oscar II</span>
      <h2>Oscar II</h2>
      <p>Regentperiode, unionstid, relaterte sedler, mynter, personer, signaturer og historiske hendelser.</p>
      <div className="ct86-relation-list">
        {[
          ["Konge · Oscar II", "Vis konge, periode og objekter gruppert etter type"],
          ["Signatur · Winge/Getz", "Vis signaturperiode og objekter med samme signatur"],
          ["Motiv · Riksvåpen", "Vis motiv/person og egne objektlister"],
          ["Utgave · 1. utgave", "Vis alle objekter i samme utgave"],
        ].map(([title, sub]) => (
          <div className="ct86-relation-row" key={title}><div><strong>{title}</strong><small>{sub}</small></div><button className="ct86-pill">→</button></div>
        ))}
      </div>
    </section>
  );
}

function UserCard() {
  return (
    <section className="ct86-user-card">
      <h2>Brukerkort / I min samling</h2>
      <div className="ct86-segment-grid">
        <div className="ct86-segment-card"><strong>Kjøp</strong><p>Dato, sted, av, pris og dokumentasjon.</p></div>
        <div className="ct86-segment-card"><strong>Kvalitet</strong><p>Min kvalitet, gradering, plassering og privat synlighet.</p></div>
        <div className="ct86-segment-card"><strong>Deling</strong><p>6t, 12t, 18t, 24t og 48t lenker.</p></div>
      </div>
    </section>
  );
}

function SwitchesAndLinks() {
  return (
    <section className="ct86-panel" style={{ padding: 16 }}>
      <h2>Brytere / linker / API / views</h2>
      <div className="ct86-relation-list">
        {[
          ["catalog.object.open", "GET /objekt/[sourceKey]/[objectGroup]/[objectId]", "ct_app_pages + ct_feature_action_routes"],
          ["object.presentation.view", "GET /api/object/presentation", "ct_v_object_presentation_resolved"],
          ["object.relations.view", "GET /api/object/relations", "ct_v_object_relations_resolved"],
          ["object.market.view", "GET /api/object/market", "ct_v_object_market_resolved"],
          ["object.user_state.view", "GET /api/object/user-state", "ct_v_object_user_state_resolved"],
        ].map(([feature, api, view]) => (
          <div className="ct86-relation-row" key={feature}>
            <div><strong>{feature}</strong><small>{api}</small><small>{view}</small></div>
            <button className="ct86-pill">Åpne</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function FiltersAndTimeline({
  activePeriod,
  setActivePeriod,
  openCode,
}: {
  activePeriod: string;
  setActivePeriod: (value: string) => void;
  openCode: (target: CodeTarget, modal?: boolean) => void;
}) {
  const filters = [
    ["Master filter", "Norge · Norske sedler · mynter · verdipapir"],
    ["Samler filter", "Hjerte · stjerne · min samling · kvalitet"],
    ["Forhandler filter", "Auksjon · nettbutikk · forhandler · status"],
    ["Objektfilter", "Valør · år · litra · utgave · variant"],
  ];
  const periods = ["Objektpresentasjon", "Relasjonpresentasjon", "Periode 8.6", "Index / Finans"];
  return (
    <section className="ct86-panel ct86-filter-panel">
      <div className="ct86-filter-grid">
        {filters.map(([title, value]) => (
          <div className="ct86-filter-box" key={title}><strong>{title}</strong><span>{value}</span></div>
        ))}
      </div>
      <div className="ct86-filter-row" style={{ marginTop: 10 }}>
        <span className="ct86-pill">Område: Norge</span>
        <span className="ct86-pill">Kilde: Norske sedler</span>
        <span className="ct86-pill">Object group: banknote</span>
        <span className="ct86-pill">source_key: norske_sedler</span>
      </div>
      <div className="ct86-period-table">
        {periods.map((period) => (
          <button key={period} className="ct86-period" data-active={activePeriod === period} onClick={() => setActivePeriod(period)} type="button">
            <strong>{period}</strong><br /><small>Åpne tidslinje / periodevalg</small>
          </button>
        ))}
      </div>
      <div className="ct86-code-links">
        {codeTargets.map((target) => (
          <button className="ct86-code-link" key={target.key} onClick={() => openCode(target.key, true)} type="button">
            {target.label}<br /><small>{target.file}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function Inspector({ inspect, onClose }: { inspect: InspectInfo; onClose: () => void }) {
  return (
    <aside className="ct86-inspector" style={{ left: Math.min(inspect.x, window.innerWidth - 360), top: Math.min(inspect.y, window.innerHeight - 300) }}>
      <button className="ct86-pill" style={{ float: "right" }} type="button" onClick={onClose}>×</button>
      <strong>{inspect.title}</strong>
      <code>Fil: {inspect.file}</code>
      <code>CSS: {inspect.selector}</code>
      <code>Bryter: {inspect.feature}</code>
      <code>API: {inspect.api}</code>
      <code>View: {inspect.view}</code>
      <code>Link: {inspect.href}</code>
    </aside>
  );
}

export default function TestVisningLiveEditorPage() {
  const [skin, setSkin] = useState<SkinKey>("collectium");
  const [mode, setMode] = useState<PreviewMode>("cards");
  const [split, setSplit] = useState(false);
  const [fullscreenSplit, setFullscreenSplit] = useState(false);
  const [activePeriod, setActivePeriod] = useState("Objektpresentasjon");
  const [codeTarget, setCodeTarget] = useState<CodeTarget>("global");
  const [editedCss, setEditedCss] = useState(ORIGINAL_GLOBAL_CSS);
  const [showModal, setShowModal] = useState(false);
  const [inspect, setInspect] = useState<InspectInfo | null>(null);

  const activeCode = useMemo(() => getCode(codeTarget, editedCss), [codeTarget, editedCss]);
  const activeTarget = codeTargets.find((target) => target.key === codeTarget) ?? codeTargets[0];

  function openCode(target: CodeTarget, modal = false) {
    setCodeTarget(target);
    if (modal) setShowModal(true);
  }

  function updateActiveCode(value: string) {
    if (codeTarget === "global") setEditedCss(value);
  }

  function renderPreview() {
    if (mode === "object") return <ObjectPresentation setInspect={setInspect} />;
    if (mode === "relation") return <RelationPresentation />;
    if (mode === "user") return <UserCard />;
    if (mode === "switches") return <SwitchesAndLinks />;
    return <ViewCards setInspect={setInspect} />;
  }

  return (
    <main className="ct86-page" data-skin={skin}>
      <style>{editedCss}</style>
      <header className="ct86-topbar">
        <div className="ct86-title">
          <small>app/test/visning/page.tsx · live editor · originalkode + editert kode</small>
          <h1>Collectium test / visning</h1>
          <p>Global skin følger siden. Split-screen gir 450px kodefelt til venstre og forhåndsvisning på resten av skjermen.</p>
        </div>
        <div className="ct86-toolbar">
          {skins.map((item) => <button type="button" key={item.key} data-active={skin === item.key} onClick={() => setSkin(item.key)}>{item.label}</button>)}
          <button type="button" data-active={split} onClick={() => setSplit(!split)}>Splitt koder</button>
          <button type="button" data-active={fullscreenSplit} onClick={() => { setSplit(true); setFullscreenSplit(!fullscreenSplit); }}>Full screen split</button>
          <button type="button" onClick={() => openCode("global", true)}>Global CSS</button>
        </div>
      </header>

      <FiltersAndTimeline activePeriod={activePeriod} setActivePeriod={setActivePeriod} openCode={openCode} />

      <div className="ct86-chip-row" style={{ marginBottom: 14 }}>
        {modes.map((item) => <button className="ct86-pill" data-active={mode === item.key} key={item.key} type="button" onClick={() => setMode(item.key)}>{item.label}</button>)}
        <span className="ct86-pill">Aktiv periode: {activePeriod}</span>
      </div>

      <section
        className="ct86-main"
        data-split={split || fullscreenSplit}
        style={fullscreenSplit ? { position: "fixed", inset: 0, zIndex: 70, padding: 18, background: "var(--ct-bg)", overflow: "auto" } : undefined}
      >
        <aside className="ct86-code-panel">
          <header>
            <strong>{activeTarget.label}</strong>
            <small style={{ display: "block", opacity: 0.76 }}>{activeTarget.file}</small>
            <div className="ct86-chip-row" style={{ marginTop: 8 }}>
              {codeTargets.map((target) => <button className="ct86-pill" type="button" key={target.key} data-active={codeTarget === target.key} onClick={() => setCodeTarget(target.key)}>{target.label}</button>)}
              <button className="ct86-pill" type="button" onClick={() => setEditedCss(ORIGINAL_GLOBAL_CSS)}>Reset original CSS</button>
              {fullscreenSplit ? <button className="ct86-pill" type="button" onClick={() => setFullscreenSplit(false)}>Lukk full screen</button> : null}
            </div>
          </header>
          <textarea value={activeCode} onChange={(event) => updateActiveCode(event.target.value)} readOnly={codeTarget !== "global"} spellCheck={false} />
        </aside>
        <section className="ct86-preview">{renderPreview()}</section>
      </section>

      {inspect ? <Inspector inspect={inspect} onClose={() => setInspect(null)} /> : null}

      {showModal ? (
        <div className="ct86-modal" role="dialog" aria-modal="true">
          <div className="ct86-modal-body">
            <header>
              <div>
                <strong>{activeTarget.label}</strong>
                <small style={{ display: "block", opacity: 0.7 }}>{activeTarget.file}</small>
              </div>
              <div className="ct86-chip-row">
                <button className="ct86-pill" type="button" onClick={() => setEditedCss(ORIGINAL_GLOBAL_CSS)}>Reset original CSS</button>
                <button className="ct86-pill" type="button" onClick={() => { setShowModal(false); setSplit(true); }}>Åpne i split screen</button>
                <button className="ct86-pill" type="button" onClick={() => setShowModal(false)}>Lukk</button>
              </div>
            </header>
            <textarea value={activeCode} onChange={(event) => updateActiveCode(event.target.value)} readOnly={codeTarget !== "global"} spellCheck={false} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
