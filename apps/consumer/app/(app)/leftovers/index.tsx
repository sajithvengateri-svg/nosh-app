import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, AlertTriangle, Check, Trash2 } from "lucide-react-native";
import { Colors, Spacing } from "../../../src/constants/colors";
import { Fonts, FontSizes } from "../../../src/constants/typography";
import { useRecipeStore } from "../../../src/lib/stores/recipeStore";
import { supabase } from "../../../src/lib/supabase";
import {
  getExpiringLeftovers,
  suggestLeftoverRecipes,
  type LeftoverPortion,
} from "../../../src/lib/engines/leftoverEngine";
import { lightTap, mediumTap } from "../../../src/lib/haptics";

export default function LeftoversPage() {
  const recipes = useRecipeStore((s) => s.recipes);
  const [leftovers, setLeftovers] = useState<LeftoverPortion[]>([]);

  useEffect(() => {
    loadLeftovers();
  }, []);

  const loadLeftovers = async () => {
    try {
      const { data } = await supabase
        .from("ds_leftover_portions")
        .select("id, recipe_id, recipe_title, portions_remaining, use_by, status, created_at")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (data) {
        setLeftovers(data.map((r) => ({
          id: r.id,
          recipeId: r.recipe_id,
          recipeTitle: r.recipe_title,
          portionsRemaining: r.portions_remaining,
          useBy: r.use_by,
          status: r.status as "available",
          createdAt: r.created_at,
        })));
      }
    } catch { /* silent */ }
  };

  const markUsed = async (id: string) => {
    mediumTap();
    await supabase.from("ds_leftover_portions").update({ status: "used" }).eq("id", id);
    setLeftovers((prev) => prev.filter((l) => l.id !== id));
  };

  const markDiscarded = async (id: string) => {
    lightTap();
    await supabase.from("ds_leftover_portions").update({ status: "discarded" }).eq("id", id);
    setLeftovers((prev) => prev.filter((l) => l.id !== id));
  };

  const expiring = getExpiringLeftovers(leftovers, 2);
  const suggestions = suggestLeftoverRecipes(leftovers, recipes);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => { lightTap(); router.back(); }} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.text.primary} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Leftovers</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Expiring soon */}
        {expiring.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={16} color={Colors.alert} strokeWidth={2} />
              <Text style={[styles.sectionLabel, { color: Colors.alert }]}>USE SOON</Text>
            </View>
            {expiring.map((item) => (
              <LeftoverRow key={item.id} item={item} onUse={markUsed} onDiscard={markDiscarded} isUrgent />
            ))}
          </View>
        )}

        {/* All leftovers */}
        {leftovers.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>IN YOUR FRIDGE</Text>
            {leftovers.map((item) => (
              <LeftoverRow key={item.id} item={item} onUse={markUsed} onDiscard={markDiscarded} />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing left over</Text>
            <Text style={styles.emptyDesc}>
              When you cook and have leftovers, they'll show up here with smart suggestions to use them up.
            </Text>
          </View>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>USE IT UP</Text>
            {suggestions.map((s) => (
              <Pressable
                key={s.recipe.id}
                onPress={() => {
                  lightTap();
                  router.push(`/(app)/recipe/${s.recipe.id}`);
                }}
                style={styles.suggestionRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>{s.recipe.title}</Text>
                  <Text style={styles.suggestionMatch}>
                    Uses: {s.matchedIngredients.slice(0, 3).join(", ")}
                  </Text>
                </View>
                <Text style={styles.matchScore}>{Math.round(s.matchScore * 100)}% match</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Leftover Row ────────────────────────────────────────────────────

function LeftoverRow({
  item,
  onUse,
  onDiscard,
  isUrgent,
}: {
  item: LeftoverPortion;
  onUse: (id: string) => void;
  onDiscard: (id: string) => void;
  isUrgent?: boolean;
}) {
  const daysLeft = item.useBy
    ? Math.max(0, Math.ceil((new Date(item.useBy).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <View style={[styles.leftoverRow, isUrgent && { borderLeftWidth: 3, borderLeftColor: Colors.alert }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.leftoverTitle}>{item.recipeTitle}</Text>
        <Text style={styles.leftoverMeta}>
          {item.portionsRemaining} portion{item.portionsRemaining !== 1 ? "s" : ""}
          {daysLeft !== null && ` · ${daysLeft === 0 ? "Use today" : `${daysLeft}d left`}`}
        </Text>
      </View>
      <View style={styles.leftoverActions}>
        <Pressable onPress={() => onUse(item.id)} style={styles.actionButton}>
          <Check size={16} color={Colors.success} strokeWidth={2} />
        </Pressable>
        <Pressable onPress={() => onDiscard(item.id)} style={styles.actionButton}>
          <Trash2 size={16} color={Colors.text.muted} strokeWidth={1.5} />
        </Pressable>
      </View>
    </View>
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
  section: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  leftoverRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingLeft: 4,
  },
  leftoverTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  leftoverMeta: {
    fontSize: FontSizes.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  leftoverActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  suggestionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  suggestionMatch: {
    fontSize: FontSizes.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  matchScore: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    color: Colors.success,
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
