/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Objektpresentasjon dynamisk rute
 *
 * Definering / formål:
 * Next.js-route for ekte objektpresentasjon basert på source_key + object_group + object_id.
 * Ruten krever innlogging, men kan vise begrenset objekt dersom shared-token finnes.
 *
 * Bruksområde:
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - Delt lenke: /objekt/[sourceKey]/[objectGroup]/[objectId]?share=<token>
 *
 * Berørte DB-brytere / feature_keys:
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 *
 * Berørte API-ruter:
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 */

import CollectiumObjectPresentationClient from "../../../../../components/object/CollectiumObjectPresentationClient";

type PageProps = {
  params: Promise<{
    sourceKey: string;
    objectGroup: string;
    objectId: string;
  }>;
  searchParams: Promise<{
    share?: string;
    token?: string;
    preview?: string;
  }>;
};

export default async function ObjectPresentationPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  // TODO: Bytt mock med getCurrentSessionUser() / GET /api/auth/session.
  // Ruten skal kreve innlogging, men shared-link kan vise ett spesifikt objekt begrenset.
  const isLoggedIn = false;
  const isSharedLink = Boolean(resolvedSearch.share || resolvedSearch.token || resolvedSearch.preview === "shared");

  return (
    <CollectiumObjectPresentationClient
      mode="object"
      isLoggedIn={isLoggedIn}
      isSharedLink={isSharedLink}
      routeObject={resolvedParams}
    />
  );
}
