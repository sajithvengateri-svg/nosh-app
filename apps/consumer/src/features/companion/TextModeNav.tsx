import { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
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
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useCompanionStore } from "../../lib/companion/companionStore";

const { width: SW } = Dimensions.get("window");

interface NavItem {
  label: string;
  icon: React.ComponentType<any>;
  key: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Shopping", icon: ShoppingCart, key: "shopping_list" },
  { label: "Kitchen", icon: House, key: "kitchen" },
  { label: "Cellar", icon: Wine, key: "cellar" },
  { label: "Bar", icon: Martini, key: "bar" },
  { label: "Recipes", icon: BookOpen, key: "my_recipes" },
  { label: "Plan", icon: CalendarDays, key: "meal_plan" },
  { label: "Nosh Run", icon: Zap, key: "nosh_run" },
  { label: "Social", icon: Users, key: "social_cooking" },
  { label: "Vendors", icon: Store, key: "vendors" },
  { label: "My Deals", icon: Tag, key: "my_deals" },
  { label: "Nosh DNA", icon: Dna, key: "nosh_dna" },
  { label: "Settings", icon: Settings, key: "settings" },
];

const COLUMNS = 4;
const GAP = 14;
const PADDING = 20;
const BUBBLE_SIZE = 48;
const ITEM_WIDTH = (SW - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

interface TextModeNavProps {
  onSelect: (key: string) => void;
}

export function TextModeNav({ onSelect }: TextModeNavProps) {
  const textNavVisible = useCompanionStore((s) => s.textNavVisible);
  const setCommunicationMode = useCompanionStore((s) => s.setCommunicationMode);

  if (!textNavVisible) return null;

  return (
    <TextModeNavInner
      onSelect={(key) => {
        lightTap();
        setCommunicationMode("idle");
        onSelect(key);
      }}
    />
  );
}

function TextModeNavInner({ onSelect }: TextModeNavProps) {
  const anims = useRef(
    NAV_ITEMS.map(() => ({
      translateY: new Animated.Value(30),
      opacity: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.parallel([
        Animated.spring(a.translateY, {
          toValue: 0,
          speed: 20,
          bounciness: 8,
          useNativeDriver: true,
          delay: i * 30,
        }),
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 150,
          delay: i * 30,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  // Build rows
  const rows: NavItem[][] = [];
  for (let i = 0; i < NAV_ITEMS.length; i += COLUMNS) {
    rows.push(NAV_ITEMS.slice(i, i + COLUMNS));
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    >
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((item, colIdx) => {
            const flatIdx = rowIdx * COLUMNS + colIdx;
            const Icon = item.icon;
            return (
              <Animated.View
                key={item.key}
                style={[
                  styles.itemWrapper,
                  {
                    opacity: anims[flatIdx].opacity,
                    transform: [{ translateY: anims[flatIdx].translateY }],
                  },
                ]}
              >
                <Pressable
                  onPress={() => onSelect(item.key)}
                  style={styles.bubble}
                >
                  <Icon
                    size={20}
                    color={Colors.text.secondary}
                    strokeWidth={1.5}
                  />
                </Pressable>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 280,
  },
  grid: {
    paddingHorizontal: PADDING,
    paddingTop: 12,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
    marginBottom: GAP,
  },
  itemWrapper: {
    width: ITEM_WIDTH,
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
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text.muted,
    marginTop: 6,
    textAlign: "center",
  },
});
