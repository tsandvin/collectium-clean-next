# Collectium objektpresentasjon v6 - global design og tidslinjeskala

## Endringsformål
Denne pakken bygger videre på v5 og retter objektpresentasjonen slik at siden arver global Collectium-design fra `globals.css`, `themes.css` og `CollectiumSkinProvider`.

## Hovedendringer

- Lokal skinbar og lokal skin-state er ikke innført igjen.
- Siden bruker globale `--ct-*` tokens for panel, tekst, bakgrunn, border, shadow, accent og timeline-farger.
- Informasjonsfelt, bokser og låste felt har fått svak skin-relatert bakgrunn, slik at de skiller seg fra sidebakgrunnen.
- Tidslinjen bruker samme årsskala på alle rader.
- `+` og `-` endrer tidshorisont rundt objektets publiseringsår.
- Timeline barer beregnes fra `startYear` og `endYear`, ikke faste prosenter.
- Ikke-gjeldende perioder er svake, gjeldende objektperiode er sterkere og lysere.
- Klikk på år, regent, historisk periode, finansperiode og objekt-/utgiverperiode går til relasjonsrute.

## Berørte filer

- `app/objektpresentasjon/page.tsx`
- `app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx`
- `components/object/CollectiumObjectPresentationClient.tsx`
- `components/object/CollectiumObjectPresentationClient.module.css`
- `docs/README-object-presentation.md`

## Designkilde

Globalt design styres av eksisterende Collectium shell og globale CSS-variabler. Objektpresentasjon skal ikke legge egen sidebar, toppbar eller egen skin-state.

## Ruter

- `/objektpresentasjon` offentlig demo/presentasjon
- `/objekt/[sourceKey]/[objectGroup]/[objectId]` objektpresentasjon for valgt objekt

## API / view-forberedelse

- `GET /api/object/presentation`
- `GET /api/object/relations`
- `GET /api/object/market`
- `GET /api/object/user-state`
- `ct_v_object_presentation_resolved`
- `ct_v_no_banknote_object_presentation`
- `ct_v_object_relations_resolved`
- `ct_v_object_market_resolved`
- `ct_v_object_user_state_resolved`

## v7 - Egne spesifikasjoner og bildevisning

Endret etter krav:

- `IV I min samling` har nå redigerbare egne spesifikasjoner delt i undergrupper:
  - Kjøp: kjøpeår, kjøpsdato, pris, forhandler, auksjon og merknad fra selger.
  - Kvalitet og tilstand: egen kvalitet, gradering, tilstand, tilstandsmerknad og privat/samtykkestyrt proveniens.
  - Bilder: maks 10 egne bilder i lokal forhåndsvisning.
- Endringer bokføres i en synlig endringslogg i UI. Senere skal dette kobles til et skrive-API og loggtabell, ikke direkte til katalogsannheten.
- Bildeområdet øverst har bryter for `Collectium` og `Egne` ved bildefanene Forside, Bakside, Gjennomlysning, Variant og Detalj.
- Klikk på hovedbilde åpner fullskjerm bildevisning med mørk transparent overlay, bildeområde ca. 80% av skjermhøyde, knapper og tekstbeskrivelse under.
- Egne bilder vises også i hovedbildefeltet når bilde-bryteren står på `Egne`.

Planlagt DB/API-kobling:

- `GET /api/object/user-state` for lesing av brukerens samlingsstatus.
- `POST /api/object/user-specs` for skriving av egne spesifikasjoner.
- `POST /api/object/user-images` for opplasting av egne bilder, maks 10 per brukerobjekt.
- `POST /api/object/change-log` eller sentral audit-logg for bokføring av endringer.
- Aktuelle tabeller/views: `ct_user_collection_object_specs`, private provenance-tabeller, private image/document-tabeller, `ct_v_object_user_state_resolved`.
