import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sprout, ChefHat, Flame } from "lucide-react-native";
import {
  Colors,
  Glass,
  AVAILABLE_THEMES,
  useThemeStore,
} from "../../src/constants/colors";
import { lightTap, successNotification } from "../../src/lib/haptics";
import { useAuth } from "../../src/contexts/AuthProvider";
import { supabase } from "../../src/lib/supabase";

// ── Constants ─────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_STEPS = 8;

const CUISINES = [
  "Italian",
  "Thai",
  "Mexican",
  "Indian",
  "Japanese",
  "Mediterranean",
  "Chinese",
  "French",
  "Korean",
  "American",
  "Middle Eastern",
  "Vietnamese",
];

const DIETARY_OPTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten Free",
  "Dairy Free",
  "Nut Free",
  "Halal",
  "Kosher",
  "Low Carb",
  "Keto",
];

const SPICE_OPTIONS = ["Mild", "Medium", "Hot", "Bring it on"];

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6];

const SKILL_OPTIONS = [
  { key: "beginner", label: "Just starting out", Icon: Sprout },
  { key: "intermediate", label: "Comfortable cook", Icon: ChefHat },
  { key: "advanced", label: "Seasoned pro", Icon: Flame },
] as const;

const BUDGET_OPTIONS = ["Under $50", "$50-100", "$100+"];

// ── Onboarding Data ───────────────────────────────────────────────

interface OnboardingAnswers {
  name: string;
  theme: string;
  cuisines: string[];
  dietary: string[];
  spiceLevel: string;
  householdSize: number;
  cookingSkill: string;
  budget: string;
}

