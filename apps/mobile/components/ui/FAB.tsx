import { Pressable, Text } from "react-native";
import { lightTap } from "../../lib/haptics";

interface FABProps {
  onPress: () => void;
  icon?: string;
  color?: string;
}

export function FAB({ onPress, icon = "+", color = "#6366F1" }: FABProps) {
  return (
    <Pressable
      onPress={() => { lightTap(); onPress(); }}
      style={({ pressed }) => ({
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: pressed ? "#4F46E5" : color,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 100,
      })}
    >
      <Text style={{ fontSize: 28, color: "#FFFFFF", fontWeight: "300", marginTop: -2 }}>{icon}</Text>
    </Pressable>
  );
}
