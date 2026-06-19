import Link from "next/link";
import styles from "./CollectiumStartPage.module.css";

const memberships = [
  {
    name: "Bronse",
    badge: "God start",
    period: "År eller måned",
    discount: "50% rabatt frem til Beta 9.1",
    units: "For mindre samlinger",
    packs: "Datapakker kan legges til ved registrering",
    benefits: [
      "Egen samling med hjerte, favoritt og enkel dokumentasjon",
      "Grunnleggende katalogsøk og objektoversikt",
      "Enkle relasjoner til periode, utgave og motiv",
    ],
  },
  {
    name: "Sølv",
    badge: "Beste valg",
    period: "År eller måned",
    discount: "50% rabatt frem til Beta 9.1",
    units: "For aktive samlere med større databehov",
    packs: "Utvid med datapakker for flere objekter og dypere historikk",
    highlighted: true,
    benefits: [
      "Flere filtre, bedre periodefilter og mer relasjonsdata",
      "Historikk, signaturer, materialer, varianter og utgaver",
      "Bedre sammenligning av egen samling mot katalog og marked",
    ],
  },
  {
    name: "Gull",
    badge: "For proff / forhandler",
    period: "År eller måned",
    discount: "50% rabatt frem til Beta 9.1",
    units: "For store samlinger, salg og avansert bruk",
    packs: "Datapakker og objektgrupper defineres ved registrering",
    benefits: [
      "Avansert marked, index, prisobservasjoner og auksjonsdata",
      "Forhandlerfunksjoner, salgsflyt og objektgrupper",
      "Obligatorisk nivå for forhandlere, med Platinum som mulig oppgradering",
    ],
  },
];

const exploreCards = [
  {
    roman: "I.",
    title: "Samler",
    kicker: "Personlig oversikt",
    image: "/images/02_samler-collectium.webp",
    href: "/samler",
    cta: "Til samler",
    text: "Bygg din egen samling, marker ønskeliste og favoritter, registrer kjøp og salg, og hold dokumentasjon samlet ett sted.",
  },
  {
    roman: "II.",
    title: "Historie",
    kicker: "Konger og perioder",
    image: "/images/03_historie-konge-regent-collectium.webp",
    href: "/relasjon/regent/olav-v",
    cta: "Til historie",
    text: "Se regenter, signaturer, perioder, materialer, utgaver og motiver som relasjoner du kan åpne fra hvert objekt.",
  },
  {
    roman: "III.",
    title: "Finans",
    kicker: "Verdi og marked",
    image: "/images/04_finans-markedsindex-collectium.webp",
    href: "/finans",
    cta: "Til finans",
    text: "Følg markedsverdi, trend og prisobservasjoner. Sammenlign egen samling mot marked og se utvikling over tid.",
  },
];

