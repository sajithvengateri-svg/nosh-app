import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCompanionStore } from "../../lib/companion/companionStore";
import { ResponseCard } from "./ResponseCard";

interface ResponseStackProps {
  onAction: (action: string, recipeId?: string) => void;
}

export function ResponseStack({ onAction }: ResponseStackProps) {
  const insets = useSafeAreaInsets();
  const responseStack = useCompanionStore((s) => s.responseStack);
  const dismissResponse = useCompanionStore((s) => s.dismissResponse);

  if (responseStack.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 80 }]}
      pointerEvents="box-none"
    >
      {responseStack.map((response) => (
        <View key={response.id} style={styles.cardWrapper}>
          <ResponseCard
            response={response}
            onAction={onAction}
            onDismiss={dismissResponse}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    gap: 10,
    zIndex: 90,
  },
  cardWrapper: {
    alignItems: "flex-start",
  },
});
