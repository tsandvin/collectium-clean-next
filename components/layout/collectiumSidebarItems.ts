/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium global sidebar menu
 *
 * Definering / formål:
 * Global menystruktur for Next.js/Vercel/Neon-versjonen av Collectium.
 *
 * Bruksområde:
 * Brukes av global AppShell/Sidebar på alle sider.
 *
 * Berørte sider / routes:
 * - /
 * - /katalog
 * - /test/periodefilter
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[relationType]/[relationKey]
 * - /min-side
 * - /samling
 * - /auksjon
 * - /nettbutikk
 * - /forhandler
 * - /admin
 * - /admin/neon
 * - /support
 *
 * Berørte DB-brytere / feature_keys:
 * - navigation.sidebar.view
 * - account.view
 * - admin.neon.view
 *
 * Dataretning:
 * Menu config → Global Sidebar → UI
 *
 * Logging:
 * log_category: navigation
 * log_action: sidebar_view
 */

export interface CollectiumSidebarItem {
  key: string;
  label: string;
  shortLabel: string;
  href: string;
  description: string;
  group: "Hoved" | "Bruker" | "Marked" | "System";
  disabled?: boolean;
}

export const collectiumSidebarItems: CollectiumSidebarItem[] = [
  {
    key: "index",
    label: "Index",
    shortLabel: "I",
    href: "/",
    description: "Markedsindex og analyseoversikt",
    group: "Hoved",
  },
  {
    key: "catalog",
    label: "Katalog",
    shortLabel: "K",
    href: "/katalog",
    description: "Relasjonskatalog for objekter",
    group: "Hoved",
  },
  {
    key: "period-filter",
    label: "Periodefilter",
    shortLabel: "P",
    href: "/test/periodefilter",
    description: "Periodefilter og tidslinje",
    group: "Hoved",
  },
  {
    key: "period-search",
    label: "Periode søk",
    shortLabel: "PS",
    href: "/test/period-timeline",
    description: "Periodesøk og tidslinjevisning",
    group: "Hoved",
  },
  {
    key: "object",
    label: "Objekt",
    shortLabel: "O",
    href: "/objekt/norske_sedler/banknote/9",
    description: "Eksempel på objektpresentasjon",
    group: "Hoved",
  },
  {
    key: "relations",
    label: "Relasjoner",
    shortLabel: "R",
    href: "/relasjon/regent/olav-v",
    description: "Relasjonspresentasjon",
    group: "Hoved",
  },
  {
    key: "account",
    label: "Min side",
    shortLabel: "M",
    href: "/min-side",
    description: "Profil, medlemskap, varsler og prosesser",
    group: "Bruker",
  },
  {
    key: "collection",
    label: "Min samling",
    shortLabel: "S",
    href: "/samling",
    description: "Brukerens samling",
    group: "Bruker",
  },
  {
    key: "auction",
    label: "Auksjon",
    shortLabel: "A",
    href: "/auksjon",
    description: "Auksjoner og bud",
    group: "Marked",
  },
  {
    key: "shop",
    label: "Nettbutikk",
    shortLabel: "N",
    href: "/nettbutikk",
    description: "Kjøp og salgsobjekter",
    group: "Marked",
  },
  {
    key: "dealer",
    label: "Forhandler",
    shortLabel: "F",
    href: "/forhandler",
    description: "Forhandlerpanel",
    group: "Marked",
  },
  {
    key: "admin",
    label: "Admin",
    shortLabel: "A",
    href: "/admin",
    description: "Admin oversikt",
    group: "System",
  },
  {
    key: "admin-neon",
    label: "Neon Control",
    shortLabel: "N",
    href: "/admin/neon",
    description: "Neon, API, logging, tester og deploy gate",
    group: "System",
  },
  {
    key: "support",
    label: "Support",
    shortLabel: "?",
    href: "/support",
    description: "Hjelp og systemstatus",
    group: "System",
  },
];
