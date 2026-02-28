import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ds_dev_access";

interface DevAccessState {
  enabled: boolean;
  enable: () => void;
  disable: () => void;
}

export const useDevAccess = create<DevAccessState>((set) => ({
  enabled: false,
  enable: () => {
    set({ enabled: true });
    AsyncStorage.setItem(STORAGE_KEY, "1");
  },
  disable: () => {
    set({ enabled: false });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

// Hydrate on load
AsyncStorage.getItem(STORAGE_KEY).then((val) => {
  if (val === "1") useDevAccess.setState({ enabled: true });
});
