/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * UI85 Design Standard Preview
 *
 * Definering / formal:
 * Aktiv preview-route for Collectium UI85 designstandard. Bruker kun kanonisk
 * React/Next-template fra components/templates/ui85 og eksisterende AppShell.
 *
 * Bruksomrade:
 * - /design/ui85
 *
 * Berorte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - template.ui85.skin.switch.preview
 *
 * Berorte API-ruter:
 * - Ingen. Statisk designstandard-preview.
 *
 * Dataretning:
 * Static React preview -> browser.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.design_standard.preview
 *
 * Versjon:
 * UI85-DESIGN-STANDARD-V20
 */

import { CollectiumUi85ThemeClient } from "@/components/templates/ui85/CollectiumUi85ThemeClient";

export default function Ui85DesignPreviewPage() {
  return <CollectiumUi85ThemeClient />;
}
