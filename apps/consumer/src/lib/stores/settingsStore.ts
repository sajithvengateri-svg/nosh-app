import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  motivationalBubbles: boolean;
  homeNudges: boolean;
  smartNav: boolean;
  setMotivationalBubbles: (enabled: boolean) => void;
  setHomeNudges: (enabled: boolean) => void;
  setSmartNav: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
}

const STORAGE_KEY = "@ds_settings";

function persist(state: SettingsState) {
  const { motivationalBubbles, homeNudges, smartNav } = state;
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ motivationalBubbles, homeNudges, smartNav })).catch(() => {});
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  motivationalBubbles: true,
  homeNudges: true,
  smartNav: false,

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
      }
    } catch {}
  },
}));
