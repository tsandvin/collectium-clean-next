/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 React Template Shell
 *
 * Definering / formal:
 * Controlled React template shell for UI 8.5 with sidebar, topbar, page frame,
 * signature corners and skin tokens. This is a sandbox/template module, not a
 * replacement for production AppShell.
 *
 * Bruksomrade:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berorte DB-brytere / feature_keys:
 * - template.ui85.preview.view
 * - template.sidebar.preview.view
 * - template.skin.finans.view
 *
 * Berorte API-ruter:
 * - Ingen. Static preview.
 *
 * Berorte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Static React template preview. Production pages must load data via API/backend.
 *
 * Logging:
 * log_category: template
 * log_action: ui85.react.template.shell
 *
 * Versjon:
 * UI85-REACT-TEMPLATE-V17 / CHANGE-UI85-2026-06-11-0017
 */

import type { CollectiumUi85TemplateProps } from "./collectium-ui85-types";
import { MenuDotIcon } from "./CollectiumUi85Icons";
import styles from "./CollectiumUi85Template.module.css";

const navItems = [
  { label: "Oversikt", meta: "Start og status", active: true, count: "01" },
  { label: "Katalog", meta: "Filter og relasjoner", active: false, count: "2k" },
  { label: "Min samling", meta: "Hjerte og stjerne", active: false, count: "142" },
  { label: "Auksjon", meta: "Bud og oppgjor", active: false, count: "7" },
  { label: "Index", meta: "Marked og finans", active: false, count: "12" },
  { label: "Admin", meta: "Systemkontroll", active: false, count: "OK" },
];

export function CollectiumUi85Template({ skin = "finans", children }: CollectiumUi85TemplateProps) {
  return (
    <div className={styles.shell} data-skin={skin}>
      <aside className={styles.sidebar} aria-label="Collectium UI85 preview sidebar">
        <div className={styles.brand}>
          <div className={styles.brandMark}>C</div>
          <div>
            <b>Collectium</b>
            <span>UI 8.5 React template</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Template navigation">
          {navItems.map((item) => (
            <a key={item.label} className={item.active ? `${styles.navItem} ${styles.active}` : styles.navItem} href="#">
              <span className={styles.navIcon}><MenuDotIcon /></span>
              <span className={styles.navText}><b>{item.label}</b><small>{item.meta}</small></span>
              <span className={styles.navCount}>{item.count}</span>
            </a>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarNote}><b>Template-regel</b><span>Skall, rammer, signatur og skin styres her.</span></div>
          <div className={styles.stampSlot}>stempel<br />anno2022</div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span>Design / UI85</span>
            <b>React template sandbox</b>
          </div>
          <div className={styles.topActions}>
            <span>Skin: {skin}</span>
            <span>Route: /design/ui85</span>
          </div>
        </header>
        <section className={styles.pageFrame}>{children}</section>
      </main>
    </div>
  );
}
