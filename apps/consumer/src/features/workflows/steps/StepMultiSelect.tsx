/**
 * StepMultiSelect — Wrap-style layout of toggle pills
 *
 * Tapping toggles selection. Shows count of selected items.
 * Haptic on each toggle.
 */

import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check } from "lucide-react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../../constants/colors";
import { lightTap } from "../../../lib/haptics";
import type { WorkflowStep } from "../types";

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

export function StepMultiSelect({ step, value, onChange }: Props) {
  const options = step.options ?? [];
  const selected: string[] = useMemo(
    () => (Array.isArray(value) ? value : []),
    [value],
  );

  const toggle = (optionValue: string) => {
    lightTap();
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  };

  return (
    <View style={styles.container}>
      {selected.length > 0 && (
        <Text style={styles.countText}>
          {selected.length} selected
        </Text>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.wrap}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggle(option.value)}
              style={({ pressed }) => [
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipDefault,
                pressed && styles.chipPressed,
              ]}
            >
              {isSelected && (
                <Check
                  size={14}
                  color="#FFFFFF"
                  style={styles.checkIcon}
                />
              )}
              <Text
                style={[
                  styles.chipLabel,
                  isSelected && styles.chipLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: Spacing.lg,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 2,
  },
  chipDefault: {
    backgroundColor: Glass.surface,
    borderColor: Glass.borderLight,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },

  checkIcon: {
    marginRight: 4,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.secondary,
  },
  chipLabelSelected: {
    color: "#FFFFFF",
  },
});
