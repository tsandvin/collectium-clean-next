import React from "react";

interface CollectiumCardProps {
  title: string;
  children: React.ReactNode;
}

export default function CollectiumCard({
  title,
  children,
}: CollectiumCardProps) {
  return (
    <div className="collectium-card collectium-panel">
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
