# Collectium app 8mai26 — Codex-miljøregler, sikkerhet, URL, DB og global template

Dato: 2026-06-05  
Prosjekt: Collectium app 8mai26  
Domene: app.collectium.no  
Teknologi: Next.js + React  
Database: MariaDB  
Kontrollmodell: DB 8.4  
Målgruppe: Codex, AI-agenter, kodegeneratorer, utviklere og eksterne assistenter  

---

## 0. Dokumentstatus

Dette dokumentet er en omstrukturert Codex-/AI-regel for Collectium app 8mai26.

Regel:

```txt
Denne filen skal leses før Codex, AI eller utviklere lager, endrer, flytter, sletter eller foreslår filer i prosjektet.
```

Innholdet fra den opplastede kilden er ikke fjernet. For å sikre at ingenting er utelatt, ligger originalmaterialet også bevart i sin helhet i vedlegg A nederst i dokumentet.

---

## 1. Høyeste prioritet for Codex

Når Codex arbeider i prosjektet, gjelder denne prioriteten:

```txt
1. Sikkerhet
2. Datakilde og tilgangskontroll
3. DB 8.4-kjeden
4. Riktig URL-/route-struktur
5. Riktig filplassering
6. Global template/designregel
7. Dokumentasjon, header, tags og logg
8. Test og kontroll
9. Kodeendring
```

Codex skal aldri starte med å skrive kode før det har identifisert:

```txt
prosjekt
miljø
berørte filer
berørte routes
feature_key
API-rute
DB-tabell/view
tilgangsregel
design-/template-lag
risiko for lekkasje
```

---

## 2. Codex-miljøregel

### 2.1 Miljøidentitet

Codex skal behandle dette som prosjektmiljø:

```txt
Prosjektnavn: Collectium app 8mai26
Domene: app.collectium.no
Runtime: Vercel / Next.js
Frontend: Next.js + React
Backend/server layer: Next.js route handlers / server layer
Database: MariaDB
Kontrollmodell: DB 8.4
```

Dersom Codex ser andre prosjektnavn, skal det ikke blande dem uten eksplisitt beskjed.

Spesielt:

```txt
Collectium app 8mai26 = app.collectium.no
Collectium side clean = side.collectium.no
```

Disse skal behandles som separate miljøer.

### 2.2 Codex skal arbeide kontrollert

Codex kan:

```txt
lese filer
foreslå endringer
lage nye filer
lage patcher
lage dokumentasjon
lage tester
kjøre lokale tester når miljøet tillater det
forklare konsekvens
```

Codex skal ikke uten eksplisitt godkjenning:

```txt
endre produksjonsdata
kjøre migrasjoner mot produksjon
slette filer
overskrive kjernefiler
endre auth/session/secrets
endre global template uten at oppgaven gjelder global template
endre DB 8.4-kjede uten kontrollrapport
publisere eller deploye
```

### 2.3 Codex cloud/worktree-regel

Codex kan arbeide i isolerte worktrees eller skymiljøer. Det betyr at Codex kan lese, redigere og kjøre kode i sitt miljø, men det fritar ikke Codex fra prosjektreglene.

Regel:

```txt
Selv om Codex har teknisk tilgang til å endre kode, skal den følge Collectium-reglene før endring.
```

Codex skal bruke miljøkonfigurasjon til å installere nødvendige verktøy, linters, formattere og miljøvariabler, men secrets skal aldri hardkodes eller eksponeres.

---

## 3. Absolutt sikkerhetsregel

Collectium skal ikke la uvedkommende hente intern informasjon, systemregler, DB-struktur, API-kontrakter, adminstatus, brukerdata eller private katalog-/markedsdata.

Dette gjelder:

```txt
AI-crawlers
søkemotor-crawlers
scrapers
ukjente bots
eksterne analyseverktøy
uautoriserte API-kall
direkte URL-forsøk
agentmiljøer uten riktig tilgang
```

Viktig:

```txt
robots.txt alene er ikke sikkerhet.
Crawler-blocker alene er ikke sikkerhet.
Middleware alene er ikke sikkerhet.
All privat informasjon må beskyttes med auth, session, rolle, membership, API-validering og DB 8.4 access-check.
```

---

## 4. Secrets og miljøvariabler

Codex skal aldri skrive, vise, logge eller flytte secrets.

Følgende skal aldri eksponeres i frontend, logg, docs, commit eller svar:

```txt
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
SESSION_SECRET
NEXTAUTH_SECRET
API_PRIVATE_KEY
ADMIN_TOKEN
INTERNAL_SECRET
betalingsnøkler
private webhooks
server tokens
rå connection strings
```

Følgende skal aldri bruke `NEXT_PUBLIC_`:

```txt
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
SESSION_SECRET
NEXTAUTH_SECRET
API_PRIVATE_KEY
ADMIN_TOKEN
INTERNAL_SECRET
```

Kun informasjon som trygt kan vises i nettleseren kan ha `NEXT_PUBLIC_`.

---

## 5. Robots, AI-blocker og crawler-regel

### 5.1 public/robots.txt

Det skal finnes:

```txt
public/robots.txt
```

Standard for lukket app:

```txt
User-agent: *
Disallow: /
```

Dersom enkelte offentlige sider åpnes senere, skal de åpnes eksplisitt.

Private områder skal alltid være blokkert:

```txt
Disallow: /admin
Disallow: /min-side
Disallow: /samling
Disallow: /forhandler
Disallow: /api
Disallow: /objekt
Disallow: /katalog
```

### 5.2 AI-crawlers

AI-crawlers skal blokkeres med egen robots.txt-seksjon:

```txt
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: YouBot
Disallow: /
```

### 5.3 Middleware som ekstra lag

`middleware.ts` kan vurderes for å blokkere uønskede user-agents og beskytte områder som:

```txt
/admin
/admin/*
/api
/api/*
/min-side
/min-side/*
/samling
/samling/*
/forhandler
/forhandler/*
/katalog
/katalog/*
/objekt
/objekt/*
```

Middleware er bare ekstra lag. Det skal ikke erstatte auth, API-sjekk eller DB 8.4.

---

## 6. DB 8.4 som kontrollkjede

Alle systemhandlinger skal kobles til DB 8.4-kjeden:

```txt
ct_app_pages
→ ct_app_page_features
→ ct_app_features
→ ct_feature_access_rules
→ ct_v_feature_access_resolved
→ ct_feature_action_routes
→ API
→ MariaDB table/view
→ logg
```

Ingen React-knapp skal være en løs systemhandling.

En knapp må være én av disse:

```txt
1. koblet til feature_key + API/action-route
2. deaktivert med forklaring
3. ren lokal UI-/template-kontroll
```

Eksempel:

```txt
Knapp: Legg til ønskeliste
feature_key: collection.wishlist.toggle
API-route: /api/collection/wishlist/toggle
write_table: ct_user_object_states
log_action: wishlist.toggle
```

---

## 7. Dataflytregel

Riktig dataflyt:

```txt
MariaDB
→ API/backend/server layer
→ Next.js server component / route handler
→ React component
→ UI
```

Forbudt dataflyt:

```txt
React client component
→ direkte MariaDB
```

React Client Components skal aldri koble direkte til MariaDB.

---

## 8. API-sikkerhet

Alle API-ruter skal ha:

```txt
inputvalidering
session-check der nødvendig
rolle-check
membership-check
feature_key-check
DB 8.4 access-check
action-route-check
rate-limit der relevant
standard feilhåndtering
logging
```

Standard feilrespons:

```json
{
  "ok": false,
  "error_code": "ACCESS_DENIED",
  "message": "Du har ikke tilgang til denne funksjonen.",
  "data": null,
  "errors": []
}
```

API skal ikke returnere:

```txt
SQL-feil
stack trace
server paths
miljøvariabler
databasebruker
rå query
interne tokens
```

Standard suksessrespons:

```json
{
  "ok": true,
  "feature_key": "catalog.search",
  "source": "mariadb",
  "data": {},
  "access": {
    "allowed": true,
    "reason": null
  },
  "meta": {
    "read_view": "ct_v_catalog_objects_resolved"
  },
  "errors": []
}
```

---

## 9. URL- og route-regler

Alle frontend-visninger skal ha egne sider/routes i `app/`.

Obligatoriske hovedflater:

```txt
app/page.tsx
app/katalog/page.tsx
app/katalog/[sourceKey]/page.tsx
app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx
app/relasjon/[relationType]/[relationKey]/page.tsx
app/index/page.tsx
app/min-side/page.tsx
app/samling/page.tsx
app/auksjon/page.tsx
app/forhandler/page.tsx
app/admin/page.tsx
app/admin/system/unit-test/page.tsx
```

Regel:

```txt
Hver frontend-visning skal ha egen side.
Sider skal ikke gjemmes inne i designmapper.
Sider skal ikke bygges som templates.
Templates brukes av sider, men er ikke sider.
```

Riktig:

```txt
app/admin/page.tsx
components/templates/template-skin-admin/
```

Feil:

```txt
app/template/admin/page.tsx
components/admin-template/
```

---

## 10. Objekt-URL

Objekter skal alltid slås opp med:

```txt
source_key + object_group + object_id
```

Riktig URL:

```txt
/objekt/norske_sedler/banknote/1459
```

Riktig Next.js-route:

```txt
app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx
```

Ikke bruk bare:

```txt
/objekt/1459
```

Slug kan brukes senere for lesbarhet, men må aldri være teknisk sannhet.

---

## 11. Katalogfilter-regel

