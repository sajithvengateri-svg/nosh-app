/**
 * StepPersonalityPick — 4 large personality type cards
 *
 * Each card shows an icon, name, and short description.
 * Designed for the Phase 4 personality quiz.
 * Uses personality icons from personalityEngine.ts.
 * Glass surface with full accent treatment on selection.
 */

import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CalendarDays, Waves, Zap, Ruler } from "lucide-react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../../constants/colors";
import { lightTap, mediumTap } from "../../../lib/haptics";
import type { WorkflowStep } from "../types";

// Map personality values to icons (matches personalityEngine.ts)
const PERSONALITY_ICONS: Record<string, React.ComponentType<any>> = {
  humpday_nosher: CalendarDays,
  weekend_warrior: Waves,
  thrill_seeker: Zap,
  ocd_planner: Ruler,
};

// Accent colors per personality
const PERSONALITY_COLORS: Record<string, string> = {
  humpday_nosher: "#E88C4A",
  weekend_warrior: "#4A9EAA",
  thrill_seeker: "#D94878",
  ocd_planner: "#7A6EB0",
};

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

export function StepPersonalityPick({ step, value, onChange }: Props) {
  const options = step.options ?? [];

  const handleSelect = (optionValue: string) => {
    mediumTap();
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
        const personalityKey = option.personality ?? option.value;
        const IconComponent =
          PERSONALITY_ICONS[personalityKey] ?? CalendarDays;
        const accentColor =
          option.color ??
          PERSONALITY_COLORS[personalityKey] ??
          Colors.primary;

        return (
          <Pressable
            key={option.value}
            onPress={() => handleSelect(option.value)}
            style={({ pressed }) => [
              styles.card,
              selected
                ? styles.cardSelected
                : styles.cardDefault,
              selected && { borderColor: accentColor },
              pressed && styles.cardPressed,
            ]}
          >
            {/* Icon badge */}
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: selected
                    ? accentColor
                    : accentColor + "18",
                },
              ]}
            >
              <IconComponent
                size={28}
                color={selected ? "#FFFFFF" : accentColor}
              />
            </View>

            {/* Text content */}
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardName,
                  selected && { color: accentColor },
                ]}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text
                  style={[
                    styles.cardDescription,
                    selected && styles.cardDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              )}
            </View>

            {/* Selection indicator */}
            <View
              style={[
                styles.radio,
                selected
                  ? [styles.radioSelected, { borderColor: accentColor }]
                  : styles.radioDefault,
              ]}
            >
              {selected && (
                <View
                  style={[
                    styles.radioDot,
                    { backgroundColor: accentColor },
                  ]}
                />
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
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    marginBottom: Spacing.sm + 2,
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

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  cardDescriptionSelected: {
    color: Colors.text.primary,
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  radioDefault: {
    borderColor: Colors.border,
  },
  radioSelected: {
    // borderColor set dynamically
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
