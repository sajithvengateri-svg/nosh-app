import { useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
} from "react-native";
import {
  CookingPot,
  Globe,
  Trophy,
  Lock,
  UtensilsCrossed,
  Flame,
  Star,
  Dna,
  Target,
  Zap,
  Ruler,
  Waves,
  Users,
  ShoppingCart,
  House,
} from "lucide-react-native";
import { Colors, Glass, Spacing, BorderRadius } from "../../constants/colors";

const ACHIEVEMENT_ICON_MAP: Record<string, React.ComponentType<any>> = {
  utensils_crossed: UtensilsCrossed,
  flame: Flame,
  star: Star,
  dna: Dna,
  target: Target,
  zap: Zap,
  ruler: Ruler,
  waves: Waves,
  globe: Globe,
  users: Users,
  shopping_cart: ShoppingCart,
  home: House,
  trophy: Trophy,
};
import { usePersonalityStore } from "../../lib/stores/personalityStore";
import { useFavouritesStore } from "../../lib/stores/favouritesStore";
import { useNoshRunStore } from "../../lib/stores/noshRunStore";
import {
  getPersonalityIcon,
  getPersonalityLabel,
} from "../../lib/engines/personalityEngine";
import { getAllAchievements } from "../../lib/engines/achievementEngine";
import { lightTap, successNotification } from "../../lib/haptics";

// ── Component ────────────────────────────────────────────────────────

