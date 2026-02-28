import { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
} from "react-native";
import {
  Clock,
  Flame,
  ChevronDown,
  Play,
  Users,
  ArrowDown,
  Scissors,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react-native";
import { Colors, Spacing, BorderRadius } from "../../constants/colors";
import type { WorkflowCardData, CardType } from "./WorkflowCard";

// ── Types ──────────────────────────────────────────────────────────

interface RecipeInfographicProps {
  recipe: { title: string; total_time?: number; servings?: number };
  cards: WorkflowCardData[];
  onStart: () => void;
}

// ── Card type metadata ─────────────────────────────────────────────

const CARD_TYPE_META: Record<
  CardType,
  { icon: React.ComponentType<any>; color: string; label: string }
> = {
  prep: { icon: Scissors, color: "#6B8F71", label: "PREP" },
  technique: { icon: Flame, color: Colors.primary, label: "TECHNIQUE" },
  simmer: { icon: Clock, color: "#4A7C8C", label: "SIMMER" },
  finish: { icon: Sparkles, color: "#C4963C", label: "FINISH" },
  serve: { icon: UtensilsCrossed, color: Colors.success, label: "SERVE" },
};

const HEAT_COLORS = ["#999", "#4CAF50", "#E8A93E", "#D4654A"];

// ── Helpers ────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  }
  return `${mins}m`;
}

function formatTotalTime(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  }
  return `${minutes} min`;
}

// ── Component ──────────────────────────────────────────────────────

const NODE_SIZE = 48;
const CONNECTOR_HEIGHT = 36;

