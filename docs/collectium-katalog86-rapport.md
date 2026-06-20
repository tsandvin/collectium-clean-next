# Collectium Katalog UI/UX 8.6 — implementeringsrapport

## Status

Pakke laget som kontrollert Next.js/React-tillegg for `/katalog`.

## Filer

```text
app/katalog/page.tsx
components/catalog/CollectiumCatalog86Client.tsx
components/catalog/CollectiumCatalog86Client.module.css
components/catalog/collectium-catalog86-types.ts
docs/collectium-katalog86-rapport.md
```

## Hva siden gjør

- Bruker eksisterende global sidemeny, toppmeny, AppShell, skin og skjerminnstillinger.
- Lager ikke egen topbar, sidemeny, body, global bakgrunn eller skinmotor.
- Har filter over resultatene.
- Har Masterfilter.
- Har forhandlerfilter med auksjon/nettbutikk-tilknytning.
- Har enkel to-raders periodefilter:
  - Rad 1: Statsoverhode / maktstruktur.
  - Rad 2: Objektperiode / utgave / relasjon.
- Har avansert filter på samleobjektspesifikasjoner.
- Har segmenter: Samler, Historie, Finans.
- Har visninger: Horisontal, Stående, Liste, Museum.
- Bruker `data-view` og `data-segment`.
- Viser katalogkort/visningskort med objektinfo, relasjoner, marked, auksjon, nettbutikk og samlingshandlinger.
- Lenker til objektpresentasjon med `/objekt/[sourceKey]/[objectGroup]/[objectId]`.
- Lenker relasjonschips til `/relasjon/[relationType]/[relationKey]`.
- Viser `Mangler markedsverdi` når verdi er `0`, `0.00`, tom eller mangler.

## API-ruter siden forventer

```text
GET /api/catalog/search
GET /api/catalog/filters
GET /api/period86/row1/nodes
GET /api/period86/row2/nodes
```

Komponenten er robust mot flere responsformer:

```text
objects[]
rows[]
data[]
data.objects[]
data.rows[]
```

## Feature keys

```text
catalog.view
catalog.search
catalog.filters
catalog.object.open
catalog.market
catalog.history
catalog.collection
catalog.favorite
catalog.wishlist
collection.wishlist.toggle
collection.favorite.toggle
collection.item.add
```

## Viktig teknisk avgrensning

Denne pakken endrer ikke eksisterende kjernefiler:

```text
app/layout.tsx
app/page.tsx
components/layout/*
app/globals.css
lib/db/*
lib/auth/*
lib/access/*
```

## Svar til ChatGPT

Status: KLAR SOM PAKKE / IKKE TESTET I LOKALT PROSJEKT

Hva er lagt til:
- Ny `/katalog` side.
- Ny katalogklient.
- Ny modul-CSS.
- Nye katalogtyper.
- Rapport.

Hva er ikke rørt:
- Sidemeny.
- Toppmeny.
- Global layout.
- Global skinmotor.
- Database.
- API-ruter.

Mangler:
- Må kopieres inn i prosjektet.
- Må testes mot faktisk `/api/catalog/search` respons.
- Hvis eksisterende `/period-timeline` har egne helper-komponenter, kan visningskortdelen senere kobles direkte mot disse.

Neste anbefalte handling:
- Kopier filene inn i prosjektet.
- Kjør `npm run build`.
- Åpne `/katalog`.
- Test filter mot `/api/catalog/search`.
