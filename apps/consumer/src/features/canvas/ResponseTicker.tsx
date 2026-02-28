import { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Sparkles } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useCompanionStore } from "../../lib/companion/companionStore";
import { lightTap } from "../../lib/haptics";
import type { NoshResponse } from "../../lib/companion/responseTypes";

const { width: SCREEN_W } = Dimensions.get("window");

interface ResponseTickerProps {
  onAction: (action: string, recipeId?: string) => void;
  style?: ViewStyle;
}

/**
 * Ticker strip that shows companion responses as a scrolling horizontal
 * notification bar. Each message slides in from right, pauses, then
 * auto-dismisses. Sits above the input area on the canvas.
 */
export function ResponseTicker({ onAction, style }: ResponseTickerProps) {
  const responseStack = useCompanionStore((s) => s.responseStack);
  const dismissResponse = useCompanionStore((s) => s.dismissResponse);

  if (responseStack.length === 0) return null;

  // Show only the latest response as the active ticker item
  const latest = responseStack[0];

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      <TickerItem
        key={latest.id}
        response={latest}
        onAction={onAction}
        onDismiss={dismissResponse}
      />
      {/* Dot indicators for queued items */}
      {responseStack.length > 1 && (
        <View style={styles.dots}>
          {responseStack.map((r, i) => (
            <View
              key={r.id}
              style={[styles.dot, i === 0 && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function TickerItem({
  response,
  onAction,
  onDismiss,
}: {
  response: NoshResponse;
  onAction: (action: string, recipeId?: string) => void;
  onDismiss: (id: string) => void;
}) {
  const translateX = useRef(new Animated.Value(SCREEN_W * 0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in from right
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        speed: 14,
        bounciness: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after timeout
    const timeout = response.dismissAfter ?? 8000;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -SCREEN_W * 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss(response.id));
    }, timeout);

    return () => clearTimeout(timer);
  }, []);

  const handlePress = useCallback(() => {
    lightTap();
    if (response.action) {
      onAction(response.action, response.recipeId);
    }
    // Dismiss on tap
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss(response.id));
  }, [response, onAction, onDismiss]);

  return (
    <Animated.View
      style={[
        styles.tickerItem,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.tickerInner,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Sparkles size={14} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.tickerText} numberOfLines={2}>
          {response.content}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "stretch",
  },
  tickerItem: {
    borderRadius: 20,
    overflow: "hidden",
  },
  tickerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Glass.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  tickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
    lineHeight: 18,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text.muted,
    opacity: 0.4,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    opacity: 1,
    width: 12,
  },
});