export default function CollectiumStartPage() {
  return (
    <main className={styles.page}>
      <section className={`${styles.section} ${styles.heroSection}`}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Collectium start</p>
          <h1>Finn objektet, perioden og historien bak samlingen.</h1>
          <p className={styles.lead}>
            Collectium kobler katalog, tidslinje, relasjoner, marked og egen samling i én ryddig startside. Søk i objekter, åpne perioder og se hvordan samme samleobjekt kan leses som samlerdata, historie og finans.
          </p>
          <div className={styles.heroActions}>
            <Link href="/katalog" className={styles.primaryButton}>Åpne katalog</Link>
            <Link href="/relasjon/regent/olav-v" className={styles.secondaryButton}>Se relasjon</Link>
            <Link href="/objekt/norske_sedler/banknote/1005" className={styles.textLink}>Eksempelobjekt</Link>
          </div>
        </div>

        <div className={styles.timelineSearchCard} aria-label="Søk i tidslinjetabell">
          <div className={styles.cardHeader}>
            <span>Tidslinjesøk</span>
            <strong>Periodefilter</strong>
          </div>
          <div className={styles.searchBar}>
            <span>Søk</span>
            <p>Olav V · 1979 · 5. utgave · Winge/Getz · sølv · union</p>
          </div>
          <div className={styles.timelineRows}>
            <div><span>Rad 1</span><b>Nasjonal hovedperiode</b><em>Norge etter 1945</em></div>
            <div><span>Rad 2</span><b>Hovedperiode / økonomi</b><em>Etterkrigstid og oljefase</em></div>
            <div><span>Rad 3</span><b>Objektperiode / relasjon</b><em>5. utgave 1966–1983</em></div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.dataSection}`}>
        <div>
          <p className={styles.eyebrow}>Data og relasjoner</p>
          <h2>Katalogen er mer enn en liste.</h2>
        </div>
        <p>
          Dataene i Collectium består av objekter, kilder, perioder, utgaver, varianter, regenter, signaturer, materialer, motiv, prisobservasjoner og brukerstatus. Når en kjent verdi vises, skal den kunne åpnes som en relasjonsside med egne metadata og tilknyttede objekter.
        </p>
      </section>

      <section className={`${styles.section} ${styles.membershipSection}`}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Medlemskap</p>
          <h2>Start gratis. Oppgrader når samlingen trenger mer plass, data og kontroll.</h2>
          <p>
            Collectium gir 50% rabatt frem til vi går over til Beta 9.1, planlagt rundt 2029. Bronse, Sølv og Gull kan kjøpes som måneds- eller årsmedlemskap. Sølv er fremhevet som beste valg for aktive samlere. Platinum tilbys som årlig medlemskap for de som vil støtte plattformen og få maksimal datatilgang.
          </p>
        </div>

        <div className={styles.membershipGrid}>
          {memberships.map((membership) => (
            <article key={membership.name} className={`${styles.membershipCard} ${membership.highlighted ? styles.highlightedCard : ""}`}>
              <div className={styles.membershipTop}>
                <span>{membership.badge}</span>
                <h3>{membership.name}</h3>
                <p>{membership.period}</p>
              </div>
              <div className={styles.memberMeta}>
                <p><b>Rabatt:</b> {membership.discount}</p>
                <p><b>Enheter:</b> {membership.units}</p>
                <p><b>Datapakker:</b> {membership.packs}</p>
              </div>
              <ul>
                {membership.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <div className={styles.platinumDealerRow}>
          <div>
            <h3>Platinum</h3>
            <p>Årlig medlemskap for maksimal datatilgang, store samlinger og medlemmer som vil være filantroper for sin egen fremtidige samling og for videreutviklingen av Collectium.</p>
          </div>
          <div>
            <h3>Forhandler</h3>
            <p>Forhandlere må ha Gull som minimum fordi datamengde, salgsflyt, auksjon og nettbutikk krever mer kontroll. Platinum kan velges for større aktører og flere objektgrupper.</p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.quoteSection}`}>
        <div className={styles.quoteImage} aria-hidden="true" />
        <blockquote>
          «En samler uten Collectium er som en polfarer uten kart og kompass — eventyret finnes, men retningen blir fort litt kreativ.»
        </blockquote>
      </section>

      <section className={`${styles.section} ${styles.featureSection}`}>
        <div className={styles.featureText}>
          <p className={styles.eyebrow}>Medlemskap</p>
          <h2>Har du en samling du vil få oversikt over?</h2>
          <p>
            Mange samlinger ligger i album, esker og mapper. Collectium gjør det enklere å organisere, dokumentere historien, forstå verdien og dele utvalgte objekter når du er klar.
          </p>
          <div className={styles.heroActions}>
            <Link href="/registrer" className={styles.primaryButton}>Bli medlem</Link>
            <Link href="/medlemskap" className={styles.secondaryButton}>Se medlemskap</Link>
          </div>
        </div>
        <div className={styles.featureGrid}>
          <div><h3>Egen samling</h3><p>Bygg samling, marker hjerte og favoritter, registrer kjøp og salg.</p></div>
          <div><h3>Historikk og relasjoner</h3><p>Se konge, periode, signatur, materiale og utgaver fra hvert objekt.</p></div>
          <div><h3>Marked og index</h3><p>Følg verdiutvikling, prisobservasjoner og auksjonsresultater.</p></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.exploreSection}`}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Hva vil du utforske?</p>
          <h2>Samme katalog, tre perspektiver.</h2>
          <p>
            Katalogen kan leses som samlerverktøy, historisk relasjonsplattform eller markedsoversikt. Samme objekt forteller ulike historier avhengig av hvordan du leser det.
          </p>
        </div>
        <div className={styles.exploreGrid}>
          {exploreCards.map((card) => (
            <article key={card.title} className={styles.exploreCard}>
              <div className={styles.exploreImage} style={{ backgroundImage: `url(${card.image})` }} />
              <span>{card.roman}</span>
              <p>{card.kicker}</p>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <Link href={card.href}>{card.cta}</Link>
              <small>Collectium</small>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.stepsSection}`}>
        <div>
          <p className={styles.eyebrow}>Kom i gang</p>
          <h2>Registrer deg, søk og bygg videre.</h2>
        </div>
        <ol>
          <li><b>Registrer bruker.</b> Start gratis og velg medlemskap senere.</li>
          <li><b>Søk i katalogen.</b> Utforsk ca. 2200 sedler og 980 mynter med relasjoner til konger, motiv, perioder, utgaver og varianter.</li>
          <li><b>Legg inn egne data.</b> Senere kan du legge til bilde, kvalitet, kjøpspris, salgspris og dokumentasjon.</li>
        </ol>
      </section>

      <section className={`${styles.section} ${styles.visionSection}`}>
        <div>
          <p className={styles.eyebrow}>Målsetning</p>
          <h2>Collectium skal bli samlingsplattformen for katalog, auksjon, nettbutikk, museum og marked.</h2>
        </div>
        <p>
          Vi bygger en forhandlerbasert auksjons- og nettbutikkplattform der brukere kan holde oversikt over detaljer, historikk og verdi på samleobjekter. Samtidig utvikles en museumsmodul som kan hjelpe lokale museer med å vite hvilke objekter som finnes, hvor de ligger og hvilke historier de hører til. Nye objektområder som emaljeskilt, reklameartikler, klokker og verdipapirer kan kobles på samme relasjonsmodell.
        </p>
      </section>

      <section className={`${styles.section} ${styles.finalCta}`}>
        <div>
          <p className={styles.eyebrow}>Registrer deg i dag</p>
          <h2>Alle medlemskap hjelper Collectium i gang.</h2>
          <p>
            Platinum-medlemmer regnes som støttespillere for plattformens videre utvikling — og som samlere som investerer i bedre kontroll, bedre dokumentasjon og bedre fremtidig verdioversikt for sin egen samling.
          </p>
        </div>
        <Link href="/registrer" className={styles.primaryButton}>Registrer deg</Link>
      </section>
    </main>
  );
}
