import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Bot, Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { useTheme } from "../../contexts/ThemeProvider";
import { useCompanion } from "../../hooks/useCompanion";
import { useAppSettings } from "../../hooks/useAppSettings";
import { getRegion } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PERSONALITIES = [
  { key: "friendly" as const, label: "Friendly", desc: "Warm, encouraging, and supportive" },
  { key: "witty" as const, label: "Witty", desc: "Clever with a dry sense of humour" },
  { key: "calm" as const, label: "Calm", desc: "Patient, methodical, and reassuring" },
  { key: "energetic" as const, label: "Energetic", desc: "Enthusiastic and excited about cooking" },
];

const STEPS = ["welcome", "name", "personality"] as const;
type Step = (typeof STEPS)[number];

export default function CompanionOnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { createProfile } = useCompanion();
  const { updateSetting } = useAppSettings();
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const regionConfig = getRegion(APP_VARIANT);
  const greeting = regionConfig.homeGreeting || "Hey";

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState<"friendly" | "witty" | "calm" | "energetic">("friendly");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const step = STEPS[stepIndex];
  const nameValid = name.trim().length >= 2 && name.trim().length <= 20;

  const animateTransition = useCallback(
    (next: () => void) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        next();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim]
  );

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateTransition(() => setStepIndex((i) => i + 1));
    }
  }, [stepIndex, animateTransition]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      animateTransition(() => setStepIndex((i) => i - 1));
    }
  }, [stepIndex, animateTransition]);

  const handleCreate = useCallback(async () => {
    if (!nameValid || saving) return;
    setSaving(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createProfile.mutateAsync({ name: name.trim(), personality });
      updateSetting("companionName", name.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(app)/feature-walkthrough");
    } catch (e: any) {
      const msg = e?.message || e?.toString() || "Something went wrong.";
      console.error("Companion creation error:", e);
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  }, [name, personality, nameValid, saving, createProfile, updateSetting, router]);

  const handleSkip = useCallback(() => {
    // Skip onboarding — disable companion
    updateSetting("companionEnabled", false);
    router.replace("/(app)/(tabs)/dashboard");
  }, [updateSetting, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Step indicator + back/skip */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        {stepIndex > 0 ? (
          <Pressable onPress={goBack} hitSlop={12} style={{ padding: 4 }}>
            <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={{ width: 30 }} />
        )}

        {/* Progress dots */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === stepIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i <= stepIndex ? colors.accent : colors.border,
              }}
            />
          ))}
        </View>

        <Pressable onPress={handleSkip} hitSlop={12} style={{ padding: 4 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>Skip</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: 40,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 40 : 0}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Step 1: Welcome ──────────────────────────── */}
          {step === "welcome" && (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: colors.accentBg || colors.accent + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                }}
              >
                <Bot size={48} color={colors.accent} strokeWidth={1.5} />
              </View>

              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "800",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                Meet your Kitchen Buddy
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  textAlign: "center",
                  lineHeight: 24,
                  maxWidth: 300,
                  marginBottom: 8,
                }}
              >
                {greeting}! A personal cooking companion that learns your
                preferences and grows with you.
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: colors.textMuted,
                  textAlign: "center",
                  lineHeight: 20,
                  maxWidth: 280,
                  marginBottom: 44,
                }}
              >
                Recipes, meal planning, pantry tips, and comfort food ideas —
                all tailored to you.
              </Text>

              <Pressable
                onPress={goNext}
                style={({ pressed }) => ({
                  backgroundColor: colors.accent,
                  paddingHorizontal: 36,
                  paddingVertical: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#FFFFFF" }}>
                  Get Started
                </Text>
                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            </View>
          )}

          {/* ── Step 2: Name ─────────────────────────────── */}
          {step === "name" && (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.accentBg || colors.accent + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Sparkles size={32} color={colors.accent} strokeWidth={1.5} />
              </View>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Name your companion
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 28,
                  maxWidth: 260,
                }}
              >
                Give your kitchen buddy a name — like naming a friend.
              </Text>

              <TextInput
                ref={inputRef}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError("");
                }}
                placeholder="e.g. Rosie, Chef Bob, Sous..."
                placeholderTextColor={colors.textMuted}
                maxLength={20}
                autoCapitalize="words"
                autoCorrect={false}
                style={{
                  width: "100%",
                  borderWidth: 2,
                  borderColor:
                    name.length > 0 && !nameValid
                      ? colors.destructive
                      : colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  fontSize: 18,
                  textAlign: "center",
                  color: colors.text,
                  backgroundColor: colors.surface,
                }}
              />

              <Text
                style={{
                  fontSize: 12,
                  color:
                    name.length > 0 && !nameValid
                      ? colors.destructive
                      : colors.textMuted,
                  marginTop: 8,
                  marginBottom: 32,
                }}
              >
                2–20 characters
              </Text>

              <Pressable
                onPress={goNext}
                disabled={!nameValid}
                style={({ pressed }) => ({
                  backgroundColor: nameValid ? colors.accent : colors.border,
                  paddingHorizontal: 36,
                  paddingVertical: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: pressed && nameValid ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: nameValid ? "#FFFFFF" : colors.textMuted,
                  }}
                >
                  Next
                </Text>
                <ChevronRight
                  size={20}
                  color={nameValid ? "#FFFFFF" : colors.textMuted}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          )}

          {/* ── Step 3: Personality ──────────────────────── */}
          {step === "personality" && (
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: colors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Pick a personality
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 24,
                  maxWidth: 260,
                }}
              >
                How should {name.trim()} talk to you?
              </Text>

              <View style={{ width: "100%", gap: 10, marginBottom: 28 }}>
                {PERSONALITIES.map((p) => {
                  const selected = personality === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => {
                        setPersonality(p.key);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: selected ? colors.accent : colors.border,
                        backgroundColor: selected
                          ? colors.accentBg || colors.accent + "10"
                          : colors.surface,
                        gap: 12,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          borderWidth: 2,
                          borderColor: selected ? colors.accent : colors.border,
                          backgroundColor: selected ? colors.accent : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {selected && (
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: colors.text,
                          }}
                        >
                          {p.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {p.desc}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {error ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.destructive,
                    marginBottom: 12,
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                onPress={handleCreate}
                disabled={saving}
                style={({ pressed }) => ({
                  backgroundColor: colors.accent,
                  paddingHorizontal: 36,
                  paddingVertical: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: saving ? 0.7 : pressed ? 0.85 : 1,
                  minWidth: 200,
                })}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                    >
                      Create {name.trim()}
                    </Text>
                    <Sparkles size={18} color="#FFFFFF" strokeWidth={2} />
                  </>
                )}
              </Pressable>
            </View>
          )}
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
