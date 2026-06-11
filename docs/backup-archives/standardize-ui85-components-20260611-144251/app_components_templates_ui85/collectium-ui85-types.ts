/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Collectium UI85 template types
 * Definering / formal: Shared UI85 preview type contracts.
 * Bruksomrade: components/templates/ui85
 * Berorte DB-brytere / feature_keys: template.ui85.preview.view
 * Berorte API-ruter: Ingen
 * Berorte tabeller / views: Ingen
 * Dataretning: Type definitions only
 * Logging: Ingen runtime logging
 * Versjon: UI85-REACT-TEMPLATE-V17
 */

export type CollectiumUi85Skin = "collectium" | "samler" | "museum" | "finans";

export type CollectiumUi85TemplateProps = {
  skin?: CollectiumUi85Skin;
  children: React.ReactNode;
};

export type CollectiumUi85Action = {
  label: string;
  meta: string;
  count?: string;
  icon: "heart" | "star" | "plus" | "share";
};
