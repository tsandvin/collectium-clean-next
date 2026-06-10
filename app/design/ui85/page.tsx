/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 React Template Page v18
 *
 * Definering / formål:
 * Next.js sandbox route for Collectium UI 8.5 React template as content-only
 * module inside the existing Collectium AppShell. The route does not create
 * its own sidebar, topbar or global shell.
 *
 * Bruksområde:
 * - /design/ui85
 *
 * Berørte sider / routes:
 * - app/design/ui85/page.tsx
 *
 * Berørte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 *
 * Berørte API-ruter:
 * - Ingen. Static React template preview.
 *
 * Berørte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Static preview → React UI only. Production data must come from API/backend.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.react.template.preview
 *
 * Versjon:
 * UI85-REACT-TEMPLATE-V18 / CHANGE-UI85-2026-06-11-0018
 */

import { CollectiumUi85Template } from "../../../components/templates/ui85/CollectiumUi85Template";
import { CollectiumUi85ObjectPreview } from "../../../components/templates/ui85/CollectiumUi85ObjectPreview";

export default function CollectiumUi85DesignPage() {
  return (
    <CollectiumUi85Template skin="finans">
      <CollectiumUi85ObjectPreview />
    </CollectiumUi85Template>
  );
}
