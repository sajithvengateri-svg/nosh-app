import { useState, useCallback } from "react";

const BEV_BOTTOM_NAV_KEY = "bevos_bottom_nav_prefs";

export const allBevNavItems = [
  { path: "/bev", label: "Home", icon: "Home" },
  { path: "/bev/cellar", label: "Cellar", icon: "Wine" },
  { path: "/bev/cocktails", label: "Cocktails", icon: "Martini" },
  { path: "/bev/pours", label: "Pours", icon: "BarChart3" },
  { path: "/bev/bar-prep", label: "Bar Prep", icon: "ClipboardCheck" },
  { path: "/bev/stocktake", label: "Stocktake", icon: "Package" },
  { path: "/bev/draught", label: "Draught", icon: "Beer" },
  { path: "/bev/coravin", label: "Coravin", icon: "Droplets" },
  { path: "/bev/engineering", label: "Engineering", icon: "TrendingUp" },
  { path: "/bev/invoices", label: "Invoices", icon: "Receipt" },
  { path: "/bev/compliance", label: "Compliance", icon: "Shield" },
  { path: "/bev/team", label: "Team", icon: "Users2" },
  { path: "/bev/coffee", label: "Coffee", icon: "Coffee" },
  { path: "/bev/training", label: "Training", icon: "GraduationCap" },
  { path: "/bev/marketplace", label: "Market", icon: "Store" },
  { path: "/bev/settings", label: "Settings", icon: "Settings" },
];

const defaultPrimaryPaths = [
  "/bev",
  "/bev/cellar",
  "/bev/cocktails",
  "/bev/pours",
  "/bev/bar-prep",
];

export interface BevBottomNavPrefs {
  primaryPaths: string[];
}

export const useBevBottomNavPrefs = () => {
  const [prefs, setPrefs] = useState<BevBottomNavPrefs>(() => {
    try {
      const stored = localStorage.getItem(BEV_BOTTOM_NAV_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { primaryPaths: defaultPrimaryPaths };
  });

  const updatePrimaryPaths = useCallback((paths: string[]) => {
    const newPrefs = { primaryPaths: paths };
    setPrefs(newPrefs);
    localStorage.setItem(BEV_BOTTOM_NAV_KEY, JSON.stringify(newPrefs));
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaultPrefs = { primaryPaths: defaultPrimaryPaths };
    setPrefs(defaultPrefs);
    localStorage.removeItem(BEV_BOTTOM_NAV_KEY);
  }, []);

  const primaryItems = prefs.primaryPaths
    .map(path => allBevNavItems.find(item => item.path === path))
    .filter(Boolean) as typeof allBevNavItems;

  return {
    prefs,
    primaryPaths: prefs.primaryPaths,
    primaryItems,
    updatePrimaryPaths,
    resetToDefaults,
    allBevNavItems,
    defaultPrimaryPaths,
  };
};
