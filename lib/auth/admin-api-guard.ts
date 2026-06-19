/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Admin API Guard
 *
 * Definering / formål:
 * Helper for å sjekke session og admin-rettigheter på API-ruter.
 *
 * Berørte sider / routes:
 * - /api/admin/*
 * - /api/admin/neon/*
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.collectiumbro.view
 *
 * Dataretning:
 * Neon -> API/backend
 */

import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "./neon-session";

export async function protectAdminApi() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json(
        { status: "unauthorized", message: "Ikke innlogget" },
        { status: 401 }
      );
    }

    if (!user.is_admin) {
      return NextResponse.json(
        { status: "forbidden", message: "Krever CollectiumBro-tilgang" },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    return NextResponse.json(
      { status: "unauthorized", message: "Ikke innlogget" },
      { status: 401 }
    );
  }
}
