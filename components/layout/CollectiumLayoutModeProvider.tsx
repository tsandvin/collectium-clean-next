"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

export type CollectiumScreenMode = "mobile" | "tablet" | "desktop" | "wide" | "tv";
export type CollectiumSidebarMode = "hidden" | "compact" | "normal";
export type CollectiumLaneMode = "off" | "lanes" | "tv";

interface CollectiumLayoutContextType {
  actualScreenWidth: number;
  viewportMode: CollectiumScreenMode;
  selectedScreenMode: CollectiumScreenMode | "auto";
  activeScreenMode: CollectiumScreenMode;
  sidebarMode: CollectiumSidebarMode;
  laneMode: CollectiumLaneMode;
  isMobileMenuOpen: boolean;
  setSelectedScreenMode: (mode: CollectiumScreenMode | "auto") => void;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const CollectiumLayoutContext = createContext<CollectiumLayoutContextType | undefined>(undefined);

export function CollectiumLayoutModeProvider({ children }: { children: React.ReactNode }) {
  const [actualScreenWidth, setActualScreenWidth] = useState<number>(1200); // Server fallback/default
  const [selectedScreenMode, setSelectedScreenModeState] = useState<CollectiumScreenMode | "auto">("auto");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Initialize screen width and stored mode in client
  useEffect(() => {
    setActualScreenWidth(window.innerWidth);

    const handleResize = () => {
      setActualScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    const stored = window.localStorage.getItem("collectium-override-screen-mode") as CollectiumScreenMode | "auto" | null;
    if (stored && ["auto", "mobile", "tablet", "desktop", "wide", "tv"].includes(stored)) {
      setSelectedScreenModeState(stored);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const setSelectedScreenMode = useCallback((mode: CollectiumScreenMode | "auto") => {
    setSelectedScreenModeState(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("collectium-override-screen-mode", mode);
    }
  }, []);

  // Calculate viewportMode based on guidelines
  const viewportMode = useMemo<CollectiumScreenMode>(() => {
    if (actualScreenWidth < 720) return "mobile";
    if (actualScreenWidth <= 1100) return "tablet";
    if (actualScreenWidth <= 1899) return "desktop";
    if (actualScreenWidth <= 2899) return "wide";
    return "tv";
  }, [actualScreenWidth]);

  // Determine the active mode
  const activeScreenMode = useMemo<CollectiumScreenMode>(() => {
    if (selectedScreenMode === "auto") {
      return viewportMode;
    }
    return selectedScreenMode;
  }, [selectedScreenMode, viewportMode]);

  // Determine sidebar mode
  const sidebarMode = useMemo<CollectiumSidebarMode>(() => {
    if (activeScreenMode === "mobile") return "hidden";
    if (activeScreenMode === "tablet") return "hidden";
    if (activeScreenMode === "tv") return "hidden";
    return "normal";
  }, [activeScreenMode]);

  // Determine lane mode
  const laneMode = useMemo<CollectiumLaneMode>(() => {
    if (activeScreenMode === "wide") return "lanes";
    if (activeScreenMode === "tv") return "tv";
    return "off";
  }, [activeScreenMode]);

  const value = useMemo<CollectiumLayoutContextType>(() => ({
    actualScreenWidth,
    viewportMode,
    selectedScreenMode,
    activeScreenMode,
    sidebarMode,
    laneMode,
    isMobileMenuOpen,
    setSelectedScreenMode,
    setIsMobileMenuOpen,
  }), [
    actualScreenWidth,
    viewportMode,
    selectedScreenMode,
    activeScreenMode,
    sidebarMode,
    laneMode,
    isMobileMenuOpen,
    setSelectedScreenMode,
  ]);

  return (
    <CollectiumLayoutContext.Provider value={value}>
      {children}
    </CollectiumLayoutContext.Provider>
  );
}

export function useCollectiumLayout() {
  const context = useContext(CollectiumLayoutContext);
  if (!context) {
    throw new Error("useCollectiumLayout must be used within a CollectiumLayoutModeProvider");
  }
  return context;
}
