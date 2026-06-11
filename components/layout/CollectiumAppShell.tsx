/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumAppShell
 *
 * Definering / formÃ¥l:
 * Eneste globale shell for Collectium clean rebuild. Eier kun sidebar, topbar
 * og page frame. Alle gamle dekorlag, vannmerker og ANNO-stempler er fjernet.
 *
 * BruksomrÃ¥de:
 * Brukes kun i app/layout.tsx.
 *
 * BerÃ¸rte sider / routes:
 * - alle routes
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - template.view
 * - navigation.view
 *
 * BerÃ¸rte API-ruter:
 * - Ingen
 *
 * BerÃ¸rte tabeller / views:
 * - Ingen
 *
 * Dataretning:
 * MariaDB/Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: template
 * log_action: render_shell
 *
 * Versjon:
 * CT-SHELL-NEUTRAL-0001 / CHANGE-2026-06-12-REMOVE-DECOR
 */

import { CollectiumSidebar } from "./CollectiumSidebar";
import { CollectiumTopbar } from "./CollectiumTopbar";

export function CollectiumAppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="ct-app-shell">
      <CollectiumSidebar />
      <div className="ct-workspace">
        <CollectiumTopbar />
        <main className="ct-page-frame">
          <div className="ct-page-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
