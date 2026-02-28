import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Wrench } from "lucide-react-native";
import * as Linking from "expo-linking";
import { Colors, Glass } from "../../src/constants/colors";
import { useDevAccess } from "../../src/lib/devAccess";

const LANDING_URL = "https://chefos.ai/nosh";

// ═══════════════════════════════════════════════════════════════════
// ── LANDING SCREEN — WebView + native auth overlay
// ═══════════════════════════════════════════════════════════════════
export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const enableDev = useDevAccess((s) => s.enable);
  const [loading, setLoading] = useState(true);

  // Web: just redirect to the landing page
  if (Platform.OS === "web") {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: Colors.text.muted, fontSize: 14 }}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* WebView loads the consumer landing page */}
      <WebView
        source={{ uri: LANDING_URL }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        // Intercept link taps — don't navigate away
        onShouldStartLoadWithRequest={(request) => {
          if (request.url === LANDING_URL || request.url.startsWith(LANDING_URL)) return true;
          // Auth links → handle natively
          if (request.url.includes("/auth")) {
            router.push("/(auth)/signup");
            return false;
          }
          if (request.url.includes("/vendor")) {
            Linking.openURL(request.url);
            return false;
          }
          return false;
        }}
      />

      {/* Loading spinner */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Bottom CTA overlay — glass bar with auth buttons */}
      <View
        style={[
          styles.ctaBar,
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
        {/* Get Started */}
        <Pressable
          onPress={() => router.push("/(auth)/signup")}
          style={({ pressed }) => [
            styles.btnGetStarted,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.btnGetStartedText}>Get Started</Text>
        </Pressable>

        {/* I have an account */}
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => [
            styles.btnAccount,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.btnAccountText}>I have an account</Text>
        </Pressable>

        {/* Dev Access */}
        <Pressable
          onPress={() => {
            enableDev();
            router.replace("/(app)/feed");
          }}
          style={styles.btnDev}
        >
          <Text style={styles.btnDevText}>Dev Access</Text>
        </Pressable>
      </View>

      {/* Admin spanner */}
      <Pressable
        onPress={() => Linking.openURL("https://nosh-admin-eight.vercel.app")}
        style={({ pressed }) => [
          styles.adminFooter,
          { paddingBottom: Math.max(insets.bottom, 8) },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Wrench size={12} color={Colors.text.muted} strokeWidth={1.5} />
        <Text style={styles.adminFooterText}>Admin</Text>
      </Pressable>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(251,246,248,0.92)",
    paddingTop: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(232,221,226,0.5)",
  },
  btnGetStarted: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  btnGetStartedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  btnAccount: {
    paddingVertical: 8,
    alignItems: "center",
  },
  btnAccountText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  btnDev: {
    paddingVertical: 4,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  btnDevText: {
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: "400",
  },
  adminFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 6,
    backgroundColor: "rgba(251,246,248,0.92)",
  },
  adminFooterText: {
    fontSize: 11,
    color: Colors.text.muted,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});
