import { createContext, useContext, useMemo, ReactNode } from "react";
import { useColorScheme } from "react-native";
import { useAppSettings } from "../hooks/useAppSettings";

const LIGHT = {
  background: "#FFFFFF",
  surface: "#F9FAFB",
  card: "#FFFFFF",
  cardBorder: "#F3F4F6",
  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  accent: "#6366F1",
  accentBg: "#EEF2FF",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  destructive: "#DC2626",
  destructiveBg: "#FEF2F2",
  border: "#F3F4F6",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E5E7EB",
  inputBg: "#F9FAFB",
};

const DARK = {
  background: "#111827",
  surface: "#1F2937",
  card: "#1F2937",
  cardBorder: "#374151",
  text: "#F9FAFB",
  textSecondary: "#9CA3AF",
  textMuted: "#9CA3AF",
  accent: "#818CF8",
  accentBg: "#312E81",
  success: "#34D399",
  successBg: "#064E3B",
  warning: "#FBBF24",
  warningBg: "#78350F",
  destructive: "#F87171",
  destructiveBg: "#7F1D1D",
  border: "#374151",
  tabBar: "#0F172A",
  tabBarBorder: "#1E293B",
  inputBg: "#1F2937",
};

// Pink Onion — warm pinks & rose
const PINK_ONION = {
  background: "#FAF5F6",
  surface: "#FDF9FA",
  card: "#FEFCFD",
  cardBorder: "#F2D9DE",
  text: "#2E1318",
  textSecondary: "#7A5A61",
  textMuted: "#9E7E85",
  accent: "#D44D72",
  accentBg: "#FCE8EE",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#CC7733",
  warningBg: "#FFF4EB",
  destructive: "#DC2626",
  destructiveBg: "#FEF2F2",
  border: "#F0D4DA",
  tabBar: "#FAF5F6",
  tabBarBorder: "#F0D4DA",
  inputBg: "#FDF9FA",
};

// Rainbow — vibrant purple & teal
const RAINBOW = {
  background: "#F9F5FC",
  surface: "#FBF8FD",
  card: "#FDFBFE",
  cardBorder: "#E6D5F0",
  text: "#1E132A",
  textSecondary: "#6E5A80",
  textMuted: "#9585A3",
  accent: "#8B45D6",
  accentBg: "#F1E5FB",
  success: "#2DB88A",
  successBg: "#E5FAF2",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  destructive: "#DC2626",
  destructiveBg: "#FEF2F2",
  border: "#E2D0EE",
  tabBar: "#F9F5FC",
  tabBarBorder: "#E2D0EE",
  inputBg: "#FBF8FD",
};

// Ocean Blue — cool blues & teal
const OCEAN = {
  background: "#F3F7FB",
  surface: "#F7FAFC",
  card: "#FBFCFE",
  cardBorder: "#D1DFF0",
  text: "#132137",
  textSecondary: "#5A6F85",
  textMuted: "#8596A8",
  accent: "#2E7DD6",
  accentBg: "#E0EEFA",
  success: "#2DAAA0",
  successBg: "#E5F8F6",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  destructive: "#DC2626",
  destructiveBg: "#FEF2F2",
  border: "#CCDDEE",
  tabBar: "#F3F7FB",
  tabBarBorder: "#CCDDEE",
  inputBg: "#F7FAFC",
};

// Terminal — hacker green-on-black
const TERMINAL = {
  background: "#0A120A",
  surface: "#111E11",
  card: "#131F13",
  cardBorder: "#1E3B1E",
  text: "#66FF66",
  textSecondary: "#44CC44",
  textMuted: "#55AA55",
  accent: "#33FF33",
  accentBg: "#0D2A0D",
  success: "#33FF33",
  successBg: "#0D2A0D",
  warning: "#CCCC33",
  warningBg: "#1A1A00",
  destructive: "#DD4444",
  destructiveBg: "#2A0D0D",
  border: "#1E3B1E",
  tabBar: "#060E06",
  tabBarBorder: "#1A331A",
  inputBg: "#111E11",
};

// Lavender — soft calming purple
const LAVENDER = {
  background: "#F6F2FA",
  surface: "#F9F6FC",
  card: "#FCFAFD",
  cardBorder: "#DED0EB",
  text: "#1C1326",
  textSecondary: "#6A5580",
  textMuted: "#9082A3",
  accent: "#8855BB",
  accentBg: "#EDE0F8",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  destructive: "#DC2626",
  destructiveBg: "#FEF2F2",
  border: "#D9CBEA",
  tabBar: "#F6F2FA",
  tabBarBorder: "#D9CBEA",
  inputBg: "#F9F6FC",
};

export type ThemeId = "light" | "dark" | "system" | "pink-onion" | "rainbow" | "ocean" | "terminal" | "lavender";

export type ThemeColors = typeof LIGHT;

const THEME_MAP: Record<Exclude<ThemeId, "system">, ThemeColors> = {
  light: LIGHT,
  dark: DARK,
  "pink-onion": PINK_ONION,
  rainbow: RAINBOW,
  ocean: OCEAN,
  terminal: TERMINAL,
  lavender: LAVENDER,
};

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  desc: string;
  swatches: [string, string, string]; // 3 preview colors
}

export const THEMES: ThemeMeta[] = [
  { id: "light", label: "Kitchen", desc: "Clean & warm", swatches: ["#FFFFFF", "#6366F1", "#10B981"] },
  { id: "dark", label: "Kitchen Dark", desc: "Dark warm tones", swatches: ["#111827", "#818CF8", "#34D399"] },
  { id: "system", label: "System", desc: "Match device", swatches: ["#E5E7EB", "#808080", "#333333"] },
  { id: "pink-onion", label: "Pink Onion", desc: "Warm pinks & rose", swatches: ["#FAF5F6", "#D44D72", "#CC7733"] },
  { id: "rainbow", label: "Rainbow", desc: "Vibrant purple & teal", swatches: ["#F9F5FC", "#8B45D6", "#2DB88A"] },
  { id: "ocean", label: "Ocean Blue", desc: "Cool blues & teal", swatches: ["#F3F7FB", "#2E7DD6", "#2DAAA0"] },
  { id: "terminal", label: "Terminal", desc: "Hacker green-on-black", swatches: ["#0A120A", "#33FF33", "#337733"] },
  { id: "lavender", label: "Lavender", desc: "Soft calming purple", swatches: ["#F6F2FA", "#8855BB", "#10B981"] },
];

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  themeId: ThemeId;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LIGHT,
  isDark: false,
  themeId: "system",
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppSettings();
  const systemScheme = useColorScheme();

  const themeId = (settings.theme || "system") as ThemeId;

  const resolved = useMemo(() => {
    if (themeId === "system") {
      const isDark = systemScheme === "dark";
      return { colors: isDark ? DARK : LIGHT, isDark, themeId: themeId as ThemeId };
    }
    const colors = THEME_MAP[themeId] || LIGHT;
    // Terminal and dark are "dark" themes for status bar etc.
    const isDark = themeId === "dark" || themeId === "terminal";
    return { colors, isDark, themeId: themeId as ThemeId };
  }, [themeId, systemScheme]);

  return (
    <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
