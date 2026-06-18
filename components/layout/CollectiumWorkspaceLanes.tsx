"use client";

import React from "react";
import { useCollectiumLayout } from "./CollectiumLayoutModeProvider";
import styles from "./CollectiumWorkspaceLanes.module.css";

interface CollectiumWorkspaceLanesProps {
  children: React.ReactNode;
}

export function CollectiumWorkspaceLanes({ children }: CollectiumWorkspaceLanesProps) {
  const { laneMode } = useCollectiumLayout();

  if (laneMode === "lanes") {
    return (
      <div className={styles.lanesContainer} data-lane-mode="lanes">
        {React.Children.map(children, (child, index) => {
          if (!child) return null;
          return (
            <div key={index} className={styles.laneItem}>
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  if (laneMode === "tv") {
    return (
      <div className={styles.tvContainer} data-lane-mode="tv">
        {React.Children.map(children, (child, index) => {
          if (!child) return null;
          return (
            <div key={index} className={styles.tvLaneItem}>
              {child}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.singleContainer} data-lane-mode="off">
      {children}
    </div>
  );
}
