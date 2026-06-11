# Collectium UI 8.5 v36 — React / Next.js package

Denne pakken følger ønsket struktur:

```txt
app/
├── providers/
│   └── theme-provider.tsx
│
├── styles/
│   ├── themes.css
│   └── collectium-ui85-v36.css
│
├── layout.tsx
└── page.tsx
```

## Oppdatert konklusjon

Bruk én samlet token-fil:

```txt
app/styles/themes.css
```

Ikke bruk separate filer for collectium.css, samler.css, museum.css og finans.css nå.

Alle fire temaer styres med samme tokennavn:

```css
html[data-theme="collectium"]
html[data-theme="samler"]
html[data-theme="museum"]
html[data-theme="finans"]
```

Komponent-CSS ligger samlet i:

```txt
app/styles/collectium-ui85-v36.css
```

## ThemeProvider

`app/providers/theme-provider.tsx` setter både:

```txt
document.documentElement.dataset.theme
document.documentElement.dataset.skin
```

og lagrer aktivt tema i:

```txt
ct-active-skin-v2
```

## Signaturregel

`.collectium-card::after` legger inn:

```txt
Collectium anno 2022
```

Den skjules automatisk i veldig små containere med container query.

## Produksjonsregel

`app/page.tsx` bruker eksempeldata for UI-preview. I produksjon skal objektdata hentes via API/backend, og objekt skal slås opp med:

```txt
source_key + object_group + object_id
```

Eksempelroute:

```txt
/objekt/norske_sedler/banknote/1459?segment=historie&from=katalog&view=horizontal
```
