/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 Result Demo API v2 - Ruler Timeline Fix
 *
 * Definering / formål:
 * Test-API for Periode 8.6-resultatmodell. Returnerer forklarte resultater
 * for Master, tidstabell, Rad 1, Rad 2, Rad 3 og Rad 4.
 *
 * Viktig v2-korrigering:
 * Når Rad 1 = Konge/hersker skal Rad 1-tidslinjen vise konkrete konger,
 * regenter, herskere eller statsoverhoder. Den skal ikke vise generelle
 * historiske hovedperioder eller katalog-/utgaveperioder.
 *
 * Bruksområde:
 * Brukes av /test/period86-result.
 *
 * Berørte sider / routes:
 * - /test/period86-result
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.result.demo.view
 * - period86.timeline.view
 * - period86.dynamic_field.view
 *
 * Berørte API-ruter:
 * - GET /api/period86/result-demo
 *
 * Berørte tabeller / views:
 * - Senere: ct_v_period_filter_options
 * - Senere: ct_v_period86_dynamic_field_resolved
 * - Senere: ct_sn_konger_relasjon / relevant ruler relation view
 *
 * Dataretning:
 * Neon/API -> Next.js route -> React -> UI
 *
 * Logging:
 * log_category: period86
 * log_action: result_demo_ruler_fix
 *
 * Versjon:
 * CT-PERIOD86-RESULT-DEMO-0002
 */

import { NextResponse } from "next/server";

type MatchType =
  | "direct_period_match"
  | "no_direct_match"
  | "context_match"
  | "catalog_context"
  | "relation_detail"
  | "inactive_timeline_node";

type TimelineLane = "master" | "row1" | "row2" | "row3" | "row4";

type TimelineNode = {
  key: string;
  label_no: string;
  from_year: number | null;
  to_year: number | null;
  year_label: string;
  lane: TimelineLane;
  node_type: string;
  group_key: string;
  is_active: boolean;
  match_type: MatchType;
  explanation_no: string;
};

