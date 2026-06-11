/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side overview
 *
 * Definering / formål:
 * Oversiktspanel for Min side med statuskort, prosesser og siste aktivitet.
 *
 * Bruksområde:
 * Vises når aktiv arkivfane er Oversikt.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.overview.view
 * - processes.view
 * - activity.view
 *
 * Berørte API-ruter:
 * - GET /api/account/overview
 * - GET /api/account/processes
 * - GET /api/account/activity
 *
 * Berørte tabeller / views:
 * - ct_activity_log
 * - ct_processes
 * - ct_collection_items
 *
 * Dataretning:
 * API/backend -> React -> UI
 *
 * Logging:
 * log_category: account
 * log_action: min_side.overview_view
 *
 * Versjon:
 * CT-FILE-MINSIDE-0006 / CHANGE-2026-06-11-0001
 */

import styles from "./MinSide.module.css";
import type { ActivityItem, ProcessItem, StatusCard } from "./min-side-types";

type Props = {
  statusCards: StatusCard[];
  processItems: ProcessItem[];
  activityItems: ActivityItem[];
};

export default function MinSideOverview({ statusCards, processItems, activityItems }: Props) {
  return (
    <div className={styles.overviewGrid}>
      <section className={styles.statusGrid} aria-label="Statuskort">
        {statusCards.map((card) => (
          <article key={card.label} className={`${styles.statusCard} ${styles[`status_${card.status}`]}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className={styles.panelLarge}>
        <div className={styles.panelTitleRow}>
          <div>
            <span>Arbeidsliste</span>
            <h3>Krever handling</h3>
          </div>
          <button type="button" className={styles.softButton}>Åpne prosesser</button>
        </div>

        <div className={styles.processList}>
          {processItems.map((item) => (
            <article key={`${item.title}-${item.objectLabel}`} className={styles.processItem}>
              <span className={`${styles.severityDot} ${styles[`dot_${item.severity}`]}`} aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                <p>{item.objectLabel}</p>
                <span>Status: {item.status} · Frist: {item.due}</span>
              </div>
              <button type="button" className={styles.actionButton}>{item.action}</button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panelSmall}>
        <div className={styles.panelTitleRow}>
          <div>
            <span>Arkivlogg</span>
            <h3>Siste aktivitet</h3>
          </div>
        </div>

        <div className={styles.activityList}>
          {activityItems.map((item) => (
            <article key={`${item.title}-${item.time}`} className={styles.activityItem}>
              <span>{item.type}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <time>{item.time}</time>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
