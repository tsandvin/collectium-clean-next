# Collectium periodefilter UI/UX 8.6 - sammenlignende tidslinje

Denne pakken bygger om `/test/periodefilter` slik at periodefilteret tester sammenligning av parallelle perioder, ikke trestruktur.

## Endring

- Rad 1, Rad 2 og Rad 3 er sammenligningsakser.
- Konger/regenter, nasjonale perioder, krig/konflikt, finans/okonomi, signatur/person og objekt-/utgiverperiode vises samtidig.
- Tidslinjen har fargede 10-arsband og tydelige 10-arstikker, for eksempel 1910, 1920, 1930.
- Klikk pa en tidslinjeboks viser dynamisk innhold for Samler, Historie eller Finans.

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
