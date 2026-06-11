"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side shell
 *
 * Definering / formål:
 * Klientkomponent for Min side. Håndterer arkivmappe-faner, lokal UI-state
 * og visning av brukerens rollebaserte kontrollsenter.
 *
 * Bruksområde:
 * Importeres av app/min-side/page.tsx.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.overview.view
 * - profile.view
 * - membership.view
 * - collection.view
 * - transactions.view
 * - processes.view
 * - notifications.view
 * - messages.view
 * - documents.view
 * - security.sessions.view
 * - dealer.dashboard.view
 * - admin.dashboard.view
 *
 * Berørte API-ruter:
 * - GET /api/auth/session
 * - GET /api/account/overview
 * - GET /api/account/processes
 * - GET /api/account/transactions
 * - GET /api/account/notifications
 * - GET /api/account/messages
 *
 * Berørte tabeller / views:
 * - ct_users
 * - ct_user_sessions
 * - ct_collection_items
 * - ct_collection_transactions
 * - ct_activity_log
 * - ct_notifications
 * - ct_messages
 * - ct_processes
 *
 * Dataretning:
 * API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: account
 * log_action: min_side.shell_view
 *
 * Versjon:
 * CT-FILE-MINSIDE-0004 / CHANGE-2026-06-11-0001
 */

import { useMemo, useState } from "react";
import styles from "./MinSide.module.css";
import { activityItems, minSideTabs, minSideUser, processItems, statusCards } from "./min-side-data";
import type { MinSideTabKey } from "./min-side-types";
import MinSideArchiveTabs from "./MinSideArchiveTabs";
import MinSideOverview from "./MinSideOverview";
import MinSidePanel from "./MinSidePanel";

export default function MinSideShell() {
  const [activeTab, setActiveTab] = useState<MinSideTabKey>("overview");

  const activeTabMeta = useMemo(
    () => minSideTabs.find((tab) => tab.key === activeTab) ?? minSideTabs[0],
    [activeTab],
  );

  return (
    <main className={styles.page} aria-labelledby="min-side-title">
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>Collectium kontoarkiv</p>
          <h1 id="min-side-title">Min side</h1>
          <p>
            Rollebasert arbeidsflate for samling, medlemskap, prosesser, varsler,
            meldinger, transaksjoner og sikkerhet.
          </p>
        </div>

        <aside className={styles.identityCard} aria-label="Brukerstatus">
          <span className={styles.identityLabel}>Aktiv bruker</span>
          <strong>{minSideUser.displayName}</strong>
          <span>{minSideUser.membership} · {minSideUser.roleLabel}</span>
          <span>{minSideUser.accountStatus} · {minSideUser.emailStatus}</span>
          <span>{minSideUser.lastSeen}</span>
        </aside>
      </section>

      <section className={styles.archiveFrame} aria-label="Min side innhold">
        <MinSideArchiveTabs tabs={minSideTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <section className={styles.folderBody}>
          <header className={styles.folderHeader}>
            <div>
              <span>{activeTabMeta.eyebrow}</span>
              <h2>{activeTabMeta.label}</h2>
            </div>
            <p>Feature-koblet visning · klar for API/access senere</p>
          </header>

          {activeTab === "overview" ? (
            <MinSideOverview statusCards={statusCards} processItems={processItems} activityItems={activityItems} />
          ) : (
            <MinSidePanel tabKey={activeTab} />
          )}
        </section>
      </section>
    </main>
  );
}
