import { useState, useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ExpoImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { Camera, ImageIcon } from "lucide-react-native";
import { useRecipe, useCreateRecipe, useUpdateRecipe, useUploadRecipeImage } from "../../../hooks/useRecipes";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { TabBar } from "../../../components/ui/Tabs";
import { AllergenPicker } from "../../../components/ui/AllergenPicker";
import { IngredientBuilder, type RecipeIngredientLine } from "../../../components/features/IngredientBuilder";
import { MethodEditor, type MethodStep } from "../../../components/features/MethodEditor";
import { PlatingGuide, type PlatingStepLocal } from "../../../components/features/PlatingGuide";
import { CCPTimeline, type CCPLocal } from "../../../components/features/CCPTimeline";
import { RecipeTypeSelector, type RecipeType } from "../../../components/features/RecipeTypeSelector";
import { RecipeSectionsManager } from "../../../components/features/RecipeSectionsManager";
import { useRecipeSections } from "../../../hooks/useRecipeSections";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Settings2 } from "lucide-react-native";

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

const DEFAULT_CATEGORIES = [
  { label: "Main", value: "Main" },
  { label: "Starter", value: "Starter" },
  { label: "Dessert", value: "Dessert" },
  { label: "Side", value: "Side" },
  { label: "Sauce", value: "Sauce" },
  { label: "Bread", value: "Bread" },
  { label: "Beverage", value: "Beverage" },
  { label: "Other", value: "Other" },
];

