/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 React Template Content Shell v19
 *
 * Definering / formål:
 * Controlled UI85 content-only template wrapper. It does not create its own
 * sidebar, topbar, body shell or global layout. Existing Collectium AppShell
 * remains the owner of sidebar, topbar and page frame.
 *
 * Bruksområde:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berørte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - template.skin.finans.view
 * - template.ui85.skin.switch.preview
 *
 * Berørte API-ruter:
 * - Ingen. Static preview.
 *
 * Berørte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Static React template preview. Production pages must load data via API/backend.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.react.template.content
 *
 * Versjon:
 * UI85-REACT-TEMPLATE-V19 / CHANGE-UI85-2026-06-11-0019
 */

import type { CollectiumUi85TemplateProps } from "./collectium-ui85-types";
import styles from "./CollectiumUi85Template.module.css";

export function CollectiumUi85Template({ skin = "finans", children }: CollectiumUi85TemplateProps) {
  return (
    <section
      className={styles.previewModule}
      data-skin={skin}
      data-ui85-preview="true"
      aria-label="Collectium UI85 content preview"
    >
      <header className={styles.moduleHeader}>
        <div>
          <span>Design / UI85</span>
          <b>React template modul</b>
        </div>
        <div className={styles.headerMeta}>
          <span>Skin: {skin}</span>
          <span>Route: /design/ui85</span>
          <span>Skall: global AppShell</span>
        </div>
      </header>

      <div className={styles.contentFrame}>
        {children}
      </div>
    </section>
  );
}
