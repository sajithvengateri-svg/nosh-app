import {
  View,
  Pressable,
  Animated,
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  UIManager,
} from "react-native";
import {
  Mic,
  Camera,
  MessageSquare,
  Ellipsis,
  ShoppingCart,
  House,
  Wine,
  Martini,
  BookOpen,
  CalendarDays,
  Zap,
  Users,
  Store,
  Tag,
  Dna,
  Settings,
  ChevronLeft,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useRef, useCallback, useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface QuickMenuAction {
  icon: React.ComponentType<any>;
  label: string;
  key: string;
}

type MenuLevel = "main" | "more";

const MAIN_ITEMS: QuickMenuAction[] = [
  { icon: Mic, label: "Talk", key: "voice" },
  { icon: Camera, label: "Scan", key: "camera" },
  { icon: MessageSquare, label: "Text", key: "text" },
  { icon: Ellipsis, label: "More", key: "more" },
];

const MORE_ITEMS: QuickMenuAction[] = [
  { icon: ShoppingCart, label: "Shopping", key: "shopping_list" },
  { icon: House, label: "Kitchen", key: "kitchen" },
  { icon: Wine, label: "Cellar", key: "cellar" },
  { icon: Martini, label: "Bar", key: "bar" },
  { icon: BookOpen, label: "Recipes", key: "my_recipes" },
  { icon: CalendarDays, label: "Plan", key: "meal_plan" },
  { icon: Zap, label: "Nosh Run", key: "nosh_run" },
  { icon: Users, label: "Social", key: "social_cooking" },
  { icon: Store, label: "Vendors", key: "vendors" },
  { icon: Tag, label: "Deals", key: "my_deals" },
  { icon: Dna, label: "DNA", key: "nosh_dna" },
  { icon: Settings, label: "Settings", key: "settings" },
];

const BUBBLE_SIZE = 42;
const MORE_BUBBLE_SIZE = 48;
const NOSH_BUBBLE_SIZE = 52;
const MAX_ANIMS = 14;

interface CompanionQuickMenuProps {
  onSelect: (key: string) => void;
  onClose: () => void;
  isSmartNav?: boolean;
}

export function CompanionQuickMenu({
  onSelect,
  onClose,
  isSmartNav = false,
}: CompanionQuickMenuProps) {
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState<MenuLevel>("main");

  const anims = useRef(
    Array.from({ length: MAX_ANIMS }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  const animateIn = useCallback(
    (count: number) => {
      anims.forEach((a) => {
        a.scale.setValue(0);
        a.opacity.setValue(0);
      });
      anims.slice(0, count).forEach((a, i) => {
        Animated.parallel([
          Animated.spring(a.scale, {
            toValue: 1,
            speed: 22,
            bounciness: 10,
            useNativeDriver: true,
            delay: i * 50,
          }),
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: 120,
            delay: i * 50,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [anims],
  );

  useEffect(() => {
    const count = level === "main" ? MAIN_ITEMS.length : MORE_ITEMS.length + 1;
    animateIn(count);
  }, [level, animateIn]);

  const handleTap = useCallback(
    (key: string) => {
      lightTap();
      if (key === "more") {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLevel((prev) => (prev === "main" ? "more" : "main"));
        return;
      }
      onSelect(key);
    },
    [onSelect],
  );

  const handleBack = useCallback(() => {
    lightTap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLevel("main");
  }, []);

  const topOffset = insets.top + 12 + NOSH_BUBBLE_SIZE + 10;
  const isMore = level === "more";
  const items = isMore ? MORE_ITEMS : MAIN_ITEMS;
  const maxScrollH = Dimensions.get("window").height - topOffset - insets.bottom - 20;

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable onPress={(e) => e.stopPropagation()}>
        <View style={[styles.column, { top: topOffset, right: 20 }]}>
          {/* Back button on more level */}
          {isMore && (
            <Animated.View
              style={{
                opacity: anims[0].opacity,
                transform: [{ scale: anims[0].scale }],
                marginBottom: 12,
              }}
            >
              <Pressable onPress={handleBack} style={styles.bubble}>
                <ChevronLeft
                  size={18}
                  color={Colors.text.secondary}
                  strokeWidth={1.5}
                />
              </Pressable>
            </Animated.View>
          )}

          {/* More level: vertical scroll */}
          {isMore ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: maxScrollH - BUBBLE_SIZE - 12 }}
              contentContainerStyle={{ alignItems: "center", gap: 12, paddingBottom: 20 }}
              bounces={false}
            >
              {items.map((item, i) => {
                const Icon = item.icon;
                const animIdx = i + 1;
                return (
                  <Animated.View
                    key={item.key}
                    style={{
                      opacity: anims[animIdx]?.opacity ?? 1,
                      transform: [{ scale: anims[animIdx]?.scale ?? 1 }],
                    }}
                  >
                    <Pressable
                      onPress={() => handleTap(item.key)}
                      style={styles.bubble}
                    >
                      <Icon size={18} color={Colors.text.secondary} strokeWidth={1.5} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          ) : (
            /* Main level: 4 action items */
            items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Animated.View
                  key={item.key}
                  style={{
                    opacity: anims[i].opacity,
                    transform: [{ scale: anims[i].scale }],
                    marginBottom: i < items.length - 1 ? (isSmartNav ? 10 : 12) : 0,
                  }}
                >
                  <Pressable
                    onPress={() => handleTap(item.key)}
                    style={styles.bubble}
                  >
                    <Icon size={18} color={Colors.text.secondary} strokeWidth={1.5} />
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.12)",
    zIndex: 200,
  },
  column: {
    position: "absolute",
    flexDirection: "column",
    alignItems: "center",
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    elevation: 2,
  },
});
