import { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Check, Clock, LayoutGrid } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { lightTap, mediumTap } from "../../lib/haptics";
import type { WorkflowCardData, CardType } from "./WorkflowCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_GAP = 12;
const TILE_WIDTH = (SCREEN_WIDTH - 48 - TILE_GAP) / 2;

const TYPE_COLORS: Record<string, string> = {
  prep: "#6B8F71",
  technique: Colors.primary,
  simmer: "#4A7C8C",
  finish: "#C4963C",
  serve: Colors.success,
};

interface CardGridOverlayProps {
  cards: WorkflowCardData[];
  currentCard: number;
  completedCards: Set<number>;
  onSelectCard: (index: number) => void;
  onClose: () => void;
  inline?: boolean;
}

export function CardGridOverlay({
  cards,
  currentCard,
  completedCards,
  onSelectCard,
  onClose,
  inline,
}: CardGridOverlayProps) {
  const opacity = useRef(new Animated.Value(inline ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(inline ? 1 : 0.9)).current;

  useEffect(() => {
    if (inline) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    lightTap();
    if (inline) {
      onClose();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleSelect = (index: number) => {
    mediumTap();
    onSelectCard(index);
  };

  const renderTile = ({ item, index }: { item: WorkflowCardData; index: number }) => {
    const isCurrent = index === currentCard;
    const isCompleted = completedCards.has(index);
    const typeColor = TYPE_COLORS[item.card_type ?? "prep"] ?? Colors.text.muted;

    return (
      <Pressable
        onPress={() => handleSelect(index)}
        style={({ pressed }) => [
          styles.tile,
          isCurrent && { borderColor: Colors.primary, borderWidth: 2 },
          isCompleted && { backgroundColor: "rgba(91, 163, 122, 0.06)" },
          pressed && { opacity: 0.8 },
        ]}
      >
        {/* Type color band */}
        <View style={[styles.typeBand, { backgroundColor: typeColor }]} />

        {/* Step number */}
        <View style={[styles.stepBadge, { backgroundColor: typeColor }]}>
          <Text style={styles.stepBadgeText}>{item.card_number}</Text>
        </View>

        {/* Completed check */}
        {isCompleted && (
          <View style={styles.checkBadge}>
            <Check size={12} color="#FFF" strokeWidth={2} />
          </View>
        )}

        {/* Title */}
        <Text style={styles.tileTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Timer pill */}
        {item.timer_seconds && item.timer_seconds > 0 && (
          <View style={styles.timerPill}>
            <Clock size={10} color={Colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.timerPillText}>
              {Math.ceil(item.timer_seconds / 60)}m
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const gridContent = (
    <>
      {!inline && (
        <View style={styles.header}>
          <LayoutGrid size={18} color={Colors.text.primary} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>Jump to Step</Text>
          <Pressable onPress={handleClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={cards}
        numColumns={2}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderTile}
        columnWrapperStyle={{ gap: TILE_GAP }}
        contentContainerStyle={{ gap: TILE_GAP, paddingBottom: 20, paddingHorizontal: inline ? 16 : 0 }}
        showsVerticalScrollIndicator={false}
      />

      <View style={inline ? { paddingHorizontal: 16 } : undefined}>
        <Pressable
          onPress={() => handleSelect(0)}
          style={({ pressed }) => [
            styles.startButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.startButtonText}>Start from Step 1</Text>
        </Pressable>
      </View>
    </>
  );

  // Inline mode: render content directly without overlay/backdrop
  if (inline) {
    return <View style={styles.inlineContainer}>{gridContent}</View>;
  }

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <Animated.View
        style={[
          styles.content,
          { transform: [{ scale }] },
        ]}
      >
        {gridContent}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    width: SCREEN_WIDTH - 32,
    maxHeight: "80%",
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  closeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.muted,
  },

  tile: {
    width: TILE_WIDTH,
    height: 120,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    padding: 12,
    paddingTop: 16,
    justifyContent: "flex-end",
  },
  typeBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  stepBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    lineHeight: 18,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 6,
  },
  timerPillText: {
    fontSize: 11,
    color: Colors.text.muted,
    fontWeight: "500",
  },

  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  startButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  inlineContainer: {
    flex: 1,
    paddingTop: 12,
  },
});