// ── Main Component ────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const setTheme = useThemeStore((s) => s.setTheme);

  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const answers = useRef<OnboardingAnswers>({
    name: "",
    theme: "pink_onion",
    cuisines: [],
    dietary: [],
    spiceLevel: "",
    householdSize: 2,
    cookingSkill: "",
    budget: "",
  });

  // Force re-renders for answer state changes within steps
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const updateAnswer = useCallback(
    <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
      answers.current[key] = value;
      rerender();
    },
    [rerender],
  );

  // ── Transitions ───────────────────────────────────────────────

  const animateTo = useCallback(
    (nextStep: number) => {
      const direction = nextStep > currentStep ? 1 : -1;

      // Slide current step out
      Animated.timing(slideAnim, {
        toValue: -direction * SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(nextStep);
        // Position incoming step off-screen on the other side
        slideAnim.setValue(direction * SCREEN_WIDTH);
        // Slide incoming step in
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    },
    [currentStep, slideAnim],
  );

  const handleNext = useCallback(() => {
    lightTap();
    if (currentStep < TOTAL_STEPS - 1) {
      animateTo(currentStep + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, animateTo]);

  const handleBack = useCallback(() => {
    lightTap();
    if (currentStep > 0) {
      animateTo(currentStep - 1);
    }
  }, [currentStep, animateTo]);

  // ── Completion ────────────────────────────────────────────────

  const completeOnboarding = async () => {
    const data = answers.current;

    if (user) {
      await supabase
        .from("ds_user_profiles")
        .update({
          onboarding_complete: true,
          display_name: data.name || undefined,
          cuisine_preferences: data.cuisines,
          spice_level: SPICE_OPTIONS.indexOf(data.spiceLevel) + 1,
          household_size: data.householdSize,
          budget_preference:
            data.budget === "Under $50"
              ? "tight"
              : data.budget === "$50-100"
                ? "moderate"
                : "flexible",
          cooking_skill: data.cookingSkill,
          dietary_requirements: data.dietary.filter((d) => d !== "None"),
          preferred_theme: data.theme,
        })
        .eq("id", user.id);

      await refreshProfile();
    }

    successNotification();
    router.replace("/(app)/feed");
  };

  // ── Can Continue Logic ────────────────────────────────────────

  const canContinue = (): boolean => {
    const data = answers.current;
    switch (currentStep) {
      case 0:
        return data.name.trim().length > 0;
      case 1:
        return data.theme.length > 0;
      case 2:
        return data.cuisines.length > 0;
      case 3:
        return data.dietary.length > 0;
      case 4:
        return data.spiceLevel.length > 0;
      case 5:
        return data.householdSize > 0;
      case 6:
        return data.cookingSkill.length > 0;
      case 7:
        return data.budget.length > 0;
      default:
        return true;
    }
  };

  // ── Step Renderers ────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepName value={answers.current.name} onChange={(v) => updateAnswer("name", v)} />;
      case 1:
        return (
          <StepTheme
            value={answers.current.theme}
            onChange={(v) => {
              updateAnswer("theme", v);
              setTheme(v);
            }}
          />
        );
      case 2:
        return (
          <StepCuisines
            selected={answers.current.cuisines}
            onToggle={(item) => {
              const current = answers.current.cuisines;
              const next = current.includes(item)
                ? current.filter((c) => c !== item)
                : [...current, item];
              updateAnswer("cuisines", next);
            }}
          />
        );
      case 3:
        return (
          <StepDietary
            selected={answers.current.dietary}
            onToggle={(item) => {
              const current = answers.current.dietary;
              if (item === "None") {
                updateAnswer("dietary", current.includes("None") ? [] : ["None"]);
              } else {
                const withoutNone = current.filter((d) => d !== "None");
                const next = withoutNone.includes(item)
                  ? withoutNone.filter((d) => d !== item)
                  : [...withoutNone, item];
                updateAnswer("dietary", next);
              }
            }}
          />
        );
      case 4:
        return (
          <StepSpice
            value={answers.current.spiceLevel}
            onChange={(v) => updateAnswer("spiceLevel", v)}
          />
        );
      case 5:
        return (
          <StepHousehold
            value={answers.current.householdSize}
            onChange={(v) => updateAnswer("householdSize", v)}
          />
        );
      case 6:
        return (
          <StepSkill
            value={answers.current.cookingSkill}
            onChange={(v) => updateAnswer("cookingSkill", v)}
          />
        );
      case 7:
        return (
          <StepBudget
            value={answers.current.budget}
            onChange={(v) => updateAnswer("budget", v)}
          />
        );
      default:
        return null;
    }
  };

  const isFinal = currentStep === TOTAL_STEPS - 1;
  const enabled = canContinue();
  const progress = (currentStep + 1) / TOTAL_STEPS;

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ── Progress Bar ──────────────────────────────────────── */}
      <View style={s.progressTrack}>
        <Animated.View
          style={[
            s.progressFill,
            { width: `${progress * 100}%` as unknown as number },
          ]}
        />
      </View>

      {/* ── Animated Step Content ─────────────────────────────── */}
      <Animated.View
        style={[
          s.stepContainer,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {renderStep()}
      </Animated.View>

      {/* ── Bottom Navigation ─────────────────────────────────── */}
      <View style={s.bottomNav}>
        <Pressable
          onPress={handleNext}
          disabled={!enabled}
          style={[s.continueButton, !enabled && s.continueButtonDisabled]}
        >
          <Text style={[s.continueButtonText, !enabled && s.continueButtonTextDisabled]}>
            {isFinal ? "Let's cook" : "Continue"}
          </Text>
        </Pressable>

        {currentStep > 0 ? (
          <Pressable onPress={handleBack} style={s.backButton}>
            <Text style={s.backButtonText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ height: 40 }} />
        )}
      </View>
    </View>
  );
}

// ── Step 1: Name ──────────────────────────────────────────────────

function StepName({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>What should we call you?</Text>
      <TextInput
        style={s.glassInput}
        value={value}
        onChangeText={onChange}
        placeholder="Your name"
        placeholderTextColor={Colors.text.muted}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
      />
    </View>
  );
}

// ── Step 2: Theme ─────────────────────────────────────────────────

