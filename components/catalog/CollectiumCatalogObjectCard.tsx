"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium CatalogObjectCard testbar komponent
 *
 * Definering / formål:
 * Egen visningskortkomponent for Collectium relasjonskatalog.
 * Kortet viser objektidentitet, bilde, katalogfelt, relasjoner, marked/status og brukerhandlinger.
 *
 * Bruksområde:
 * Brukes av /katalog og /test/CatalogObjectCard.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /test/CatalogObjectCard
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.view
 * - catalog.object.open
 * - catalog.market
 * - catalog.history
 * - collection.wishlist.toggle
 * - collection.favorite.toggle
 * - collection.item.add
 *
 * Dataretning:
 * API/backend -> React -> UI
 */

import styles from "./CollectiumCatalog86Client.module.css";
import type {
  CatalogObject,
  CatalogRelation,
  CatalogSegment,
  CatalogView,
} from "./collectium-catalog86-types";

type FlexibleRelation = CatalogRelation & {
  display_name_no?: string | null;
  relation_label_no?: string | null;
  relation_slug?: string | null;
};

function objectTitle(object: CatalogObject): string {
  return (
    object.collectium_title_no ||
    object.title_no ||
    [
      object.denomination_raw_no,
      object.denomination_issue_raw_no,
      object.object_year_label || object.publication_year_label,
      object.variant_type_raw_no,
    ]
      .filter(Boolean)
      .join(" · ") ||
    "Objekt uten tittel"
  );
}

function objectHref(object: CatalogObject): string {
  if (object.href) return object.href;

  return `/objekt/${encodeURIComponent(object.source_key)}/${encodeURIComponent(
    object.object_group,
  )}/${encodeURIComponent(String(object.object_id))}`;
}

