import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react-native";
import { Colors, Spacing } from "../../../src/constants/colors";
import { Fonts, FontSizes } from "../../../src/constants/typography";
import { useNoshRunStore } from "../../../src/lib/stores/noshRunStore";
import { useAuth } from "../../../src/contexts/AuthProvider";
import {
  calculateWeekSavings,
  aggregateSavings,
  type SavingsSnapshot,
  type WeekSavings,
} from "../../../src/lib/engines/savingsEngine";
import { supabase } from "../../../src/lib/supabase";
import { lightTap } from "../../../src/lib/haptics";

export default function SavingsPage() {
  const { profile } = useAuth();
  const runHistory = useNoshRunStore((s) => s.runHistory);
  const fetchRunHistory = useNoshRunStore((s) => s.fetchRunHistory);
  const [snapshots, setSnapshots] = useState<SavingsSnapshot[]>([]);
  const householdSize = profile?.household_size ?? 2;

  useEffect(() => {
    fetchRunHistory();
    loadSnapshots();
  }, []);

  const loadSnapshots = async () => {
    try {
      const { data } = await supabase
        .from("ds_savings_snapshots")
        .select("week_start, planned_total, actual_total, savings_amount, meals_cooked")
        .order("week_start", { ascending: false })
        .limit(12);

      if (data) {
        setSnapshots(data.map((r) => ({
          weekStart: r.week_start,
          plannedTotal: r.planned_total,
          actualTotal: r.actual_total,
          savingsAmount: r.savings_amount,
          mealsCooked: r.meals_cooked,
        })));
      }
    } catch { /* silent */ }
  };

  // Current week savings
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = calculateWeekSavings(runHistory, weekStart, householdSize);
  const agg = aggregateSavings(snapshots);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => { lightTap(); router.back(); }} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.text.primary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Savings Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* This Week Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <View style={styles.savingsRow}>
            <View style={styles.savingsStat}>
              <Text style={styles.savingsAmount}>${thisWeek.savings.toFixed(0)}</Text>
              <Text style={styles.savingsLabel}>Saved</Text>
            </View>
            <View style={styles.savingsStat}>
              <Text style={styles.savingsAmount}>{thisWeek.mealsCookedAtHome}</Text>
              <Text style={styles.savingsLabel}>Meals cooked</Text>
            </View>
            <View style={styles.savingsStat}>
              <Text style={styles.savingsAmount}>{thisWeek.savingsPercent}%</Text>
              <Text style={styles.savingsLabel}>vs eating out</Text>
            </View>
          </View>

          {/* Cost comparison bar */}
          <View style={styles.comparisonRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.compLabel}>Your spend</Text>
              <View style={[styles.bar, { backgroundColor: Colors.success, width: `${Math.min(100, (thisWeek.actual / Math.max(thisWeek.planned, 1)) * 100)}%` }]} />
              <Text style={styles.compValue}>${thisWeek.actual.toFixed(2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.compLabel}>Eating out</Text>
              <View style={[styles.bar, { backgroundColor: Colors.primary, width: "100%" }]} />
              <Text style={styles.compValue}>${thisWeek.planned.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* All Time */}
        {agg.totalWeeks > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionLabel}>ALL TIME</Text>
            <View style={styles.savingsRow}>
              <View style={styles.savingsStat}>
                <Text style={[styles.savingsAmount, { color: Colors.success }]}>${agg.totalSaved.toFixed(0)}</Text>
                <Text style={styles.savingsLabel}>Total saved</Text>
              </View>
              <View style={styles.savingsStat}>
                <Text style={styles.savingsAmount}>${agg.avgWeekly.toFixed(0)}</Text>
                <Text style={styles.savingsLabel}>Avg / week</Text>
              </View>
              <View style={styles.savingsStat}>
                <Text style={styles.savingsAmount}>${agg.bestWeek.toFixed(0)}</Text>
                <Text style={styles.savingsLabel}>Best week</Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly History */}
        {snapshots.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>WEEKLY HISTORY</Text>
            {snapshots.map((snap) => (
              <View key={snap.weekStart} style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  w/c {new Date(snap.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </Text>
                <Text style={styles.historyMeals}>{snap.mealsCooked} meals</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  {snap.savingsAmount > 0 ? (
                    <TrendingUp size={14} color={Colors.success} strokeWidth={2} />
                  ) : (
                    <TrendingDown size={14} color={Colors.text.muted} strokeWidth={2} />
                  )}
                  <Text style={[styles.historySaved, snap.savingsAmount > 0 && { color: Colors.success }]}>
                    ${snap.savingsAmount.toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {runHistory.length === 0 && snapshots.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Start saving</Text>
            <Text style={styles.emptyDesc}>
              Complete a Nosh Run to start tracking your savings. The more you cook at home, the more you save.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.secondary,
  },
  content: { paddingHorizontal: Spacing.md },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  savingsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  savingsStat: { alignItems: "center" },
  savingsAmount: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes["2xl"],
    fontWeight: "800",
    color: Colors.secondary,
  },
  savingsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  comparisonRow: {
    flexDirection: "row",
    gap: 16,
  },
  compLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    marginBottom: 4,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  compValue: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  historySection: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  historyDate: {
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    flex: 1,
  },
  historyMeals: {
    fontSize: FontSizes.xs,
    color: Colors.text.muted,
    flex: 1,
    textAlign: "center",
  },
  historySaved: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: FontSizes.sm,
    color: Colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});
