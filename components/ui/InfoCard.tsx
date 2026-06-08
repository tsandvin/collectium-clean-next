/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * InfoCard
 *
 * Definering / formål:
 * Enkel gjenbrukbar kortkomponent for clean rebuild.
 *
 * Bruksområde:
 * Brukes i startside, katalog og min-side placeholders.
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
 * log_action: render_info_card
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import Link from 'next/link';

type InfoCardProps = {
  title: string;
  label: string;
  text: string;
  href?: string;
};

export function InfoCard({ title, label, text, href }: InfoCardProps) {
  const content = (
    <article className="ct-card ct-signature-box">
      <p className="ct-eyebrow">{label}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  );

  if (!href) return content;
  return <Link className="ct-card-link" href={href}>{content}</Link>;
}
