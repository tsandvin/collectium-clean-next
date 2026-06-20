import type { CSSProperties, ReactNode } from "react";

interface CollectiumCardProps {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export default function CollectiumCard({
  title,
  children,
  style,
  className,
}: CollectiumCardProps) {
  const rootClassName = className
    ? `collectium-card ${className}`
    : "collectium-card";

  return (
    <section className={rootClassName} style={style}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}