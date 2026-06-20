/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Katalogside UI/UX 8.6
 *
 * Definering / formål:
 * Next.js-side for Collectium-katalogen. Siden bruker eksisterende global AppShell,
 * topbar, sidemeny, skin/tokens og skjerminnstillinger. Siden lager ikke eget shell.
 *
 * Bruksområde:
 * Viser katalogens arbeidsflate med filter over resultater, segmenter, visningskort
 * og dynamisk innhold fra API.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[relationType]/[relationKey]
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.view
 * - catalog.search
 * - catalog.filters
 * - catalog.object.open
 * - catalog.market
 * - catalog.history
 * - catalog.collection
 * - catalog.favorite
 * - catalog.wishlist
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/catalog/filters
 * - GET /api/period86/row1/nodes
 * - GET /api/period86/row2/nodes
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 * - ct_v_catalog_filter_counts
 * - ct_v_object_relations_resolved
 * - ct_v_period_filter_options
 *
 * Dataretning:
 * Neon/MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: catalog
 * log_action: view
 *
 * Versjon:
 * CT-FILE-CATALOG86-0001 / CHANGE-2026-06-20-0001
 *
 * Endringsregel:
 * Legger til ny katalogside uten å endre kjernefiler, global layout, topbar eller sidemeny.
 */

import { CollectiumCatalog86Client } from "@/components/catalog/CollectiumCatalog86Client";

export const metadata = {
  title: "Katalog · Collectium",
  description: "Collectium relasjonskatalog med Filter Master, periodefilter og visningskort.",
};

export default function KatalogPage() {
  return <CollectiumCatalog86Client />;
}
