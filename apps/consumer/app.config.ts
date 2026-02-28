import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Prep Mi",
  slug: "nosh",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "nosh",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FBF8F4",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.noshapp.app",
    infoPlist: {
      NSCameraUsageDescription:
        "Used to scan ingredients, wine labels, receipts, and capture recipe photos.",
      NSPhotoLibraryUsageDescription:
        "Used to select and save photos of your cooked dishes.",
      NSMicrophoneUsageDescription:
        "Used for voice commands during hands-free cook mode.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FBF8F4",
    },
    package: "com.noshapp.app",
  },
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },
  experiments: {
    autolinkingModuleResolution: true,
  },
  extra: {
    supabaseUrl: process.env.SUPABASE_URL ?? "https://gmvfjgkzbpjimmzxcniv.supabase.co",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmZqZ2t6YnBqaW1tenhjbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODc1OTgsImV4cCI6MjA4NzQ2MzU5OH0.7uOEGnm8YFTg6GW8yKFqq_1DfiUMviQOmer3MO_UoNE",
    eas: {
      projectId: "",
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
