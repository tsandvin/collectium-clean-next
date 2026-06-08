import Link from "next/link";
import styles from "./CollectiumSystemPage.module.css";

type SystemPageVariant = "notFound" | "error";

type CollectiumSystemPageProps = {
  variant: SystemPageVariant;
  errorId?: string;
};

const variantContent = {
  notFound: {
    status: "404",
    title: "Siden ble ikke funnet",
    text: "Beklager, vi finner ikke siden du leter etter.",
    badge: "Systemet er online",
    badgeTone: "ok",
    symbol: "?",
  },
  error: {
    status: "500",
    title: "Noe gikk galt",
    text: "Beklager, det oppstod en intern feil. Prøv igjen om litt.",
    badge: "Systemfeil oppdaget",
    badgeTone: "error",
    symbol: "!",
  },
} as const;

export function CollectiumSystemPage({
  variant,
  errorId,
}: CollectiumSystemPageProps) {
  const content = variantContent[variant];

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-labelledby="system-page-title">
        <header className={styles.header}>
          <Link className={styles.brand} href="/startside" aria-label="Collectium startside">
            <span className={styles.logoMark} aria-hidden="true">
              <span className={styles.logoC}>C</span>
            </span>
            <span className={styles.logoWord}>Collectium</span>
          </Link>

          <div
            className={`${styles.badge} ${
              content.badgeTone === "ok" ? styles.badgeOk : styles.badgeError
            }`}
          >
            <span className={styles.badgeDot} aria-hidden="true" />
            {content.badge}
          </div>
        </header>

        <div className={styles.visualWrap} aria-hidden="true">
          <div className={`${styles.signal} ${variant === "error" ? styles.signalError : ""}`}>
            {content.symbol}
          </div>

          <div className={styles.collectorMascot}>
            <div className={styles.hat} />
            <div className={styles.earLeft} />
            <div className={styles.earRight} />
            <div className={styles.face}>
              <span className={styles.eyeLeft} />
              <span className={styles.eyeRight} />
              <span className={styles.nose} />
              <span className={styles.tooth} />
            </div>
            <div className={styles.body}>
              <span className={styles.chip}>C</span>
            </div>
          </div>

          <span className={styles.glitchOne} />
          <span className={styles.glitchTwo} />
          <span className={styles.glitchThree} />
          <span className={styles.glitchFour} />
          <span className={styles.glitchFive} />
        </div>

        <section className={styles.content}>
          <p className={styles.status}>{content.status}</p>
          <h1 id="system-page-title" className={styles.title}>
            {content.title}
          </h1>
          <p className={styles.text}>{content.text}</p>

          {errorId ? (
            <p className={styles.errorId}>
              Feilreferanse: <span>{errorId}</span>
            </p>
          ) : null}

          <nav className={styles.actions} aria-label="Systemvalg">
            <Link className={`${styles.actionButton} ${styles.login}`} href="/login">
              <span aria-hidden="true">⌘</span>
              Login
            </Link>

            <Link className={`${styles.actionButton} ${styles.register}`} href="/registrer">
              <span aria-hidden="true">＋</span>
              Registrer
            </Link>

            <Link className={`${styles.actionButton} ${styles.myPage}`} href="/min-side">
              <span aria-hidden="true">◎</span>
              Min side
            </Link>
          </nav>

          <Link className={styles.homeButton} href="/startside">
            <span aria-hidden="true">⌂</span>
            Til startside
            <span aria-hidden="true">›</span>
          </Link>
        </section>

        <footer className={styles.footer}>
          <span className={styles.footerMark}>C</span>
          <span>Collectium – Samle. Organisere. Oppdage.</span>
        </footer>
      </section>
    </main>
  );
}
