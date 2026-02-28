/**
 * StepHouseholdCount — Large circular number with +/- buttons
 *
 * Centered number display with decrement/increment controls.
 * Min 1, Max 8. Spring animation on value change.
 */

import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { Colors, Glass, Spacing } from "../../../constants/colors";
import { lightTap } from "../../../lib/haptics";
import type { WorkflowStep } from "../types";

const CIRCLE_SIZE = 140;
const BUTTON_SIZE = 60;
const MIN_COUNT = 1;
const MAX_COUNT = 8;

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

export function StepHouseholdCount({ step, value, onChange }: Props) {
  const count = typeof value === "number" ? value : MIN_COUNT;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Spring bounce on value change
  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.12,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 8,
      }),
    ]).start();
  }, [count]);

  const decrement = () => {
    if (count <= MIN_COUNT) return;
    lightTap();
    onChange(count - 1);
  };

  const increment = () => {
    if (count >= MAX_COUNT) return;
    lightTap();
    onChange(count + 1);
  };

  const canDecrement = count > MIN_COUNT;
  const canIncrement = count < MAX_COUNT;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Decrement */}
        <Pressable
          onPress={decrement}
          disabled={!canDecrement}
          style={({ pressed }) => [
            styles.controlButton,
            !canDecrement && styles.controlDisabled,
            pressed && canDecrement && styles.controlPressed,
          ]}
        >
          <Minus
            size={26}
            color={canDecrement ? Colors.secondary : Colors.text.muted}
          />
        </Pressable>

        {/* Number circle */}
        <Animated.View
          style={[
            styles.numberCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.numberText}>{count}</Text>
        </Animated.View>

        {/* Increment */}
        <Pressable
          onPress={increment}
          disabled={!canIncrement}
          style={({ pressed }) => [
            styles.controlButton,
            !canIncrement && styles.controlDisabled,
            pressed && canIncrement && styles.controlPressed,
          ]}
        >
          <Plus
            size={26}
            color={canIncrement ? Colors.secondary : Colors.text.muted}
          />
        </Pressable>
      </View>

      {/* Helper text */}
      <Text style={styles.helperText}>
        {count === 1
          ? "Just me"
          : count === 2
            ? "A pair"
            : `${count} people`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Spacing.xxl,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
  },

  controlButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Glass.surface,
    borderWidth: 1.5,
    borderColor: Glass.borderLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 3,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlPressed: {
    backgroundColor: Glass.surfaceHover,
    transform: [{ scale: 0.92 }],
  },

  numberCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: Glass.surfaceAccent,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Glass.shadow.color,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    shadowOpacity: 1,
    elevation: 6,
  },
  numberText: {
    fontSize: 56,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: -2,
  },

  helperText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text.secondary,
    marginTop: Spacing.lg,
  },
});
