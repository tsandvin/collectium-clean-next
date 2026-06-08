import { NextResponse } from "next/server";
import { ctQuery } from "@/lib/db/mariadb";

export const dynamic = "force-dynamic";

type DbTestRow = {
  ok_value: number;
  database_name: string | null;
  server_time: Date | string;
};

export async function GET() {
  try {
    const startedAt = Date.now();

    const rows = await ctQuery<DbTestRow>(
      `
        SELECT
          1 AS ok_value,
          DATABASE() AS database_name,
          NOW() AS server_time
      `,
    );

    const firstRow = rows[0] ?? null;

    return NextResponse.json(
      {
        ok: true,
        message: "MariaDB connection OK",
        database: firstRow?.database_name ?? null,
        serverTime: firstRow?.server_time ?? null,
        durationMs: Date.now() - startedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown MariaDB connection error";

    return NextResponse.json(
      {
        ok: false,
        message: "MariaDB connection failed",
        error: message,
      },
      { status: 500 },
    );
  }
}
