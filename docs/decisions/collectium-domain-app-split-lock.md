# Collectium domain and app split lock

Status: LOCKED

Decision:

collectium.no
= offentlig nettside / presentasjon / informasjon / inngang

app.collectium.no
= Next.js / React-applikasjon
= startside, login, registrering, katalog, Min side, samling og senere admin/forhandler/auksjon

Rules:

- Do not move login, Min side, Katalog or app functions to collectium.no.
- collectium.no may link to app.collectium.no.
- app.collectium.no owns application routes.
- App pages must remain inside the global AppShell.
- Do not add local sidebar/topbar/page shell inside ordinary pages.
- Public marketing content belongs on collectium.no or later landing modules.
- App startside is an application gateway, not the full public marketing website.

Routes:

https://collectium.no
= public website

https://app.collectium.no/
= app gateway

https://app.collectium.no/startside
= app startside

https://app.collectium.no/login
= login

https://app.collectium.no/min-side
= user control center

https://app.collectium.no/katalog
= catalog
