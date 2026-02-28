import { useRef, useCallback, useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../contexts/ThemeProvider";
import { useAppSettings } from "../../hooks/useAppSettings";
import {
  LayoutDashboard,
  BookOpen,
  UtensilsCrossed,
  ClipboardList,
  ShieldCheck,
  Camera,
  Sparkles,
  Gamepad2,
  Bot,
  type LucideIcon,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface WalkthroughCard {
  icon: LucideIcon;
  color: string;
  title: string;
  description: string;
}

const CARDS: WalkthroughCard[] = [
  {
    icon: LayoutDashboard,
    color: "#6366F1",
    title: "Your Home Base",
    description:
      "Stats, companion widget, and daily tasks at a glance. Everything you need on one screen.",
  },
  {
    icon: BookOpen,
    color: "#F59E0B",
    title: "My Recipes",
    description:
      "Save, organise, and cost your recipes. Import from photos or type them in.",
  },
  {
    icon: UtensilsCrossed,
    color: "#10B981",
    title: "My Kitchen",
    description:
      "Prep lists, pantry tracking, equipment, and your kitchen calendar — all in one place.",
  },
  {
    icon: ClipboardList,
    color: "#3B82F6",
    title: "To Do",
    description:
      "Your daily task hub — kanban boards, shopping lists, and smart suggestions to keep you on track.",
  },
  {
    icon: ShieldCheck,
    color: "#EF4444",
    title: "Food Safety",
    description:
      "Temperature logs, cleaning schedules, training records, and handy cheatsheets.",
  },
  {
    icon: Camera,
    color: "#8B5CF6",
    title: "Invoice Scanner",
    description:
      "Scan dockets, invoices, and labels with your camera. Let AI do the data entry.",
  },
  {
    icon: Sparkles,
    color: "#EC4899",
    title: "Housekeeping",
    description:
      "Cleaning schedules, maintenance logs, and hygiene checklists to keep your kitchen spotless.",
  },
  {
    icon: Gamepad2,
    color: "#F97316",
    title: "Games",
    description:
      "Earn XP, climb leagues, and unlock achievements as you cook and learn.",
  },
  {
    icon: Bot,
    color: "#06B6D4",
    title: "Your AI Buddy",
    description:
      "Ask for recipe ideas, meal plans, and cooking tips. Your companion grows smarter with you.",
  },
];

export default function FeatureWalkthroughScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateSetting } = useAppSettings();
  const flatListRef = useRef<FlatList>(null);
  const currentIndex = useRef(0);

  const finish = useCallback(() => {
    updateSetting("hasSeenWalkthrough", true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(app)/(tabs)/dashboard");
  }, [updateSetting, router]);

  const goNext = useCallback(() => {
    if (currentIndex.current < CARDS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: currentIndex.current + 1,
        animated: true,
      });
    }
  }, []);

  const handleSkip = useCallback(() => {
    updateSetting("hasSeenWalkthrough", true);
    router.replace("/(app)/(tabs)/dashboard");
  }, [updateSetting, router]);

  const renderItem = useCallback(
    ({ item, index }: { item: WalkthroughCard; index: number }) => {
      const Icon = item.icon;
      const isLast = index === CARDS.length - 1;
      return (
        <View
          style={{
            width: SCREEN_WIDTH,
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: item.color + "18",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <Icon size={52} color={item.color} strokeWidth={1.5} />
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: colors.text,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            {item.title}
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 24,
              maxWidth: 300,
              marginBottom: 48,
            }}
          >
            {item.description}
          </Text>

          <Pressable
            onPress={isLast ? finish : goNext}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              paddingHorizontal: 36,
              paddingVertical: 16,
              borderRadius: 14,
              opacity: pressed ? 0.85 : 1,
              minWidth: 180,
              alignItems: "center",
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#FFFFFF" }}>
              {isLast ? "Get Started" : "Next"}
            </Text>
          </Pressable>
        </View>
      );
    },
    [colors, finish, goNext]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Skip button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={handleSkip} hitSlop={12} style={{ padding: 4 }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={CARDS}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          currentIndex.current = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={{ flex: 1 }}
      />

      {/* Page dots */}
      <PageDots
        total={CARDS.length}
        currentIndex={currentIndex}
        colors={colors}
      />
    </SafeAreaView>
  );
}

function PageDots({
  total,
  currentIndex,
  colors,
}: {
  total: number;
  currentIndex: React.MutableRefObject<number>;
  colors: any;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(currentIndex.current);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        paddingBottom: 24,
        paddingTop: 16,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= active ? colors.accent : colors.border,
          }}
        />
      ))}
    </View>
  );
}
