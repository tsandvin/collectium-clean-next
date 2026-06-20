"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Test Visning Live Editor 8.6
 *
 * Definering / formål:
 * En selvstendig Next.js/React testside for /test/visning. Siden viser
 * Collectium visningskort, objektpresentasjon, relasjonspresentasjon,
 * brukerkort, brytere, linker, filterstruktur og live CSS-editor.
 *
 * Bruksområde:
 * Brukes som visuell testflate for UI/UX 8.6 før komponentene kobles mot
 * ekte API, views, DB-brytere og katalogdata. Siden er laget i én fil slik
 * at global testkode, sidekode, layoutkode, original CSS og editert CSS kan
 * sees samlet.
 *
 * Berørte sider / routes:
 * - /test/visning
 *
 * Berørte DB-brytere / feature_keys:
 * - test.visning.view
 * - catalog.view
 * - catalog.filters
 * - catalog.object.open
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 * - relation.presentation.view
 * - collection.wishlist.toggle
 * - collection.favorite.toggle
 * - collection.item.add
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/catalog/filters
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 * - GET /api/relations/presentation
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 * - ct_v_catalog_filter_counts
 * - ct_v_object_presentation_resolved
 * - ct_v_no_banknote_object_presentation
 * - ct_v_object_relations_resolved
 * - ct_v_object_market_resolved
 * - ct_v_object_user_state_resolved
 * - ct_v_period_filter_options
 *
 * Dataretning:
 * Statisk testdata -> Next.js -> React -> UI. Senere: Neon/API -> React -> UI.
 *
 * Logging:
 * log_category: test_ui
 * log_action: test_visning_live_editor
 *
 * Versjon:
 * UI86-TEST-VISNING-LIVE-EDITOR-0001
 *
 * Endringsregel:
 * Dette er en testside. Den skal ikke endre global AppShell, layout.tsx,
 * globals.css eller produksjonskomponenter.
 */

import { useMemo, useState } from "react";

