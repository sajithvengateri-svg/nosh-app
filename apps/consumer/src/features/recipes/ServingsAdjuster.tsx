import { View, Text, Pressable, StyleSheet } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { Fonts, FontSizes } from "../../constants/typography";
import { lightTap } from "../../lib/haptics";

interface ServingsAdjusterProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}

export function ServingsAdjuster({
  value,
  onChange,
  min = 1,
  max = 12,
}: ServingsAdjusterProps) {
  const handleDecrease = () => {
    if (value <= min) return;
    lightTap();
    onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value >= max) return;
    lightTap();
    onChange(value + 1);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleDecrease}
        style={[styles.button, value <= min && styles.buttonDisabled]}
      >
        <Minus
          size={14}
          color={value <= min ? Colors.text.muted : Colors.text.primary}
          strokeWidth={2}
        />
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        onPress={handleIncrease}
        style={[styles.button, value >= max && styles.buttonDisabled]}
      >
        <Plus
          size={14}
          color={value >= max ? Colors.text.muted : Colors.text.primary}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
    fontWeight: "700",
    color: Colors.text.primary,
    minWidth: 22,
    textAlign: "center",
  },
});
