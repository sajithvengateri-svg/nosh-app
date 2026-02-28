import { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { Colors, Glass } from "../../../constants/colors";
import {
  getPersonalityIcon,
  getPersonalityLabel,
} from "../../../lib/engines/personalityEngine";

// Personality descriptions for the reveal
const DESCRIPTIONS: Record<string, string> = {
  humpday_nosher:
    "You plan midweek, shop casually, and cook with quiet confidence. Tuesday's stir-fry is your love language.",
  weekend_warrior:
    "You save your energy for Saturday morning. One big shop, one big cook — and you're set for the week.",
  thrill_seeker:
    "5pm, nearest shop, 15 minutes flat. You thrive on speed and simplicity. Less is more.",
  ocd_planner:
    "Spreadsheets, batch prep, and zero food waste. Your kitchen runs like a well-oiled machine.",
};

const ACCENT_COLORS: Record<string, string> = {
  humpday_nosher: "#E8A93E",
  weekend_warrior: "#4A90D9",
  thrill_seeker: "#E85D75",
  ocd_planner: "#6B8E6B",
};

interface PersonalityRevealCardProps {
  personalityType: string;
  confidence: number;
  secondary?: string | null;
}

export function PersonalityRevealCard({
  personalityType,
  confidence,
  secondary,
}: PersonalityRevealCardProps) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 6,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const Icon = getPersonalityIcon(personalityType as any);
  const label = getPersonalityLabel(personalityType as any);
  const description = DESCRIPTIONS[personalityType] ?? "";
  const accent = ACCENT_COLORS[personalityType] ?? Colors.primary;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ scale }] }]}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: accent + "20" }]}>
        {Icon && <Icon size={48} color={accent} strokeWidth={1.5} />}
      </View>

      {/* Type label */}
      <Text style={styles.typeLabel}>{label}</Text>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Confidence bar */}
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Confidence</Text>
        <View style={styles.confidenceTrack}>
          <View
            style={[
              styles.confidenceFill,
              {
                width: `${Math.round(confidence * 100)}%`,
                backgroundColor: accent,
              },
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>
          {Math.round(confidence * 100)}%
        </Text>
      </View>

      {/* Secondary */}
      {secondary && (
        <Text style={styles.secondaryText}>
          With a touch of {getPersonalityLabel(secondary as any)}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  typeLabel: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  confidenceContainer: {
    width: "100%",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 12,
    color: Colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  confidenceTrack: {
    width: "80%",
    height: 6,
    borderRadius: 3,
    backgroundColor: Glass.surface,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  secondaryText: {
    fontSize: 14,
    color: Colors.text.muted,
    fontStyle: "italic",
    textAlign: "center",
  },
});
