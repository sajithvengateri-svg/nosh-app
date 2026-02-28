import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Zap, ChevronRight } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface NoshPlusCardData {
  headline?: string;
  subtext?: string;
}

export function NoshPlusCard({ data }: { data: NoshPlusCardData }) {
  return (
    <Pressable
      onPress={() => {
        lightTap();
        router.push("/(app)/nosh-plus");
      }}
      style={styles.card}
    >
      <View style={styles.iconWrap}>
        <Zap size={22} color={Colors.primary} strokeWidth={2} fill={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{data.headline ?? "Upgrade to NOSH+"}</Text>
        <Text style={styles.subtitle}>
          {data.subtext ?? "Autopilot planning, savings tracking, leftover intelligence"}
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
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}10`,
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
    lineHeight: 17,
  },
});
