# Collectium period filter + view cards test (Next.js / React)

This package adds a controlled test page for the locked Collectium period filter and catalogue view-card layout.

## Files

```txt
app/test/periodefilter/page.tsx
app/api/test/period-catalog/route.ts
components/period-filter-test/CollectiumPeriodFilterTest.tsx
components/period-filter-test/CollectiumPeriodFilterTest.module.css
lib/collectium-period-card-types.ts
```

## Route

```txt
/test/periodefilter
```

## API

```txt
GET /api/test/period-catalog?sourceKey=norske_sedler&objectGroup=banknote&yearFrom=1814&yearTo=2024&segment=historie&view=horisontal
```

## Database

The route reads from existing resolved views when `DATABASE_URL` is available:

- `ct_v_object_presentation_resolved`
- `ct_v_no_banknote_object_presentation`
- `ct_v_object_relations_resolved`
- `ct_v_object_market_resolved`
- `ct_v_object_user_state_resolved`

The API returns clear fallback/status values when market, image or user-state data is missing. It does not write to DB.

## Dependency

The API route uses `pg`.

```bash
npm install pg
npm install -D @types/pg
```

If your project already has a DB helper, you may replace the small `Pool` block in `route.ts` with the existing helper.

## Install

Copy the folders into the Next.js project root, then run:

```bash
npm run build
```

Open:

```txt
/test/periodefilter
```