function formatValue(value: CatalogObject["market_value_nok"], raw?: string | null): string {
  if (raw && raw.trim() && raw !== "0" && raw !== "0.00") return raw;

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === 0 ||
    value === "0" ||
    value === "0.00"
  ) {
    return "Mangler markedsverdi";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Mangler markedsverdi";

  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function relationLabel(relation: FlexibleRelation): string {
  return (
    relation.label_no ||
    relation.display_name_no ||
    relation.relation_label_no ||
    relation.relation_key ||
    "Relasjon"
  );
}

function relationHref(relation: FlexibleRelation): string {
  if (relation.href) return relation.href;

  const key = relation.relation_slug || relation.relation_key;
  return `/relasjon/${relation.relation_type}/${key}`;
}

function buildFallbackRelations(object: CatalogObject): FlexibleRelation[] {
  const relations: FlexibleRelation[] = [];

  const add = (relation_type: string, value?: string | number | null) => {
    if (!value) return;

    const key = String(value)
      .toLowerCase()
      .replaceAll(" ", "-")
      .replaceAll("/", "-");

    relations.push({
      relation_type,
      relation_key: key,
      label_no: String(value),
      href: `/relasjon/${relation_type}/${key}`,
    });
  };

  add("ar", object.object_year_label || object.publication_year_label);
  add("regent", object.ruler_name_raw_no);
  add("signatur", object.signature_raw_no);
  add("utgave", object.denomination_issue_raw_no);
  add("variant", object.variant_type_raw_no);
  add("kilde", object.source_key);

  return relations;
}

function Meta({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function CollectiumCatalogObjectCard({
  object,
  segment,
  view,
}: {
  object: CatalogObject;
  segment: CatalogSegment;
  view: CatalogView;
}) {
  const href = objectHref(object);
  const title = objectTitle(object);
  const image = object.thumbnail_url || object.image_url;
  const value = formatValue(object.market_value_nok, object.market_value_raw_no);

  const relations = Array.isArray(object.relations) && object.relations.length > 0
    ? (object.relations.slice(0, 5) as FlexibleRelation[])
    : buildFallbackRelations(object);

  const viewClass =
    view === "horizontal"
      ? styles.ui85HorizontalCard
      : view === "standing"
        ? styles.ui85StandingCard
        : view === "list"
          ? styles.ui85ListCard
          : styles.ui85MuseumCard;

  const imageLabel = image ? title : "Bilde ikke registrert";

  return (
    <article className={`${styles.objectCard} ${styles.ui85Card} ${viewClass}`}>
      <a
        className={styles.imageArea}
        href={`${href}?segment=${segment}&from=katalog`}
        aria-label={`Åpne ${title}`}
      >
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <span className={styles.banknotePlaceholder} aria-label={imageLabel}>
            <span className={styles.banknoteNumber}>100</span>
            <span className={styles.banknoteSeal} />
            <span className={styles.banknoteBank}>Norges Bank</span>
          </span>
        )}
      </a>

      <div className={styles.identityArea}>
        <div className={styles.cardHeaderLine}>
          <p>{object.source_catalog_number || object.source_key}</p>
          <span>{object.object_group}</span>
        </div>

        <h2>
          <a href={`${href}?segment=${segment}&from=katalog`}>
            {view === "museum" ? `Museum · ${title}` : title}
          </a>
        </h2>

        <div className={styles.metaGrid}>
          <Meta label="Valør" value={object.denomination_raw_no} />
          <Meta label="Valørutgave / serie" value={object.denomination_issue_raw_no} />
          <Meta label="Variant" value={object.variant_type_raw_no} />
          <Meta label="Sjeldenhet" value={object.rarity_raw_no || "Ikke vurdert"} />
        </div>

        <p className={styles.sourceLine}>
          {[
            object.source_key,
            object.object_group,
            object.object_year_label || object.publication_year_label,
            object.ruler_name_raw_no,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className={styles.relationArea}>
        <div className={styles.relationHeading}>
          <span className={styles.relationIcon}>▣</span>
          <strong>Historie</strong>
          <small>{object.object_year_label || object.publication_year_label || "Ukjent år"}</small>
        </div>

        <div className={styles.relationGrid}>
          <Meta label="Regent / konge" value={object.ruler_name_raw_no || "Ikke registrert"} />
          <Meta label="Motiv / person" value={title} />
          <Meta label="Årstall" value={object.object_year_label || object.publication_year_label} />
          <Meta label="Historisk kontekst" value={object.historical_period_label_no || "Ikke registrert"} />
          <Meta label="Signatur" value={object.signature_raw_no || "Ikke registrert"} />
          <Meta label="Relasjon" value={relations.length > 0 ? "Relasjon tilgjengelig" : "Relasjon mangler"} />
        </div>

        {(view === "museum" || segment === "historie") && relations.length > 0 && (
          <div className={styles.relationChips}>
            {relations.slice(0, 4).map((relation) => (
              <a
                key={`${relation.relation_type}-${relation.relation_key}`}
                href={relationHref(relation)}
              >
                {relationLabel(relation)}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className={styles.marketArea}>
        <div className={`${styles.channelBox} ${styles.wishlistBox}`}>
          <span>♥ Hjerte</span>
          <strong>{object.user_state?.wishlist ? "Ja" : "Nei"}</strong>
        </div>

        <div className={`${styles.channelBox} ${styles.favoriteBox}`}>
          <span>★ Stjerne</span>
          <strong>{object.user_state?.favorite ? "Ja" : "Nei"}</strong>
        </div>

        <div className={`${styles.channelBox} ${styles.auctionBox}`}>
          <span>⚑ Auksjon</span>
          <strong>{object.auction_status_raw_no || "Ikke aktiv"}</strong>
        </div>

        <div className={`${styles.channelBox} ${styles.shopBox}`}>
          <span>◆ Nettbutikk</span>
          <strong>{object.shop_status_raw_no || "Ikke aktiv"}</strong>
        </div>

        <div className={styles.valueBox}>
          <span>Estimert pris</span>
          <strong>{value === "Mangler markedsverdi" ? "Ikke estimert" : value}</strong>
          <em>{value === "Mangler markedsverdi" ? "Mangler markedsverdi" : "Markedsverdi"}</em>
        </div>
      </div>

      <div className={styles.actionArea}>
        <a href={`${href}?segment=${segment}&from=katalog`} className={styles.openButton}>
          ↗ Åpne objekt
        </a>

        <a href={relations[0]?.href || `/relasjon/kilde/${object.source_key}`} className={styles.openButton}>
          ⌘ Se relasjon
        </a>

        <button type="button" data-feature-key="collection.item.add">
          ◎ Legg i samling
        </button>

        <button type="button" aria-label="Flere handlinger">
          •••
        </button>
      </div>
    </article>
  );
}
