import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { X, Undo2, ArrowRight, ArrowLeft } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SwipeCard } from "./SwipeCard";
import { useTheme } from "../../contexts/ThemeProvider";

export interface DeckCard {
  id: string;
  type: "quick-action" | "notification" | "widget" | "recipe";
  data: Record<string, any>;
}

interface ActionLogEntry {
  cardId: string;
  cardTitle: string;
  direction: "left" | "right";
  timestamp: string;
}

interface ActionDeckProps {
  cards: DeckCard[];
  onAction?: (card: DeckCard, direction: "left" | "right") => void;
  onScrollLock?: (locked: boolean) => void;
}

const LOG_KEY = "chefos_action_log";

async function loadActionLog(): Promise<ActionLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const entries: ActionLogEntry[] = JSON.parse(raw);
    // Auto-clear discards older than 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const filtered = entries.filter(
      (e) => e.direction === "right" || new Date(e.timestamp).getTime() > weekAgo
    );
    if (filtered.length !== entries.length) {
      await AsyncStorage.setItem(LOG_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

async function appendActionLog(entry: ActionLogEntry) {
  const log = await loadActionLog();
  log.push(entry);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(log));
}

function QuickActionContent({ data }: { data: Record<string, any> }) {
  const { colors } = useTheme();
  const urgencyColors: Record<string, string> = { high: "#DC2626", medium: "#F59E0B", low: "#10B981" };
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, gap: 4, borderLeftWidth: 4, borderLeftColor: urgencyColors[data.urgency] || colors.accent }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: urgencyColors[data.urgency] || colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>
        Quick Action
      </Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 4 }}>{data.title}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 2 }}>{data.description}</Text>
    </View>
  );
}

function NotificationContent({ data }: { data: Record<string, any> }) {
  const { colors } = useTheme();
  const severityColors: Record<string, string> = { critical: "#DC2626", warning: "#F59E0B", info: colors.accent };
  const color = severityColors[data.severity] || colors.textSecondary;
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, gap: 4, borderWidth: 1, borderColor: `${color}20` }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color, textTransform: "uppercase", letterSpacing: 1 }}>
        {data.severity === "critical" ? "Urgent" : "Notice"}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 4 }}>{data.title}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 2 }}>{data.message}</Text>
      {data.actionLabel && (
        <View style={{ backgroundColor: color, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start", marginTop: 8 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>Swipe right → {data.actionLabel}</Text>
        </View>
      )}
    </View>
  );
}

function WidgetContent({ data }: { data: Record<string, any> }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, gap: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Widget</Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 4 }}>{data.title}</Text>
      <Text style={{ fontSize: 32, fontWeight: "800", color: colors.accent, marginTop: 4 }}>{data.value}</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{data.subtitle}</Text>
      {data.progress != null && (
        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 12 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.accent, width: `${data.progress}%` }} />
        </View>
      )}
    </View>
  );
}

