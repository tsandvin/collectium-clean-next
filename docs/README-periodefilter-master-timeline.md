# Collectium periodfilter UI/UX 8.6 - Masterfilter og periodetidslinje

Denne pakken oppdaterer `/test/periodefilter` til en bedre testmodell:

1. Filter Master styrer først hvilken type filterlogikk som testes.
2. Rad 1 er anker: periode, regent, person, år, kilde, utgave, valør eller variant.
3. Rad 2 viser kontekst for valgt anker.
4. Rad 3 viser konkret undernode bare når data finnes.
5. Periodetidslinje viser valgt Rad 1 -> Rad 2 -> Rad 3.
6. Hver rad har søk og begrenset visning slik at år/publiseringsår ikke sprenger siden.

## Filer

- `components/period-filter-test/CollectiumPeriodFilterTest.tsx`
- `components/period-filter-test/CollectiumPeriodFilterTest.module.css`

## Installasjon

Kopier filene inn i samme stier i prosjektet.

## Test

```powershell
npm run build
git status
git add components/period-filter-test/CollectiumPeriodFilterTest.tsx components/period-filter-test/CollectiumPeriodFilterTest.module.css docs/README-periodefilter-master-timeline.md
git commit -m "Add period filter master timeline test"
git push origin main
```
