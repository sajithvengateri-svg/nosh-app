import { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Wrench } from "lucide-react-native";
import * as Linking from "expo-linking";
import { Colors, Glass } from "../../src/constants/colors";
import { useDevAccess } from "../../src/lib/devAccess";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

let NOSH_LOGO: any = null;
try {
  NOSH_LOGO = require("../../assets/nosh-logo.png");
} catch {}

// ── Bubble config ─────────────────────────────────────────────────
interface BubbleConfig {
  id: number;
  size: number;
  startX: number;
  startY: number;
  speed: number;
  delay: number;
  drift: number;
}

function generateBubbles(): BubbleConfig[] {
  const bubbles: BubbleConfig[] = [];
  for (let i = 0; i < 14; i++) {
    bubbles.push({
      id: i,
      size: 20 + Math.random() * 60,
      startX: Math.random() * (SCREEN_W - 80),
      startY: SCREEN_H * (0.3 + Math.random() * 0.7),
      speed: 6000 + Math.random() * 6000,
      delay: Math.random() * 4000,
      drift: 15 + Math.random() * 30,
    });
  }
  return bubbles;
}

const BUBBLES = generateBubbles();

// ── Soap Bubble Component ─────────────────────────────────────────
function SoapBubble({ size, startX, startY, speed, delay, drift }: Omit<BubbleConfig, "id">) {
  const translateY = useRef(new Animated.Value(startY)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeIn = Animated.timing(opacity, {
      toValue: 0.4 + Math.random() * 0.35,
      duration: 800,
      delay,
      useNativeDriver: true,
    });

    const floatUp = Animated.loop(
      Animated.timing(translateY, {
        toValue: -size * 1.5,
        duration: speed,
        useNativeDriver: true,
      })
    );

    const sineWave = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: drift,
          duration: speed * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -drift,
          duration: speed * 0.5,
          useNativeDriver: true,
        }),
      ])
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const timer = setTimeout(() => {
      fadeIn.start();
      floatUp.start();
      sineWave.start();
      pulse.start();
    }, delay);

    // Reset loop: when float completes one cycle, snap back
    const resetInterval = setInterval(() => {
      translateY.setValue(startY);
    }, speed + delay);

    return () => {
      clearTimeout(timer);
      clearInterval(resetInterval);
      floatUp.stop();
      sineWave.stop();
      pulse.stop();
    };
  }, []);

  const webGlass: any =
    Platform.OS === "web"
      ? { backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }
      : {};

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: Glass.surface,
          borderWidth: 1,
          borderColor: Glass.borderLight,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
        webGlass,
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// ── LANDING SCREEN ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const enableDev = useDevAccess((s) => s.enable);

  // ── Center content entrance ──
  // Start at visible values so content shows even if animations fail on web
  const contentScale = useRef(new Animated.Value(Platform.OS === "web" ? 1 : 0.5)).current;
  const contentOpacity = useRef(new Animated.Value(Platform.OS === "web" ? 1 : 0)).current;
  const ctaOpacity = useRef(new Animated.Value(Platform.OS === "web" ? 1 : 0)).current;
  const ctaY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === "web") return; // Skip animations on web — already visible
    // Logo + brand entrance
    Animated.parallel([
      Animated.spring(contentScale, {
        toValue: 1,
        speed: 6,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // CTA buttons fade in after a beat
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(ctaY, {
          toValue: 0,
          speed: 10,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);
  }, []);

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={[Colors.background, "#F5E8EF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soap bubbles */}
      {BUBBLES.map((b) => (
        <SoapBubble
          key={b.id}
          size={b.size}
          startX={b.startX}
          startY={b.startY}
          speed={b.speed}
          delay={b.delay}
          drift={b.drift}
        />
      ))}

      {/* Center content */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          },
        ]}
      >
        {/* Logo circle */}
        <View style={styles.logoCircle}>
          {NOSH_LOGO ? (
            <Image
              source={NOSH_LOGO}
              style={styles.logoImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.logoFallback}>N</Text>
          )}
        </View>

        {/* Brand name */}
        <Text style={styles.brandText}>NOSH</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Your AI cooking companion</Text>

        {/* Sub-tagline */}
        <Text style={styles.subTagline}>
          Know your nosh. Know your prices.{"\n"}
          One pot. Six ingredients. Sorted.
        </Text>
      </Animated.View>

      {/* Bottom CTA section */}
      <Animated.View
        style={[
          styles.ctaContainer,
          {
            paddingBottom: insets.bottom + 20,
            opacity: ctaOpacity,
            transform: [{ translateY: ctaY }],
          },
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
      </Animated.View>

      {/* Admin spanner footer */}
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
    overflow: "hidden",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 2,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  logoImage: {
    width: 144,
    height: 144,
    borderRadius: 72,
  },
  logoFallback: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.primary,
  },
  brandText: {
    fontSize: 52,
    fontWeight: "800",
    color: Colors.secondary,
    letterSpacing: 10,
    textAlign: "center",
  },
  tagline: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginTop: 12,
  },
  subTagline: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  ctaContainer: {
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 12,
    zIndex: 2,
  },
  btnGetStarted: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Glass.surface,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    alignItems: "center",
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } as any)
      : {}),
  },
  btnGetStartedText: {
    color: Colors.secondary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  btnAccount: {
    paddingVertical: 12,
    alignItems: "center",
  },
  btnAccountText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: "500",
  },
  btnDev: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  btnDevText: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: "400",
  },
  adminFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    zIndex: 2,
  },
  adminFooterText: {
    fontSize: 11,
    color: Colors.text.muted,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});
