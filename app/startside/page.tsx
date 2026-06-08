/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Startside page
 *
 * Definering / formål:
 * App-startside for app.collectium.no.
 *
 * Bruksområde:
 * Brukes som tydelig inngang til katalog, login, Min side og offentlig collectium.no.
 *
 * Berørte sider / routes:
 * - /startside
 *
 * Berørte DB-brytere / feature_keys:
 * - landing.view
 * - catalog.view
 * - auth.login
 * - user.dashboard.view
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
 * log_action: startside.view
 *
 * Versjon:
 * CT-FILE-STARTSIDE-PAGE-0001 / CHANGE-DOMAIN-LOCK-0001
 *
 * Endringsregel:
 * Siden skal ikke lage egen sidebar, topbar, html, body eller globalt skall.
 */

import CollectiumAppStartside from "@/components/startside/CollectiumAppStartside";

export default function StartsidePage() {
  return <CollectiumAppStartside />;
}
