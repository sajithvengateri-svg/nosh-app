/**
 * WorkflowStepper — Full-screen Typeform-style stepper
 *
 * One question per screen with animated horizontal slide transitions,
 * segmented progress bar, glass-styled Continue button, and step-type
 * renderer that delegates to the appropriate StepXxx component.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../constants/colors";
import { lightTap, successNotification } from "../../lib/haptics";
import type { WorkflowConfig, WorkflowStep } from "./types";

// Step renderers
import { StepTextInput } from "./steps/StepTextInput";
import { StepSingleSelect } from "./steps/StepSingleSelect";
import { StepMultiSelect } from "./steps/StepMultiSelect";
import { StepSlider } from "./steps/StepSlider";
import { StepIconCards } from "./steps/StepIconCards";
import { StepGridSelect } from "./steps/StepGridSelect";
import { StepScale } from "./steps/StepScale";
import { StepHouseholdCount } from "./steps/StepHouseholdCount";
import { StepInfoCard } from "./steps/StepInfoCard";
import { StepPersonalityPick } from "./steps/StepPersonalityPick";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDE_DURATION = 280;

// ── Props ───────────────────────────────────────────────────────────
interface WorkflowStepperProps {
  config: WorkflowConfig;
  initialAnswers?: Record<string, any>;
  onComplete: (answers: Record<string, any>) => void;
  onClose: () => void;
}

// ── Step Renderer Map ───────────────────────────────────────────────
const STEP_COMPONENTS: Record<
  string,
  React.ComponentType<{
    step: WorkflowStep;
    value: any;
    onChange: (value: any) => void;
  }>
> = {
  text_input: StepTextInput,
  single_select: StepSingleSelect,
  multi_select: StepMultiSelect,
  slider: StepSlider,
  icon_cards: StepIconCards,
  grid_select: StepGridSelect,
  scale: StepScale,
  household_count: StepHouseholdCount,
  info_card: StepInfoCard,
  personality_pick: StepPersonalityPick,
};

// ── Component ───────────────────────────────────────────────────────
export function WorkflowStepper({
  config,
  initialAnswers = {},
  onComplete,
  onClose,
}: WorkflowStepperProps) {
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Filter out steps that should be skipped based on current answers
  const visibleSteps = useMemo(
    () => config.steps.filter((s) => !s.skipIf?.(answers)),
    [config.steps, answers],
  );

  const step = visibleSteps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === visibleSteps.length - 1;
  const currentValue = step ? answers[step.id] : undefined;

  // ── Validation ──────────────────────────────────────────────────
  const isStepValid = useCallback((): boolean => {
    if (!step) return false;

    // info_card never blocks
    if (step.type === "info_card") return true;

    // Custom validation
    if (step.validate) {
      const err = step.validate(currentValue);
      if (err) return false;
    }

    // Required check
    if (step.required !== false) {
      if (currentValue === undefined || currentValue === null || currentValue === "") {
        return false;
      }
      if (Array.isArray(currentValue) && currentValue.length === 0) {
        return false;
      }
    }

    return true;
  }, [step, currentValue]);

  // ── Navigation ──────────────────────────────────────────────────
  const animateSlide = useCallback(
    (direction: "left" | "right", cb: () => void) => {
      const toValue = direction === "left" ? -SCREEN_WIDTH : SCREEN_WIDTH;
      Animated.timing(slideAnim, {
        toValue,
        duration: SLIDE_DURATION / 2,
        useNativeDriver: true,
      }).start(() => {
        cb();
        slideAnim.setValue(direction === "left" ? SCREEN_WIDTH : -SCREEN_WIDTH);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: SLIDE_DURATION / 2,
          useNativeDriver: true,
        }).start();
      });
    },
    [slideAnim],
  );

  const handleContinue = useCallback(() => {
    if (!step) return;

    // Run validation
    if (step.validate) {
      const err = step.validate(currentValue);
      if (err) {
        setValidationError(err);
        return;
      }
    }
    setValidationError(null);
    lightTap();

    if (isLast) {
      successNotification();
      onComplete(answers);
      return;
    }

    animateSlide("left", () => {
      setCurrentIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
    });
  }, [step, currentValue, isLast, answers, visibleSteps.length, animateSlide, onComplete]);

  const handleBack = useCallback(() => {
    if (isFirst) return;
    lightTap();
    setValidationError(null);
    animateSlide("right", () => {
      setCurrentIndex((i) => Math.max(i - 1, 0));
    });
  }, [isFirst, animateSlide]);

  const handleSkip = useCallback(() => {
    if (isLast) {
      onComplete(answers);
      return;
    }
    lightTap();
    setValidationError(null);
    animateSlide("left", () => {
      setCurrentIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
    });
  }, [isLast, answers, visibleSteps.length, animateSlide, onComplete]);

  const handleChange = useCallback(
    (value: any) => {
      if (!step) return;
      setValidationError(null);
      setAnswers((prev) => ({ ...prev, [step.id]: value }));
    },
    [step],
  );

  // ── Render ──────────────────────────────────────────────────────
  if (!step) return null;

  const StepComponent = STEP_COMPONENTS[step.type];
  if (!StepComponent) return null;

  const canGoBack = config.allowBack !== false && !isFirst;
  const canSkip = config.allowSkip !== false && step.required === false;
  const showProgress = config.showProgress !== false;
  const valid = isStepValid();
  const continueLabel =
    step.type === "info_card"
      ? isLast
        ? "Let's Go"
        : "Next"
      : isLast
        ? "Finish"
        : "Continue";

  const needsKeyboardAvoiding = step.type === "text_input";
  const Wrapper = needsKeyboardAvoiding ? KeyboardAvoidingView : View;
  const wrapperProps = needsKeyboardAvoiding
    ? { behavior: Platform.OS === "ios" ? ("padding" as const) : ("height" as const), style: styles.flex }
    : { style: styles.flex };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {/* Back */}
        {canGoBack ? (
          <Pressable onPress={handleBack} style={styles.topButton} hitSlop={12}>
            <ChevronLeft size={24} color={Colors.secondary} />
          </Pressable>
        ) : (
          <View style={styles.topButton} />
        )}

        {/* Step counter */}
        <Text style={styles.stepCounter}>
          {currentIndex + 1} of {visibleSteps.length}
        </Text>

        {/* Skip */}
        {canSkip ? (
          <Pressable onPress={handleSkip} style={styles.topButton} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onClose} style={styles.topButton} hitSlop={12}>
            <Text style={styles.skipText}>Close</Text>
          </Pressable>
        )}
      </View>

      {/* ── Progress Segments ────────────────────────────────────── */}
      {showProgress && (
        <View style={styles.progressRow}>
          {visibleSteps.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.progressSegment,
                i <= currentIndex
                  ? styles.progressFilled
                  : styles.progressEmpty,
                i < visibleSteps.length - 1 && styles.progressGap,
              ]}
            />
          ))}
        </View>
      )}

      {/* ── Step Content ─────────────────────────────────────────── */}
      <Wrapper {...wrapperProps}>
        <Animated.View
          style={[
            styles.stepContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Question */}
          <Text style={styles.questionText}>{step.question}</Text>
          {step.subtitle && (
            <Text style={styles.subtitleText}>{step.subtitle}</Text>
          )}

          {/* Step Component */}
          <View style={styles.stepBody}>
            <StepComponent
              step={step}
              value={currentValue}
              onChange={handleChange}
            />
          </View>

          {/* Validation Error */}
          {validationError && (
            <Text style={styles.errorText}>{validationError}</Text>
          )}
        </Animated.View>

        {/* ── Continue Button ──────────────────────────────────────── */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleContinue}
            disabled={!valid && step.type !== "info_card"}
            style={({ pressed }) => [
              styles.continueButton,
              valid ? styles.continueEnabled : styles.continueDisabled,
              pressed && valid && styles.continuePressed,
            ]}
          >
            <Text
              style={[
                styles.continueText,
                !valid && step.type !== "info_card" && styles.continueTextDisabled,
              ]}
            >
              {continueLabel}
            </Text>
          </Pressable>
        </View>
      </Wrapper>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: 48,
  },
  topButton: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.primary,
  },

  // Progress
  progressRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  progressFilled: {
    backgroundColor: Colors.primary,
  },
  progressEmpty: {
    backgroundColor: Colors.border,
  },
  progressGap: {
    marginRight: 3,
  },

  // Step content
  stepContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    justifyContent: "flex-start",
  },
  questionText: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.secondary,
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  stepBody: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: Colors.alert,
    marginTop: Spacing.sm,
    textAlign: "center",
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  continueButton: {
    height: 56,
    borderRadius: BorderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  continueEnabled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Glass.shadow.color,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    shadowOpacity: 1,
    elevation: 6,
  },
  continueDisabled: {
    backgroundColor: Glass.surface,
    borderColor: Glass.borderLight,
  },
  continuePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  continueText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  continueTextDisabled: {
    color: Colors.text.muted,
  },
});
