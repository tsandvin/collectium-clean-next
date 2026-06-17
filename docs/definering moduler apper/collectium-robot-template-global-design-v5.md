\# Collectium app 8mai26 — AI-, fil-, URL-, DB-, design- og sikkerhetsregler



\## 1. Formål



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



\---



\## 2. Hovedregel



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

object\_id

source\_key

object\_group

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



\---



\## 3. Sikkerhetsregel for eksterne, crawlers og AI-bots



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



\---



\## 4. AI-blocker og crawler-blocker



Prosjektet skal ha tekniske barrierer mot uønsket crawling og AI-trening.



\### 4.1 robots.txt



Det skal finnes:



```txt

public/robots.txt

```



Standardregel:



```txt

User-agent: \*

Disallow: /

```



Dette blokkerer standard crawling av hele appen.



Dersom det senere åpnes offentlige sider, skal de åpnes eksplisitt. Eksempel:



```txt

User-agent: \*

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



\### 4.2 AI crawler-regel



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



\### 4.3 Middleware-blocker



Det skal senere vurderes `middleware.ts` for å blokkere uønskede user-agents på runtime-nivå.



Eksempel på beskyttede områder:



```txt

/admin

/admin/\*

/api

/api/\*

/min-side

/min-side/\*

/samling

/samling/\*

/forhandler

/forhandler/\*

/katalog

/katalog/\*

/objekt

/objekt/\*

```



Middleware skal aldri være eneste sikkerhet. Den skal være ekstra lag før auth/API/DB-check.



\---



\## 5. Ingen intern informasjon til offentlig frontend



Frontend skal ikke eksponere:



```txt

DB\_HOST

DB\_NAME

DB\_USER

DB\_PASSWORD

SESSION\_SECRET

NEXTAUTH\_SECRET

interne table names som ikke trengs i UI

interne API-feil med stack trace

admin feature\_keys for ikke-admin

private access rules

private user\_id-er

e-postadresser

telefonnummer

betalingsinformasjon

systemdiagnose

rå SQL

databasefeil

```



Følgende skal aldri bruke `NEXT\_PUBLIC\_`:



```txt

DB\_HOST

DB\_NAME

DB\_USER

DB\_PASSWORD

SESSION\_SECRET

NEXTAUTH\_SECRET

API\_PRIVATE\_KEY

ADMIN\_TOKEN

INTERNAL\_SECRET

```



Kun informasjon som trygt kan vises i nettleseren kan ha `NEXT\_PUBLIC\_`.



\---



\## 6. API-sikkerhet



Alle API-ruter skal ha:



```txt

inputvalidering

session-check der nødvendig

rolle-check

membership-check

feature\_key-check

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

&#x20; "ok": false,

&#x20; "error\_code": "ACCESS\_DENIED",

&#x20; "message": "Du har ikke tilgang til denne funksjonen.",

&#x20; "data": null,

&#x20; "errors": \[]

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



\---



\## 7. DB 8.4-regel



Alle systemhandlinger skal kobles til DB 8.4-kjeden:



```txt

ct\_app\_pages

→ ct\_app\_page\_features

→ ct\_app\_features

→ ct\_feature\_access\_rules

→ ct\_v\_feature\_access\_resolved

→ ct\_feature\_action\_routes

→ API

→ MariaDB table/view

→ logg

```



Ingen React-knapp skal være en løs systemhandling.



En knapp må være én av disse:



```txt

1\. koblet til feature\_key + API/action-route

2\. deaktivert med forklaring

3\. ren lokal UI-/template-kontroll

```



Eksempel:



```txt

Knapp: Legg til ønskeliste

feature\_key: collection.wishlist.toggle

API-route: /api/collection/wishlist/toggle

write\_table: ct\_user\_object\_states

log\_action: wishlist.toggle

```



\---



\## 8. Dataflyt



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



\---



\## 9. Filregel



Ingen filer skal være løse, uklare eller flerbruksfiler.



Hver fil skal ha:



```txt

1\. én tydelig oppgave

2\. én definert plass i filstrukturen

3\. forklaring på hva filen brukes til

4\. definerte routes/URL-er den påvirker

5\. definerte DB-koblinger eller eksplisitt "ingen DB-kobling"

6\. definerte feature\_keys / funksjoner

7\. definerte API-ruter dersom relevant

8\. tags for innholdssøk

```



AI skal ikke lage filer uten å forklare hvorfor filen finnes.



\---



\## 10. Obligatorisk filheader



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

/\*\*

