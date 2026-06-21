# Collectium object presentation v5 - global skin fix

## Formål
Denne pakken retter objektpresentasjon slik at siden arver Collectium globalt design/skinn fra `globals.css`, `themes.css`, `layout.tsx` og `CollectiumSkinProvider.tsx`.

## Viktig endring
Komponenten setter ikke lenger lokal `data-skin` og viser ikke egen lokal skinnvelger. Globalt designpanel/topbar bestemmer aktivt skinn via `html[data-skin]` / `html[data-theme]`.

## Filer
- `app/objektpresentasjon/page.tsx`
- `app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx`
- `components/object/CollectiumObjectPresentationClient.tsx`
- `components/object/CollectiumObjectPresentationClient.module.css`

## Routes
- `/objektpresentasjon` - offentlig demo for nye brukere. Dummyvelger med 10 objekter vises kun i gjest/demo-modus.
- `/objekt/[sourceKey]/[objectGroup]/[objectId]` - ekte objektpresentasjon. Ingen dummyvelger.

## Global design
CSS-modulen bruker disse globale tokenene:
- `--ct-app-bg`
- `--ct-page-bg`
- `--ct-panel`, `--ct-panel-solid`, `--ct-panel-soft`
- `--ct-border`, `--ct-border-strong`
- `--ct-text`, `--ct-muted`, `--ct-text-soft`
- `--ct-accent`, `--ct-accent-2`
- `--ct-font-body`, `--ct-font-head`, `--ct-font-ui`
- `--ct-radius-*`
- `--ct-shadow-*`
- `--ct-timeline-*`

## Tilgang
- Gjest/demo: viser presentasjonsmodus og 10 dummyobjekter.
- Free: kjerneinformasjon.
- Bronze+: samlerfelt og Min samling.
- Silver+: finans-/markedfelt.
- Delt lenke: begrenset objektvisning.

## API/views som siden er forberedt for
- `GET /api/object/presentation`
- `GET /api/object/relations`
- `GET /api/object/market`
- `GET /api/object/user-state`
- `ct_v_object_presentation_resolved`
- `ct_v_no_banknote_object_presentation`
- `ct_v_object_relations_resolved`
- `ct_v_object_market_resolved`
- `ct_v_object_user_state_resolved`
