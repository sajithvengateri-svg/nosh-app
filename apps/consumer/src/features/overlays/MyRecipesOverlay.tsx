import { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { UtensilsCrossed, Bookmark, ChefHat } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useFavouritesStore } from "../../lib/stores/favouritesStore";
import { lightTap } from "../../lib/haptics";

type Tab = "saved" | "cooked";

export function MyRecipesOverlay() {
  const { favourites, cookLog, isLoading, fetchFavourites, fetchCookLog } =
    useFavouritesStore();
  const [activeTab, setActiveTab] = useState<Tab>("saved");

  useEffect(() => {
    fetchFavourites();
    fetchCookLog();
  }, [fetchFavourites, fetchCookLog]);

  const savedRecipes = favourites.map((f) => ({
    id: f.id,
    recipe_id: f.recipe_id,
    title: f.recipe?.title ?? "Untitled",
    hero_image_url: f.recipe?.hero_image_url,
    cuisine: f.recipe?.cuisine ?? "",
    vessel: f.recipe?.vessel ?? "",
    total_time_minutes: f.recipe?.total_time_minutes ?? 0,
  }));

  const cookedRecipes = cookLog.map((c) => ({
    id: c.id,
    recipe_id: c.recipe_id,
    title: c.recipe?.title ?? "Untitled",
    hero_image_url: c.recipe?.hero_image_url,
    cuisine: c.recipe?.cuisine ?? "",
    vessel: c.recipe?.vessel ?? "",
    total_time_minutes: c.recipe?.total_time_minutes ?? 0,
    rating: c.rating,
  }));

  const recipes = activeTab === "saved" ? savedRecipes : cookedRecipes;

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["saved", "cooked"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              lightTap();
              setActiveTab(tab);
            }}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "saved" ? `Saved (${savedRecipes.length})` : `Cooked (${cookedRecipes.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              lightTap();
              router.push(`/(app)/recipe/${item.recipe_id}`);
            }}
          >
            {item.hero_image_url ? (
              <Image
                source={{ uri: item.hero_image_url }}
                style={styles.cardImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                <UtensilsCrossed size={32} color={Colors.text.muted} strokeWidth={1.5} />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardMeta}>
                {item.cuisine}{item.cuisine ? " · " : ""}{item.total_time_minutes}m{item.vessel ? ` · ${item.vessel}` : ""}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={{ marginBottom: 12 }}>
              {activeTab === "saved" ? (
                <Bookmark size={40} color={Colors.text.muted} strokeWidth={1.5} />
              ) : (
                <ChefHat size={40} color={Colors.text.muted} strokeWidth={1.5} />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === "saved"
                ? "No saved recipes yet"
                : "No cooked recipes yet"}
            </Text>
            <Text style={styles.emptyText}>
              {isLoading
                ? "Loading..."
                : activeTab === "saved"
                  ? "Save recipes from the feed to find them here."
                  : "Recipes you cook will appear here with your ratings."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Glass.surface, alignItems: "center", borderWidth: 1, borderColor: Glass.borderLight },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.text.secondary },
  tabTextActive: { color: "#FFF" },
  card: { flex: 1, backgroundColor: Glass.surface, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: Glass.borderLight, shadowColor: Glass.shadowLight.color, shadowOffset: Glass.shadowLight.offset, shadowRadius: Glass.shadowLight.radius },
  cardImage: { width: "100%", height: 100 },
  cardImagePlaceholder: { backgroundColor: Colors.border, justifyContent: "center", alignItems: "center" },
  cardContent: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: Colors.text.primary },
  cardMeta: { fontSize: 11, color: Colors.text.secondary, marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: Colors.secondary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.text.secondary, textAlign: "center", lineHeight: 20 },
});
