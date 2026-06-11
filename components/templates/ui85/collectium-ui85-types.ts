/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Collectium UI85 template types
 * Definering / formål: Shared UI85 preview type contracts.
 * Bruksområde: components/templates/ui85
 * Berørte DB-brytere / feature_keys: template.ui85.preview.view
 * Berørte API-ruter: Ingen
 * Berørte tabeller / views: Ingen
 * Dataretning: Type definitions only
 * Logging: Ingen runtime logging
 * Versjon: UI85-REACT-TEMPLATE-V19
 */

import type { ReactNode } from "react";

export type CollectiumUi85Skin = "collectium" | "samler" | "museum" | "finans";

export type CollectiumUi85TemplateProps = {
  skin?: CollectiumUi85Skin;
  children: ReactNode;
};

export type CollectiumUi85Action = {
  label: string;
  meta: string;
  count?: string;
  icon: "heart" | "star" | "plus" | "share";
};
