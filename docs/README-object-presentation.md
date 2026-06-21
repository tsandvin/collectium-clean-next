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

---

## v8 – bildeområde og faner

Endringene i v8 gjelder bare objektpresentasjonens lokale innholdskomponent. Global shell, global topbar/sidebar og global skin-provider endres ikke.

### Bildeområde

- Bildeområdet er gjort renere og mer samlet.
- Bildeforklaring ligger nå som egen `imageCaption` under bildeknappene.
- Collectium/Egne er beholdt som bildekildebryter, men er visuelt strammet inn som kildefaner.
- Forside/Bakside/Gjennomlysning/Variant/Detalj er egne bildefaner med skin-relatert aktiv/inaktiv tilstand.
- Klikk på bilde åpner fortsatt fullskjermvisning.

### Hovedfaner

Hovedfanene er samlet i én tydelig rad:

```text
I Samler
II Historie
III Finans
IV I min samling
V Relasjon objekter
```

Fanene vises som tekstfaner uten tung ramme. Aktiv og inaktiv status bruker svake globale skin-relaterte farger. `IV I min samling` får ekstra tydelig aktivmarkering når valgt, fordi den representerer private bruker-/samlerdata.

### Visningsbrytere

`Objekt info`, `Museum`, `Kompakt` og `Finans` er flyttet opp over bilde-/heroområdet som egne visningsfaner. Disse styrer `data-view` og skal ikke ligge blandet med hovedfanene.

## v9 – bildeområde og faneplassering

Endringene i v9 er avgrenset til objektpresentasjonens bilde-/hero-område og faner:

- `Visning / Objekt info / Museum / Kompakt / Finans` ligger nå på høyre side over hero-rammen.
- `Forside / Bakside / Gjennomlysning / Variant / Detalj` og bildeforklaring ligger på samme rad.
- Bildeforklaringen ligger til høyre for bildefanene og bruker global skin-relatert svak bakgrunn.
- `IV I min samling` og `V Relasjon objekter` skyves til høyre i hovedfaneraden.
- `I Samler / II Historie / III Finans` beholdes til venstre.
- Aktiv og inaktiv fane bruker global `--ct-*` tokenlogikk fra global skin/design.
- Finans- og Objekt-info-visning får tydeligere hero-ramme uten lokal skinmotor.

## v10 – Min samling: kvalitet, gradering og statuslogg

Endringene i v10 gjelder `IV I min samling` og høyre statuspanel.

### Kvalitet og tilstand

- `Gradering` er endret fra fritekst til rullegardin.
- Valg i rullegardinen fyller automatisk ut `Egen kvalitet`, `Tilstand` og `Tilstandsmerknad`.
- For seddel brukes modell:
  - `rarity_title_no` → gradering/tilstand
  - `collectium_description_no` → tilstandsbeskrivelse/merknad
  - `quality_label_no` → egen kvalitet
- For mynt brukes modell:
  - `grade_title_no` → gradering/tilstand
  - `grade_name_en` joines inn i merknad
  - `quality_label_no` → egen kvalitet
- Valg bokføres i lokal endringslogg i UI som forberedelse til audit-logg/API.
- Feltet skal senere skrives via bruker-/samling-API, ikke direkte til katalogobjektet.

Planlagt API/write:

```text
POST /api/object/user-specs
POST /api/object/change-log
ct_user_collection_object_specs
ct_user_object_change_log / sentral audit-logg
ct_v_object_user_state_resolved
```

### Statushandlinger

Statuspanelet viser nå tall bak handlingene:

```text
♡ Hjerte / Ønskeliste
★ Stjerne / Favoritt
＋ Legg i samling / Min samling
↗ Del objekt / Visningslenke
⇄ Sammenlign / Mot andre objekter
```

Tallene er UI-forberedelse for antall brukere/objekter med tilsvarende status, og skal senere hentes fra user-state/count-API. Klikk på handlingene bokføres i endringsloggen i denne forhåndsvisningen.


## v11 status og tidslinje

- Statuskort er gjort større, fetere og kursiv i teksten.
- Hjerte/stjerne viser rammeikon når ikke valgt og fylt ikon når valgt.
- Auksjon og Nettbutikk er lagt inn over Del objekt.
- Statuskort har farger etter type: rød, gull, blå, grønn og lilla.
- Tidslinje-årstall er gjort større, fetere og kursiv.

## v12 statusbrytere

- Statusbrytere er justert til svakere skin-relatert uttrykk.
- Regnbuepreget er dempet; hver bryter har svak tint inne i selve bryteren.
- Ikonbakgrunn er fjernet.
- Ikoner har tynn ramme og større størrelse.
- Aktivt hjerte/stjerne/samling fyller selve ikonet, ikke hele raden.
- Hover gir lett løft og skygge.
- Det er lagt inn mer luft/mellomrom mellom statusbryterne.
