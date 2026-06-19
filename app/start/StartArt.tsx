/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn:      app/start/StartArt.tsx
 * Definering:   Skin-baserte SVG-illustrasjoner for startsiden.
 * Formaal:      Ekte grafikk i stedet for bildeplassholdere. Alle bruker de
 *               globale --s-*-tokenene (som peker paa --ct-*), saa de re-skinnes
 *               automatisk i alle fire tema. ANNO 2022-stempelet er bygget paa
 *               Collectium-merket: ytre stensilring med fire kardinale gap +
 *               indre C med rett, rektangulaer aapning mot hoyre.
 * Designkobling: start.module.css (.art, .stamp), brand-merke / stempel.
 * DB-kobling:   Ingen.
 * Tags:         collectium, start, svg, illustrasjon, anno-2022, stempel, tema
 */

const fill = "block" as const;
const base = { width: "100%", height: "100%", display: fill };

/* 10 kroner-seddel (objektkort) */
export function BanknoteArt() {
  return (
    <svg viewBox="0 0 360 150" style={base} role="img" aria-label="Seddel">
      <rect x="6" y="6" width="348" height="138" rx="9" fill="var(--s-surface)" />
      <rect x="14" y="14" width="332" height="122" rx="6" fill="none" stroke="var(--s-accent)" strokeOpacity="0.55" />
      {/* guilloché */}
      <g stroke="var(--s-accent)" strokeOpacity="0.22" fill="none">
        <ellipse cx="272" cy="75" rx="60" ry="40" />
        <ellipse cx="272" cy="75" rx="46" ry="30" />
        <ellipse cx="272" cy="75" rx="32" ry="20" />
      </g>
      {/* portrett */}
      <ellipse cx="96" cy="75" rx="40" ry="50" fill="var(--s-surface-soft)" stroke="var(--s-accent)" strokeOpacity="0.6" />
      <g fill="var(--s-accent)" fillOpacity="0.55">
        <circle cx="96" cy="62" r="16" />
        <path d="M70 108c2-18 12-28 26-28s24 10 26 28z" />
      </g>
      {/* valør */}
      <text x="272" y="90" textAnchor="middle" fontFamily="var(--s-display)" fontSize="46" fill="var(--s-heading)">10</text>
      <text x="180" y="33" textAnchor="middle" fontFamily="var(--s-body)" fontSize="11" letterSpacing="3" fill="var(--s-muted)">NORGES BANK</text>
      <text x="180" y="126" textAnchor="middle" fontFamily="var(--s-display)" fontStyle="italic" fontSize="13" fill="var(--s-muted)">TI KRONER · 1979</text>
    </svg>
  );
}

/* Kart + kompass (quote: «polfarer uten kart og kompass») */
export function CompassMapArt() {
  return (
    <svg viewBox="0 0 320 260" style={base} role="img" aria-label="Kart og kompass">
      <g transform="rotate(-6 150 120)">
        <rect x="38" y="42" width="208" height="150" rx="6" fill="var(--s-surface)" stroke="var(--s-border)" />
        <g stroke="var(--s-border)" strokeOpacity="0.8">
          <line x1="38" y1="92" x2="246" y2="92" /><line x1="38" y1="142" x2="246" y2="142" />
          <line x1="108" y1="42" x2="108" y2="192" /><line x1="178" y1="42" x2="178" y2="192" />
        </g>
        {/* fjell / isfjell */}
        <path d="M60 168l22-34 18 24 16-20 20 30z" fill="var(--s-accent)" fillOpacity="0.18" stroke="var(--s-accent)" strokeOpacity="0.5" />
        {/* rute */}
        <path d="M70 80 Q130 70 150 110 T214 150" fill="none" stroke="var(--s-accent)" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
        <g stroke="var(--s-accent)" strokeWidth="3" strokeLinecap="round">
          <line x1="208" y1="144" x2="220" y2="156" /><line x1="220" y1="144" x2="208" y2="156" />
        </g>
      </g>
      {/* kompass */}
      <circle cx="232" cy="196" r="48" fill="var(--s-surface)" stroke="var(--s-accent)" strokeOpacity="0.65" />
      <circle cx="232" cy="196" r="40" fill="none" stroke="var(--s-border)" />
      <g stroke="var(--s-muted)" strokeWidth="2">
        <line x1="232" y1="152" x2="232" y2="160" /><line x1="232" y1="232" x2="232" y2="240" />
        <line x1="188" y1="196" x2="196" y2="196" /><line x1="268" y1="196" x2="276" y2="196" />
      </g>
      <path d="M232 162 L242 196 L232 188 Z" fill="var(--s-accent)" />
      <path d="M232 230 L222 196 L232 204 Z" fill="var(--s-muted)" fillOpacity="0.7" />
      <text x="232" y="150" textAnchor="middle" fontFamily="var(--s-display)" fontSize="13" fill="var(--s-accent)">N</text>
    </svg>
  );
}

