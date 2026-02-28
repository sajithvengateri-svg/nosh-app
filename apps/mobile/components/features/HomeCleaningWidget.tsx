import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeProvider";
import { SprayCan, ChevronRight } from "lucide-react-native";

// ── Simple dashboard card — just navigates to the cleaning page ──────
export function HomeCleaningWidget() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push("/(app)/home-cleaning" as any)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: "#3B82F6" + "12",
        alignItems: "center", justifyContent: "center",
      }}>
        <SprayCan size={16} color="#3B82F6" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Kitchen Cleaning</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>Daily schedule</Text>
      </View>
      <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
    </Pressable>
  );
}