function coversYear(node: TimelineNode, year: number) {
  if (typeof node.from_year !== "number") return false;
  const toYear = typeof node.to_year === "number" ? node.to_year : year;
  return node.from_year <= year && year <= toYear;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const master = url.searchParams.get("master") || "Norge";
  const year = Number(url.searchParams.get("year") || "1900");
  const row1 = url.searchParams.get("row1") || "Konge/hersker";
  const row2 = url.searchParams.get("row2") || "Krig";
  const row3 = url.searchParams.get("row3") || "Historisk";
  const row4 = url.searchParams.get("row4") || "Motiv";

  /**
   * Rad 1 v2:
   * Dette er en kontrollert ruler-linje.
   * Generelle perioder som Høymiddelalder, Dansketiden, Mellomkrigstiden
   * og Norges Bank-utgave skal ikke inn her når Rad 1 = Konge/hersker.
   */
  const rulerTimeline: TimelineNode[] = [
    {
      key: "karl-johan",
      label_no: "Karl Johan",
      from_year: 1818,
      to_year: 1844,
      year_label: "1818–1844",
      lane: "row1",
      node_type: "ruler",
      group_key: "konge_hersker",
      is_active: false,
      match_type: "inactive_timeline_node",
      explanation_no: "Konge/hersker-node. Vises i Rad 1 fordi gruppen er Konge/hersker.",
    },
    {
      key: "oscar-i",
      label_no: "Oscar I",
      from_year: 1844,
      to_year: 1859,
      year_label: "1844–1859",
      lane: "row1",
      node_type: "ruler",
      group_key: "konge_hersker",
      is_active: false,
      match_type: "inactive_timeline_node",
      explanation_no: "Konge/hersker-node. Vises i Rad 1 fordi gruppen er Konge/hersker.",
    },
    {
      key: "karl-iv",
      label_no: "Karl IV",
      from_year: 1859,
      to_year: 1872,
      year_label: "1859–1872",
      lane: "row1",
      node_type: "ruler",
      group_key: "konge_hersker",
      is_active: false,
      match_type: "inactive_timeline_node",
      explanation_no: "Konge/hersker-node. Vises i Rad 1 fordi gruppen er Konge/hersker.",
    },
    {
      key: "oscar-ii",
      label_no: "Oscar II",
      from_year: 1872,
      to_year: 1905,
      year_label: "1872–1905",
      lane: "row1",
      node_type: "ruler",
      group_key: "konge_hersker",
      is_active: true,
      match_type: "direct_period_match",
      explanation_no:
        "Rad 1 = Konge/hersker. Oscar II dekker valgt år 1900 og er aktivt treff.",
    },
    {
      key: "haakon-vii",
      label_no: "Haakon VII",
      from_year: 1905,
      to_year: 1957,
      year_label: "1905–1957",
      lane: "row1",
      node_type: "ruler",
      group_key: "konge_hersker",
      is_active: false,
      match_type: "inactive_timeline_node",
      explanation_no: "Konge/hersker-node. Vises i Rad 1 fordi gruppen er Konge/hersker.",
    },
    {
      key: "olav-v",
      label_no: "Olav V",
      from_year: 1957,
      to_year: 1991,
      year_label: "1957–1991",
      lane: "row1",
      node_type: "ruler",
      group_key: "konge_hersker",
      is_active: false,
      match_type: "inactive_timeline_node",
      explanation_no: "Konge/hersker-node. Vises i Rad 1 fordi gruppen er Konge/hersker.",
    },
    {
      key: "harald-v",
      label_no: "Harald V",
      from_year: 1991,
      to_year: null,
      year_label: "1991–",
      lane: "row1",
      node_type: "ruler",
      group_key: "konge_hersker",
      is_active: false,
      match_type: "inactive_timeline_node",
      explanation_no: "Konge/hersker-node. Vises i Rad 1 fordi gruppen er Konge/hersker.",
    },
  ];

  const activeRuler = rulerTimeline.find((node) => coversYear(node, year)) || null;

  const timeline: TimelineNode[] = [
    {
      key: "norway",
      label_no: "Norge",
      from_year: null,
      to_year: null,
      year_label: "Master",
      lane: "master",
      node_type: "master",
      group_key: "country",
      is_active: true,
      match_type: "context_match",
      explanation_no:
        "Master avgrenser resultatet til Norge og norsk/norge-relatert katalog, periode, konge, krig, motiv og relasjonsdata.",
    },
    ...rulerTimeline,
    {
      key: "krig-1900",
      label_no: "Krig",
      from_year: year,
      to_year: year,
      year_label: String(year),
      lane: "row2",
      node_type: "historical_context_group",
      group_key: "krig",
      is_active: false,
      match_type: "no_direct_match",
      explanation_no:
        "Rad 2 = Krig. Ingen direkte norsk krigsperiode er registrert for nøyaktig år 1900 i denne demonstrasjonen.",
    },
    {
      key: "unionsspenning-fram-mot-1905",
      label_no: "Unionstid / politisk spenning fram mot 1905",
      from_year: 1890,
      to_year: 1905,
      year_label: "ca. 1890–1905",
      lane: "row2",
      node_type: "historical_context",
      group_key: "krig_kontekst",
      is_active: true,
      match_type: "context_match",
      explanation_no:
        "Siden Rad 2 = Krig ikke har direkte treff i 1900, kan systemet vise nærliggende konflikt- og spenningskontekst fram mot unionsoppløsningen.",
    },
    {
      key: "historisk-katalogkobling",
      label_no: "Historisk katalogkobling",
      from_year: 1814,
      to_year: 1905,
      year_label: "1814–1905",
      lane: "row3",
      node_type: "catalog_context",
      group_key: "historisk",
      is_active: true,
      match_type: "catalog_context",
      explanation_no:
        "Rad 3 = Historisk. Viser historiske katalogkoblinger for Norge rundt 1900, særlig unionstid, Oscar II, norske sedler, norske mynter og objekter med publiseringsår eller objektår rundt 1900.",
    },
    {
      key: "motiv",
      label_no: "Motiv",
      from_year: 1900,
      to_year: 1900,
      year_label: "1900",
      lane: "row4",
      node_type: "relation_detail",
      group_key: "motiv",
      is_active: true,
      match_type: "relation_detail",
      explanation_no:
        "Rad 4 = Motiv. Viser motiv som finnes på objekter eller relasjoner innen valgt ramme. Dersom motivdata mangler i Neon/API, skal UI vise 'Motivdata mangler'.",
    },
  ];

  const response = {
    ok: true,
    demo: true,
    version: "v2-ruler-timeline-fix",
    collectium_standard: "period86",
    query: {
      master,
      year,
      row1,
      row2,
      row3,
      row4,
    },
    rule: {
      timeline_year_rule:
        "Alle perioder på tidslinjen må vises og beregnes med fra-til-år. Valgt år markerer aktiv node, men bestemmer ikke alene hvilke noder som vises.",
      row1_ruler_rule:
        "Når Rad 1 = Konge/hersker skal Rad 1 bare vise konkrete konger, regenter, herskere eller statsoverhoder. Generelle historiske perioder og katalogperioder skal ikke vises i denne gruppen.",
      no_fake_match_rule:
        "Hvis en rad ikke har direkte treff, skal UI vise 'ingen direkte treff' og eventuelt nær kontekst, ikke opprette falske treff.",
    },
    result: {
      title_no: "Periode 8.6 resultat · Konge/hersker rettet",
      summary_no:
        "Norge + 1900 + Konge/hersker viser nå en Rad 1-tidslinje med konger/herskere. Oscar II 1872–1905 markeres som aktivt treff. Generelle perioder som Mellomkrigstiden, Dansketiden og Norges Bank-utgave I er ikke Rad 1-treff under Konge/hersker.",
      master: {
        label_no: "Norge",
        explanation_no:
          "Master avgrenser resultatet til Norge. Alle rader og felt skal tolkes innen norsk/norge-relatert periode-, katalog- og relasjonsmodell.",
      },
      selected_year: {
        value: year,
        explanation_no:
          "År 1900 plasseres som vertikal markør i tidstabellen. Året brukes til å markere aktiv konge/hersker, ikke til å hente alle historiske perioder inn i Rad 1.",
      },
      row1: {
        label_no: "Rad 1 · Konge/hersker",
        selected_group_no: row1,
        result_label_no: activeRuler?.label_no || "Ingen aktiv hersker funnet",
        year_label: activeRuler?.year_label || String(year),
        match_type: activeRuler ? "direct_period_match" : "no_direct_match",
        explanation_no:
          activeRuler
            ? `${activeRuler.label_no} er direkte treff fordi herskerperioden dekker år ${year}. Rad 1 viser samtidig alle konger/herskere i tidslinjen.`
            : `Ingen konge/hersker dekker valgt år ${year} i demo-data.`,
        fields: [
          { label_no: "Valgt Rad 1-gruppe", value_no: "Konge/hersker" },
          { label_no: "Aktivt treff", value_no: activeRuler?.label_no || "Ingen" },
          { label_no: "Tidsrom", value_no: activeRuler?.year_label || "Mangler" },
          { label_no: "Visningsregel", value_no: "Vis alle konger/herskere, marker den som dekker valgt år" },
          { label_no: "Skal ikke vises her", value_no: "Høymiddelalder, Reformasjonen, Norges Bank utgave I, Mellomkrigstiden" },
        ],
      },
      row2: {
        label_no: "Rad 2 · Krig",
        selected_group_no: row2,
        result_label_no: "Ingen direkte krigstreff",
        year_label: "1900",
        match_type: "no_direct_match",
        explanation_no:
          "Ingen direkte norsk krigsperiode er registrert for nøyaktig år 1900. UI skal vise dette ærlig og tilby nærliggende historisk kontekst.",
        fields: [
          { label_no: "Direkte treff", value_no: "Ingen registrert" },
          { label_no: "Nær kontekst", value_no: "Unionstid / politisk spenning fram mot 1905" },
          { label_no: "Visningsregel", value_no: "Ikke opprett falsk krigsperiode" },
        ],
      },
      row3: {
        label_no: "Rad 3 · Historisk",
        selected_group_no: row3,
        result_label_no: "Historisk katalogkobling",
        year_label: "1814–1905 / rundt 1900",
        match_type: "catalog_context",
        explanation_no:
          "Rad 3 binder valgt historisk ramme til katalogen. Katalog-/utgaveperioder som Norges Bank utgave I skal ligge her, ikke i Rad 1 Konge/hersker.",
        fields: [
          { label_no: "Historisk ramme", value_no: "Unionstid" },
          { label_no: "Kongekobling", value_no: activeRuler?.label_no || "Oscar II" },
          { label_no: "Katalogkobling", value_no: "Norske sedler / norske mynter der kildene finnes" },
          { label_no: "Objektgrunnlag", value_no: "Objekter med år, publiseringsår eller relasjon rundt 1900" },
          { label_no: "Flyttet hit", value_no: "Norges Bank utgave I hører hjemme i Rad 3 som katalog-/utgaveperiode" },
        ],
      },
      row4: {
        label_no: "Rad 4 · Motiv",
        selected_group_no: row4,
        result_label_no: "Motiv som relasjonsdetalj",
        year_label: "1900 / relevant katalogramme",
        match_type: "relation_detail",
        explanation_no:
          "Rad 4 viser motiv som detaljfelt innen valgt ramme. Hvis motivdata mangler, skal UI vise manglende data og peke til nærmeste relasjon.",
        fields: [
          { label_no: "Motivtype", value_no: "Riksvåpen / kongeportrett / nasjonale symboler hvis registrert" },
          { label_no: "Relasjonsregel", value_no: "Motiv skal kunne åpnes som relasjon når href finnes" },
          { label_no: "Fallback", value_no: "Motivdata mangler hvis Neon/API ikke har feltet" },
        ],
      },
    },
    timeline,
    answer_for_chatgpt: {
      status: "OK",
      message:
        "Periode 8.6-resultatdemo er oppdatert. Rad 1 = Konge/hersker viser nå alle konger/herskere på tidslinjen og markerer Oscar II som treff for 1900.",
      correction:
        "Generelle perioder og katalogperioder skal ikke vises i Rad 1 når gruppen er Konge/hersker.",
      next_step:
        "Flytt samme Rad 1-filterlogikk inn i ekte /test/periodefilter og /api/test/period-timeline når demoen er godkjent.",
    },
  };

  return NextResponse.json(response);
}
