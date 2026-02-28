import { useRef, useEffect, useCallback } from "react";
import {
  View,
  Pressable,
  Animated,
  ScrollView,
  PanResponder,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { FeedCard } from "./FeedCard";
import { CardActionBar } from "./CardActionBar";
import type { FeedCardItem } from "./FeedCard";
import type { RecipeCardData } from "./RecipeCard";

interface CardDetailOverlayProps {
  item: FeedCardItem | null;
  onClose: () => void;
  onOpenOverlay: (key: string) => void;
}

export function CardDetailOverlay({
  item,
  onClose,
  onOpenOverlay,
}: CardDetailOverlayProps) {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (item) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      translateY.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 30,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [item]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [onClose, scaleAnim, opacityAnim]);

  // Pull-down-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 15 && g.dy > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
          // Scale down slightly as you drag
          const progress = Math.min(g.dy / 300, 1);
          scaleAnim.setValue(1 - progress * 0.1);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          dismiss();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              speed: 30,
              bounciness: 6,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              speed: 30,
              bounciness: 6,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  if (!item) return null;

  const isRecipe = item.type === "recipe";
  const recipeData = isRecipe ? (item.data as RecipeCardData) : null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}>
      {/* Backdrop */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </View>

      {/* Card content */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardContainer,
          {
            paddingTop: insets.top + 20,
            paddingBottom: isRecipe ? 120 : insets.bottom + 20,
            transform: [{ scale: scaleAnim }, { translateY }],
          },
        ]}
      >
        {/* Close button */}
        <Pressable
          onPress={() => {
            lightTap();
            dismiss();
          }}
          style={[styles.closeButton, { top: insets.top + 24 }]}
        >
          <View style={[styles.closeGlass, styles.closeInner]}>
            <X size={16} color={Colors.text.secondary} strokeWidth={2} />
          </View>
        </Pressable>

        {/* Scrollable card */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.cardWrapper}>
            <FeedCard
              item={item}
              onOpenOverlay={onOpenOverlay}
            />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Action bar — recipe cards only */}
      {isRecipe && recipeData && (
        <CardActionBar
          recipeId={recipeData.id}
          recipeTitle={recipeData.title}
          cuisine={recipeData.cuisine}
          totalTime={recipeData.total_time_minutes}
          chefName={recipeData.chef_name}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Glass.shadow.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 20,
  },
  closeGlass: {
    borderRadius: 16,
    overflow: "hidden",
  },
  closeInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
});