Filter skal alltid være source-scoped:

```txt
source_key + object_group + filter_field + filter_value
```

Frontend skal ikke blande filterverdier fra sedler, mynter eller andre kilder.

For Norske sedler:

```txt
source_key = norske_sedler
object_group = banknote
```

---

## 12. Filstruktur

Prosjektet skal følge denne strukturen:

```txt
app/
  layout.tsx
  page.tsx
  katalog/
  objekt/
  relasjon/
  index/
  min-side/
  samling/
  auksjon/
  forhandler/
  admin/
  api/

components/
  layout/
  templates/
  ui/
  catalog/
  object/
  relations/
  index/
  collection/
  auction/
  dealer/
  admin/

lib/
  db/
  auth/
  access/
  api/
  logging/
  formatters/
  mappers/
  types/

public/
docs/
```

Regel:

```txt
app/ = routes og sider
components/layout/ = globalt skall
components/templates/ = globale templates og skins
components/ui/ = små gjenbrukbare UI-komponenter
components/catalog/ = katalogkomponenter
components/object/ = objektpresentasjon
components/admin/ = admininnhold, ikke admin-template
lib/ = server/backend/helpers
app/api/ = API-ruter
public/ = statiske filer som robots.txt, logoer og åpne assets
docs/ = dokumentasjon
```

---

## 13. Filansvar

Ingen filer skal være løse, uklare eller flerbruksfiler.

Hver fil skal ha:

```txt
1. én tydelig oppgave
2. én definert plass i filstrukturen
3. forklaring på hva filen brukes til
4. definerte routes/URL-er den påvirker
5. definerte DB-koblinger eller eksplisitt "ingen DB-kobling"
6. definerte feature_keys / funksjoner
7. definerte API-ruter dersom relevant
8. tags for innholdssøk
```

Eksempler:

```txt
Topbar.tsx
= kun global toppmeny

Sidebar.tsx
= kun global sidemeny

MobileMenu.tsx
= kun global mobilmeny

CatalogShell.tsx
= kun katalogens hovedkomponent

ObjectPresentationPage.tsx
= kun objektpresentasjon

template-skin-admin
= skin/template for adminsidene, ikke adminside

app/admin/page.tsx
= adminside, ikke template
```

---

## 14. Obligatorisk filheader

Alle nye hovedfiler skal starte med dokumentasjonsheader.

Gjelder spesielt:

```txt
page.tsx
layout.tsx
template-filer
skin-filer
React-komponenter
API-ruter
DB-queryfiler
auth/access-filer
adminfiler
katalogfiler
objektfiler
min-side-filer
forhandlerfiler
auksjonsfiler
system-/testfiler
```

Standard header:

```ts
/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn:
 * [filnavn]
 *
 * Definering:
 * [kort definisjon av hva filen er]
 *
 * Formål:
 * [hva filen skal gjøre]
 *
 * Bruksområde:
 * [hvor filen brukes]
 *
 * Berørte URL-er / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.view
 * - catalog.search
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 *
 * DB-kobling:
 * MariaDB via API/server layer
 *
 * Designkobling:
 * Global template / global skin / ingen lokal sidedesign
 *
 * Tags:
 * collectium, katalog, source_key, object_group, object_id
 *
 * Endringsregel:
 * Filen skal kun brukes til formålet definert her.
 */
```

Hvis filen ikke bruker database:

```txt
DB-kobling:
Ingen direkte DB-kobling. Filen er kun visning/layout/template.
```

---

## 15. Global designregel

Design skal ligge i global template/layout/token-lag.

Vanlige sider skal ikke definere:

```txt
bakgrunn
shell/grid
sidemeny
toppmeny
rammer
kortstil
panelstil
skygger
hjørnesignatur
ANNO 2022-stempel
lokale farger
lokale fontsystemer
global hovedresponsivitet
```

Vanlige sider skal kun levere:

```txt
innhold
data
komponentvalg
feature_key/API-kobling
segment/view-state
semantisk struktur
```

Riktig flyt:

```txt
Global template/designmotor
→ AppShell / Sidebar / Topbar / PageFrame
→ komponenter som leser --ct-* tokens
→ sideinnhold
```

Feil flyt:

```txt
Sidefil
→ egne farger / egne rammer / egen bakgrunn / egen shadow / egen signatur
```

---

## 16. Template- og skin-regel

Fire låste template-skins:

```txt
collectium
enkel
museum
finans
```

Teknisk styring:

```html
<html data-template="collectium" data-vp="pc">
```

Tillatte template-verdier:

```txt
collectium
enkel
museum
finans
```

Tillatte viewport-verdier:

```txt
mobile
tablet
pc
wide
tv
```

Standard:

```txt
data-template="collectium"
data-vp="pc"
```

Det skal ikke hete:

```txt
admin-template
catalog-template
object-template
```

Riktig navnemodell for utvidede skins:

```txt
template-skin-admin
template-skin-collectium
template-skin-finans
template-skin-bla
template-skin-historie
template-skin-samler
```

---

## 17. Global tokenregel

Alle farger, flater, rammer, statuser, typografi og radius skal leses fra `--ct-*` tokens.

Komponenter skal bruke:

```css
color: var(--ct-text);
background: var(--ct-card-bg);
border: 1px solid var(--ct-panel-border);
font-family: var(--ct-font-ui);
```

Komponenter skal ikke bruke hardkodede verdier som:

```css
background: #ffffff;
color: #123456;
box-shadow: ...;
border-color: #ccc;
```

Unntak kan bare ligge i global template/tokens-fil.

---

## 18. Hovedtokens

```txt
--ct-app-bg
--ct-app-sidebar-bg
--ct-app-topbar-bg
--ct-panel-bg
--ct-panel-solid
--ct-card-bg
--ct-panel-border
--ct-border-strong
--ct-line
--ct-text
--ct-text-soft
--ct-text-muted
--ct-accent
--ct-accent-dark
--ct-accent-soft
--ct-signature
--ct-watermark
--ct-status-ok
--ct-status-pending
--ct-status-rejected
--ct-font-display
--ct-font-body
--ct-font-ui
--ct-font-mono
--ct-radius
--ct-radius-card
--ct-radius-pill
--ct-content-pad
```

---

## 19. Templatebeskrivelser

### 19.1 collectium

Bruk:

```txt
standard Collectium-identitet
arkiv
samlerflater
hovedsider
```

Uttrykk:

```txt
klassisk samlerarkiv
pergament
dyp grønn
antikk gull
```

Fontroller:

```txt
Display = Playfair Display
Body = Cormorant Garamond
UI = Inter
Mono = IBM Plex Mono
```

### 19.2 enkel

Bruk:

```txt
moderne appflater
lettlest UI
mindre dekor
```

Uttrykk:

```txt
hvit/blå
skandinavisk
ren
nøytral
```

Fontroller:

```txt
Display = Fraunces
Body = Inter
```

### 19.3 museum

Bruk:

```txt
objekter med høy verdi
sjeldne objekter
visning
eksterne delinger
museumspresentasjon
premium
```

Uttrykk:

```txt
mørk koks
antikk gull
formelt galleri
```

Fontroller:

```txt
Display = Cinzel
Body = Source Serif 4
UI = Cinzel / Inter
```

### 19.4 finans

Bruk:

```txt
auksjon
marked
portefølje
økonomi
analyse
datatunge flater
```

Uttrykk:

```txt
mørk teal
smaragdgrønn aksent
tabeller
ticker
tall
```

Fontroller:

```txt
Display/Body/UI = IBM Plex Sans
Mono = IBM Plex Mono
```

---

## 20. App-shell-regel

Global app-shell skal styre:

```txt
Sidebar
Topbar
Content area
PageFrame
PageContent
MobileMenu
Design/skin state hvis aktivert
```

Shell-geometri i V5:

```txt
--ct-sidebar-w: 264px
--ct-topbar-h: 72px
--ct-content-pad: 32px
--ct-radius: 14px
--ct-radius-card: 10px
--ct-radius-pill: 99px
```

Sidebar bruker:

```css
background: var(--ct-app-sidebar-bg);
color: var(--ct-app-sidebar-text);
```

Topbar bruker:

```css
background: var(--ct-app-topbar-bg);
border-bottom: 1px solid var(--ct-app-topbar-border);
backdrop-filter: blur(12px);
```

Innholdsområdet arver:

```css
background: var(--ct-app-bg);
```

---

## 21. Collectium-signatur og ANNO 2022

Alle informasjonsbokser, kort og paneler skal kunne ha Collectium-signatur i hjørnet.

Regel:

```txt
Signatur skal ligge i template/global komponentstil.
Ikke lag signatur på hver side manuelt.
```

Visuelt prinsipp:

```txt
________________ Collectium
```

ANNO 2022 er en låst merkevare-/bakgrunnsdetalj.

Innhold:

```txt
★ ANNO · 2022 ★
COLLECTIUM
C
EST · MMXXII
```

Regel:

```txt
Bruk som global vannmerkedekor, ikke som side-spesifikk pynt.
```

---

## 22. Luft, hjørnesignatur og safe-zone

Alle bokser, kort, paneler og felt skal ha nok innvendig luft på alle fire sider.

Minimum global luft:

```txt
topp: 16px
høyre: 16px
bunn: 28px når hjørnesignatur er aktiv
venstre: 16px
```

Minimum safe-zone for hjørnesignatur:

```txt
høyre: 72px
bunn: 18px
```

Forbudt å plassere over eller for nær hjørnesignatur:

