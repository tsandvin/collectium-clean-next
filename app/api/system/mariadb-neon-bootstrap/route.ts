/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB Neon Bootstrap Route
 *
 * Definering / formål:
 * Oppretter første Neon kontrollstruktur for MariaDB -> Neon overgang.
 *
 * Bruksområde:
 * Brukes av M-N Control før table mapping, relation mapping og senere migrering.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.mariadb_neon.bootstrap
 * - system.mariadb_neon.control
 * - system.user.migration.control
 *
 * Berørte API-ruter:
 * - GET  /api/system/mariadb-neon-bootstrap
 * - POST /api/system/mariadb-neon-bootstrap
 *
 * Berørte tabeller / views:
 * Oppretter kun Neon kontrolltabeller.
 *
 * Dataretning:
 * API/backend -> Neon Postgres kontrolltabeller -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: mariadb_neon.bootstrap
 *
 * Versjon:
 * CT-FILE-MARIADB-NEON-BOOTSTRAP-0001
 *
 * Endringsregel:
 * Dette er en kontrollrute. Den skal ikke migrere kildedata, brukere eller katalogobjekter.
 */

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getNeonDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    process.env.neon_DATABASE_URL ??
    process.env.neon_POSTGRES_URL ??
    process.env.POSTGRES_URL ??
    null
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "mariadb-neon-bootstrap",
    method_required: "POST",
    write_scope: "neon_control_tables_only",
    migration_allowed: false,
    source_data_migration_allowed: false,
    message:
      "Bruk POST for å opprette Neon kontrolltabeller. Ruten migrerer ikke kildedata.",
  });
}

