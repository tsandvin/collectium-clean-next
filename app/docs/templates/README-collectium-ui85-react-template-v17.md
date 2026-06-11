# Collectium UI 8.5 React Template v17

## Formål

Denne pakken installerer en kontrollert React/Next.js-template for Collectium UI 8.5. Den installerer ikke en HTML-preview som produksjonsfil.

## Route

```txt
/design/ui85
```

## Filer som legges inn

```txt
app/design/ui85/page.tsx
components/templates/ui85/CollectiumUi85Template.tsx
components/templates/ui85/CollectiumUi85Template.module.css
components/templates/ui85/CollectiumUi85ObjectPreview.tsx
components/templates/ui85/CollectiumUi85ObjectPreview.module.css
components/templates/ui85/CollectiumUi85Icons.tsx
components/templates/ui85/collectium-ui85-types.ts
```

## Standardregler

```txt
- Dette er React-kode og CSS-moduler, ikke installert HTML.
- Template eier rammer, skall, sidebar, topbar, page frame og signaturhjorne.
- Vanlige sider skal ikke eie eget shell/topbar/sidebar.
- Ikoner er inline SVG, store, uten egen ramme/boks/bakgrunn.
- Finans bruker 6px radius på knapper og brytere.
- Finans bruker gul/amber aksent på små felt der grønn blir for svak.
- Hover bruker tydeligere farget bunnlinje under tekst/rad.
- Scriptet overskriver ikke app/layout.tsx, app/page.tsx eller globals.css.
```

## Rollback

Installer-scriptet lager rollback-manifest i:

```txt
docs/deploy-manifests/
```

Rollback kan kjøres med `-Rollback -RollbackManifestPath <manifest.json>`.
