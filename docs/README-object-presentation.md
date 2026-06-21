# Collectium Object Presentation Next.js package

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

## Purpose

- `/objektpresentasjon` is public demo/presentation mode with 10 dummy objects at the top.
- `/objekt/[sourceKey]/[objectGroup]/[objectId]` is the real object presentation route.
- The real route is prepared for login requirement and shared-link limited access.

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


## v3 shell-fix

Denne versjonen fjerner lokal/nestet sidebar og lokal/nestet toppmeny fra objektpresentasjon. Siden skal ligge inne i eksisterende globale Collectium app-shell, slik at det bare finnes én sidebar og én toppbar på `app.collectium.no`. Skinbar og medlems-/demo-kontroller ligger fortsatt inne i selve objektpresentasjonen.