```txt
tekst
brytere
knapper
filtervalg
prisfelt
trendfelt
statusikoner
hjerte/stjerne-knapper
adminstatus
systemvarsler
absoluttplasserte elementer
```

---

## 23. Hover og interaksjon

Alle skins skal ha hover-effekt på interaktive kort, paneler og knapper.

Minimum:

```txt
hover:
- svak transform eller løft
- animert skygge
- tydeligere ramme
- varighet 120–220ms
```

Dette skal defineres globalt i skin/template, ikke lokalt per side.

---

## 24. Responsivitet

Responsivitet skal styres globalt.

Skjermmoduser:

```txt
Mobil: 0–719px
Tablet: 720–1100px
Desktop: 1101–1899px
Bredskjerm: 1900px+
TV/presentasjon: 2900px+
```

Regel:

```txt
Ingen enkeltside skal lage egne hoved-breakpoints.
Breakpoints skal ligge globalt i layout/template.
```

---

## 25. Katalog- og objektkort

Katalogkort skal være inngang til full objektpresentasjon, ikke flate produktkort.

Minimum:

```txt
Bilde
Tittel
Katalognummer
Kilde
Objekttype
Land
Produsent/utsteder
Valør
Årstall
Litra/detalj
Valørutgave/serie
Variant/type
Signatur/personer
Regent/konge
Sjeldenhet
Estimert verdi
Trend
Hjerte
Stjerne
Legg til samling
Åpne objekt
```

Teknisk nøkkel:

```txt
object_id + object_group + source_key
```

URL-regel:

```txt
/objekt/{source_key}/{object_group}/{object_id}
```

---

## 26. Katalogsegmenter

Katalog og objektpresentasjon skal støtte:

```txt
Samler
Historie
Finans
```

Segmentene kan påvirke hvilke data som prioriteres, men skal ikke bryte global layout.

Segmentene kan bruke relevant skin:

```txt
Samler → template-skin-samler
Historie → template-skin-historie
Finans → template-skin-finans
```

---

## 27. Tags og AI-finnbarhet

Alle hovedfiler skal ha tags i header.

Eksempler:

```txt
Tags:
collectium, app-8mai26, katalog, catalog.search, source_key, object_group, object_id
```

```txt
Tags:
collectium, admin, db-8.4, feature_key, action_route, systemstatus
```

```txt
Tags:
collectium, template-skin-admin, global-design, topbar, sidebar, hjornesignatur
```

AI skal ved UI/designarbeid først søke etter:

```txt
collectium robot template global design v5
collectium global design color tokens
collectium template skin collectium enkel museum finans
collectium no page specific design
collectium signature frame anno 2022
```

---

## 28. Codex-sjekkliste før endring

Før Codex endrer en fil, skal Codex svare på:

```txt
1. Hvilken fil endres?
2. Hvorfor endres den?
3. Hvilken route påvirkes?
4. Hvilken feature_key påvirkes?
5. Hvilken API-rute påvirkes?
6. Hvilken DB-tabell/view påvirkes?
7. Er filen riktig sted?
8. Bryter endringen global designregel?
9. Bryter endringen sikkerhetsregel?
10. Kan endringen lekke intern informasjon?
11. Må ny fil heller opprettes?
12. Må dokumentasjon oppdateres?
13. Er endringen trygg i Codex-miljø/worktree?
14. Krever endringen menneskelig godkjenning før merge/deploy?
```

Hvis svaret er uklart, skal Codex ikke endre filen.

---

## 29. AI-sjekkliste før ny side eller komponent

AI/Codex skal sjekke:

```txt
1. Bruker siden global AppShell?
2. Bruker siden PageFrame/PageContent?
3. Bruker komponentene --ct-* tokens?
4. Er alle farger tokenbaserte?
5. Er signaturen global, ikke lokal?
6. Er ANNO 2022-stempel globalt, ikke lokalt?
7. Er topbar/sidebar urørt dersom oppgaven ikke gjelder global layout?
8. Er sidefilen fri for lokal bakgrunn, ramme, shadow og shell-styling?
9. Er template-skin brukt via data-template, ikke lokal CSS?
10. Er designendringen dokumentert i manifest/logg?
```

---

## 30. Forbudte mønstre

Codex/AI skal ikke:

```txt
lage admin-template
lage sidefiler inne i designmapper
lage lokal sidemeny
lage lokal toppmeny
hardkode katalogdata
hardkode filterverdier
hardkode medlemskapstilgang
hardkode markedsverdi
koble React direkte til MariaDB
lage filer uten header
lage flerbruksfiler uten klart ansvar
lage design lokalt i sidefiler
bruke object_id uten source_key og object_group
lage knapper uten feature_key hvis de gjør systemhandlinger
eksponere DB-struktur offentlig
eksponere secrets
eksponere intern adminstatus offentlig
eksponere API-feil med stack trace
åpne private routes for crawling
bruke robots.txt som eneste sikkerhet
endre produksjonsdata fra Codex-miljø
kjøre ukontrollerte migrasjoner
deploye uten godkjenning
```

---

## 31. Godkjente mønstre

Codex/AI skal:

```txt
lage egne sider i app/
lage komponenter i riktig components/-mappe
bruke global Topbar
bruke global Sidebar
bruke global MobileMenu
bruke global template/skin
bruke DB 8.4-kjeden
bruke API for data
bruke object_id + object_group + source_key
bruke source-scoped filter
skrive filheader
legge inn tags
dokumentere DB-kobling
dokumentere route-kobling
dokumentere feature_key
beskytte private routes
legge robots.txt i public/
vurdere middleware for bot-blocking
skille offentlig informasjon fra privat systemdata
arbeide i isolert branch/worktree der mulig
lage patch heller enn ukontrollert overskriving
```

---

## 32. Kodeheader for designfiler

```ts
/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Global Template Design V5
 *
 * Definering / formål:
 * Global designmotor for Collectium: skins, farger, tokens, typografi, rammer, signatur og app-shell.
 *
 * Bruksområde:
 * Brukes av AppShell, Sidebar, Topbar, PageFrame, kort, paneler, skjema, faner og katalog-/objektflater.
 *
 * Berørte sider / routes:
 * - Alle frontend-sider
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen direkte. Dette er ren template/UI-kontroll.
 *
 * Berørte API-ruter:
 * - Ingen direkte.
 *
 * Dataretning:
 * MariaDB/API styrer data. Template styrer kun visuell presentasjon.
 *
 * Logging:
 * log_category: design
 * log_action: template.v5.loaded
 *
 * Endringsregel:
 * Vanlige sider skal ikke overstyre dette. Endringer skal gjøres globalt og loggføres.
 */
```

---

## 33. Anbefalt filplassering for denne regelen

```txt
docs/ai-rules/collectium-codex-miljo-regler.md
docs/ai-rules/collectium-robot-template-global-design-v5.md
styles/collectium-template-tokens-v5.css
components/templates/CollectiumTemplate.tsx
components/templates/CollectiumSignatureFrame.tsx
components/layout/AppShell.tsx
components/layout/Sidebar.tsx
components/layout/Topbar.tsx
```

---

## 34. Kort låseregel

```txt
Collectium app 8mai26 skal bygges som en ren Next.js/React-applikasjon der alle frontend-visninger har egne sider, alle designvalg styres globalt av template-skins, alle systemhandlinger kobles til DB 8.4/API/MariaDB, alle filer har én tydelig definisjon, ett bruksområde, dokumenterte koblinger og søkbare tags, og all privat informasjon beskyttes mot uautorisert tilgang, crawling, scraping, AI-innhenting og ukontrollerte Codex-endringer.
```

---

# Vedlegg A — Originalt kildemateriale bevart uendret

> Dette vedlegget er inkludert for å sikre at ingen detaljer fra den opplastede filen er utelatt.

```markdown
her har vi malen for design template og skinn file:///C:/Users/Bruker/AppData/Local/Temp/065a2f56-6aa3-4110-9bcf-ce1f0edef1b0_v5%20designe%20Juni%2026.zip.1b0/collectium-design-system.html

# Collectium app 8mai26 — AI-, fil-, URL-, DB-, design- og sikkerhetsregler

## 1. Formål

Dette dokumentet er hovedregel for alle AI-verktøy, kodegeneratorer, utviklere og eksterne assistenter som skal lese, lage eller endre filer i prosjektet:

```txt
Collectium app 8mai26
```

Prosjektet gjelder:

```txt
Domene: app.collectium.no
Teknologi: Next.js + React
Database: MariaDB
Kontrollmodell: DB 8.4
Hosting: Vercel / Next.js runtime
```

Før AI lager, endrer eller flytter filer, skal denne filen leses og følges.

---

## 2. Hovedregel

Collectium app 8mai26 skal bygges som en ren Next.js / React-applikasjon der:

```txt
MariaDB = sannhet
DB 8.4 = side, feature, tilgang, action-route og logging
API/server layer = validering, sikkerhet og datatilgang
Next.js = routing, server components, API routes og rendering
React = visning og interaksjon
Global template/skin = design
```

Frontend skal aldri være sannhet for:

```txt
katalogdata
filterverdier
object_id
source_key
object_group
medlemskap
tilgang
priser
markedsverdi
auksjon
bud
samling
forhandlerstatus
adminrettigheter
DB-brytere
API-ruter
```

---

## 3. Sikkerhetsregel for eksterne, crawlers og AI-bots

Collectium skal ikke la uvedkommende utenfra hente intern informasjon, systemregler, DB-struktur, API-kontrakter, adminstatus, brukerdata eller private katalog-/markedsdata.

Dette gjelder spesielt:

```txt
AI-crawlers
søkemotor-crawlers
scrapers
ukjente bots
eksterne analyseverktøy
uautoriserte API-kall
direkte URL-forsøk
```

Viktig regel:

```txt
robots.txt alene er ikke sikkerhet.
Crawler-blocker alene er ikke sikkerhet.
All privat informasjon må beskyttes med auth, session, rolle, membership, API-validering og DB 8.4 access-check.
```

---

## 4. AI-blocker og crawler-blocker

Prosjektet skal ha tekniske barrierer mot uønsket crawling og AI-trening.

### 4.1 robots.txt

Det skal finnes:

```txt
public/robots.txt
```

Standardregel:

```txt
User-agent: *
Disallow: /
```

Dette blokkerer standard crawling av hele appen.

Dersom det senere åpnes offentlige sider, skal de åpnes eksplisitt. Eksempel:

```txt
User-agent: *
Disallow: /

