import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  House,
  Martini,
  ShoppingCart,
  UtensilsCrossed,
  CalendarDays,
  Wine,
  Tag,
  Dna,
  ChefHat,
  Users,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useCompanionStore, type CommunicationMode } from "../../lib/companion/companionStore";
import { useSettingsStore } from "../../lib/stores/settingsStore";

const { width: SW, height: SH } = Dimensions.get("window");

interface NudgeItem {
  label: string;
  icon: React.ComponentType<any>;
  key: string;
  variant: "bubble" | "pill";
  voicePrompt?: string;
  pastel: string;
}

const NUDGE_POOL: NudgeItem[] = [
  { label: "Open kitchen?", icon: House, key: "kitchen", variant: "pill", voicePrompt: "say: open kitchen", pastel: "#E8F5E9" },
  { label: "Check your bar?", icon: Martini, key: "bar", variant: "pill", voicePrompt: "say: open bar", pastel: "#FCE4EC" },
  { label: "Shopping time?", icon: ShoppingCart, key: "shopping_list", variant: "pill", voicePrompt: "say: go shopping", pastel: "#E3F2FD" },
  { label: "Try a recipe?", icon: UtensilsCrossed, key: "my_recipes", variant: "pill", voicePrompt: "say: show recipes", pastel: "#FFF3E0" },
  { label: "Plan your week?", icon: CalendarDays, key: "meal_plan", variant: "pill", voicePrompt: "say: open plan", pastel: "#F3E5F5" },
  { label: "Explore wines?", icon: Wine, key: "cellar", variant: "bubble", voicePrompt: "say: open cellar", pastel: "#E8EAF6" },
  { label: "Find deals?", icon: Tag, key: "vendors", variant: "bubble", voicePrompt: "say: show vendors", pastel: "#EFEBE9" },
  { label: "Your DNA?", icon: Dna, key: "nosh_dna", variant: "bubble", voicePrompt: "say: my DNA", pastel: "#E0F2F1" },
  { label: "Cook something?", icon: ChefHat, key: "nosh_run", variant: "bubble", voicePrompt: "say: start run", pastel: "#FFF8E1" },
  { label: "Social nosh?", icon: Users, key: "social_cooking", variant: "bubble", voicePrompt: "say: social", pastel: "#FCE4EC" },
];

const VISIBLE_COUNT = 4;
const SAFE_TOP = 120;
const SAFE_BOTTOM = 100;
const SAFE_LEFT = 24;
const SAFE_RIGHT = 80;
const ROTATE_INTERVAL = 8000;

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Per-mode clickability rules ──
function isClickable(mode: CommunicationMode, variant: "bubble" | "pill"): boolean {
  switch (mode) {
    case "camera": return false; // cam: nothing clickable
    case "text": return variant === "pill"; // text: only pills clickable
    default: return true; // voice/more/idle: all clickable
  }
}

function getPillText(nudge: NudgeItem, mode: CommunicationMode): string {
  if (mode === "mic") return nudge.voicePrompt ?? nudge.label;
  return nudge.label;
}

interface FloatingNudgesProps {
  onAction: (key: string) => void;
  isSmartNav?: boolean;
}

export function FloatingNudges({ onAction, isSmartNav = false }: FloatingNudgesProps) {
  const communicationMode = useCompanionStore((s) => s.communicationMode);
  const activeScreen = useCompanionStore((s) => s.activeScreen);
  const homeNudges = useSettingsStore((s) => s.homeNudges);

  // Default mode: only show in mic mode on canvas
  // Smart mode: always show on canvas (helium bubbles are ambient)
  const visible = isSmartNav
    ? activeScreen === "canvas" && homeNudges
    : communicationMode === "mic" && activeScreen === "canvas" && homeNudges;

  if (!visible) return null;

  return isSmartNav ? (
    <HeliumNudges onAction={onAction} communicationMode={communicationMode} />
  ) : (
    <DriftNudges onAction={onAction} />
  );
}