export default function NoshDnaOverlay() {
  const profile = usePersonalityStore((s) => s.profile);
  const constraints = usePersonalityStore((s) => s.constraints);
  const earnedAchievements = usePersonalityStore((s) => s.earnedAchievements);
  const hybridMode = usePersonalityStore((s) => s.hybridMode);
  const nudgeState = usePersonalityStore((s) => s.nudgeState);
  const pauseNudges = usePersonalityStore((s) => s.pauseNudges);
  const cookLog = useFavouritesStore((s) => s.cookLog);
  const runHistory = useNoshRunStore((s) => s.runHistory);
  const fetchRunHistory = useNoshRunStore((s) => s.fetchRunHistory);

  useEffect(() => {
    fetchRunHistory();
  }, [fetchRunHistory]);

  const allAchievements = getAllAchievements(earnedAchievements);
  const earned = allAchievements.filter((a) => a.earned);
  const locked = allAchievements.filter((a) => !a.earned);

  if (!profile) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Complete onboarding to unlock your Prep DNA
        </Text>
      </View>
    );
  }

  const PersonalityIcon = getPersonalityIcon(profile.primary);
  const label = getPersonalityLabel(profile.primary);
  const confidencePct = Math.round(profile.confidence * 100);
  const totalCooks = cookLog?.length ?? 0;

  // Unique cuisines from cook log
  const cuisines = new Set(
    (cookLog ?? [])
      .map((c) => c.recipe?.cuisine)
      .filter(Boolean),
  );

  const handleShare = useCallback(async () => {
    successNotification();
    const lines = [
      `I'm a ${label} (${confidencePct}% confidence)!`,
      "",
      `${totalCooks} recipes cooked · ${cuisines.size} cuisines`,
      earned.length > 0
        ? earned.map((a) => a.label).join(" · ")
        : "",
      "",
      "Try Prep Mi -- nosh.app",
    ].filter(Boolean);
    await Share.share({ message: lines.join("\n") });
  }, [label, confidencePct, totalCooks, cuisines.size, earned]);

  const togglePause = useCallback(() => {
    lightTap();
    pauseNudges(!nudgeState.nudgePaused);
  }, [nudgeState.nudgePaused, pauseNudges]);

  const filledBars = Math.round(confidencePct / 10);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={{ marginBottom: 4 }}>
          <PersonalityIcon size={40} color={Colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.heroLabel}>{label}</Text>

        {hybridMode && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {(() => {
              const WeekdayIcon = getPersonalityIcon(hybridMode.weekdayMode);
              return <WeekdayIcon size={14} color={Colors.text.secondary} strokeWidth={1.5} />;
            })()}
            <Text style={styles.hybridBadge}>weekdays ·{" "}</Text>
            {(() => {
              const WeekendIcon = getPersonalityIcon(hybridMode.weekendMode);
              return <WeekendIcon size={14} color={Colors.text.secondary} strokeWidth={1.5} />;
            })()}
            <Text style={styles.hybridBadge}>weekends</Text>
          </View>
        )}

        {/* Confidence bar */}
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <View style={styles.barTrack}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.barSegment,
                  {
                    backgroundColor:
                      i < filledBars ? Colors.primary : Colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.confidencePct}>{confidencePct}%</Text>
        </View>

        {/* Constraints summary */}
        {constraints && (
          <View style={styles.constraintRow}>
            <ConstraintPill
              label="Style"
              value={profile.style}
            />
            <ConstraintPill
              label="Weekday"
              value={`${constraints.maxCookTimeWeekday}min`}
            />
            <ConstraintPill
              label="Weekend"
              value={`${constraints.maxCookTimeWeekend}min`}
            />
          </View>
        )}
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Your Stats</Text>
      <View style={styles.statsGrid}>
        <StatItem icon={CookingPot} value={totalCooks} label="recipes cooked" />
        <StatItem icon={Globe} value={cuisines.size} label="cuisines" />
        <StatItem icon={Trophy} value={earned.length} label="achievements" />
      </View>

      {/* Achievements — Earned */}
      {earned.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementGrid}>
            {earned.map((a) => (
              <View key={a.key} style={styles.achievementChip}>
                {(() => {
                  const AchIcon = ACHIEVEMENT_ICON_MAP[a.iconName] ?? Trophy;
                  return <AchIcon size={14} color={Colors.primary} strokeWidth={1.5} />;
                })()}
                <Text style={styles.achievementLabel}>{a.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Locked</Text>
          <View style={styles.achievementGrid}>
            {locked.map((a) => (
              <View key={a.key} style={[styles.achievementChip, styles.lockedChip]}>
                <Lock size={16} color={Colors.text.muted} strokeWidth={1.5} />
                <Text style={[styles.achievementLabel, styles.lockedLabel]}>
                  {a.label}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Prep Run History */}
      <Text style={styles.sectionTitle}>Prep Run History</Text>
      {runHistory.length > 0 ? (
        <View style={styles.historyList}>
          {runHistory.map((run, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{run.recipeTitle}</Text>
                <Text style={styles.historyMeta}>
                  {new Date(run.date).toLocaleDateString()} · {run.itemCount} items
                </Text>
              </View>
              <Text style={styles.historyTotal}>
                ${run.totalSpent.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.historyEmpty}>
          <Text style={styles.historyEmptyText}>
            No runs yet! Complete a Prep Run to see your history.
          </Text>
        </View>
      )}

      {/* Actions */}
      <Pressable
        onPress={handleShare}
        style={({ pressed }) => [
          styles.shareButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.shareButtonText}>Share Your DNA</Text>
      </Pressable>

      <Pressable
        onPress={togglePause}
        style={({ pressed }) => [
          styles.pauseButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.pauseButtonText}>
          {nudgeState.nudgePaused ? "Resume Nudges" : "Pause Nudges"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function ConstraintPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<any>;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statEmoji}>
        <Icon size={20} color={Colors.text.muted} strokeWidth={1.5} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: "center",
  },

  // Hero
  heroCard: {
    backgroundColor: Glass.surfaceDark,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadow.color,
    shadowOffset: Glass.shadow.offset,
    shadowRadius: Glass.shadow.radius,
    shadowOpacity: 1,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  heroLabel: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: Spacing.xs,
  },
  hybridBadge: {
    fontSize: 12,
    color: "#BBB",
    marginBottom: Spacing.md,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    width: "100%",
  },
  confidenceLabel: {
    fontSize: 12,
    color: "#AAA",
    width: 70,
  },
  barTrack: {
    flexDirection: "row",
    flex: 1,
    gap: 3,
  },
  barSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  confidencePct: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    width: 36,
    textAlign: "right",
  },
  constraintRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Pills
  pill: {
    backgroundColor: Glass.surface,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  pillLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
  },

  // Stats
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },

  // Achievements
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  achievementChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Glass.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    gap: 6,
  },
  lockedChip: {
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 16,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  lockedLabel: {
    color: Colors.text.muted,
  },

  // Buttons
  shareButton: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  shareButtonText: {
    color: Colors.secondary,
    fontWeight: "600",
    fontSize: 15,
  },
  pauseButton: {
    backgroundColor: "transparent",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  pauseButtonText: {
    color: Colors.text.secondary,
    fontWeight: "500",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },

  // History
  historyList: {
    marginBottom: Spacing.md,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  historyMeta: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },
  historyTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  historyEmpty: {
    backgroundColor: Glass.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  historyEmptyText: {
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: "center",
  },
});
