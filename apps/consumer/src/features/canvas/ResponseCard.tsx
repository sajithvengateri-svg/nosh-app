import { useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, Animated, Linking, StyleSheet } from "react-native";
import { Image } from "expo-image";
import {
  Sparkles,
  Timer,
  ShoppingCart,
  CalendarDays,
  ChevronRight,
  ArrowRight,
  Tag,
  Percent,
  Lightbulb,
  Users,
  Wallet,
  ChefHat,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import type { NoshResponse } from "../../lib/companion/responseTypes";

// ── Icon resolver ─────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  sparkles: Sparkles,
  timer: Timer,
  shopping_cart: ShoppingCart,
  calendar: CalendarDays,
  tag: Tag,
  percent: Percent,
  lightbulb: Lightbulb,
  users: Users,
  wallet: Wallet,
  chef_hat: ChefHat,
};

function ResponseIcon({ name, size = 18 }: { name?: string; size?: number }) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} color={Colors.text.primary} strokeWidth={1.75} />;
}

// ── Main Component ────────────────────────────────────────────────

interface ResponseCardProps {
  response: NoshResponse;
  onAction: (action: string, recipeId?: string) => void;
  onDismiss: (id: string) => void;
}

export function ResponseCard({ response, onAction, onDismiss }: ResponseCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // ── Enter animation ──
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle float
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 2,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    float.start();

    // Auto-dismiss
    const timeout = response.dismissAfter ?? 10000;
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onDismiss(response.id));
    }, timeout);

    return () => {
      clearTimeout(timer);
      float.stop();
    };
  }, []);

  const handlePressIn = useCallback(() => {
    lightTap();
    Animated.spring(scaleAnim, {
      toValue: 1.08,
      speed: 50,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = useCallback(() => {
    if (response.linkUrl) {
      Linking.openURL(response.linkUrl);
    } else if (response.action) {
      onAction(response.action, response.recipeId);
    }
  }, [response, onAction]);

  // ── Render by type ──
  const renderContent = () => {
    switch (response.type) {
      case "pill":
        return (
          <View style={styles.pillContent}>
            <ResponseIcon name={response.icon} />
            <Text style={styles.pillText}>{response.content}</Text>
          </View>
        );

      case "bubble":
        return (
          <View style={styles.bubbleContent}>
            <Text style={styles.bubbleNumber}>{response.number}</Text>
            <Text style={styles.bubbleLabel}>{response.content}</Text>
          </View>
        );

      case "card":
        return (
          <View style={styles.cardContent}>
            {response.imageUrl && (
              <Image
                source={{ uri: response.imageUrl }}
                style={styles.cardImage}
                contentFit="cover"
              />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{response.content}</Text>
              {response.subtitle && (
                <Text style={styles.cardSubtitle}>{response.subtitle}</Text>
              )}
            </View>
          </View>
        );

      case "media":
        return (
          <View style={styles.mediaContent}>
            {response.imageUrl && (
              <Image
                source={{ uri: response.imageUrl }}
                style={styles.mediaImage}
                contentFit="cover"
              />
            )}
            <Text style={styles.cardTitle}>{response.content}</Text>
          </View>
        );

      case "link":
        return (
          <View style={styles.linkContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{response.content}</Text>
              {response.subtitle && (
                <Text style={styles.linkUrl} numberOfLines={1}>
                  {response.subtitle}
                </Text>
              )}
            </View>
            <ChevronRight size={18} color={Colors.text.muted} strokeWidth={1.75} />
          </View>
        );

      case "action":
        return (
          <View style={styles.actionContent}>
            <ResponseIcon name={response.icon} size={20} />
            <Text style={styles.actionText}>{response.content}</Text>
            <ArrowRight size={18} color={Colors.primary} strokeWidth={1.75} />
          </View>
        );

      default:
        return null;
    }
  };

  const isCircle = response.type === "bubble";
  const isPill = response.type === "pill" || response.type === "action";

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY: Animated.add(translateY, floatAnim) },
          { scale: scaleAnim },
        ],
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.glassOuter,
            styles.glassInner,
            isCircle && styles.circleOuter,
            isCircle && styles.circleInner,
            isPill && styles.pillOuter,
            isPill && styles.pillInnerStyle,
            response.type === "action" && styles.actionOuter,
            response.type === "action" && styles.actionInner,
          ]}
        >
          {renderContent()}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Glass base
  glassOuter: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Glass.shadow.color,
    shadowOpacity: 1,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    elevation: 6,
  },
  glassInner: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 16,
    padding: 12,
  },

  // Pill shape
  pillOuter: { borderRadius: 24 },
  pillInnerStyle: { borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16 },
  pillContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  pillText: { fontSize: 15, fontWeight: "600", color: Colors.text.primary },

  // Circle (bubble number)
  circleOuter: { borderRadius: 36, width: 72, height: 72 },
  circleInner: {
    borderRadius: 36,
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  bubbleContent: { alignItems: "center" },
  bubbleNumber: { fontSize: 24, fontWeight: "800", color: Colors.primary },
  bubbleLabel: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },

  // Card
  cardContent: {},
  cardImage: { width: "100%", height: 120, borderRadius: 12, marginBottom: 8 },
  cardBody: {},
  cardTitle: { fontSize: 15, fontWeight: "600", color: Colors.text.primary },
  cardSubtitle: { fontSize: 13, color: Colors.text.secondary, marginTop: 4 },

  // Media
  mediaContent: {},
  mediaImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 8 },

  // Link
  linkContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkUrl: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },

  // Action CTA
  actionOuter: { borderRadius: 24 },
  actionInner: {
    borderRadius: 24,
    backgroundColor: Glass.surfaceAccent,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  actionContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionText: { fontSize: 15, fontWeight: "700", color: Colors.primary, flex: 1 },
});
