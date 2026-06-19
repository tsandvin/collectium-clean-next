import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

function hasEnv(name: string): boolean {
  return Boolean(process.env[name] && String(process.env[name]).trim() !== "");
}

export async function GET() {
  try {
    const versionRes = await neonQuery<{ version: string }>("select version() as version");
    const nowRes = await neonQuery<{ now: string }>("select now()::text as now");
    
    return NextResponse.json({
      status: "OK",
      ok: true,
      database: "Neon Postgres",
      version: versionRes[0]?.version || "Unknown",
      time: nowRes[0]?.now || new Date().toISOString(),
      env: {
        DATABASE_URL: hasEnv("DATABASE_URL"),
        NEON_DATABASE_URL: hasEnv("NEON_DATABASE_URL"),
        BLOB_READ_WRITE_TOKEN: hasEnv("BLOB_READ_WRITE_TOKEN"),
        SESSION_SECRET: hasEnv("SESSION_SECRET"),
        NEXTAUTH_SECRET: hasEnv("NEXTAUTH_SECRET"),
        VIPPS_CLIENT_ID: hasEnv("VIPPS_CLIENT_ID"),
        VIPPS_CLIENT_SECRET: hasEnv("VIPPS_CLIENT_SECRET"),
        STRIPE_SECRET_KEY: hasEnv("STRIPE_SECRET_KEY"),
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "FEIL",
        ok: false,
        error: error instanceof Error ? error.message : "Neon connection failed",
        env: {
          DATABASE_URL: hasEnv("DATABASE_URL"),
          NEON_DATABASE_URL: hasEnv("NEON_DATABASE_URL"),
          BLOB_READ_WRITE_TOKEN: hasEnv("BLOB_READ_WRITE_TOKEN"),
          SESSION_SECRET: hasEnv("SESSION_SECRET"),
          NEXTAUTH_SECRET: hasEnv("NEXTAUTH_SECRET"),
          VIPPS_CLIENT_ID: hasEnv("VIPPS_CLIENT_ID"),
          VIPPS_CLIENT_SECRET: hasEnv("VIPPS_CLIENT_SECRET"),
          STRIPE_SECRET_KEY: hasEnv("STRIPE_SECRET_KEY"),
        }
      },
      { status: 500 }
    );
  }
}
