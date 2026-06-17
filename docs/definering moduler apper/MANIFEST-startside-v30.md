# MANIFEST — Collectium startside / landingsside v30

## Change

```txt
CHANGE-2026-06-05-START-V30
```

## Repository

```txt
tsandvin/collectium-app-8mai26
branch: main
```

## Added files

```txt
app/startside/page.tsx
app/landingsside/page.tsx
components/templates/CollectiumStartTemplate.tsx
components/templates/CollectiumStartTemplate.module.css
components/layout/CollectiumPublicTopbar.tsx
components/layout/CollectiumPublicSidebar.tsx
components/startside/CollectiumStartContent.tsx
public/robots.txt
docs/README-startside-v30.md
docs/MANIFEST-startside-v30.md
```

## Not changed

```txt
app/layout.tsx
app/page.tsx
components/layout/AppShell.tsx
components/layout/Topbar.tsx
components/layout/Sidebar.tsx
styles/globals.css
lib/db/*
lib/auth/*
lib/access/*
app/api/*
```

## Routes

```txt
/startside
/landingsside
```

## Template rule

```txt
Sidefiler leverer innhold.
Template styrer shell, topbar, sidemeny, rammer, signatur og responsivitet.
```

## Feature keys

```txt
landing.view
landing.register
landing.login
landing.membership
catalog.view
index.view
auction.public.view
dealer.public.view
```

## Future API/data

```txt
GET /api/catalog/featured
GET /api/index/market-preview
GET /api/membership/plans
GET /api/menu/public
GET /api/auth/session
```

## Vercel build note

Vercel feilet på commit `95a341b` fordi CSS-modulen og innholdskomponenten ikke var med i den commit-en. Siste relevante fix er lagt inn etterpå, inkludert:

```txt
components/startside/CollectiumStartContent.tsx
components/templates/CollectiumStartTemplate.module.css
```
