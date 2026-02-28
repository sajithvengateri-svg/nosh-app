import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";

interface ConfidenceIndicatorProps {
  totalSelections: number;
  confidence: number;
  isUsual: boolean;
}

const DOT_COUNT = 5;

/**
 * 5-dot indicator showing learning confidence for a category.
 * Shows "N selections" when low, "Your usual" when confident.
 */
export function ConfidenceIndicator({
  totalSelections,
  confidence,
  isUsual,
}: ConfidenceIndicatorProps) {
  const filledDots = Math.min(DOT_COUNT, Math.round(confidence * DOT_COUNT));

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < filledDots && { backgroundColor: Colors.success },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, isUsual && { color: Colors.success }]}>
        {isUsual ? "Your usual" : `${totalSelections} selections`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dots: {
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
  },
  label: {
    fontSize: 10,
    color: Colors.text.muted,
    fontWeight: "500",
  },
});
