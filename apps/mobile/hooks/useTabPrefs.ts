import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chefos_tab_prefs";

export interface TabOption {
  key: string;
  label: string;
  icon: string;
}

export const ALL_TAB_OPTIONS: TabOption[] = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "recipes", label: "Recipes", icon: "BookOpen" },
  { key: "todo", label: "Todo", icon: "CheckSquare" },
  { key: "inventory", label: "Inventory", icon: "Package" },
  { key: "more", label: "More", icon: "Menu" },
  { key: "kitchen", label: "Kitchen", icon: "UtensilsCrossed" },
];

const DEFAULT_TABS = ["dashboard", "recipes", "todo", "inventory", "more"];

export function useTabPrefs() {
  const [selectedTabs, setSelectedTabs] = useState<string[]>(DEFAULT_TABS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === 5) {
            setSelectedTabs(parsed);
          }
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const updateTabs = useCallback((tabs: string[]) => {
    if (tabs.length !== 5) return;
    setSelectedTabs(tabs);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSelectedTabs(DEFAULT_TABS);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const isSelected = useCallback((key: string) => selectedTabs.includes(key), [selectedTabs]);

  return { selectedTabs, updateTabs, resetToDefaults, isSelected, loaded };
}
