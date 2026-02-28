import { ExpoConfig, ConfigContext } from "expo/config";
import { VARIANT_REGISTRY } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const variant = (process.env.APP_VARIANT ?? "chefos") as AppVariant;
const v = VARIANT_REGISTRY[variant] ?? VARIANT_REGISTRY.chefos;
const cfg = v.brand;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: cfg.name,
  slug: cfg.slug,
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: cfg.scheme,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: cfg.splash,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: cfg.bundleId,
    infoPlist: {
      NSCameraUsageDescription:
        "Used to scan invoices, log food safety photos, and capture recipe images.",
      NSPhotoLibraryUsageDescription:
        "Used to select images for recipes and food safety verification.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: cfg.splash,
    },
    package: cfg.bundleId,
  },
  experiments: {
    autolinkingModuleResolution: true,
  },
  extra: {
    appVariant: variant,
    supabaseUrl: process.env.SUPABASE_URL ?? "https://rahociztfiuzyolqvdcz.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaG9jaXp0Zml1enlvbHF2ZGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzE5NTUsImV4cCI6MjA4NjgwNzk1NX0.IPRKpotD-LeUjrYdnnxksV1zUnZ0ZePpUd-jIuY3lyg",
    eas: {
      projectId: "", // Set after running eas init
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-image-picker",
    "expo-asset",
    "@react-native-community/datetimepicker",
    "expo-screen-orientation",
    "expo-web-browser",
  ],
});
