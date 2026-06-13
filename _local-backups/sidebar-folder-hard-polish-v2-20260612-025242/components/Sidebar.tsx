export default function Sidebar() {
  return (
    <aside className="collectium-sidebar">
      <div className="collectium-brand">01 Collectium AppShell</div>

      <nav aria-label="Hovedmeny">
        <a className="is-active" href="/">Workspace Dashboard</a>
        <a href="/katalog">/katalog</a>
        <a href="/objekt">/objekt</a>
        <a href="/admin/system/mariadb-neon">/admin</a>
      </nav>
    </aside>
  );
}
