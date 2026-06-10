-- COLLECTIUM FILE HEADER
--
-- Overskrift:
-- Neon Auth Schema
--
-- Definering / formÃ¥l:
-- Oppretter Neon/Postgres-tabeller for Collectium auth, login, registrering og session.
--
-- BruksomrÃ¥de:
-- KjÃ¸res i Neon SQL Editor fÃ¸r login/registrering testes.
--
-- BerÃ¸rte sider / routes:
-- - /login
-- - /registrering
-- - /api/auth/login
-- - /api/auth/register
-- - /api/auth/logout
-- - /api/auth/session
--
-- BerÃ¸rte DB-brytere / feature_keys:
-- - auth.login
-- - auth.register
-- - auth.logout
-- - auth.session.view
--
-- BerÃ¸rte API-ruter:
-- - /api/auth/*
--
-- BerÃ¸rte tabeller / views:
-- - ct_users
-- - ct_user_sessions
-- - ct_login_attempts
--
-- Dataretning:
-- Neon/Postgres -> API/backend -> Next.js -> React -> UI
--
-- Logging:
-- log_category: auth
-- log_action: schema.bootstrap
--
-- Versjon:
-- CT-SQL-AUTH-NEON-0001 / CHANGE-2026-06-10-0002

create extension if not exists pgcrypto;

create table if not exists ct_users (
  id bigserial primary key,
  public_id text not null unique default gen_random_uuid()::text,
  email text not null unique,
  password_hash text,
  display_name text not null default 'Collectium bruker',
  public_display_name text,
  preferred_language text not null default 'no',
  preferred_theme text not null default 'signature-light',
  account_status text not null default 'active',
  email_status text not null default 'unverified',
  admin_approval_status text not null default 'pending',
  role text not null default 'user',
  membership_level text not null default 'free',
  is_admin boolean not null default false,
  is_active boolean not null default true,
  is_online boolean not null default false,
  last_login_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ct_users_email_lower on ct_users (lower(email));
create index if not exists idx_ct_users_role on ct_users (role);
create index if not exists idx_ct_users_membership_level on ct_users (membership_level);

create table if not exists ct_user_sessions (
  id bigserial primary key,
  user_id bigint not null references ct_users(id) on delete cascade,
  session_token text not null unique,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  is_active boolean not null default true
);

create index if not exists idx_ct_user_sessions_token on ct_user_sessions (session_token);
create index if not exists idx_ct_user_sessions_user_active on ct_user_sessions (user_id, is_active);

create table if not exists ct_login_attempts (
  id bigserial primary key,
  email text,
  user_id bigint,
  success boolean not null default false,
  failure_reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ct_login_attempts_email_created on ct_login_attempts (lower(email), created_at desc);
create index if not exists idx_ct_login_attempts_user_created on ct_login_attempts (user_id, created_at desc);

select
  'neon_auth_schema_ok' as status,
  now() as checked_at,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('ct_users', 'ct_user_sessions', 'ct_login_attempts')) as auth_table_count;