function StepTheme({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>Pick your vibe</Text>
      <View style={s.themeGrid}>
        {AVAILABLE_THEMES.map((theme) => {
          const isSelected = value === theme.key;
          return (
            <Pressable
              key={theme.key}
              onPress={() => {
                lightTap();
                onChange(theme.key);
              }}
              style={s.themeOption}
            >
              <View
                style={[
                  s.themeSwatch,
                  { backgroundColor: theme.primary },
                  isSelected && s.themeSwatchSelected,
                ]}
              />
              <Text
                style={[
                  s.themeLabel,
                  isSelected && { color: Colors.text.primary, fontWeight: "700" },
                ]}
              >
                {theme.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Step 3: Cuisines ──────────────────────────────────────────────

function StepCuisines({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>What do you love to eat?</Text>
      <View style={s.pillGrid}>
        {CUISINES.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <Pressable
              key={item}
              onPress={() => {
                lightTap();
                onToggle(item);
              }}
              style={[s.glassPill, isSelected && s.glassPillSelected]}
            >
              <Text style={[s.glassPillText, isSelected && s.glassPillTextSelected]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Step 4: Dietary ───────────────────────────────────────────────

function StepDietary({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>Any dietary needs?</Text>
      <View style={s.pillGrid}>
        {DIETARY_OPTIONS.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <Pressable
              key={item}
              onPress={() => {
                lightTap();
                onToggle(item);
              }}
              style={[s.glassPill, isSelected && s.glassPillSelected]}
            >
              <Text style={[s.glassPillText, isSelected && s.glassPillTextSelected]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Step 5: Spice Level ───────────────────────────────────────────

function StepSpice({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>How spicy do you like it?</Text>
      <View style={s.spiceRow}>
        {SPICE_OPTIONS.map((option) => {
          const isSelected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => {
                lightTap();
                onChange(option);
              }}
              style={[s.glassPill, s.spicePill, isSelected && s.glassPillSelected]}
            >
              <Text style={[s.glassPillText, isSelected && s.glassPillTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Step 6: Household Size ────────────────────────────────────────

function StepHousehold({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>How many mouths to feed?</Text>
      <View style={s.householdRow}>
        {HOUSEHOLD_SIZES.map((n) => {
          const isSelected = value === n;
          const label = n === 6 ? "6+" : String(n);
          return (
            <Pressable
              key={n}
              onPress={() => {
                lightTap();
                onChange(n);
              }}
              style={[s.householdCircle, isSelected && s.householdCircleSelected]}
            >
              <Text
                style={[
                  s.householdCircleText,
                  isSelected && s.householdCircleTextSelected,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Step 7: Cooking Skill ─────────────────────────────────────────

function StepSkill({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>How confident in the kitchen?</Text>
      <View style={s.skillStack}>
        {SKILL_OPTIONS.map(({ key, label, Icon }) => {
          const isSelected = value === key;
          return (
            <Pressable
              key={key}
              onPress={() => {
                lightTap();
                onChange(key);
              }}
              style={[s.skillCard, isSelected && s.skillCardSelected]}
            >
              <Icon
                size={28}
                color={isSelected ? Colors.primary : Colors.text.muted}
                strokeWidth={1.5}
              />
              <Text style={[s.skillLabel, isSelected && s.skillLabelSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Step 8: Budget ────────────────────────────────────────────────

function StepBudget({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.stepInner}>
      <Text style={s.question}>Weekly food budget?</Text>
      <View style={s.spiceRow}>
        {BUDGET_OPTIONS.map((option) => {
          const isSelected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => {
                lightTap();
                onChange(option);
              }}
              style={[s.glassPill, s.spicePill, isSelected && s.glassPillSelected]}
            >
              <Text style={[s.glassPillText, isSelected && s.glassPillTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Progress ────────────────────────────────────────────────
  progressTrack: {
    height: 3,
    backgroundColor: Colors.divider,
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // ── Step container ──────────────────────────────────────────
  stepContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  stepInner: {
    gap: 32,
  },

  // ── Question text ───────────────────────────────────────────
  question: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: -0.5,
    lineHeight: 40,
  },

  // ── Glass text input ────────────────────────────────────────
  glassInput: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: "500",
  },

  // ── Glass pill selectors ────────────────────────────────────
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  glassPill: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  glassPillSelected: {
    backgroundColor: Glass.surfaceAccent,
    borderColor: Colors.primary,
  },
  glassPillText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  glassPillTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },

  // ── Spice / Budget row ──────────────────────────────────────
  spiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  spicePill: {
    flex: 0,
  },

  // ── Theme grid ──────────────────────────────────────────────
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    justifyContent: "center",
  },
  themeOption: {
    alignItems: "center",
    gap: 8,
    width: 80,
  },
  themeSwatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "transparent",
  },
  themeSwatchSelected: {
    borderColor: Colors.text.primary,
    borderWidth: 3,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.secondary,
    textAlign: "center",
  },

  // ── Household circles ───────────────────────────────────────
  householdRow: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "center",
  },
  householdCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  householdCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  householdCircleText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  householdCircleTextSelected: {
    color: "#FFFFFF",
  },

  // ── Skill cards ─────────────────────────────────────────────
  skillStack: {
    gap: 12,
  },
  skillCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  skillCardSelected: {
    backgroundColor: Glass.surfaceAccent,
    borderColor: Colors.primary,
  },
  skillLabel: {
    fontSize: 17,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  skillLabelSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },

  // ── Bottom navigation ───────────────────────────────────────
  bottomNav: {
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 8,
  },
  continueButton: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  continueButtonTextDisabled: {
    color: Colors.text.muted,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
});