Allow: /
Allow: /medlemskap
Allow: /om
```

Private områder skal alltid være blokkert:

```txt
Disallow: /admin
Disallow: /min-side
Disallow: /samling
Disallow: /forhandler
Disallow: /api
Disallow: /objekt
Disallow: /katalog
```

### 4.2 AI crawler-regel

AI-crawlers skal blokkeres med egen seksjon i `robots.txt`:

```txt
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: YouBot
Disallow: /
```

### 4.3 Middleware-blocker

Det skal senere vurderes `middleware.ts` for å blokkere uønskede user-agents på runtime-nivå.

Eksempel på beskyttede områder:

```txt
/admin
/admin/*
/api
/api/*
/min-side
/min-side/*
/samling
/samling/*
/forhandler
/forhandler/*
/katalog
/katalog/*
/objekt
/objekt/*
```

Middleware skal aldri være eneste sikkerhet. Den skal være ekstra lag før auth/API/DB-check.

---

## 5. Ingen intern informasjon til offentlig frontend

Frontend skal ikke eksponere:

```txt
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
SESSION_SECRET
NEXTAUTH_SECRET
interne table names som ikke trengs i UI
interne API-feil med stack trace
admin feature_keys for ikke-admin
private access rules
private user_id-er
e-postadresser
telefonnummer
betalingsinformasjon
systemdiagnose
rå SQL
databasefeil
```

Følgende skal aldri bruke `NEXT_PUBLIC_`:

```txt
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
SESSION_SECRET
NEXTAUTH_SECRET
API_PRIVATE_KEY
ADMIN_TOKEN
INTERNAL_SECRET
```

Kun informasjon som trygt kan vises i nettleseren kan ha `NEXT_PUBLIC_`.

---

## 6. API-sikkerhet

Alle API-ruter skal ha:

```txt
inputvalidering
session-check der nødvendig
rolle-check
membership-check
feature_key-check
DB 8.4 access-check
action-route-check
rate-limit der relevant
standard feilhåndtering
logging
```

Ingen API-rute skal returnere intern systeminformasjon til uautoriserte brukere.

Feilrespons skal være kontrollert:

```json
{
  "ok": false,
  "error_code": "ACCESS_DENIED",
  "message": "Du har ikke tilgang til denne funksjonen.",
  "data": null,
  "errors": []
}
```

Ikke returner:

```txt
SQL-feil
stack trace
server paths
miljøvariabler
databasebruker
rå query
interne tokens
```

---

## 7. DB 8.4-regel

Alle systemhandlinger skal kobles til DB 8.4-kjeden:

```txt
ct_app_pages
→ ct_app_page_features
→ ct_app_features
→ ct_feature_access_rules
→ ct_v_feature_access_resolved
→ ct_feature_action_routes
→ API
→ MariaDB table/view
→ logg
```

Ingen React-knapp skal være en løs systemhandling.

En knapp må være én av disse:

```txt
1. koblet til feature_key + API/action-route
2. deaktivert med forklaring
3. ren lokal UI-/template-kontroll
```

Eksempel:

```txt
Knapp: Legg til ønskeliste
feature_key: collection.wishlist.toggle
API-route: /api/collection/wishlist/toggle
write_table: ct_user_object_states
log_action: wishlist.toggle
```

---

## 8. Dataflyt

Riktig dataflyt:

```txt
MariaDB
→ API/backend/server layer
→ Next.js server component / route handler
→ React component
→ UI
```

Feil dataflyt:

```txt
React client component
→ direkte MariaDB
```

React Client Components skal aldri koble direkte til MariaDB.

---

## 9. Filregel

Ingen filer skal være løse, uklare eller flerbruksfiler.

Hver fil skal ha:

```txt
1. én tydelig oppgave
2. én definert plass i filstrukturen
3. forklaring på hva filen brukes til
4. definerte routes/URL-er den påvirker
5. definerte DB-koblinger eller eksplisitt "ingen DB-kobling"
6. definerte feature_keys / funksjoner
7. definerte API-ruter dersom relevant
8. tags for innholdssøk
```

AI skal ikke lage filer uten å forklare hvorfor filen finnes.

---

## 10. Obligatorisk filheader

Alle nye hovedfiler skal starte med en dokumentasjonsheader.

Gjelder spesielt:

```txt
page.tsx
layout.tsx
template-filer
skin-filer
React-komponenter
API-ruter
DB-queryfiler
auth/access-filer
adminfiler
katalogfiler
objektfiler
min-side-filer
forhandlerfiler
auksjonsfiler
system-/testfiler
```

Standard header:

```ts
/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn:
 * [filnavn]
 *
 * Definering:
 * [kort definisjon av hva filen er]
 *
 * Formål:
 * [hva filen skal gjøre]
 *
 * Bruksområde:
 * [hvor filen brukes]
 *
 * Berørte URL-er / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.view
 * - catalog.search
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 *
 * DB-kobling:
 * MariaDB via API/server layer
 *
 * Designkobling:
 * Global template / global skin / ingen lokal sidedesign
 *
 * Tags:
 * collectium, katalog, source_key, object_group, object_id
 *
 * Endringsregel:
 * Filen skal kun brukes til formålet definert her.
 */
```

Hvis filen ikke bruker database:

```txt
DB-kobling:
Ingen direkte DB-kobling. Filen er kun visning/layout/template.
```

---

## 11. URL-regler

Alle frontend-visninger skal ha egne sider/routes i `app/`.

Det skal finnes egne sider for alle hovedflater:

```txt
app/page.tsx
app/katalog/page.tsx
app/katalog/[sourceKey]/page.tsx
app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx
app/relasjon/[relationType]/[relationKey]/page.tsx
app/index/page.tsx
app/min-side/page.tsx
app/samling/page.tsx
app/auksjon/page.tsx
app/forhandler/page.tsx
app/admin/page.tsx
app/admin/system/unit-test/page.tsx
```

Regel:

```txt
Hver frontend-visning skal ha egen side.
Sider skal ikke gjemmes inne i designmapper.
Sider skal ikke bygges som templates.
Templates brukes av sider, men er ikke sider.
```

Riktig:

```txt
app/admin/page.tsx
components/templates/template-skin-admin/
```

Feil:

```txt
app/template/admin/page.tsx
components/admin-template/
```

---

## 12. Objekt-URL

Objekter skal alltid slås opp med:

```txt
source_key + object_group + object_id
```

Riktig URL:

```txt
/objekt/norske_sedler/banknote/1459
```

Riktig Next.js-route:

```txt
app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx
```

Ikke bruk bare:

```txt
/objekt/1459
```

Slug kan brukes senere for lesbarhet, men må aldri være teknisk sannhet.

---

## 13. Katalogfilter-regel

Filter skal alltid være source-scoped:

```txt
source_key + object_group + filter_field + filter_value
```

Frontend skal ikke blande filterverdier fra sedler, mynter eller andre kilder.

For Norske sedler:

```txt
source_key = norske_sedler
object_group = banknote
```

---

## 14. Filstruktur

Prosjektet skal følge denne strukturen:

```txt
app/
  layout.tsx
  page.tsx
  katalog/
  objekt/
  relasjon/
  index/
  min-side/
  samling/
  auksjon/
  forhandler/
  admin/
  api/

components/
  layout/
  templates/
  ui/
  catalog/
  object/
  relations/
  index/
  collection/
  auction/
  dealer/
  admin/

lib/
  db/
  auth/
  access/
  api/
  logging/
  formatters/
  mappers/
  types/

public/
docs/
```

Regel:

```txt
app/ = routes og sider
components/layout/ = globalt skall
components/templates/ = globale templates og skins
components/ui/ = små gjenbrukbare UI-komponenter
components/catalog/ = katalogkomponenter
components/object/ = objektpresentasjon
components/admin/ = admininnhold, ikke admin-template
lib/ = server/backend/helpers
app/api/ = API-ruter
public/ = statiske filer som robots.txt, logoer og åpne assets
docs/ = dokumentasjon
```

---

## 15. Filansvar

En fil skal kun brukes til det den er laget for.

Eksempler:

```txt
Topbar.tsx
= kun global toppmeny

Sidebar.tsx
= kun global sidemeny

MobileMenu.tsx
= kun global mobilmeny

CatalogShell.tsx
= kun katalogens hovedkomponent

ObjectPresentationPage.tsx
= kun objektpresentasjon

template-skin-admin
= skin/template for adminsidene, ikke adminside

