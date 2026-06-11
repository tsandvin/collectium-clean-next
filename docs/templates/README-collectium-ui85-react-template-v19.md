# Collectium UI85 React Template v19

Dette er UI85 innholdsmodul med tema-knapp for fire skins.

Skins:
- Collectium
- Samler
- Museum
- Finans

Endring fra v18:
- legger til `CollectiumUi85ThemeClient.tsx`
- legger til `CollectiumUi85ThemeClient.module.css`
- bruker lokal React-state for å bytte skin i preview
- endrer `/design/ui85` til å bruke client theme controller
- beholder eksisterende global AppShell
- lager ikke egen sidebar/topbar
- endrer ikke `app/layout.tsx`
- endrer ikke `app/page.tsx`
- endrer ikke global CSS
