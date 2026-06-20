# Collectium Periode 8.6 Small API Package

## Formål

Dette er en liten Next.js/Neon API-pakke for Periode 8.6. Den dekker bredt filter og katalogsøk uten å hente hele periode-/relasjonsdatabasen i én tung respons.

## Innhold

```text
lib/period86/period86Db.ts
app/api/period86/master/route.ts
app/api/period86/row1/route.ts
app/api/period86/row1/nodes/route.ts
app/api/period86/row2/route.ts
app/api/period86/row2/nodes/route.ts
app/api/period86/dynamic-field/route.ts
app/api/period86/catalog-search/route.ts
app/api/period86/filter-options/route.ts
sql/001_period86_dynamic_field_resolved.sql
sql/002_period86_relation_links_unique_index.sql
```

## API-ruter

| Route | Formål |
|---|---|
| `GET /api/period86/master` | Land/område/mastervalg |
| `GET /api/period86/row1?master=no` | Rad 1 Statsoverhode / maktstruktur |
| `GET /api/period86/row1/nodes?master=no&type=king` | Konkrete konger/herskere |
| `GET /api/period86/row2?master=no` | Rad 2 kontekstfilter |
| `GET /api/period86/row2/nodes?context=war_conflict` | Konkrete perioder/noder |
| `GET /api/period86/dynamic-field?period_slug=napoleonskrigene-statsbankerott` | Lett dynamisk felt |
| `GET /api/period86/catalog-search?period_slug=...` | Små katalogresultater |
| `GET /api/period86/filter-options` | Source/object_group/period filter counts |

## Miljøvariabel

Krever en av disse:

```text
DATABASE_URL
POSTGRES_URL
```

## Installasjon

1. Kopier filene inn i Next.js-prosjektet.
2. Installer pg hvis prosjektet ikke allerede har det:

```bash
npm install pg
npm install -D @types/pg
```

3. Kjør SQL:

```sql
\i sql/001_period86_dynamic_field_resolved.sql
\i sql/002_period86_relation_links_unique_index.sql
```

4. Test:

```text
/api/period86/dynamic-field?period_slug=napoleonskrigene-statsbankerott
/api/period86/catalog-search?period_slug=napoleonskrigene-statsbankerott&limit=20
```

## Viktig

Denne pakken overskriver ikke eksisterende katalogruter. Den legger nye, små Periode 8.6-ruter under `/api/period86/*`.
