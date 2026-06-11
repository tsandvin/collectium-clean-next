/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Template Token Check Route
 *
 * Definering / formål:
 * Read-only kontrollrute som sjekker at Collectium UI 8.5 bruker riktige
 * globale template-/skin-tokens og at tokenene brukes på riktig type komponent.
 *
 * Bruksområde:
 * Brukes av MariaDB -> Neon Control / Template / Skin for å kontrollere
 * at layout, template, kort, paneler, statusfelt og signatur ikke bruker
 * tilfeldige lokale farger.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.template.token_check
 * - system.skin.control
 * - system.layout.control
 *
 * Berørte API-ruter:
 * - GET /api/system/template-token-check
 *
 * Berørte tabeller / views:
 * - Ingen. Leser kun prosjektfiler.
 *
 * Dataretning:
 * Filesystem -> API/backend -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: template.token_check
 *
 * Versjon:
 * CT-FILE-TEMPLATE-TOKEN-CHECK-0001
 *
 * Endringsregel:
 * Read-only. Skal ikke skrive filer eller migrere data.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TokenStatus = "OK" | "VARSEL" | "FEIL" | "INFO";

type TokenRule = {
  token: string;
  required: boolean;
  expected_use_no: string;
  must_appear_near: string[];
};

type TokenCheckLine = {
  line_no: number;
  status: TokenStatus;
  token: string;
  expected_use_no: string;
  found_count: number;
  usage_count: number;
  detail_no: string;
  suggestion_no: string;
};

const TOKEN_RULES: TokenRule[] = [
  {
    token: "--ct-app-bg",
    required: true,
    expected_use_no: "Hovedbakgrunn for hele appen/body/page.",
    must_appear_near: ["body", "html", ".page", ".app", "background"],
  },
  {
    token: "--ct-app-sidebar-bg",
    required: true,
    expected_use_no: "Sidebar/global meny-bakgrunn.",
    must_appear_near: ["sidebar", "side", "menu", "nav"],
  },
  {
    token: "--ct-app-topbar-bg",
    required: true,
    expected_use_no: "Topbar-bakgrunn.",
    must_appear_near: ["topbar", "header"],
  },
  {
    token: "--ct-panel-bg",
    required: true,
    expected_use_no: "Hero, store paneler og hovedpaneler.",
    must_appear_near: ["panel", "hero", "section"],
  },
  {
    token: "--ct-panel-solid",
    required: true,
    expected_use_no: "Solide flater når transparens ikke fungerer, knapper og input.",
    must_appear_near: ["button", "input", "solid", "field"],
  },
  {
    token: "--ct-card-bg",
    required: true,
    expected_use_no: "Vanlige kort, kataloginngang, KPI-kort og fakta-kort.",
    must_appear_near: ["card", "tile", "kpi"],
  },
  {
    token: "--ct-panel-border",
    required: true,
    expected_use_no: "Standardramme rundt paneler og kort.",
    must_appear_near: ["border"],
  },
  {
    token: "--ct-border-strong",
    required: true,
    expected_use_no: "Forsterket ramme ved hover, fokus og aktiv tilstand.",
    must_appear_near: ["hover", "focus", "active", "border"],
  },
  {
    token: "--ct-line",
    required: true,
    expected_use_no: "Skillelinjer mellom felt i paneler.",
    must_appear_near: ["line", "divider", "border"],
  },
  {
    token: "--ct-text",
    required: true,
    expected_use_no: "Primærtekst, titler og faktaverdier.",
    must_appear_near: ["color"],
  },
  {
    token: "--ct-text-soft",
    required: true,
    expected_use_no: "Sekundærtekst, brødtekst og beskrivelser.",
    must_appear_near: ["color"],
  },
  {
    token: "--ct-text-muted",
    required: true,
    expected_use_no: "Labels, hjelpetekst og manglende verdier.",
    must_appear_near: ["muted", "label", "small"],
  },
  {
    token: "--ct-accent",
    required: true,
    expected_use_no: "Hovedaksent, knapper, lenker og aktive tilstander.",
    must_appear_near: ["button", "link", "active", "accent"],
  },
  {
    token: "--ct-accent-dark",
    required: true,
    expected_use_no: "Dypere aksent, hover på primærknapp og ramme.",
    must_appear_near: ["hover", "active", "focus"],
  },
  {
    token: "--ct-accent-soft",
    required: true,
    expected_use_no: "Mykere aksent, gull/pastell, bilder og dekor.",
    must_appear_near: ["image", "media", "decor", "soft"],
  },
  {
    token: "--ct-signature",
    required: true,
    expected_use_no: "Hjørnesignatur / Collectium-detalj.",
    must_appear_near: ["signature", "corner", "after"],
  },
  {
    token: "--ct-watermark",
    required: true,
    expected_use_no: "Vannmerker, ANNO-stempel og bakgrunnsdetaljer.",
    must_appear_near: ["watermark", "anno", "stamp"],
  },
  {
    token: "--ct-status-ok",
    required: true,
    expected_use_no: "Status godkjent, aktiv, positiv trend.",
    must_appear_near: ["ok", "success", "approved", "positive"],
  },
  {
    token: "--ct-status-pending",
    required: true,
    expected_use_no: "Status venter, pågående og gul varselsone.",
    must_appear_near: ["pending", "warning", "varsel"],
  },
  {
    token: "--ct-status-rejected",
    required: true,
    expected_use_no: "Status avvist, deaktivert og negativ trend.",
    must_appear_near: ["rejected", "error", "danger", "negative"],
  },
];

