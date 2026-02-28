import { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ExpoImagePicker from "expo-image-picker";
import {
  Camera,
  ClipboardPaste,
  PenLine,
  FileUp,
  X,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeProvider";
import { supabase } from "../../lib/supabase";
import { useIngredients } from "../../hooks/useIngredients";
import { useOrg } from "../../contexts/OrgProvider";

interface ExtractedIngredient {
  name: string;
  quantity: number;
  unit: string;
  matched_ingredient_id?: string;
  matched_ingredient_name?: string;
  estimated_cost?: number;
}

interface ExtractedRecipe {
  name: string;
  description: string;
  category: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  ingredients: ExtractedIngredient[];
  instructions: string[];
  allergens: string[];
}

interface RecipeImportProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete?: (recipeId: string) => void;
}

type ImportMode = "select" | "camera" | "file" | "paste";
type ImportStep = "select" | "capture" | "processing" | "review" | "saving";

type ProcessingStepItem = {
  label: string;
  completed: boolean;
  active: boolean;
};

const SUPABASE_URL = "https://rahociztfiuzyolqvdcz.supabase.co";

const COMMON_UNITS: Record<string, string> = {
  g: "g", gram: "g", grams: "g", kg: "kg", kilogram: "kg",
  ml: "ml", milliliter: "ml", l: "L", liter: "L", litre: "L",
  oz: "oz", ounce: "oz", lb: "lb", pound: "lb",
  cup: "cup", cups: "cup", tbsp: "tbsp", tablespoon: "tbsp",
  tsp: "tsp", teaspoon: "tsp", bunch: "bunch", clove: "clove",
  pinch: "pinch", dash: "dash", piece: "each", pieces: "each",
  whole: "each", slice: "each", slices: "each", sprig: "sprig",
  can: "can", bottle: "bottle", packet: "packet", head: "head",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Dairy": ["milk", "cream", "butter", "cheese", "yogurt", "yoghurt", "curd"],
  "Meat": ["beef", "chicken", "pork", "lamb", "turkey", "duck", "veal", "steak", "mince"],
  "Seafood": ["fish", "salmon", "tuna", "shrimp", "prawn", "crab", "lobster", "mussel", "squid"],
  "Vegetables": ["onion", "garlic", "tomato", "potato", "carrot", "pepper", "celery", "broccoli", "spinach", "lettuce", "mushroom", "zucchini", "eggplant", "cabbage", "leek", "pea"],
  "Fruit": ["apple", "lemon", "lime", "orange", "banana", "berry", "mango", "avocado"],
  "Herbs & Spices": ["basil", "oregano", "thyme", "rosemary", "parsley", "cilantro", "coriander", "cumin", "paprika", "turmeric", "cinnamon", "ginger", "chili", "chilli", "pepper", "salt", "bay leaf", "mint", "dill", "sage"],
  "Grains & Pasta": ["rice", "pasta", "noodle", "flour", "bread", "couscous", "quinoa", "oat", "barley"],
  "Oils & Fats": ["oil", "olive oil", "vegetable oil", "coconut oil", "sesame oil", "ghee", "lard"],
  "Condiments": ["soy sauce", "vinegar", "mustard", "ketchup", "mayo", "worcestershire", "hot sauce", "fish sauce"],
  "Baking": ["sugar", "honey", "syrup", "vanilla", "baking powder", "baking soda", "yeast", "cocoa", "chocolate"],
  "Nuts & Seeds": ["almond", "walnut", "cashew", "peanut", "pistachio", "sesame", "sunflower", "pine nut"],
  "Legumes": ["lentil", "chickpea", "bean", "kidney bean", "black bean"],
};

function inferUnit(rawUnit: string): string {
  const normalized = rawUnit.toLowerCase().trim();
  return COMMON_UNITS[normalized] || rawUnit || "each";
}

function inferCategory(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Other";
}

function ProcessingIndicator({ steps, error, slowWarning }: { steps: ProcessingStepItem[]; error?: string | null; slowWarning?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 16, alignItems: "center", paddingVertical: 24 }}>
      {steps.map((step, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            opacity: step.active || step.completed ? 1 : 0.4,
          }}
        >
          {step.completed ? (
            <CheckCircle size={20} color={colors.success} strokeWidth={1.5} />
          ) : step.active ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border }} />
          )}
          <Text
            style={{
              fontSize: 15,
              fontWeight: step.active ? "600" : "400",
              color: step.completed ? colors.success : step.active ? colors.text : colors.textSecondary,
            }}
          >
            {step.label}
          </Text>
        </View>
      ))}

      {slowWarning && !error && (
        <View style={{ marginTop: 4, backgroundColor: colors.accentBg, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 13, color: colors.accent, textAlign: "center", lineHeight: 18 }}>
            Large files can take a bit longer. Hang tight...
          </Text>
        </View>
      )}

      {error && (
        <View style={{ marginTop: 8, backgroundColor: colors.destructiveBg, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 14, color: colors.destructive, textAlign: "center", lineHeight: 20, fontWeight: "500" }}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

export function RecipeImport({ visible, onClose, onImportComplete }: RecipeImportProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { data: existingIngredients } = useIngredients();

  const [mode, setMode] = useState<ImportMode>("select");
  const [step, setStep] = useState<ImportStep>("select");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [selectedFileMime, setSelectedFileMime] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [processingSteps, setProcessingSteps] = useState<ProcessingStepItem[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetState = useCallback(() => {
    setMode("select");
    setStep("select");
    setCapturedImageUri(null);
    setSelectedFileName(null);
    setSelectedFileUri(null);
    setSelectedFileMime(null);
    setPasteText("");
    setProcessingSteps([]);
    setExtractError(null);
    setExtractedRecipe(null);
    setSaving(false);
    setShowSlowWarning(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
  }, []);

  useEffect(() => {
    if (!visible) resetState();
  }, [visible, resetState]);

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || "";
  };

  const getIngredientsPayload = () => {
    if (!existingIngredients) return "[]";
    return JSON.stringify(
      existingIngredients.map((i: any) => ({
        id: i.id,
        name: i.name,
        unit: i.unit || "each",
        cost_per_unit: i.cost_per_unit || 0,
      }))
    );
  };

  // --- AI Extraction via Supabase Edge Function ---
  const extractFromFile = async (fileUri: string, mimeType: string, fileName: string) => {
    setStep("processing");
    setExtractError(null);

    const stepLabels = ["Reading file...", "Extracting recipe data...", "Matching ingredients..."];
    setProcessingSteps(stepLabels.map((label, i) => ({ label, completed: false, active: i === 0 })));
    setShowSlowWarning(false);
    slowTimerRef.current = setTimeout(() => setShowSlowWarning(true), 15000);

    try {
      const token = await getAuthToken();
      const formData = new FormData();

      formData.append("file", {
        uri: fileUri,
        type: mimeType || "image/jpeg",
        name: fileName || "recipe.jpg",
      } as any);
      formData.append("ingredients", getIngredientsPayload());

      setProcessingSteps(stepLabels.map((label, i) => ({ label, completed: i < 1, active: i === 1 })));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-recipe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      setProcessingSteps(stepLabels.map((label, i) => ({ label, completed: i < 2, active: i === 2 })));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Extraction failed (${response.status})`);
      }

      const result = await response.json();
      if (result.success && result.recipe) {
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        setShowSlowWarning(false);
        setProcessingSteps(stepLabels.map((label) => ({ label, completed: true, active: false })));
        setExtractedRecipe(result.recipe);
        setStep("review");
      } else {
        throw new Error("No recipe data extracted");
      }
    } catch (err: any) {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setShowSlowWarning(false);
      setExtractError(err.message || "Failed to extract recipe");
      setProcessingSteps(stepLabels.map((label, i) => ({
        label, completed: i < 2, active: false,
      })));
    }
  };

  const extractFromText = async (text: string) => {
    setStep("processing");
    setExtractError(null);

    const stepLabels = ["Analyzing text...", "Extracting recipe data...", "Matching ingredients..."];
    setProcessingSteps(stepLabels.map((label, i) => ({ label, completed: false, active: i === 0 })));
    setShowSlowWarning(false);
    slowTimerRef.current = setTimeout(() => setShowSlowWarning(true), 15000);

    try {
      const token = await getAuthToken();
      const ingredients = existingIngredients?.map((i: any) => ({
        id: i.id, name: i.name, unit: i.unit || "each", cost_per_unit: i.cost_per_unit || 0,
      })) || [];

      setProcessingSteps(stepLabels.map((label, i) => ({ label, completed: i < 1, active: i === 1 })));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-recipe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, ingredients }),
      });

      setProcessingSteps(stepLabels.map((label, i) => ({ label, completed: i < 2, active: i === 2 })));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Extraction failed (${response.status})`);
      }

      const result = await response.json();
      if (result.success && result.recipe) {
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        setShowSlowWarning(false);
        setProcessingSteps(stepLabels.map((label) => ({ label, completed: true, active: false })));
        setExtractedRecipe(result.recipe);
        setStep("review");
      } else {
        throw new Error("No recipe data extracted");
      }
    } catch (err: any) {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setShowSlowWarning(false);
      setExtractError(err.message || "Failed to extract recipe");
      setProcessingSteps(stepLabels.map((label, i) => ({
        label, completed: i < 1, active: false,
      })));
    }
  };

  // --- Handlers ---
  const handleCameraLaunch = async () => {
    try {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera access in Settings to scan recipes.");
        return;
      }
      setMode("camera");
      setStep("capture");

      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImageUri(asset.uri);
        await extractFromFile(asset.uri, asset.mimeType || "image/jpeg", "recipe-photo.jpg");
      } else {
        setStep("select");
        setMode("select");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to open camera");
      setStep("select");
      setMode("select");
    }
  };

  const handleFilePick = async () => {
    try {
      setMode("file");

      let DocumentPicker: typeof import("expo-document-picker");
      try {
        DocumentPicker = await import("expo-document-picker");
      } catch {
        Alert.alert("Not Available", "File picker is not available in Expo Go. Please use Camera or Paste Text instead.");
        setMode("select");
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf", "text/*",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword", "application/vnd.ms-excel",
          "text/csv"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        setMode("select");
        return;
      }

      const asset = result.assets[0];
      setSelectedFileName(asset.name);
      setSelectedFileUri(asset.uri);
      setSelectedFileMime(asset.mimeType || "application/octet-stream");
      setStep("capture");

      await extractFromFile(asset.uri, asset.mimeType || "application/octet-stream", asset.name);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to pick file");
      setMode("select");
    }
  };

  const handlePasteExtract = async () => {
    if (!pasteText.trim()) {
      Alert.alert("Empty Text", "Please paste some recipe text first.");
      return;
    }
    await extractFromText(pasteText.trim());
  };

  const handleManualEntry = () => {
    onClose();
    router.push("/(app)/recipe/edit?id=new");
  };

  const handleBackToSelect = () => {
    resetState();
  };

  // --- Review Step Editing ---
  const updateField = (field: keyof ExtractedRecipe, value: any) => {
    if (extractedRecipe) setExtractedRecipe({ ...extractedRecipe, [field]: value });
  };

  const updateIngredient = (index: number, field: keyof ExtractedIngredient, value: any) => {
    if (!extractedRecipe) return;
    const updated = [...extractedRecipe.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedRecipe({ ...extractedRecipe, ingredients: updated });
  };

  const removeIngredient = (index: number) => {
    if (!extractedRecipe) return;
    setExtractedRecipe({ ...extractedRecipe, ingredients: extractedRecipe.ingredients.filter((_, i) => i !== index) });
  };

  const addIngredient = () => {
    if (!extractedRecipe) return;
    setExtractedRecipe({ ...extractedRecipe, ingredients: [...extractedRecipe.ingredients, { name: "", quantity: 0, unit: "g" }] });
  };

  const updateInstruction = (index: number, value: string) => {
    if (!extractedRecipe) return;
    const updated = [...extractedRecipe.instructions];
    updated[index] = value;
    setExtractedRecipe({ ...extractedRecipe, instructions: updated });
  };

  const removeInstruction = (index: number) => {
    if (!extractedRecipe) return;
    setExtractedRecipe({ ...extractedRecipe, instructions: extractedRecipe.instructions.filter((_, i) => i !== index) });
  };

  const addInstruction = () => {
    if (!extractedRecipe) return;
    setExtractedRecipe({ ...extractedRecipe, instructions: [...extractedRecipe.instructions, ""] });
  };

  // --- Save Flow ---
  const handleSave = async () => {
    if (!extractedRecipe || !extractedRecipe.name.trim()) {
      Alert.alert("Error", "Recipe name is required");
      return;
    }
    setSaving(true);
    setStep("saving");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Auto-create unmatched ingredients with inferred unit & category
      const unmatched = extractedRecipe.ingredients.filter((i) => !i.matched_ingredient_id && i.name.trim());
      if (unmatched.length > 0) {
        const toInsert = unmatched.map((ing) => ({
          name: ing.name.trim(),
          unit: inferUnit(ing.unit),
          category: inferCategory(ing.name),
          cost_per_unit: 0,
          org_id: currentOrg?.id,
        }));

        const { data: created } = await supabase
          .from("ingredients")
          .insert(toInsert)
          .select("id, name");

        if (created) {
          const updatedIngs = [...extractedRecipe.ingredients];
          for (const createdIng of created) {
            const idx = updatedIngs.findIndex(
              (i) => !i.matched_ingredient_id && i.name.trim().toLowerCase() === createdIng.name.toLowerCase()
            );
            if (idx !== -1) {
              updatedIngs[idx] = {
                ...updatedIngs[idx],
                matched_ingredient_id: createdIng.id,
                matched_ingredient_name: createdIng.name,
              };
            }
          }
          extractedRecipe.ingredients = updatedIngs;
        }
      }

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          name: extractedRecipe.name,
          description: extractedRecipe.description || null,
          category: extractedRecipe.category || "Main",
          servings: extractedRecipe.servings || null,
          prep_time: extractedRecipe.prep_time || null,
          cook_time: extractedRecipe.cook_time || null,
          instructions: extractedRecipe.instructions,
          allergens: extractedRecipe.allergens || [],
          created_by: user?.id,
          org_id: currentOrg?.id,
        } as any)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Link matched ingredients
      const matched = extractedRecipe.ingredients.filter((i) => i.matched_ingredient_id);
      if (matched.length > 0) {
        await supabase.from("recipe_ingredients").insert(
          matched.map((ing) => ({
            recipe_id: recipe.id,
            ingredient_id: ing.matched_ingredient_id!,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.name !== ing.matched_ingredient_name ? `Original: ${ing.name}` : null,
          }))
        );
      }

      // Insert method steps
      const validInstructions = extractedRecipe.instructions.filter((i) => i.trim());
      if (validInstructions.length > 0) {
        await supabase.from("recipe_method_steps").insert(
          validInstructions.map((inst, idx) => ({
            org_id: currentOrg?.id,
            recipe_id: recipe.id,
            section_number: 1,
            section_title: "Method",
            step_number: idx + 1,
            instruction: inst.trim(),
            sort_order: idx,
          }))
        );
      }

      onClose();
      onImportComplete?.(recipe.id);
      router.push({ pathname: "/(app)/recipe/[id]", params: { id: recipe.id } });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save recipe");
      setStep("review");
    } finally {
      setSaving(false);
    }
  };

  // --- Import Mode Cards ---
  const IMPORT_MODES = [
    { key: "camera" as const, icon: Camera, title: "Snap a Photo", description: "Scan a recipe card or cookbook page", badge: "AI Extract" },
    { key: "file" as const, icon: FileUp, title: "Import File", description: "PDF, Excel, Word, or image file", badge: "AI Extract" },
    { key: "paste" as const, icon: ClipboardPaste, title: "Paste Text", description: "Paste recipe text or URL content" },
    { key: "manual" as const, icon: PenLine, title: "Start Blank", description: "Create a recipe from scratch" },
  ];

  const matchedCount = extractedRecipe?.ingredients.filter((i) => i.matched_ingredient_id).length || 0;
  const unmatchedCount = (extractedRecipe?.ingredients.length || 0) - matchedCount;

  const getTitle = () => {
    if (step === "review") return "Review Recipe";
    if (step === "saving") return "Saving...";
    if (step === "processing") return "Extracting...";
    switch (mode) {
      case "camera": return "Scan Recipe";
      case "file": return "Import File";
      case "paste": return "Paste Recipe";
      default: return "Import Recipe";
    }
  };

  // --- Render ---
  const renderModeSelection = () => (
    <View style={{ gap: 12, paddingHorizontal: 20, paddingTop: 8 }}>
      {IMPORT_MODES.map((item) => {
        const IconComp = item.icon;
        return (
          <Pressable
            key={item.key}
            onPress={() => {
              if (item.key === "manual") handleManualEntry();
              else if (item.key === "camera") handleCameraLaunch();
              else if (item.key === "file") handleFilePick();
              else { setMode(item.key); setStep("capture"); }
            }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 16,
              backgroundColor: colors.card, borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center" }}>
              <IconComp size={24} color={colors.accent} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{item.title}</Text>
                {item.badge && (
                  <View style={{ backgroundColor: colors.accent + "20", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: colors.accent }}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>{item.description}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderProcessing = () => (
    <View style={{ paddingHorizontal: 20, gap: 16 }}>
      {capturedImageUri && (
        <Image source={{ uri: capturedImageUri }} style={{ width: "100%", height: 200, borderRadius: 14, backgroundColor: colors.surface }} resizeMode="cover" />
      )}
      {selectedFileName && !capturedImageUri && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: colors.surface, borderRadius: 12 }}>
          <FileUp size={20} color={colors.accent} strokeWidth={1.5} />
          <Text style={{ fontSize: 14, color: colors.text, flex: 1 }} numberOfLines={1}>{selectedFileName}</Text>
        </View>
      )}

      <ProcessingIndicator steps={processingSteps} error={extractError} slowWarning={showSlowWarning} />

      {extractError && (
        <Pressable
          onPress={handleBackToSelect}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface,
            borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1,
          })}
        >
          <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textSecondary }}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );

  const renderPasteMode = () => (
    <View style={{ paddingHorizontal: 20, gap: 16 }}>
      <TextInput
        value={pasteText}
        onChangeText={setPasteText}
        placeholder="Paste your recipe text here..."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        style={{
          backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
          padding: 16, fontSize: 15, color: colors.text, minHeight: 200, lineHeight: 22,
        }}
      />
      <Pressable
        onPress={handlePasteExtract}
        style={({ pressed }) => ({
          backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Extract Recipe</Text>
      </Pressable>
      <Pressable
        onPress={handleBackToSelect}
        style={({ pressed }) => ({
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface,
          borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1,
        })}
      >
        <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textSecondary }}>Back</Text>
      </Pressable>
    </View>
  );

  const renderReview = () => {
    if (!extractedRecipe) return null;
    return (
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        {/* Summary Banner */}
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12,
          backgroundColor: unmatchedCount === 0 ? colors.success + "15" : colors.warning + "15",
        }}>
          {unmatchedCount === 0 ? (
            <CheckCircle size={18} color={colors.success} strokeWidth={1.5} />
          ) : (
            <AlertTriangle size={18} color={colors.warning} strokeWidth={1.5} />
          )}
          <Text style={{ fontSize: 13, color: unmatchedCount === 0 ? colors.success : colors.warning, flex: 1, fontWeight: "500" }}>
            {extractedRecipe.ingredients.length} ingredients, {matchedCount} matched
            {unmatchedCount > 0 && ` · ${unmatchedCount} will be auto-created`}
          </Text>
        </View>

        {/* Basic Info */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Recipe Details</Text>
          <TextInput
            value={extractedRecipe.name}
            onChangeText={(v) => updateField("name", v)}
            placeholder="Recipe name"
            placeholderTextColor={colors.textSecondary}
            style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border }}
          />
          <TextInput
            value={extractedRecipe.description}
            onChangeText={(v) => updateField("description", v)}
            placeholder="Description"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={{ backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 60 }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              value={String(extractedRecipe.servings || "")}
              onChangeText={(v) => updateField("servings", parseInt(v) || 0)}
              placeholder="Serves"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }}
            />
            <TextInput
              value={String(extractedRecipe.prep_time || "")}
              onChangeText={(v) => updateField("prep_time", parseInt(v) || 0)}
              placeholder="Prep min"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }}
            />
            <TextInput
              value={String(extractedRecipe.cook_time || "")}
              onChangeText={(v) => updateField("cook_time", parseInt(v) || 0)}
              placeholder="Cook min"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
        </View>

        {/* Ingredients */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              Ingredients ({extractedRecipe.ingredients.length})
            </Text>
            <Pressable onPress={addIngredient} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Plus size={16} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Add</Text>
            </Pressable>
          </View>
          {extractedRecipe.ingredients.map((ing, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10,
                backgroundColor: ing.matched_ingredient_id ? colors.success + "10" : colors.warning + "10",
                borderLeftWidth: 3, borderLeftColor: ing.matched_ingredient_id ? colors.success : colors.warning,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <TextInput
                  value={ing.name}
                  onChangeText={(v) => updateIngredient(idx, "name", v)}
                  style={{ fontSize: 14, fontWeight: "500", color: colors.text, padding: 0 }}
                  placeholder="Ingredient name"
                  placeholderTextColor={colors.textSecondary}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={String(ing.quantity || "")}
                    onChangeText={(v) => updateIngredient(idx, "quantity", parseFloat(v) || 0)}
                    keyboardType="decimal-pad"
                    style={{ fontSize: 12, color: colors.textSecondary, width: 50, padding: 0 }}
                    placeholder="Qty"
                  />
                  <TextInput
                    value={ing.unit}
                    onChangeText={(v) => updateIngredient(idx, "unit", v)}
                    style={{ fontSize: 12, color: colors.textSecondary, width: 40, padding: 0 }}
                    placeholder="Unit"
                  />
                  {ing.matched_ingredient_id ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Check size={12} color={colors.success} strokeWidth={2} />
                      <Text style={{ fontSize: 11, color: colors.success }}>{ing.matched_ingredient_name || "Matched"}</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, color: colors.warning }}>New</Text>
                  )}
                </View>
              </View>
              <Pressable onPress={() => removeIngredient(idx)} hitSlop={8}>
                <Trash2 size={16} color={colors.destructive} strokeWidth={1.5} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              Instructions ({extractedRecipe.instructions.length} steps)
            </Text>
            <Pressable onPress={addInstruction} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Plus size={16} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Add Step</Text>
            </Pressable>
          </View>
          {extractedRecipe.instructions.map((inst, idx) => (
            <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>{idx + 1}</Text>
              </View>
              <TextInput
                value={inst}
                onChangeText={(v) => updateInstruction(idx, v)}
                multiline
                style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 50 }}
              />
              <Pressable onPress={() => removeInstruction(idx)} style={{ marginTop: 10 }} hitSlop={8}>
                <Trash2 size={16} color={colors.destructive} strokeWidth={1.5} />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Allergens */}
        {extractedRecipe.allergens.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Detected Allergens</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {extractedRecipe.allergens.map((allergen, idx) => (
                <View key={idx} style={{ backgroundColor: colors.warning + "15", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.warning }}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => ({
            backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center",
            opacity: pressed ? 0.85 : 1, marginTop: 8,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Import Recipe</Text>
        </Pressable>

        <Pressable
          onPress={handleBackToSelect}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface,
            borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1,
          })}
        >
          <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textSecondary }}>Start Over</Text>
        </Pressable>
      </View>
    );
  };

  const renderSaving = () => (
    <View style={{ paddingVertical: 40, alignItems: "center", gap: 12 }}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>Saving recipe...</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <View style={{ width: 36 }} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{getTitle()}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
              alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1,
            })}
          >
            <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Body */}
        <KeyboardAwareScrollView
          contentContainerStyle={{ paddingVertical: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
          enableAutomaticScroll
          enableResetScrollToCoords={false}
        >
          {step === "select" && renderModeSelection()}
          {step === "capture" && mode === "paste" && renderPasteMode()}
          {step === "processing" && renderProcessing()}
          {(step === "capture" && (mode === "camera" || mode === "file") && !extractError) && renderProcessing()}
          {step === "review" && renderReview()}
          {step === "saving" && renderSaving()}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}
