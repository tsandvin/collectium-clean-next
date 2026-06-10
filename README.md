# Collectium

Collectium er en digital plattform for samlinger, katalogdata, objektpresentasjon, historisk kontekst, relasjoner, markedsinnsikt og bruker-/forhandlerfunksjoner.

Plattformen bygges som en moderne webapplikasjon med kontrollert frontend, API-basert datatilgang og strukturert databaseinnhold. Målet er å presentere samleobjekter som sammenkoblede objekter med kontekst, ikke som isolerte produktkort.

## Prosjektstatus

Collectium er under aktiv utvikling.

Nåværende hovedområder:

- Next.js-applikasjonsstruktur
- React-basert brukergrensesnitt
- Admin- og systemkontrollsider
- Katalog og objektpresentasjon
- Relasjonsbasert navigasjon
- Medlemskap og brukerflater
- Forhandler- og auksjonsforberedelser
- Databasekontroll og validering
- Runtime- og deploykontroll
- Fil- og bildehåndtering
- Plattformovervåking

## Teknologistack

Prosjektet bruker:

- Next.js
- React
- TypeScript
- Vercel
- Neon Postgres
- Vercel Blob
- GitHub
- Node.js

## Dataplattform

Collectium bruker **Neon Postgres** som primær skybasert databaseplattform for strukturert applikasjonsdata.

Dataplattformen brukes til kontrollert lagring og tilgang til blant annet:

- katalogobjekter
- objektgrupper
- kilder
- relasjoner
- brukere
- medlemskap
- tilgangsnivåer
- systemstatus
- prosessdata
- kontrolldata
- strukturert metadata

Filer og bilder håndteres separat gjennom **Vercel Blob**.

## Hovedområder i applikasjonen

### Katalog

Katalogen viser samleobjekter med strukturert metadata, bilder, kildeinformasjon, status og navigasjon til dypere objektvisning.

### Objektpresentasjon

Hvert objekt kan ha en egen presentasjonsside med samlerrettet, historisk og finansiell kontekst.

### Relasjoner

Objekter kan knyttes til personer, perioder, kilder, motiv, produsenter, årstall og andre relevante kunnskapsnoder.

### Min side

Brukere skal kunne administrere profil, samling, favoritter, ønskeliste, medlemskap, innstillinger, aktivitet, meldinger og tilknyttede prosesser.

### Forhandler og auksjon

Plattformen er planlagt for forhandlerflyt, objektbehandling, auksjonsforberedelse, publisering og transaksjonsrelaterte prosesser.

### Admin og systemkontroll

Adminsystemet brukes til å følge plattformstatus, runtime-status, API-ruter, databaseklarhet, deploystatus og interne systemkontroller.

## Designretning

Collectium bruker en kontrollert designretning med konsistent visuell identitet.

Brukergrensesnittet bygges rundt:

- ryddig layout
- strukturerte kort og paneler
- kontrollert luft og spacing
- responsive visninger
- konsistent navigasjon
- katalogrettede objektkort
- relasjonsbasert presentasjon
- lys og profesjonell visuell stil

Design skal styres sentralt. Vanlige sider skal ikke lage egne uavhengige skall, menyer eller visuelle systemer.

## Runtime og deploy

Prosjektet deployes via Vercel og er koblet til GitHub.

Typisk flyt:

```text
lokal utvikling
→ GitHub
→ Vercel build
→ Vercel deploy
→ runtime-/API-kontroll
