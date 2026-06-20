const fs = require("fs");

const tsxPath = "components/period-timeline/CollectiumPeriodTimelineClient.tsx";
const cssPath = "components/period-timeline/CollectiumPeriodTimelineClient.module.css";

if (!fs.existsSync(tsxPath)) throw new Error("Missing TSX file");
if (!fs.existsSync(cssPath)) throw new Error("Missing CSS file");

let tsx = fs.readFileSync(tsxPath, "utf8");
let css = fs.readFileSync(cssPath, "utf8");

tsx = tsx.replace(
  /if\s*\(\s*loading\s*&&[\s\S]*?\)\s*\{\s*return\s*\(?\s*<div\s+className=\{styles\.loadingState\}>[\s\S]*?<\/div>\s*\)?;?\s*\}\s*/g,
  ""
);

tsx = tsx.replace(/\s*const\s+apiOnline\s*=\s*![^;]+;\s*/g, "\n");

tsx = tsx.replace(
  /return\s*\(\s*<main\s+className=\{styles\.page\}>/,
  "const apiOnline = !loading && !error;\n\nreturn (\n  <main className={styles.page}>"
);

const heroReplacement = `<div
        className={\`\${styles.heroStatus} \${apiOnline ? styles.heroStatusOnline : styles.heroStatusOffline}\`}
        aria-live="polite"
      >
        <span>Status</span>
        <strong>Aktiv V8.6</strong>
        <div className={styles.apiStatusLine}>
          <span className={styles.apiStatusOrb} aria-hidden="true" />
          <span className={styles.apiStatusText}>
            {apiOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>`;

tsx = tsx.replace(
  /<div\s+className=\{styles\.heroStatus\}>[\s\S]*?<span>Status<\/span>[\s\S]*?<strong>Aktiv V8\.6<\/strong>[\s\S]*?<\/div>/,
  heroReplacement
);

css = css.replace(
  /\/\*\s*=*\s*Period timeline API status hero indicator[\s\S]*?(?=\/\*\s*=|\z)/gi,
  ""
);

const statusCss = `
/* ============================================================
   Period timeline API status hero indicator
   Scope: /test/period-timeline
   ASCII-only patch
   ============================================================ */

.heroStatus {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 6px;
  min-width: 150px;
  padding: 12px 16px;
}

.heroStatus > span {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.72;
}

.heroStatus > strong {
  font-size: 18px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0.01em;
}

.apiStatusLine {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

.apiStatusText {
  font-size: 13px;
  line-height: 1;
  font-weight: 900;
}

.apiStatusOrb {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 1px solid #000000;
  border-radius: 999px;
  box-sizing: border-box;
}

.heroStatusOffline .apiStatusText {
  color: #c73535;
}

.heroStatusOffline .apiStatusOrb {
  border-color: #000000;
  border-top-color: #c73535;
  border-right-color: #c73535;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), rgba(199,53,53,0.28) 42%, rgba(199,53,53,0.08) 72%);
  animation: ctApiSpinner 0.85s linear infinite;
}

.heroStatusOnline .apiStatusText {
  color: #21845a;
}

.heroStatusOnline .apiStatusOrb {
  border-color: #000000;
  background: radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(149,236,190,0.92) 22%, rgba(33,132,90,0.96) 58%, rgba(11,70,46,1) 100%);
  box-shadow: inset -2px -3px 5px rgba(0,0,0,0.28), inset 2px 2px 4px rgba(255,255,255,0.62), 0 0 0 0 rgba(33,132,90,0.42);
  animation: ctApiPulse 1.55s ease-in-out infinite;
}

@keyframes ctApiSpinner {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ctApiPulse {
  0% {
    transform: scale(1);
    box-shadow: inset -2px -3px 5px rgba(0,0,0,0.28), inset 2px 2px 4px rgba(255,255,255,0.62), 0 0 0 0 rgba(33,132,90,0.42);
  }

  55% {
    transform: scale(1.12);
    box-shadow: inset -2px -3px 5px rgba(0,0,0,0.28), inset 2px 2px 4px rgba(255,255,255,0.62), 0 0 0 7px rgba(33,132,90,0.08);
  }

  100% {
    transform: scale(1);
    box-shadow: inset -2px -3px 5px rgba(0,0,0,0.28), inset 2px 2px 4px rgba(255,255,255,0.62), 0 0 0 0 rgba(33,132,90,0);
  }
}
`;

css = css.trimEnd() + "\n" + statusCss + "\n";

fs.writeFileSync(tsxPath, tsx, { encoding: "utf8" });
fs.writeFileSync(cssPath, css, { encoding: "utf8" });

console.log("[OK] Patched period timeline API status");
