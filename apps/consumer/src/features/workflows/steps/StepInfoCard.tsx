/**
 * StepInfoCard — Read-only informational step
 *
 * Large centered icon/emoji, title, and body text.
 * No interaction required; Continue button shows "Let's Go" or "Next".
 */

import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import { Colors, Glass, BorderRadius, Spacing } from "../../../constants/colors";
import type { WorkflowStep } from "../types";

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

export function StepInfoCard({ step }: Props) {
  const options = step.options ?? [];
  // Use first option for icon/content, or fall back to step fields
  const infoOption = options[0];
  const iconName = infoOption?.icon;
  const IconComponent = resolveIcon(iconName);

  // If the option label looks like an emoji (starts with non-ASCII), render it as text
  const isEmoji =
    iconName && /^[\u{1F000}-\u{1FFFF}]/u.test(iconName);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon or Emoji */}
        {isEmoji ? (
          <Text style={styles.emoji}>{iconName}</Text>
        ) : IconComponent ? (
          <View style={styles.iconCircle}>
            <IconComponent size={44} color={Colors.primary} />
          </View>
        ) : infoOption?.label ? (
          // Check if label itself is emoji-like
          <Text style={styles.emoji}>
            {/^[\u{1F000}-\u{1FFFF}]/u.test(infoOption.label)
              ? infoOption.label
              : ""}
          </Text>
        ) : null}

        {/* Title — use question as main title for info cards */}
        {infoOption?.label && !/^[\u{1F000}-\u{1FFFF}]/u.test(infoOption.label) && (
          <Text style={styles.title}>{infoOption.label}</Text>
        )}

        {/* Body text */}
        {infoOption?.description && (
          <Text style={styles.body}>{infoOption.description}</Text>
        )}
      </View>
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

  card: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    width: "100%",
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    elevation: 3,
  },

  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Glass.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },

  body: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: Spacing.sm,
  },
});
