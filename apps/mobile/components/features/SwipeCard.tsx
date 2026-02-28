import { ReactNode, useRef, useMemo } from "react";
import { StyleSheet, Text, View, PanResponder, Animated } from "react-native";

interface SwipeCardProps {
  children: ReactNode;
  index: number;
  totalCards: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const SWIPE_THRESHOLD = 100;

export function SwipeCard({
  children,
  index,
  totalCards,
  onSwipeLeft,
  onSwipeRight,
  onSwipeStart,
  onSwipeEnd,
}: SwipeCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;

  const stackScale = 1 - index * 0.03;
  const stackY = index * 8;

  // Store callbacks in refs so PanResponder always calls the latest version
  const cbRef = useRef({ onSwipeLeft, onSwipeRight, onSwipeStart, onSwipeEnd });
  cbRef.current = { onSwipeLeft, onSwipeRight, onSwipeStart, onSwipeEnd };

  const isTop = index === 0;

  // Recreate PanResponder when index changes so the top card always responds
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          isTop && Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 15,
        onPanResponderGrant: () => {
          cbRef.current.onSwipeStart?.();
        },
        onPanResponderMove: isTop
          ? Animated.event([null, { dx: pan.x }], { useNativeDriver: false })
          : undefined,
        onPanResponderRelease: (_, g) => {
          cbRef.current.onSwipeEnd?.();
          if (!isTop) return;

          // Swipe right → Action
          if (g.dx > SWIPE_THRESHOLD) {
            Animated.timing(pan.x, { toValue: 500, duration: 300, useNativeDriver: true }).start(() => {
              cbRef.current.onSwipeRight?.();
              pan.setValue({ x: 0, y: 0 });
            });
            return;
          }

          // Swipe left → Discard
          if (g.dx < -SWIPE_THRESHOLD) {
            Animated.timing(pan.x, { toValue: -500, duration: 300, useNativeDriver: true }).start(() => {
              cbRef.current.onSwipeLeft?.();
              pan.setValue({ x: 0, y: 0 });
            });
            return;
          }

          // Snap back
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          cbRef.current.onSwipeEnd?.();
        },
      }),
    [isTop, pan]
  );

  const rotate = pan.x.interpolate({
    inputRange: [-200, 200],
    outputRange: ["-15deg", "15deg"],
    extrapolate: "clamp",
  });

  const skipOpacity = pan.x.interpolate({
    inputRange: [-100, -20],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const actionOpacity = pan.x.interpolate({
    inputRange: [20, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.card,
        {
          transform: [
            { translateX: isTop ? pan.x : 0 },
            { translateY: stackY },
            { rotate: isTop ? rotate : "0deg" },
            { scale: stackScale },
          ],
          zIndex: totalCards - index,
          opacity: index < 3 ? 1 : 0,
        },
      ]}
    >
      {children}

      {/* DISCARD overlay */}
      <Animated.View style={[styles.overlay, styles.skipOverlay, { opacity: isTop ? skipOpacity : 0 }]}>
        <Text style={[styles.overlayText, { color: "#DC2626" }]}>DISCARD</Text>
      </Animated.View>

      {/* ACTION overlay */}
      <Animated.View style={[styles.overlay, styles.actionOverlay, { opacity: isTop ? actionOpacity : 0 }]}>
        <Text style={[styles.overlayText, { color: "#6366F1" }]}>ACTION</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  skipOverlay: {
    borderWidth: 3,
    borderColor: "#DC262640",
    backgroundColor: "#DC262610",
  },
  actionOverlay: {
    borderWidth: 3,
    borderColor: "#6366F140",
    backgroundColor: "#6366F110",
  },
  overlayText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
