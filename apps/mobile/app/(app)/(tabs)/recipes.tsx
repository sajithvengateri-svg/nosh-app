import { useState, useMemo, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe, type Recipe } from "../../../hooks/useRecipes";
import { useRecipeSections } from "../../../hooks/useRecipeSections";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Select } from "../../../components/ui/Select";
import { HubGrid, type HubItem } from "../../../components/features/HubGrid";
import { RecipeImport } from "../../../components/features/RecipeImport";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Carrot, Receipt, Store, TriangleAlert, BookOpen } from "lucide-react-native";

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

const RECIPE_HUB_ITEMS: HubItem[] = [
  { icon: Carrot, label: "Ingredients", route: "/(app)/ingredients", module: "ingredients" },
  ...(!IS_HOMECHEF ? [
    { icon: Receipt, label: "Invoices", route: "/(app)/invoices", module: "invoices" },
    { icon: Store, label: "Marketplace", route: "/(app)/marketplace", module: "marketplace" },
  ] : []),
  { icon: TriangleAlert, label: "Allergens", route: "/(app)/allergens", module: "allergens" },
];

const CATEGORIES = [
  { label: "Main", value: "Main" },
  { label: "Starter", value: "Starter" },
  { label: "Dessert", value: "Dessert" },
  { label: "Side", value: "Side" },
  { label: "Sauce", value: "Sauce" },
  { label: "Bread", value: "Bread" },
  { label: "Beverage", value: "Beverage" },
  { label: "Other", value: "Other" },
];

