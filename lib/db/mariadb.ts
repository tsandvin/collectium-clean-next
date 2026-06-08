import { createConnection } from "mariadb";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const databasePort = Number(process.env.CT_DB_PORT ?? "3306");

if (!Number.isInteger(databasePort) || databasePort <= 0) {
  throw new Error("Invalid CT_DB_PORT. Expected a positive integer.");
}

export async function ctQuery<T extends Record<string, unknown>>(
  sql: string,
  values: readonly unknown[] = [],
): Promise<T[]> {
  const connection = await createConnection({
    host: requireEnv("CT_DB_HOST"),
    port: databasePort,
    user: requireEnv("CT_DB_USER"),
    password: requireEnv("CT_DB_PASSWORD"),
    database: requireEnv("CT_DB_NAME"),
    connectTimeout: 5000,
    socketTimeout: 8000,
  });

  try {
    const rows = await connection.query(sql, values);
    return rows as T[];
  } finally {
    await connection.end();
  }
}