function RecipeContent({ data }: { data: Record<string, any> }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, gap: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Recipe</Text>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 4 }}>{data.name}</Text>
      <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600", marginTop: 2 }}>{data.category}</Text>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
        <View>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Prep</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{data.prepTime}m</Text>
        </View>
        <View>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Serves</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{data.servings}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Cost/serve</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>${data.costPerServing?.toFixed(2)}</Text>
        </View>
      </View>
      {data.allergens?.length > 0 && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {data.allergens.map((a: string) => (
            <View key={a} style={{ backgroundColor: colors.destructiveBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.destructive }}>{a}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function renderCardContent(card: DeckCard) {
  switch (card.type) {
    case "quick-action": return <QuickActionContent data={card.data} />;
    case "notification": return <NotificationContent data={card.data} />;
    case "widget": return <WidgetContent data={card.data} />;
    case "recipe": return <RecipeContent data={card.data} />;
    default: return null;
  }
}

function getCardTitle(card: DeckCard): string {
  return card.data.title || card.data.name || card.id;
}

export function ActionDeck({ cards, onAction, onScrollLock }: ActionDeckProps) {
  const { colors } = useTheme();
  const [currentCards, setCurrentCards] = useState(cards);
  const [removedCards, setRemovedCards] = useState<DeckCard[]>([]);
  const [todayActions, setTodayActions] = useState(0);
  const prevCardsRef = useRef(cards);

  // Sync currentCards when the cards prop changes (e.g., after stats load)
  useEffect(() => {
    const prevIds = prevCardsRef.current.map((c) => c.id).join(",");
    const newIds = cards.map((c) => c.id).join(",");
    if (prevIds !== newIds) {
      const removedIds = new Set(removedCards.map((c) => c.id));
      setCurrentCards(cards.filter((c) => !removedIds.has(c.id)));
      prevCardsRef.current = cards;
    }
  }, [cards, removedCards]);

  useEffect(() => {
    loadActionLog().then((log) => {
      const today = new Date().toISOString().split("T")[0];
      const todayCount = log.filter((e) => e.direction === "right" && e.timestamp.startsWith(today)).length;
      setTodayActions(todayCount);
    });
  }, []);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (currentCards.length === 0) return;
      const card = currentCards[0];
      setRemovedCards((prev) => [...prev, card]);
      setCurrentCards((prev) => prev.slice(1));

      // Log the action
      appendActionLog({
        cardId: card.id,
        cardTitle: getCardTitle(card),
        direction,
        timestamp: new Date().toISOString(),
      });

      if (direction === "right") {
        setTodayActions((prev) => prev + 1);
      }

      onAction?.(card, direction);
    },
    [currentCards, onAction]
  );

  const handleUndo = useCallback(() => {
    if (removedCards.length === 0) return;
    const last = removedCards[removedCards.length - 1];
    setRemovedCards((prev) => prev.slice(0, -1));
    setCurrentCards((prev) => [last, ...prev]);
  }, [removedCards]);

  const visibleCards = currentCards.slice(0, 3);

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Swipe hints */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 24, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={12} color={colors.destructive} strokeWidth={1.5} />
          <Text style={{ fontSize: 11, color: colors.destructive }}>Discard</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontSize: 11, color: colors.accent }}>Action</Text>
          <ArrowRight size={12} color={colors.accent} strokeWidth={1.5} />
        </View>
      </View>

      {/* Card stack */}
      <View style={{ height: 220, marginHorizontal: 16, alignItems: "center", justifyContent: "center" }}>
        {currentCards.length === 0 ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 16, color: colors.textMuted }}>All caught up!</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{todayActions} action{todayActions !== 1 ? "s" : ""} today</Text>
            {removedCards.length > 0 && (
              <Pressable onPress={handleUndo} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.surface, borderRadius: 10 }}>
                <Undo2 size={14} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Undo</Text>
              </Pressable>
            )}
          </View>
        ) : (
          visibleCards.map((card, i) => (
            <SwipeCard
              key={card.id}
              index={i}
              totalCards={visibleCards.length}
              onSwipeLeft={() => handleSwipe("left")}
              onSwipeRight={() => handleSwipe("right")}
              onSwipeStart={() => onScrollLock?.(true)}
              onSwipeEnd={() => onScrollLock?.(false)}
            >
              {renderCardContent(card)}
            </SwipeCard>
          ))
        )}
      </View>

      {/* Bottom controls */}
      {currentCards.length > 0 && (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 12 }}>
          <Pressable
            onPress={() => handleSwipe("left")}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.destructiveBg, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} color={colors.destructive} strokeWidth={1.5} />
          </Pressable>

          {removedCards.length > 0 && (
            <Pressable onPress={handleUndo} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
              <Undo2 size={16} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          )}

          <Pressable
            onPress={() => handleSwipe("right")}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowRight size={20} color={colors.accent} strokeWidth={1.5} />
          </Pressable>
        </View>
      )}

      {/* Counter */}
      <Text style={{ textAlign: "center", fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
        {removedCards.length} of {cards.length} reviewed
      </Text>
    </View>
  );
}
