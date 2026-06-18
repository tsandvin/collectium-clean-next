# Collectium period filter UI/UX 8.6 update v2

Denne pakken oppdaterer `/test/periodefilter` fra en trygg, men for smal tre-radsmodell til en ankerbasert modell.

## Viktigste endring

Rad 1 er ikke lenger låst til `Nasjonal hovedperiode`.

Rad 1 er nå **Anker** og kan vise:

- Periode
- Konge / regent
- Person / signatur
- Ar / publiseringsar
- Kilde
- Utgave
- Valor
- Variant

Dette gjør at brukeren kan starte filteret med for eksempel `Haakon VII`, `Olav V`, `Oscar II`, `1917`, `Norske sedler`, `1 krone`, en utgave eller en variant.

## Ny radlogikk

```text
Rad 1 = Anker
Rad 2 = Kontekst for valgt anker
Rad 3 = Konkret undernode bare nar den finnes
```

Dersom Rad 3 ikke har konkrete valg, skal den ikke late som den har verdi. Da skal informasjonen brukes i:

```text
Dynamisk omrade 1 = Bio / definisjon
Dynamisk omrade 2 = Samler / Historie / Finans
```

## API-endring

`GET /api/filter/period/options` returnerer nå både:

- `rows` fra `ct_v_period_filter_options`
- `relationNodes` fra `ct_v_object_relations_resolved`
- `relationSummary` fra `ct_v_object_relations_resolved`

Relation nodes hentes for:

```text
ar
publiseringsar
regent
person
kilde
utgave
valor
variant
```

## Filer

```text
app/api/filter/period/options/route.ts
app/test/periodefilter/page.tsx
components/period-filter-test/CollectiumPeriodFilterTest.tsx
components/period-filter-test/CollectiumPeriodFilterTest.module.css
```

## Installering

Kopier filene inn i prosjektroten eller kjør PowerShell-scriptet:

```powershell
.\install-periodfilter-ui86.ps1
npm run build
git status
```

## Commit

```powershell
git add app/api/filter/period/options/route.ts app/test/periodefilter/page.tsx components/period-filter-test/CollectiumPeriodFilterTest.tsx components/period-filter-test/CollectiumPeriodFilterTest.module.css docs/README-periodefilter-ui86-update.md
git commit -m "Update period filter test with relation anchor model"
git push origin main
```
