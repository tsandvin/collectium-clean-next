# Collectium periodefilter UI/UX 8.6 - sammenlignende tidslinje

Denne pakken bygger om `/test/periodefilter` slik at periodefilteret tester sammenligning av parallelle perioder, ikke trestruktur.

## Rad 2 og Rad 3 dropdown / brytere

- Rad 1, Rad 2 og Rad 3 er sammenligningsakser.
- Konger/regenter, nasjonale perioder, krig/konflikt, finans/okonomi, signatur/person og objekt-/utgiverperiode vises samtidig.

## Dynamiske innholdsfelt for brytere og segmenter

Tidslinjen skal ikke bare flytte blokker visuelt. Den skal også fylle de dynamiske innholdsområdene under tidslinjen basert på:

1. valgt Rad 1-bryter
2. valgt Rad 2-bryter
3. valgt Rad 3-bryter
4. valgt segment: Samler / Historie / Finans
5. valgt node/blokk i tidslinjen

Det skal finnes en felles datamodell for dynamisk innhold, slik at UI ikke hardkoder tekstene.

Forslag til type:

```ts
type Period86DynamicContent = {
  selected_segment: 'samler' | 'historie' | 'finans';

  row1_selection: {
    key: string;
    label_no: string;
    description_no?: string;
    selected_node_key?: string | null;
    selected_node_label_no?: string | null;
    selected_type_group_key?: string | null;
    selected_type_group_label_no?: string | null;
  };

  row2_selection: {
    key: string;
    label_no: string;
    description_no?: string;
    selected_node_key?: string | null;
    selected_node_label_no?: string | null;
  };

  row3_selection: {
    key: string;
    label_no: string;
    description_no?: string;
    selected_node_key?: string | null;
    selected_node_label_no?: string | null;
  };

  primary_card: {
    title_no: string;
    subtitle_no?: string;
    period_label_no?: string;
    year_range_label_no?: string;
    summary_no?: string;
    relation_href?: string | null;
    source?: string;
  };

  comparison_card: {
    title_no: string;
    summary_no?: string;
    row1_summary_no?: string;
    row2_summary_no?: string;
    row3_summary_no?: string;
    overlap_summary_no?: string;
    relation_href?: string | null;
  };

  collector_content?: {
    title_no?: string;
    collector_relevance_no?: string;
    object_relevance_no?: string;
    rarity_context_no?: string;
    collection_context_no?: string;
    related_object_count?: number;
    related_catalog_count?: number;
    relation_href?: string | null;
  };

  history_content?: {
    title_no?: string;
    history_summary_no?: string;
    historical_context_no?: string;
    ruler_context_no?: string;
    event_context_no?: string;
    period_context_no?: string;
    relation_href?: string | null;
  };

  finance_content?: {
    title_no?: string;
    finance_relevance_no?: string;
    economy_context_no?: string;
    market_context_no?: string;
    inflation_context_no?: string;
    value_context_no?: string;
    relation_href?: string | null;
  };

  timeline_explanation: {
    title_no: string;
    comparison_no?: string;
    overlap_no?: string;
    rule_no?: string;
    db_note_no?: string;
  };

  debug?: {
    source_api?: string;
    source_view?: string;
    selected_from_year?: number;
    selected_to_year?: number;
    node_count?: number;
  };
};
```

## Dynamisk område 1: Historisk sammenheng

Venstre dynamiske område under tidslinjen skal endre innhold etter valgt segment og brytere.

Standardtittel kan være:

* Samler: `Samlersammenheng`
* Historie: `Historisk sammenheng`
* Finans: `Finansiell sammenheng`

Dette området skal forklare hvorfor de valgte radene sammenlignes.

Eksempel når:

* Rad 1 = Herskere / statsoverhoder
* Rad 2 = Finans / økonomi
* Rad 3 = Signatur / person
* Segment = Historie

skal området kunne vise:

* Tittel: `Historisk sammenheng`
* Sammenligning: `Herskere / statsoverhoder sammenlignes med Finans / økonomi og Signatur / person.`
* Overlapp: `Konge, økonomisk periode og signatur/person kan virke samtidig, men er ulike relasjonstyper.`
* Hovedregel: `Radene skal ikke låse hverandre som trestruktur. De viser samtidige perioder på samme årsskala.`
* DB-mål: `Senere skal dette komme fra resolved timeline-view med relation_type, start_year, end_year, lane og relation_href.`

## Dynamisk område 2: Valgt tidslinjeinnhold

Høyre dynamiske område under tidslinjen skal vise valgt blokk/node.

Når bruker klikker på en tidslinjeblokk, skal dette området fylles med innhold fra valgt node.

For en Row 1-node skal det kunne vise:

* navn
* typegruppe
* fra–til år
* kort sammendrag
* historisk kontekst
* samlerrelevans
* finansrelevans hvis segment = Finans
* relation_href-lenke

Eksempel Row 1-node:

