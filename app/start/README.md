# Collectium · Startside (`/start`)

Startside for **app.collectium/start**. Full bredde under den globale toppmenyen,
**ingen sidemeny**. Bygget på det globale skin-systemet — filene definerer ingen
egne farger/fonter, kun layout, skin-baserte bakgrunner, SVG-grafikk og animasjon.

## Filer
| Fil | Rolle |
|-----|-------|
| `app/start/page.tsx` | Server-side (App Router). Metadata + rendrer klienten. |
| `app/start/layout.tsx` | Rute-layout. Markerer «topbar-only» (ingen sidemeny). |
| `app/start/StartChrome.tsx` | Klienthjelper. Setter `data-ct-chrome="topbar-only"`. |
| `app/start/StartClient.tsx` | Innhold: periodesøk, mnd/år-bryter, reveal-animasjon. |
| `app/start/StartArt.tsx` | Skin-baserte SVG-illustrasjoner + ANNO 2022-stempel. |
| `app/start/start.module.css` | Side-scoped CSS. Leser kun `--ct-*`-tokens. |

## Tokens (riktig mappet mot din `globals.css`)
Alle tokens leses ett sted, øverst i `start.module.css` under `.page` (aliasene
`--s-*`). Mappingen bruker nå dine faktiske tokens:

- Bakgrunn/paneler: `--ct-content-bg`, `--ct-content-panel`, `--ct-content-panel-soft`
- Tekst: `--ct-content-text`, `--ct-content-muted`
- Kant/aksent: `--ct-content-border`, `--ct-content-accent`, `--ct-content-accent-soft`
- Knappetekst: `--ct-on-accent` (hvit i lyse tema, mørk i Museum/Finans)
- Gull-detalj: `--ct-accent-2`
- Tidslinje: `--ct-timeline-national/-historical/-period/-century/-object`
- Font: `--ct-font-display` (overskrift, kursiv) og `--ct-font-body`

Skifter du et token-navn, endre **kun** aliaset i `.page` — ikke nedover i koden.
Hvert alias har fallback, så siden rendrer pent uansett.

## Skin-baserte bakgrunner
Seksjonene veksler mellom skin-tonede felt: `.soft` (accent-vask over panel-soft),
`.deep` (panel-soft → bg) og `.tint` (accent-glød). Alt hentes fra `--ct-*`, så
fargene følger aktivt tema (Collectium / Samler / Museum / Finans).

## Ingen sidemeny — kun toppmeny
`layout.tsx` setter `data-ct-chrome="topbar-only"` på `<html>` mens `/start` er
aktiv. Toppmenyen arves fra rot-layouten. Gat sidemenyen i `CollectiumAppShell`:

```tsx
"use client";
import { usePathname } from "next/navigation";
// ...
const topbarOnly =
  document.documentElement.getAttribute("data-ct-chrome") === "topbar-only" ||
  usePathname()?.startsWith("/start");

return (
  <div className="ct-v7-shell" data-chrome={topbarOnly ? "topbar-only" : "full"}>
    <Topbar />
    {!topbarOnly && <Sidebar />}
    <main className="collectium-content">{children}</main>
  </div>
);
```

Alternativ uten å røre AppShell — legg i `globals.css` (juster selector til din
faktiske sidemeny-node):

```css
html[data-ct-chrome="topbar-only"] .ct-v7-shell > nav,      /* sidemeny */
html[data-ct-chrome="topbar-only"] .ct-v7-shell > aside { display: none; }
html[data-ct-chrome="topbar-only"] .ct-v7-master-grid { grid-template-columns: 1fr; }
```

## Grafikk (ekte, ikke plassholdere)
Illustrasjonene i `StartArt.tsx` er SVG som re-skinnes med tema:
seddel (objektkort), kart + kompass (quote), samler-kort, krone (historie),
index-graf (finans). Vil du bruke fotografier i stedet, bytt `<… Art />` til
`<img>` der det er kommentert i `StartClient.tsx`.

## ANNO 2022-stempel
`AnnoStamp` er bygget på Collectium-merket: ytre stensilring med fire kardinale
gap + indre C med rett, rektangulær åpning mot høyre, og «ANNO» (liten) over
«2022» (stor). Det ligger som svakt vannmerke bak slutt-CTA-feltet (`.stamp`).
Flytt det ved å legge `.stampField` + `<div className={s.stamp}><AnnoStamp/></div>`
i en annen seksjon.

## Ekte lenker
- Objektpresentasjon: `/objekt/norske_sedler/banknote/9` (10 kr · 1979 · BH).
- Relasjonsside: `/relasjon/regent/olav-v`.
- Søk/periode: `/katalog?sok=…&periode=…`.
- Medlemskap-CTA: `/registrer`, `/registrer?niva=…`, `/medlemskap`.

## Medlemskap
Bronse · **Sølv** (hevet, «Beste valg») · Gull + gratis-felt over. Priser viser
kampanjepris (−50 %) via `half()`; full pris er overstrøket. mnd/år-bryter.
Platinum (kun årlig) og Forhandler (obligatorisk Gull) som callouts under.
Tall/priser ligger i `TIERS`/`ERAS` øverst i `StartClient.tsx`.

## Bakgrunnsvariasjon, vannmerker og felt-toning (oppdatert)
- Seksjonene veksler mellom skin-baserte bånd: `.soft`, `.panel`, `.tint`,
  `.deep`, `.veil` og `.ctaPhoto` — ingen to nabofelt er like.
- Hvert felt/kort har nå svak skin-tonet bakgrunn (`--s-card` = ~5 % accent over
  panel). Juster styrken ett sted i `.page`-blokken (`--s-card` / `--s-card-soft`).
- Vannmerker: store svake display-tall («2022», «800») via `.sectionWm > .wm`,
  ANNO 2022-stempelet (`AnnoStamp`) bak quote-feltet, og gull-C-merket som svakt
  bilde-vannmerke bak målsetting-feltet. Alle ligger bak innholdet (z-index 0).

## Merkevare-assets (i `public/collectium/`)
| Fil | Bruk |
|-----|------|
| `mark-gold.png` | Gull C-merke: hero-brand, footer, CTA, vannmerke. |
| `logo-black.png` | Ordmerke for lyse tema (Collectium/Samler). |
| `logo-white.png` | Ordmerke for mørke tema (Museum/Finans). Byttes via `[data-theme]`. |
| `family.jpg` | Familiebilde — falmet bakgrunn i slutt-CTA (`.ctaPhoto`). |

Logo-bytte skjer i CSS: på Museum/Finans vises `logo-white`, ellers `logo-black`.
Familiebildet legges over med en `--s-bg`-tonet gradient, så teksten er lesbar i
alle fire tema. Bytt bildeutsnitt med `background-position` i `.ctaPhoto`.
