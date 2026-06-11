# Collectium Min side React arkivmappe v1

Dette er en ekte Next.js/React-implementasjon av **Min side** med arkivmappe-design.

## Innhold

```text
app/min-side/page.tsx
components/account/MinSideShell.tsx
components/account/MinSideArchiveTabs.tsx
components/account/MinSideOverview.tsx
components/account/MinSidePanel.tsx
components/account/MinSide.module.css
components/account/min-side-data.ts
components/account/min-side-types.ts
```

## Viktig

Dette er ikke HTML-preview. Dette er Next.js App Router + React-komponenter.

Første versjon bruker fallback/mock-data i:

```text
components/account/min-side-data.ts
```

Produksjonsdata skal senere hentes via:

```text
GET /api/auth/session
GET /api/account/overview
GET /api/account/activity
GET /api/account/processes
GET /api/account/transactions
GET /api/account/notifications
GET /api/account/messages
GET /api/account/documents
GET /api/account/security
```

## Designregel

Komponentene lager ikke egen sidebar, topbar, body eller global layout. De er ment å ligge inne i eksisterende Collectium AppShell/PageFrame.

## Rolleregler

Forhandler og Admin vises som låste arkivmapper i første versjon. De skal senere åpnes basert på session/access:

```text
role = dealer
is_admin = true
```

## Backup og rollback

Bruk scriptet:

```text
scripts/install-min-side-react-arkivmappe-v1.ps1
```

Scriptet kan installere, ta backup, lage manifest, opprette branch, committe, pushe og rulle tilbake.
