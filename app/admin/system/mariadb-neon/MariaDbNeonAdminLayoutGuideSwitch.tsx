"use client";

/*
 * Overskrift:
 * MariaDB - Neon Admin Layout Guide Switch
 *
 * Definering / formål:
 * Viser Layout / DB URL-innhold kun for innlogget admin.
 *
 * Bruksområde:
 * Brukes på /admin/system/mariadb-neon.
 *
 * Berørte DB-brytere / feature_keys:
 * admin.system.mariadb_neon.control
 * system.layout_guide.admin_visibility
 *
 * Berørte sider/routes:
 * /admin/system/mariadb-neon
 * /api/admin/auth/status
 */

import { useEffect, useState } from "react";
import MariaDbNeonLayoutGuide from "./MariaDbNeonLayoutGuide";
import styles from "./MariaDbNeonAdminLayoutGuideSwitch.module.css";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasAdminAccess(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const directAdmin =
    value.is_admin === true ||
    value.is_admin === 1 ||
    value.isAdmin === true ||
    value.admin === true ||
    value.is_super_admin === true ||
    value.is_super_admin === 1;

  if (directAdmin) {
    return true;
  }

  const role = typeof value.role === "string" ? value.role.toLowerCase() : "";
  const userRole = isRecord(value.user) && typeof value.user.role === "string" ? value.user.role.toLowerCase() : "";

  if (role.includes("admin") || userRole.includes("admin")) {
    return true;
  }

  if (isRecord(value.user) && hasAdminAccess(value.user)) {
    return true;
  }

  if (isRecord(value.session) && hasAdminAccess(value.session)) {
    return true;
  }

  if (isRecord(value.auth) && hasAdminAccess(value.auth)) {
    return true;
  }

  return false;
}

export default function MariaDbNeonAdminLayoutGuideSwitch() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminStatus() {
      try {
        const response = await fetch("/api/admin/auth/status", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        const payload = (await response.json()) as unknown;

        if (isMounted) {
          setIsAdmin(hasAdminAccess(payload));
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }

    loadAdminStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.adminSwitchBox} aria-live="polite">
        <span className={styles.smallStatus}>Sjekker adminstatus ...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.adminSwitchBox}>
      <div className={styles.switchText}>
        <strong>Adminvisning</strong>
        <span>Layout / DB URL er kun tilgjengelig for innlogget admin.</span>
      </div>

      <label className={styles.switchLabel}>
        <input
          type="checkbox"
          checked={showGuide}
          onChange={(event) => setShowGuide(event.target.checked)}
        />
        <span className={styles.switchTrack}>
          <span className={styles.switchThumb} />
        </span>
        <span className={styles.switchName}>
          {showGuide ? "Skjul Layout / DB URL" : "Vis Layout / DB URL"}
        </span>
      </label>

      {showGuide ? (
        <div className={styles.guideButtonSlot}>
          <MariaDbNeonLayoutGuide />
        </div>
      ) : null}
    </div>
  );
}
