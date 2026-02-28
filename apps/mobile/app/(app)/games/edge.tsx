import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, Pressable, PanResponder, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, {
  Rect, Line, Path, Defs, LinearGradient, RadialGradient, Stop, Ellipse, Circle,
} from "react-native-svg";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useGameHaptics } from "../../../hooks/useGameHaptics";
import { useGameProfile } from "../../../hooks/useGameProfile";
import { useGameStore } from "../../../lib/games/gameStore";
import { getEdgeGrade } from "../../../lib/games/levels";
import BunkaKnifeSvg from "../../../components/game/BunkaKnifeSvg";
import { useGameOrientation } from "../../../hooks/useGameOrientation";
import { useGameSounds } from "../../../hooks/useGameSounds";
import { RotateCcw, HelpCircle, X, ArrowLeft, Briefcase } from "lucide-react-native";
const GAME_DURATION = 30;
const PERFECT_ANGLE = 15;
const TOLERANCE = 2;
const MIN_ANGLE = 0;
const MAX_ANGLE = 45;

// Pre-allocate spark pool
const SPARK_COUNT = 12;
const WATER_COUNT = 6;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  active: boolean;
}

function createParticlePool(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    active: false,
  }));
}

export default function EdgeGame() {
  const router = useRouter();
  const { colors } = useTheme();
  const haptics = useGameHaptics();
  const { addXP, saveScore } = useGameProfile();
  const { phase, setPhase, resetGame } = useGameStore();
  const { width: SCREEN_W, height: SCREEN_H } = useGameOrientation();
  const sounds = useGameSounds();

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [sharpness, setSharpness] = useState(0);
  const [angle, setAngle] = useState(22.5);
  const [timeInZone, setTimeInZone] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const angleAnim = useRef(new Animated.Value(-22.5)).current;
  const lastHapticRef = useRef(0);
  const angleRef = useRef(22.5);

  // Particle pools
  const sparksRef = useRef(createParticlePool(SPARK_COUNT));
  const waterRef = useRef(createParticlePool(WATER_COUNT));
  const sparkIndexRef = useRef(0);
  const waterIndexRef = useRef(0);
  const sparkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isInZone = Math.abs(angle - PERFECT_ANGLE) <= TOLERANCE;

  // Spawn a spark particle
  const spawnSpark = useCallback(() => {
    const pool = sparksRef.current;
    const idx = sparkIndexRef.current % SPARK_COUNT;
    sparkIndexRef.current++;
    const p = pool[idx];
    p.x.setValue(0);
    p.y.setValue(0);
    p.opacity.setValue(0.8 + Math.random() * 0.2);
    p.active = true;

    const dx = (Math.random() - 0.5) * 80;
    const dy = -(20 + Math.random() * 40);
    const duration = 300 + Math.random() * 200;

    Animated.parallel([
      Animated.timing(p.x, { toValue: dx, duration, useNativeDriver: true }),
      Animated.timing(p.y, { toValue: dy, duration, useNativeDriver: true }),
      Animated.timing(p.opacity, { toValue: 0, duration, useNativeDriver: true }),
    ]).start(() => { p.active = false; });
  }, []);

  // Spawn a water splash particle
  const spawnWater = useCallback(() => {
    const pool = waterRef.current;
    const idx = waterIndexRef.current % WATER_COUNT;
    waterIndexRef.current++;
    const p = pool[idx];
    p.x.setValue((Math.random() - 0.5) * 60);
    p.y.setValue(0);
    p.opacity.setValue(0.4 + Math.random() * 0.4);
    p.active = true;

    const dy = -(10 + Math.random() * 25);
    Animated.parallel([
      Animated.timing(p.y, { toValue: dy, duration: 400, useNativeDriver: true }),
      Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => { p.active = false; });
  }, []);

  // Spark timer — runs while in zone
  useEffect(() => {
    if (phase === "playing" && isInZone) {
      sounds.grind();
      sparkTimerRef.current = setInterval(() => {
        spawnSpark();
        if (Math.random() > 0.5) spawnSpark();
        if (Math.random() > 0.6) spawnWater();
        if (Math.random() > 0.7) sounds.spark();
      }, 120);
    } else {
      if (sparkTimerRef.current) clearInterval(sparkTimerRef.current);
    }
    return () => { if (sparkTimerRef.current) clearInterval(sparkTimerRef.current); };
  }, [phase, isInZone, spawnSpark, spawnWater, sounds]);

  const endGame = useCallback(() => {
    setGameEnded(true);
    setPhase("ended");
    sounds.gameOver();
    if (clockRef.current) clearInterval(clockRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    if (sparkTimerRef.current) clearInterval(sparkTimerRef.current);
  }, [setPhase, sounds]);

  const startGame = useCallback(() => {
    resetGame();
    setTimeLeft(GAME_DURATION);
    setSharpness(0);
    setAngle(22.5);
    setTimeInZone(0);
    setTotalTime(0);
    setGameEnded(false);
    setShowHelp(false);
    angleAnim.setValue(-22.5);
    angleRef.current = 22.5;
    // Reset particles
    sparksRef.current.forEach((p) => { p.opacity.setValue(0); p.active = false; });
    waterRef.current.forEach((p) => { p.opacity.setValue(0); p.active = false; });
    setPhase("playing");
  }, [resetGame, setPhase, angleAnim]);

  // Clock
  useEffect(() => {
    if (phase !== "playing") return;
    clockRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (clockRef.current) clearInterval(clockRef.current); };
  }, [phase, endGame]);

  // Game tick — sharpness + zone tracking
  useEffect(() => {
    if (phase !== "playing") return;
    tickRef.current = setInterval(() => {
      setTotalTime((t) => t + 0.1);
      const inZone = Math.abs(angleRef.current - PERFECT_ANGLE) <= TOLERANCE;
      if (inZone) {
        setTimeInZone((t) => t + 0.1);
        setSharpness((s) => Math.min(100, s + 4 * 0.1));
        const now = Date.now();
        if (now - lastHapticRef.current > 300) {
          haptics.purr();
          lastHapticRef.current = now;
        }
      } else {
        setSharpness((s) => Math.max(0, s - 2 * 0.1));
      }
    }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, haptics]);

  // PanResponder for drag
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gestureState) => {
        const normalized = Math.max(0, Math.min(1, (gestureState.moveY - 200) / 400));
        const newAngle = MIN_ANGLE + normalized * (MAX_ANGLE - MIN_ANGLE);
        angleRef.current = newAngle;
        setAngle(newAngle);
        Animated.spring(angleAnim, {
          toValue: -newAngle,
          damping: 20,
          stiffness: 200,
          mass: 1,
          useNativeDriver: true,
        }).start();
      },
    }),
  [angleAnim]);

  // Knife rotation style
  const knifeRotation = angleAnim.interpolate({
    inputRange: [-MAX_ANGLE, 0],
    outputRange: [`${MAX_ANGLE}deg`, `0deg`],
  });

  // "Back to Work" handler — navigate to leaderboard, auto-redirect to dash
  const handleBackToWork = useCallback(() => {
    setPhase("idle");
    router.replace("/(app)/games/leaderboard" as any);
    setTimeout(() => {
      router.replace("/(app)/(tabs)" as any);
    }, 10000);
  }, [setPhase, router]);

  // Results
  const precision = totalTime > 0 ? (timeInZone / totalTime) * 100 : 0;
  const grade = getEdgeGrade(precision);

  // Save on end
  useEffect(() => {
    if (!gameEnded || totalTime === 0) return;
    saveScore("edge", Math.round(precision * 10), grade.grade, { precision, sharpness, timeInZone });
    addXP(grade.xp);
  }, [gameEnded]);

  const stoneW = SCREEN_W - 60;
  const zoneColor = isInZone ? "#059669" : "#ef4444";

  // Spark colors
  const SPARK_COLORS = ["#fbbf24", "#f97316", "#fde68a", "#fbbf24", "#f97316", "#fde68a", "#fbbf24", "#f97316", "#fde68a", "#fbbf24", "#f97316", "#fde68a"];

  // Help Guide overlay
  if (showHelp) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>How to Play</Text>
          <Pressable onPress={() => setShowHelp(false)} hitSlop={12}>
            <X size={24} color="#9ca3af" strokeWidth={2} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ backgroundColor: "#059669" + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#059669" + "40" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#059669", marginBottom: 6 }}>The Goal</Text>
            <Text style={{ fontSize: 14, color: "#d1d5db", lineHeight: 20 }}>
              Sharpen a Japanese Bunka knife by holding the blade at exactly 15° against the waterstone. You have 30 seconds of pure focus.
            </Text>
          </View>

          {[
            { step: "1", title: "Drag Up & Down", desc: "Slide your finger vertically on the screen to tilt the knife blade. Moving up decreases the angle, moving down increases it." },
            { step: "2", title: "Find the Sweet Spot", desc: "The perfect sharpening angle is 15° ± 2°. When you're in the zone, the knife edge glows green, sparks fly, and you'll feel a gentle haptic pulse." },
            { step: "3", title: "Hold Steady", desc: "The sharpness meter fills while you're in the zone and drains when you're out. Keep the angle steady to maximise sharpness." },
            { step: "4", title: "Watch the Sparks", desc: "Golden sparks and water droplets appear when you're at the perfect angle — that means the blade is biting the stone correctly." },
          ].map((item) => (
            <View key={item.step} style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#059669", alignItems: "center", justifyContent: "center" }}>
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
              { grade: "Razor Edge", range: "90%+ in zone", xp: "40 XP", color: "#22c55e" },
              { grade: "Sharp", range: "70-89% in zone", xp: "30 XP", color: "#3b82f6" },
              { grade: "Dull", range: "50-69% in zone", xp: "20 XP", color: "#f97316" },
              { grade: "Butter Knife", range: "Below 50%", xp: "10 XP", color: "#ef4444" },
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }} edges={["top"]}>
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 12 }} hitSlop={12}>
          <ArrowLeft size={20} color="#9ca3af" strokeWidth={2} />
          <Text style={{ fontSize: 14, color: "#9ca3af" }}>Back</Text>
        </Pressable>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <BunkaKnifeSvg width={200} height={50} edgeColor="#059669" />
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginTop: 16 }}>The 15° Edge</Text>
          <Text style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            ASMR knife sharpening.{"\n"}
            Hold the Bunka at 15° for 30 seconds.
          </Text>
          <Pressable
            onPress={() => { haptics.impact(); startGame(); }}
            style={({ pressed }) => ({
              marginTop: 32, backgroundColor: pressed ? "#047857" : "#059669",
              borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48,
            })}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>BEGIN SHARPENING</Text>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2 }}>
            Sharpening Report
          </Text>
          <Text style={{ fontSize: 48, fontWeight: "900", color: grade.color, marginTop: 8 }}>{grade.grade}</Text>
          <Text style={{ fontSize: 16, color: grade.color, fontWeight: "600" }}>{grade.label}</Text>

          <View style={{ flexDirection: "row", gap: 24, marginTop: 24 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>{Math.round(precision)}%</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Precision</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>{Math.round(sharpness)}%</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Sharpness</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#22c55e" }}>+{grade.xp}</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>XP</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 32 }}>
            <Pressable
              onPress={() => { haptics.impact(); startGame(); }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: pressed ? "#047857" : "#059669",
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#2a1f15" }} edges={["top"]}>
      {/* Dark wood background */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width={SCREEN_W} height={SCREEN_H} viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}>
          <Defs>
            <LinearGradient id="woodBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2a1f15" />
              <Stop offset="50%" stopColor="#241a10" />
              <Stop offset="100%" stopColor="#1a130d" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_W} height={SCREEN_H} fill="url(#woodBg)" />
          {/* Wood grain lines */}
          {Array.from({ length: 14 }).map((_, i) => (
            <Line
              key={`grain-${i}`}
              x1="0"
              y1={60 + i * (SCREEN_H / 14)}
              x2={SCREEN_W}
              y2={65 + i * (SCREEN_H / 14) + (i % 3) * 4}
              stroke="#3d2e1e"
              strokeWidth={0.8 + (i % 3) * 0.3}
              opacity={0.06 + (i % 4) * 0.02}
            />
          ))}
          {/* Vignette — darker edges */}
          <Rect x="0" y="0" width={SCREEN_W} height={80} fill="#1a130d" opacity={0.4} />
          <Rect x="0" y={SCREEN_H - 80} width={SCREEN_W} height={80} fill="#1a130d" opacity={0.5} />
        </Svg>
      </View>

      {/* HUD with close button */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, zIndex: 10 }}>
        <Pressable onPress={() => { endGame(); setPhase("idle"); router.back(); }} hitSlop={12}>
          <X size={22} color="#6b7280" strokeWidth={2} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>Angle</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: zoneColor }}>{Math.round(angle)}°</Text>
        </View>
        <Text style={{ fontSize: 32, fontWeight: "900", color: timeLeft <= 10 ? "#ef4444" : "#fff" }}>{timeLeft}s</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>Sharpness</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>{Math.round(sharpness)}%</Text>
        </View>
      </View>

      {/* Sharpness bar */}
      <View style={{ height: 4, backgroundColor: "#374151", marginHorizontal: 20, borderRadius: 2, zIndex: 10 }}>
        <View style={{ height: 4, backgroundColor: "#059669", borderRadius: 2, width: `${sharpness}%` as any }} />
      </View>

      {/* Zone indicator */}
      <View style={{ alignItems: "center", marginTop: 8, zIndex: 10 }}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: zoneColor + "20" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: zoneColor }}>
            {isInZone ? "PERFECT ANGLE" : `${Math.round(angle)}° — Target 15°`}
          </Text>
        </View>
      </View>

      {/* Whetstone + Knife area */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} {...panResponder.panHandlers}>

        {/* Knife + Stone stack — knife on top, blade facing down onto stone */}
        <View style={{ alignItems: "center" }}>
          {/* Bunka Knife — positioned above stone, blade edge faces down */}
          <Animated.View style={[
            { alignItems: "center", marginBottom: -8, zIndex: 2 },
            { transform: [{ rotate: knifeRotation }] },
          ]}>
            <View style={{ transform: [{ scaleY: -1 }] }}>
              <BunkaKnifeSvg
                width={280}
                height={70}
                edgeColor={zoneColor}
                showEdgeGlow={isInZone}
              />
            </View>
          </Animated.View>

          {/* Spark particles — at knife-stone contact point */}
          <View style={{ position: "absolute", top: 55, left: 140, width: 0, height: 0, zIndex: 3 }}>
            {sparksRef.current.map((p, i) => (
              <Animated.View
                key={`spark-${i}`}
                style={{
                  position: "absolute",
                  width: 2 + (i % 3),
                  height: 2 + (i % 3),
                  borderRadius: 2,
                  backgroundColor: SPARK_COLORS[i],
                  transform: [{ translateX: p.x }, { translateY: p.y }],
                  opacity: p.opacity,
                }}
              />
            ))}
          </View>

          {/* Water splash particles */}
          <View style={{ position: "absolute", top: 65, left: 140, width: 0, height: 0, zIndex: 3 }}>
            {waterRef.current.map((p, i) => (
              <Animated.View
                key={`water-${i}`}
                style={{
                  position: "absolute",
                  width: 3,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#87ceeb",
                  transform: [{ translateX: p.x }, { translateY: p.y }],
                  opacity: p.opacity,
                }}
              />
            ))}
          </View>

          {/* Japanese Waterstone — below the knife */}
          <Svg width={stoneW} height={90} style={{ zIndex: 1 }}>
            <Defs>
              {/* Stone surface gradient — cream/beige high-grit */}
              <LinearGradient id="stoneBody" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#f5f0e8" />
                <Stop offset="30%" stopColor="#ede5d8" />
                <Stop offset="70%" stopColor="#e0d5c2" />
                <Stop offset="100%" stopColor="#d4c9b5" />
              </LinearGradient>
              {/* Wood holder */}
              <LinearGradient id="stoneHolder" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#5c3817" />
                <Stop offset="100%" stopColor="#3d2510" />
              </LinearGradient>
              {/* Shadow gradient */}
              <RadialGradient id="stoneShadow" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
                <Stop offset="0%" stopColor="#000" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#000" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Shadow underneath */}
            <Ellipse cx={stoneW / 2} cy={82} rx={stoneW / 2 - 10} ry={8} fill="url(#stoneShadow)" />

            {/* Wood stone holder / base */}
            <Rect x={10} y={62} width={stoneW - 20} height={18} rx={3} fill="url(#stoneHolder)" />
            {/* Holder edge highlight */}
            <Line x1={12} y1={63} x2={stoneW - 12} y2={63} stroke="#7a4a22" strokeWidth={0.5} opacity={0.5} />

            {/* Stone body */}
            <Rect x={16} y={14} width={stoneW - 32} height={50} rx={4} fill="url(#stoneBody)" />

            {/* Surface speckle texture */}
            {Array.from({ length: 40 }).map((_, i) => (
              <Circle
                key={`speck-${i}`}
                cx={24 + Math.random() * (stoneW - 56)}
                cy={18 + Math.random() * 42}
                r={0.5 + Math.random() * 1}
                fill="#c4b59a"
                opacity={0.15 + Math.random() * 0.15}
              />
            ))}

            {/* Wet sheen highlights */}
            <Rect x={30} y={20} width={stoneW - 70} height={3} rx={1.5} fill="#fff" opacity={0.08} />
            <Rect x={50} y={30} width={stoneW - 110} height={2} rx={1} fill="#fff" opacity={0.05} />
            <Rect x={40} y={48} width={stoneW - 90} height={2} rx={1} fill="#fff" opacity={0.06} />

            {/* Water droplets around stone edges */}
            {Array.from({ length: 8 }).map((_, i) => {
              const cx = 20 + Math.random() * (stoneW - 44);
              const cy = i < 4 ? (10 + Math.random() * 6) : (58 + Math.random() * 6);
              return (
                <Ellipse
                  key={`drop-${i}`}
                  cx={cx}
                  cy={cy}
                  rx={1.5 + Math.random() * 2}
                  ry={1 + Math.random() * 1.5}
                  fill="#87ceeb"
                  opacity={0.2 + Math.random() * 0.15}
                />
              );
            })}

            {/* Stone edge border */}
            <Rect x={16} y={14} width={stoneW - 32} height={50} rx={4} fill="none" stroke="#c4b59a" strokeWidth={0.5} opacity={0.4} />
          </Svg>
        </View>

        {/* Angle guide */}
        <View style={{ marginTop: 30, alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6b7280" }}>
            Target: {PERFECT_ANGLE}° ± {TOLERANCE}°
          </Text>
          <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
            Drag up/down to adjust angle
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
