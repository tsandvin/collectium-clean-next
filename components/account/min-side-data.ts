/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side mock data
 *
 * Definering / formål:
 * Midlertidig fallback-data for Min side før API er koblet på.
 * Skal erstattes av /api/auth/session og /api/account/*.
 *
 * Bruksområde:
 * Brukes av MinSideShell i første React-visning.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.overview.view
 * - membership.view
 * - collection.view
 *
 * Berørte API-ruter:
 * - GET /api/auth/session
 * - GET /api/account/overview
 *
 * Berørte tabeller / views:
 * - ct_users
 * - ct_collection_items
 * - ct_user_object_states
 *
 * Dataretning:
 * Fallback/mock -> React -> UI. Produksjon: API/backend -> React -> UI.
 *
 * Logging:
 * log_category: account
 * log_action: min_side.mock_data
 *
 * Versjon:
 * CT-FILE-MINSIDE-0003 / CHANGE-2026-06-11-0001
 */

import type { ActivityItem, MinSideTab, ProcessItem, StatusCard } from "./min-side-types";

export const minSideUser = {
  displayName: "Thomas Sandvin",
  membership: "Silver",
  roleLabel: "Samler",
  accountStatus: "Aktiv konto",
  emailStatus: "E-post bekreftet",
  lastSeen: "Sist aktiv i dag",
};

export const minSideTabs: MinSideTab[] = [
  { key: "overview", label: "Oversikt", eyebrow: "Start" },
  { key: "profile", label: "Profil", eyebrow: "Konto" },
  { key: "membership", label: "Medlemskap", eyebrow: "Tilgang", badge: "Silver" },
  { key: "collection", label: "Min samling", eyebrow: "Objekter", badge: "142" },
  { key: "wishlist", label: "Ønskeliste", eyebrow: "Hjerte", badge: "22" },
  { key: "favorites", label: "Favoritter", eyebrow: "Stjerne", badge: "14" },
  { key: "trade", label: "Kjøp / salg", eyebrow: "Marked", badge: "6" },
  { key: "transactions", label: "Transaksjonslogg", eyebrow: "Arkiv" },
  { key: "processes", label: "Prosesser", eyebrow: "Arbeid", badge: "3" },
  { key: "notifications", label: "Varsler", eyebrow: "Status", badge: "5" },
  { key: "messages", label: "Meldinger", eyebrow: "Dialog", badge: "2" },
  { key: "documents", label: "Dokumenter", eyebrow: "Filer" },
  { key: "settings", label: "Innstillinger", eyebrow: "Valg" },
  { key: "security", label: "Sikkerhet", eyebrow: "Session" },
  { key: "dealer", label: "Forhandler", eyebrow: "Rolle", role: "dealer", locked: true },
  { key: "admin", label: "Admin kontroll", eyebrow: "System", role: "admin", locked: true },
];

export const statusCards: StatusCard[] = [
  { label: "Medlemskap", value: "Silver", detail: "Avanserte filter og samlingsanalyse", status: "ok" },
  { label: "Min samling", value: "142", detail: "Objekter registrert i samling", status: "info" },
  { label: "Estimert verdi", value: "186 000 NOK", detail: "37 objekter mangler verdi", status: "warning" },
  { label: "Prosesser", value: "3", detail: "2 krever handling", status: "danger" },
  { label: "Varsler", value: "5", detail: "3 uleste systemvarsler", status: "warning" },
  { label: "Meldinger", value: "2", detail: "1 fra forhandler", status: "info" },
];

export const processItems: ProcessItem[] = [
  {
    title: "Dokumentasjon mangler",
    objectLabel: "1 krone · 1917 · Litra A",
    status: "Krever handling",
    due: "07.06.2026",
    action: "Last opp dokumentasjon",
    severity: "danger",
  },
  {
    title: "Forhandlerforslag klart",
    objectLabel: "100 kroner · 1. utgave · 1877",
    status: "Venter godkjenning",
    due: "12.06.2026",
    action: "Se forslag",
    severity: "warning",
  },
  {
    title: "Auksjonsoppgjør under behandling",
    objectLabel: "2 kroner · Jubileumsutgave · 1914",
    status: "Under behandling",
    due: "18.06.2026",
    action: "Følg oppgjør",
    severity: "info",
  },
];

export const activityItems: ActivityItem[] = [
  { title: "Objekt lagt i ønskeliste", detail: "NSNR 23a · Norske sedler", time: "I dag 12:18", type: "Ønskeliste" },
  { title: "Melding fra forhandler", detail: "Vurdering klar for 1 krone 1917", time: "I dag 09:42", type: "Melding" },
  { title: "Kjøp registrert", detail: "100 kroner · 1. utgave · 1877", time: "I går 18:04", type: "Transaksjon" },
  { title: "Sikkerhetskontroll", detail: "Ny session registrert fra kjent enhet", time: "I går 08:11", type: "Sikkerhet" },
];
