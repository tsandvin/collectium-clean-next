import { ctQuery } from "@/lib/db/mariadb";

export type CtCheckStatus = "OK" | "MANGLER" | "FEIL";

export type CtAuthControlCheck = {
  generatedAt: string;
  database: {
    status: CtCheckStatus;
    name: string | null;
    error: string | null;
  };
  tables: Record<string, CtCheckStatus>;
  features: Record<string, CtCheckStatus>;
  routes: Record<string, CtCheckStatus>;
  summary: {
    ok: number;
    missing: number;
    errors: number;
  };
  answerForChatGPT: string;
};

type DatabaseRow = {
  database_name: string | null;
};

type ObjectRow = {
  table_name: string;
};

type FeatureRow = {
  feature_key: string;
};

type RouteRow = {
  feature_key: string;
  route_count: number;
};

const requiredTables = [
  "ct_users",
  "ct_user_sessions",
  "ct_login_attempts",
  "ct_app_pages",
  "ct_app_features",
  "ct_app_page_features",
  "ct_feature_action_routes",
  "ct_feature_access_rules",
];

const requiredFeatures = [
  "auth.login",
  "auth.logout",
  "auth.session.read",
  "auth.session.create",
  "profile.view",
  "profile.sessions",
];

function countSummary(
  tables: Record<string, CtCheckStatus>,
  features: Record<string, CtCheckStatus>,
  routes: Record<string, CtCheckStatus>,
) {
  const values = [...Object.values(tables), ...Object.values(features), ...Object.values(routes)];

  return {
    ok: values.filter((value) => value === "OK").length,
    missing: values.filter((value) => value === "MANGLER").length,
    errors: values.filter((value) => value === "FEIL").length,
  };
}

function buildAnswerForChatGPT(check: Omit<CtAuthControlCheck, "answerForChatGPT">): string {
  const missingTables = Object.entries(check.tables)
    .filter(([, status]) => status !== "OK")
    .map(([name, status]) => `${name}: ${status}`);

  const missingFeatures = Object.entries(check.features)
    .filter(([, status]) => status !== "OK")
    .map(([name, status]) => `${name}: ${status}`);

  const missingRoutes = Object.entries(check.routes)
    .filter(([, status]) => status !== "OK")
    .map(([name, status]) => `${name}: ${status}`);

  return [
    "Collectium Next admin-auth-status",
    `Tid: ${check.generatedAt}`,
    `MariaDB connection: ${check.database.status}`,
    `Database: ${check.database.name ?? "ukjent"}`,
    "",
    "Tabeller:",
    missingTables.length === 0 ? "- Alle auth-/DB 8.4-tabeller OK" : missingTables.map((x) => `- ${x}`).join("\n"),
    "",
    "Features:",
    missingFeatures.length === 0 ? "- Alle auth/profile features OK" : missingFeatures.map((x) => `- ${x}`).join("\n"),
    "",
    "Action routes:",
    missingRoutes.length === 0 ? "- Alle auth/profile routes OK" : missingRoutes.map((x) => `- ${x}`).join("\n"),
    "",
    `Oppsummering: OK=${check.summary.ok}, MANGLER=${check.summary.missing}, FEIL=${check.summary.errors}`,
  ].join("\n");
}

export async function runAuthControlCheck(): Promise<CtAuthControlCheck> {
  const generatedAt = new Date().toISOString();

  const emptyTables = Object.fromEntries(
    requiredTables.map((tableName) => [tableName, "FEIL" as CtCheckStatus]),
  );

  const emptyFeatures = Object.fromEntries(
    requiredFeatures.map((featureKey) => [featureKey, "FEIL" as CtCheckStatus]),
  );

  const emptyRoutes = Object.fromEntries(
    requiredFeatures.map((featureKey) => [featureKey, "FEIL" as CtCheckStatus]),
  );

  try {
    const databaseRows = await ctQuery<DatabaseRow>(
      "SELECT DATABASE() AS database_name",
    );

    const databaseName = databaseRows[0]?.database_name ?? null;

    const objectRows = await ctQuery<ObjectRow>(
      `
        SELECT TABLE_NAME AS table_name
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (${requiredTables.map(() => "?").join(",")})
      `,
      requiredTables,
    );

    const foundTables = new Set(objectRows.map((row) => row.table_name));

    const tables = Object.fromEntries(
      requiredTables.map((tableName) => [
        tableName,
        foundTables.has(tableName) ? "OK" : "MANGLER",
      ]),
    ) as Record<string, CtCheckStatus>;

    let features = Object.fromEntries(
      requiredFeatures.map((featureKey) => [featureKey, "MANGLER" as CtCheckStatus]),
    );

    let routes = Object.fromEntries(
      requiredFeatures.map((featureKey) => [featureKey, "MANGLER" as CtCheckStatus]),
    );

    if (tables.ct_app_features === "OK") {
      const featureRows = await ctQuery<FeatureRow>(
        `
          SELECT feature_key
          FROM ct_app_features
          WHERE feature_key IN (${requiredFeatures.map(() => "?").join(",")})
        `,
        requiredFeatures,
      );

      const foundFeatures = new Set(featureRows.map((row) => row.feature_key));

      features = Object.fromEntries(
        requiredFeatures.map((featureKey) => [
          featureKey,
          foundFeatures.has(featureKey) ? "OK" : "MANGLER",
        ]),
      ) as Record<string, CtCheckStatus>;
    } else {
      features = emptyFeatures;
    }

    if (tables.ct_feature_action_routes === "OK") {
      const routeRows = await ctQuery<RouteRow>(
        `
          SELECT
            feature_key,
            COUNT(*) AS route_count
          FROM ct_feature_action_routes
          WHERE feature_key IN (${requiredFeatures.map(() => "?").join(",")})
          GROUP BY feature_key
        `,
        requiredFeatures,
      );

      const routeMap = new Map(
        routeRows.map((row) => [row.feature_key, Number(row.route_count)]),
      );

      routes = Object.fromEntries(
        requiredFeatures.map((featureKey) => [
          featureKey,
          (routeMap.get(featureKey) ?? 0) > 0 ? "OK" : "MANGLER",
        ]),
      ) as Record<string, CtCheckStatus>;
    } else {
      routes = emptyRoutes;
    }

    const summary = countSummary(tables, features, routes);

    const checkWithoutAnswer = {
      generatedAt,
      database: {
        status: "OK" as CtCheckStatus,
        name: databaseName,
        error: null,
      },
      tables,
      features,
      routes,
      summary,
    };

    return {
      ...checkWithoutAnswer,
      answerForChatGPT: buildAnswerForChatGPT(checkWithoutAnswer),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent databasefeil";

    const summary = countSummary(emptyTables, emptyFeatures, emptyRoutes);

    const checkWithoutAnswer = {
      generatedAt,
      database: {
        status: "FEIL" as CtCheckStatus,
        name: null,
        error: message,
      },
      tables: emptyTables,
      features: emptyFeatures,
      routes: emptyRoutes,
      summary,
    };

    return {
      ...checkWithoutAnswer,
      answerForChatGPT: buildAnswerForChatGPT(checkWithoutAnswer),
    };
  }
}