/* Samler — stablede kort med hjerte og stjerne */
export function SamlerArt() {
  return (
    <svg viewBox="0 0 320 200" style={base} role="img" aria-label="Samler">
      <rect x="58" y="58" width="150" height="104" rx="10" fill="var(--s-surface)" stroke="var(--s-border)" transform="rotate(-7 133 110)" />
      <rect x="78" y="48" width="150" height="104" rx="10" fill="var(--s-surface)" stroke="var(--s-border)" transform="rotate(3 153 100)" />
      <rect x="92" y="56" width="150" height="104" rx="10" fill="var(--s-surface-soft)" stroke="var(--s-accent)" strokeOpacity="0.6" />
      <g stroke="var(--s-muted)" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round">
        <line x1="112" y1="84" x2="180" y2="84" /><line x1="112" y1="100" x2="200" y2="100" /><line x1="112" y1="116" x2="172" y2="116" />
      </g>
      <path d="M210 70c-7-9-22-3-22 8 0 9 12 16 22 24 10-8 22-15 22-24 0-11-15-17-22-8z" fill="var(--s-accent)" />
      <path d="M150 150l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="none" stroke="var(--s-gold)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/* Historie — krone (konge / regent) */
export function HistorieArt() {
  return (
    <svg viewBox="0 0 320 200" style={base} role="img" aria-label="Historie">
      <path d="M86 138 L78 74 L120 104 L160 60 L200 104 L242 74 L234 138 Z"
        fill="var(--s-accent)" fillOpacity="0.20" stroke="var(--s-accent)" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="86" y="138" width="148" height="22" rx="5" fill="var(--s-accent)" fillOpacity="0.30" stroke="var(--s-accent)" strokeWidth="2.5" />
      <g fill="var(--s-gold)">
        <circle cx="78" cy="74" r="7" /><circle cx="160" cy="58" r="8" /><circle cx="242" cy="74" r="7" />
      </g>
      <circle cx="160" cy="120" r="9" fill="none" stroke="var(--s-gold)" strokeWidth="2.5" />
      <line x1="100" y1="178" x2="220" y2="178" stroke="var(--s-border)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Finans — index / verdiutvikling */
export function FinansArt() {
  return (
    <svg viewBox="0 0 320 200" style={base} role="img" aria-label="Finans">
      <g stroke="var(--s-border)" strokeWidth="2">
        <line x1="48" y1="40" x2="48" y2="160" /><line x1="48" y1="160" x2="280" y2="160" />
      </g>
      <g fill="var(--s-accent)" fillOpacity="0.16" stroke="var(--s-accent)" strokeOpacity="0.5">
        <rect x="70" y="120" width="30" height="40" /><rect x="118" y="100" width="30" height="60" />
        <rect x="166" y="112" width="30" height="48" /><rect x="214" y="74" width="30" height="86" />
      </g>
      <polyline points="62,138 110,118 158,128 206,86 262,58" fill="none" stroke="var(--s-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="var(--s-accent)">
        <circle cx="62" cy="138" r="4" /><circle cx="110" cy="118" r="4" /><circle cx="158" cy="128" r="4" /><circle cx="206" cy="86" r="4" /><circle cx="262" cy="58" r="5" />
      </g>
      <path d="M250 64 L262 52 L274 64 M262 52 L262 78" fill="none" stroke="var(--s-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ANNO 2022 — Collectium-stempel (ytre stensilring + indre C + ord) */
export function AnnoStamp() {
  return (
    <svg viewBox="0 0 300 300" style={base} aria-hidden="true">
      {/* ytre stensilring med fire kardinale gap */}
      <g fill="none" stroke="currentColor" strokeWidth="7">
        <path d="M267.4 174.9 A120 120 0 0 1 174.9 267.4" />
        <path d="M125.1 267.4 A120 120 0 0 1 32.6 174.9" />
        <path d="M32.6 125.1 A120 120 0 0 1 125.1 32.6" />
        <path d="M174.9 32.6 A120 120 0 0 1 267.4 125.1" />
      </g>
      {/* indre C med rett aapning mot hoyre */}
      <path d="M230.8 179.4 A86 86 0 1 1 230.8 120.6" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="butt" />
      {/* ANNO (liten) over 2022 (stor) */}
      <text x="150" y="140" textAnchor="middle" fontFamily="var(--s-display)" fontSize="24" letterSpacing="6" fill="currentColor">ANNO</text>
      <text x="150" y="190" textAnchor="middle" fontFamily="var(--s-display)" fontSize="54" letterSpacing="2" fill="currentColor">2022</text>
    </svg>
  );
}
