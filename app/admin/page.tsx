/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Admin base redirect
 *
 * Definering / formål:
 * Sender brukere som går til /admin videre til admin-dashboardet (/admin/neon).
 *
 * Berørte sider / routes:
 * - /admin
 * - /admin/neon
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  redirect("/admin/neon");
}