function RecipeCard({ recipe, onPress, onLongPress }: { recipe: Recipe; onPress: () => void; onLongPress: () => void }) {
  const { colors } = useTheme();
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const foodCostPct =
    recipe.cost_per_serving && recipe.sell_price
      ? ((recipe.cost_per_serving / recipe.sell_price) * 100).toFixed(0)
      : null;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder,
        padding: 16, marginBottom: 10, opacity: pressed ? 0.8 : 1,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 4 }}>{recipe.name}</Text>
          {recipe.category && <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{recipe.category}</Text>}
        </View>
        {recipe.recipe_type && recipe.recipe_type !== "dish" && (
          <Badge variant="secondary">{recipe.recipe_type.replace("_", " ")}</Badge>
        )}
        {recipe.is_batch_recipe && !recipe.recipe_type && <Badge variant="secondary">Batch</Badge>}
      </View>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
        {totalTime > 0 && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{totalTime} min</Text>}
        {recipe.servings && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{recipe.servings} serves</Text>}
        {!IS_HOMECHEF && recipe.cost_per_serving != null && (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>${recipe.cost_per_serving.toFixed(2)}/serve</Text>
        )}
        {!IS_HOMECHEF && foodCostPct && (
          <Text style={{ fontSize: 13, color: Number(foodCostPct) > (recipe.target_food_cost_percent || 35) ? colors.destructive : colors.success, fontWeight: "600" }}>
            {foodCostPct}% FC
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function Recipes() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: recipes, isLoading, refetch, isRefetching } = useRecipes();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const { data: dynamicSections = [] } = useRecipeSections();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Main");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [targetFoodCost, setTargetFoodCost] = useState("30");

  // Collect unique categories from recipes + dynamic sections
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    dynamicSections.forEach((s) => cats.add(s.name));
    recipes?.forEach((r) => { if (r.category) cats.add(r.category); });
    return Array.from(cats).sort();
  }, [recipes, dynamicSections]);

  const RECIPE_TYPES = [
    { label: "All", value: null },
    { label: "Dish", value: "dish" },
    { label: "Component", value: "component" },
    { label: "Batch Prep", value: "batch_prep" },
    { label: "Portion Prep", value: "portion_prep" },
  ];

  const filtered = useMemo(() => {
    if (!recipes) return [];
    let result = recipes;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.category && r.category.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      result = result.filter((r) => r.category === selectedCategory);
    }
    if (selectedType) {
      result = result.filter((r) => r.recipe_type === selectedType);
    }
    return result;
  }, [recipes, search, selectedCategory, selectedType]);

  const resetForm = () => {
    setName(""); setCategory("Main"); setDescription(""); setServings("");
    setPrepTime(""); setCookTime(""); setSellPrice(""); setTargetFoodCost("30");
    setEditingRecipe(null);
  };

  const openCreate = () => {
    Alert.alert("New Recipe", "How would you like to create a recipe?", [
      { text: "Blank Recipe", onPress: () => router.push({ pathname: "/(app)/recipe/edit", params: { id: "new" } }) },
      { text: "Import Recipe", onPress: () => setShowImport(true) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openEdit = (recipe: Recipe) => {
    router.push({ pathname: "/(app)/recipe/edit", params: { id: recipe.id } });
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Recipe name is required"); return; }
    setSaving(true);
    try {
      const data: any = {
        name: name.trim(), category, description: description.trim() || null,
        servings: servings ? Number(servings) : null,
        prep_time: prepTime ? Number(prepTime) : null,
        cook_time: cookTime ? Number(cookTime) : null,
        sell_price: sellPrice ? Number(sellPrice) : null,
        target_food_cost_percent: targetFoodCost ? Number(targetFoodCost) : null,
      };
      if (editingRecipe) {
        await updateRecipe.mutateAsync({ id: editingRecipe.id, ...data });
      } else {
        await createRecipe.mutateAsync(data);
      }
      setShowForm(false);
      resetForm();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (recipe: Recipe) => {
    Alert.alert("Delete Recipe", `Are you sure you want to delete "${recipe.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await deleteRecipe.mutateAsync(recipe.id); }
          catch (e: any) { Alert.alert("Error", e.message || "Failed to delete"); }
        },
      },
    ]);
  };

  const handleLongPress = (recipe: Recipe) => {
    Alert.alert(recipe.name, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(recipe) },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(recipe) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 24, paddingBottom: 0 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 12, color: colors.text }}>
          {IS_HOMECHEF ? "My Recipes" : "Recipes"}
        </Text>
        <HubGrid items={RECIPE_HUB_ITEMS} columns={2} viewMode="strip" />
        <Input placeholder="Search recipes..." value={search} onChangeText={setSearch} containerStyle={{ marginTop: 12, marginBottom: 4 }} />

        {/* Category filter chips */}
        {allCategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: !selectedCategory ? colors.accent : colors.surface, borderWidth: 1, borderColor: !selectedCategory ? colors.accent : colors.border }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: !selectedCategory ? "#FFFFFF" : colors.textSecondary }}>All</Text>
            </Pressable>
            {allCategories.map((cat) => {
              const active = selectedCategory === cat;
              const section = dynamicSections.find((s) => s.name === cat);
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(active ? null : cat)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: active ? (section?.color || colors.accent) : colors.surface, borderWidth: 1, borderColor: active ? (section?.color || colors.accent) : colors.border }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#FFFFFF" : colors.textSecondary }}>{cat}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Recipe type filter (pro only) */}
        {!IS_HOMECHEF && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            {RECIPE_TYPES.map((t) => {
              const active = selectedType === t.value;
              return (
                <Pressable
                  key={t.label}
                  onPress={() => setSelectedType(active ? null : t.value)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: active ? colors.accent : colors.surface, borderWidth: 1, borderColor: active ? colors.accent : colors.border }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#FFFFFF" : colors.textSecondary }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="BookOpen"
          title={search ? "No recipes found" : "No recipes yet"}
          description={search ? "Try a different search term" : "Tap + to create your first recipe"}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => router.push({ pathname: "/(app)/recipe/[id]", params: { id: item.id } })}
              onLongPress={() => handleLongPress(item)}
            />
          )}
        />
      )}

      <FAB onPress={openCreate} />

      <FormSheet
        visible={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        onSave={handleSave}
        title={editingRecipe ? "Edit Recipe" : "New Recipe"}
        saving={saving}
      >
        <Input label="Name" value={name} onChangeText={setName} placeholder="Recipe name" />
        <Select label="Category" value={category} onValueChange={setCategory} options={CATEGORIES} />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Brief description" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input label="Servings" value={servings} onChangeText={setServings} placeholder="4" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Prep (min)" value={prepTime} onChangeText={setPrepTime} placeholder="15" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Cook (min)" value={cookTime} onChangeText={setCookTime} placeholder="30" keyboardType="numeric" />
          </View>
        </View>
        {!IS_HOMECHEF && (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input label="Sell Price ($)" value={sellPrice} onChangeText={setSellPrice} placeholder="25.00" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Target FC (%)" value={targetFoodCost} onChangeText={setTargetFoodCost} placeholder="30" keyboardType="numeric" />
            </View>
          </View>
        )}
      </FormSheet>

      <RecipeImport visible={showImport} onClose={() => setShowImport(false)} />
    </SafeAreaView>
  );
}
