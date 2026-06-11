/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Front Page
 *
 * Definering / formal:
 * Produksjonsrettet React-front for app.collectium.no. Siden bruker eksisterende
 * global AppShell fra app/layout.tsx og legger bare rent frontinnhold inn i
 * innholdsomraadet. Ingen preview, canvas, demo, intern sidemeny, intern topbar
 * eller sandbox-header.
 *
 * Bruksomrade:
 * - /
 *
 * Berorte sider / routes:
 * - /
 *
 * Berorte DB-brytere / feature_keys:
 * - landing.view
 * - catalog.view
 * - collection.view
 * - market.index.view
 *
 * Berorte API-ruter:
 * - Ingen direkte i denne filen.
 *
 * Berorte tabeller / views:
 * - Ingen direkte.
 *
 * Dataretning:
 * MariaDB/Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: front
 * log_action: view
 *
 * Versjon:
 * UI85-FRONT-SHELL-REPAIR-V1 / CHANGE-UI85-2026-06-11-FRONT-0004
 */

import { CollectiumUi85FrontContent } from "./components/templates/ui85/CollectiumUi85FrontContent";

export default function CollectiumFrontPage() {
  return <CollectiumUi85FrontContent />;
}
