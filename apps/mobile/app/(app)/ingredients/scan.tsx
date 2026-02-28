import { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useCreateIngredient } from "../../../hooks/useIngredientMutations";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ImagePicker } from "../../../components/ui/ImagePicker";
import { Input } from "../../../components/ui/Input";
import { useScanner } from "../../../hooks/useScanner";

interface ScannedIngredient {
  name?: string;
  category?: string;
  allergens?: string[];
  unit?: string;
  notes?: string;
}

export default function IngredientScan() {
  const router = useRouter();
  const { colors } = useTheme();
  const createIngredient = useCreateIngredient();
  const { state, scan, results, error, reset } = useScanner<ScannedIngredient>("scan-ingredient");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");

  const handleImage = async (base64: string) => {
    const data = await scan(base64);
    if (data) {
      setName(data.name || "");
      setCategory(data.category || "");
      setUnit(data.unit || "");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name is required"); return; }
    try {
      await createIngredient.mutateAsync({
        name: name.trim(),
        category: category.trim() || null,
        unit: unit.trim() || null,
        allergens: results?.allergens || null,
      });
      Alert.alert("Added", `"${name}" added to ingredients`);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Scan Ingredient" />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        {state === "idle" && (
          <>
            <View style={{ backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
              <Text style={{ fontSize: 14, color: colors.accent, lineHeight: 20 }}>Take a photo of an ingredient label to auto-detect name, category, and allergens.</Text>
            </View>
            <ImagePicker onImageSelected={handleImage} label="Ingredient Photo" buttonText="Scan Label" />
          </>
        )}

        {state === "processing" && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 16 }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>Analyzing ingredient...</Text>
          </View>
        )}

        {state === "error" && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
            <AlertTriangle size={40} color={colors.destructive} />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.destructive }}>Scan Failed</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>{error}</Text>
            <Pressable onPress={reset} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {state === "results" && (
          <>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Detected Ingredient</Text>
            <Input label="Name" value={name} onChangeText={setName} placeholder="Ingredient name" />
            <Input label="Category" value={category} onChangeText={setCategory} placeholder="Meat, Dairy, Produce..." />
            <Input label="Unit" value={unit} onChangeText={setUnit} placeholder="kg, g, L..." />
            {results?.allergens && results.allergens.length > 0 && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>Detected Allergens</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {results.allergens.map((a) => (
                    <View key={a} style={{ backgroundColor: colors.destructiveBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, color: colors.destructive, fontWeight: "600" }}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <Pressable onPress={reset} style={{ flex: 1, borderWidth: 1, borderColor: colors.tabBarBorder, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontWeight: "600", color: colors.textSecondary }}>Scan Again</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={createIngredient.isPending} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: createIngredient.isPending ? 0.6 : 1 }}>
                <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>Add Ingredient</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
