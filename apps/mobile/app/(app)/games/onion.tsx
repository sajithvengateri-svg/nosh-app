import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, Animated as RNAnimated, PanResponder, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, {
  Path, Rect, Defs, LinearGradient, Stop, Ellipse, Line,
} from "react-native-svg";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useGameHaptics } from "../../../hooks/useGameHaptics";
import { useGameProfile } from "../../../hooks/useGameProfile";
import { useGameStore } from "../../../lib/games/gameStore";
import { getOnionGrade } from "../../../lib/games/levels";
import { useGameOrientation } from "../../../hooks/useGameOrientation";
import { useGameSounds } from "../../../hooks/useGameSounds";
import { RotateCcw, HelpCircle, X, ArrowLeft, Briefcase } from "lucide-react-native";
const GAME_DURATION = 45;
const ONION_SIZE = 64;

type OnionColor = "pink" | "white" | "red";
interface FlyingOnion {
  id: number;
  x: number;
  color: OnionColor;
  yAnim: RNAnimated.Value;
  opacity: RNAnimated.Value;
  rotation: RNAnimated.Value;
  alive: boolean;
  sliced: boolean;
}

interface SliceEffect {
  id: number;
  x: number;
  y: number;
  slashOpacity: RNAnimated.Value;
  points: number;
  pointsOpacity: RNAnimated.Value;
  pointsY: RNAnimated.Value;
  halfLeftX: RNAnimated.Value;
  halfLeftY: RNAnimated.Value;
  halfRightX: RNAnimated.Value;
  halfRightY: RNAnimated.Value;
  halvesOpacity: RNAnimated.Value;
  halvesRotation: RNAnimated.Value;
  color: string;
}

const ONION_COLORS: Record<OnionColor, { body: string; layer: string; highlight: string; points: number }> = {
  pink: { body: "#ec4899", layer: "#f9a8d4", highlight: "#fce7f3", points: 15 },
  white: { body: "#d1d5db", layer: "#f3f4f6", highlight: "#ffffff", points: -5 },
  red: { body: "#dc2626", layer: "#fca5a5", highlight: "#fecaca", points: 0 },
};