export function RecipeInfographic({
  recipe,
  cards,
  onStart,
}: RecipeInfographicProps) {
  const totalAnimated = cards.length + 2;
  const anims = useRef(
    Array.from({ length: totalAnimated }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, animations).start();
  }, []);

  const headerAnim = anims[0];
  const ctaAnim = anims[anims.length - 1];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.headerTitle} numberOfLines={2}>
            {recipe.title}
          </Text>

          <View style={styles.badgeRow}>
            {recipe.total_time != null && recipe.total_time > 0 && (
              <View style={styles.badge}>
                <Clock
                  size={14}
                  color={Colors.text.secondary}
                  strokeWidth={1.5}
                />
                <Text style={styles.badgeText}>
                  {formatTotalTime(recipe.total_time)}
                </Text>
              </View>
            )}
            {recipe.servings != null && recipe.servings > 0 && (
              <View style={styles.badge}>
                <Users
                  size={14}
                  color={Colors.text.secondary}
                  strokeWidth={1.5}
                />
                <Text style={styles.badgeText}>
                  {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cards.length} step{cards.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <View style={styles.scrollHint}>
            <ChevronDown
              size={20}
              color={Colors.text.muted}
              strokeWidth={1.5}
            />
          </View>
        </Animated.View>

        {/* ── Flow chart nodes ── */}
        <View style={styles.timeline}>
          {cards.map((card, index) => {
            const nodeAnim = anims[index + 1];
            const typeMeta = card.card_type
              ? CARD_TYPE_META[card.card_type]
              : null;
            const nodeColor = typeMeta?.color ?? Colors.text.muted;
            const isLast = index === cards.length - 1;
            const NodeIcon = typeMeta?.icon ?? null;
            const circleBg = hexToRgba(nodeColor, 0.08);

            return (
              <Animated.View
                key={index}
                style={[
                  styles.nodeContainer,
                  {
                    opacity: nodeAnim,
                    transform: [
                      {
                        translateY: nodeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Node row */}
                <View style={styles.nodeRow}>
                  {/* Circle with step number */}
                  <View style={styles.nodeCircleWrapper}>
                    <View
                      style={[
                        styles.nodeCircle,
                        {
                          borderColor: hexToRgba(nodeColor, 0.3),
                          backgroundColor: circleBg,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.nodeNumber, { color: nodeColor }]}
                      >
                        {card.card_number}
                      </Text>
                    </View>
                  </View>

                  {/* Card content */}
                  <View style={styles.nodeContent}>
                    {/* Type label + icon row */}
                    <View style={styles.nodeTypeRow}>
                      {NodeIcon && (
                        <NodeIcon
                          size={13}
                          color={nodeColor}
                          strokeWidth={1.5}
                        />
                      )}
                      {typeMeta && (
                        <Text
                          style={[
                            styles.nodeTypeLabel,
                            { color: nodeColor },
                          ]}
                        >
                          {typeMeta.label}
                        </Text>
                      )}
                    </View>

                    {/* Title */}
                    <Text style={styles.nodeTitle}>{card.title}</Text>

                    {/* Brief description */}
                    {card.instructions.length > 0 && (
                      <Text style={styles.nodeDescription} numberOfLines={2}>
                        {card.instructions[0]}
                      </Text>
                    )}

                    {/* Metadata row: timer + heat */}
                    <View style={styles.nodeMeta}>
                      {card.timer_seconds != null &&
                        card.timer_seconds > 0 && (
                          <View style={styles.metaPill}>
                            <Clock
                              size={11}
                              color={Colors.text.muted}
                              strokeWidth={1.5}
                            />
                            <Text style={styles.metaPillText}>
                              {formatDuration(card.timer_seconds)}
                            </Text>
                          </View>
                        )}
                      {card.heat_level != null && card.heat_level > 0 && (
                        <View style={styles.metaPill}>
                          <View style={styles.heatDots}>
                            {[1, 2, 3].map((lvl) => (
                              <Flame
                                key={lvl}
                                size={10}
                                color={
                                  lvl <= card.heat_level!
                                    ? HEAT_COLORS[card.heat_level!]
                                    : Colors.divider
                                }
                                strokeWidth={1.5}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Ingredient pills */}
                    {card.ingredients_used &&
                      card.ingredients_used.length > 0 && (
                        <View style={styles.ingredientRow}>
                          {card.ingredients_used.slice(0, 5).map((ing, i) => (
                            <View key={i} style={styles.ingredientPill}>
                              <Text style={styles.ingredientPillText}>
                                {ing.qty ? `${ing.qty} ` : ""}
                                {ing.name}
                              </Text>
                            </View>
                          ))}
                          {card.ingredients_used.length > 5 && (
                            <View style={styles.ingredientPill}>
                              <Text style={styles.ingredientPillText}>
                                +{card.ingredients_used.length - 5} more
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                  </View>
                </View>

                {/* Connector line */}
                {!isLast && (
                  <View style={styles.connectorWrapper}>
                    <View style={styles.connectorLine} />
                    <ArrowDown
                      size={14}
                      color={Colors.border}
                      strokeWidth={1.5}
                    />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* ── CTA Button ── */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: ctaAnim,
              transform: [
                {
                  translateY: ctaAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable onPress={onStart} style={styles.ctaButton}>
            <Play size={18} color="#FFF" strokeWidth={2} />
            <Text style={styles.ctaText}>Let's Cook</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 60,
  },

  // ── Header ──
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text.primary,
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
    lineHeight: 34,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  scrollHint: {
    marginTop: Spacing.xs,
    opacity: 0.5,
  },

  // ── Timeline ──
  timeline: {
    paddingLeft: 4,
  },
  nodeContainer: {
    marginBottom: 0,
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  nodeCircleWrapper: {
    width: NODE_SIZE,
    alignItems: "center",
    paddingTop: 2,
  },
  nodeCircle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  nodeNumber: {
    fontSize: 17,
    fontWeight: "800",
  },
  nodeContent: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  nodeTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  nodeTypeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  nodeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  nodeDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 6,
  },

  // ── Node metadata ──
  nodeMeta: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  metaPillText: {
    fontSize: 11,
    color: Colors.text.muted,
    fontWeight: "600",
  },
  heatDots: {
    flexDirection: "row",
    gap: 2,
  },

  // ── Ingredient pills ──
  ingredientRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  ingredientPill: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  ingredientPillText: {
    fontSize: 10,
    color: Colors.text.muted,
    fontWeight: "500",
  },

  // ── Connector ──
  connectorWrapper: {
    alignItems: "center",
    marginLeft: NODE_SIZE / 2 + 4,
    width: 0,
    height: CONNECTOR_HEIGHT,
    justifyContent: "center",
  },
  connectorLine: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: Colors.divider,
  },

  // ── CTA ──
  ctaContainer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: BorderRadius.pill,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
});