export default function RecipeEdit() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const isNew = !params.id || params.id === "new";
  const { data: existing, isLoading } = useRecipe(isNew ? undefined : params.id);
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const uploadImage = useUploadRecipeImage();
  const { data: dynamicSections = [] } = useRecipeSections();

  const [tab, setTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [showSectionsManager, setShowSectionsManager] = useState(false);

  // Image
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Basic fields
  const [name, setName] = useState("");
  const [recipeType, setRecipeType] = useState<RecipeType>("dish");
  const [category, setCategory] = useState("Main");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [targetFC, setTargetFC] = useState("30");
  const [allergens, setAllergens] = useState<string[]>([]);

  // Storage & Shelf Life
  const [shelfLifeDays, setShelfLifeDays] = useState("");
  const [shelfLifeHours, setShelfLifeHours] = useState("");
  const [storageTemp, setStorageTemp] = useState("Refrigerated");
  const [storageNotes, setStorageNotes] = useState("");

  // Batch/Portion Prep fields
  const [totalYield, setTotalYield] = useState("");
  const [yieldUnit, setYieldUnit] = useState("kg");

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredientLine[]>([]);

  // Auto-compute allergens from linked ingredients
  const ingredientAllergens = useMemo(() => {
    const all = new Set<string>();
    ingredients.forEach((item) => {
      item.allergens?.forEach((a: string) => all.add(a));
    });
    return Array.from(all);
  }, [ingredients]);

  useEffect(() => {
    if (ingredientAllergens.length > 0) {
      setAllergens((prev) => {
        const merged = new Set([...prev, ...ingredientAllergens]);
        const arr = Array.from(merged);
        if (arr.length === prev.length && arr.every((a) => prev.includes(a))) return prev;
        return arr;
      });
    }
  }, [ingredientAllergens]);

  // Method
  const [steps, setSteps] = useState<MethodStep[]>([]);

  // Plating
  const [platingSteps, setPlatingSteps] = useState<PlatingStepLocal[]>([]);

  // CCPs
  const [ccps, setCcps] = useState<CCPLocal[]>([]);

  // Populate from existing recipe
  useEffect(() => {
    if (!existing) return;
    setName(existing.name || "");
    setRecipeType((existing.recipe_type as RecipeType) || "dish");
    setCategory(existing.category || "Main");
    setDescription(existing.description || "");
    setServings(existing.servings?.toString() || "");
    setPrepTime(existing.prep_time?.toString() || "");
    setCookTime(existing.cook_time?.toString() || "");
    setSellPrice(existing.sell_price?.toString() || "");
    setTargetFC(existing.target_food_cost_percent?.toString() || "30");
    setAllergens(existing.allergens || []);
    setImageUrl(existing.image_url || null);
    setShelfLifeDays(existing.shelf_life_days?.toString() || "");
    setShelfLifeHours(existing.shelf_life_hours?.toString() || "");
    setStorageTemp(existing.storage_temp || "Refrigerated");
    setStorageNotes(existing.storage_notes || "");
    setTotalYield(existing.total_yield?.toString() || "");
    setYieldUnit(existing.yield_unit || "kg");
    if (Array.isArray(existing.ingredients)) {
      setIngredients(existing.ingredients as RecipeIngredientLine[]);
    }
    if (Array.isArray(existing.instructions)) {
      setSteps(
        (existing.instructions as any[]).map((s) =>
          typeof s === "string" ? { text: s } : s
        )
      );
    }
  }, [existing]);

  // Cost calculation
  const totalCost = useMemo(() => {
    return ingredients.reduce((sum, i) => sum + ((i.quantity || 0) * (i.cost_per_unit || 0)), 0);
  }, [ingredients]);
  const costPerServing = servings && Number(servings) > 0 ? totalCost / Number(servings) : 0;
  const foodCostPct = sellPrice && Number(sellPrice) > 0 && costPerServing > 0
    ? ((costPerServing / Number(sellPrice)) * 100).toFixed(1)
    : null;

  const pickImage = async (useCamera: boolean) => {
    const permMethod = useCamera
      ? ExpoImagePicker.requestCameraPermissionsAsync
      : ExpoImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permMethod();
    if (status !== "granted") {
      Alert.alert("Permission Required", `Please grant ${useCamera ? "camera" : "photo library"} access in Settings.`);
      return;
    }
    const method = useCamera ? ExpoImagePicker.launchCameraAsync : ExpoImagePicker.launchImageLibraryAsync;
    const result = await method({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert("Recipe Image", "Choose a source", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Photo Library", onPress: () => pickImage(false) },
      ...(localImageUri || imageUrl ? [{ text: "Remove", style: "destructive" as const, onPress: () => { setLocalImageUri(null); setImageUrl(null); } }] : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Recipe name is required"); return; }
    setSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (localImageUri) {
        setUploadingImage(true);
        finalImageUrl = await uploadImage.mutateAsync({ recipeId: params.id, uri: localImageUri });
        setUploadingImage(false);
      }
      const data: any = {
        name: name.trim(),
        recipe_type: recipeType,
        category,
        description: description.trim() || null,
        servings: servings ? Number(servings) : null,
        prep_time: prepTime ? Number(prepTime) : null,
        cook_time: cookTime ? Number(cookTime) : null,
        sell_price: sellPrice ? Number(sellPrice) : null,
        target_food_cost_percent: targetFC ? Number(targetFC) : null,
        allergens: allergens.length > 0 ? allergens : null,
        ingredients: ingredients.length > 0 ? ingredients : null,
        instructions: steps.length > 0 ? steps : null,
        cost_per_serving: costPerServing > 0 ? Number(costPerServing.toFixed(2)) : null,
        image_url: finalImageUrl,
        shelf_life_days: shelfLifeDays ? Number(shelfLifeDays) : 0,
        shelf_life_hours: shelfLifeHours ? Number(shelfLifeHours) : 0,
        storage_temp: storageTemp || null,
        storage_notes: storageNotes.trim() || null,
        total_yield: totalYield ? Number(totalYield) : null,
        yield_unit: yieldUnit || null,
      };
      if (isNew) {
        await createRecipe.mutateAsync(data);
        Alert.alert("Created", `"${name}" created successfully`);
      } else {
        await updateRecipe.mutateAsync({ id: params.id!, ...data });
        Alert.alert("Updated", `"${name}" updated successfully`);
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save recipe");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  if (!isNew && isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 16, color: colors.accent }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{isNew ? "New Recipe" : "Edit Recipe"}</Text>
        <Pressable onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.accent }}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Tabs */}
      <TabBar
        tabs={[
          { key: "basic", label: "Basic" },
          { key: "ingredients", label: `Ingredients (${ingredients.length})` },
          { key: "method", label: `Method (${steps.length})` },
          { key: "plating", label: `Plating (${platingSteps.length})` },
          ...(!IS_HOMECHEF ? [{ key: "ccps", label: `CCPs (${ccps.length})` }] : []),
          ...(!IS_HOMECHEF ? [{ key: "cost", label: "Cost" }] : []),
        ]}
        activeTab={tab}
        onTabChange={setTab}
        style={{ marginHorizontal: 16, marginTop: 12 }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} keyboardShouldPersistTaps="handled">

          {tab === "basic" && (
            <>
              {/* Image */}
              <Pressable onPress={showImageOptions} style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", overflow: "hidden" }}>
                {localImageUri || imageUrl ? (
                  <View>
                    <Image source={{ uri: localImageUri || imageUrl! }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
                    {uploadingImage && (
                      <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                        <ActivityIndicator color="#FFFFFF" />
                        <Text style={{ color: "#FFFFFF", fontSize: 12, marginTop: 4 }}>Uploading...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ height: 140, alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Camera size={32} color={colors.textSecondary} strokeWidth={1.5} />
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>Add Recipe Photo</Text>
                  </View>
                )}
              </Pressable>

              <Input label="Name" value={name} onChangeText={setName} placeholder="Recipe name" />

              {/* Recipe Type (pro only) */}
              {!IS_HOMECHEF && (
                <RecipeTypeSelector value={recipeType} onChange={setRecipeType} />
              )}

              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Select label="Category" value={category} onValueChange={setCategory} options={[
                    ...dynamicSections.map((s) => ({ label: s.name, value: s.name })),
                    ...DEFAULT_CATEGORIES,
                  ]} />
                </View>
                <Pressable onPress={() => setShowSectionsManager(true)} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Settings2 size={18} color={colors.textSecondary} strokeWidth={1.5} />
                </Pressable>
              </View>
              <Input label="Description" value={description} onChangeText={setDescription} placeholder="Brief description" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}><Input label="Servings" value={servings} onChangeText={setServings} placeholder="4" keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Input label="Prep (min)" value={prepTime} onChangeText={setPrepTime} placeholder="15" keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Input label="Cook (min)" value={cookTime} onChangeText={setCookTime} placeholder="30" keyboardType="numeric" /></View>
              </View>

              {/* Batch/Portion Prep yield fields */}
              {(recipeType === "batch_prep" || recipeType === "portion_prep") && !IS_HOMECHEF && (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Input label={recipeType === "batch_prep" ? "Batch Yield" : "Yield %"} value={totalYield} onChangeText={setTotalYield} placeholder={recipeType === "batch_prep" ? "10" : "75"} keyboardType="decimal-pad" />
                  </View>
                  {recipeType === "batch_prep" && (
                    <View style={{ flex: 1 }}>
                      <Select label="Yield Unit" value={yieldUnit} onValueChange={setYieldUnit} options={[
                        { label: "kg", value: "kg" }, { label: "L", value: "L" }, { label: "portions", value: "portions" }, { label: "each", value: "each" },
                      ]} />
                    </View>
                  )}
                </View>
              )}

              {!IS_HOMECHEF && (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}><Input label="Sell Price ($)" value={sellPrice} onChangeText={setSellPrice} placeholder="25.00" keyboardType="decimal-pad" /></View>
                  <View style={{ flex: 1 }}><Input label="Target FC (%)" value={targetFC} onChangeText={setTargetFC} placeholder="30" keyboardType="numeric" /></View>
                </View>
              )}
              <AllergenPicker label="Allergens" value={allergens} onChange={setAllergens} />
              {ingredientAllergens.length > 0 && (
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: -4 }}>
                  Auto-detected from ingredients: {ingredientAllergens.join(", ")}
                </Text>
              )}

              {/* Storage & Shelf Life */}
              <View style={{ gap: 12, marginTop: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>Storage & Shelf Life</Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}><Input label="Shelf Life (days)" value={shelfLifeDays} onChangeText={setShelfLifeDays} placeholder="3" keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><Input label="Shelf Life (hours)" value={shelfLifeHours} onChangeText={setShelfLifeHours} placeholder="0" keyboardType="numeric" /></View>
                </View>
                <Select label="Storage Temperature" value={storageTemp} onValueChange={setStorageTemp} options={[
                  { label: "Refrigerated (0-5°C)", value: "Refrigerated" },
                  { label: "Frozen (-18°C)", value: "Frozen" },
                  { label: "Ambient", value: "Ambient" },
                  { label: "Hot Hold (63°C+)", value: "Hot Hold" },
                ]} />
                <Input label="Storage Notes" value={storageNotes} onChangeText={setStorageNotes} placeholder="Store in airtight container..." multiline numberOfLines={2} style={{ minHeight: 50, textAlignVertical: "top" }} />
              </View>
            </>
          )}

          {tab === "ingredients" && (
            <IngredientBuilder items={ingredients} onChange={setIngredients} />
          )}

          {tab === "method" && (
            <MethodEditor steps={steps} onChange={setSteps} />
          )}

          {tab === "plating" && (
            <PlatingGuide steps={platingSteps} onChange={setPlatingSteps} />
          )}

          {tab === "ccps" && !IS_HOMECHEF && (
            <CCPTimeline ccps={ccps} onChange={setCcps} />
          )}

          {tab === "cost" && !IS_HOMECHEF && (
            <View style={{ gap: 16 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Cost Summary</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textSecondary }}>Total Ingredient Cost</Text>
                  <Text style={{ fontWeight: "600" }}>${totalCost.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textSecondary }}>Cost per Serving</Text>
                  <Text style={{ fontWeight: "600" }}>${costPerServing.toFixed(2)}</Text>
                </View>
                {sellPrice && Number(sellPrice) > 0 && (
                  <>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.textSecondary }}>Sell Price</Text>
                      <Text style={{ fontWeight: "600" }}>${Number(sellPrice).toFixed(2)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.textSecondary }}>Food Cost %</Text>
                      <Text style={{ fontWeight: "700", color: foodCostPct && Number(foodCostPct) > Number(targetFC || 30) ? colors.destructive : colors.success }}>
                        {foodCostPct || "—"}%
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.textSecondary }}>Gross Profit / Serve</Text>
                      <Text style={{ fontWeight: "600", color: colors.success }}>
                        ${(Number(sellPrice) - costPerServing).toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              {ingredients.length === 0 && (
                <View style={{ backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
                  <Text style={{ fontSize: 14, color: colors.accent, lineHeight: 20 }}>
                    Add ingredients with cost data in the Ingredients tab to see cost analysis here.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <RecipeSectionsManager visible={showSectionsManager} onClose={() => setShowSectionsManager(false)} />
    </SafeAreaView>
  );
}
