/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumAppShell
 *
 * Definering / formål:
 * Eneste globale shell for Collectium clean rebuild. Eier sidebar, topbar, bakgrunn og page frame.
 *
 * Bruksområde:
 * Brukes kun i app/layout.tsx.
 *
 * Berørte sider / routes:
 * - alle routes
 *
 * Berørte DB-brytere / feature_keys:
 * - template.view
 * - navigation.view
 *
 * Berørte API-ruter:
 * - Ingen i v1 clean template
 *
 * Berørte tabeller / views:
 * - Ingen i v1 clean template
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: template
 * log_action: render_shell
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import { CollectiumSidebar } from './CollectiumSidebar';
import { CollectiumTopbar } from './CollectiumTopbar';

export function CollectiumAppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="ct-app-shell">
      <CollectiumSidebar />
      <div className="ct-workspace">
        <CollectiumTopbar />
        <div className="ct-page-frame">
          <div className="ct-content-decor" aria-hidden="true">
            <div className="ct-watermark"><span>ANNO</span><strong>2022</strong></div>
            <div className="ct-stamp ct-stamp--one"><span>COLLECTIUM · ANNO 2022</span><b>C</b></div>
            <div className="ct-stamp ct-stamp--two"><span>COLLECTIUM · ANNO 2022</span><b>C</b></div>
          </div>
          <div className="ct-page-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