app/admin/page.tsx
= adminside, ikke template
```

Feil:

```txt
En sidefil definerer global toppmeny.
En katalogkomponent definerer adminlayout.
En template henter katalogdata direkte.
En UI-knapp bestemmer medlemskapstilgang alene.
```

---

## 16. Designregel

Design skal være globalt.

Vanlige sider skal ikke definere:

```txt
global bakgrunn
global layout
sidemeny
toppmeny
rammesystem
skygger
skin
fontsystem
signature-design
hovedresponsivitet
```

Dette skal ligge i:

```txt
components/layout/
components/templates/
styles/
```

Sider skal bare levere innhold og koble til riktig data/API.

---

## 17. Global sidemeny og toppmeny

Sidemenyen skal være global:

```txt
components/layout/Sidebar.tsx
```

Toppmenyen skal være global:

```txt
components/layout/Topbar.tsx
```

Mobilmeny skal være global:

```txt
components/layout/MobileMenu.tsx
```

Ingen enkeltside skal lage egen sidemeny eller toppmeny.

---

## 18. Template- og skin-regel

Det skal ikke hete:

```txt
admin-template
catalog-template
object-template
```

Riktig navnemodell:

```txt
template-skin-admin
template-skin-collectium
template-skin-finans
template-skin-bla
template-skin-historie
template-skin-samler
```

Templates/skins skal være globale designlag som sider kan bruke.

---

## 19. Globale template-skins

Disse skins skal defineres som egne globale designvarianter:

```txt
template-skin-collectium
template-skin-finans
template-skin-bla
template-skin-historie
template-skin-samler
template-skin-admin
```

Hver skin skal ha egne tokens for:

```txt
font-family
font-size-scale
font-weight
heading-style
corner-radius
border-thickness
border-color
panel-background
page-background
shadow
hover-shadow
signature-corner
accent-color
button-style
tab-style
field-style
```

---

## 20. Krav per skin

### template-skin-collectium

Brukes som hovedskin for Collectium.

Skal ha:

```txt
ren Collectium-identitet
lys blå/hvit base
arkiv-/museumspreg
tynn ramme
diskret skygge
standard hjørnesignatur
```

### template-skin-finans

Brukes på finans, marked, index og verdiutvikling.

Skal ha:

```txt
finansiell visuell stil
strammere typografi
tydelige tall
graf-/tabellvennlig layout
sterkere kontrast på verdier
hover-skygge på markedskort
```

### template-skin-bla

Brukes som blå Collectium-variant.

Skal ha:

```txt
blå hovedtone
hvit/lys bakgrunn
tydelige knapper
blå aktive states
diskret ramme
hover-animasjon med skygge
```

### template-skin-historie

Brukes på historiske relasjoner, museum og objektets historiesegment.

Skal ha:

```txt
historisk/arkivpreget stil
roligere font
mykere rammer
varmere bakgrunn
arkivfaner
diskret hjørnesignatur
```

### template-skin-samler

Brukes på samling, ønskeliste, favoritter og brukerens objektstatus.

Skal ha:

```txt
samler-/mappepreg
tydelige statusfelt
hjerte/stjerne/samling-handlinger
mykere kort
god lesbarhet
hover-skygge på objektkort
```

### template-skin-admin

Brukes på adminsidene.

Skal ha:

```txt
kontrollpanelpreg
tydelige statusfarger
tab-/arkivstruktur
kompakt informasjon
høy lesbarhet
tydelige feil/varsler
ingen pynt som skjuler systemstatus
```

---

## 21. Hjørnesignatur, indre ramme og luft

Alle informasjonsbokser, kort, paneler, felt og moduler i Collectium skal støtte en standard hjørnesignatur i indre ramme.

Hjørnesignaturen er en del av Collectium sitt globale designsystem og skal ikke lages manuelt inne i hver enkelt side eller komponent.

### 21.1 Standard hjørnesignatur

Standard:

```txt
Tekst: Collectium
Plassering: nederst til høyre i indre ramme
Farge: grå
Størrelse: 10px
```

Hjørnesignaturen skal styres globalt av:

```txt
components/templates/
styles/
template-skin-collectium
template-skin-finans
template-skin-bla
template-skin-historie
template-skin-samler
template-skin-admin
```

Sider og enkeltkomponenter skal ikke lage egen signatur lokalt.

### 21.2 Luft på alle fire sider

Alle bokser, kort, paneler og felt skal ha nok innvendig luft på alle fire sider.

Innhold skal aldri ligge helt inntil rammen.

Dette gjelder:

```txt
tekst
overskrifter
knapper
brytere
ikoner
statusfelt
tabs
filtervalg
inputfelt
prisfelt
trendfelt
handlinger
```

Minimum global luft:

```txt
topp: 16px
høyre: 16px
bunn: 28px når hjørnesignatur er aktiv
venstre: 16px
```

Ved kompakte kort kan padding reduseres, men det skal alltid være nok luft til at teksten og knappene ikke kolliderer med rammen eller hjørnesignaturen.

### 21.3 Signatur-safe-zone

Alle komponenter som bruker hjørnesignatur skal ha en egen safe-zone nederst til høyre.

Denne sonen skal reserveres for hjørnesignaturen og skal ikke brukes av vanlig innhold.

Regel:

```txt
Tekst, knapper, brytere, ikoner og statusfelt skal aldri skrives over, ligge oppå, kollidere med eller visuelt forstyrre hjørnesignaturen.
```

Minimum safe-zone:

```txt
høyre: 72px
bunn: 18px
```

Anbefalte globale tokens:

```css
--ct-card-padding-top: 16px;
--ct-card-padding-right: 16px;
--ct-card-padding-bottom: 28px;
--ct-card-padding-left: 16px;

--ct-signature-safe-zone-right: 72px;
--ct-signature-safe-zone-bottom: 18px;

