# Collectium · Startside (`/start`)

Forslag til startside for **app.collectium/start**. Full bredde under den globale
toppmenyen, **ingen sidemeny**. Bygget på det globale skin-/tema-systemet —
filene definerer ingen egne farger eller fonter, kun layout + animasjon.

## Filer
| Fil | Rolle |
|-----|-------|
| `app/start/page.tsx` | Server-side (App Router). Metadata + rendrer klienten. |
| `app/start/StartClient.tsx` | Klientkomponent. Periodesøk, mnd/år-bryter, reveal-animasjon, alt innhold. |
| `app/start/start.module.css` | Side-scoped CSS. Leser kun `--ct-*`-tokens. |

## Slik kobles den inn
1. Legg mappen `app/start/` inn i prosjektet.
2. `app/globals.css` (skin + ramme) må være importert i rot-`layout.tsx` som før.
   Siden bruker `.ct-surface`, `.ct-sig`, `.ct-hover` og hjørnesignaturen derfra.
3. **Ingen sidemeny:** hvis rot-layouten din legger inn en sidebar globalt, gi
   `/start` en layout uten den — enten via `app/start/layout.tsx` som kun rendrer
   toppmeny + `{children}`, eller via ditt `data-ct-screen`/skjerm-system slik at
   denne ruten kjøres i full-bredde uten venstremeny. Toppmenyen (`Topbar`) arves
   fra rot-layouten.

## Tema / tokens
Tema styres som ellers via `data-theme` på `<html>` (collectium / samler / museum /
finans). Siden endrer **kun tokens** ved temaskifte — aldri struktur.

Alle tokens leses ett sted, øverst i `start.module.css` under `.page` (aliasene
`--s-*`). Stemmer ikke et globalt token-navn med ditt sett (f.eks. `--ct-accent`),
bytt det **der** — ikke nedover i koden. Hvert alias har en fallback så siden
rendrer pent selv uten alle tokens.

## Bilder
Bildefeltene er foreløpig merkede plassholdere (de viser forventet filnavn).
Bytt hver `<div className={s.*Img}>…</div>` til et `<img>` når filene finnes:

- Objektkort: `/bilder/objekt/norske-sedler-9.webp`
- Quote: `/bilder/start/quote-polfarer.webp`
- Tre perspektiver: `02_samler-collectium.webp`, `03_historie-konge-regent-collectium.webp`,
  `04_finans-markedsindex-collectium.webp` (f.eks. under `/bilder/start/`).

## Ekte lenker (krav fra brief)
- Objektpresentasjon: `/objekt/norske_sedler/banknote/9` (10 kr · 1979 · BH).
- Relasjonsside: `/relasjon/regent/olav-v`.
- Søk/periode peker til `/katalog?sok=…&periode=…`.
- CTA-er peker til `/registrer`, `/registrer?niva=…` og `/medlemskap`.

## Medlemskap-logikk
- Tre kjøpbare nivåer vises: **Bronse**, **Sølv** (hevet — «Beste valg»), **Gull**.
- **Gratis** start vises som eget felt over nivåene.
- Prisene viser **kampanjepris (−50 %)** automatisk: `half(base)` rundes, full pris
  vises overstrøket. Slå av kampanjen ved å vise `base` i stedet for `half(base)` i
  `StartClient.tsx` (to steder i `.priceNow`/`.priceWas`).
- **mnd/år-bryter** bytter mellom `t.mnd` og `t.aar`.
- **Platinum** vises som eget årlig-callout (kun årlig).
- **Forhandler** vises som callout: obligatorisk Gull (kan være Platinum).
- Datapakker (+): kun årlig — nevnt på nivåene og i sammenlign-lenken.

Tallene (priser, kapasitet, teaser-antall pr. periode) ligger samlet i
`TIERS`/`ERAS` øverst i `StartClient.tsx` — endre der.
