# Collectium Object Presentation Next.js package v4

## Routes

```txt
/objektpresentasjon
/objekt/[sourceKey]/[objectGroup]/[objectId]
```

## Files

```txt
app/objektpresentasjon/page.tsx
app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx
components/object/CollectiumObjectPresentationClient.tsx
components/object/CollectiumObjectPresentationClient.module.css
```

## v4 changes

- Removed the member-side demo strip when test access is switched away from `Gjest / demo`.
- Keeps `/objektpresentasjon` as public demo for new users, but makes Bronze/Silver/Gold/Platinum behave like logged-in/member presentation.
- Keeps real object route `/objekt/[sourceKey]/[objectGroup]/[objectId]` without dummy selector.
- Keeps the global app shell only; no internal sidebar or internal topbar.
- Fixes the tab/view buttons so they visibly change the page mode:
  - `IV I min samling`
  - `V Relasjon objekter`
  - `Objekt info`
  - `Museum`
  - `Kompakt`
  - `Finans`
- Adds active `data-view` behavior for object, museum, compact and finance mode.
- Adds relation-style timeline with active/current highlight.
- Timeline entries are links to relation routes:
  - `/relasjon/regent/...`
  - `/relasjon/periode/...`
  - `/relasjon/finans/...`
  - `/relasjon/publiseringsar/[year]`
- Timeline uses CSS variables from the active skin so bar colors follow the selected/global design theme.

## Later API wiring

```txt
GET /api/object/presentation
GET /api/object/relations
GET /api/object/market
GET /api/object/user-state
```

## Views

```txt
ct_v_object_presentation_resolved
ct_v_no_banknote_object_presentation
ct_v_object_relations_resolved
ct_v_object_market_resolved
ct_v_object_user_state_resolved
```