--ct-signature-font-size: 10px;
--ct-signature-color: var(--ct-muted-gray);
```

### 21.4 Forbudt plassering

Det er ikke lov å plassere følgende over eller for nær hjørnesignaturen:

```txt
tekst
brytere
knapper
filtervalg
prisfelt
trendfelt
statusikoner
hjerte/stjerne-knapper
adminstatus
systemvarsler
absoluttplasserte elementer
```

Dersom et element må plasseres nederst til høyre, skal det flyttes over signatur-safe-zone eller legges i en egen handlingsrad som ikke overlapper signaturen.

---

## 22. Hover-animasjon

Alle skins skal ha hover-effekt på interaktive kort, paneler og knapper.

Minimum:

```txt
hover:
- svak transform eller løft
- animert skygge
- tydeligere ramme
- varighet 120–220ms
```

Ved hover med mus skal interaktive bokser animere med skygge.

Dette skal defineres globalt i skin/template, ikke lokalt per side.

---

## 23. Responsivitet

Responsivitet skal styres globalt.

Skjermmoduser:

```txt
Mobil: 0–719px
Tablet: 720–1100px
Desktop: 1101–1899px
Bredskjerm: 1900px+
TV/presentasjon: 2900px+
```

Regel:

```txt
Ingen enkeltside skal lage egne hoved-breakpoints.
Breakpoints skal ligge globalt i layout/template.
```

---

## 24. Katalogsegmenter

Katalog og objektpresentasjon skal støtte:

```txt
Samler
Historie
Finans
```

Segmentene kan påvirke hvilke data som prioriteres, men skal ikke bryte global layout.

Segmentene kan bruke relevant skin:

```txt
Samler → template-skin-samler
Historie → template-skin-historie
Finans → template-skin-finans
```

---

## 25. Standard API-respons

Alle API-ruter skal returnere standard respons.

Eksempel:

```json
{
  "ok": true,
  "feature_key": "catalog.search",
  "source": "mariadb",
  "data": {},
  "access": {
    "allowed": true,
    "reason": null
  },
  "meta": {
    "read_view": "ct_v_catalog_objects_resolved"
  },
  "errors": []
}
```

---

## 26. Tags for innholdssøk

Alle hovedfiler skal ha tags i header.

Eksempler:

```txt
Tags:
collectium, app-8mai26, katalog, catalog.search, source_key, object_group, object_id
```

```txt
Tags:
collectium, admin, db-8.4, feature_key, action_route, systemstatus
```

```txt
Tags:
collectium, template-skin-admin, global-design, topbar, sidebar, hjornesignatur
```

Tags skal gjøre det mulig for AI og utviklere å søke etter filer etter funksjon, side, DB-kobling og designområde.

---

## 27. Endringsregel

Før AI endrer en fil, skal AI svare på:

```txt
1. Hvilken fil endres?
2. Hvorfor endres den?
3. Hvilken route påvirkes?
4. Hvilken feature_key påvirkes?
5. Hvilken API-rute påvirkes?
6. Hvilken DB-tabell/view påvirkes?
7. Er filen riktig sted?
8. Bryter endringen global designregel?
9. Bryter endringen sikkerhetsregel?
10. Kan endringen lekke intern informasjon?
11. Må ny fil heller opprettes?
12. Må dokumentasjon oppdateres?
```

Hvis svaret er uklart, skal AI ikke endre filen.

---

## 28. Forbudte mønstre

AI skal ikke:

```txt
lage admin-template
lage sidefiler inne i designmapper
lage lokal sidemeny
lage lokal toppmeny
hardkode katalogdata
hardkode filterverdier
hardkode medlemskapstilgang
hardkode markedsverdi
koble React direkte til MariaDB
lage filer uten header
lage flerbruksfiler uten klart ansvar
lage design lokalt i sidefiler
bruke object_id uten source_key og object_group
lage knapper uten feature_key hvis de gjør systemhandlinger
eksponere DB-struktur offentlig
eksponere secrets
eksponere intern adminstatus offentlig
eksponere API-feil med stack trace
åpne private routes for crawling
bruke robots.txt som eneste sikkerhet
```

---

## 29. Godkjente mønstre

AI skal:

```txt
lage egne sider i app/
lage komponenter i riktig components/-mappe
bruke global Topbar
bruke global Sidebar
bruke global MobileMenu
bruke global template/skin
bruke DB 8.4-kjeden
bruke API for data
bruke object_id + object_group + source_key
bruke source-scoped filter
skrive filheader
legge inn tags
dokumentere DB-kobling
dokumentere route-kobling
dokumentere feature_key
beskytte private routes
legge robots.txt i public/
vurdere middleware for bot-blocking
skille offentlig informasjon fra privat systemdata
```

---

## 30. Kort låseregel

```txt
Collectium app 8mai26 skal bygges som en ren Next.js/React-applikasjon der alle frontend-visninger har egne sider, alle designvalg styres globalt av template-skins, alle systemhandlinger kobles til DB 8.4/API/MariaDB, alle filer har én tydelig definisjon, ett bruksområde, dokumenterte koblinger og søkbare tags, og all privat informasjon beskyttes mot uautorisert tilgang, crawling, scraping og AI-innhenting.
```
## Prosjekteier

Owner / Founder:
Tommy Sandvin

Kontakt:
tommy@collectium.no

Prosjekt:
Collectium app 8mai26

Domene:
app.collectium.no


Collectium Robot Template — Global Design, Farge og Skin V5
Dokumenttype: AI-/robotregel for Collectium global template/design  
Kilde: `V5 Collectium template designe.zip` → `collectium-design-system.html`  
Formål: Gjøre alle designregler, farger, skins, tokens og globale template-detaljer enkle å finne for AI, Codex, utviklere og fremtidige endringer.
---
0. AI-finnbar nøkkel
```text
AI_TAGS: collectium, robot template, global design, designmotor, template skin, color tokens, --ct- tokens, Collectium V5, sidebar, topbar, signature frame, ANNO 2022, cards, panels, forms, tabs, catalog cards, museum, finans, enkel, collectium
```
Når AI skal lage eller endre Collectium UI, skal den først søke etter:
```text
collectium robot template global design v5
collectium global design color tokens
collectium template skin collectium enkel museum finans
collectium no page specific design
collectium signature frame anno 2022
```
---
1. Låst hovedregel
```text
Design skal ligge i global template/layout/token-lag.
Vanlige sider skal ikke eie designet.
```
Vanlige sider skal ikke definere:
```text
bakgrunn
shell/grid
sidemeny
toppmeny
rammer
kortstil
panelstil
skygger
hjørnesignatur
ANNO 2022-stempel
lokale farger
lokale fontsystemer
```
Vanlige sider skal kun levere:
```text
innhold
data
komponentvalg
feature_key/API-kobling
segment/view-state
semantisk struktur
```
Riktig flyt:
```text
Global template/designmotor
→ AppShell / Sidebar / Topbar / PageFrame
→ komponenter som leser --ct-* tokens
→ sideinnhold
```
Ikke:
```text
Sidefil
→ egne farger / egne rammer / egen bakgrunn / egen shadow / egen signatur
```
---
2. Fire låste templates/skins
Collectium V5 har fire template-skins. Alle bruker samme token-navn, men med ulike verdier.
Template	Modus	Bruk	Visuell karakter
`collectium`	Lys standard	Arkiv, samler, hovedidentitet	Pergament, dyp grønn, antikk gull
`enkel`	Lys minimalistisk	Moderne appflater, lettlest UI	Hvit/blå, skandinavisk, ren
`museum`	Mørk formell	Sjeldne objekter, visning, deling, premium	Koks/svart, antikk gull, galleri
`finans`	Mørk datatung	Marked, auksjon, portefølje, analyse	Mørk teal, smaragd, monospace/tabeller
Teknisk styring:
```html
<html data-template="collectium" data-vp="pc">
```
Tillatte template-verdier:
```text
collectium
enkel
museum
finans
```
Tillatte viewport-verdier:
```text
mobile
tablet
pc
wide
tv
```
Standard:
```text
data-template="collectium"
data-vp="pc"
```
---
3. Global tokenregel
Alle farger, flater, rammer, statuser, typografi og radius skal leses fra `--ct-*` tokens.
Komponenter skal bruke:
```css
color: var(--ct-text);
background: var(--ct-card-bg);
border: 1px solid var(--ct-panel-border);
font-family: var(--ct-font-ui);
```
Komponenter skal ikke bruke hardkodede verdier som:
```css
background: #ffffff;
color: #123456;
box-shadow: ...;
border-color: #ccc;
```
Unntak kan bare ligge i global template/tokens-fil.
---
4. Hovedtokens
Token	Rolle	Bruk
`--ct-app-bg`	Hovedbakgrunn	`<body>` / app-flate
`--ct-app-sidebar-bg`	Sidemeny	Sidebar-gradient
`--ct-app-topbar-bg`	Topbar	Toppmeny med blur
`--ct-panel-bg`	Panel	Hero/store paneler
`--ct-panel-solid`	Solid panel	Knapper/input der transparens ikke passer
`--ct-card-bg`	Kort	Fakta-, KPI- og katalogkort
`--ct-panel-border`	Ramme	Standard kort/panelramme
`--ct-border-strong`	Sterk ramme	Hover/fokus/aktiv
`--ct-line`	Skillelinje	Stiplede/innvendige linjer
`--ct-text`	Primærtekst	Titler og hovedfakta
`--ct-text-soft`	Sekundærtekst	Brødtekst/beskrivelser
`--ct-text-muted`	Dempet tekst	Labels/hjelpetekst/manglende verdi
`--ct-accent`	Aksent	Primærknapper/lenker/aktiv tilstand
`--ct-accent-dark`	Mørk aksent	Hover/fokusring/knappramme
`--ct-accent-soft`	Myk aksent	Gull/pastell/dekor/bilder
`--ct-signature`	Signatur	Collectium-hjørnesignatur
`--ct-watermark`	Vannmerke	ANNO 2022-stempel/dekor
`--ct-status-ok`	OK	Godkjent/aktiv/positiv trend
`--ct-status-pending`	Venter	Pågående/gul varsling
`--ct-status-rejected`	Avvist	Negativ/avvist/deaktivert
`--ct-font-display`	Display-font	H1/H2/objekttittel
`--ct-font-body`	Brødtekst	Prosa/forklaringer
`--ct-font-ui`	UI-font	Knapper/labels/brytere
`--ct-font-mono`	Mono	Tall/koder/katalognummer
`--ct-radius`	Stor radius	Hero/store paneler
`--ct-radius-card`	Kortradius	Vanlige kort
`--ct-radius-pill`	Pilleradius	Chips/status/eyebrow
`--ct-content-pad`	Innholdspadding	Sideinnhold
---
5. Template: Collectium
Bruk: standard Collectium-identitet, arkiv, samlerflater, hovedsider.  
Uttrykk: klassisk samlerarkiv, pergament, dyp grønn, antikk gull.  
Fontroller: Display = Playfair Display, Body = Cormorant Garamond, UI = Inter, Mono = IBM Plex Mono.
Viktige farger:
```text
Bakgrunn: #f8f1e6 / #fffaf2 / #f3e2c8
Tekst: #143327
Myk tekst: #3a4a3e
Dempet tekst: #8a7b5a
Aksent: #145c38
Mørk aksent: #0f2e24
Myk aksent/gull: #d6a641
Signatur: #a17a3a
Vannmerke: #9c3a1f
```
---
6. Template: Enkel
Bruk: moderne og lettlest appflate, mindre dekor.  
Uttrykk: hvit/blå, skandinavisk, ren, nøytral.  
Fontroller: Display = Fraunces, Body = Inter.
Viktige farger:
```text
Bakgrunn: #f8fbff / #ffffff / #eef5fc
Tekst: #0b2a4a
Myk tekst: #3a4b62
Dempet tekst: #7a8aa0
Aksent: #1e5a9a
Mørk aksent: #0b2a4a
Myk aksent: #9fcdb2
Signatur: #1e5a9a
Vannmerke: #1e5a9a
```
---
7. Template: Museum
Bruk: objekter med høy verdi, sjeldne objekter, visning, eksterne delinger, museumspresentasjon.  
Uttrykk: mørk koks, antikk gull, formelt galleri.  
Fontroller: Display = Cinzel, Body = Source Serif 4, UI = Cinzel/Inter.
Viktige farger:
```text
Bakgrunn: #1a1a1c / #0d0d0e
Tekst: #e8e3d6
Myk tekst: #c5bea9
Dempet tekst: #7a7568
Aksent: #b99a55
Mørk aksent: #a17a3a
Myk aksent: #d6c082
Signatur: #a17a3a
Vannmerke: #b99a55
```
---
8. Template: Finans
Bruk: auksjon, marked, portefølje, økonomi, analyse, datatunge flater.  
Uttrykk: mørk teal, smaragdgrønn aksent, tabeller, ticker, tall.  
Fontroller: Display/Body/UI = IBM Plex Sans, Mono = IBM Plex Mono.
Viktige farger:
```text
Bakgrunn: #162028 / #111a21
Tekst: #dde6ed
Myk tekst: #a8b8c5
Dempet tekst: #6b7d8c
Aksent: #27a777
Mørk aksent: #1f8a5f
Myk aksent: #b08a3e
Signatur: #27a777
Vannmerke: #27a777
Avvist/negativ: #d04b4b
```
---
9. App-shell-regel
Global app-shell skal styre:
```text
Sidebar
Topbar
Content area
PageFrame
PageContent
MobileMenu
Design/skin state hvis aktivert
```
Shell-geometri i V5:
```text
--ct-sidebar-w: 264px
--ct-topbar-h: 72px
--ct-content-pad: 32px
--ct-radius: 14px
--ct-radius-card: 10px
--ct-radius-pill: 99px
```
Sidebar bruker:
```css
background: var(--ct-app-sidebar-bg);
color: var(--ct-app-sidebar-text);
```
Topbar bruker:
```css
background: var(--ct-app-topbar-bg);
border-bottom: 1px solid var(--ct-app-topbar-border);
backdrop-filter: blur(12px);
```
Innholdsområdet arver:
```css
background: var(--ct-app-bg);
```
---
10. Collectium-signatur
Alle informasjonsbokser, kort og paneler skal kunne ha Collectium-signatur i hjørnet.
Regel:
```text
Signatur skal ligge i template/global komponentstil.
Ikke lag signatur på hver side manuelt.
```
Visuelt prinsipp:
```text
________________ Collectium
```
Bruk:
```text
Fakta-kort
KPI-kort
Katalogkort
Objektpanel
Adminpanel
Min side-panel
Relasjonspanel
```
Skal ikke brukes på:
```text
rene knapper
input-felt
små toggles
```
Token:
```css
color: var(--ct-signature);
```
---
11. ANNO 2022-stempel
ANNO 2022 er en låst merkevare-/bakgrunnsdetalj.
Innhold:
```text
★ ANNO · 2022 ★
COLLECTIUM
C
EST · MMXXII
```
Regel:
```text
Bruk som global vannmerkedekor, ikke som side-spesifikk pynt.
```
Anbefaling fra V5:
```text
4–6 instanser per side
varierende rotasjon
lav opasitet
styres av --ct-watermark og --ct-watermark-opacity-*
```
Museum kan ha litt høyere opasitet enn lyse skins. Finans skal holde stempelet smaragdgrønt og subtilt.
---
12. Komponentregler
Knapper
```text
Primærknapp: aksentfylt, for hovedhandlinger.
Sekundærknapp: nøytral med ramme.
Disabled: 50% opasitet + cursor:not-allowed.
```
Eyebrow-piller
```text
Korte kontekstmerker, maks ca. 4 ord.
Brukes over titler.
```
Kort og paneler
Alle kort skal bruke:
```css
background: var(--ct-card-bg);
border: 1px solid var(--ct-panel-border);
border-radius: var(--ct-radius-card);
```
Skjema
Input/select/textarea skal bruke:
```css
background: var(--ct-app-search-bg);
border: 1px solid var(--ct-panel-border);
```
Fokus:
```css
border-color: var(--ct-accent);
box-shadow: 0 0 0 3px color-mix(in srgb, var(--ct-accent) 18%, transparent);
```
Faner
```text
Aktiv fane = underlinje i --ct-accent.
Ingen tung boksbakgrunn.
Count-badge kan stå etter teksten.
```
Filterchips
```text
Aktiv = fylt med --ct-accent.
Inaktiv = ramme/soft bakgrunn.
Kan vise count.
```
Statusmerker
Bruk kun tokenbaserte statusfarger:
```text
--ct-status-ok
--ct-status-pending
--ct-status-rejected
--ct-accent
```
Statusmerker skal være dempede/pastell, ikke massive varselsflater.
---
13. Katalogkort og objektkort
Katalogkort skal være inngang til full objektpresentasjon, ikke flate produktkort.
Minimum:
```text
Bilde
Tittel
Katalognummer
Kilde
Objekttype
Land
Produsent/utsteder
Valør
Årstall
Litra/detalj
Valørutgave/serie
Variant/type
Signatur/personer
Regent/konge
Sjeldenhet
Estimert verdi
Trend
Hjerte
Stjerne
Legg til samling
Åpne objekt
```
Teknisk nøkkel:
```text
object_id + object_group + source_key
```
URL-regel:
```text
/objekt/{source_key}/{object_group}/{object_id}
```
---
14. Filplassering i Next.js/React
Anbefalt plassering:
```text
styles/collectium-template-tokens-v5.css
components/templates/CollectiumTemplate.tsx
components/templates/CollectiumSignatureFrame.tsx
components/layout/AppShell.tsx
components/layout/Sidebar.tsx
components/layout/Topbar.tsx
docs/ai-rules/collectium-robot-template-global-design-v5.md
```
Designregler skal registreres i dokumentasjon/manifest slik at AI finner dem før kodeendring.
---
15. Kodeheader som skal brukes i designfiler
```ts
/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Global Template Design V5
 *
 * Definering / formål:
 * Global designmotor for Collectium: skins, farger, tokens, typografi, rammer, signatur og app-shell.
 *
 * Bruksområde:
 * Brukes av AppShell, Sidebar, Topbar, PageFrame, kort, paneler, skjema, faner og katalog-/objektflater.
 *
 * Berørte sider / routes:
 * - Alle frontend-sider
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen direkte. Dette er ren template/UI-kontroll.
 *
 * Berørte API-ruter:
 * - Ingen direkte.
 *
 * Dataretning:
 * MariaDB/API styrer data. Template styrer kun visuell presentasjon.
 *
 * Logging:
 * log_category: design
 * log_action: template.v5.loaded
 *
 * Endringsregel:
 * Vanlige sider skal ikke overstyre dette. Endringer skal gjøres globalt og loggføres.
 */
