import { View, Text, Pressable } from "react-native";
import { TriangleAlert } from "lucide-react-native";
import { Colors } from "../../constants/colors";

export interface ExpiryAlertCardData {
  id: string;
  items: { name: string; expiry_date: string; days_left: number }[];
}

export function ExpiryAlertCard({ data }: { data: ExpiryAlertCardData }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(232, 169, 62, 0.05)",
        borderRadius: 24,
        padding: 18,
        marginHorizontal: 0,
        marginBottom: 0,
        borderWidth: 1.5,
        borderColor: "rgba(232, 169, 62, 0.20)",
        shadowColor: "rgba(232, 169, 62, 0.08)",
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Type pill */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: "rgba(232, 169, 62, 0.10)",
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(232, 169, 62, 0.18)",
          }}
        >
          <TriangleAlert size={13} color={Colors.alert} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 11,
              color: Colors.alert,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Expiring Soon
          </Text>
        </View>
      </View>

      {data.items.map((item, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: Colors.divider,
          }}
        >
          <Text style={{ fontSize: 15, color: Colors.text.primary, fontWeight: "500" }}>
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: item.days_left <= 1 ? "#D32F2F" : Colors.alert,
              fontWeight: "600",
            }}
          >
            {item.days_left === 0
              ? "Today!"
              : item.days_left === 1
              ? "Tomorrow"
              : `${item.days_left} days`}
          </Text>
        </View>
      ))}

      <Pressable
        style={({ pressed }) => ({
          marginTop: 12,
          paddingVertical: 13,
          backgroundColor: pressed ? "rgba(232, 169, 62, 0.12)" : "rgba(232, 169, 62, 0.06)",
          borderWidth: 1,
          borderColor: "rgba(232, 169, 62, 0.20)",
          borderRadius: 16,
          alignItems: "center" as any,
        })}
      >
        <Text style={{ color: Colors.alert, fontSize: 15, fontWeight: "700" }}>
          Find Recipes Using These
        </Text>
      </Pressable>
    </View>
  );
}
