import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { Colors, Glass } from "../../constants/colors";

interface MotivationalBubbleProps {
  text: string;
  emoji?: string;
  onDismiss: () => void;
  duration?: number;
}

const FALLBACK_EMOJIS = ["\u{1F44C}", "\u{1F525}", "\u{2728}", "\u{1F60B}", "\u{1F468}\u200D\u{1F373}", "\u{1F389}", "\u{1F4AA}", "\u{1F31F}"];

export function MotivationalBubble({
  text,
  emoji: emojiProp,
  onDismiss,
  duration = 3000,
}: MotivationalBubbleProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const emoji = useRef(
    emojiProp || FALLBACK_EMOJIS[Math.floor(Math.random() * FALLBACK_EMOJIS.length)]
  ).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <BlurView intensity={20} tint="light" style={styles.blurContainer}>
        <View style={styles.inner}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.text}>{text}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: Glass.shadow.color,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    shadowOpacity: 1,
    elevation: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
  },
  emoji: {
    fontSize: 18,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
});
