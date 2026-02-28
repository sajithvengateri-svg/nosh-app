/**
 * StepGridSelect — 2-column or 3-column grid of square-ish cards
 *
 * Each card displays a color swatch or icon + label.
 * Glass surface with accent highlight on selection.
 * Great for theme pickers, cuisine grids, etc.
 */

import React from "react";
import {
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = Spacing.lg;
const GRID_GAP = Spacing.sm;

interface Props {
  step: WorkflowStep;
  value: any;
  onChange: (value: any) => void;
}

/** Resolve a lucide icon name string to a component */
function resolveIcon(name?: string): React.ComponentType<any> | null {
  if (!name) return null;
  const pascal = name
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  return (LucideIcons as Record<string, any>)[pascal] ?? null;
}

export function StepGridSelect({ step, value, onChange }: Props) {
  const options = step.options ?? [];

  // Use 3 columns for 6+ items, 2 columns otherwise
  const columns = options.length >= 6 ? 3 : 2;
  const cardWidth =
    (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (columns - 1)) / columns;

  const handleSelect = (optionValue: string) => {
    lightTap();
    onChange(optionValue);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {options.map((option) => {
        const selected = value === option.value;
        const IconComponent = resolveIcon(option.icon);
        const swatchColor = option.color ?? Colors.primary;

        return (
          <Pressable
            key={option.value}
            onPress={() => handleSelect(option.value)}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth, height: cardWidth },
              selected ? styles.cardSelected : styles.cardDefault,
              selected && { borderColor: swatchColor },
              pressed && styles.cardPressed,
            ]}
          >
            {/* Color swatch or icon */}
            {IconComponent ? (
              <IconComponent
                size={28}
                color={selected ? swatchColor : Colors.text.secondary}
                style={styles.cardIcon}
              />
            ) : option.color ? (
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: swatchColor },
                  selected && styles.swatchSelected,
                ]}
              />
            ) : null}

            <Text
              style={[
                styles.cardLabel,
                selected && { color: swatchColor },
              ]}
              numberOfLines={2}
            >
              {option.label}
            </Text>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingBottom: Spacing.lg,
  },

  card: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    padding: Spacing.sm,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 2,
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
    transform: [{ scale: 0.96 }],
  },

  cardIcon: {
    marginBottom: Spacing.sm,
  },

  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 1,
    elevation: 4,
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.secondary,
    textAlign: "center",
    lineHeight: 18,
  },
});