// ══════════════════════════════════════════════════════════════
// SMART MODE: Helium balloon nudges (float bottom → top)
// ══════════════════════════════════════════════════════════════

function HeliumNudges({
  onAction,
  communicationMode,
}: {
  onAction: (key: string) => void;
  communicationMode: CommunicationMode;
}) {
  const [activeNudges, setActiveNudges] = useState<NudgeItem[]>(() =>
    pickRandom(NUDGE_POOL, VISIBLE_COUNT),
  );
  const [generation, setGeneration] = useState(0);

  // "more" mode = explicitly entered via menu (not idle)
  const isMoreMode = communicationMode !== "idle" && communicationMode !== "mic" && communicationMode !== "camera" && communicationMode !== "text";
  const moreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isMoreMode) {
      // More mode: show all nudges, auto-dismiss after 15s
      setActiveNudges(NUDGE_POOL);
      moreTimeout.current = setTimeout(() => {
        setActiveNudges([]);
      }, 15000);
      return () => { if (moreTimeout.current) clearTimeout(moreTimeout.current); };
    }
    // Idle + voice/cam/text: rotate a subset every 8s
    setActiveNudges(pickRandom(NUDGE_POOL, VISIBLE_COUNT));
    const interval = setInterval(() => {
      setActiveNudges((prev) => {
        const activeKeys = new Set(prev.map((n) => n.key));
        const available = NUDGE_POOL.filter((n) => !activeKeys.has(n.key));
        if (available.length === 0) return prev;
        const replaceIdx = Math.floor(Math.random() * prev.length);
        const replacement = available[Math.floor(Math.random() * available.length)];
        const next = [...prev];
        next[replaceIdx] = replacement;
        return next;
      });
      setGeneration((g) => g + 1);
    }, ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, [isMoreMode]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {activeNudges.map((nudge, i) => (
        <HeliumBalloon
          key={`${nudge.key}-${generation}`}
          nudge={nudge}
          index={i}
          communicationMode={communicationMode}
          onTap={() => {
            if (isClickable(communicationMode, nudge.variant)) {
              lightTap();
              onAction(nudge.key);
            }
          }}
        />
      ))}
    </View>
  );
}

