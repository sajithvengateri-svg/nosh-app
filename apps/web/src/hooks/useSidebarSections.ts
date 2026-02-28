import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_PREFIX = "sidebar_open_";

/**
 * Manages accordion open/closed state for sidebar sections.
 * Persists to localStorage and auto-opens section containing active route.
 */
export function useSidebarSections(
  storageKey: string,
  /** Map of section key → paths that belong to that section */
  sectionPathMap: Record<string, string[]>,
) {
  const fullKey = `${STORAGE_PREFIX}${storageKey}`;
  const location = useLocation();

  const [openSections, setOpenSections] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(fullKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(openSections));
    } catch {}
  }, [openSections, fullKey]);

  // Auto-open section containing the current route
  useEffect(() => {
    const path = location.pathname;
    for (const [sectionKey, paths] of Object.entries(sectionPathMap)) {
      const match = paths.some(
        (p) => path === p || path.startsWith(p + "/"),
      );
      if (match && !openSections.includes(sectionKey)) {
        setOpenSections((prev) =>
          prev.includes(sectionKey) ? prev : [...prev, sectionKey],
        );
        break;
      }
    }
  }, [location.pathname, sectionPathMap]);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const isSectionOpen = useCallback(
    (key: string) => openSections.includes(key),
    [openSections],
  );

  return { openSections, setOpenSections, toggleSection, isSectionOpen };
}
