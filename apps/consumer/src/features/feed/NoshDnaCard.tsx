import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors, Spacing } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface NoshDnaCardData {
  oldConfidence: number;
  newConfidence: number;
  achievementKey?: string;
  achievementEmoji?: string;
  achievementLabel?: string;
}

export default function NoshDnaCard({
  data,
  onOpenOverlay,
}: {
  data: NoshDnaCardData;
  onOpenOverlay?: (key: string) => void;
}) {
  const oldPct = Math.round(data.oldConfidence * 100);
  const newPct = Math.round(data.newConfidence * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Your Nosh DNA Updated!</Text>

      <Text style={styles.confidence}>
        Confidence: {oldPct}% → {newPct}%
      </Text>

      {data.achievementKey && (
        <View style={styles.achievementRow}>
          <Text style={styles.achievementEmoji}>
            {data.achievementEmoji ?? "🏆"}
          </Text>
          <Text style={styles.achievementLabel}>
            {data.achievementLabel ?? data.achievementKey} unlocked!
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => {
          lightTap();
          onOpenOverlay?.("nosh_dna");
        }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>View Your DNA</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 0,
    shadowColor: "rgba(217, 72, 120, 0.08)",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  confidence: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  achievementEmoji: {
    fontSize: 18,
  },
  achievementLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  button: {
    backgroundColor: "rgba(217, 72, 120, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(217, 72, 120, 0.20)",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  pressed: {
    backgroundColor: "rgba(217, 72, 120, 0.18)",
  },
});
