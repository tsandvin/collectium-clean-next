/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn:      app/start/StartClient.tsx
 * Definering:   Klientkomponent for startsiden. Holder all interaksjon
 *               (periodesoek, mnd/aar-bryter, reveal-animasjon) og innhold.
 * Formaal:      Forslag til startside (app.collectium/start). Full bredde under
 *               global toppmeny. INGEN sidemeny. Arver tema fra app/globals.css
 *               via data-theme; bruker kun globale --ct-*-tokens (se .module.css).
 * Designkobling: start.module.css, .ct-surface (ramme), hjoernesignatur (regel 21),
 *               hover (regel 22). Tema endrer kun tokens â€” aldri layout.
 * DB-kobling:   Ingen skriving. Lenker til ekte ruter:
 *               /objekt/[sourceKey]/[objectGroup]/[objectId] og /relasjon/[type]/[slug].
 * Tags:         collectium, start, landing, medlemskap, periodesoek, tema
 */
"use client";

import { useEffect, useRef, useState, type FormEvent, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "./start.module.css";
import {
  BanknoteArt,
  CompassMapArt,
  SamlerArt,
  HistorieArt,
  FinansArt,
  AnnoStamp,
} from "./StartArt";

/* ---- Data (teaser-tall for landingssiden; ekte tall hentes via API i app) ---- */
const TOTAL_OBJ = 3180; // 2 200 sedler + 980 mynter

const ERAS = [
  { id: "spesidaler", label: "1816â€“1873", name: "Spesidaler", count: 180, cat: "var(--s-tl-period)" },
  { id: "kroneunion", label: "1875â€“1905", name: "Kroneunion", count: 240, cat: "var(--s-tl-national)" },
  { id: "selvstendig", label: "1905â€“1945", name: "Selvstendig Norge", count: 410, cat: "var(--s-tl-historical)" },
  { id: "femte-utgave", label: "1966â€“1983", name: "5. seddelutgave", count: 320, cat: "var(--s-tl-object)" },
  { id: "moderne", label: "1994â€“", name: "Moderne", count: 285, cat: "var(--s-tl-century)" },
];

type Tier = {
  id: string; name: string; tagline: string; featured?: boolean;
  mnd: number; aar: number; objects: string; storage: string;
  benefits: string[]; pkg: boolean;
};

const TIERS: Tier[] = [
  {
    id: "bronse", name: "Bronse", tagline: "For den nye samleren",
    mnd: 199, aar: 1990, objects: "100", storage: "2 GB", pkg: false,
    benefits: [
      "Egen samling, hjerte og favoritter",
      "Registrer kjÃ¸p og salg",
      "Periodefilter (basis)",
    ],
  },
  {
    id: "solv", name: "SÃ¸lv", tagline: "Mest valgt â€” beste balanse", featured: true,
    mnd: 599, aar: 5990, objects: "1 000", storage: "20 GB", pkg: true,
    benefits: [
      "Alt i Bronse",
      "Relasjoner, historikk og periodedybde",
      "Prisobservasjoner",
      "Datapakker (+) kan legges til",
    ],
  },
  {
    id: "gull", name: "Gull", tagline: "SeriÃ¸s samler Â· grunnlag for forhandler",
    mnd: 3990, aar: 39900, objects: "10 000", storage: "250 GB", pkg: true,
    benefits: [
      "Alt i SÃ¸lv",
      "Full index og finansdata",
      "Avansert periodefilter",
      "Flest relasjonspresentasjoner",
    ],
  },
];

/* ---- Smaa hjelpere ---- */
const nf = new Intl.NumberFormat("nb-NO");
const kr = (n: number) => `${nf.format(n)} kr`;
const half = (n: number) => Math.round(n / 2);

export default function StartClient() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const [era, setEra] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [billing, setBilling] = useState<"mnd" | "aar">("aar");

  /* Reveal-animasjon â€” respekterer reduced-motion */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add(s.revealIn));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add(s.revealIn);
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const activeEra = ERAS.find((e) => e.id === era) || null;

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("sok", q.trim());
    if (era) params.set("periode", era);
    router.push(`/katalog${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <main ref={rootRef} className={`${s.page} ct-start-page`}>
      {/* ============================================================= 1 Â· HERO + PERIODESÃ˜K */}
      <section className={`${s.section} ${s.soft}`}>
        <div className={`${s.hero} ${s.reveal}`} data-reveal>
          <div className={s.heroCopy}>
            <span className={s.eyebrow}>Collectium Â· katalog &amp; relasjoner</span>
            <h1 className={s.heroTitle}>
              SÃ¸k samlingen <em>gjennom tiden</em>
            </h1>
            <p className={s.lead}>
              Collectium er ikke bare en liste over objekter â€” det er en
              relasjonsplattform. Velg en periode pÃ¥ tidslinjen og se sedler,
              mynter, konger og signaturer som hÃ¸rer sammen.
            </p>
            <div className={s.btnRow}>
              <Link className={`${s.btn} ${s.btnPrimary}`} href="/registrer">
                Start gratis <span className={s.arrow}>â†’</span>
              </Link>
              <Link className={`${s.btn} ${s.btnGhost}`} href="#medlemskap">
                Se medlemskap
              </Link>
            </div>
          </div>

          {/* PeriodesÃ¸k i tidslinjetabell */}
          <div className={`ct-surface ct-sig ${s.periodPanel}`}>
            <form className={s.searchRow} onSubmit={onSearch}>
              <input
                className={s.searchInput}
                placeholder="SÃ¸k objekt, konge, motiv â€¦"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="SÃ¸k i katalogen"
              />
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
                SÃ¸k
              </button>
            </form>

            <div className={s.axisLabel}>
              <span>1816</span>
              <span>Tidslinje</span>
              <span>i dag</span>
            </div>
            <div className={s.axis} aria-hidden="true" />

            <div className={s.eraRow} role="group" aria-label="Velg periode">
              {ERAS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`${s.era} ${era === e.id ? s.eraActive : ""}`}
                  style={{ "--era-c": e.cat } as CSSProperties}
                  aria-pressed={era === e.id}
                  onClick={() => setEra(era === e.id ? null : e.id)}
                >
                  <span className={s.eraDot} aria-hidden="true" />
                  {e.name} Â· {e.label}
                </button>
              ))}
            </div>

            <div className={s.periodResult}>
              {activeEra ? (
                <>
                  <span>
                    <b>{activeEra.name}</b> {activeEra.label}
                    {" â€” "}
                    <span className={s.count}>~{activeEra.count} objekter</span>
                  </span>
                  <Link
                    className={s.linkInline}
                    href={`/katalog?periode=${activeEra.id}`}
                  >
                    Ã…pne i katalog <span className={s.arrow}>â†’</span>
                  </Link>
                </>
              ) : (
                <span>
                  <span className={s.count}>{nf.format(TOTAL_OBJ)}</span> objekter
                  i katalogen â€” velg en periode for Ã¥ filtrere.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= 2 Â· DATA + RELASJONER (+ ekte objekt) */}
      <section className={s.section}>
        <div className={`${s.inner} ${s.reveal}`} data-reveal>
          <div className={s.dataGrid}>
            <div>
              <span className={s.eyebrow}>Hva ligger i katalogen</span>
              <h2 className={s.h2}>Objekter som henger sammen</h2>
              <div className={s.statStrip}>
                <div className={s.stat}>
                  <span className={s.statNum}>2 200</span>
                  <span className={s.statLbl}>Sedler</span>
                </div>
                <div className={s.stat}>
                  <span className={s.statNum}>980</span>
                  <span className={s.statLbl}>Mynter</span>
                </div>
                <div className={s.stat}>
                  <span className={s.statNum}>+</span>
                  <span className={s.statLbl}>Flere typer kommer</span>
                </div>
              </div>
              <p className={s.p}>
                Hvert objekt er koblet til relasjoner du kan Ã¥pne som egne sider:
              </p>
              <div className={s.relChips}>
                {["Konge / regent", "Signatur", "Periode", "Motiv", "Utgave", "Variant", "ValÃ¸r", "Kilde"].map((r) => (
                  <span key={r} className={s.chip}>{r}</span>
                ))}
              </div>
            </div>

            {/* Ekte objekt â†’ objektpresentasjon + relasjonspresentasjon */}
            <article className={`ct-surface ct-hover ${s.objCard}`}>
              <div className={s.objHead}>
                <span className={s.objTitle}>10 kroner Â· 1979 Â· BH</span>
                <span className={s.objTag}>Norske sedler</span>
              </div>
              {/* Bytt ev. til <img src="/bilder/objekt/norske-sedler-9.webp" .../> */}
              <div className={s.objImg}><BanknoteArt /></div>
              <div className={s.objRel}>
                <span className={s.objTag}>Relasjon:</span>
                <Link className={s.chip} href="/relasjon/regent/olav-v">
                  Regent Â· Olav V
                </Link>
                <span className={s.chip}>5. utgave (1966â€“1983)</span>
              </div>
              <div className={s.objFoot}>
                <Link
                  className={`${s.btn} ${s.btnPrimary}`}
                  href="/objekt/norske_sedler/banknote/9"
                >
                  Ã…pne objektpresentasjon <span className={s.arrow}>â†’</span>
                </Link>
                <Link className={s.linkInline} href="/relasjon/regent/olav-v">
                  Se relasjonsside
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================= 3 Â· MEDLEMSKAP (fullbredde) */}
      <section id="medlemskap" className={`${s.section} ${s.soft}`}>
        <div className={`${s.inner} ${s.reveal}`} data-reveal>
          <div className={s.memberHead}>
            <div>
              <span className={s.eyebrow}>Medlemskap</span>
              <h2 className={s.h2}>Start gratis â€” voks nÃ¥r du vil</h2>
            </div>
            <span className={s.discount}>âˆ’50 % frem til Beta 9.1 (ca. 2029)</span>
          </div>

          <div className={`ct-surface ${s.freeBanner}`}>
            <strong>Gratis Ã¥ begynne.</strong>
            <span className={s.p}>
              10 objekter og 250 MB â€” opprett konto uten kort og bygg din fÃ¸rste
              samling. Oppgrader nÃ¥r katalogen din vokser.
            </span>
            <Link className={`${s.btn} ${s.btnGhost}`} href="/registrer">
              Opprett gratis konto
            </Link>
          </div>

          <div className={s.memberHead}>
            <p className={s.p}>
              Prisene under viser <b>kampanjepris</b> (âˆ’50 %). Datapakker (+)
              legges til ved registrering og kun pÃ¥ Ã¥rlig medlemskap.
            </p>
            <div className={s.toggle} role="group" aria-label="Velg betalingsperiode">
              <button
                type="button"
                className={`${s.toggleBtn} ${billing === "mnd" ? s.toggleOn : ""}`}
                onClick={() => setBilling("mnd")}
              >
                Per mÃ¥ned
              </button>
              <button
                type="button"
                className={`${s.toggleBtn} ${billing === "aar" ? s.toggleOn : ""}`}
                onClick={() => setBilling("aar")}
              >
                Per Ã¥r
              </button>
            </div>
          </div>

          <div className={s.tierGrid}>
            {TIERS.map((t) => {
              const base = billing === "mnd" ? t.mnd : t.aar;
              const unit = billing === "mnd" ? "/mnd" : "/Ã¥r";
              return (
                <article
                  key={t.id}
                  className={`ct-surface ct-hover ct-sig ${s.tier} ${t.featured ? s.tierFeatured : ""}`}
                >
                  {t.featured && <span className={s.bestPick}>Beste valg</span>}
                  <div>
                    <div className={s.tierName}>{t.name}</div>
                    <div className={s.tierFor}>{t.tagline}</div>
                  </div>
                  <div className={s.priceLine}>
                    <span className={s.priceNow}>{kr(half(base))}</span>
                    <span className={s.priceUnit}>{unit}</span>
                    <span className={s.priceWas}>{kr(base)}</span>
                  </div>
                  <div className={s.capRow}>
                    <div className={s.cap}>
                      <b>{t.objects}</b>
                      <span>objekter</span>
                    </div>
                    <div className={s.cap}>
                      <b>{t.storage}</b>
                      <span>bilde / fil</span>
                    </div>
                  </div>
                  <ul className={s.benefits}>
                    {t.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {t.pkg && (
                    <p className={s.pkgNote}>+ Datapakker tilgjengelig (Ã¥rlig)</p>
                  )}
                  <Link
                    className={`${s.btn} ${t.featured ? s.btnPrimary : s.btnGhost}`}
                    href={`/registrer?niva=${t.id}`}
                  >
                    Velg {t.name}
                  </Link>
                </article>
              );
            })}
          </div>

          {/* Platinum (Ã¥rlig) + Forhandler */}
          <div className={s.extraGrid}>
            <article className={`ct-surface ${s.extra}`}>
              <span className={s.extraTag}>Ã…rlig nivÃ¥</span>
              <h3 className={s.h3}>Platinum</h3>
              <p className={s.p}>
                25 000+ objekter og 500 GBâ€“2 TB etter avtale.{" "}
                <b>120 000 kr/Ã¥r</b> â€” tilbys kun Ã¥rlig, ikke per mÃ¥ned. For
                institusjoner, museer og de stÃ¸rste samlingene.
              </p>
            </article>
            <article className={`ct-surface ${s.extra}`}>
              <span className={s.extraTag}>Profesjonell rolle</span>
              <h3 className={s.h3}>Forhandler</h3>
              <p className={s.p}>
                PÃ¥ grunn av datamengdene har forhandlere <b>obligatorisk Gull</b>{" "}
                (kan ogsÃ¥ vÃ¦re Platinum). Inkluderer forhandlerprofil, auksjon,
                nettbutikk, oppgjÃ¸r og forhandlerdatapakker.
              </p>
            </article>
          </div>

          <div className={s.compareLink}>
            <Link className={s.linkInline} href="/medlemskap">
              Sammenlign alle nivÃ¥er og datapakker <span className={s.arrow}>â†’</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================= 4 Â· QUOTE (morsom) */}
      <section className={s.section}>
        <div className={`${s.inner} ${s.reveal}`} data-reveal>
          <div className={s.quoteWrap}>
            <figure className={s.quoteFig}>
              <blockquote className={s.quoteText}>
                Â«En samler uten Collectium er en{" "}
                <span>polfarer uten kart og kompass</span>.Â»
                <cite className={s.quoteCite}>â€” Samlervisdom, anno 2022</cite>
              </blockquote>
            </figure>
            {/* Bytt ev. til <img src="/bilder/start/quote-polfarer.webp" .../> */}
            <div className={`ct-surface ct-sig ${s.quoteImg}`}>
              <CompassMapArt />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= 5 Â· HAR DU EN SAMLING */}
      <section className={`${s.section} ${s.deep}`}>
        <div className={`${s.inner} ${s.reveal}`} data-reveal>
          <div className={s.narrow}>
            <span className={s.eyebrow}>Medlemskap</span>
            <h2 className={s.h2}>Har du en samling du vil fÃ¥ oversikt over?</h2>
            <p className={s.lead}>
              Mange samlinger ligger i album, esker og mapper. Collectium gjÃ¸r det
              enklere Ã¥ organisere, dokumentere historien, forstÃ¥ verdien â€” og dele
              utvalgte objekter nÃ¥r du er klar.
            </p>
            <div className={s.btnRow}>
              <Link className={`${s.btn} ${s.btnPrimary}`} href="/registrer">
                Bli medlem <span className={s.arrow}>â†’</span>
              </Link>
              <Link className={`${s.btn} ${s.btnGhost}`} href="/medlemskap">
                Se medlemskap
              </Link>
            </div>
          </div>

          <div className={s.blurbGrid}>
            <article className={`ct-surface ${s.blurb}`}>
              <h3 className={s.h3}>Egen samling</h3>
              <p className={s.p}>Bygg samling, marker hjerte og favoritter, registrer kjÃ¸p og salg.</p>
            </article>
            <article className={`ct-surface ${s.blurb}`}>
              <h3 className={s.h3}>Historikk og relasjoner</h3>
              <p className={s.p}>Se konge, periode, signatur, materiale og utgaver fra hvert objekt.</p>
            </article>
            <article className={`ct-surface ${s.blurb}`}>
              <h3 className={s.h3}>Marked og index</h3>
              <p className={s.p}>FÃ¸lg verdiutvikling, prisobservasjoner og auksjonsresultater.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================= 6 Â· HVA VIL DU UTFORSKE */}
      <section className={`${s.section} ${s.soft}`}>
        <div className={`${s.inner} ${s.reveal}`} data-reveal>
          <span className={s.eyebrow}>Tre perspektiver</span>
          <h2 className={s.h2}>Samme katalog, tre perspektiver</h2>
          <p className={s.lead}>
            Katalogen kan leses som samlerverktÃ¸y, som historisk relasjonsplattform,
            eller som markedsoversikt â€” samme objekt forteller ulike historier
            avhengig av hvordan du leser det.
          </p>

          <div className={s.perspGrid}>
            {[
              {
                num: "I.", kicker: "Personlig oversikt", name: "Samler", Art: SamlerArt,
                href: "/samler", cta: "Til samler",
                text: "Bygg din egen samling, marker Ã¸nskeliste og favoritter, registrer kjÃ¸p og salg, og hold dokumentasjon samlet ett sted.",
              },
              {
                num: "II.", kicker: "Konger og perioder", name: "Historie", Art: HistorieArt,
                href: "/historie", cta: "Til historie",
                text: "Se regenter, signaturer, perioder, materialer, utgaver og motiver â€” som relasjoner du kan Ã¥pne fra hvert objekt.",
              },
              {
                num: "III.", kicker: "Verdi og marked", name: "Finans", Art: FinansArt,
                href: "/finans", cta: "Til finans",
                text: "FÃ¸lg markedsverdi, trend og prisobservasjoner. Sammenlign egen samling mot marked og se utvikling over tid.",
              },
            ].map((p) => {
              const Art = p.Art;
              return (
                <article key={p.name} className={`ct-surface ct-hover ${s.persp}`}>
                  <div className={s.perspImg}><Art /></div>
                  <div className={s.perspBody}>
                    <span className={s.perspNum}>{p.num} Â· {p.kicker}</span>
                    <h3 className={s.h3}>{p.name}</h3>
                    <p className={s.p}>{p.text}</p>
                    <div className={s.btnRow}>
                      <Link className={`${s.btn} ${s.btnGhost}`} href={p.href}>
                        {p.cta} <span className={s.arrow}>â†’</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================= 7 Â· KOMME I GANG */}
      <section className={s.section}>
        <div className={`${s.inner} ${s.reveal}`} data-reveal>
          <span className={s.eyebrow}>Kom i gang</span>
          <h2 className={s.h2}>SÃ¥ enkelt er det Ã¥ starte</h2>

          <div className={s.steps}>
            <article className={`ct-surface ${s.step}`}>
              <span className={s.stepNo}>1</span>
              <h3 className={s.h3}>Registrer deg</h3>
              <p className={s.p}>Opprett bruker gratis. Du velger nivÃ¥ senere.</p>
            </article>
            <article className={`ct-surface ${s.step}`}>
              <span className={s.stepNo}>2</span>
              <h3 className={s.h3}>SÃ¸k og koble</h3>
              <p className={s.p}>
                SÃ¸k blant 2 200 sedler og 980 mynter med relasjoner til konger,
                motiv, perioder, utgave og variant.
              </p>
            </article>
            <article className={`ct-surface ${s.step}`}>
              <span className={s.stepNo}>3</span>
              <h3 className={s.h3}>GjÃ¸r den til din</h3>
              <p className={s.p}>
                Legg inn egne bilder og kvalitet, og hva du kjÃ¸pte objektet for â€”
                og bygg en dokumentert samling.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================= 8 Â· MÃ…LSETTING */}
      <section className={`${s.section} ${s.deep}`}>
        <div className={`${s.inner} ${s.reveal}`} data-reveal>
          <span className={s.eyebrow}>Hvor vi er pÃ¥ vei</span>
          <h2 className={s.h2}>Mer enn en katalog</h2>
          <p className={s.lead}>
            Collectium er en forhandlerbasert plattform for auksjon, nettbutikk og
            samling, der du har full oversikt over hver detalj pÃ¥ samleobjektet.
            Dette bygger vi videre pÃ¥:
          </p>

          <div className={s.goalGrid}>
            <article className={`ct-surface ${s.goal}`}>
              <span className={`${s.goalState} ${s.stateLive}`}>Live</span>
              <h3 className={s.h3}>Samler &amp; katalog</h3>
              <p className={s.p}>Oversikt, relasjoner og periode pÃ¥ hvert objekt.</p>
            </article>
            <article className={`ct-surface ${s.goal}`}>
              <span className={`${s.goalState} ${s.stateSoon}`}>Kommer</span>
              <h3 className={s.h3}>Avansert auksjon</h3>
              <p className={s.p}>Auksjonsside med mange muligheter under utvikling.</p>
            </article>
            <article className={`ct-surface ${s.goal}`}>
              <span className={`${s.goalState} ${s.stateSoon}`}>Kommer</span>
              <h3 className={s.h3}>Museumsmodul</h3>
              <p className={s.p}>Hjelper lokale museer Ã¥ holde oversikt over hvor objekter befinner seg.</p>
            </article>
            <article className={`ct-surface ${s.goal}`}>
              <span className={`${s.goalState} ${s.stateSoon}`}>Kommer</span>
              <h3 className={s.h3}>Nye objektomrÃ¥der</h3>
              <p className={s.p}>Emaljeskilt, reklameartikler, klokker og mer.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================= 9 Â· SLUTT-CTA (ANNO 2022) */}
      <section className={`${s.section} ${s.tint} ${s.stampField}`}>
        <div className={s.stamp} aria-hidden="true">
          <AnnoStamp />
        </div>
        <div className={`${s.narrow} ${s.finalCta} ${s.reveal}`} data-reveal>
          <span className={s.eyebrow}>Registrer deg i dag</span>
          <h2 className={s.h2}>Bli med pÃ¥ Ã¥ bygge katalogen</h2>
          <p className={s.philanthrope}>
            Hvert medlemskap er med pÃ¥ Ã¥ fÃ¸re Collectium videre. Platinum-medlemmer
            regnes som plattformens filantroper â€” de investerer i sin egen framtidige
            samling, og i en katalog alle samlere fÃ¥r glede av.
          </p>
          <div className={s.btnRow}>
            <Link className={`${s.btn} ${s.btnPrimary}`} href="/registrer">
              Opprett konto <span className={s.arrow}>â†’</span>
            </Link>
            <Link className={`${s.btn} ${s.btnGhost}`} href="/medlemskap">
              Se medlemskap
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
