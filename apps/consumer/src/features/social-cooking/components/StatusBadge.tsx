import { View, Text } from "react-native";
import type { SocialEventStatus } from "../../../lib/stores/socialCookingStore";
import { getStatusLabel, getStatusColor } from "../../../lib/utils/socialCookingUtils";

export function StatusBadge({ status }: { status: SocialEventStatus }) {
  const color = getStatusColor(status);

  return (
    <View
      style={{
        backgroundColor: color + "18",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color }}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}
