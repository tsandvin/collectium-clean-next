/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * App root page
 *
 * Definering / formål:
 * Root-route for app.collectium.no. Viser samme app-gateway som /startside.
 *
 * Bruksområde:
 * Produksjonsinngang for app.collectium.no.
 *
 * Berørte sider / routes:
 * - /
 *
 * Berørte DB-brytere / feature_keys:
 * - landing.view
 *
 * Berørte API-ruter:
 * - Ingen i denne statiske gateway-versjonen.
 *
 * Berørte tabeller / views:
 * - Ingen direkte.
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: app
 * log_action: root.view
 *
 * Versjon:
 * CT-FILE-ROOT-0001 / CHANGE-DOMAIN-LOCK-0001
 *
 * Endringsregel:
 * Siden skal bare rendres som innhold inne i global AppShell.
 */

import CollectiumAppStartside from "@/components/startside/CollectiumAppStartside";

export default function HomePage() {
  return <CollectiumAppStartside />;
}
