import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  motivationalBubbles: boolean;
  homeNudges: boolean;
  smartNav: boolean;
  showWastage: boolean;
  setMotivationalBubbles: (enabled: boolean) => void;
  setHomeNudges: (enabled: boolean) => void;
  setSmartNav: (enabled: boolean) => void;
  setShowWastage: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEY = "@ds_settings";

function persist(state: SettingsState) {
  const { motivationalBubbles, homeNudges, smartNav, showWastage } = state;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ motivationalBubbles, homeNudges, smartNav, showWastage })).catch(() => {});
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  motivationalBubbles: true,
  homeNudges: true,
  smartNav: false,
  showWastage: true,

  setMotivationalBubbles: (enabled) => {
    set({ motivationalBubbles: enabled });
    persist(get());
  },

  setHomeNudges: (enabled) => {
    set({ homeNudges: enabled });
    persist(get());
  },

  setSmartNav: (enabled) => {
    set({ smartNav: enabled });
    persist(get());
  },

  setShowWastage: (enabled) => {
    set({ showWastage: enabled });
    persist(get());
  },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.motivationalBubbles === "boolean") {
          set({ motivationalBubbles: parsed.motivationalBubbles });
        }
        if (typeof parsed.homeNudges === "boolean") {
          set({ homeNudges: parsed.homeNudges });
        }
        if (typeof parsed.smartNav === "boolean") {
          set({ smartNav: parsed.smartNav });
        }
        if (typeof parsed.showWastage === "boolean") {
          set({ showWastage: parsed.showWastage });
        }
      }
    } catch {}
  },
}));