```ts
{
  title_no: 'Oscar II',
  subtitle_no: 'Konge / kongemakt',
  period_label_no: 'Unionen Sverige-Norge',
  year_range_label_no: '1872–1905',
  summary_no: 'Siste svensk-norske unionskonge.',
  relation_href: '/relasjon/regent/oscar-ii',
  source: 'ct_v_period86_row1_statsoverhode_nodes_v2'
}
```

For en objekt-/utgivernode skal det kunne vise:

* objekt/utgave-navn
* objektgruppe
* kilde
* utgaveperiode
* relasjon to regent/periode
* relation_href

Eksempel:

```ts
{
  title_no: 'Norske sedler / 5. utgave',
  subtitle_no: 'Objekt / utgiver',
  period_label_no: 'Utgaveperiode',
  year_range_label_no: '1966–1983',
  summary_no: 'Ligger under Olav V og moderne etterkrigstid.',
  relation_href: '/relasjon/utgave/5-utgave',
  source: 'resolved_timeline_view'
}
```

## Segmentregler: Samler / Historie / Finans

Segmentet skal styre hvilke innholdsfelt som prioriteres, ikke endre selve årsskalaen.

### Samler

Når `Samler` er valgt, skal dynamisk innhold prioritere:

* objekt-/utgiverperiode
* samlerobjekter
* relaterte katalogobjekter
* sjeldenhet
* samlingsrelevans
* relaterte mynter/sedler/verdipapirer
* hvilke objekter som ligger under valgt regent/periode
* object_count

Eksempeltekst:

`Denne perioden har samlerrelevans fordi objekter, utgaver, signaturer og regentperiode overlapper i samme tidsrom.`

### Historie

Når `Historie` er valgt, skal dynamisk innhold prioritere:

* historisk kontekst
* regent / statsoverhode
* krig / konflikt
* nasjonal periode
* styreform
* historiske hendelser
* person/signatur som historisk relasjon
* relation_href til regent, periode eller hendelse

Eksempeltekst:

`Dette viser hvilke historiske maktstrukturer, personer og hendelser som overlapper med objektperioden.`

### Finans

Når `Finans` er valgt, skal dynamisk innhold prioritere:

* finans/økonomi
* pengehistorie
* inflasjon
* kriser
* bank-/pengeutgivning
* markedskontekst
* verdiutvikling
* økonomisk periode
* finansrelevans for objekter

Eksempeltekst:

`Dette viser hvordan økonomisk periode, pengepolitikk og objektutgivelse overlapper i tid.`

## Brytervalg skal ha egne beskrivelser

Hver dropdown-verdi skal ha:

```ts
type Period86SwitchOption = {
  key: string;
  label_no: string;
  description_no: string;
  api_type?: string;
  row_key: 'row1' | 'row2' | 'row3';
  preferred_segment?: 'samler' | 'historie' | 'finans';
};
```

Eksempler Rad 1:

```ts
[
  {
    key: 'herskere_statsoverhoder',
    label_no: 'Herskere / statsoverhoder',
    description_no: 'Vis hele maktstrukturen: konger, regenter, unioner, styreform, okkupasjon og kirkelig makt.',
    api_type: 'all',
    row_key: 'row1',
    preferred_segment: 'historie'
  },
  {
    key: 'konge_kongemakt',
    label_no: 'Konge / kongemakt',
    description_no: 'Vis konger og kongemakt på tidslinjen.',
    api_type: 'konge',
    row_key: 'row1',
    preferred_segment: 'historie'
  },
  {
    key: 'regent_fungerende_statsmakt',
    label_no: 'Regent / fungerende statsmakt',
    description_no: 'Vis regenter og fungerende statsmakt.',
    api_type: 'regent',
    row_key: 'row1',
    preferred_segment: 'historie'
  },
  {
    key: 'union',
    label_no: 'Union',
    description_no: 'Vis unioner og personalunioner som maktstruktur.',
    api_type: 'union',
    row_key: 'row1',
    preferred_segment: 'historie'
  },
  {
    key: 'styreform_maktstruktur',
    label_no: 'Styreform / maktstruktur',
    description_no: 'Vis riksråd, overgangsstyre, selvstendig stat og andre maktstrukturer.',
    api_type: 'styreform',
    row_key: 'row1',
    preferred_segment: 'historie'
  },
  {
    key: 'lokal_hersker_smakonge',
    label_no: 'Lokal hersker / småkonge',
    description_no: 'Vis lokale herskere, jarler og småkonger.',
    api_type: 'lokal_hersker',
    row_key: 'row1',
    preferred_segment: 'historie'
  },
  {
    key: 'okkuperende_makt',
    label_no: 'Okkupasjonsmakt',
    description_no: 'Vis okkupasjonsmakt og okkupasjonsadministrasjon.',
    api_type: 'okkuperende_makt',
    row_key: 'row1',
    preferred_segment: 'historie'
  },
  {
    key: 'kirkelig_makt',
    label_no: 'Kirkelig makt',
    description_no: 'Vis kirkelig maktstruktur og kristen institusjonell makt.',
    api_type: 'kirkelig_makt',
    row_key: 'row1',
    preferred_segment: 'historie'
  }
]
```

