"use client";

/**
 * COLLECTIUM FILE HEADER
 * Overskrift:
 * NeonRelationDbTree
 *
 * Definering / formål:
 * - Felles React-komponent for å vise Neon namespace-, relasjons- og katalogmapping-tree.
 *
 * Bruksområde:
 * - /admin/system/mariadb-neon
 * - /katalog/kontroll/eksempel
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-relation-db-tree
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 */

import { useEffect, useState } from "react";
import styles from "./NeonRelationDbTree.module.css";

type TreeChild = {
  key: string;
  label_no: string;
  detail_no?: string | null;
  example_table_name?: string | null;
  canonical_catalog_table?: string | null;
  physical_mariadb_source?: string | null;
  legacy_table_name?: string | null;
  source_role?: string | null;
  row_count?: number | null;
  exists?: boolean | null;
  control_status?: string | null;
};

type TreeNode = {
  key: string;
  label_no: string;
  status: "OK" | "VARSEL" | "INFO" | "FEIL";
  children: TreeChild[];
};

type DbTreeResponse = {
  ok: boolean;
  source: string;
  checked_at: string;
  summary: {
    namespace_count: number;
    namespace_error_count: number;
    entity_geography_count: number;
    catalog_mapping_count: number;
    relation_registry_count: number;
    platform_registry_count: number;
  };
  namespace_status_summary: Array<{
    naming_status: string;
    object_count: number;
  }>;
  tree: TreeNode[];
};

function statusClass(status: string): string {
  if (status === "OK") return styles.ok;
  if (status === "INFO") return styles.info;
  if (status === "VARSEL") return styles.warning;
  return styles.error;
}

export default function NeonRelationDbTree() {
  const [data, setData] = useState<DbTreeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTree() {
    setError(null);

    try {
      const response = await fetch(`/api/system/neon-relation-db-tree?ts=${Date.now()}`, {
        cache: "no-store"
      });

      const json = (await response.json()) as DbTreeResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil ved lasting av DB-tree.");
    }
  }

  useEffect(() => {
    loadTree();
  }, []);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Neon relasjon DB-tree</p>
          <h2>Namespace, relasjoner og katalogkilder</h2>
          <p>
            Viser hvordan Neon er delt mellom land, regioner, Europa/globalt nivå,
            relasjonsregistre, entity geography og katalogmapping.
          </p>
        </div>

        <button className={styles.button} type="button" onClick={loadTree}>
          Oppdater DB-tree
        </button>
      </header>

      {error ? (
        <div className={styles.errorBox}>
          <strong>Feil</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {!data ? (
        <div className={styles.loading}>Laster relasjon DB-tree...</div>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <article>
              <span>Namespaces</span>
              <strong>{data.summary.namespace_count}</strong>
            </article>
            <article>
              <span>Navnefeil</span>
              <strong>{data.summary.namespace_error_count}</strong>
            </article>
            <article>
              <span>Entities</span>
              <strong>{data.summary.entity_geography_count}</strong>
            </article>
            <article>
              <span>Katalogmapping</span>
              <strong>{data.summary.catalog_mapping_count}</strong>
            </article>
            <article>
              <span>Relasjonsregistre</span>
              <strong>{data.summary.relation_registry_count}</strong>
            </article>
          </div>

          <div className={styles.statusLine}>
            <span className={`${styles.statusPill} ${data.ok ? styles.ok : styles.warning}`}>
              {data.ok ? "Namespace OK" : "Namespace varsel"}
            </span>
            {data.namespace_status_summary.map((row) => (
              <span className={styles.statusMini} key={row.naming_status}>
                {row.naming_status}: {row.object_count}
              </span>
            ))}
          </div>

          <div className={styles.tree}>
            {data.tree.map((node) => (
              <details className={styles.treeNode} key={node.key} open>
                <summary>
                  <span>{node.label_no}</span>
                  <span className={`${styles.statusPill} ${statusClass(node.status)}`}>
                    {node.status}
                  </span>
                </summary>

                <div className={styles.children}>
                  {node.children.length === 0 ? (
                    <p className={styles.empty}>Ingen rader.</p>
                  ) : (
                    node.children.map((child) => (
                      <article className={styles.childCard} key={child.key}>
                        <strong>{child.label_no}</strong>

                        {child.detail_no ? <p>{child.detail_no}</p> : null}
                        {child.example_table_name ? (
                          <small>Eksempel: {child.example_table_name}</small>
                        ) : null}

                        {child.canonical_catalog_table ? (
                          <small>Kanonisk: {child.canonical_catalog_table}</small>
                        ) : null}
                        {child.physical_mariadb_source ? (
                          <small>Fysisk MariaDB: {child.physical_mariadb_source}</small>
                        ) : null}
                        {child.legacy_table_name ? (
                          <small>Legacy: {child.legacy_table_name}</small>
                        ) : null}
                        {child.source_role ? <small>Rolle: {child.source_role}</small> : null}

                        {typeof child.exists === "boolean" ? (
                          <small>{child.exists ? "Finnes i Neon" : "Mangler i Neon"}</small>
                        ) : null}

                        {typeof child.row_count === "number" ? (
                          <small>Rader: {child.row_count}</small>
                        ) : null}

                        {child.control_status ? (
                          <small>Kontroll: {child.control_status}</small>
                        ) : null}
                      </article>
                    ))
                  )}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}


