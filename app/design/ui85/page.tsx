/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 React Template Page
 *
 * Definering / formal:
 * Next.js sandbox route for Collectium UI 8.5 React template. The page mounts a
 * controlled template component and does not change the global production shell.
 *
 * Bruksomrade:
 * - /design/ui85
 *
 * Berorte sider / routes:
 * - app/design/ui85/page.tsx
 *
 * Berorte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 *
 * Berorte API-ruter:
 * - Ingen. Static React template preview.
 *
 * Berorte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Static preview -> React UI only. Production data must come from API/backend.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.react.template.preview
 *
 * Versjon:
 * UI85-REACT-TEMPLATE-V17C / CHANGE-UI85-2026-06-11-0017
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
