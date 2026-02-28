import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { TrendingUp, ChevronRight } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface SavingsCardData {
  weekSavings: number;
  mealsCookedThisWeek: number;
}

export function SavingsCard({ data }: { data: SavingsCardData }) {
  return (
    <Pressable
      onPress={() => {
        lightTap();
        router.push("/(app)/savings");
      }}
      style={styles.card}
    >
      <View style={styles.iconWrap}>
        <TrendingUp size={22} color={Colors.success} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          ${data.weekSavings.toFixed(0)} saved this week
        </Text>
        <Text style={styles.subtitle}>
          {data.mealsCookedThisWeek} meal{data.mealsCookedThisWeek !== 1 ? "s" : ""} cooked at home
        </Text>
      </View>
      <ChevronRight size={20} color={Colors.text.muted} strokeWidth={1.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.success}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
