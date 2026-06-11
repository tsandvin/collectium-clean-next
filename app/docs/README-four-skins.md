# Collectium Four Skins UI 8.5

Denne pakken legger inn fire globale skin-retninger:

1. Collectium
2. Samler
3. Museum
4. Finans

## Prinsipp

- Samme markup / samme struktur i alle skins.
- Skin bytter kun tokens: farge, kontrast, typografi, stemning, radius og shadow.
- Skin skal ikke endre datastruktur, API, DB-kobling, katalogfilter, object key eller relasjonslogikk.
- Vanlige sider skal ikke eie egen skinmotor.

## Filer

```text
styles/collectium-skins.css
components/layout/CollectiumSkinProvider.tsx
components/ui/CollectiumSkinPreview.tsx
scripts/install-four-skins.ps1
```

## Import

Legg global import i `app/layout.tsx` eller i `styles/globals.css`:

```ts
import "../styles/collectium-skins.css";
```

eller:

```css
@import "./collectium-skins.css";
```

## Midlertidig skinvelger

For preview kan `CollectiumSkinProvider` legges rundt `{children}` i layout. Før produksjon kan den fjernes eller flyttes til admin/design-preview.

## Trygg installasjon

Kjør fra prosjektroten:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-four-skins.ps1
```

Scriptet tar backup av filer som finnes fra før.
