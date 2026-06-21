/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Objektpresentasjon demo / ny bruker
 *
 * Definering / formål:
 * Offentlig presentasjonsside som viser hvordan Collectium objektpresentasjon fungerer.
 * Den bruker 10 dummyobjekter øverst og er ikke koblet til ekte brukerdata.
 *
 * Bruksområde:
 * - Nye brukere kan se objektpresentasjon uten innlogging.
 * - Brukes til UI/UX-demo, skin-test og funksjonsforklaring.
 *
 * Berørte routes:
 * - /objektpresentasjon
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen skrivehandlinger. Demo av object.presentation.view.
 *
 * Berørte API-ruter:
 * - Senere: GET /api/object/presentation?demo=1
 */

import CollectiumObjectPresentationClient from "../../components/object/CollectiumObjectPresentationClient";

export default function ObjektpresentasjonDemoPage() {
  return <CollectiumObjectPresentationClient mode="demo" isLoggedIn={false} />;
}
