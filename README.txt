Collectium Period86 V4 Routes Pack

Dette er neste steg etter funnet ditt:
ct_v_period86_ruler_timeline_resolved har from_year/to_year, ikke start_year/end_year.

Rekkefolge:

1. Kjor SQL i Neon SQL Editor:
   sql/period86-neon-compatibility-views.sql

2. Pakk ut zip i prosjektroten slik at mappen period86-routes ligger i prosjektroten.

3. Kjor:
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install-period86-v4-routes.ps1

4. Kjor:
   npm run build

5. Commit/push:
   git add app/api/period86/row1/nodes/route.ts app/api/period86/row3/nodes/route.ts app/api/period86/timeline/route.ts
   git commit -m "Repair Period 8.6 timeline routes"
   git push origin main

Hva den fikser:
- row1 konge/statsoverhode 500
- row3 404
- timeline 404

Viktig:
SQL ma kjores forst, fordi route.ts bruker:
- ct_v_period86_row1_statsoverhode_nodes
- ct_v_period86_row3_context_nodes
- ct_v_period86_timeline_nodes
