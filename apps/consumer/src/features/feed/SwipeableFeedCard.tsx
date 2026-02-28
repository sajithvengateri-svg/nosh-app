import { useRef } from "react";
import { View, Text, Pressable, Animated, PanResponder, Dimensions, StyleSheet } from "react-native";
import { Heart, X } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { selectionTap, successNotification, lightTap } from "../../lib/haptics";
import { FeedCard } from "./FeedCard";
import type { FeedCardItem } from "./FeedCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 15;

interface SwipeableFeedCardProps {
  item: FeedCardItem;
  onSwipeRight: (item: FeedCardItem) => void;
  onSwipeLeft: (item: FeedCardItem) => void;
  onOpenOverlay?: (key: string) => void;
  onCardTap?: (item: FeedCardItem) => void;
}

export function SwipeableFeedCard({
  item,
  onSwipeRight,
  onSwipeLeft,
  onOpenOverlay,
  onCardTap,
}: SwipeableFeedCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const passedThreshold = useRef(false);
  const didSwipe = useRef(false);

  const rotation = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [`-${ROTATION_FACTOR}deg`, "0deg", `${ROTATION_FACTOR}deg`],
  });
  const saveOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        didSwipe.current = true;
        pan.setValue({ x: g.dx, y: 0 });

        if (!passedThreshold.current && Math.abs(g.dx) > SWIPE_THRESHOLD * 0.5) {
          passedThreshold.current = true;
          selectionTap();
        }
        if (passedThreshold.current && Math.abs(g.dx) < SWIPE_THRESHOLD * 0.3) {
          passedThreshold.current = false;
        }
      },
      onPanResponderRelease: (_, g) => {
        passedThreshold.current = false;

        if (g.dx > SWIPE_THRESHOLD || g.vx > 0.5) {
          successNotification();
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH + 100, y: 0 },
            duration: 250,
            useNativeDriver: true,
          }).start(() => onSwipeRight(item));
        } else if (g.dx < -SWIPE_THRESHOLD || g.vx < -0.5) {
          lightTap();
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
            duration: 250,
            useNativeDriver: true,
          }).start(() => onSwipeLeft(item));
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            speed: 20,
            bounciness: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [
          { translateX: pan.x },
          { rotate: rotation },
        ],
      }}
    >
      {/* Save badge (right swipe) */}
      <Animated.View style={[styles.badge, styles.saveBadge, { opacity: saveOpacity }]}>
        <View style={[styles.badgeInner, styles.saveBadgeInner]}>
          <Heart size={18} color={Colors.success} strokeWidth={1.75} />
          <Text style={[styles.badgeText, { color: Colors.success }]}>SAVE</Text>
        </View>
      </Animated.View>

      {/* Nope badge (left swipe) */}
      <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
        <View style={[styles.badgeInner, styles.nopeBadgeInner]}>
          <X size={18} color="#E53935" strokeWidth={1.75} />
          <Text style={[styles.badgeText, { color: "#E53935" }]}>NOPE</Text>
        </View>
      </Animated.View>

      {/* Actual card */}
      <Pressable
        onPress={() => {
          if (!didSwipe.current && onCardTap) {
            lightTap();
            onCardTap(item);
          }
          didSwipe.current = false;
        }}
      >
        <FeedCard item={item} onOpenOverlay={onOpenOverlay} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 16,
    zIndex: 10,
  },
  saveBadge: {
    right: 16,
  },
  nopeBadge: {
    left: 16,
  },
  badgeInner: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "rgba(0,0,0,0.10)",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  saveBadgeInner: {
    borderColor: "rgba(91, 163, 122, 0.3)",
    backgroundColor: "rgba(91, 163, 122, 0.08)",
  },
  nopeBadgeInner: {
    borderColor: "rgba(229, 57, 53, 0.3)",
    backgroundColor: "rgba(229, 57, 53, 0.06)",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
