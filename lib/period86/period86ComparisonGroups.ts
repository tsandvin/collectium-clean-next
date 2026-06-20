/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 Comparison Groups Model
 *
 * Definering / formål:
 * Felles modell for Periode 8.6 sammenligning. Filter/rullegardin viser grupper,
 * mens tidslinjen viser verdier/noder under valgt gruppe.
 *
 * Bruksområde:
 * Brukes av /api/period86/comparison-demo og /test/periodefilter.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/period86/comparison-demo
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.comparison.view
 * - period86.timeline.view
 * - period86.group_filter.view
 *
 * Berørte tabeller / views:
 * - Senere: ct_v_period_filter_options
 * - Senere: ct_v_period86_dynamic_field_resolved
 * - Senere: ct_sn_konger_relasjon
 * - Senere: ct_no_banknote_catalog
 * - Senere: ct_no_coin_catalog
 *
 * Dataretning:
 * Neon/API -> Next.js route -> React -> UI
 *
 * Versjon:
 * CT-PERIOD86-COMPARISON-GROUPS-0021
 */

export type Period86GroupKey =
  | "ruler_issuer"
  | "national_period"
  | "war_conflict"
  | "finance_economy"
  | "signature_person"
  | "object_issue_period"
  | "disease_society"
  | "motif_symbol"
  | "provenance_find";

export type Period86TimelineNode = {
  node_key: string;
  label_no: string;
  from_year: number | null;
  to_year: number | null;
  year_label: string;
  group_key: Period86GroupKey;
  group_label_no: string;
  node_type: string;
  description_no: string;
  relation_href: string | null;
  source_note_no: string;
  is_demo: boolean;
};

export type Period86GroupDefinition = {
  group_key: Period86GroupKey;
  label_no: string;
  description_no: string;
};

export type Period86ComparisonRow = {
  row_no: 1 | 2 | 3;
  row_label_no: string;
  selected_group_key: Period86GroupKey;
  selected_group_label_no: string;
  selected_group_description_no: string;
  timeline_nodes: Period86TimelineNode[];
};

export const PERIOD86_GROUPS: Period86GroupDefinition[] = [
  {
    group_key: "ruler_issuer",
    label_no: "Konge / regent + utgiver",
    description_no:
      "Viser konger, regenter, herskere, statsoverhoder og relevante utgivere som tidslinjenoder.",
  },
  {
    group_key: "national_period",
    label_no: "Nasjonal periode",
    description_no:
      "Viser hovedperioder som union, selvstendighet, okkupasjon og etterkrigstid.",
  },
  {
    group_key: "war_conflict",
    label_no: "Krig / konflikt",
    description_no:
      "Viser krig, konflikt, okkupasjon, politisk uro og militære hendelser.",
  },
  {
    group_key: "finance_economy",
    label_no: "Finans / økonomi",
    description_no:
      "Viser pengepolitikk, bankhistorie, inflasjon, kriser og finanshistorisk kontekst.",
  },
  {
    group_key: "signature_person",
    label_no: "Signatur / person",
    description_no:
      "Viser personer, signaturgrupper, utstedere, gravører, produsenter og relaterte aktører.",
  },
  {
    group_key: "object_issue_period",
    label_no: "Objekt / utgaveperiode",
    description_no:
      "Viser katalog-, objekt-, seddel-, mynt-, verdibrev- og utgaveperioder.",
  },
  {
    group_key: "disease_society",
    label_no: "Sykdom / samfunnskrise",
    description_no:
      "Viser samfunnskriser, sykdomsperioder, nødsår og relevante historiske kriseperioder.",
  },
  {
    group_key: "motif_symbol",
    label_no: "Motiv / symbol",
    description_no:
      "Viser motiv, symboler, riksvåpen, portretter, nasjonale tegn og ikonografi.",
  },
  {
    group_key: "provenance_find",
    label_no: "Proveniens / funn",
    description_no:
      "Viser funn, proveniensperioder, samlinger, eierskapshistorikk og historiske funnkontekster.",
  },
];

function groupLabel(groupKey: Period86GroupKey): string {
  return PERIOD86_GROUPS.find((group) => group.group_key === groupKey)?.label_no || groupKey;
}

function node(
  group_key: Period86GroupKey,
  node_key: string,
  label_no: string,
  from_year: number | null,
  to_year: number | null,
  node_type: string,
  description_no: string,
  relation_href: string | null = null
): Period86TimelineNode {
  const year_label =
    from_year === null
      ? "Udatert"
      : to_year === null
        ? `${from_year}–`
        : from_year === to_year
          ? `${from_year}`
          : `${from_year}–${to_year}`;

  return {
    node_key,
    label_no,
    from_year,
    to_year,
    year_label,
    group_key,
    group_label_no: groupLabel(group_key),
    node_type,
    description_no,
    relation_href,
    source_note_no: "Demo-data. Skal senere hentes fra Neon/API.",
    is_demo: true,
  };
}

