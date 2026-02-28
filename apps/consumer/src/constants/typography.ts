import { Platform } from "react-native";

export const Fonts = {
  heading: Platform.select({
    ios: "Fraunces",
    android: "Fraunces",
    web: "Fraunces, Georgia, serif",
    default: "Fraunces",
  }),
  body: Platform.select({
    ios: "Inter",
    android: "Inter",
    web: "Inter, -apple-system, sans-serif",
    default: "Inter",
  }),
  mono: Platform.select({
    ios: "JetBrains Mono",
    android: "JetBrains Mono",
    web: "JetBrains Mono, monospace",
    default: "JetBrains Mono",
  }),
} as const;

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;
