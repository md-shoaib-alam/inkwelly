"use client";

import { useCallback, useEffect, useState } from "react";

const FAVORITES_KEY = "schoolsaas_dashboard_favorites";
const FAVORITES_EVENT = "schoolsaas_dashboard_favorites_changed";

function readPinned(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Pinned module ids, persisted the same way the dashboard layout preference is:
 * localStorage plus a window event, so the favorites strip and the grid re-render
 * together without either owning the other's state.
 */
export function useModuleFavorites() {
  const [pinned, setPinned] = useState<string[]>([]);

  // Read in an effect rather than a lazy initializer: the server prerender emits the
  // empty list, so initializing from localStorage would mismatch on hydration.
  useEffect(() => {
    setPinned(readPinned());
    const sync = () => setPinned(readPinned());
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const commit = useCallback((ids: string[]) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    } catch {
      // Private mode / quota — pinning just won't survive a reload.
    }
    setPinned(ids);
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  }, []);

  const togglePin = useCallback(
    (id: string) => {
      const current = readPinned();
      commit(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    },
    [commit],
  );

  const clearAll = useCallback(() => commit([]), [commit]);

  return { pinned, togglePin, clearAll };
}