export async function POST() {
  const databaseUrl = getNeonDatabaseUrl();

  if (!databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb-neon-bootstrap",
        error:
          "Neon Database URL mangler. Fant ikke DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL eller POSTGRES_URL.",
      },
      { status: 500 }
    );
  }

  const sql = neon(databaseUrl);
  const createdTables: string[] = [];

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS ct_database_truth_status (
        id bigserial PRIMARY KEY,
        system_key text NOT NULL UNIQUE,
        mariadb_role text NOT NULL DEFAULT 'legacy_truth_and_control_archive',
        neon_role text NOT NULL DEFAULT 'new_database_connected_not_yet_truth',
        neon_truth_status text NOT NULL DEFAULT 'not_approved',
        migration_status text NOT NULL DEFAULT 'not_started',
        migration_allowed boolean NOT NULL DEFAULT false,
        source_data_migration_allowed boolean NOT NULL DEFAULT false,
        reason_no text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_database_truth_status");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_system_control_status (
        id bigserial PRIMARY KEY,
        control_key text NOT NULL UNIQUE,
        control_group text NOT NULL,
        status text NOT NULL DEFAULT 'not_started',
        severity text NOT NULL DEFAULT 'info',
        detail_no text,
        next_step text,
        deploy_blocking boolean NOT NULL DEFAULT false,
        migration_blocking boolean NOT NULL DEFAULT true,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_system_control_status");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_migration_control_runs (
        id bigserial PRIMARY KEY,
        run_key text NOT NULL UNIQUE,
        run_type text NOT NULL,
        status text NOT NULL DEFAULT 'created',
        started_at timestamptz NOT NULL DEFAULT now(),
        finished_at timestamptz,
        created_by text,
        summary_no text,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `;
    createdTables.push("ct_migration_control_runs");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_migration_control_logs (
        id bigserial PRIMARY KEY,
        run_key text,
        log_level text NOT NULL DEFAULT 'info',
        log_category text NOT NULL DEFAULT 'system',
        log_action text NOT NULL,
        message_no text NOT NULL,
        related_table text,
        related_route text,
        related_feature_key text,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_migration_control_logs");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_migration_table_inventory (
        id bigserial PRIMARY KEY,
        source_db text NOT NULL,
        table_schema text,
        table_name text NOT NULL,
        table_type text,
        row_count_estimate bigint,
        column_count integer,
        has_primary_key boolean,
        has_source_key boolean,
        has_object_group boolean,
        has_object_id boolean,
        inventory_status text NOT NULL DEFAULT 'pending',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_db, table_name)
      )
    `;
    createdTables.push("ct_migration_table_inventory");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_migration_table_map (
        id bigserial PRIMARY KEY,
        mariadb_table_name text NOT NULL UNIQUE,
        neon_table_name text,
        mapping_group text NOT NULL DEFAULT 'unclassified',
        mapping_status text NOT NULL DEFAULT 'not_mapped',
        migration_priority integer NOT NULL DEFAULT 0,
        migrate_structure boolean NOT NULL DEFAULT false,
        migrate_data boolean NOT NULL DEFAULT false,
        reason_no text,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_migration_table_map");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_migration_field_map (
        id bigserial PRIMARY KEY,
        mariadb_table_name text NOT NULL,
        mariadb_field_name text NOT NULL,
        neon_table_name text,
        neon_field_name text,
        field_group text NOT NULL DEFAULT 'unclassified',
        mapping_status text NOT NULL DEFAULT 'not_mapped',
        transform_rule text,
        is_identifier_field boolean NOT NULL DEFAULT false,
        is_relation_field boolean NOT NULL DEFAULT false,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (mariadb_table_name, mariadb_field_name)
      )
    `;
    createdTables.push("ct_migration_field_map");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_source_inventory (
        id bigserial PRIMARY KEY,
        source_key text NOT NULL UNIQUE,
        source_name_no text,
        source_type text,
        source_status text NOT NULL DEFAULT 'pending',
        object_count bigint NOT NULL DEFAULT 0,
        relation_count bigint NOT NULL DEFAULT 0,
        has_catalog_objects boolean NOT NULL DEFAULT false,
        has_filter_values boolean NOT NULL DEFAULT false,
        has_relations boolean NOT NULL DEFAULT false,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_source_inventory");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_object_group_inventory (
        id bigserial PRIMARY KEY,
        object_group text NOT NULL UNIQUE,
        object_group_name_no text,
        object_count bigint NOT NULL DEFAULT 0,
        source_count bigint NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'pending',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_object_group_inventory");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_object_inventory_summary (
        id bigserial PRIMARY KEY,
        source_key text NOT NULL,
        object_group text NOT NULL,
        object_count bigint NOT NULL DEFAULT 0,
        with_market_value_count bigint NOT NULL DEFAULT 0,
        without_market_value_count bigint NOT NULL DEFAULT 0,
        with_image_count bigint NOT NULL DEFAULT 0,
        without_image_count bigint NOT NULL DEFAULT 0,
        relation_count bigint NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'pending',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_key, object_group)
      )
    `;
    createdTables.push("ct_object_inventory_summary");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_relation_type_registry (
        id bigserial PRIMARY KEY,
        relation_type_key text NOT NULL UNIQUE,
        relation_name_no text NOT NULL,
        from_entity text NOT NULL,
        to_entity text NOT NULL,
        privacy_level text NOT NULL DEFAULT 'public',
        status text NOT NULL DEFAULT 'pending',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_relation_type_registry");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_relation_path_registry (
        id bigserial PRIMARY KEY,
        path_key text NOT NULL UNIQUE,
        path_name_no text NOT NULL,
        path_group text NOT NULL,
        path_order integer NOT NULL DEFAULT 0,
        path_definition_json jsonb NOT NULL DEFAULT '[]'::jsonb,
        required_for_migration boolean NOT NULL DEFAULT true,
        privacy_level text NOT NULL DEFAULT 'public',
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_relation_path_registry");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_relation_missing_links (
        id bigserial PRIMARY KEY,
        source_key text,
        object_group text,
        object_id_text text,
        relation_type_key text,
        missing_entity text,
        severity text NOT NULL DEFAULT 'warning',
        detail_no text,
        suggested_fix_no text,
        privacy_level text NOT NULL DEFAULT 'admin',
        status text NOT NULL DEFAULT 'open',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_relation_missing_links");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_relation_privacy_rules (
        id bigserial PRIMARY KEY,
        rule_key text NOT NULL UNIQUE,
        relation_type_key text,
        entity_type text NOT NULL,
        default_privacy_level text NOT NULL DEFAULT 'public',
        public_label_rule_no text,
        member_label_rule_no text,
        dealer_label_rule_no text,
        admin_label_rule_no text,
        hidden_rule_no text,
        status text NOT NULL DEFAULT 'active',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_relation_privacy_rules");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_market_channel_summary (
        id bigserial PRIMARY KEY,
        source_key text,
        object_group text,
        channel_key text NOT NULL,
        object_count bigint NOT NULL DEFAULT 0,
        observation_count bigint NOT NULL DEFAULT 0,
        missing_price_count bigint NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'pending',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_key, object_group, channel_key)
      )
    `;
    createdTables.push("ct_market_channel_summary");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_collection_summary (
        id bigserial PRIMARY KEY,
        source_key text,
        object_group text,
        user_scope text NOT NULL DEFAULT 'all',
        collection_item_count bigint NOT NULL DEFAULT 0,
        wishlist_count bigint NOT NULL DEFAULT 0,
        favorite_count bigint NOT NULL DEFAULT 0,
        transaction_count bigint NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'pending',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (source_key, object_group, user_scope)
      )
    `;
    createdTables.push("ct_collection_summary");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_user_identity_map (
        id bigserial PRIMARY KEY,
        mariadb_user_id_text text NOT NULL UNIQUE,
        neon_user_id uuid,
        public_id text,
        email_hash text,
        display_name_snapshot text,
        role_snapshot text,
        membership_snapshot text,
        mapping_status text NOT NULL DEFAULT 'not_mapped',
        auth_ready boolean NOT NULL DEFAULT false,
        session_ready boolean NOT NULL DEFAULT false,
        membership_ready boolean NOT NULL DEFAULT false,
        collection_ready boolean NOT NULL DEFAULT false,
        privacy_level text NOT NULL DEFAULT 'admin',
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_user_identity_map");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_user_auth_migration_check (
        id bigserial PRIMARY KEY,
        mariadb_user_id_text text NOT NULL,
        check_key text NOT NULL,
        status text NOT NULL DEFAULT 'not_checked',
        account_status text,
        email_status text,
        role_key text,
        is_admin boolean,
        is_active boolean,
        issue_no text,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        checked_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (mariadb_user_id_text, check_key)
      )
    `;
    createdTables.push("ct_user_auth_migration_check");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_user_session_migration_check (
        id bigserial PRIMARY KEY,
        mariadb_user_id_text text NOT NULL,
        session_source text NOT NULL DEFAULT 'mariadb',
        active_session_count bigint NOT NULL DEFAULT 0,
        expired_session_count bigint NOT NULL DEFAULT 0,
        session_migration_allowed boolean NOT NULL DEFAULT false,
        status text NOT NULL DEFAULT 'not_checked',
        issue_no text,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        checked_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (mariadb_user_id_text, session_source)
      )
    `;
    createdTables.push("ct_user_session_migration_check");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_user_membership_migration_check (
        id bigserial PRIMARY KEY,
        mariadb_user_id_text text NOT NULL UNIQUE,
        membership_key text,
        membership_status text,
        access_status text NOT NULL DEFAULT 'not_checked',
        access_rule_count bigint NOT NULL DEFAULT 0,
        missing_access_rule_count bigint NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'not_checked',
        issue_no text,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        checked_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_user_membership_migration_check");

    await sql`
      CREATE TABLE IF NOT EXISTS ct_user_collection_migration_check (
        id bigserial PRIMARY KEY,
        mariadb_user_id_text text NOT NULL UNIQUE,
        collection_item_count bigint NOT NULL DEFAULT 0,
        wishlist_count bigint NOT NULL DEFAULT 0,
        favorite_count bigint NOT NULL DEFAULT 0,
        transaction_count bigint NOT NULL DEFAULT 0,
        missing_object_key_count bigint NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'not_checked',
        issue_no text,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        checked_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    createdTables.push("ct_user_collection_migration_check");

    await sql`
      INSERT INTO ct_database_truth_status (
        system_key,
        migration_status,
        neon_truth_status,
        migration_allowed,
        source_data_migration_allowed,
        reason_no
      )
      VALUES (
        'collectium_mariadb_neon',
        'control_structure_created',
        'not_approved',
        false,
        false,
        'Neon kontrollstruktur er opprettet. Kildedata, brukere, samlinger og katalogobjekter er ikke migrert.'
      )
      ON CONFLICT (system_key)
      DO UPDATE SET
        migration_status = EXCLUDED.migration_status,
        neon_truth_status = EXCLUDED.neon_truth_status,
        migration_allowed = EXCLUDED.migration_allowed,
        source_data_migration_allowed = EXCLUDED.source_data_migration_allowed,
        reason_no = EXCLUDED.reason_no,
        updated_at = now()
    `;

    await sql`
      INSERT INTO ct_system_control_status (
        control_key,
        control_group,
        status,
        severity,
        detail_no,
        next_step,
        deploy_blocking,
        migration_blocking
      )
      VALUES
        ('structure', 'migration', 'created', 'info', 'Neon kontrolltabeller opprettet.', 'source_relation_overview', false, true),
        ('rules_methods_processes', 'migration', 'not_started', 'warning', 'Regler, metoder og prosesser er ikke kontrollert ennå.', 'table_mapping', false, true),
        ('source_data', 'migration', 'blocked', 'critical', 'Kildedata er blokkert til mapping, ID-kontroll og relasjoner er OK.', 'blocked', true, true),
        ('users_auth_session', 'user', 'not_checked', 'warning', 'Bruker, auth, session og medlemskap er ikke kontrollert mot Neon ennå.', 'user_identity_mapping', false, true)
      ON CONFLICT (control_key)
      DO NOTHING
    `;

    const tableCount = await sql`
      SELECT COUNT(*)::int AS table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'ct_%'
    `;

    return NextResponse.json({
      ok: true,
      source: "mariadb-neon-bootstrap",
      status: {
        bootstrap: "OK",
        structure_status: "control_structure_created",
        migration_status: "control_structure_created",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "source_relation_overview",
      },
      neon: {
        control_table_count: tableCount[0]?.table_count ?? null,
        created_or_verified_tables: createdTables,
      },
      user_control: {
        included: true,
        tables: [
          "ct_user_identity_map",
          "ct_user_auth_migration_check",
          "ct_user_session_migration_check",
          "ct_user_membership_migration_check",
          "ct_user_collection_migration_check",
        ],
      },
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_control_tables_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Bootstrap oppretter bare kontrolltabeller i Neon. Ingen kildedata, brukere, samlinger, katalogobjekter eller markedsdata migreres.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb-neon-bootstrap",
        status: {
          bootstrap: "ERROR",
          migration_allowed: false,
          source_data_migration_allowed: false,
        },
        created_before_error: createdTables,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
