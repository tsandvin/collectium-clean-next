import React from "react";

interface CollectiumCardProps {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function CollectiumCard({
  title,
  children,
  style,
  className = "",
}: CollectiumCardProps) {
  return (
    <div className={`collectium-card collectium-panel ${className}`} style={style}>
      <div className="collectium-muted" style={{
        fontSize: "0.8rem",
        textTransform: "uppercase",
        marginBottom: "8px",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
