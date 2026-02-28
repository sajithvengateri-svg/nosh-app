import { useRef, useEffect, useCallback } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChefHat } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useCompanionStore } from "../../lib/companion/companionStore";
import { lightTap, mediumTap, heavyTap } from "../../lib/haptics";

const BUBBLE_SIZE_CANVAS = 52;
const BUBBLE_SIZE_FEED = 48;
const DOUBLE_TAP_DELAY = 300;

let NOSH_LOGO: any = null;
try {
  NOSH_LOGO = require("../../../assets/nosh-logo.png");
} catch {}

interface CompanionBubbleProps {
  onTap: () => void;
  onDoubleTap: () => void;
  onLongPress: () => void;
}

export function CompanionBubble({ onTap, onDoubleTap, onLongPress }: CompanionBubbleProps) {
  const insets = useSafeAreaInsets();
  const activeScreen = useCompanionStore((s) => s.activeScreen);
  const presence = useCompanionStore((s) => s.presence);
  const responseStack = useCompanionStore((s) => s.responseStack);
  const inputVisible = useCompanionStore((s) => s.inputVisible);
  const justWoke = useCompanionStore((s) => s.justWoke);
  const setJustWoke = useCompanionStore((s) => s.setJustWoke);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const heartbeatOpacity = useRef(new Animated.Value(0)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;
  const lastTapTime = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = responseStack.length > 0 || inputVisible;
  const isOnFeed = activeScreen === "feed";
  const size = isOnFeed ? BUBBLE_SIZE_FEED : BUBBLE_SIZE_CANVAS;

  // ── Wake-up animation ──
  useEffect(() => {
    if (!justWoke) return;
    // Bounce: 0.8 → 1.25 → 1.0 + glow flash
    scaleAnim.setValue(0.8);
    glowOpacity.setValue(1);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.25,
          speed: 40,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 30,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(glowOpacity, {
        toValue: 0.4,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setJustWoke(false);
    });
  }, [justWoke]);

  // ── Pulsating glow (canvas when active, feed always subtle) ──
  useEffect(() => {
    if (justWoke) return; // wake animation handles glow
    if (isOnFeed) {
      // Subtle glow on feed — always visible
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.25,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.08,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else if (isActive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.2,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      glowOpacity.setValue(0);
    }
  }, [isActive, isOnFeed, justWoke]);

  // ── Breathing pulse on feed (scale 1.0 → 1.03 → 1.0, 3s) ──
  useEffect(() => {
    if (isOnFeed) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheScale, {
            toValue: 1.04,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(breatheScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      breatheScale.setValue(1);
    }
  }, [isOnFeed]);

  // ── Heartbeat pulse (canvas only, when active) ──
  useEffect(() => {
    if (isActive && !isOnFeed && NOSH_LOGO) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(heartbeatOpacity, {
            toValue: 0.6,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(100),
          Animated.timing(heartbeatOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      heartbeatOpacity.setValue(0);
    }
  }, [isActive, isOnFeed]);

  // ── Tap / double-tap detection ──
  const handlePress = useCallback(() => {
    const now = Date.now();
    const delta = now - lastTapTime.current;
    lastTapTime.current = now;

    if (delta < DOUBLE_TAP_DELAY) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      heavyTap();
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          speed: 50,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          speed: 50,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 40,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
      onDoubleTap();
    } else {
      tapTimer.current = setTimeout(() => {
        mediumTap();
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.15,
            speed: 50,
            bounciness: 10,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            speed: 40,
            bounciness: 6,
            useNativeDriver: true,
          }),
        ]).start();
        onTap();
      }, DOUBLE_TAP_DELAY);
    }
  }, [onTap, onDoubleTap, scaleAnim]);

  const handlePressIn = useCallback(() => {
    lightTap();
    Animated.spring(scaleAnim, {
      toValue: 1.08,
      speed: 50,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleLongPress = useCallback(() => {
    mediumTap();
    onLongPress();
  }, [onLongPress]);

  if (presence === "quiet") return null;

  return (
    <View
      style={[
        styles.container,
        { top: insets.top + 12 },
        isOnFeed && styles.feedMode,
      ]}
      pointerEvents="box-none"
    >
      {/* Glow ring — always visible (subtle on feed, bright on canvas when active) */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Glass bubble with breathing + tap scale */}
      <Animated.View
        style={{
          transform: [
            { scale: Animated.multiply(scaleAnim, breatheScale) },
          ],
        }}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={400}
        >
          <BlurView
            intensity={Glass.blur}
            tint="light"
            style={[
              styles.bubbleOuter,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <View
              style={[
                styles.bubbleInner,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
            >
              {NOSH_LOGO ? (
                <>
                  <Image
                    source={NOSH_LOGO}
                    style={{
                      width: size * 1.2,
                      height: size * 1.2,
                      borderRadius: (size * 1.2) / 2,
                    }}
                    contentFit="cover"
                  />
                  {/* Heartbeat glow line — canvas only when active */}
                  {isActive && !isOnFeed && (
                    <Animated.View
                      style={{
                        position: "absolute",
                        width: "80%",
                        height: 2,
                        borderRadius: 1,
                        backgroundColor: "rgba(255, 100, 100, 0.7)",
                        opacity: heartbeatOpacity,
                      }}
                    />
                  )}
                </>
              ) : (
                <ChefHat
                  size={isOnFeed ? 24 : 28}
                  color="#FFF"
                  strokeWidth={1.75}
                />
              )}
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  feedMode: {
    opacity: 0.75,
  },
  glowRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: Glass.borderLight,
  },
  bubbleOuter: {
    overflow: "hidden",
    shadowColor: Glass.shadow.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    elevation: 8,
  },
  bubbleInner: {
    backgroundColor: Glass.surfaceAccent,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