function HeliumBalloon({
  nudge,
  index,
  communicationMode,
  onTap,
}: {
  nudge: NudgeItem;
  index: number;
  communicationMode: CommunicationMode;
  onTap: () => void;
}) {
  const Icon = nudge.icon;
  const isPill = nudge.variant === "pill";
  const clickable = isClickable(communicationMode, nudge.variant);

  // Random horizontal start position
  const startX = useRef(randomInRange(SAFE_LEFT, SW - SAFE_RIGHT - (isPill ? 150 : 44))).current;

  // Animated values for helium float
  const floatY = useRef(new Animated.Value(SH + 50)).current;
  const wobbleX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const floatDuration = useRef(randomInRange(8000, 10000)).current;
  const wobbleRange = useRef(randomInRange(10, 18)).current;

  useEffect(() => {
    const staggerDelay = index * 800;

    // Float upward from below screen to above screen
    const floatAnim = Animated.timing(floatY, {
      toValue: -80,
      duration: floatDuration,
      delay: staggerDelay,
      useNativeDriver: true,
    });

    // Fade in first 500ms, fade out last 500ms
    const fadeIn = Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay: staggerDelay,
      useNativeDriver: true,
    });

    // Horizontal wobble
    const wobble = Animated.loop(
      Animated.sequence([
        Animated.timing(wobbleX, {
          toValue: wobbleRange,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleX, {
          toValue: -wobbleRange,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    floatAnim.start(() => {
      // Fade out at top
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    });
    fadeIn.start();
    setTimeout(() => wobble.start(), staggerDelay);

    return () => {
      floatAnim.stop();
      wobble.stop();
    };
  }, []);

  const pillText = isPill ? getPillText(nudge, communicationMode) : null;

  // Parse pastel for tint: convert hex to rgba with 0.25 alpha
  const pastelBg = nudge.pastel + "40"; // hex alpha ~25%

  return (
    <Animated.View
      style={[
        styles.nudgePositioner,
        {
          left: startX,
          opacity,
          transform: [
            { translateY: floatY },
            { translateX: wobbleX },
          ],
        },
      ]}
    >
      <Pressable
        onPress={clickable ? onTap : undefined}
        style={[
          isPill ? styles.pill : styles.nudgeBubble,
          { backgroundColor: pastelBg },
          !clickable && { opacity: 0.7 },
        ]}
      >
        <Icon size={16} color={Colors.text.secondary} strokeWidth={1.5} />
        {isPill && pillText && (
          <Text style={styles.pillText}>{pillText}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════
// DEFAULT MODE: Original drift nudges (random position + drift)
// ══════════════════════════════════════════════════════════════

function DriftNudges({ onAction }: { onAction: (key: string) => void }) {
  const [activeNudges, setActiveNudges] = useState<NudgeItem[]>(() =>
    pickRandom(NUDGE_POOL, VISIBLE_COUNT),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNudges((prev) => {
        const activeKeys = new Set(prev.map((n) => n.key));
        const available = NUDGE_POOL.filter((n) => !activeKeys.has(n.key));
        if (available.length === 0) return prev;
        const replaceIdx = Math.floor(Math.random() * prev.length);
        const replacement = available[Math.floor(Math.random() * available.length)];
        const next = [...prev];
        next[replaceIdx] = replacement;
        return next;
      });
    }, ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {activeNudges.map((nudge, i) => (
        <DriftNudgeItem
          key={nudge.key}
          nudge={nudge}
          index={i}
          onTap={() => {
            lightTap();
            onAction(nudge.key);
          }}
        />
      ))}
    </View>
  );
}

function DriftNudgeItem({
  nudge,
  index,
  onTap,
}: {
  nudge: NudgeItem;
  index: number;
  onTap: () => void;
}) {
  const Icon = nudge.icon;
  const isPill = nudge.variant === "pill";

  const startX = useRef(randomInRange(SAFE_LEFT, SW - SAFE_RIGHT - (isPill ? 130 : 44))).current;
  const startY = useRef(randomInRange(SAFE_TOP, SH - SAFE_BOTTOM - 44)).current;

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1, speed: 18, bounciness: 8, useNativeDriver: true, delay: index * 150,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay: index * 150, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const driftX = randomInRange(4000, 6000);
    const driftY = randomInRange(3000, 5000);
    const rangeX = randomInRange(12, 20);
    const rangeY = randomInRange(10, 15);

    const loopX = Animated.loop(Animated.sequence([
      Animated.timing(translateX, { toValue: rangeX, duration: driftX, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -rangeX, duration: driftX, useNativeDriver: true }),
    ]));
    const loopY = Animated.loop(Animated.sequence([
      Animated.timing(translateY, { toValue: rangeY, duration: driftY, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -rangeY, duration: driftY, useNativeDriver: true }),
    ]));

    loopX.start();
    loopY.start();
    return () => { loopX.stop(); loopY.stop(); };
  }, []);

  const handleTap = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => onTap());
  }, [onTap, opacity]);

  return (
    <Animated.View
      style={[
        styles.nudgePositioner,
        {
          left: startX,
          top: startY,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <Pressable onPress={handleTap} style={isPill ? styles.pill : styles.nudgeBubble}>
        <Icon size={16} color={Colors.text.secondary} strokeWidth={1.5} />
        {isPill && <Text style={styles.pillText}>{nudge.label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const BUBBLE_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  nudgePositioner: {
    position: "absolute",
  },
  nudgeBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    elevation: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    elevation: 2,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
});
