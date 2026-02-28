import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chefos_fs_tab_order";

const DEFAULT_ORDER = [
  "overview",
  "burst",
  "actions",
  "a1a40",
  "assessment",
  "pest",
  "grease",
  "hood",
  "chemical",
  "haccp",
  "eq_training",
  "training",
  "audit",
  "suppliers_bcc",
  "temp_grid",
  "receiving",
  "cleaning_bcc",
  "sections",
  "temp_setup",
  "receiving_setup",
  "equipment",
];

export function useFoodSafetyTabOrder() {
  const [customOrder, setCustomOrder] = useState<string[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCustomOrder(parsed);
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const getOrderedTabs = useCallback(
    (availableKeys: string[]): string[] => {
      const order = customOrder || DEFAULT_ORDER;
      const ordered: string[] = [];
      // Add items in saved order (if they're in availableKeys)
      for (const key of order) {
        if (availableKeys.includes(key)) ordered.push(key);
      }
      // Append any new tabs not in saved order
      for (const key of availableKeys) {
        if (!ordered.includes(key)) ordered.push(key);
      }
      return ordered;
    },
    [customOrder]
  );

  const saveOrder = useCallback((orderedKeys: string[]) => {
    setCustomOrder(orderedKeys);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(orderedKeys));
  }, []);

  const resetOrder = useCallback(() => {
    setCustomOrder(null);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { getOrderedTabs, saveOrder, resetOrder, loaded };
}
