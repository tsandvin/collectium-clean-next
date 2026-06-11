/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Front Page
 *
 * Definering / formal:
 * Produksjonsrettet React-front for app.collectium.no. Dette er ikke demo,
 * preview eller canvas. Fronten bruker UI85-template og rent frontinnhold.
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
 * UI85-CLEAN-FRONT-V1 / CHANGE-UI85-2026-06-11-FRONT-0003
 */

import { CollectiumUi85Template } from "./components/templates/ui85/CollectiumUi85Template";
import { CollectiumUi85FrontContent } from "./components/templates/ui85/CollectiumUi85FrontContent";

export default function CollectiumFrontPage() {
  return (
    <CollectiumUi85Template skin="finans">
      <CollectiumUi85FrontContent />
    </CollectiumUi85Template>
  );
}