```
---
16. AI-sjekkliste før ny side eller komponent
AI skal sjekke:
```text
1. Bruker siden global AppShell?
2. Bruker siden PageFrame/PageContent?
3. Bruker komponentene --ct-* tokens?
4. Er alle farger tokenbaserte?
5. Er signaturen global, ikke lokal?
6. Er ANNO 2022-stempel globalt, ikke lokalt?
7. Er topbar/sidebar urørt dersom oppgaven ikke gjelder global layout?
8. Er sidefilen fri for lokal bakgrunn, ramme, shadow og shell-styling?
9. Er template-skin brukt via data-template, ikke lokal CSS?
10. Er designendringen dokumentert i manifest/logg?
```
---
17. Kort låsetekst for README / AI-instruks
```text
Collectium V5 design styres av global template/designmotor. Fire skins er låst: collectium, enkel, museum og finans. Alle komponenter skal lese farger, typografi, rammer, radius, status og signatur fra --ct-* tokens. Vanlige sider skal ikke definere egne bakgrunner, rammer, shadows, shell, sidebar, topbar eller Collectium-signatur. Endringer i design skal gjøres globalt i template/tokens-laget og dokumenteres før bruk.
```/**
 * COLLECTIUM GLOBAL TEMPLATE TOKENS V5
 * Source: V5 Collectium template designe / collectium-design-system.html
 * Purpose: Global design/color/token source for AI, Codex, Next.js/React components and template layer.
 * Rule: Ordinary pages must not define page-specific colors, frames, shell backgrounds, shadows or template styling.
 * Use: html[data-template="collectium|enkel|museum|finans"] and html[data-vp="mobile|tablet|pc|wide|tv"].
 */

html[data-template="collectium"]{
  --ct-font-base:14px;
  --w-display:700;
  --w-body:400;
  --w-ui:500;
  --ct-sidebar-w:264px;
  --ct-topbar-h:72px;
  --ct-content-pad:32px;
  --ct-radius:14px;
  --ct-radius-card:10px;
  --ct-radius-pill:99px;
  --ct-app-bg:linear-gradient(135deg,#f8f1e6,#fffaf2 58%,#f3e2c8);
  --ct-app-sidebar-bg:linear-gradient(180deg,#fff8ed 0%,#f7ecd9 50%,#efe0c8 100%);
  --ct-app-sidebar-text:#143327;
  --ct-app-topbar-bg:rgba(255,250,242,.94);
  --ct-app-topbar-border:rgba(161,122,58,.24);
  --ct-app-button-bg:rgba(255,250,242,.88);
  --ct-app-button-border:rgba(161,122,58,.28);
  --ct-app-search-bg:rgba(255,252,247,.96);
  --ct-text:#143327;
  --ct-text-soft:#3a4a3e;
  --ct-text-muted:#8a7b5a;
  --ct-panel-bg:rgba(255,250,242,.92);
  --ct-panel-solid:#fff8ed;
  --ct-card-bg:rgba(255,250,242,.94);
  --ct-panel-border:rgba(161,122,58,.24);
  --ct-border-strong:rgba(161,122,58,.38);
  --ct-line:rgba(20,51,39,.18);
  --ct-accent:#145c38;
  --ct-accent-dark:#0f2e24;
  --ct-accent-soft:#d6a641;
  --ct-signature:#a17a3a;
  --ct-watermark:#9c3a1f;
  --ct-watermark-opacity-sidebar:.16;
  --ct-watermark-opacity-page:.06;
  --ct-status-ok:#145c38;
  --ct-status-pending:#a17a3a;
  --ct-status-rejected:#9c3a1f;
  --ct-font-display:'Playfair Display',Georgia,serif;
  --ct-font-body:'Cormorant Garamond',Georgia,serif;
  --ct-font-ui:'Inter',system-ui,sans-serif;
  --ct-font-mono:'IBM Plex Mono','SF Mono',monospace;
}

html[data-template="enkel"]{
  --ct-app-bg:linear-gradient(135deg,#f8fbff,#ffffff 58%,#eef5fc);
  --ct-app-sidebar-bg:linear-gradient(180deg,#ffffff 0%,#f7fbff 50%,#edf5fc 100%);
  --ct-app-sidebar-text:#0b2a4a;
  --ct-app-topbar-bg:rgba(255,255,255,.96);
  --ct-app-topbar-border:rgba(30,90,154,.16);
  --ct-app-button-bg:rgba(255,255,255,.96);
  --ct-app-button-border:rgba(30,90,154,.18);
  --ct-app-search-bg:rgba(255,255,255,.98);
  --ct-text:#0b2a4a;
  --ct-text-soft:#3a4b62;
  --ct-text-muted:#7a8aa0;
  --ct-panel-bg:rgba(255,255,255,.94);
  --ct-panel-solid:#ffffff;
  --ct-card-bg:rgba(255,255,255,.96);
  --ct-panel-border:rgba(30,90,154,.14);
  --ct-border-strong:rgba(30,90,154,.24);
  --ct-line:#dfeefb;
  --ct-accent:#1e5a9a;
  --ct-accent-dark:#0b2a4a;
  --ct-accent-soft:#9fcdb2;
  --ct-signature:#1e5a9a;
  --ct-watermark:#1e5a9a;
  --ct-watermark-opacity-sidebar:.12;
  --ct-watermark-opacity-page:.04;
  --ct-status-ok:#3d6a58;
  --ct-status-pending:#7a5e2a;
  --ct-status-rejected:#9c3a1f;
  --ct-font-display:'Fraunces',Georgia,serif;
  --ct-font-body:'Inter',system-ui,sans-serif;
}

html[data-template="museum"]{
  --ct-app-bg:radial-gradient(ellipse at 30% 0%,rgba(185,154,85,.06),transparent 50%),linear-gradient(180deg,#1a1a1c,#0d0d0e);
  --ct-app-sidebar-bg:radial-gradient(circle at 50% 0,rgba(185,154,85,.18),transparent 60%),linear-gradient(180deg,#080808 0%,#151515 50%,#080808 100%);
  --ct-app-sidebar-text:#fffaf0;
  --ct-app-topbar-bg:rgba(18,18,18,.9);
  --ct-app-topbar-border:rgba(185,154,85,.24);
  --ct-app-button-bg:rgba(255,255,255,.08);
  --ct-app-button-border:rgba(185,154,85,.28);
  --ct-app-search-bg:rgba(255,255,255,.08);
  --ct-text:#e8e3d6;
  --ct-text-soft:#c5bea9;
  --ct-text-muted:#7a7568;
  --ct-panel-bg:rgba(36,36,36,.9);
  --ct-panel-solid:#181818;
  --ct-card-bg:linear-gradient(180deg,#222226 0%,#1a1a1c 100%);
  --ct-panel-border:rgba(185,154,85,.22);
  --ct-border-strong:rgba(185,154,85,.4);
  --ct-line:rgba(185,154,85,.22);
  --ct-accent:#b99a55;
  --ct-accent-dark:#a17a3a;
  --ct-accent-soft:#d6c082;
  --ct-signature:#a17a3a;
  --ct-watermark:#b99a55;
  --ct-watermark-opacity-sidebar:.14;
  --ct-watermark-opacity-page:.05;
  --ct-status-ok:#8aaf7a;
  --ct-status-pending:#d6c082;
  --ct-status-rejected:#c97a5f;
  --ct-font-display:'Cinzel','Cormorant Garamond',Georgia,serif;
  --ct-font-body:'Source Serif 4','Cormorant Garamond',Georgia,serif;
  --ct-font-ui:'Cinzel','Inter',system-ui,sans-serif;
}

html[data-template="finans"]{
  --ct-app-bg:radial-gradient(ellipse at 80% 0%,rgba(39,167,119,.05),transparent 50%),linear-gradient(180deg,#162028,#111a21);
  --ct-app-sidebar-bg:linear-gradient(180deg,#0c1419 0%,#162028 50%,#0c1419 100%);
  --ct-app-sidebar-text:#dde6ed;
  --ct-app-topbar-bg:rgba(22,32,40,.92);
  --ct-app-topbar-border:rgba(39,167,119,.24);
  --ct-app-button-bg:rgba(255,255,255,.06);
  --ct-app-button-border:rgba(160,185,200,.22);
  --ct-app-search-bg:rgba(255,255,255,.06);
  --ct-text:#dde6ed;
  --ct-text-soft:#a8b8c5;
  --ct-text-muted:#6b7d8c;
  --ct-panel-bg:rgba(28,40,50,.92);
  --ct-panel-solid:#1c2832;
  --ct-card-bg:#1c2832;
  --ct-panel-border:rgba(160,185,200,.12);
  --ct-border-strong:rgba(39,167,119,.32);
  --ct-line:rgba(160,185,200,.12);
  --ct-accent:#27a777;
  --ct-accent-dark:#1f8a5f;
  --ct-accent-soft:#b08a3e;
  --ct-signature:#27a777;
  --ct-watermark:#27a777;
  --ct-watermark-opacity-sidebar:.10;
  --ct-watermark-opacity-page:.04;
  --ct-status-ok:#27a777;
  --ct-status-pending:#b08a3e;
  --ct-status-rejected:#d04b4b;
  --ct-font-display:'IBM Plex Sans',system-ui,sans-serif;
  --ct-font-body:'IBM Plex Sans',system-ui,sans-serif;
  --ct-font-ui:'IBM Plex Sans',system-ui,sans-serif;
}

html[data-vp="mobile"] .ct-container{max-width:430px}
html[data-vp="tablet"] .ct-container{max-width:780px}
html[data-vp="pc"] .ct-container{max-width:1280px}
html[data-vp="wide"] .ct-container{max-width:1840px}
html[data-vp="tv"]{--ct-font-base:calc(var(--ct-font-base) * 1.18);--w-display:900;--w-body:500;--w-ui:700}
html[data-vp="tv"] .ct-container{max-width:2200px}

:root{
  --ct-design-rule: "GLOBAL_TEMPLATE_ONLY";
  --ct-ai-tags: "collectium,template,global-design,skin,color,tokens,signature,anno-2022,sidebar,topbar,catalog,cards,forms,tabs,feeds";
}
{
  "document_type": "collectium_ai_robot_design_index",
  "version": "V5",
  "source_zip": "V5 Collectium template designe.zip",
  "source_html": "collectium-design-system.html",
  "purpose": "Make Collectium global template, colors, skins and design rules easy for AI/Codex/developers to find before creating or changing pages.",
  "must_read_before": [
    "changing global layout",
    "creating new page",
    "creating component with visual design",
    "changing colors",
    "changing template skin",
    "changing topbar/sidebar",
    "creating catalog/object/min-side/admin UI"
  ],
  "locked_rule": "Design lives in global template/layout/token layer. Ordinary pages must not define backgrounds, frames, borders, shadows, shell styling or visual signature styling.",
  "template_keys": ["collectium", "enkel", "museum", "finans"],
  "default_template": "collectium",
  "viewport_keys": ["mobile", "tablet", "pc", "wide", "tv"],
  "default_viewport": "pc",
  "tokens_prefix": "--ct-",
  "primary_tokens": [
    "--ct-app-bg",
    "--ct-app-sidebar-bg",
    "--ct-app-topbar-bg",
    "--ct-panel-bg",
    "--ct-panel-solid",
    "--ct-card-bg",
    "--ct-panel-border",
    "--ct-border-strong",
    "--ct-line",
    "--ct-text",
    "--ct-text-soft",
    "--ct-text-muted",
    "--ct-accent",
    "--ct-accent-dark",
    "--ct-accent-soft",
    "--ct-signature",
    "--ct-watermark",
    "--ct-status-ok",
    "--ct-status-pending",
    "--ct-status-rejected",
    "--ct-font-display",
    "--ct-font-body",
    "--ct-font-ui",
    "--ct-font-mono",
    "--ct-radius",
    "--ct-radius-card",
    "--ct-radius-pill",
    "--ct-content-pad"
  ],
  "components_controlled_by_template": [
    "AppShell",
    "Sidebar",
    "Topbar",
    "MobileMenu",
    "PageFrame",
    "PageContent",
    "CollectiumSignatureFrame",
    "cards",
    "panels",
    "buttons",
    "form fields",
    "tabs",
    "chips",
    "status badges",
    "activity feed",
    "ticker",
    "ANNO 2022 watermark/stamp"
  ],
  "ai_search_keywords": [
    "robot template global design",
    "Collectium V5 design system",
    "global design color",
    "template skin collectium enkel museum finans",
    "ct tokens",
    "signature frame",
    "ANNO 2022 stamp",
    "sidebar topbar global shell",
    "no page-specific design",
    "Collectium designmotor"
  ],
  "forbidden_in_ordinary_pages": [
    "hardcoded background colors",
    "hardcoded text colors",
    "local box shadows",
    "local card/panel borders",
    "local shell/grid layout",
    "local sidebar/topbar styling",
    "duplicated signature styling",
    "new non-token color names"
  ],
  "allowed_in_ordinary_pages": [
    "semantic component choice",
    "content order",
    "data mapping",
    "feature_key/API bindings",
    "segment/view state",
    "template-approved class names"
  ]
}



```
