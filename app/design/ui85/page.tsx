/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 React Template Page v19
 *
 * Definering / formål:
 * Next.js sandbox route for Collectium UI 8.5 React template as content-only
 * module inside existing Collectium AppShell. Page uses a client theme controller
 * for four approved skins.
 *
 * Bruksområde:
 * - /design/ui85
 *
 * Berørte sider / routes:
 * - app/design/ui85/page.tsx
 *
 * Berørte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - template.ui85.skin.switch.preview
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
 * log_action: ui85.react.template.theme.preview
 *
 * Versjon:
 * UI85-REACT-TEMPLATE-V19 / CHANGE-UI85-2026-06-11-0019
 */

import { CollectiumUi85ThemeClient } from "../../../components/templates/ui85/CollectiumUi85ThemeClient";

export default function CollectiumUi85DesignPage() {
  return <CollectiumUi85ThemeClient />;
}