export default function OnionBlitzGame() {
  const router = useRouter();
  const { colors } = useTheme();
  const haptics = useGameHaptics();
  const { addXP, saveScore } = useGameProfile();
  const { phase, setPhase, resetGame } = useGameStore();
  const { width: SCREEN_W, height: SCREEN_H } = useGameOrientation();

  const sounds = useGameSounds();

  const GAME_H = SCREEN_H - 220;

  const [score, setScore] = useState(0);
  const [sliced, setSliced] = useState(0);
  const [missed, setMissed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [onions, setOnions] = useState<FlyingOnion[]>([]);
  const [effects, setEffects] = useState<SliceEffect[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [redSliced, setRedSliced] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const nextId = useRef(0);
  const effectId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);

  // Animation refs for game-over stats (must be before early returns)
  const onionGradeFlash = useRef(new RNAnimated.Value(0)).current;
  const onionStat1 = useRef(new RNAnimated.Value(0)).current;
  const onionStat2 = useRef(new RNAnimated.Value(0)).current;
  const onionStat3 = useRef(new RNAnimated.Value(0)).current;
  const onionStat4 = useRef(new RNAnimated.Value(0)).current;

  const endGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setGameEnded(true);
    setPhase("ended");
    sounds.gameOver();
    if (spawnTimer.current) { clearInterval(spawnTimer.current); spawnTimer.current = null; }
    if (clockTimer.current) { clearInterval(clockTimer.current); clockTimer.current = null; }
  }, [setPhase, sounds]);

  const startGame = useCallback(() => {
    endedRef.current = false;
    resetGame();
    setScore(0);
    setSliced(0);
    setMissed(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(GAME_DURATION);
    setOnions([]);
    setEffects([]);
    setGameEnded(false);
    setRedSliced(false);
    setShowHelp(false);
    nextId.current = 0;
    effectId.current = 0;
    setPhase("playing");
  }, [resetGame, setPhase]);

  // Clock
  useEffect(() => {
    if (phase !== "playing") return;
    clockTimer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (clockTimer.current) clearInterval(clockTimer.current); };
  }, [phase, endGame]);

  // Spawn onions — arc up from bottom, then fall
  useEffect(() => {
    if (phase !== "playing") return;

    const spawn = () => {
      const id = nextId.current++;
      const x = 30 + Math.random() * (SCREEN_W - 90);
      const colorTypes: OnionColor[] = ["pink", "pink", "pink", "pink", "pink", "pink", "white", "white", "white", "white", "white", "red"];
      const color = colorTypes[Math.floor(Math.random() * colorTypes.length)];
      const yAnim = new RNAnimated.Value(GAME_H + 50);
      const opacity = new RNAnimated.Value(1);
      const rotation = new RNAnimated.Value(0);

      const onion: FlyingOnion = { id, x, color, yAnim, opacity, rotation, alive: true, sliced: false };
      setOnions((prev) => [...prev, onion]);

      const peakY = 60 + Math.random() * (GAME_H * 0.4);
      const elapsed = GAME_DURATION - timeLeft;
      const speed = Math.max(1200, 2200 - elapsed * 20);

      RNAnimated.loop(
        RNAnimated.timing(rotation, { toValue: 1, duration: 800, useNativeDriver: true })
      ).start();

      RNAnimated.timing(yAnim, {
        toValue: peakY,
        duration: speed * 0.45,
        useNativeDriver: true,
      }).start(() => {
        RNAnimated.timing(yAnim, {
          toValue: GAME_H + 80,
          duration: speed * 0.55,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && onion.alive && !onion.sliced) {
            onion.alive = false;
            setMissed((m) => m + 1);
            setCombo(0);
            RNAnimated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          }
        });
      });
    };

    const elapsed = GAME_DURATION - timeLeft;
    const interval = Math.max(350, 1200 - elapsed * 15);
    spawnTimer.current = setInterval(spawn, interval);
    spawn();

    return () => { if (spawnTimer.current) clearInterval(spawnTimer.current); };
  }, [phase, timeLeft, endGame]);

  // Spawn slice effect — slash line, split halves, score popup
  const spawnSliceEffect = useCallback((x: number, y: number, points: number, color: string) => {
    const id = effectId.current++;
    const slashOpacity = new RNAnimated.Value(0.8);
    const pointsOpacity = new RNAnimated.Value(1);
    const pointsY = new RNAnimated.Value(0);
    const halfLeftX = new RNAnimated.Value(0);
    const halfLeftY = new RNAnimated.Value(0);
    const halfRightX = new RNAnimated.Value(0);
    const halfRightY = new RNAnimated.Value(0);
    const halvesOpacity = new RNAnimated.Value(0.8);
    const halvesRotation = new RNAnimated.Value(0);

    const effect: SliceEffect = {
      id, x, y, slashOpacity, points,
      pointsOpacity, pointsY, halfLeftX, halfLeftY, halfRightX, halfRightY,
      halvesOpacity, halvesRotation, color,
    };

    setEffects((prev) => [...prev.slice(-6), effect]);

    // Slash line fade
    RNAnimated.timing(slashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();

    // Score popup float up
    RNAnimated.parallel([
      RNAnimated.timing(pointsY, { toValue: -50, duration: 500, useNativeDriver: true }),
      RNAnimated.sequence([
        RNAnimated.delay(300),
        RNAnimated.timing(pointsOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();

    // Split halves fly apart
    RNAnimated.parallel([
      RNAnimated.timing(halfLeftX, { toValue: -30, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(halfLeftY, { toValue: 20, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(halfRightX, { toValue: 30, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(halfRightY, { toValue: -15, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(halvesRotation, { toValue: 1, duration: 300, useNativeDriver: true }),
      RNAnimated.sequence([
        RNAnimated.delay(150),
        RNAnimated.timing(halvesOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setEffects((prev) => prev.filter((e) => e.id !== id));
    });
  }, []);

  // Slice an onion (called from swipe detection)
  const handleSlice = useCallback((onion: FlyingOnion) => {
    if (!onion.alive || onion.sliced || gameEnded) return;
    onion.alive = false;
    onion.sliced = true;

    const cfg = ONION_COLORS[onion.color];

    // RED ONION = game over (bomb mechanic)
    if (onion.color === "red") {
      haptics.error();
      sounds.cry();
      setRedSliced(true);
      RNAnimated.timing(onion.opacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
      setTimeout(() => endGame(), 500);
      return;
    }

    // WHITE ONION = penalty (combo break + point loss)
    if (onion.color === "white") {
      haptics.error();
      sounds.hiss();
      setCombo(0);
      setScore((s) => Math.max(0, s + cfg.points));
      setSliced((s) => s + 1);
      spawnSliceEffect(onion.x + ONION_SIZE / 2, GAME_H / 2, cfg.points, cfg.body);
      RNAnimated.timing(onion.opacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
      return;
    }

    // PINK ONION = normal scoring
    haptics.tap();
    sounds.slice();
    const comboBonus = combo >= 5 ? 2 : combo >= 3 ? 1.5 : 1;
    const points = Math.round(cfg.points * comboBonus);

    if (comboBonus > 1) sounds.combo();
    else sounds.scorePop();

    setScore((s) => s + points);
    setSliced((s) => s + 1);
    setCombo((c) => {
      const newCombo = c + 1;
      setBestCombo((b) => Math.max(b, newCombo));
      return newCombo;
    });

    spawnSliceEffect(onion.x + ONION_SIZE / 2, GAME_H / 2, points, cfg.body);
    RNAnimated.timing(onion.opacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
  }, [gameEnded, haptics, sounds, combo, spawnSliceEffect, endGame]);

  // Track onion y positions for swipe hit detection
  const onionYPositions = useRef<Map<number, number>>(new Map());

  // Update tracked y positions from animated values
  useEffect(() => {
    const listeners: { onion: FlyingOnion; id: string }[] = [];
    onions.forEach((o) => {
      if (o.alive && !o.sliced) {
        const id = o.yAnim.addListener(({ value }) => {
          onionYPositions.current.set(o.id, value);
        });
        listeners.push({ onion: o, id });
      }
    });
    return () => {
      listeners.forEach(({ onion, id }) => {
        onion.yAnim.removeListener(id);
      });
    };
  }, [onions]);

  // Swipe-based PanResponder for the game area
  const onionsRef = useRef(onions);
  onionsRef.current = onions;
  const handleSliceRef = useRef(handleSlice);
  handleSliceRef.current = handleSlice;

  const swipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        const { moveX, moveY, dx, dy } = gestureState;
        // Only detect actual swipes (minimum movement)
        const swipeLen = Math.sqrt(dx * dx + dy * dy);
        if (swipeLen < 15) return;

        // Check if swipe position hits any alive onion
        const hitRadius = ONION_SIZE * 0.7;
        for (const o of onionsRef.current) {
          if (!o.alive || o.sliced) continue;
          const oy = onionYPositions.current.get(o.id) ?? 0;
          const ox = o.x + ONION_SIZE / 2;
          const ocY = oy + ONION_SIZE / 2;
          const dist = Math.sqrt((moveX - ox) ** 2 + (moveY - 140 - ocY) ** 2);
          if (dist < hitRadius) {
            handleSliceRef.current(o);
          }
        }
      },
    })
  ).current;

  // "Back to Work" handler — navigate to leaderboard, auto-redirect to dash
  const handleBackToWork = useCallback(() => {
    setPhase("idle");
    router.replace("/(app)/games/leaderboard" as any);
    setTimeout(() => {
      router.replace("/(app)/(tabs)" as any);
    }, 10000);
  }, [setPhase, router]);

  // Results
  const totalSpawned = sliced + missed;
  const accuracy = totalSpawned > 0 ? (sliced / totalSpawned) * 100 : 0;
  const grade = getOnionGrade(accuracy);

  // Save on end
  useEffect(() => {
    if (!gameEnded || totalSpawned === 0) return;
    saveScore("onion_blitz", score, grade.grade, { accuracy, sliced, missed, bestCombo });
    addXP(grade.xp);
  }, [gameEnded]);

  // Onion SVG component
  const OnionIcon = ({ color, size }: { color: OnionColor; size: number }) => {
    const cfg = ONION_COLORS[color];
    return (
      <Svg width={size} height={size} viewBox="0 0 50 50">
        <Defs>
          <LinearGradient id={`onion_${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={cfg.highlight} />
            <Stop offset="0.4" stopColor={cfg.layer} />
            <Stop offset="1" stopColor={cfg.body} />
          </LinearGradient>
        </Defs>
        <Path d="M 23 46 Q 25 50, 27 46" stroke={cfg.body} strokeWidth={1.5} fill="none" />
        <Ellipse cx={25} cy={30} rx={16} ry={18} fill={`url(#onion_${color})`} />
        <Path d="M 14 28 Q 25 22, 36 28" stroke={cfg.highlight} strokeWidth={0.6} fill="none" opacity={0.5} />
        <Path d="M 16 34 Q 25 28, 34 34" stroke={cfg.highlight} strokeWidth={0.4} fill="none" opacity={0.3} />
        <Path d="M 20 14 Q 22 6, 25 8 Q 28 6, 30 14" stroke="#a16207" strokeWidth={1} fill="#d97706" opacity={0.6} />
        <Ellipse cx={20} cy={25} rx={4} ry={6} fill="#fff" opacity={0.15} />
      </Svg>
    );
  };

  // Half-onion SVG for split effect
  const HalfOnion = ({ color, side }: { color: string; side: "left" | "right" }) => (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Defs>
        <LinearGradient id={`half_${side}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#fce7f3" />
          <Stop offset="100%" stopColor={color} />
        </LinearGradient>
      </Defs>
      <Path
        d={side === "left"
          ? "M14,2 Q2,8 2,16 Q2,24 14,26 L14,2Z"
          : "M14,2 Q26,8 26,16 Q26,24 14,26 L14,2Z"
        }
        fill={`url(#half_${side})`}
      />
      {/* Inner ring pattern */}
      <Ellipse cx={side === "left" ? 10 : 18} cy={14} rx={4} ry={6} fill="none" stroke="#fff" strokeWidth={0.5} opacity={0.3} />
      {/* Flat cut face */}
      <Line x1={14} y1={3} x2={14} y2={25} stroke="#fce7f3" strokeWidth={1} opacity={0.6} />
    </Svg>
  );

  // Game-over stat animations (must be before early returns)
  useEffect(() => {
    if (!gameEnded) {
      onionGradeFlash.setValue(0);
      onionStat1.setValue(0);
      onionStat2.setValue(0);
      onionStat3.setValue(0);
      onionStat4.setValue(0);
      return;
    }
    RNAnimated.stagger(100, [
      RNAnimated.spring(onionGradeFlash, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      RNAnimated.spring(onionStat1, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      RNAnimated.spring(onionStat2, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      RNAnimated.spring(onionStat3, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      RNAnimated.spring(onionStat4, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, [gameEnded]);

  // Help Guide
  if (showHelp) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#2a1f15" }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>How to Play</Text>
          <Pressable onPress={() => setShowHelp(false)} hitSlop={12}>
            <X size={24} color="#9ca3af" strokeWidth={2} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ backgroundColor: "#ec4899" + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#ec4899" + "40" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#ec4899", marginBottom: 6 }}>The Goal</Text>
            <Text style={{ fontSize: 14, color: "#d1d5db", lineHeight: 20 }}>
              Onions fly up from below! Swipe across pink onions to slice them mid-air. Avoid the red ones — they end the game!
            </Text>
          </View>

          {[
            { step: "1", title: "Swipe to Slice", desc: "Onions arc upward from the bottom. Swipe your finger across pink onions to slice them mid-air!" },
            { step: "2", title: "Cut the Pink!", desc: "Pink onions (15 pts) are your target. White onions lose 5 points and break your combo. RED ONIONS END THE GAME!" },
            { step: "3", title: "Avoid the Red!", desc: "Red onions are rare but deadly — like bombs in Fruit Ninja. Slice one and it's game over with tears everywhere!" },
            { step: "4", title: "Build Combos", desc: "Slice consecutive pink onions without hitting white ones. 3x combo = 1.5x points, 5x combo = 2x points!" },
          ].map((item) => (
            <View key={item.step} style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#ec4899", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: "#9ca3af", lineHeight: 18 }}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <View style={{ backgroundColor: "#1f2937", borderRadius: 12, padding: 14, marginTop: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#fbbf24", marginBottom: 6 }}>Scoring</Text>
            {[
              { grade: "Master Slicer", range: "90%+ sliced", xp: "45 XP", color: "#ec4899" },
              { grade: "Sous Slicer", range: "75-89% sliced", xp: "35 XP", color: "#22c55e" },
              { grade: "Prep Cook", range: "55-74% sliced", xp: "25 XP", color: "#3b82f6" },
              { grade: "Butterfingers", range: "Below 55%", xp: "10 XP", color: "#ef4444" },
            ].map((s) => (
              <View key={s.grade} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: s.color, fontWeight: "600" }}>{s.grade}</Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>{s.range}</Text>
                <Text style={{ fontSize: 12, color: "#fbbf24", fontWeight: "600" }}>{s.xp}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Idle
  if (phase === "idle") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#2a1f15" }} edges={["top"]}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 12 }} hitSlop={12}>
          <ArrowLeft size={20} color="#9ca3af" strokeWidth={2} />
          <Text style={{ fontSize: 14, color: "#9ca3af" }}>Back</Text>
        </Pressable>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <OnionIcon color="pink" size={80} />
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginTop: 12 }}>Pink Onion Blitz</Text>
          <Text style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Swipe to slice pink onions mid-air!{"\n"}
            Avoid the red — they end the game. 45 seconds.
          </Text>
          <Pressable
            onPress={() => { haptics.impact(); startGame(); }}
            style={({ pressed }) => ({
              marginTop: 32, backgroundColor: pressed ? "#be185d" : "#ec4899",
              borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48,
            })}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>START CHOPPING</Text>
          </Pressable>
          <Pressable onPress={() => setShowHelp(true)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20 }}>
            <HelpCircle size={16} color="#6b7280" strokeWidth={2} />
            <Text style={{ fontSize: 14, color: "#6b7280" }}>How to Play</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Game Over
  if (gameEnded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#2a1f15" }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          {/* Tears overlay when red onion sliced */}
          {redSliced && (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <Text
                  key={`tear-${i}`}
                  style={{
                    position: "absolute",
                    top: `${10 + (i % 4) * 22}%` as any,
                    left: `${12 + (i * 7) % 76}%` as any,
                    fontSize: 28 + (i % 3) * 8,
                    opacity: 0.5 + (i % 3) * 0.15,
                  }}
                >
                  {"\uD83D\uDE2D"}
                </Text>
              ))}
            </View>
          )}

          <Text style={{ fontSize: 14, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2 }}>
            {redSliced ? "RED ONION!" : "Slice Report"}
          </Text>
          <RNAnimated.Text style={{
            fontSize: 40, fontWeight: "900", color: redSliced ? "#dc2626" : grade.color, marginTop: 8,
            opacity: onionGradeFlash, transform: [{ scale: onionGradeFlash.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}>
            {redSliced ? "GAME OVER" : grade.grade}
          </RNAnimated.Text>
          <Text style={{ fontSize: 16, color: redSliced ? "#fca5a5" : grade.color, fontWeight: "600" }}>
            {redSliced ? "Tears everywhere!" : grade.label}
          </Text>

          <View style={{ flexDirection: "row", gap: 20, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <RNAnimated.View style={{ alignItems: "center", opacity: onionStat1, transform: [{ scale: onionStat1.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>{score}</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Score</Text>
            </RNAnimated.View>
            <RNAnimated.View style={{ alignItems: "center", opacity: onionStat2, transform: [{ scale: onionStat2.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>{Math.round(accuracy)}%</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Accuracy</Text>
            </RNAnimated.View>
            <RNAnimated.View style={{ alignItems: "center", opacity: onionStat3, transform: [{ scale: onionStat3.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#ec4899" }}>{bestCombo}x</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Best Combo</Text>
            </RNAnimated.View>
            <RNAnimated.View style={{ alignItems: "center", opacity: onionStat4, transform: [{ scale: onionStat4.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#22c55e" }}>+{grade.xp}</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>XP</Text>
            </RNAnimated.View>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 32 }}>
            <Pressable
              onPress={() => { haptics.impact(); startGame(); }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: pressed ? "#be185d" : "#ec4899",
                borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24,
              })}
            >
              <RotateCcw size={18} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Play Again</Text>
            </Pressable>
            <Pressable
              onPress={handleBackToWork}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: pressed ? "#374151" : "#1f2937",
                borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24,
              })}
            >
              <Briefcase size={18} color="#9ca3af" strokeWidth={2} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#9ca3af" }}>Back to Work</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ===================== PLAYING =====================
  const rotationInterpolate = (rotation: RNAnimated.Value) =>
    rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2a1f15" }} edges={["top"]}>
      {/* Dark wood countertop + cutting board background */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width={SCREEN_W} height={SCREEN_H} viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}>
          <Defs>
            <LinearGradient id="counterBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2a1f15" />
              <Stop offset="100%" stopColor="#1a130d" />
            </LinearGradient>
            <LinearGradient id="cuttingBoard" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#c4956a" />
              <Stop offset="50%" stopColor="#b8866a" />
              <Stop offset="100%" stopColor="#a87a52" />
            </LinearGradient>
          </Defs>
          {/* Counter surface */}
          <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#counterBg)" />
          {/* Counter grain */}
          {Array.from({ length: 10 }).map((_, i) => (
            <Line
              key={`cgrain-${i}`}
              x1="0"
              y1={i * (SCREEN_H / 10)}
              x2={SCREEN_W}
              y2={i * (SCREEN_H / 10) + (i % 3) * 3}
              stroke="#3d2e1e"
              strokeWidth={0.6}
              opacity={0.08}
            />
          ))}
          {/* Central cutting board */}
          <Rect
            x={30} y={100}
            width={SCREEN_W - 60} height={SCREEN_H - 240}
            rx={8}
            fill="url(#cuttingBoard)"
            opacity={0.3}
          />
          {/* Board edge shadow */}
          <Rect
            x={30} y={100}
            width={SCREEN_W - 60} height={SCREEN_H - 240}
            rx={8}
            fill="none"
            stroke="#5c3817"
            strokeWidth={1.5}
            opacity={0.2}
          />
          {/* Board grain lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <Line
              key={`bgrain-${i}`}
              x1={40}
              y1={130 + i * ((SCREEN_H - 280) / 8)}
              x2={SCREEN_W - 40}
              y2={132 + i * ((SCREEN_H - 280) / 8)}
              stroke="#8B7355"
              strokeWidth={0.5}
              opacity={0.12}
            />
          ))}
        </Svg>
      </View>

      {/* HUD */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, zIndex: 10 }}>
        <Pressable onPress={() => { endGame(); setPhase("idle"); router.back(); }} hitSlop={12}>
          <X size={22} color="#6b7280" strokeWidth={2} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#fff" }}>{score}</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "900", color: timeLeft <= 10 ? "#ef4444" : "#fff" }}>{timeLeft}s</Text>
        <View style={{ alignItems: "center" }}>
          {combo >= 3 && (
            <Text style={{ fontSize: 14, fontWeight: "800", color: combo >= 5 ? "#fbbf24" : "#ec4899" }}>
              {combo}x COMBO
            </Text>
          )}
          <Text style={{ fontSize: 11, color: "#9ca3af" }}>{sliced} sliced</Text>
        </View>
      </View>

      {/* Game area — swipe to slice */}
      <View style={{ flex: 1, position: "relative", overflow: "hidden" }} {...swipeResponder.panHandlers}>
        {/* Onions */}
        {onions.map((o) => (
          <RNAnimated.View
            key={o.id}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: o.x,
              width: ONION_SIZE,
              height: ONION_SIZE,
              transform: [
                { translateY: o.yAnim },
                { rotate: rotationInterpolate(o.rotation) },
              ],
              opacity: o.opacity,
            }}
          >
            <OnionIcon color={o.color} size={ONION_SIZE} />
          </RNAnimated.View>
        ))}

        {/* Slice effects */}
        {effects.map((e) => (
          <View key={e.id} style={{ position: "absolute", left: e.x - 60, top: e.y - 30 }}>
            {/* White slash line trail */}
            <RNAnimated.View
              style={{
                position: "absolute",
                top: 14,
                left: 10,
                width: 80,
                height: 3,
                backgroundColor: "#fff",
                borderRadius: 1.5,
                transform: [{ rotate: "-35deg" }],
                opacity: e.slashOpacity,
              }}
            />

            {/* Score popup */}
            <RNAnimated.View
              style={{
                position: "absolute",
                top: -10,
                left: 40,
                transform: [{ translateY: e.pointsY }],
                opacity: e.pointsOpacity,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "900", color: e.points >= 0 ? "#fbbf24" : "#ef4444", textShadowColor: "#000", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }}>
                {e.points >= 0 ? `+${e.points}` : `${e.points}`}
              </Text>
            </RNAnimated.View>

            {/* Split half — left */}
            <RNAnimated.View
              style={{
                position: "absolute",
                top: 5,
                left: 30,
                transform: [
                  { translateX: e.halfLeftX },
                  { translateY: e.halfLeftY },
                  { rotate: e.halvesRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-15deg"] }) },
                ],
                opacity: e.halvesOpacity,
              }}
            >
              <HalfOnion color={e.color} side="left" />
            </RNAnimated.View>

            {/* Split half — right */}
            <RNAnimated.View
              style={{
                position: "absolute",
                top: 5,
                left: 50,
                transform: [
                  { translateX: e.halfRightX },
                  { translateY: e.halfRightY },
                  { rotate: e.halvesRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "15deg"] }) },
                ],
                opacity: e.halvesOpacity,
              }}
            >
              <HalfOnion color={e.color} side="right" />
            </RNAnimated.View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
