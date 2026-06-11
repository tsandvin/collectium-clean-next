/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side raw types
 *
 * Definering / formål:
 * TypeScript-typer for rå API-drevet Min side.
 *
 * Bruksområde:
 * Brukes av components/account/MinSideRawClient.tsx.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Dataretning:
 * API/backend -> React -> UI
 *
 * Versjon:
 * CT-FILE-MINSIDE-RAW-0003 / CHANGE-2026-06-11-0002
 */

export type MinSideEndpointStatus = "loading" | "ok" | "missing" | "error";

export type MinSideEndpointState = {
  key: string;
  label: string;
  path: string;
  status: MinSideEndpointStatus;
  httpStatus: number | null;
  detail: string;
};
