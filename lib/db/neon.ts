/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon database connection
 *
 * Definering / formÃ¥l:
 * Felles Neon Postgres-kobling for Collectium Next.js/Vercel.
 * Filen eksporterer bÃ¥de ny hovedkobling `sql` og kompatibilitetsfunksjoner
 * som eksisterende API-ruter allerede bruker: `neonQuery`, `neonOne` og `neonPool`.
 *
 * BruksomrÃ¥de:
 * Brukes av API-ruter og server-side datahenting som skal lese Collectium-data fra Neon.
 *
 * BerÃ¸rte sider / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[relationType]/[relationKey]
 * - /admin/system/mariadb-neon
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - catalog.search
 * - catalog.object.open
 * - object.presentation.view
 * - object.relations.view
 * - admin.system.mariadb_neon.view
 *
 * BerÃ¸rte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/system/neon-health
 * - GET/POST auth routes using Neon session
 *
 * BerÃ¸rte tabeller / views:
 * - ct_no_banknote_catalog
 * - ct_no_coin_catalog
 * - ct_v_object_presentation_resolved
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: database
 * log_action: neon_query
 *
 * Versjon:
 * CT-FILE-NEON-0002 / CHANGE-2026-06-17-0002
 *
 * Endringsnotat:
 * CT-FILE-NEON-0002 legger tilbake kompatible exports som brukes av eksisterende
 * route.ts-filer: neonQuery, neonOne og neonPool.
 */

import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Missing NEON_DATABASE_URL or DATABASE_URL. Collectium must use Neon as primary database."
  );
}

/**
 * Hovedkobling mot Neon.
 *
 * Kan brukes direkte som tagged template:
 *   await sql`select now()`
 *
 * Kan ogsÃ¥ brukes internt via compatibility wrappers under.
 */
export const sql = neon(connectionString);

export type NeonRow = Record<string, unknown>;
export type NeonQueryValue = unknown;
type NeonQueryParams = readonly unknown[];

/**
 * Kompatibel query-helper for eksisterende Collectium API-ruter.
 *
 * StÃ¸tter typisk bruk:
 *   await neonQuery("select * from table where id = $1", [id])
 */
export async function neonQuery<T extends NeonRow = NeonRow>(
  queryText: string,
  params: NeonQueryParams = []
): Promise<T[]> {
  const runner = sql as unknown as (
    queryText: string,
    params?: NeonQueryParams
  ) => Promise<T[]>;

  return runner(queryText, params);
}

/**
 * Returnerer fÃ¸rste rad eller null.
 *
 * StÃ¸tter typisk bruk:
 *   const user = await neonOne("select * from ct_users where email = $1", [email])
 */
export async function neonOne<T extends NeonRow = NeonRow>(
  queryText: string,
  params: NeonQueryParams = []
): Promise<T | null> {
  const rows = await neonQuery<T>(queryText, params);
  return rows[0] ?? null;
}

/**
 * Pool-kompatibelt objekt for eldre route-filer som bruker:
 *   await neonPool.query("select ...", [params])
 *
 * Dette er ikke en ekte Node Pool. Det er en kontrollert kompatibilitetsadapter
 * rundt Neon serverless-driveren, slik at eksisterende API-ruter kan bygge uten
 * at alle importene mÃ¥ skrives om samtidig.
 */
export const neonPool = {
  async query<T extends NeonRow = NeonRow>(
    queryText: string,
    params: NeonQueryParams = []
  ): Promise<{ rows: T[] }> {
    const rows = await neonQuery<T>(queryText, params);
    return { rows };
  },

  async end(): Promise<void> {
    return;
  },
};