&#x20;\* COLLECTIUM FILE HEADER

&#x20;\*

&#x20;\* Filnavn:

&#x20;\* \[filnavn]

&#x20;\*

&#x20;\* Definering:

&#x20;\* \[kort definisjon av hva filen er]

&#x20;\*

&#x20;\* Formål:

&#x20;\* \[hva filen skal gjøre]

&#x20;\*

&#x20;\* Bruksområde:

&#x20;\* \[hvor filen brukes]

&#x20;\*

&#x20;\* Berørte URL-er / routes:

&#x20;\* - /katalog

&#x20;\* - /objekt/\[sourceKey]/\[objectGroup]/\[objectId]

&#x20;\*

&#x20;\* Berørte DB-brytere / feature\_keys:

&#x20;\* - catalog.view

&#x20;\* - catalog.search

&#x20;\*

&#x20;\* Berørte API-ruter:

&#x20;\* - GET /api/catalog/search

&#x20;\*

&#x20;\* Berørte tabeller / views:

&#x20;\* - ct\_v\_catalog\_objects\_resolved

&#x20;\*

&#x20;\* DB-kobling:

&#x20;\* MariaDB via API/server layer

&#x20;\*

&#x20;\* Designkobling:

&#x20;\* Global template / global skin / ingen lokal sidedesign

&#x20;\*

&#x20;\* Tags:

&#x20;\* collectium, katalog, source\_key, object\_group, object\_id

&#x20;\*

&#x20;\* Endringsregel:

&#x20;\* Filen skal kun brukes til formålet definert her.

&#x20;\*/

```



Hvis filen ikke bruker database:



```txt

DB-kobling:

Ingen direkte DB-kobling. Filen er kun visning/layout/template.

```



\---



\## 11. URL-regler



Alle frontend-visninger skal ha egne sider/routes i `app/`.



Det skal finnes egne sider for alle hovedflater:



```txt

app/page.tsx

app/katalog/page.tsx

app/katalog/\[sourceKey]/page.tsx

app/objekt/\[sourceKey]/\[objectGroup]/\[objectId]/page.tsx

app/relasjon/\[relationType]/\[relationKey]/page.tsx

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



\---



\## 12. Objekt-URL



Objekter skal alltid slås opp med:



```txt

source\_key + object\_group + object\_id

```



Riktig URL:



```txt

/objekt/norske\_sedler/banknote/1459

```



Riktig Next.js-route:



```txt

app/objekt/\[sourceKey]/\[objectGroup]/\[objectId]/page.tsx

```



Ikke bruk bare:



```txt

/objekt/1459

```



Slug kan brukes senere for lesbarhet, men må aldri være teknisk sannhet.



\---



\## 13. Katalogfilter-regel



Filter skal alltid være source-scoped:



```txt

source\_key + object\_group + filter\_field + filter\_value

```



Frontend skal ikke blande filterverdier fra sedler, mynter eller andre kilder.



For Norske sedler:



```txt

source\_key = norske\_sedler

object\_group = banknote

```



\---



\## 14. Filstruktur



Prosjektet skal følge denne strukturen:



```txt

app/

&#x20; layout.tsx

&#x20; page.tsx

&#x20; katalog/

&#x20; objekt/

&#x20; relasjon/

&#x20; index/

&#x20; min-side/

&#x20; samling/

&#x20; auksjon/

&#x20; forhandler/

&#x20; admin/

&#x20; api/



components/

&#x20; layout/

&#x20; templates/

&#x20; ui/

&#x20; catalog/

&#x20; object/

&#x20; relations/

&#x20; index/

&#x20; collection/

&#x20; auction/

&#x20; dealer/

&#x20; admin/



lib/

&#x20; db/

&#x20; auth/

&#x20; access/

&#x20; api/

&#x20; logging/

&#x20; formatters/

&#x20; mappers/

&#x20; types/



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



\---



\## 15. Filansvar



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



\---



\## 16. Designregel



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



\---



\## 17. Global sidemeny og toppmeny



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



\---



\## 18. Template- og skin-regel



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



\---



\## 19. Globale template-skins



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



\---



\## 20. Krav per skin



\### template-skin-collectium



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



\### template-skin-finans



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



\### template-skin-bla



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



\### template-skin-historie



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



\### template-skin-samler



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



\### template-skin-admin



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



\---



\## 21. Hjørnesignatur, indre ramme og luft



Alle informasjonsbokser, kort, paneler, felt og moduler i Collectium skal støtte en standard hjørnesignatur i indre ramme.



Hjørnesignaturen er en del av Collectium sitt globale designsystem og skal ikke lages manuelt inne i hver enkelt side eller komponent.



\### 21.1 Standard hjørnesignatur



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



\### 21.2 Luft på alle fire sider



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



\### 21.3 Signatur-safe-zone



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

\--ct-card-padding-top: 16px;

\--ct-card-padding-right: 16px;

\--ct-card-padding-bottom: 28px;

\--ct-card-padding-left: 16px;



\--ct-signature-safe-zone-right: 72px;

\--ct-signature-safe-zone-bottom: 18px;



\--ct-signature-font-size: 10px;

\--ct-signature-color: var(--ct-muted-gray);

```



