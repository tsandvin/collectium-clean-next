# Collectium Clean Next.js Template v1

Dette er en ren startpakke for Collectium.

## Innhold

- En global `CollectiumAppShell`
- En global `CollectiumSidebar`
- En global `CollectiumTopbar`
- En global `app/globals.css`
- Sidene `/`, `/startside`, `/katalog`, `/min-side`
- Ingen gamle startside- eller kataloggenerasjoner
- Ingen lokal sidebar i vanlige sider

## Hovedregel

Vanlige sider skal bare levere innhold. De skal ikke lage:

- egen sidebar
- egen topbar
- eget shell
- egen body/html
- egen global bakgrunn
- lokal skinmotor

## Første test

Bruk disse kommandoene i prosjektmappen:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

Åpne deretter:

```txt
http://localhost:3000/startside
http://localhost:3000/katalog
http://localhost:3000/min-side
```

## Vercel

Lag ny GitHub-repo og nytt Vercel-prosjekt for denne rene versjonen. Ikke koble over `app.collectium.no` før preview er godkjent.
