/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side types
 *
 * Definering / formål:
 * TypeScript-typer for Min side-komponentene.
 *
 * Bruksområde:
 * Brukes av components/account/*.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.overview.view
 * - processes.view
 * - transactions.view
 *
 * Berørte API-ruter:
 * - GET /api/account/overview
 *
 * Berørte tabeller / views:
 * - ct_users
 * - ct_collection_items
 * - ct_activity_log
 *
 * Dataretning:
 * API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: account
 * log_action: min_side.types
 *
 * Versjon:
 * CT-FILE-MINSIDE-0002 / CHANGE-2026-06-11-0001
 */

export type MinSideRole = "collector" | "dealer" | "admin";

export type MinSideTabKey =
  | "overview"
  | "profile"
  | "membership"
  | "collection"
  | "wishlist"
  | "favorites"
  | "trade"
  | "transactions"
  | "processes"
  | "notifications"
  | "messages"
  | "documents"
  | "settings"
  | "security"
  | "dealer"
  | "admin";

export type MinSideTab = {
  key: MinSideTabKey;
  label: string;
  eyebrow: string;
  badge?: string;
  locked?: boolean;
  role?: MinSideRole;
};

export type StatusCard = {
  label: string;
  value: string;
  detail: string;
  status: "ok" | "warning" | "danger" | "info";
};

export type ProcessItem = {
  title: string;
  objectLabel: string;
  status: string;
  due: string;
  action: string;
  severity: "ok" | "warning" | "danger" | "info";
};

export type ActivityItem = {
  title: string;
  detail: string;
  time: string;
  type: string;
};
