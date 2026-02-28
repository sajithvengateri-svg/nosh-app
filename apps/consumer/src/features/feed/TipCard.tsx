import { View, Text } from "react-native";
import { Lightbulb } from "lucide-react-native";
import { Colors } from "../../constants/colors";

export interface TipCardData {
  id: string;
  title: string;
  body?: string;
  emoji?: string;
}

export function TipCard({ tip }: { tip: TipCardData }) {
  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 0,
        marginBottom: 0,
        borderWidth: 1.5,
        borderColor: Colors.border,
        shadowColor: "rgba(217, 72, 120, 0.08)",
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Type pill */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: "rgba(232, 169, 62, 0.08)",
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(232, 169, 62, 0.15)",
          }}
        >
          <Lightbulb size={13} color={Colors.alert} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 11,
              color: Colors.alert,
              textTransform: "uppercase",
              fontWeight: "700",
              letterSpacing: 0.8,
            }}
          >
            Quick Tip
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 16,
          color: Colors.text.primary,
          lineHeight: 23,
          fontWeight: "600",
        }}
      >
        {tip.title}
      </Text>
      {tip.body && (
        <Text
          style={{
            fontSize: 14,
            color: Colors.text.secondary,
            lineHeight: 20,
            marginTop: 6,
          }}
        >
          {tip.body}
        </Text>
      )}
    </View>
  );
}
