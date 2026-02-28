import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Utensils, ChevronRight, AlertTriangle } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";

export interface LeftoverCardData {
  sourceRecipeTitle: string;
  portionsRemaining: number;
  suggestionCount: number;
  isExpiringSoon: boolean;
}

export function LeftoverCard({ data }: { data: LeftoverCardData }) {
  return (
    <Pressable
      onPress={() => {
        lightTap();
        router.push("/(app)/leftovers");
      }}
      style={styles.card}
    >
      <View style={[styles.iconWrap, data.isExpiringSoon && { backgroundColor: `${Colors.alert}15` }]}>
        {data.isExpiringSoon ? (
          <AlertTriangle size={22} color={Colors.alert} strokeWidth={2} />
        ) : (
          <Utensils size={22} color={Colors.primary} strokeWidth={1.8} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {data.portionsRemaining} leftover portion{data.portionsRemaining !== 1 ? "s" : ""}
        </Text>
        <Text style={styles.subtitle}>
          From {data.sourceRecipeTitle}
          {data.suggestionCount > 0 && ` · ${data.suggestionCount} recipe idea${data.suggestionCount !== 1 ? "s" : ""}`}
        </Text>
        {data.isExpiringSoon && (
          <Text style={styles.urgentText}>Use soon</Text>
        )}
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
  urgentText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.alert,
    marginTop: 4,
  },
});
