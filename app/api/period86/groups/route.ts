/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Dropdown Groups API
 * Definering / formål: Returnerer grupper for tidslinjefilterets rullegardin.
 * Bruksområde: Første dropdown i Periode 8.6 tidslinjen.
 * Berørte sider / routes: /test/period-timeline
 * Berørte API-ruter: GET /api/period86/groups
 * Dataretning: Backend/JSON -> Frontend UI
 * Versjon: CT-PERIOD86-GROUPS-API-0001
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const groups = [
    {
      group_key: "ruler_head_of_state",
      label_no: "Herskere / statsoverhoder",
    },
    {
      group_key: "national_period",
      label_no: "Nasjonale perioder",
    },
    {
      group_key: "war_conflict",
      label_no: "Krig / konflikt",
    },
    {
      group_key: "disease_crisis",
      label_no: "Sykdom / krise",
    },
    {
      group_key: "finance_economy",
      label_no: "Finans / økonomi",
    },
  ];

  return NextResponse.json(
    { groups },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
