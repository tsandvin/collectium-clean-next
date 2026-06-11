# Collectium Deploy Motor v1

Dato: 2026-06-11 02:31:09
Mode: Check
Branch: feature/collectium-deploy-motor-update
CommitMessage: Update Collectium app
Prosjektrot: C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next


## Collectium Deploy Motor v1

- INFO: Prosjektrot: C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next
- INFO: Rapport: C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next\docs\deploy-reports\collectium-deploy-motor-Check-20260611-023109.md

## 1. Prosjektrot og kjernefiler

- OK: package.json
- OK: app
- OK: app\layout.tsx
- OK: next.config.ts
- OK: tsconfig.json
- OK: package.json har build-script

## 2. Secrets-sjekk

- OK: Ikke tracked: .env
- OK: Ikke tracked: .env.local
- OK: Ikke tracked: .env.production
- OK: Ikke tracked: .env.development
- VARSEL: Mulige secrets funnet i kode. Kontroller manuelt foer deploy.
  - C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next\app\api\system\migration\import-catalog-staging\route.ts:127

## 3. Template, layout og skin

- OK: app/layout.tsx importerer collectium-skins.css
- OK: app/layout.tsx bruker CollectiumSkinProvider
- OK: app/styles/collectium-skins.css finnes
- OK: Skin finnes i CSS: collectium
- OK: Skin finnes i CSS: samler
- OK: Skin finnes i CSS: museum
- OK: Skin finnes i CSS: finans
- OK: Token finnes: --ct-shell-sidebar-bg
- OK: Token finnes: --ct-shell-topbar-bg
- OK: Token finnes: --ct-field-bg
- OK: Token finnes: --ct-card-bg
- OK: Token finnes: --ct-accent

## 4. Git-status

- INFO: Aktiv branch: feature/collectium-four-skins-shell-fields
```text
 M app/design/ui85/page.tsx
?? app/components/templates/
?? app/docs/templates/
?? app/scripts/
?? manifest/
```

## 9. Vercel

- INFO: Vercel CLI funnet: C:\Users\Bruker\AppData\Roaming\npm\vercel.ps1
- Vercel CLI funnet.
- GitHub push er hovedtrigger for Vercel i denne motoren.

## 10. Svar til ChatGPT

```text
COLLECTIUM DEPLOY MOTOR
Mode: Check
Branch: feature/collectium-deploy-motor-update
Deploy gate: AOPEN MED VARSLER
Build: se rapport over
Git push: se rapport over
Vercel: GitHub integration forventes aa deploye ved push/merge
Rapport: C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next\docs\deploy-reports\collectium-deploy-motor-Check-20260611-023109.md
```
