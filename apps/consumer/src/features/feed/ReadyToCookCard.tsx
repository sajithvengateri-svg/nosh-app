import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { X, CircleCheck } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useFeedStore } from "../../lib/stores/feedStore";

export interface ReadyToCookCardData {
  recipeId: string;
  recipeTitle: string;
  basketTotal: number;
}

export function ReadyToCookCard({ data }: { data: ReadyToCookCardData }) {
  const dismissCard = useFeedStore((s) => s.dismissCard);

  const handleCookNow = () => {
    lightTap();
    router.push(`/(app)/cook-mode/${data.recipeId}`);
  };

  const handleDismiss = () => {
    dismissCard(`ready_to_cook_${data.recipeId}`);
  };

  return (
    <View
      style={{
        backgroundColor: "rgba(91, 163, 122, 0.06)",
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: "rgba(91, 163, 122, 0.20)",
        overflow: "hidden",
        shadowColor: "rgba(91, 163, 122, 0.10)",
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Dismiss button */}
      <Pressable
        onPress={handleDismiss}
        hitSlop={8}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: Colors.card,
          borderWidth: 1,
          borderColor: Colors.border,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <X size={14} color={Colors.text.muted} strokeWidth={1.5} />
      </Pressable>

      <View style={{ padding: 24, alignItems: "center" }}>
        <View style={{ marginBottom: 10 }}>
          <CircleCheck size={40} color={Colors.success} strokeWidth={1.5} />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: Colors.success,
            marginBottom: 4,
          }}
        >
          Ready to Cook!
        </Text>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: Colors.text.primary,
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          {data.recipeTitle}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: Colors.text.secondary,
            marginBottom: 20,
          }}
        >
          Your basket: ${data.basketTotal.toFixed(2)}
        </Text>

        <Pressable
          onPress={handleCookNow}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "rgba(91, 163, 122, 0.15)" : "rgba(91, 163, 122, 0.08)",
            borderWidth: 1,
            borderColor: "rgba(91, 163, 122, 0.25)",
            paddingVertical: 13,
            paddingHorizontal: 48,
            borderRadius: 16,
            width: "100%" as any,
          })}
        >
          <Text
            style={{
              color: Colors.success,
              fontSize: 15,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Cook Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
