import { useState, useCallback } from "react";
import { ALL_CHEF_NAV, type ChefNavItem } from "@/lib/chefNavItems";
import { Settings } from "lucide-react";

const BOTTOM_NAV_KEY = "chefos_bottom_nav_prefs_v2";

// Settings item not in chefNavItems registry — add it here
const settingsItem: ChefNavItem = {
  path: "/settings",
  icon: Settings as any,
  label: "Settings",
  module: "settings",
};

// Full list of all navigable items
export const allNavItems = [...ALL_CHEF_NAV, settingsItem];

// Default pinned: first 5 items
const DEFAULT_PINNED_COUNT = 5;
const defaultPinnedPaths = allNavItems.slice(0, DEFAULT_PINNED_COUNT).map(i => i.path);

export interface BottomNavPrefs {
  pinnedPaths: string[];   // items visible without scrolling (max 5)
  overflowOrder: string[]; // remaining items in user-chosen order
}

const buildDefaults = (): BottomNavPrefs => ({
  pinnedPaths: defaultPinnedPaths,
  overflowOrder: allNavItems.slice(DEFAULT_PINNED_COUNT).map(i => i.path),
});

export const useBottomNavPrefs = () => {
  const [prefs, setPrefs] = useState<BottomNavPrefs>(() => {
    const saved = localStorage.getItem(BOTTOM_NAV_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return buildDefaults();
  });

  const save = useCallback((p: BottomNavPrefs) => {
    setPrefs(p);
    localStorage.setItem(BOTTOM_NAV_KEY, JSON.stringify(p));
  }, []);

  const updatePinnedPaths = useCallback((paths: string[]) => {
    const remaining = allNavItems
      .filter(i => !paths.includes(i.path))
      .map(i => i.path);
    save({ pinnedPaths: paths, overflowOrder: remaining });
  }, [save]);

  const resetToDefaults = useCallback(() => {
    const d = buildDefaults();
    setPrefs(d);
    localStorage.removeItem(BOTTOM_NAV_KEY);
  }, []);

  // Resolve paths → items, preserving order
  const resolve = (paths: string[]) =>
    paths
      .map(p => allNavItems.find(i => i.path === p))
      .filter(Boolean) as ChefNavItem[];

  const pinnedItems = resolve(prefs.pinnedPaths);
  const overflowItems = resolve(prefs.overflowOrder);

  // Add any newly added nav items not in either list
  const knownPaths = new Set([...prefs.pinnedPaths, ...prefs.overflowOrder]);
  const newItems = allNavItems.filter(i => !knownPaths.has(i.path));

  return {
    prefs,
    pinnedItems,
    overflowItems: [...overflowItems, ...newItems],
    allItems: [...pinnedItems, ...overflowItems, ...newItems],
    updatePinnedPaths,
    resetToDefaults,
    allNavItems,
    // backward compat aliases
    primaryPaths: prefs.pinnedPaths,
    primaryItems: pinnedItems,
    updatePrimaryPaths: updatePinnedPaths,
    defaultPrimaryPaths: defaultPinnedPaths,
  };
};
