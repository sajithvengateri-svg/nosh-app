import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Animated } from "react-native";
import { Image } from "expo-image";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import {
  Scissors,
  Flame,
  Clock,
  Sparkles,
  UtensilsCrossed,
  Target,
  Lightbulb,
  Zap,
  Check,
  ChefHat,
  Play,
  Minus,
  Plus,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { useTimerStore } from "../../lib/stores/timerStore";
import { useTrackingStore } from "../../lib/stores/trackingStore";
import { lightTap } from "../../lib/haptics";

// ── Types ──────────────────────────────────────────────────────────

export type CardType = "prep" | "technique" | "simmer" | "finish" | "serve";

export interface IngredientCallout {
  name: string;
  qty?: string;
  action?: string;
}

export interface WorkflowCardData {
  card_number: number;
  total_cards: number;
  title: string;
  photo_url?: string;
  instructions: string[];
  success_marker?: string;
  timer_seconds?: number;
  parallel_task?: string;
  card_type?: CardType;
  heat_level?: number;
  technique_icon?: string;
  ingredients_used?: IngredientCallout[];
  pro_tip?: string;
  video_url?: string;
  card_id?: string;
}

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

const HEAT_LABELS = ["Off", "Low", "Medium", "High"];
const HEAT_COLORS = ["#999", "#4CAF50", "#E8A93E", "#D4654A"];

const TIMER_SIZE = 140;
const TIMER_STROKE = 4;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

// ── Component ──────────────────────────────────────────────────────

interface WorkflowCardProps {
  card: WorkflowCardData;
  onDone: () => void;
  onWatchVideo?: (videoUrl: string, cardTitle: string, cardId?: string) => void;
}

export function WorkflowCard({ card, onDone, onWatchVideo }: WorkflowCardProps) {
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const totalTime = card.timer_seconds ?? 0;
  const timerId = card.card_id ?? `card-${card.card_number}`;

  // Centralized timer store
  const timerInstance = useTimerStore((s) => s.timers[timerId]);
  const startTimer = useTimerStore((s) => s.startTimer);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const adjustTimer = useTimerStore((s) => s.adjustTimer);

  const timerRunning = timerInstance?.running ?? false;
  const timeLeft = timerInstance?.timeLeft ?? totalTime;

  // Pulse animation for running timer
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setCheckedSteps(new Set());
    pulseAnim.setValue(1);
    if (pulseLoop.current) pulseLoop.current.stop();
  }, [card.card_number]);

  // Pulse while running
  useEffect(() => {
    if (timerRunning) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();
    } else {
      if (pulseLoop.current) pulseLoop.current.stop();
      pulseAnim.setValue(1);
    }
  }, [timerRunning]);

  // Compute arc progress directly from state (no Animated SVG)
  const timerTotalForArc = timerInstance?.totalSeconds ?? totalTime;
  const timerProgress = timerTotalForArc > 0 ? (timerTotalForArc - timeLeft) / timerTotalForArc : 0;
  const strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - timerProgress);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleStep = (idx: number) => {
    lightTap();
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const trackTimerAction = (action: "start" | "pause" | "resume" | "complete" | "adjust") => {
    useTrackingStore.getState().logTimerEvent({
      recipeId: card.card_id ?? `card-${card.card_number}`,
      cardId: timerId,
      action,
    });
  };

  const handleTimerTap = () => {
    if (timeLeft <= 0) return;
    lightTap();
    if (timerRunning) {
      pauseTimer(timerId);
      trackTimerAction("pause");
    } else if (timerInstance) {
      resumeTimer(timerId);
      trackTimerAction("resume");
    } else {
      startTimer(timerId, card.title, totalTime);
      trackTimerAction("start");
    }
  };

  const handleDone = () => {
    onDone();
  };

  const typeMeta = card.card_type ? CARD_TYPE_META[card.card_type] : null;
  const allChecked = checkedSteps.size === card.instructions.length;
  const timerDone = totalTime > 0 && timeLeft === 0;

  // Build ingredient names for highlighting in instructions
  const ingredientNames = (card.ingredients_used ?? [])
    .map((ing) => ing.name.toLowerCase())
    .filter((n) => n.length > 2);

  const highlightIngredients = (text: string, isChecked: boolean): React.ReactNode => {
    if (ingredientNames.length === 0 || isChecked) return text;
    const escaped = ingredientNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
    const parts = text.split(pattern);
    if (parts.length === 1) return text;
    return parts.map((part, idx) => {
      if (pattern.test(part)) {
        // Reset lastIndex since we're reusing the regex with global flag
        pattern.lastIndex = 0;
        return (
          <Text
            key={idx}
            style={{
              textDecorationLine: "underline",
              color: Colors.primary,
            }}
          >
            {part}
          </Text>
        );
      }
      pattern.lastIndex = 0;
      return part;
    });
  };

  // Dynamic type badge color at low opacity
  // Convert hex color to rgba for badge backgrounds
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const badgeBg = typeMeta ? hexToRgba(typeMeta.color, 0.1) : "transparent";
  const badgeBorder = typeMeta ? hexToRgba(typeMeta.color, 0.15) : "transparent";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Card type badge + progress ── */}
      <View style={styles.headerRow}>
        {typeMeta ? (
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: badgeBg, borderColor: badgeBorder },
            ]}
          >
            <typeMeta.icon size={14} color={typeMeta.color} strokeWidth={1.5} />
            <Text style={[styles.typeBadgeLabel, { color: typeMeta.color }]}>
              {typeMeta.label}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={styles.progress}>
          {card.card_number}/{card.total_cards}
        </Text>
      </View>

      {/* ── Title ── */}
      <Text style={styles.title}>{card.title}</Text>

      {/* ── Heat level indicator ── */}
      {card.heat_level !== undefined && card.heat_level > 0 && (
        <View style={styles.heatRow}>
          <Text style={styles.heatLabel}>Heat:</Text>
          {[1, 2, 3].map((lvl) => (
            <View
              key={lvl}
              style={[
                styles.heatDot,
                {
                  backgroundColor:
                    lvl <= card.heat_level!
                      ? HEAT_COLORS[card.heat_level!]
                      : Colors.divider,
                },
              ]}
            />
          ))}
          <Text
            style={[styles.heatText, { color: HEAT_COLORS[card.heat_level] }]}
          >
            {HEAT_LABELS[card.heat_level]}
          </Text>
        </View>
      )}

      {/* ── Photo ── */}
      {card.photo_url ? (
        <Image
          source={{ uri: card.photo_url }}
          style={styles.photo}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          {(() => {
            const PlaceholderIcon = typeMeta?.icon ?? ChefHat;
            return (
              <PlaceholderIcon
                size={48}
                color={Colors.text.muted}
                strokeWidth={1.5}
              />
            );
          })()}
        </View>
      )}

      {/* ── Ingredients used on this step ── */}
      {card.ingredients_used && card.ingredients_used.length > 0 && (
        <View style={styles.ingredientCallouts}>
          <Text style={styles.ingredientHeader}>Ingredients for this step</Text>
          <View style={styles.ingredientChips}>
            {card.ingredients_used.map((ing, i) => (
              <View key={i} style={styles.ingredientChip}>
                <Text style={styles.ingredientQty}>{ing.qty ?? ""}</Text>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                {ing.action && (
                  <Text style={styles.ingredientAction}>{ing.action}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Instructions with checkboxes ── */}
      <View style={styles.instructionsContainer}>
        {card.instructions.map((instruction, i) => (
          <Pressable
            key={i}
            onPress={() => toggleStep(i)}
            style={styles.instructionRow}
          >
            <View
              style={[
                styles.checkbox,
                checkedSteps.has(i) && styles.checkboxChecked,
              ]}
            >
              {checkedSteps.has(i) && (
                <Check size={12} color="#FFF" strokeWidth={2.5} />
              )}
            </View>
            <Text
              style={[
                styles.instruction,
                checkedSteps.has(i) && styles.instructionChecked,
              ]}
            >
              {highlightIngredients(instruction, checkedSteps.has(i))}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Success marker — fluoro sticky note ── */}
      {card.success_marker && (
        <View style={styles.successMarker}>
          <Target size={16} color="#F9A825" strokeWidth={1.5} />
          <Text style={styles.successText}>{card.success_marker}</Text>
        </View>
      )}

      {/* ── Pro tip ── */}
      {card.pro_tip && (
        <View style={styles.proTip}>
          <View style={styles.calloutHeader}>
            <Lightbulb size={12} color={Colors.alert} strokeWidth={1.5} />
            <Text style={styles.proTipLabel}>Pro Tip</Text>
          </View>
          <Text style={styles.proTipText}>{card.pro_tip}</Text>
        </View>
      )}

      {/* ── Watch Guide video button ── */}
      {card.video_url && onWatchVideo && (
        <Pressable
          onPress={() => {
            lightTap();
            onWatchVideo(card.video_url!, card.title, card.card_id);
          }}
          style={styles.watchGuideButton}
        >
          <Play size={14} color="#FFF" strokeWidth={1.5} fill="#FFF" />
          <Text style={styles.watchGuideText}>Watch Guide</Text>
        </Pressable>
      )}

      {/* ── Parallel task ── */}
      {card.parallel_task && (
        <View style={styles.parallelTask}>
          <View style={styles.calloutHeader}>
            <Zap size={12} color="#9B7AC4" strokeWidth={1.5} />
            <Text style={[styles.proTipLabel, { color: "#9B7AC4" }]}>
              While you wait
            </Text>
          </View>
          <Text style={styles.parallelText}>{card.parallel_task}</Text>
        </View>
      )}

      {/* ── Timer — tap-to-toggle ring with +/- 1min ── */}
      {totalTime > 0 && (
        <View style={styles.timerSection}>
          <View style={styles.timerRow}>
            <Pressable
              onPress={() => {
                lightTap();
                adjustTimer(timerId, -60);
                trackTimerAction("adjust");
              }}
              style={styles.timerAdjustButton}
            >
              <Minus size={16} color={Colors.text.secondary} strokeWidth={1.5} />
              <Text style={styles.timerAdjustLabel}>1m</Text>
            </Pressable>

            <Pressable onPress={handleTimerTap}>
              <Animated.View
                style={[
                  styles.timerRingContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Svg
                  width={TIMER_SIZE}
                  height={TIMER_SIZE}
                  style={{ transform: [{ rotate: "-90deg" }] }}
                >
                  {/* Background track */}
                  <SvgCircle
                    cx={TIMER_SIZE / 2}
                    cy={TIMER_SIZE / 2}
                    r={TIMER_RADIUS}
                    stroke={Colors.border}
                    strokeWidth={TIMER_STROKE}
                    fill="none"
                  />
                  {/* Progress arc */}
                  <SvgCircle
                    cx={TIMER_SIZE / 2}
                    cy={TIMER_SIZE / 2}
                    r={TIMER_RADIUS}
                    stroke={timerDone ? Colors.success : Colors.primary}
                    strokeWidth={TIMER_STROKE}
                    fill="none"
                    strokeDasharray={`${TIMER_CIRCUMFERENCE}`}
                    strokeDashoffset={`${strokeDashoffset}`}
                    strokeLinecap="round"
                  />
                </Svg>
                {/* Time display overlaid in center */}
                <View style={styles.timerDisplayOverlay}>
                  <Text style={styles.timerDisplay}>
                    {formatTime(timeLeft)}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>

            <Pressable
              onPress={() => {
                lightTap();
                adjustTimer(timerId, 60);
                trackTimerAction("adjust");
              }}
              style={styles.timerAdjustButton}
            >
              <Plus size={16} color={Colors.text.secondary} strokeWidth={1.5} />
              <Text style={styles.timerAdjustLabel}>1m</Text>
            </Pressable>
          </View>

          <Text style={styles.timerHint}>
            {timerDone
              ? "Done!"
              : timerRunning
                ? "Tap to pause"
                : "Tap to start"}
          </Text>
        </View>
      )}

      {/* ── Done button ── */}
      <Pressable
        onPress={handleDone}
        style={[styles.doneButton, allChecked && styles.doneButtonReady]}
      >
        <View style={styles.doneInner}>
          <Check
            size={18}
            color={allChecked ? "#FFF" : Colors.success}
            strokeWidth={2}
          />
          <Text
            style={[styles.doneText, allChecked && styles.doneTextReady]}
          >
            {allChecked ? "All done \u2014 Next" : "Done \u2014 Next"}
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.card },
  content: { padding: 28, paddingBottom: 48 },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeBadgeLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  progress: {
    fontSize: 13,
    color: Colors.text.muted,
    letterSpacing: 1,
  },

  // Title
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },

  // Heat indicator
  heatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  heatLabel: { fontSize: 12, color: Colors.text.secondary },
  heatDot: { width: 12, height: 12, borderRadius: 6 },
  heatText: { fontSize: 12, fontWeight: "700", marginLeft: 4 },

  // Photo
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
  },
  photoPlaceholder: {
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  // Ingredient callouts
  ingredientCallouts: { marginBottom: 16 },
  ingredientHeader: {
    fontSize: 11,
    color: Colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  ingredientChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ingredientQty: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
  },
  ingredientName: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: "500",
  },
  ingredientAction: {
    fontSize: 11,
    color: Colors.text.muted,
    fontStyle: "italic",
  },

  // Instructions
  instructionsContainer: { gap: 10, marginBottom: 16 },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  instruction: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
    flex: 1,
  },
  instructionChecked: {
    color: Colors.text.muted,
    textDecorationLine: "line-through",
  },

  // Success marker — fluoro sticky note
  successMarker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF8E1",
    borderLeftWidth: 4,
    borderLeftColor: "#FFD54F",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: "#5D4037",
    fontWeight: "600",
    flex: 1,
  },

  // Shared callout header
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },

  // Pro tip
  proTip: {
    backgroundColor: Colors.background,
    borderLeftWidth: 3,
    borderLeftColor: Colors.alert,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  proTipLabel: {
    fontSize: 12,
    color: Colors.alert,
    fontWeight: "700",
  },
  proTipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Parallel task
  parallelTask: {
    backgroundColor: "#F3F0FF",
    borderLeftWidth: 3,
    borderLeftColor: "#9B7AC4",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  parallelText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Watch Guide
  watchGuideButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  watchGuideText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // Timer
  timerSection: { alignItems: "center", marginBottom: 20 },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timerAdjustButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerAdjustLabel: {
    fontSize: 10,
    color: Colors.text.muted,
    fontWeight: "600",
    marginTop: 1,
  },
  timerRingContainer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  timerDisplayOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  timerDisplay: {
    fontSize: 40,
    fontWeight: "200",
    color: Colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  timerHint: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 8,
  },

  // Done button
  doneButton: {
    backgroundColor: "rgba(91, 163, 122, 0.12)",
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  doneButtonReady: {
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  doneInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  doneText: {
    color: Colors.success,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  doneTextReady: {
    color: "#FFF",
  },
});
