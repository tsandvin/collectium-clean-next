/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * PageHeader
 *
 * Definering / formål:
 * Gjenbrukbar innholdskomponent for sidetittel. Lager ikke global layout.
 *
 * Bruksområde:
 * Brukes i vanlige sider.
 *
 * Berørte sider / routes:
 * - /
 * - /startside
 * - /katalog
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - template.content.view
 *
 * Berørte API-ruter:
 * - Ingen
 *
 * Berørte tabeller / views:
 * - Ingen
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: template
 * log_action: render_page_header
 *
 * Versjon:
 * CT-CLEAN-0001
 */
type PageHeaderProps = {
  eyebrow: string;
  title: string;
  lead: string;
};

export function PageHeader({ eyebrow, title, lead }: PageHeaderProps) {
  return (
    <section className="ct-page-header ct-signature-box">
      <p className="ct-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{lead}</p>
    </section>
  );
}
