import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "chefos_app_settings";

export interface AppSettings {
  // General — Appearance
  theme: "light" | "dark" | "system" | "pink-onion" | "rainbow" | "ocean" | "terminal" | "lavender";
  compactMode: boolean;
  animations: boolean;
  // General — Image Optimization
  autoCompress: boolean;
  imageQuality: "low" | "medium" | "high";
  maxImageSize: "1024" | "1600" | "2048";
  // General — Notifications
  pushNotifications: boolean;
  emailNotifications: boolean;
  prepReminders: boolean;
  expiryAlerts: boolean;
  // Units
  units: string;
  tempUnit: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  // Business
  taxRate: string;
  targetFoodCost: string;
  // AI
  aiChat: boolean;
  aiVoice: boolean;
  aiOcr: boolean;
  // Privacy
  showProfileToTeam: boolean;
  showActivityStatus: boolean;
  shareAnalytics: boolean;
  sessionTimeout: string;
  // Costing
  gstEnabled: boolean;
  // Todo Feature Toggles
  todoKanbanEnabled: boolean;
  todoDayCarouselEnabled: boolean;
  todoProgressBarEnabled: boolean;
  todoShoppingTabEnabled: boolean;
  todoChefOrdersEnabled: boolean;
  todoHandwriteEnabled: boolean;
  todoScanEnabled: boolean;
  todoTemplatesEnabled: boolean;
  todoDelegateEnabled: boolean;
  todoVoiceEnabled: boolean;
  todoWorkflowsEnabled: boolean;
  todoAiSuggestEnabled: boolean;
  todoSearchEnabled: boolean;
  todoArchiveEnabled: boolean;
  thoughtOfDayEnabled: boolean;
  // AI Companion
  companionEnabled: boolean;
  companionName: string | null;
  companionVoiceEnabled: boolean;
  companionVoiceProvider: "elevenlabs" | "vapi" | null;
  // Walkthrough
  hasSeenWalkthrough: boolean;
  // Dev / Testing
  devGccModeEnabled: boolean;
  devGameUnlockBypass: boolean;
}

const DEFAULTS: AppSettings = {
  // General
  theme: "terminal",
  compactMode: false,
  animations: true,
  autoCompress: true,
  imageQuality: "medium",
  maxImageSize: "1600",
  pushNotifications: true,
  emailNotifications: true,
  prepReminders: true,
  expiryAlerts: true,
  // Units
  units: "metric",
  tempUnit: "celsius",
  currency: "$",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24",
  // Business
  taxRate: "10",
  targetFoodCost: "30",
  // AI (all off by default — credit-gated)
  aiChat: false,
  aiVoice: false,
  aiOcr: false,
  // Privacy
  showProfileToTeam: true,
  showActivityStatus: true,
  shareAnalytics: false,
  sessionTimeout: "4h",
  // Costing
  gstEnabled: true,
  // Todo
  todoKanbanEnabled: true,
  todoDayCarouselEnabled: true,
  todoProgressBarEnabled: true,
  todoShoppingTabEnabled: true,
  todoChefOrdersEnabled: true,
  todoHandwriteEnabled: true,
  todoScanEnabled: true,
  todoTemplatesEnabled: true,
  todoDelegateEnabled: true,
  todoVoiceEnabled: false,
  todoWorkflowsEnabled: true,
  todoAiSuggestEnabled: true,
  todoSearchEnabled: true,
  todoArchiveEnabled: true,
  thoughtOfDayEnabled: true,
  // AI Companion
  companionEnabled: true,
  companionName: null,
  companionVoiceEnabled: false,
  companionVoiceProvider: null,
  // Walkthrough
  hasSeenWalkthrough: false,
  // Dev / Testing
  devGccModeEnabled: false,
  devGameUnlockBypass: false,
};

interface AppSettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  loaded: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  settings: DEFAULTS,
  updateSetting: () => {},
  resetSettings: () => {},
  loaded: false,
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULTS);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting, resetSettings, loaded }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
