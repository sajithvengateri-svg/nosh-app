import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, Animated, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthProvider";
import { useVendorAuth } from "../../contexts/VendorAuthProvider";
import { VARIANT_REGISTRY, isVendor } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const chefLogo = require("../../assets/icon.png");

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_VENDOR = isVendor(APP_VARIANT);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const INTERVAL_MS = 5000;

function useDevEnter() {
  if (IS_VENDOR) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { devEnter } = useVendorAuth();
    return devEnter;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { devEnter } = useAuth();
  return devEnter;
}

export default function Landing() {
  const router = useRouter();
  const devEnter = useDevEnter();
  const v = VARIANT_REGISTRY[APP_VARIANT].brand;
  const images = v.images;

  const [activeIndex, setActiveIndex] = useState(0);
  const [showDev, setShowDev] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tap logo 5 times within 3s to reveal dev buttons
  const handleLogoTap = useCallback(() => {
    if (!__DEV__) return;
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      setShowDev(true);
      tapCountRef.current = 0;
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 3000);
    }
  }, []);

  const advanceImage = useCallback(() => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(advanceImage, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advanceImage, images.length]);

  // Prefetch all images on mount
  useEffect(() => {
    images.forEach((uri) => Image.prefetch(uri));
  }, [images]);

  return (
    <View style={[styles.root, { backgroundColor: v.bg }]}>
      {/* Background hero image */}
      <Animated.View pointerEvents="none" style={[styles.heroContainer, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: images[activeIndex] }}
          style={styles.heroImage}
          contentFit="cover"
          transition={400}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Gradient overlay */}
      <View pointerEvents="none" style={[styles.overlay, { backgroundColor: v.bg }]} />

      {/* DEV buttons — hidden until logo tapped 5× */}
      {showDev && (
        <View style={{ position: "absolute", top: 54, right: 16, zIndex: 999, flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => {
              devEnter();
              setTimeout(() => router.replace("/(app)/(tabs)/dashboard"), 300);
            }}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#059669" : "#10B981",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFF" }}>SKIP AUTH</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(auth)/dev-navigator")}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFF" }}>DEV</Text>
          </Pressable>
        </View>
      )}

      {/* Content */}
      <SafeAreaView style={styles.content}>
        {/* Top spacer */}
        <View style={styles.spacer} />

        {/* Branding */}
        <View style={styles.brandingContainer}>
          <Pressable onPress={handleLogoTap}>
            <Image
              source={chefLogo}
              style={styles.logo}
              contentFit="contain"
            />
          </Pressable>
          <Text style={[styles.appName, { color: v.textColor }]}>
            {v.name}
          </Text>
          <Text style={[styles.tagline, { color: v.subtextColor }]}>
            {v.tagline}
          </Text>
        </View>

        {/* Dot indicators */}
        {images.length > 1 && (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === activeIndex ? v.accent : v.subtextColor,
                    opacity: i === activeIndex ? 1 : 0.4,
                    width: i === activeIndex ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable
            onPress={() => router.push(IS_VENDOR ? "/(auth)/vendor-auth" : "/(auth)/login")}
            style={({ pressed }) => ([
              styles.primaryButton,
              { backgroundColor: v.accent, opacity: pressed ? 0.85 : 1 },
            ])}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(IS_VENDOR ? "/(auth)/vendor-auth" : "/(auth)/signup")}
            style={({ pressed }) => ([
              styles.secondaryButton,
              { borderColor: v.accent, opacity: pressed ? 0.85 : 1 },
            ])}
          >
            <Text style={[styles.secondaryButtonText, { color: v.accent }]}>
              Create Account
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroContainer: {
    ...StyleSheet.absoluteFillObject,
    height: SCREEN_HEIGHT * 0.55,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    top: SCREEN_HEIGHT * 0.25,
    height: SCREEN_HEIGHT * 0.75,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  spacer: {
    flex: 1,
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 8,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