/**
 * Demo-noder:
 * Dette er kontrollert eksempeldata som viser riktig modell:
 * grupper i filter, noder i tidslinje.
 */
export const PERIOD86_DEMO_NODES: Period86TimelineNode[] = [
  // Konge / regent + utgiver
  node(
    "ruler_issuer",
    "karl-xiv-johan",
    "Karl XIV Johan",
    1814,
    1844,
    "ruler",
    "Konge/regent-node. Vises når gruppen Konge / regent + utgiver er valgt.",
    "/relasjon/regent/karl-xiv-johan"
  ),
  node(
    "ruler_issuer",
    "oscar-i",
    "Oscar I",
    1844,
    1859,
    "ruler",
    "Konge/regent-node. Vises når gruppen Konge / regent + utgiver er valgt.",
    "/relasjon/regent/oscar-i"
  ),
  node(
    "ruler_issuer",
    "karl-iv",
    "Karl IV",
    1859,
    1872,
    "ruler",
    "Konge/regent-node. Vises når gruppen Konge / regent + utgiver er valgt.",
    "/relasjon/regent/karl-iv"
  ),
  node(
    "ruler_issuer",
    "oscar-ii",
    "Oscar II",
    1872,
    1905,
    "ruler",
    "Oscar II overlapper unionstid, bank-/pengebygging og Norges Bank utgave I.",
    "/relasjon/regent/oscar-ii"
  ),
  node(
    "ruler_issuer",
    "haakon-vii",
    "Haakon VII",
    1905,
    1957,
    "ruler",
    "Haakon VII overlapper selvstendig Norge, verdenskrig, okkupasjon og gjenreisning.",
    "/relasjon/regent/haakon-vii"
  ),
  node(
    "ruler_issuer",
    "olav-v",
    "Olav V",
    1957,
    1991,
    "ruler",
    "Olav V overlapper etterkrigstid, oljealder og moderne økonomisk utvikling.",
    "/relasjon/regent/olav-v"
  ),
  node(
    "ruler_issuer",
    "harald-v",
    "Harald V",
    1991,
    null,
    "ruler",
    "Harald V overlapper moderne Norge og nyere samler-/markedsperioder.",
    "/relasjon/regent/harald-v"
  ),

  // Nasjonal periode
  node(
    "national_period",
    "union-med-sverige",
    "Union med Sverige",
    1814,
    1905,
    "national_period",
    "Nasjonal periode. Overlapper Karl XIV Johan, Oscar I, Karl IV og Oscar II.",
    "/relasjon/periode/union-med-sverige"
  ),
  node(
    "national_period",
    "selvstendig-norge",
    "Selvstendig Norge",
    1905,
    1940,
    "national_period",
    "Nasjonal periode etter unionsoppløsningen.",
    "/relasjon/periode/selvstendig-norge"
  ),
  node(
    "national_period",
    "okkupasjon-og-krigstid",
    "Okkupasjon / krigstid",
    1940,
    1945,
    "national_period",
    "Nasjonal krigs- og okkupasjonsperiode.",
    "/relasjon/periode/okkupasjon-og-krigstid"
  ),
  node(
    "national_period",
    "etterkrigstiden",
    "Etterkrigstiden",
    1945,
    null,
    "national_period",
    "Nasjonal periode etter 1945.",
    "/relasjon/periode/etterkrigstiden"
  ),

  // Krig / konflikt
  node(
    "war_conflict",
    "unionsspenning",
    "Unionsspenning",
    1890,
    1905,
    "conflict_context",
    "Politisk konfliktkontekst fram mot unionsoppløsningen.",
    "/relasjon/hendelse/unionsspenning"
  ),
  node(
    "war_conflict",
    "forste-verdenskrig",
    "Første verdenskrig",
    1914,
    1918,
    "war",
    "Norge var nøytralt, men perioden påvirket handel, økonomi og samfunn.",
    "/relasjon/krig/forste-verdenskrig"
  ),
  node(
    "war_conflict",
    "andre-verdenskrig-okkupasjon",
    "Andre verdenskrig / okkupasjon",
    1940,
    1945,
    "war",
    "Krigs- og okkupasjonsperiode med sterk relasjon til sedler, verdier, utgivere og symboler.",
    "/relasjon/krig/andre-verdenskrig-okkupasjon"
  ),

  // Finans / økonomi
  node(
    "finance_economy",
    "bank-og-pengebygging",
    "Bank- og pengebygging",
    1816,
    1905,
    "finance_period",
    "Finans-/økonomiperiode som overlapper unionstiden og Norges Bank-relaterte utgivelser.",
    "/relasjon/finans/bank-og-pengebygging"
  ),
  node(
    "finance_economy",
    "mellomkrig-krise",
    "Mellomkrig / krise",
    1918,
    1939,
    "finance_period",
    "Økonomisk krise- og mellomkrigsperiode.",
    "/relasjon/finans/mellomkrig-krise"
  ),
  node(
    "finance_economy",
    "olje-og-inflasjon",
    "Olje- og inflasjon",
    1970,
    1990,
    "finance_period",
    "Finans- og markedsperiode knyttet til oljeøkonomi og inflasjon.",
    "/relasjon/finans/olje-og-inflasjon"
  ),

  // Signatur / person
  node(
    "signature_person",
    "norges-bank-utgiver",
    "Norges Bank",
    1816,
    null,
    "issuer",
    "Utgiver/person-/institusjonsrelasjon for norske sedler og pengehistorie.",
    "/relasjon/utgiver/norges-bank"
  ),
  node(
    "signature_person",
    "getz-wold-sagard",
    "Getz / Wold / Sagård",
    1966,
    1983,
    "signature_group",
    "Signaturgruppe knyttet til 5. utgave sedler.",
    "/relasjon/signatur/getz-wold-sagard"
  ),

  // Objekt / utgaveperiode
  node(
    "object_issue_period",
    "norges-bank-utgave-i",
    "Norges Bank utgave I",
    1877,
    1901,
    "issue_period",
    "Objekt-/utgaveperiode. Skal ligge i gruppen Objekt / utgaveperiode, ikke i Konge/regent.",
    "/relasjon/utgave/norges-bank-utgave-i"
  ),
  node(
    "object_issue_period",
    "norske-sedler-5-utgave",
    "Norske sedler / 5. utgave",
    1966,
    1983,
    "issue_period",
    "Seddel-/utgaveperiode som overlapper Olav V og moderne finanshistorie.",
    "/relasjon/utgave/norske-sedler-5-utgave"
  ),

  // Sykdom / samfunnskrise
  node(
    "disease_society",
    "spanskesyken",
    "Spanskesyken",
    1918,
    1920,
    "society_crisis",
    "Samfunnskrise som overlapper tidlig mellomkrigstid.",
    "/relasjon/samfunnskrise/spanskesyken"
  ),

  // Motiv / symbol
  node(
    "motif_symbol",
    "riksvapen",
    "Riksvåpen",
    1814,
    null,
    "motif",
    "Motiv-/symbolrelasjon. Kan knyttes til mynter, sedler, dokumenter og verdibrev.",
    "/relasjon/motiv/riksvapen"
  ),
  node(
    "motif_symbol",
    "kongeportrett",
    "Kongeportrett",
    1814,
    null,
    "motif",
    "Motivkategori for portretter av konge/regent/statsoverhode.",
    "/relasjon/motiv/kongeportrett"
  ),

  // Proveniens / funn
  node(
    "provenance_find",
    "privat-samling",
    "Privat samling",
    1800,
    null,
    "provenance",
    "Proveniensgruppe. Private detaljer skal være tilgangs- og samtykkestyrt.",
    "/relasjon/proveniens/privat-samling"
  ),
];

export function getGroupDefinition(groupKey: Period86GroupKey): Period86GroupDefinition {
  const group = PERIOD86_GROUPS.find((item) => item.group_key === groupKey);
  if (group) return group;

  return {
    group_key: "national_period",
    label_no: "Nasjonal periode",
    description_no: "Fallback-gruppe.",
  };
}

export function getTimelineNodesForGroup(groupKey: Period86GroupKey): Period86TimelineNode[] {
  return PERIOD86_DEMO_NODES.filter((nodeItem) => nodeItem.group_key === groupKey);
}

export function clampOpenEndYear(toYear: number | null, fallbackYear: number): number | null {
  return toYear === null ? fallbackYear : toYear;
}

export function nodeOverlapsRange(
  nodeItem: Period86TimelineNode,
  yearFrom: number,
  yearTo: number
): boolean {
  if (nodeItem.from_year === null) return true;
  const effectiveTo = nodeItem.to_year === null ? yearTo : nodeItem.to_year;
  return nodeItem.from_year <= yearTo && effectiveTo >= yearFrom;
}
