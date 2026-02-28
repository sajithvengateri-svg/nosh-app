import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Flame } from "lucide-react-native";
import { Colors } from "../../../src/constants/colors";
import { Fonts } from "../../../src/constants/typography";
import { useRecipeStore } from "../../../src/lib/stores/recipeStore";
import { usePantryStore } from "../../../src/lib/stores/pantryStore";
import { useNoshRunStore } from "../../../src/lib/stores/noshRunStore";
import { ShoppingPageOverlay } from "../../../src/features/shopping/ShoppingPageOverlay";
import { lightTap, mediumTap } from "../../../src/lib/haptics";
import type { Recipe } from "../../../src/lib/stores/recipeStore";

export default function ShoppingScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const getRecipeWithDetails = useRecipeStore((s) => s.getRecipeWithDetails);
  const pantryItems = usePantryStore((s) => s.items);
  const startRun = useNoshRunStore((s) => s.startRun);
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!recipeId) return;
    setIsLoading(true);
    getRecipeWithDetails(recipeId).then((r) => {
      setRecipe(r);
      if (r) startRun(r, pantryItems);
      setIsLoading(false);
    });
  }, [recipeId, getRecipeWithDetails, pantryItems, startRun]);

  const handleStartCooking = useCallback(() => {
    if (!recipeId) return;
    mediumTap();
    router.replace(`/(app)/cook-mode/${recipeId}`);
  }, [recipeId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Recipe not found</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: Colors.primary, fontWeight: "600" }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { lightTap(); router.back(); }}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={Colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Shopping</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>
      </View>

      {/* Shop / Run tabs */}
      <ShoppingPageOverlay onClose={handleStartCooking} />

      {/* Sticky CTA */}
      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={handleStartCooking}
          style={({ pressed }) => [styles.cookButton, pressed && { opacity: 0.85 }]}
        >
          <Flame size={18} color="#FFF" strokeWidth={1.5} />
          <Text style={styles.cookButtonText}>Start Cooking</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: Colors.text.secondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 1,
  },
  stickyBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
  },
  cookButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