\### 21.4 Forbudt plassering



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



\---



\## 22. Hover-animasjon



Alle skins skal ha hover-effekt på interaktive kort, paneler og knapper.



Minimum:



```txt

hover:

\- svak transform eller løft

\- animert skygge

\- tydeligere ramme

\- varighet 120–220ms

```



Ved hover med mus skal interaktive bokser animere med skygge.



Dette skal defineres globalt i skin/template, ikke lokalt per side.



\---



\## 23. Responsivitet



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



\---



\## 24. Katalogsegmenter



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



\---



\## 25. Standard API-respons



Alle API-ruter skal returnere standard respons.



Eksempel:



```json

{

&#x20; "ok": true,

&#x20; "feature\_key": "catalog.search",

&#x20; "source": "mariadb",

&#x20; "data": {},

&#x20; "access": {

&#x20;   "allowed": true,

&#x20;   "reason": null

&#x20; },

&#x20; "meta": {

&#x20;   "read\_view": "ct\_v\_catalog\_objects\_resolved"

&#x20; },

&#x20; "errors": \[]

}

```



\---



\## 26. Tags for innholdssøk



Alle hovedfiler skal ha tags i header.



Eksempler:



```txt

Tags:

collectium, app-8mai26, katalog, catalog.search, source\_key, object\_group, object\_id

```



```txt

Tags:

collectium, admin, db-8.4, feature\_key, action\_route, systemstatus

```



```txt

Tags:

collectium, template-skin-admin, global-design, topbar, sidebar, hjornesignatur

```



Tags skal gjøre det mulig for AI og utviklere å søke etter filer etter funksjon, side, DB-kobling og designområde.



\---



\## 27. Endringsregel



Før AI endrer en fil, skal AI svare på:



```txt

1\. Hvilken fil endres?

2\. Hvorfor endres den?

3\. Hvilken route påvirkes?

4\. Hvilken feature\_key påvirkes?

5\. Hvilken API-rute påvirkes?

6\. Hvilken DB-tabell/view påvirkes?

7\. Er filen riktig sted?

8\. Bryter endringen global designregel?

9\. Bryter endringen sikkerhetsregel?

10\. Kan endringen lekke intern informasjon?

11\. Må ny fil heller opprettes?

12\. Må dokumentasjon oppdateres?

```



Hvis svaret er uklart, skal AI ikke endre filen.



\---



\## 28. Forbudte mønstre



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

bruke object\_id uten source\_key og object\_group

lage knapper uten feature\_key hvis de gjør systemhandlinger

eksponere DB-struktur offentlig

eksponere secrets

eksponere intern adminstatus offentlig

eksponere API-feil med stack trace

åpne private routes for crawling

bruke robots.txt som eneste sikkerhet

```



\---



\## 29. Godkjente mønstre



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

bruke object\_id + object\_group + source\_key

bruke source-scoped filter

skrive filheader

legge inn tags

dokumentere DB-kobling

dokumentere route-kobling

dokumentere feature\_key

beskytte private routes

legge robots.txt i public/

vurdere middleware for bot-blocking

skille offentlig informasjon fra privat systemdata

```



\---



\## 30. Kort låseregel



```txt

Collectium app 8mai26 skal bygges som en ren Next.js/React-applikasjon der alle frontend-visninger har egne sider, alle designvalg styres globalt av template-skins, alle systemhandlinger kobles til DB 8.4/API/MariaDB, alle filer har én tydelig definisjon, ett bruksområde, dokumenterte koblinger og søkbare tags, og all privat informasjon beskyttes mot uautorisert tilgang, crawling, scraping og AI-innhenting.

```

\## Prosjekteier



Owner / Founder:

Tommy Sandvin



Kontakt:

tommy@collectium.no



Prosjekt:

Collectium app 8mai26



Domene:

app.collectium.no