Eksempler Rad 2:

```ts
[
  {
    key: 'finans_okonomi',
    label_no: 'Finans / økonomi',
    description_no: 'Vis pengepolitikk, inflasjon, kriser og finanshistorisk kontekst.',
    api_type: 'finans-okonomi',
    row_key: 'row2',
    preferred_segment: 'finans'
  },
  {
    key: 'nasjonale_perioder',
    label_no: 'Nasjonale perioder',
    description_no: 'Vis nasjonale hovedperioder og overordnede historiske faser.',
    api_type: 'nasjonale-perioder',
    row_key: 'row2',
    preferred_segment: 'historie'
  },
  {
    key: 'krig_konflikt',
    label_no: 'Krig / konflikt',
    description_no: 'Vis kriger, konflikter og okkupasjonsperioder.',
    api_type: 'krig-konflikt',
    row_key: 'row2',
    preferred_segment: 'historie'
  },
  {
    key: 'sykdom_krise',
    label_no: 'Sykdom / krise',
    description_no: 'Vis sykdom, samfunnskrise og demografisk/historisk påvirkning.',
    api_type: 'sykdom-krise',
    row_key: 'row2',
    preferred_segment: 'historie'
  }
]
```

Eksempler Rad 3:

```ts
[
  {
    key: 'signatur_person',
    label_no: 'Signatur / person',
    description_no: 'Vis personer, signaturer og administrativ/personhistorisk relasjon.',
    api_type: 'signatur-person',
    row_key: 'row3',
    preferred_segment: 'historie'
  },
  {
    key: 'objekt_utgiver',
    label_no: 'Objekt / utgiver',
    description_no: 'Vis objektperiode, utgiverperiode og katalogrelasjon.',
    api_type: 'objekt-utgiver',
    row_key: 'row3',
    preferred_segment: 'samler'
  },
  {
    key: 'motiv',
    label_no: 'Motiv',
    description_no: 'Vis motivhistorie og motivrelasjoner.',
    api_type: 'motiv',
    row_key: 'row3',
    preferred_segment: 'historie'
  },
  {
    key: 'utgave_serie',
    label_no: 'Utgave / serie',
    description_no: 'Vis utgave, serie og produksjonsperiode.',
    api_type: 'utgave-serie',
    row_key: 'row3',
    preferred_segment: 'samler'
  }
]
```

## Klikk og valgt node

Når bruker klikker på en tidslinjeblokk:

* sett `selectedNode`
* sett `selectedLane`
* sett `selectedSegment`
* oppdater dynamisk område 2
* oppdater dynamisk område 1 med sammenheng mellom valgte rader

Hvis ingen blokk er valgt, skal dynamisk område 2 vise en oppsummering av valgt kombinasjon av brytere.

## Fallback for dynamisk innhold

Hvis API ikke returnerer ferdig dynamisk tekst, skal frontend bygge nøktern fallback fra nodefeltene:

* `label_no`
* `type_group_label_no`
* `start_year`
* `end_year`
* `period_label_no`
* `relation_href`
* `object_count`

Fallback skal være faktabasert og kort. Ikke finn opp historisk innhold i frontend.

- Tidslinjen har fargede 10-arsband og tydelige 10-arstikker, for eksempel 1910, 1920, 1930.
- Klikk pa en tidslinjeboks viser dynamisk innhold for Samler, Historie eller Finans.

Ekstra krav:
Dynamisk område 1 og Dynamisk område 2 skal ikke være statisk tekst. De skal reagere på brytervalg, segmentvalg og valgt tidslinjeblokk. Samler, Historie og Finans skal prioritere ulike innholdsfelt, men de skal aldri endre den felles årsskalaen.

## Viktig regel

Periodefilteret skal vise overlapp og kontekst. Det skal ikke bare vise parent/child.

Eksempel:

- Haakon VII kan vaere valgt regent/utgiverkontekst.
- Andre verdenskrig overlapper samme periode.
- Krigsokonomi overlapper samme periode.
- C. J. Hambro/signatur overlapper samme periode.
- Objekt-/utgaveperiode kan ligge delvis inne i alle disse.

## Filer

- `components/period-filter-test/CollectiumPeriodFilterTest.tsx`
- `components/period-filter-test/CollectiumPeriodFilterTest.module.css`
- `docs/README-periodefilter-compare-timeline.md`

## Neste DB-steg

Opprett senere en resolved view/API som returnerer tidslinjeelementer fra Neon:

- lane_key
- relation_type
- relation_slug
- display_name_no
- start_year
- end_year
- relation_href
- collector_summary_no
- history_summary_no
- finance_summary_no
- source_key
- object_group
- object_count
