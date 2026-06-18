# Collectium periodefilter UI/UX 8.6 - compare timeline v21

Denne pakken bygger om `/test/periodefilter` slik at tidslinjen ikke fungerer som trestruktur, men som sammenligning av parallelle perioder.

## Endringer

- Dynamiske felt er flyttet ned under `Samler / Historie / Finans`.
- Over tidslinjen finnes zoom ut / zoom inn for perspektiv.
- Over tidslinjen finnes bryter for `Tidslinje popup`, slik at kun tidslinjen kan ligge øverst som eget lag.
- Tidslinjen viser 10-årsbånd med vekslende farger og årstall som `1910 | 1920 | 1930`.
- Under tidslinjen beholdes periodedynamiske felt for valgt segment og valgt tidslinjenode.

## Filer

- `components/period-filter-test/CollectiumPeriodFilterTest.tsx`
- `components/period-filter-test/CollectiumPeriodFilterTest.module.css`
- `docs/README-periodefilter-compare-timeline-v21.md`

## Kjøring

```powershell
npm run build
git add components/period-filter-test/CollectiumPeriodFilterTest.tsx components/period-filter-test/CollectiumPeriodFilterTest.module.css docs/README-periodefilter-compare-timeline-v21.md
git commit -m "Move period dynamic fields under segments"
git push origin main
```
