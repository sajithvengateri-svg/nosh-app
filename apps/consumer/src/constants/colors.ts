import { create } from "zustand";

// ── Theme Definitions ─────────────────────────────────────────────
export interface ThemePalette {
  key: string;
  label: string;
  primary: string;
  secondary: string;
  background: string;
  card: string;
  accent: string;
  wine: string;
  cocktail: string;
  alert: string;
  success: string;
  text: { primary: string; secondary: string; muted: string };
  border: string;
  divider: string;
}

const THEMES: Record<string, ThemePalette> = {
  pink_onion: {
    key: "pink_onion",
    label: "Pink Onion",
    primary: "#D94878",
    secondary: "#2A1F2D",
    background: "#FBF6F8",
    card: "#FDFBFC",
    accent: "#8B6E7F",
    wine: "#4A1528",
    cocktail: "#2D1A3A",
    alert: "#E8A93E",
    success: "#5BA37A",
    text: { primary: "#2A1F2D", secondary: "#7A6B75", muted: "#A89DA3" },
    border: "#E8DDE2",
    divider: "#F2ECF0",
  },
  kitchen: {
    key: "kitchen",
    label: "Kitchen",
    primary: "#C47A38",
    secondary: "#261F17",
    background: "#F8F5F2",
    card: "#FDFCFB",
    accent: "#528C5E",
    wine: "#4A1528",
    cocktail: "#1A3A4A",
    alert: "#E8A93E",
    success: "#4CAF50",
    text: { primary: "#261F17", secondary: "#6B5E53", muted: "#A09488" },
    border: "#E5DDD5",
    divider: "#F0EBE4",
  },
  ocean: {
    key: "ocean",
    label: "Ocean Blue",
    primary: "#3B82C4",
    secondary: "#1A2A3A",
    background: "#F5F8FB",
    card: "#FBFCFD",
    accent: "#4A9EAA",
    wine: "#1A2840",
    cocktail: "#1A3A4A",
    alert: "#E8A93E",
    success: "#4A9E7A",
    text: { primary: "#1A2A3A", secondary: "#5A6E80", muted: "#8DA0B0" },
    border: "#D8E2EA",
    divider: "#EBF0F5",
  },
  terminal: {
    key: "terminal",
    label: "Terminal",
    primary: "#4ADE80",
    secondary: "#E8FFE8",
    background: "#0A0F0A",
    card: "#121A12",
    accent: "#22C55E",
    wine: "#1A3A1A",
    cocktail: "#0A2A1A",
    alert: "#E8A93E",
    success: "#4ADE80",
    text: { primary: "#D4F5D4", secondary: "#7AB87A", muted: "#4A7A4A" },
    border: "#1A2A1A",
    divider: "#162216",
  },
  lavender: {
    key: "lavender",
    label: "Lavender",
    primary: "#9B7AC4",
    secondary: "#2A1F3A",
    background: "#F8F6FB",
    card: "#FDFBFE",
    accent: "#7A6EB0",
    wine: "#3A1A4A",
    cocktail: "#2A1A3A",
    alert: "#E8A93E",
    success: "#6AAA8A",
    text: { primary: "#2A1F3A", secondary: "#6B5E80", muted: "#A098B0" },
    border: "#E2DBF0",
    divider: "#F0ECF5",
  },
  rainbow: {
    key: "rainbow",
    label: "Rainbow",
    primary: "#A855F7",
    secondary: "#1F1A2E",
    background: "#FAF8FF",
    card: "#FEFBFF",
    accent: "#EC4899",
    wine: "#4A1540",
    cocktail: "#1A2A4A",
    alert: "#F59E0B",
    success: "#10B981",
    text: { primary: "#1F1A2E", secondary: "#6A5E80", muted: "#A098B0" },
    border: "#E8E0F0",
    divider: "#F5F0FA",
  },
};

export const AVAILABLE_THEMES = Object.values(THEMES);

// ── Theme Store ──────────────────────────────────────────────────
interface ThemeState {
  themeKey: string;
  setTheme: (key: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeKey: "pink_onion",
  setTheme: (themeKey) => set({ themeKey }),
}));

// ── Active Theme Accessor ────────────────────────────────────────
export function getTheme(): ThemePalette {
  const key = useThemeStore.getState().themeKey;
  return THEMES[key] ?? THEMES.pink_onion;
}

// ── Static Defaults (for module-level usage) ─────────────────────
// These reference Pink Onion as default. Components that need live
// theme switching should use getTheme() or useThemeStore instead.
export const Colors = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  background: "#FBF6F8",
  card: "#FDFBFC",
  accent: "#8B6E7F",
  wine: "#4A1528",
  cocktail: "#2D1A3A",
  alert: "#E8A93E",
  success: "#5BA37A",

  text: {
    primary: "#2A1F2D",
    secondary: "#7A6B75",
    muted: "#A89DA3",
  },

  border: "#E8DDE2",
  divider: "#F2ECF0",
} as const;

export const Spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  card: 20,
  button: 24,
  pill: 9999,
  companion: 26,
  full: 9999,
} as const;

// ── Liquid Glass Design Tokens ──────────────────────────────────
export const Glass = {
  // Translucent surfaces
  surface: "rgba(255, 255, 255, 0.35)",
  surfaceHover: "rgba(255, 255, 255, 0.5)",
  surfaceDark: "rgba(42, 31, 45, 0.3)",
  surfaceAccent: "rgba(217, 72, 120, 0.12)",

  // Subtle edge definition
  borderLight: "rgba(255, 255, 255, 0.4)",
  borderOuter: "rgba(0, 0, 0, 0.06)",

  // Blur intensities (expo-blur)
  blur: 40,
  blurHeavy: 60,
  blurLight: 20,

  // Soft diffused shadows
  shadow: {
    color: "rgba(0,0,0,0.10)",
    offset: { width: 0, height: 8 },
    radius: 24,
  },
  shadowLight: {
    color: "rgba(0,0,0,0.05)",
    offset: { width: 0, height: 4 },
    radius: 12,
  },
} as const;
