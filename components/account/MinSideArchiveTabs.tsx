"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side archive tabs
 *
 * Definering / formål:
 * Arkivmappe-faner for Min side. Fanene er lokale UI-kontroller, mens
 * faktiske systemhandlinger skal kobles til feature_key og API.
 *
 * Bruksområde:
 * Brukes i MinSideShell.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.overview.view
 * - profile.view
 * - membership.view
 * - collection.view
 *
 * Berørte API-ruter:
 * - GET /api/account/overview
 *
 * Berørte tabeller / views:
 * - ct_users
 * - ct_collection_items
 *
 * Dataretning:
 * React local UI state -> UI. Produksjonsdata hentes via API.
 *
 * Logging:
 * log_category: account
 * log_action: min_side.tab_change
 *
 * Versjon:
 * CT-FILE-MINSIDE-0005 / CHANGE-2026-06-11-0001
 */

import styles from "./MinSide.module.css";
import type { MinSideTab, MinSideTabKey } from "./min-side-types";

type Props = {
  tabs: MinSideTab[];
  activeTab: MinSideTabKey;
  onTabChange: (tab: MinSideTabKey) => void;
};

export default function MinSideArchiveTabs({ tabs, activeTab, onTabChange }: Props) {
  return (
    <nav className={styles.tabs} aria-label="Min side arkivfaner">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${isActive ? styles.tabActive : ""} ${tab.locked ? styles.tabLocked : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabChange(tab.key)}
          >
            <span className={styles.tabEyebrow}>{tab.eyebrow}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.badge ? <span className={styles.tabBadge}>{tab.badge}</span> : null}
            {tab.locked ? <span className={styles.tabLock}>Låst</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
