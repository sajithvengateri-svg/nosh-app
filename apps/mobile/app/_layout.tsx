import "../global.css";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../contexts/AuthProvider";
import { OrgProvider } from "../contexts/OrgProvider";
import { VendorAuthProvider } from "../contexts/VendorAuthProvider";
import { ThemeProvider } from "../contexts/ThemeProvider";
import { AppSettingsProvider } from "../hooks/useAppSettings";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Constants from "expo-constants";
import { isVendor } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_VENDOR = isVendor(APP_VARIANT);

// Initialize Sentry crash reporting
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <AppSettingsProvider>
              {IS_VENDOR ? (
                <VendorAuthProvider>
                  <ThemeProvider>
                    <StatusBar style="auto" />
                    <Stack screenOptions={{ headerShown: false }} />
                  </ThemeProvider>
                </VendorAuthProvider>
              ) : (
                <AuthProvider>
                  <OrgProvider>
                    <ThemeProvider>
                      <StatusBar style="auto" />
                      <Stack screenOptions={{ headerShown: false }} />
                    </ThemeProvider>
                  </OrgProvider>
                </AuthProvider>
              )}
            </AppSettingsProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
