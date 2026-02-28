/**
 * StepIconCards — 2-3 large glass cards in a column
 *
 * Each card shows an icon (lucide-react-native), label, and optional
 * description. Selected card gets accent border + tinted background.
 */

import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../../constants/colors";
import { lightTap } from "../../../lib/haptics";
import type { WorkflowStep } from "../types";

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

/** Resolve a lucide icon name string to a component */
function resolveIcon(name?: string): React.ComponentType<any> | null {
  if (!name) return null;
  // Convert kebab-case or snake_case to PascalCase
  const pascal = name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  return (LucideIcons as Record<string, any>)[pascal] ?? null;
}

export function StepIconCards({ step, value, onChange }: Props) {
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
        const IconComponent = resolveIcon(option.icon);
        const accentColor = option.color ?? Colors.primary;

        return (
          <Pressable
            key={option.value}
            onPress={() => handleSelect(option.value)}
            style={({ pressed }) => [
              styles.card,
              selected ? [styles.cardSelected, { borderColor: accentColor }] : styles.cardDefault,
              pressed && styles.cardPressed,
            ]}
          >
            {IconComponent && (
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: selected
                      ? accentColor + "20"
                      : Glass.surface,
                  },
                ]}
              >
                <IconComponent
                  size={28}
                  color={selected ? accentColor : Colors.text.secondary}
                />
              </View>
            )}
            <View style={styles.cardText}>
              <Text
                style={[
                  styles.cardLabel,
                  selected && { color: accentColor },
                ]}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text style={styles.cardDescription}>
                  {option.description}
                </Text>
              )}
            </View>
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

  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    marginBottom: Spacing.sm + 4,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 3,
  },
  cardDefault: {
    backgroundColor: Glass.surface,
    borderColor: Glass.borderLight,
  },
  cardSelected: {
    backgroundColor: Glass.surfaceAccent,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
});
