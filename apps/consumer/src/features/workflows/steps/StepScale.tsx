/**
 * StepScale — Horizontal row of labeled circular buttons
 *
 * 4-5 options displayed as circles with labels below.
 * Selected circle fills with accent color.
 * Left and right edge labels provide context (e.g., "Mild" to "Fire").
 */

import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, Glass, Spacing } from "../../../constants/colors";
import { lightTap } from "../../../lib/haptics";
import type { WorkflowStep } from "../types";

const CIRCLE_SIZE = 56;

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

export function StepScale({ step, value, onChange }: Props) {
  const options = step.options ?? [];

  const handleSelect = (optionValue: string) => {
    lightTap();
    onChange(optionValue);
  };

  // Edge labels (first and last option labels)
  const leftLabel = options.length > 0 ? options[0].label : "";
  const rightLabel = options.length > 1 ? options[options.length - 1].label : "";

  return (
    <View style={styles.container}>
      {/* Scale buttons */}
      <View style={styles.scaleRow}>
        {options.map((option, index) => {
          const selected = value === option.value;
          const accentColor = option.color ?? Colors.primary;

          return (
            <View key={option.value} style={styles.scaleItem}>
              <Pressable
                onPress={() => handleSelect(option.value)}
                style={({ pressed }) => [
                  styles.circle,
                  selected
                    ? [styles.circleSelected, { backgroundColor: accentColor, borderColor: accentColor }]
                    : styles.circleDefault,
                  pressed && styles.circlePressed,
                ]}
              >
                <Text
                  style={[
                    styles.circleNumber,
                    selected && styles.circleNumberSelected,
                  ]}
                >
                  {index + 1}
                </Text>
              </Pressable>
              <Text
                style={[
                  styles.optionLabel,
                  selected && { color: accentColor, fontWeight: "700" },
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Edge labels */}
      <View style={styles.edgeLabels}>
        <Text style={styles.edgeLabel}>{leftLabel}</Text>
        <Text style={styles.edgeLabel}>{rightLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xl,
    alignItems: "center",
  },

  scaleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: Spacing.md,
  },

  scaleItem: {
    alignItems: "center",
    width: CIRCLE_SIZE + 12,
  },

  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 2,
  },
  circleDefault: {
    backgroundColor: Glass.surface,
    borderColor: Glass.borderLight,
  },
  circleSelected: {
    shadowColor: Glass.shadow.color,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: 8,
    shadowOpacity: 1,
    elevation: 4,
  },
  circlePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },

  circleNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  circleNumberSelected: {
    color: "#FFFFFF",
  },

  optionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.muted,
    textAlign: "center",
  },

  edgeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  edgeLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.muted,
  },
});
