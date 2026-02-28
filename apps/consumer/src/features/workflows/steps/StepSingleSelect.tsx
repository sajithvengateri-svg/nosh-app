/**
 * StepSingleSelect — Vertical list of glass pill buttons
 *
 * Tapping one selects it (accent bg + primary border), deselecting others.
 * Haptic feedback on every selection.
 */

import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../../constants/colors";
import { lightTap } from "../../../lib/haptics";
import type { WorkflowStep } from "../types";

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

export function StepSingleSelect({ step, value, onChange }: Props) {
  const options = step.options ?? [];

  const handleSelect = (optionValue: string) => {
    lightTap();
    onChange(optionValue);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => handleSelect(option.value)}
            style={({ pressed }) => [
              styles.pill,
              selected ? styles.pillSelected : styles.pillDefault,
              pressed && styles.pillPressed,
            ]}
          >
            <Text
              style={[
                styles.pillLabel,
                selected && styles.pillLabelSelected,
              ]}
            >
              {option.label}
            </Text>
            {option.description && (
              <Text
                style={[
                  styles.pillDescription,
                  selected && styles.pillDescriptionSelected,
                ]}
              >
                {option.description}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  pill: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    marginBottom: Spacing.sm,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 2,
  },
  pillDefault: {
    backgroundColor: Glass.surface,
    borderColor: Glass.borderLight,
  },
  pillSelected: {
    backgroundColor: Glass.surfaceAccent,
    borderColor: Colors.primary,
  },
  pillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  pillLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.secondary,
  },
  pillLabelSelected: {
    color: Colors.primary,
  },
  pillDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
    lineHeight: 19,
  },
  pillDescriptionSelected: {
    color: Colors.primary,
  },
});