const FILE_EXTENSIONS = [".css", ".module.css", ".tsx", ".ts"];

const SEARCH_DIRS = [
  "app",
  "components",
  "styles",
  "src",
];

const INACTIVE_STANDARD_PATHS = [
  `${path.sep}app${path.sep}components${path.sep}templates${path.sep}ui85${path.sep}`,
  `${path.sep}app${path.sep}components${path.sep}ui${path.sep}`,
  `${path.sep}app${path.sep}components${path.sep}layout${path.sep}CollectiumSkinProvider.tsx`,
];

async function pathExists(dirPath: string) {
  try {
    await readdir(dirPath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootDir: string): Promise<string[]> {
  const output: string[] = [];

  async function walk(current: string) {
    let entries;

    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        entry.name === "dist" ||
        entry.name === "build"
      ) {
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
        const normalizedPath = fullPath.split(/[\\/]+/).join(path.sep);

        if (!INACTIVE_STANDARD_PATHS.some((inactivePath) => normalizedPath.includes(inactivePath))) {
          output.push(fullPath);
        }
      }
    }
  }

  await walk(rootDir);
  return output;
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}

function findUsageNear(source: string, token: string, nearWords: string[]) {
  const lower = source.toLowerCase();
  const tokenLower = token.toLowerCase();
  let count = 0;
  let index = lower.indexOf(tokenLower);

  while (index >= 0) {
    const start = Math.max(0, index - 220);
    const end = Math.min(lower.length, index + 220);
    const window = lower.slice(start, end);

    if (nearWords.some((word) => window.includes(word.toLowerCase()))) {
      count += 1;
    }

    index = lower.indexOf(tokenLower, index + tokenLower.length);
  }

  return count;
}

export async function GET() {
  try {
    const files: string[] = [];

    for (const dir of SEARCH_DIRS) {
      const fullDir = path.join(/* turbopackIgnore: true */ process.cwd(), dir);
      if (await pathExists(fullDir)) {
        files.push(...(await walkFiles(fullDir)));
      }
    }

    const fileSources = await Promise.all(
      files.map(async (filePath) => {
        try {
          return {
            filePath,
            source: await readFile(filePath, "utf8"),
          };
        } catch {
          return {
            filePath,
            source: "",
          };
        }
      })
    );

    const allSource = fileSources.map((item) => item.source).join("\n");

    const checks: TokenCheckLine[] = TOKEN_RULES.map((rule, index) => {
      const foundCount = countOccurrences(allSource, rule.token);
      const usageCount = findUsageNear(allSource, rule.token, rule.must_appear_near);

      let status: TokenStatus = "OK";
      let detail = "Token finnes og ser ut til å være brukt i riktig kontekst.";
      let suggestion = "OK";

      if (foundCount === 0 && rule.required) {
        status = "FEIL";
        detail = "Token mangler helt i søkte prosjektfiler.";
        suggestion = "Legg token inn i global template/skin-tokenfil.";
      } else if (foundCount > 0 && usageCount === 0) {
        status = "VARSEL";
        detail = "Token finnes, men kontrollen fant ikke tydelig riktig brukskontekst.";
        suggestion = "Kontroller at token brukes på riktig komponenttype, ikke bare i en palettvisning.";
      }

      return {
        line_no: index + 1,
        status,
        token: rule.token,
        expected_use_no: rule.expected_use_no,
        found_count: foundCount,
        usage_count: usageCount,
        detail_no: detail,
        suggestion_no: suggestion,
      };
    });

    const summary = {
      ok: checks.filter((item) => item.status === "OK").length,
      varsel: checks.filter((item) => item.status === "VARSEL").length,
      feil: checks.filter((item) => item.status === "FEIL").length,
      info: checks.filter((item) => item.status === "INFO").length,
    };

    return NextResponse.json({
      ok: summary.feil === 0,
      source: "template-token-check",
      checked_at: new Date().toISOString(),
      summary,
      token_count: TOKEN_RULES.length,
      files_checked: files.length,
      skins_expected: [
        "collectium",
        "finans",
        "museum",
        "samler-enkel",
      ],
      checks,
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Template-token-kontrollen leser filer og sjekker tokenbruk. Den skriver ikke data og migrerer ikke kildedata.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "template-token-check",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

