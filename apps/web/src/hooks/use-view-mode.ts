import { useState, useEffect } from "react";

export function useViewMode(key: string, defaultMode: "grid" | "table" = "grid") {
  const [viewMode, setViewMode] = useState<"grid" | "table">(defaultMode);

  useEffect(() => {
    const saved = localStorage.getItem(`view-mode-${key}`);
    if (saved === "grid" || saved === "table") {
      setViewMode(saved);
    }
  }, [key]);

  const toggleViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem(`view-mode-${key}`, mode);
  };

  return [viewMode, toggleViewMode] as const;
}
