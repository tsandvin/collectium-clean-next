import Link from "next/link";

export function CollectiumTopbar() {
  return (
    <header className="ct-topbar">
      <div className="ct-search" aria-label="SÃ¸k placeholder">
        SÃ¸k i Collectium-katalogen
      </div>

      <nav className="ct-topbar-actions" aria-label="Toppmeny">
        <Link href="/katalog">Katalog</Link>
        <Link href="/min-side">Min side</Link>
        <Link className="ct-button ct-button-primary" href="/startside">
          Start
        </Link>
      </nav>
    </header>
  );
}