const ORIGINAL_CSS = String.raw`
:root {
  --ct-bg: #f7f4ec;
  --ct-panel: #fffdf8;
  --ct-panel-2: #f4f8f1;
  --ct-ink: #173c2c;
  --ct-muted: #6f8779;
  --ct-line: #d8cbb8;
  --ct-soft-line: rgba(113, 83, 45, .18);
  --ct-accent: #2f7b5d;
  --ct-accent-2: #d9b868;
  --ct-blue: #2d78b5;
  --ct-red: #cd5c50;
  --ct-radius: 14px;
  --ct-radius-sm: 10px;
  --ct-shadow: 0 14px 36px rgba(28, 42, 32, .09);
  --ct-font-serif: Georgia, "Times New Roman", serif;
  --ct-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ct-font-mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
}

.collectiumVisningTest {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(217, 184, 104, .18), transparent 28rem),
    linear-gradient(135deg, var(--ct-bg), #fbfaf6 52%, #eef5ef);
  color: var(--ct-ink);
  padding: 18px;
  font-family: var(--ct-font-sans);
}

.ctTestLayout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  max-width: 1840px;
  margin: 0 auto;
}

.ctTopPanel,
.ctFilterPanel,
.ctTimelinePanel,
.ctSection,
.ctCodeRegistry,
.ctPresentationGrid > section {
  position: relative;
  border: 1px solid var(--ct-line);
  border-radius: var(--ct-radius);
  background: color-mix(in srgb, var(--ct-panel) 92%, transparent);
  box-shadow: var(--ct-shadow);
  overflow: hidden;
}

.ctTopPanel::after,
.ctFilterPanel::after,
.ctTimelinePanel::after,
.ctSection::after,
.ctCodeRegistry::after,
.ctPresentationGrid > section::after,
.ctObjectCard::after {
  content: "________________ Collectium";
  position: absolute;
  right: 14px;
  bottom: 8px;
  font: italic 10px var(--ct-font-serif);
  color: color-mix(in srgb, var(--ct-muted) 65%, transparent);
  pointer-events: none;
}

.ctTopPanel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 18px 20px;
}

.ctKicker {
  margin: 0 0 4px;
  color: var(--ct-muted);
  text-transform: uppercase;
  letter-spacing: .18em;
  font-size: 10px;
  font-weight: 800;
}

.ctTopPanel h1,
.ctSection h2,
.ctCodeRegistry h2,
.ctPresentationGrid h2 {
  margin: 0;
  font-family: var(--ct-font-serif);
  letter-spacing: -.03em;
}

.ctTopPanel h1 { font-size: clamp(24px, 3vw, 40px); }
.ctTopPanel p { margin: 8px 0 0; color: var(--ct-muted); max-width: 820px; line-height: 1.5; }

.ctSkinSwitcher,
.ctModeSwitcher {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-content: start;
  gap: 8px;
}

.ctSkinButton,
.ctModeButton,
.ctFilterChip,
.ctActionButton,
.ctCodeLink,
.ctSmallLink,
.ctPopupButton {
  border: 1px solid color-mix(in srgb, var(--ct-line) 70%, var(--ct-accent));
  border-radius: 999px;
  background: color-mix(in srgb, var(--ct-panel) 90%, white);
  color: var(--ct-ink);
  font: 800 12px var(--ct-font-sans);
  padding: 9px 13px;
  cursor: pointer;
  text-decoration: none;
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}

.ctSkinButton:hover,
.ctModeButton:hover,
.ctFilterChip:hover,
.ctActionButton:hover,
.ctCodeLink:hover,
.ctSmallLink:hover,
.ctPopupButton:hover { transform: translateY(-1px); border-color: var(--ct-accent); }
.ctSkinButton[aria-pressed="true"], .ctModeButton[aria-pressed="true"] { background: var(--ct-accent); color: #fff; }

.ctFilterPanel { padding: 14px; }
.ctFilterGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ctFilterGroup {
  border: 1px solid var(--ct-soft-line);
  border-radius: var(--ct-radius-sm);
  background: rgba(255,255,255,.52);
  padding: 10px;
  min-height: 92px;
}
.ctFilterGroup h3 {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--ct-muted);
}
.ctFilterChips { display: flex; flex-wrap: wrap; gap: 6px; }
.ctFilterChip { padding: 7px 10px; font-size: 11px; background: #fff; }

.ctTimelinePanel { padding: 14px; }
.ctAreaRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.ctPeriodTable {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--ct-soft-line);
  border-radius: var(--ct-radius-sm);
  overflow: hidden;
}
.ctPeriodCell {
  padding: 12px;
  min-height: 92px;
  background: linear-gradient(180deg, rgba(255,255,255,.74), rgba(245,248,241,.68));
  border-right: 1px solid var(--ct-soft-line);
}
.ctPeriodCell:last-child { border-right: none; }
.ctPeriodCell strong { display: block; font-family: var(--ct-font-serif); font-size: 18px; margin-bottom: 3px; }
.ctPeriodCell span { color: var(--ct-muted); font-size: 12px; }
.ctPeriodLine { height: 5px; border-radius: 999px; background: linear-gradient(90deg, var(--ct-accent), var(--ct-accent-2)); margin-top: 12px; }

.ctCodeHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.ctCodeHeader h3 { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: .14em; color: var(--ct-muted); }
.ctCodeLinks { display: flex; flex-wrap: wrap; gap: 7px; }
.ctCodeLink { padding: 7px 10px; font-size: 11px; }

.ctSection { padding: 14px; }
.ctSectionHeader {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.ctSectionHeader p { margin: 4px 0 0; color: var(--ct-muted); font-size: 13px; }

.ctCardsHorizontal,
.ctCardsList,
.ctCardsMuseum,
.ctCardsStanding {
  display: grid;
  gap: 10px;
}
.ctCardsHorizontal { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ctCardsList { grid-template-columns: 1fr; }
.ctCardsMuseum { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ctCardsStanding { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 880px; }

.ctObjectCard {
  position: relative;
  display: grid;
  gap: 10px;
  border: 1px solid var(--ct-line);
  border-radius: var(--ct-radius);
  background: linear-gradient(145deg, var(--ct-panel), color-mix(in srgb, var(--ct-panel-2) 64%, white));
  box-shadow: 0 10px 24px rgba(28, 42, 32, .07);
  padding: 10px 10px 24px;
  overflow: hidden;
}

.ctCardHorizontal {
  grid-template-columns: 148px minmax(0, 1fr) 148px;
  min-height: 176px;
}
.ctCardList {
  grid-template-columns: 250px minmax(0, 1fr) 280px 132px;
  min-height: 132px;
  padding-bottom: 16px;
}
.ctCardMuseum {
  grid-template-columns: 44% minmax(0, 1fr);
  min-height: 270px;
}
.ctCardStanding {
  grid-template-columns: 1fr;
  min-height: 520px;
}

.ctNoteImage {
  position: relative;
  min-height: 126px;
  border: 1px solid color-mix(in srgb, var(--ct-line) 80%, white);
  border-radius: 9px;
  overflow: hidden;
  background:
    repeating-linear-gradient(135deg, rgba(96,111,99,.07), rgba(96,111,99,.07) 2px, transparent 2px, transparent 11px),
    linear-gradient(135deg, #fffdf6, #f1f4ee);
}
.ctCardMuseum .ctNoteImage { min-height: 246px; }
.ctCardStanding .ctNoteImage { min-height: 150px; }
.ctNoteNumber {
  position: absolute;
  top: 2px;
  left: 20px;
  font-family: var(--ct-font-serif);
  font-size: clamp(58px, 8vw, 110px);
  color: rgba(48,70,59,.14);
  line-height: 1;
}
.ctNoteBank {
  position: absolute;
  left: 18px;
  bottom: 18px;
  font: 900 10px var(--ct-font-mono);
  color: rgba(28,64,49,.62);
  letter-spacing: .22em;
}
.ctNoteSeal {
  position: absolute;
  right: 22px;
  top: 50%;
  width: 70px;
  height: 82px;
  border-radius: 999px 999px 22px 22px;
  transform: translateY(-50%);
  background: radial-gradient(circle at 50% 25%, #f7ead6, #e8ddc9 60%, rgba(232,221,201,.2));
}

.ctIdentity h3,
.ctMuseumInfo h3 {
  margin: 0 0 8px;
  font-family: var(--ct-font-serif);
  font-size: clamp(19px, 2vw, 28px);
  letter-spacing: -.03em;
}
.ctCardList .ctIdentity h3 { font-size: 21px; }
.ctMetaLine { color: var(--ct-muted); font-size: 11px; margin-top: 8px; }
.ctFieldGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 12px; }
.ctField {
  border-bottom: 1px dashed var(--ct-soft-line);
  padding-bottom: 5px;
}
.ctField label {
  display: block;
  color: var(--ct-muted);
  font: 900 9px var(--ct-font-sans);
  text-transform: uppercase;
  letter-spacing: .12em;
}
.ctField button,
.ctField strong {
  display: inline-block;
  color: var(--ct-ink);
  font: 700 14px var(--ct-font-serif);
  background: none;
  border: 0;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.ctHistoryMini {
  border: 1px solid color-mix(in srgb, var(--ct-accent) 34%, var(--ct-line));
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(240,248,239,.8), rgba(255,255,255,.46));
  padding: 10px;
}
.ctHistoryMini h4 { margin: 0 0 8px; font-family: var(--ct-font-serif); font-size: 17px; }
.ctHistoryMini p { margin: 0; color: var(--ct-muted); font-size: 12px; }
.ctStatusStack { display: grid; gap: 7px; align-content: start; }
.ctStatusPill {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid var(--ct-line);
  padding: 7px 8px;
  background: rgba(255,255,255,.58);
}
.ctStatusPill span { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,255,255,.74); }
.ctStatusPill strong { font-size: 12px; }
.ctStatusPill em { display: block; color: var(--ct-muted); font-size: 9px; font-style: normal; }
.ctStatusPill b { font-size: 12px; }
.ctHeart { border-color: color-mix(in srgb, var(--ct-red) 55%, var(--ct-line)); background: color-mix(in srgb, var(--ct-red) 10%, white); }
.ctStar { border-color: color-mix(in srgb, var(--ct-accent-2) 65%, var(--ct-line)); background: color-mix(in srgb, var(--ct-accent-2) 15%, white); }
.ctAuction { border-color: color-mix(in srgb, var(--ct-blue) 55%, var(--ct-line)); background: color-mix(in srgb, var(--ct-blue) 11%, white); }
.ctShop { border-color: color-mix(in srgb, var(--ct-accent) 45%, var(--ct-line)); background: color-mix(in srgb, var(--ct-accent) 10%, white); }
.ctPriceBox {
  border: 1px solid color-mix(in srgb, var(--ct-accent) 40%, var(--ct-line));
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  background: rgba(255,255,255,.54);
}
.ctPriceBox span { display: block; font: 900 10px var(--ct-font-mono); text-transform: uppercase; letter-spacing: .22em; color: var(--ct-muted); }
.ctPriceBox strong { display: block; font: 400 25px var(--ct-font-serif); line-height: 1.05; margin: 5px 0; }
.ctPriceBox em { display: block; font: 900 9px var(--ct-font-mono); text-transform: uppercase; letter-spacing: .18em; color: var(--ct-muted); font-style: normal; }
.ctActions { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
.ctActionButton { padding: 8px 12px; background: #fff; }
.ctCardList .ctActions { margin-top: 8px; }
.ctCardList .ctStatusStack { grid-template-columns: 1fr 1fr; }
.ctCardList .ctPriceBox { grid-column: span 2; padding: 8px; }
.ctCardList .ctPriceBox strong { font-size: 19px; }
.ctCardMuseum .ctHistoryMini { min-height: 142px; }
.ctCardStanding .ctStatusStack { grid-template-columns: 1fr 1fr; }
.ctCardStanding .ctPriceBox { grid-column: span 2; }

.ctPresentationGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.ctPresentationGrid > section { padding: 14px 14px 28px; }
.ctPresentationGrid p { color: var(--ct-muted); line-height: 1.45; }
.ctLinkList { display: grid; gap: 7px; }
.ctSmallLink { width: fit-content; padding: 7px 10px; }

.ctCodeRegistry { padding: 14px 14px 28px; }
.ctRegistryGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.ctRegistryCard {
  border: 1px solid var(--ct-soft-line);
  border-radius: 10px;
  padding: 10px;
  background: rgba(255,255,255,.52);
}
.ctRegistryCard h3 { margin: 0 0 8px; font-size: 13px; }
.ctRegistryCard ul { margin: 0; padding-left: 17px; color: var(--ct-muted); font-size: 12px; line-height: 1.6; }

.ctEditorOverlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(12, 20, 17, .58);
  display: grid;
  place-items: center;
  padding: 18px;
}
.ctEditorModal {
  width: min(1280px, 96vw);
  height: min(820px, 92vh);
  display: grid;
  grid-template-rows: auto 1fr;
  background: #101915;
  color: #eef6ee;
  border: 1px solid rgba(255,255,255,.24);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 90px rgba(0,0,0,.45);
}
.ctEditorModal header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,.14);
}
.ctEditorModal h2 { margin: 0; font-family: var(--ct-font-serif); }
.ctEditorBody { display: grid; grid-template-columns: 1fr; min-height: 0; }
.ctEditorBody[data-split="true"] { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.ctEditorPane { min-height: 0; overflow: auto; padding: 12px; }
.ctEditorPreview { background: var(--ct-bg); color: var(--ct-ink); }
.ctEditorTextarea {
  width: 100%;
  min-height: 100%;
  resize: none;
  border: 0;
  outline: 0;
  background: #0b1110;
  color: #e8ffe9;
  font: 12px/1.55 var(--ct-font-mono);
  padding: 12px;
}
.ctEditorDiff {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-height: 180px;
}
.ctEditorDiff pre {
  margin: 0;
  white-space: pre-wrap;
  font: 11px/1.4 var(--ct-font-mono);
  background: rgba(255,255,255,.06);
  border-radius: 12px;
  padding: 10px;
  max-height: 280px;
  overflow: auto;
}

.ctContextMenu {
  position: fixed;
  z-index: 10000;
  min-width: 250px;
  border-radius: 12px;
  background: #fffdf8;
  border: 1px solid var(--ct-line);
  box-shadow: 0 18px 48px rgba(0,0,0,.18);
  padding: 8px;
}
.ctContextMenu strong { display: block; padding: 8px; font-size: 12px; }
.ctContextMenu a,
.ctContextMenu button { display: block; width: 100%; border: 0; background: none; color: var(--ct-ink); text-align: left; padding: 8px; text-decoration: none; cursor: pointer; border-radius: 8px; }
.ctContextMenu a:hover,
.ctContextMenu button:hover { background: rgba(47,123,93,.1); }

[data-test-skin="samler"] {
  --ct-bg: #f4f8ef;
  --ct-panel: #fffffb;
  --ct-panel-2: #edf7ea;
  --ct-ink: #173b2b;
  --ct-muted: #607d69;
  --ct-line: #b9d0b6;
  --ct-accent: #2f8663;
  --ct-accent-2: #d4b760;
}
[data-test-skin="museum"] {
  --ct-bg: #f0ede4;
  --ct-panel: #fffaf0;
  --ct-panel-2: #eee5d3;
  --ct-ink: #2f261d;
  --ct-muted: #80715c;
  --ct-line: #c8b894;
  --ct-accent: #8a6532;
  --ct-accent-2: #b89347;
  --ct-shadow: 0 16px 42px rgba(66, 48, 24, .13);
}
[data-test-skin="finans"] {
  --ct-bg: #eef4f8;
  --ct-panel: #f9fdff;
  --ct-panel-2: #e7f0f7;
  --ct-ink: #102b3a;
  --ct-muted: #567486;
  --ct-line: #b8ccd9;
  --ct-accent: #1e6f91;
  --ct-accent-2: #4db6a0;
  --ct-blue: #0d78bb;
}
[data-test-skin="collectium"] {
  --ct-bg: #f7f4ec;
  --ct-panel: #fffdf8;
  --ct-panel-2: #f4f8f1;
  --ct-ink: #173c2c;
  --ct-muted: #6f8779;
  --ct-line: #d8cbb8;
  --ct-accent: #2f7b5d;
  --ct-accent-2: #d9b868;
}

@media (max-width: 1180px) {
  .ctFilterGrid,
  .ctRegistryGrid,
  .ctPresentationGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ctCardsHorizontal,
  .ctCardsMuseum,
  .ctCardsStanding { grid-template-columns: 1fr; }
  .ctCardList { grid-template-columns: 210px minmax(0, 1fr); }
  .ctCardList .ctHistoryMini,
  .ctCardList .ctStatusStack { grid-column: 1 / -1; }
}
@media (max-width: 740px) {
  .collectiumVisningTest { padding: 10px; }
  .ctTopPanel { grid-template-columns: 1fr; }
  .ctSkinSwitcher, .ctModeSwitcher { justify-content: flex-start; }
  .ctFilterGrid,
  .ctPeriodTable,
  .ctRegistryGrid,
  .ctPresentationGrid { grid-template-columns: 1fr; }
  .ctCardHorizontal,
  .ctCardList,
  .ctCardMuseum { grid-template-columns: 1fr; }
  .ctFieldGrid { grid-template-columns: 1fr 1fr; }
  .ctEditorBody[data-split="true"] { grid-template-columns: 1fr; }
}
`;

