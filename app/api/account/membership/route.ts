/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Account Membership API route
 *
 * Definering / formål:
 * Fallback API-rute for medlemskap. Returnerer status "not_connected"
 * når reell Neon-tilkobling eller bruker-session mangler.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - membership.view
 *
 * Berørte API-ruter:
 * - GET /api/account/membership
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Logging:
 * log_category: account
 * log_action: view
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "not_connected",
    message: "Ikke koblet til reell brukerdata ennå",
    data: null
  });
}
