import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, Pressable, PanResponder, Animated, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useGameHaptics } from "../../../hooks/useGameHaptics";
import { useGameProfile } from "../../../hooks/useGameProfile";
import { useGameStore } from "../../../lib/games/gameStore";
import { getCatGrade } from "../../../lib/games/levels";
import { useGameOrientation } from "../../../hooks/useGameOrientation";
import { useGameSounds } from "../../../hooks/useGameSounds";
import { RotateCcw, Home, HelpCircle, X, ArrowLeft, Briefcase } from "lucide-react-native";

const GAME_DURATION = 40;

type CatMood = "nervous" | "calm" | "purring" | "sleeping";

const MOOD_CONFIG: Record<CatMood, { color: string; label: string }> = {
  nervous: { color: "#ef4444", label: "Nervous" },
  calm: { color: "#f59e0b", label: "Calm" },
  purring: { color: "#22c55e", label: "Purring" },
  sleeping: { color: "#8b5cf6", label: "Sleeping" },
};

/* eslint-disable @typescript-eslint/no-var-requires */
const CAT_IMAGE = require("../../../assets/cat_main.jpg");

export default function AlleyCatGame() {
  const router = useRouter();
  const { colors } = useTheme();
  const haptics = useGameHaptics();
  const sounds = useGameSounds();
  const { addXP, saveScore } = useGameProfile();
  const { phase, setPhase, resetGame } = useGameStore();
  const { width: SCREEN_W } = useGameOrientation();

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [mood, setMood] = useState<CatMood>("nervous");
  const [calmMeter, setCalmMeter] = useState(0);
  const [timeCalm, setTimeCalm] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPetting, setIsPetting] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; anim: Animated.Value }[]>([]);

  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveDistRef = useRef(0);
  const heartIdRef = useRef(0);
  const purrSoundRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);

  // Animations
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const purrShake = useRef(new Animated.Value(0)).current;
  const moodGlow = useRef(new Animated.Value(0)).current;

  const endGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setGameEnded(true);
    setPhase("ended");
    if (clockRef.current) { clearInterval(clockRef.current); clockRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (purrSoundRef.current) { clearInterval(purrSoundRef.current); purrSoundRef.current = null; }
    sounds.gameOver();
  }, [setPhase, sounds]);

  const startGame = useCallback(() => {
    endedRef.current = false;
    resetGame();
    setTimeLeft(GAME_DURATION);
    setMood("nervous");
    setCalmMeter(0);
    setTimeCalm(0);
    setTotalTime(0);
    setIsPetting(false);
    setGameEnded(false);
    setShowHelp(false);
    setHearts([]);
    breatheAnim.setValue(0);
    setPhase("playing");
  }, [resetGame, setPhase, breatheAnim]);

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

  // Game tick — TUNED FOR ZEN: much more forgiving
  useEffect(() => {
    if (phase !== "playing") return;
    tickRef.current = setInterval(() => {
      setTotalTime((t) => t + 0.1);

      const speed = moveDistRef.current;
      moveDistRef.current = 0;

      // ZEN TUNING: very forgiving — this game is meant to de-stress
      const isGoodPet = speed > 0.5 && speed < 80;
      const isTooFast = speed >= 80;

      if (isGoodPet) {
        setCalmMeter((m) => {
          const newM = Math.min(100, m + 2.0); // faster calm gain for zen feel
          setTimeCalm((t) => t + 0.1);
          if (newM >= 65) setMood("sleeping");
          else if (newM >= 35) setMood("purring");
          else if (newM >= 15) setMood("calm");
          return newM;
        });
        haptics.purr();
        if (Math.random() > 0.75) {
          const hId = heartIdRef.current++;
          const heartAnim = new Animated.Value(0);
          const x = SCREEN_W * 0.2 + Math.random() * SCREEN_W * 0.6;
          setHearts((prev) => [...prev.slice(-8), { id: hId, x, anim: heartAnim }]);
          Animated.timing(heartAnim, { toValue: 1, duration: 2500, useNativeDriver: true }).start(() => {
            setHearts((prev) => prev.filter((h) => h.id !== hId));
          });
        }
      } else if (isTooFast) {
        setCalmMeter((m) => {
          const newM = Math.max(0, m - 1); // very gentle penalty
          if (newM < 15) setMood("nervous");
          else if (newM < 35) setMood("calm");
          return newM;
        });
        haptics.error();
        sounds.hiss();
      } else if (!isPetting) {
        setCalmMeter((m) => {
          const newM = Math.max(0, m - 0.1); // barely decays when idle
          if (newM < 15) setMood("nervous");
          else if (newM < 35) setMood("calm");
          return newM;
        });
      }
    }, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase, isPetting, haptics, sounds, SCREEN_W]);

  // Purr sound loop when purring/sleeping
  useEffect(() => {
    if (phase !== "playing") return;
    if (mood === "purring" || mood === "sleeping") {
      sounds.purr();
      purrSoundRef.current = setInterval(() => sounds.purr(), 1200);
    } else {
      if (purrSoundRef.current) clearInterval(purrSoundRef.current);
    }
    return () => { if (purrSoundRef.current) clearInterval(purrSoundRef.current); };
  }, [phase, mood, sounds]);

  // Breathing animation
  useEffect(() => {
    if (phase !== "playing") return;
    const dur = mood === "sleeping" ? 2800 : mood === "purring" ? 2000 : 1400;
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: dur, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0, duration: dur, useNativeDriver: true }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [phase, mood, breatheAnim]);

  // Purr vibration
  useEffect(() => {
    if (phase !== "playing" || mood !== "purring") return;
    const purr = Animated.loop(
      Animated.sequence([
        Animated.timing(purrShake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(purrShake, { toValue: -1, duration: 60, useNativeDriver: true }),
      ])
    );
    purr.start();
    return () => { purr.stop(); purrShake.setValue(0); };
  }, [phase, mood, purrShake]);

  // Mood glow animation
  useEffect(() => {
    if (phase !== "playing") return;
    Animated.timing(moodGlow, {
      toValue: mood === "sleeping" ? 3 : mood === "purring" ? 2 : mood === "calm" ? 1 : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [phase, mood, moodGlow]);

  // PanResponder for petting
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setIsPetting(true),
      onPanResponderMove: (_evt, gs) => {
        const dist = Math.abs(gs.dx) + Math.abs(gs.dy);
        moveDistRef.current += dist * 0.1;
      },
      onPanResponderRelease: () => setIsPetting(false),
      onPanResponderTerminate: () => setIsPetting(false),
    }),
  []);

  // Results
  const calmPercent = totalTime > 0 ? (timeCalm / totalTime) * 100 : 0;
  const grade = getCatGrade(calmPercent);

  // Save on end
  useEffect(() => {
    if (!gameEnded || totalTime === 0) return;
    saveScore("alley_cat", Math.round(calmPercent * 10), grade.grade, { calmPercent, calmMeter, timeCalm });
    addXP(grade.xp);
  }, [gameEnded]);

  const moodCfg = MOOD_CONFIG[mood];

  // Animated transforms
  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });
  const breatheY = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const purrX = purrShake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-0.5, 0.5],
  });
  const glowOpacity = moodGlow.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, 0.08, 0.15, 0.2],
  });
  const glowColor = moodGlow.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ["#ef4444", "#f59e0b", "#22c55e", "#8b5cf6"],
  });

  // Cat image dimensions
  const catW = SCREEN_W * 0.85;
  const catH = catW * 0.625; // match 640x400 aspect ratio roughly

  // "Back to Work" handler — navigate to leaderboard, auto-redirect to dash
  const handleBackToWork = useCallback(() => {
    setPhase("idle");
    router.replace("/(app)/games/leaderboard" as any);
    setTimeout(() => {
      router.replace("/(app)/(tabs)" as any);
    }, 10000);
  }, [setPhase, router]);

  // Help Guide
  if (showHelp) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0c0f" }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>How to Play</Text>
          <Pressable onPress={() => setShowHelp(false)} hitSlop={12}>
            <X size={24} color="#9ca3af" strokeWidth={2} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ backgroundColor: "#8b5cf6" + "15", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#8b5cf6" + "40" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#8b5cf6", marginBottom: 6 }}>The Goal</Text>
            <Text style={{ fontSize: 14, color: "#d1d5db", lineHeight: 20 }}>
              A stray alley cat has wandered into the kitchen. Calm it down by petting it gently. Too rough and it'll get scared!
            </Text>
          </View>

          {[
            { step: "1", title: "Pet Gently", desc: "Slowly drag your finger across the cat. Gentle, steady strokes raise the calm meter. Think slow, smooth movements." },
            { step: "2", title: "Don't Be Rough", desc: "Fast, jerky movements scare the cat! The calm meter drops. But don't worry — it's very forgiving." },
            { step: "3", title: "Watch the Mood", desc: "The cat goes through moods: Nervous -> Calm -> Purring -> Sleeping. Get it to sleep for maximum points!" },
            { step: "4", title: "Keep Petting", desc: "If you stop petting, the calm meter barely decays. This is a zen game — relax and enjoy." },
          ].map((item) => (
            <View key={item.step} style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#8b5cf6", alignItems: "center", justifyContent: "center" }}>
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
              { grade: "Cat Whisperer", range: "90%+ calm time", xp: "40 XP", color: "#8b5cf6" },
              { grade: "Friendly", range: "70-89% calm time", xp: "30 XP", color: "#22c55e" },
              { grade: "Nervous", range: "50-69% calm time", xp: "20 XP", color: "#f59e0b" },
              { grade: "Scaredy Cat", range: "Below 50%", xp: "10 XP", color: "#ef4444" },
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0c0f" }} edges={["top"]}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 12 }} hitSlop={12}>
          <ArrowLeft size={20} color="#9ca3af" strokeWidth={2} />
          <Text style={{ fontSize: 14, color: "#9ca3af" }}>Back</Text>
        </Pressable>

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ borderRadius: 12, overflow: "hidden" }}>
            <Image source={CAT_IMAGE} style={{ width: SCREEN_W * 0.7, height: SCREEN_W * 0.7 * 0.625 }} resizeMode="cover" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginTop: 16 }}>The Alley Cat</Text>
          <Text style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            A stray tabby hiding in the alley.{"\n"}
            Pat and rub gently to calm it down. Pure zen.
          </Text>
          <Pressable
            onPress={() => { haptics.impact(); startGame(); }}
            style={({ pressed }) => ({
              marginTop: 32, backgroundColor: pressed ? "#6d28d9" : "#8b5cf6",
              borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48,
            })}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff" }}>START PETTING</Text>
          </Pressable>
          <Pressable onPress={() => setShowHelp(true)} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20 }}>
            <HelpCircle size={16} color="#6b7280" strokeWidth={2} />
            <Text style={{ fontSize: 14, color: "#6b7280" }}>How to Play</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Stat flash animations for game over
  const gradeFlash = useRef(new Animated.Value(0)).current;
  const statFlash1 = useRef(new Animated.Value(0)).current;
  const statFlash2 = useRef(new Animated.Value(0)).current;
  const statFlash3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!gameEnded) {
      gradeFlash.setValue(0);
      statFlash1.setValue(0);
      statFlash2.setValue(0);
      statFlash3.setValue(0);
      return;
    }
    Animated.stagger(120, [
      Animated.spring(gradeFlash, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.spring(statFlash1, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.spring(statFlash2, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.spring(statFlash3, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, [gameEnded]);

  // Game Over
  if (gameEnded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0c0f" }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ borderRadius: 12, overflow: "hidden" }}>
            <Image source={CAT_IMAGE} style={{ width: SCREEN_W * 0.5, height: SCREEN_W * 0.5 * 0.625 }} resizeMode="cover" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginTop: 16 }}>
            Cat Report
          </Text>
          <Animated.Text style={{
            fontSize: 40, fontWeight: "900", color: grade.color, marginTop: 8,
            opacity: gradeFlash, transform: [{ scale: gradeFlash.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}>{grade.grade}</Animated.Text>
          <Text style={{ fontSize: 16, color: grade.color, fontWeight: "600" }}>{grade.label}</Text>

          <View style={{ flexDirection: "row", gap: 24, marginTop: 24 }}>
            <Animated.View style={{ alignItems: "center", opacity: statFlash1, transform: [{ scale: statFlash1.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>{Math.round(calmPercent)}%</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Calm Time</Text>
            </Animated.View>
            <Animated.View style={{ alignItems: "center", opacity: statFlash2, transform: [{ scale: statFlash2.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#fff" }}>{Math.round(calmMeter)}%</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Final Calm</Text>
            </Animated.View>
            <Animated.View style={{ alignItems: "center", opacity: statFlash3, transform: [{ scale: statFlash3.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#22c55e" }}>+{grade.xp}</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>XP</Text>
            </Animated.View>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 32 }}>
            <Pressable
              onPress={() => { haptics.impact(); startGame(); }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: pressed ? "#6d28d9" : "#8b5cf6",
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

  // Playing
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0c0f" }} edges={["top"]}>
      {/* Alley background layers */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        {/* Brick wall rows */}
        {Array.from({ length: 28 }).map((_, i) => (
          <View key={`row-${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${i * 3.6}%` as any }}>
            <View style={{ height: 1, backgroundColor: "rgba(120,80,50,0.20)" }} />
          </View>
        ))}
        {/* Damp stain patches */}
        <View style={{
          position: "absolute", bottom: "10%", left: "5%", width: "35%", height: "25%",
          borderRadius: 999, backgroundColor: "rgba(40,60,50,0.30)",
        }} />
        <View style={{
          position: "absolute", bottom: "5%", right: "10%", width: "25%", height: "20%",
          borderRadius: 999, backgroundColor: "rgba(30,50,40,0.25)",
        }} />
        {/* Dim overhead light glow */}
        <View style={{
          position: "absolute", top: 0, left: "30%" as any, width: "40%", height: "50%",
          backgroundColor: "rgba(180,160,120,0.06)",
          borderRadius: 999,
        }} />
        {/* Ground line */}
        <View style={{
          position: "absolute", left: "10%" as any, right: "10%" as any, bottom: "8%" as any,
          height: 1, backgroundColor: "rgba(100,80,60,0.25)",
        }} />
        {/* Vignette - dark edges */}
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          borderWidth: 40, borderColor: "rgba(0,0,0,0.25)",
          borderRadius: 0,
        }} />
      </View>

      {/* HUD */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, zIndex: 10 }}>
        <Pressable onPress={() => { endGame(); setPhase("idle"); router.back(); }} hitSlop={12}>
          <X size={22} color="#6b7280" strokeWidth={2} />
        </Pressable>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: moodCfg.color + "20" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: moodCfg.color }}>{moodCfg.label}</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "900", color: timeLeft <= 10 ? "#ef4444" : "#fff" }}>{timeLeft}s</Text>
      </View>

      {/* Calm meter */}
      <View style={{ paddingHorizontal: 20, marginBottom: 4, zIndex: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 11, color: "#6b7280" }}>Calm</Text>
          <Text style={{ fontSize: 11, color: "#6b7280" }}>{Math.round(calmMeter)}%</Text>
        </View>
        <View style={{ height: 6, backgroundColor: "#374151", borderRadius: 3 }}>
          <View style={{ height: 6, backgroundColor: moodCfg.color, borderRadius: 3, width: `${calmMeter}%` as any }} />
        </View>
      </View>

      {/* Pet area */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} {...panResponder.panHandlers}>
        {/* Ambient mood glow behind cat */}
        <Animated.View style={{
          position: "absolute",
          width: catW + 40,
          height: catH + 40,
          borderRadius: 30,
          backgroundColor: glowColor,
          opacity: glowOpacity,
        }} />

        {/* Floating hearts */}
        {hearts.map((h) => (
          <Animated.Text
            key={h.id}
            style={{
              position: "absolute",
              left: h.x,
              top: "30%",
              fontSize: 24,
              color: "#ef4444",
              opacity: h.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
              transform: [{
                translateY: h.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }),
              }],
            }}
          >
            {"\u2764"}
          </Animated.Text>
        ))}

        {/* Real cat image with animations */}
        <Animated.View style={{
          transform: [
            { translateY: breatheY },
            { scaleY: breatheScale },
            { translateX: mood === "purring" ? purrX : 0 },
          ],
        }}>
          <View style={{
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <Image
              source={CAT_IMAGE}
              style={{
                width: catW,
                height: catH,
                // Desaturate when nervous via opacity overlay
              }}
              resizeMode="cover"
            />
            {/* Mood color tint overlay */}
            <Animated.View style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: glowColor,
              opacity: glowOpacity,
              borderRadius: 18,
            }} />
            {/* Dark overlay when nervous */}
            {mood === "nervous" && (
              <View style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "#000",
                opacity: 0.15,
                borderRadius: 18,
              }} />
            )}
            {/* Zzz overlay when sleeping */}
            {mood === "sleeping" && (
              <View style={{
                position: "absolute",
                top: 12, right: 16,
              }}>
                <Text style={{ fontSize: 24, color: "#8b5cf6", fontWeight: "900", opacity: 0.8 }}>zzz</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Gesture guidance */}
        {calmMeter < 30 && (
          <View style={{ alignItems: "center", marginTop: 24 }}>
            <Text style={{ fontSize: 15, color: "#9ca3af", fontWeight: "600" }}>
              {mood === "nervous" ? "Pat gently to calm..." : "Rub slowly to soothe..."}
            </Text>
            <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {mood === "nervous" ? "Use slow, short strokes" : "Long, gentle strokes work best"}
            </Text>
          </View>
        )}
        {calmMeter >= 30 && calmMeter < 65 && (
          <Text style={{ fontSize: 13, color: "#22c55e", marginTop: 24 }}>
            Keep going... nice and steady
          </Text>
        )}

        {/* Mood text */}
        {mood === "purring" && (
          <Text style={{ fontSize: 15, color: "#22c55e", fontWeight: "600", marginTop: 16, fontStyle: "italic" }}>
            *purrrrrr...*
          </Text>
        )}
        {mood === "sleeping" && (
          <Text style={{ fontSize: 15, color: "#8b5cf6", fontWeight: "600", marginTop: 16, fontStyle: "italic" }}>
            *zzz...*
          </Text>
        )}
        {mood === "nervous" && isPetting && moveDistRef.current > 40 && (
          <Text style={{ fontSize: 13, color: "#ef4444", fontWeight: "600", marginTop: 16 }}>
            Too rough! Slow down...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