type SkinKey = "collectium" | "samler" | "museum" | "finans";
type EditorTarget = "global" | "page" | "layout" | "horizontal" | "list" | "museum" | "standing" | "registry" | null;

type ContextMenuState = {
  x: number;
  y: number;
  label: string;
  href: string;
  feature: string;
  api: string;
  view: string;
} | null;

const objectData = {
  title: "1 øre • 1876 • Bronse • 1",
  value: "1 øre",
  issue: "1876-1902",
  variant: "Ikke registrert",
  rarity: "Ikke vurdert",
  meta: "norske_mynter · coin · 1876 · Frederik VI",
  regent: "Frederik VI",
  year: "1876",
  signature: "Ikke registrert",
  motif: "1 øre • 1876 • Bronse • 1",
  context: "Konge",
  relation: "Relasjon tilgjengelig",
  estimate: "Ikke estimert",
};

const cssTargets: Record<Exclude<EditorTarget, null>, string[]> = {
  global: [":root", "[data-test-skin=...]", ".collectiumVisningTest"],
  page: [".ctTopPanel", ".ctFilterPanel", ".ctTimelinePanel", ".ctSection"],
  layout: [".ctCardsHorizontal", ".ctCardsList", ".ctCardsMuseum", ".ctCardsStanding"],
  horizontal: [".ctCardHorizontal", ".ctCardsHorizontal"],
  list: [".ctCardList", ".ctCardsList"],
  museum: [".ctCardMuseum", ".ctCardsMuseum"],
  standing: [".ctCardStanding", ".ctCardsStanding"],
  registry: [".ctCodeRegistry", ".ctRegistryGrid", ".ctRegistryCard"],
};

