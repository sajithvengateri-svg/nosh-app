import { useEffect, useRef } from "react";
import { View, Animated, type ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const { colors } = useTheme();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: colors.border,
        opacity,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...style,
      }}
    >
      <Skeleton width={120} height={14} />
      <Skeleton width="60%" height={32} />
      <Skeleton width={80} height={12} />
    </View>
  );
}