const registry = [
  {
    title: "Kilder / views",
    items: ["ct_v_catalog_objects_resolved", "ct_v_object_presentation_resolved", "ct_v_object_relations_resolved", "ct_v_period_filter_options"],
  },
  {
    title: "API-ruter",
    items: ["GET /api/catalog/search", "GET /api/catalog/filters", "GET /api/object/presentation", "GET /api/relations/presentation"],
  },
  {
    title: "Brytere / feature_keys",
    items: ["catalog.view", "catalog.object.open", "object.presentation.view", "relation.presentation.view"],
  },
  {
    title: "Felt / objektkey",
    items: ["source_key", "object_group", "object_id", "relation_href", "period_slug"],
  },
];

function contextualLink(label: string, feature = "object.relations.view") {
  return {
    label,
    href: `/relasjon/test/${encodeURIComponent(label.toLowerCase().replaceAll(" ", "-"))}`,
    feature,
    api: feature.includes("object") ? "GET /api/object/relations" : "GET /api/relations/presentation",
    view: feature.includes("object") ? "ct_v_object_relations_resolved" : "ct_v_relation_presentation_resolved",
  };
}

export default function TestVisningLiveEditorPage() {
  const [skin, setSkin] = useState<SkinKey>("collectium");
  const [editedCss, setEditedCss] = useState(ORIGINAL_CSS);
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null);
  const [splitScreen, setSplitScreen] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  const changed = editedCss !== ORIGINAL_CSS;
  const targetSelectors = useMemo(() => (editorTarget ? cssTargets[editorTarget].join("\n") : ""), [editorTarget]);

  function openContext(event: React.MouseEvent, data: ReturnType<typeof contextualLink>) {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, ...data });
  }

  function openEditor(target: Exclude<EditorTarget, null>) {
    setEditorTarget(target);
    setShowDiff(false);
  }

  const Field = ({ label, value, feature }: { label: string; value: string; feature?: string }) => {
    const link = contextualLink(value, feature);
    return (
      <div className="ctField" onContextMenu={(event) => openContext(event, link)}>
        <label>{label}</label>
        <button type="button" onClick={() => setContextMenu({ x: 120, y: 120, ...link })}>{value}</button>
      </div>
    );
  };

  const NoteImage = ({ large = false }: { large?: boolean }) => (
    <div className="ctNoteImage" data-large={large ? "true" : "false"}>
      <span className="ctNoteNumber">100</span>
      <span className="ctNoteBank">NORGES&nbsp;&nbsp;BANK</span>
      <span className="ctNoteSeal" />
    </div>
  );

  const Identity = () => (
    <section className="ctIdentity">
      <h3 onContextMenu={(event) => openContext(event, contextualLink(objectData.title, "catalog.object.open"))}>{objectData.title}</h3>
      <div className="ctFieldGrid">
        <Field label="Valør / utgave" value={objectData.value} feature="catalog.filters" />
        <Field label="Utgave" value={objectData.issue} feature="catalog.filters" />
        <Field label="Variant" value={objectData.variant} feature="catalog.filters" />
        <Field label="Sjeldenhet" value={objectData.rarity} feature="object.market.view" />
      </div>
      <div className="ctMetaLine">{objectData.meta}</div>
    </section>
  );

  const HistoryMini = () => (
    <section className="ctHistoryMini">
      <h4>Historie <small>1808–1814</small></h4>
      <div className="ctFieldGrid">
        <Field label="Regent / konge" value={objectData.regent} feature="object.relations.view" />
        <Field label="Motiv / person" value={objectData.motif} feature="object.relations.view" />
        <Field label="Årstall" value={objectData.year} feature="object.relations.view" />
        <Field label="Historisk kontekst" value={objectData.context} feature="object.relations.view" />
        <Field label="Signatur" value={objectData.signature} feature="object.relations.view" />
        <Field label="Relasjon" value={objectData.relation} feature="relation.presentation.view" />
      </div>
    </section>
  );

  const StatusStack = () => (
    <aside className="ctStatusStack">
      <div className="ctStatusPill ctHeart"><span>♥</span><div><strong>Hjerte</strong><em>Ønskeliste</em></div><b>0</b></div>
      <div className="ctStatusPill ctStar"><span>★</span><div><strong>Stjerne</strong><em>Favoritt</em></div><b>0</b></div>
      <div className="ctStatusPill ctAuction"><span>⚑</span><div><strong>Auksjon</strong><em>Aktive treff</em></div><b>3</b></div>
      <div className="ctStatusPill ctShop"><span>◆</span><div><strong>Nettbutikk</strong><em>Aktive salg</em></div><b>1</b></div>
      <div className="ctPriceBox"><span>Estimert pris</span><strong>{objectData.estimate}</strong><em>Mangler markedsverdi</em></div>
    </aside>
  );

  const Actions = () => (
    <nav className="ctActions">
      <button className="ctActionButton" type="button" onContextMenu={(event) => openContext(event, contextualLink("Objekt info", "catalog.object.open"))}>↗ Åpne objekt</button>
      <button className="ctActionButton" type="button" onContextMenu={(event) => openContext(event, contextualLink("Se relasjon", "object.relations.view"))}>⌘ Se relasjon</button>
      <button className="ctActionButton" type="button" onContextMenu={(event) => openContext(event, contextualLink("Legg i samling", "collection.item.add"))}>◎ Legg i samling</button>
    </nav>
  );

  const HorizontalCard = () => (
    <article className="ctObjectCard ctCardHorizontal">
      <NoteImage />
      <div><Identity /><Actions /></div>
      <StatusStack />
    </article>
  );

  const ListCard = () => (
    <article className="ctObjectCard ctCardList">
      <NoteImage />
      <div><Identity /><Actions /></div>
      <HistoryMini />
      <StatusStack />
    </article>
  );

  const MuseumCard = () => (
    <article className="ctObjectCard ctCardMuseum">
      <NoteImage large />
      <div className="ctMuseumInfo"><h3>Museum · {objectData.title}</h3><HistoryMini /><Actions /></div>
    </article>
  );

  const StandingCard = () => (
    <article className="ctObjectCard ctCardStanding">
      <NoteImage />
      <Identity />
      <HistoryMini />
      <StatusStack />
      <Actions />
    </article>
  );

  return (
    <main className="collectiumVisningTest" data-test-skin={skin} onClick={() => setContextMenu(null)}>
      <style>{editedCss}</style>
      <div className="ctTestLayout">
        <section className="ctTopPanel">
          <div>
            <p className="ctKicker">Collectium UI/UX 8.6 · testside</p>
            <h1>Visning live editor</h1>
            <p>En sidefil med original CSS, editert CSS, reset, popup-editor og split screen. Høyreklikk på felt/knapper for å se relasjon, API, view og bryter.</p>
          </div>
          <div>
            <div className="ctSkinSwitcher" aria-label="Skin-bryter">
              {(["collectium", "samler", "museum", "finans"] as SkinKey[]).map((item) => (
                <button key={item} className="ctSkinButton" type="button" aria-pressed={skin === item} onClick={() => setSkin(item)}>{item}</button>
              ))}
            </div>
            <div className="ctModeSwitcher" style={{ marginTop: 10 }}>
              <button className="ctModeButton" type="button" aria-pressed={changed} onClick={() => openEditor("global")}>Global CSS</button>
              <button className="ctModeButton" type="button" aria-pressed={splitScreen} onClick={() => setSplitScreen(!splitScreen)}>Split screen</button>
              <button className="ctModeButton" type="button" onClick={() => setEditedCss(ORIGINAL_CSS)}>Reset original</button>
            </div>
          </div>
        </section>

        <section className="ctFilterPanel">
          <div className="ctCodeHeader"><h3>Filterrad</h3><div className="ctCodeLinks"><button className="ctCodeLink" onClick={() => openEditor("page")}>CSS: filter/page</button><button className="ctCodeLink" onClick={() => openEditor("registry")}>Kilde/bryter/API</button></div></div>
          <div className="ctFilterGrid">
            {["Master filter", "Samlerfilter", "Forhandlerfilter", "Objekt spesifikasjon filter"].map((title, index) => (
              <div className="ctFilterGroup" key={title}>
                <h3>{title}</h3>
                <div className="ctFilterChips">
                  {["Norge", "Kilde", index === 2 ? "Auksjon" : "Valør", index === 3 ? "Variant" : "Historie"].map((chip) => <button className="ctFilterChip" key={chip}>{chip}</button>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ctTimelinePanel">
          <div className="ctCodeHeader"><h3>Område + enkel periodetabell</h3><button className="ctCodeLink" onClick={() => openEditor("page")}>CSS: periode/tidslinje</button></div>
          <div className="ctAreaRow"><button className="ctFilterChip">Norge</button><button className="ctFilterChip">Skandinavia</button><button className="ctFilterChip">Europa</button><button className="ctFilterChip">Global</button></div>
          <div className="ctPeriodTable">
            {["Statsoverhode", "Krig / konflikt", "Finans / økonomi", "Objektperiode"].map((period, index) => (
              <div className="ctPeriodCell" key={period}><strong>{period}</strong><span>{["Frederik VI · 1808–1814", "Napoleonskrigene", "Statsbankerott", "1876–1902"][index]}</span><div className="ctPeriodLine" /></div>
            ))}
          </div>
        </section>

        <section className="ctSection">
          <div className="ctSectionHeader"><div><h2>Horisontal</h2><p>Kompakt horisontal visning, to i bredden.</p></div><button className="ctCodeLink" onClick={() => openEditor("horizontal")}>CSS: horisontal</button></div>
          <div className="ctCardsHorizontal"><HorizontalCard /><HorizontalCard /></div>
        </section>

        <section className="ctSection">
          <div className="ctSectionHeader"><div><h2>Liste</h2><p>Kompakt listevisning med bilde, identitet, historie og status på samme rad.</p></div><button className="ctCodeLink" onClick={() => openEditor("list")}>CSS: liste</button></div>
          <div className="ctCardsList"><ListCard /><ListCard /></div>
        </section>

        <section className="ctSection">
          <div className="ctSectionHeader"><div><h2>Museum</h2><p>Museum vises stablet to og to på desktop.</p></div><button className="ctCodeLink" onClick={() => openEditor("museum")}>CSS: museum</button></div>
          <div className="ctCardsMuseum"><MuseumCard /><MuseumCard /></div>
        </section>

        <section className="ctSection">
          <div className="ctSectionHeader"><div><h2>Stående</h2><p>Stående visningskort viser to i bredden.</p></div><button className="ctCodeLink" onClick={() => openEditor("standing")}>CSS: stående</button></div>
          <div className="ctCardsStanding"><StandingCard /><StandingCard /></div>
        </section>

        <section className="ctCodeRegistry">
          <div className="ctCodeHeader"><h2>Kilde, bryter, felt, API og views</h2><button className="ctCodeLink" onClick={() => openEditor("registry")}>CSS: registry</button></div>
          <div className="ctRegistryGrid">
            {registry.map((group) => (
              <article className="ctRegistryCard" key={group.title}>
                <h3>{group.title}</h3>
                <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section className="ctSection">
          <div className="ctSectionHeader"><div><h2>Neste testlag</h2><p>Objektpresentasjon, relasjonspresentasjon, brukerkort, brytere og lenker under visningskortene.</p></div><button className="ctCodeLink" onClick={() => openEditor("layout")}>CSS: layout</button></div>
          <div className="ctPresentationGrid">
            <section><h2>Objektpresentasjon</h2><p>Full visning av hovedobjektet basert på source_key + object_group + object_id.</p><div className="ctLinkList"><a className="ctSmallLink" href="/objekt/norske_mynter/coin/1876">Objekt info</a><a className="ctSmallLink" href="/test/visning#object">Åpne lokal test</a></div></section>
            <section><h2>Relasjonspresentasjon</h2><p>Relasjonsnode for regent, år, kilde, person, motiv, variant, periode eller markedskontekst.</p><div className="ctLinkList"><a className="ctSmallLink" href="/relasjon/regent/frederik-vi">Frederik VI</a><a className="ctSmallLink" href="/relasjon/ar/1876">År 1876</a></div></section>
            <section><h2>Brukerkort / brytere</h2><p>Hjerte, stjerne, legg i samling, følg objekt, auksjon og nettbutikk skal senere kobles mot feature_keys.</p><div className="ctLinkList"><button className="ctSmallLink">collection.wishlist.toggle</button><button className="ctSmallLink">collection.favorite.toggle</button></div></section>
          </div>
        </section>
      </div>

      {contextMenu ? (
        <div className="ctContextMenu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
          <strong>{contextMenu.label}</strong>
          <a href={contextMenu.href}>Åpne link: {contextMenu.href}</a>
          <button type="button">Feature: {contextMenu.feature}</button>
          <button type="button">API: {contextMenu.api}</button>
          <button type="button">View: {contextMenu.view}</button>
        </div>
      ) : null}

      {editorTarget ? (
        <div className="ctEditorOverlay" onClick={() => setEditorTarget(null)}>
          <section className="ctEditorModal" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><p className="ctKicker">Live CSS editor · {editorTarget}</p><h2>Originalkode og editert kode</h2></div>
              <div className="ctModeSwitcher">
                <button className="ctPopupButton" onClick={() => setShowDiff(!showDiff)}>{showDiff ? "Vis editor" : "Vis original/editert"}</button>
                <button className="ctPopupButton" onClick={() => setSplitScreen(!splitScreen)}>Split</button>
                <button className="ctPopupButton" onClick={() => setEditedCss(ORIGINAL_CSS)}>Reset</button>
                <button className="ctPopupButton" onClick={() => setEditorTarget(null)}>Lukk</button>
              </div>
            </header>
            <div className="ctEditorBody" data-split={splitScreen ? "true" : "false"}>
              <div className="ctEditorPane">
                {showDiff ? (
                  <div className="ctEditorDiff">
                    <pre>{`ORIGINAL CSS\n\nAktuelle selektorer:\n${targetSelectors}\n\n${ORIGINAL_CSS}`}</pre>
                    <pre>{`EDITERT CSS\n\nStatus: ${changed ? "ENDRET" : "LIK ORIGINAL"}\n\n${editedCss}`}</pre>
                  </div>
                ) : (
                  <textarea className="ctEditorTextarea" value={editedCss} onChange={(event) => setEditedCss(event.target.value)} spellCheck={false} />
                )}
              </div>
              {splitScreen ? (
                <div className="ctEditorPane ctEditorPreview" data-test-skin={skin}>
                  <style>{editedCss}</style>
                  <div className="ctCardsHorizontal"><HorizontalCard /></div>
                  <div style={{ height: 10 }} />
                  <div className="ctCardsList"><ListCard /></div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
