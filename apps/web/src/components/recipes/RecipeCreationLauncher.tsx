import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Pencil,
  FileUp,
  LinkIcon,
  Loader2,
  Check,
  AlertTriangle,
  ChefHat,
  X,
  ArrowLeft,
  Edit3,
  Plus,
  Trash2,
  Sparkles,
  FileImage,
  FileSpreadsheet,
  Info,
  Search,
  Link2,
} from "lucide-react";
import RecipeTypeSelector from "./RecipeTypeSelector";
import type { RecipeType } from "./RecipeTypeSelector";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useRecipeSections } from "@/hooks/useRecipeSections";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import IngredientCombobox from "./IngredientCombobox";
import NewIngredientDialog from "./NewIngredientDialog";
import { findSimilarIngredients, inferCategory, inferUnit } from "@/lib/ingredientMatcher";
import type { IngredientMatch } from "@/lib/ingredientMatcher";

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

interface RecipeCreationLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

const units = ["g", "kg", "ml", "L", "each", "lb", "oz", "bunch", "tbsp", "tsp", "cup"];

type LauncherStep = "choose" | "choose_type" | "camera" | "paste" | "processing" | "review" | "saving";

const processingMessages = [
  "Reading your recipe...",
  "Identifying ingredients...",
  "Matching to your database...",
  "Calculating costs...",
  "Almost there...",
];

const RecipeCreationLauncher = ({ isOpen, onClose }: RecipeCreationLauncherProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { sections } = useRecipeSections();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<LauncherStep>("choose");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingMsgIndex, setProcessingMsgIndex] = useState(0);
  const [selectedRecipeType, setSelectedRecipeType] = useState<RecipeType>("dish");
  const [pendingAction, setPendingAction] = useState<"blank" | "camera" | "file" | null>(null);

  // Ingredient matching state
  const [allIngredients, setAllIngredients] = useState<{ id: string; name: string; unit: string; cost_per_unit: number; category: string }[]>([]);
  const [linkingIndex, setLinkingIndex] = useState<number | null>(null);
  const [newIngredientDialogOpen, setNewIngredientDialogOpen] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientMatches, setNewIngredientMatches] = useState<IngredientMatch[]>([]);

  // Fetch ingredients when entering review step
  useEffect(() => {
    if (step === "review") {
      supabase
        .from("ingredients")
        .select("id, name, unit, cost_per_unit, category")
        .order("name")
        .then(({ data }) => {
          if (data) setAllIngredients(data);
        });
    }
  }, [step]);

  // Cycle processing messages
  const startProcessingMessages = () => {
    setProcessingMsgIndex(0);
    const interval = setInterval(() => {
      setProcessingMsgIndex((prev) => {
        if (prev >= processingMessages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);
    return interval;
  };

  const handleClose = () => {
    setStep("choose");
    setSelectedFile(null);
    setPreviewUrl(null);
    setPasteText("");
    setExtractedRecipe(null);
    setError(null);
    setSelectedRecipeType("dish");
    setPendingAction(null);
    setLinkingIndex(null);
    setNewIngredientDialogOpen(false);
    onClose();
  };

  // Navigate to type selection before actual action
  const goToTypeStep = (action: "blank" | "camera" | "file") => {
    setPendingAction(action);
    setStep("choose_type");
  };

  const handleTypeConfirm = () => {
    if (pendingAction === "blank") {
      handleStartBlank();
    } else if (pendingAction === "camera") {
      cameraInputRef.current?.click();
    } else if (pendingAction === "file") {
      fileInputRef.current?.click();
    }
  };

  // === PATH 1: Start Blank ===
  const handleStartBlank = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        name: "",
        category: "Mains",
        prep_time: 0,
        cook_time: 0,
        servings: 4,
        cost_per_serving: 0,
        sell_price: 0,
        target_food_cost_percent: 30,
        gst_percent: 10,
        total_yield: 4,
        yield_unit: "portions",
        food_cost_low_alert: 20,
        food_cost_high_alert: 35,
        created_by: user?.id,
        org_id: currentOrg?.id,
        is_public: true,
        recipe_type: selectedRecipeType,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create recipe");
      return;
    }
    handleClose();
    navigate(`/recipes/${data.id}/edit`);
  };

  // === PATH 2: Camera / File ===
  const handleFile = (file: File) => {
    const validTypes = [
      "image/jpeg", "image/png", "image/webp", "image/heic",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/plain",
      "text/csv",
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|pdf|doc|docx|txt|xlsx|xls|csv|numbers|pages)$/i)) {
      toast.error("This file type isn't supported yet. Try exporting to PDF or Excel first.");
      setError("Unsupported file type. Use images, PDFs, Excel, or Word docs.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 20MB.`);
      return;
    }

    setSelectedFile(file);
    setError(null);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }
    setStep("camera");
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  // === EXTRACT (file or text) ===
  const processExtraction = async (mode: "file" | "text") => {
    setStep("processing");
    setError(null);
    const interval = startProcessingMessages();

    try {
      const { data: ingredients } = await supabase
        .from("ingredients")
        .select("id, name, unit, cost_per_unit");

      let response: Response;

      if (mode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("ingredients", JSON.stringify(ingredients || []));

        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-recipe`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          }
        );
      } else {
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-recipe`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: pasteText,
              ingredients: ingredients || [],
            }),
          }
        );
      }

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract recipe");
      }

      const result = await response.json();
      if (result.success && result.recipe) {
        setExtractedRecipe(result.recipe);
        setStep("review");
      } else {
        throw new Error("No recipe data extracted");
      }
    } catch (err) {
      clearInterval(interval);
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process");
      setStep("choose");
    }
  };

  // === INGREDIENT LINKING HANDLERS ===
  const handleLinkIngredient = (index: number) => {
    setLinkingIndex(linkingIndex === index ? null : index);
  };

  const handleSelectExistingIngredient = (index: number, ingredientId: string) => {
    const found = allIngredients.find(i => i.id === ingredientId);
    if (found && extractedRecipe) {
      const newIngredients = [...extractedRecipe.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        matched_ingredient_id: found.id,
        matched_ingredient_name: found.name,
        estimated_cost: found.cost_per_unit * newIngredients[index].quantity,
      };
      setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });
      setLinkingIndex(null);
    }
  };

  const handleOpenCreateDialog = (index: number, searchTerm: string, matches: IngredientMatch[]) => {
    setLinkingIndex(null);
    setNewIngredientName(searchTerm || extractedRecipe?.ingredients[index]?.name || "");
    setNewIngredientMatches(matches);
    // Store the index so we can update after creation
    setLinkingIndex(index);
    setNewIngredientDialogOpen(true);
  };

  const handleCreateNewIngredient = async (index: number, ingredient: { name: string; unit: string; category: string; cost_per_unit: number }) => {
    const { data, error: insertError } = await supabase
      .from("ingredients")
      .insert({
        name: ingredient.name,
        unit: ingredient.unit,
        category: ingredient.category,
        cost_per_unit: ingredient.cost_per_unit,
        org_id: currentOrg?.id,
      })
      .select()
      .single();

    if (insertError || !data) {
      toast.error("Failed to create ingredient");
      return;
    }

    // Add to local list
    setAllIngredients(prev => [...prev, data as any]);

    // Update the extracted ingredient row
    if (extractedRecipe) {
      const newIngredients = [...extractedRecipe.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        matched_ingredient_id: data.id,
        matched_ingredient_name: data.name,
        estimated_cost: data.cost_per_unit * newIngredients[index].quantity,
      };
      setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });
    }

    setNewIngredientDialogOpen(false);
    setLinkingIndex(null);
    toast.success(`Created "${ingredient.name}" and linked it`);
  };

  // === SAVE ===
  const saveRecipe = async () => {
    if (!extractedRecipe) return;
    setStep("saving");

    try {
      // Auto-create any remaining unmatched ingredients
      const unmatched = extractedRecipe.ingredients.filter(i => !i.matched_ingredient_id && i.name.trim());
      const updatedIngredients = [...extractedRecipe.ingredients];

      if (unmatched.length > 0) {
        const toCreate = unmatched.map(ing => ({
          name: ing.name.trim(),
          unit: ing.unit || inferUnit(ing.name),
          category: inferCategory(ing.name),
          cost_per_unit: 0,
          org_id: currentOrg?.id,
        }));

        const { data: created, error: createErr } = await supabase
          .from("ingredients")
          .insert(toCreate)
          .select();

        if (createErr) {
          console.error("Auto-create error:", createErr);
          toast.error("Some ingredients couldn't be auto-created");
        } else if (created) {
          // Map created ingredients back to extracted list
          for (const createdIng of created) {
            const idx = updatedIngredients.findIndex(
              i => !i.matched_ingredient_id && i.name.trim().toLowerCase() === createdIng.name.toLowerCase()
            );
            if (idx !== -1) {
              updatedIngredients[idx] = {
                ...updatedIngredients[idx],
                matched_ingredient_id: createdIng.id,
                matched_ingredient_name: createdIng.name,
              };
            }
          }
        }
      }

      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          name: extractedRecipe.name,
          description: extractedRecipe.description,
          category: extractedRecipe.category,
          servings: extractedRecipe.servings,
          prep_time: extractedRecipe.prep_time,
          cook_time: extractedRecipe.cook_time,
          instructions: extractedRecipe.instructions,
          allergens: extractedRecipe.allergens,
          created_by: user?.id,
          org_id: currentOrg?.id,
          is_public: true,
          recipe_type: selectedRecipeType,
          cost_per_serving: 0,
          sell_price: 0,
          target_food_cost_percent: 30,
          gst_percent: 10,
          total_yield: extractedRecipe.servings,
          yield_unit: "portions",
          food_cost_low_alert: 20,
          food_cost_high_alert: 35,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Insert ALL ingredients (now all should be matched)
      const allRecipeIngredients = updatedIngredients
        .filter((ing) => ing.matched_ingredient_id)
        .map((ing) => ({
          recipe_id: recipe.id,
          ingredient_id: ing.matched_ingredient_id!,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.name !== ing.matched_ingredient_name ? `Original: ${ing.name}` : null,
        }));

      if (allRecipeIngredients.length > 0) {
        await supabase.from("recipe_ingredients").insert(allRecipeIngredients);
      }

      // Insert method steps from extracted instructions
      if (extractedRecipe.instructions && extractedRecipe.instructions.length > 0) {
        const methodSteps = extractedRecipe.instructions
          .filter((inst: string) => inst.trim())
          .map((inst: string, idx: number) => ({
            org_id: currentOrg?.id,
            recipe_id: recipe.id,
            section_number: 1,
            section_title: "Method",
            step_number: idx + 1,
            instruction: inst.trim(),
            sort_order: idx,
          }));

        if (methodSteps.length > 0) {
          const { error: stepsError } = await supabase.from("recipe_method_steps").insert(methodSteps as any);
          if (stepsError) console.error("Error adding method steps:", stepsError);
        }
      }

      const linkedCount = allRecipeIngredients.length;
      toast.success(`Recipe '${extractedRecipe.name}' saved with ${linkedCount} ingredient${linkedCount !== 1 ? "s" : ""} linked!`);
      handleClose();
      navigate(`/recipes/${recipe.id}/edit`);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save recipe");
      setStep("review");
    }
  };

  // === REVIEW HELPERS ===
  const updateRecipeField = (field: keyof ExtractedRecipe, value: unknown) => {
    if (extractedRecipe) {
      setExtractedRecipe({ ...extractedRecipe, [field]: value });
    }
  };

  const updateIngredient = (index: number, field: keyof ExtractedIngredient, value: unknown) => {
    if (extractedRecipe) {
      const newIngredients = [...extractedRecipe.ingredients];
      newIngredients[index] = { ...newIngredients[index], [field]: value };
      setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });
    }
  };

  const removeIngredient = (index: number) => {
    if (extractedRecipe) {
      setExtractedRecipe({
        ...extractedRecipe,
        ingredients: extractedRecipe.ingredients.filter((_, i) => i !== index),
      });
    }
  };

  const addIngredient = () => {
    if (extractedRecipe) {
      setExtractedRecipe({
        ...extractedRecipe,
        ingredients: [...extractedRecipe.ingredients, { name: "", quantity: 0, unit: "g" }],
      });
    }
  };

  const updateInstruction = (index: number, value: string) => {
    if (extractedRecipe) {
      const newInstructions = [...extractedRecipe.instructions];
      newInstructions[index] = value;
      setExtractedRecipe({ ...extractedRecipe, instructions: newInstructions });
    }
  };

  const removeInstruction = (index: number) => {
    if (extractedRecipe) {
      setExtractedRecipe({
        ...extractedRecipe,
        instructions: extractedRecipe.instructions.filter((_, i) => i !== index),
      });
    }
  };

  const addInstruction = () => {
    if (extractedRecipe) {
      setExtractedRecipe({
        ...extractedRecipe,
        instructions: [...extractedRecipe.instructions, ""],
      });
    }
  };

  const totalEstimatedCost = extractedRecipe?.ingredients.reduce(
    (sum, ing) => sum + (ing.estimated_cost || 0), 0
  ) || 0;
  const matchedCount = extractedRecipe?.ingredients.filter((i) => i.matched_ingredient_id).length || 0;
  const totalCount = extractedRecipe?.ingredients.length || 0;

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.numbers,.pages"
        onChange={handleFileInput}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <AnimatePresence mode="wait">
            {/* ========== CHOOSE STEP ========== */}
            {step === "choose" && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                    <ChefHat className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">New Recipe</h2>
                  <p className="text-sm text-muted-foreground">How do you want to start?</p>
                </div>

                {/* Main options grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Snap a Photo - PRIMARY */}
                  <button
                    onClick={() => goToTypeStep("camera")}
                    className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">Snap a Photo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Handwritten, napkin, cookbook
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Extract
                    </Badge>
                  </button>

                  {/* Start Blank */}
                  <button
                    onClick={() => goToTypeStep("blank")}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-foreground/20 hover:bg-muted/50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Pencil className="w-6 h-6 text-foreground/70" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">Start Blank</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Type it in from scratch
                      </p>
                    </div>
                  </button>

                  {/* Import File */}
                  <button
                    onClick={() => goToTypeStep("file")}
                    className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-foreground/20 hover:bg-muted/50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileUp className="w-6 h-6 text-foreground/70" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">Import File</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Excel, PDF, image, or Word doc
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Extract
                    </Badge>
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or paste text / URL</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Paste input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Paste a recipe URL or text..."
                      className="pl-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && pasteText.trim()) {
                          processExtraction("text");
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => processExtraction("text")}
                    disabled={!pasteText.trim()}
                    size="default"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract
                  </Button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========== CHOOSE TYPE STEP ========== */}
            {step === "choose_type" && (
              <motion.div
                key="choose_type"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setStep("choose"); setPendingAction(null); }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold">What type of recipe?</h2>
                    <p className="text-sm text-muted-foreground">This affects costing and how it links to other recipes</p>
                  </div>
                </div>

                <RecipeTypeSelector
                  value={selectedRecipeType}
                  onChange={setSelectedRecipeType}
                />

                <Button onClick={handleTypeConfirm} className="w-full" size="lg">
                  Continue
                </Button>
              </motion.div>
            )}

            {/* ========== CAMERA/FILE PREVIEW STEP ========== */}
            {step === "camera" && selectedFile && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 space-y-4"
              >
                <button
                  onClick={() => {
                    setStep("choose");
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-6 text-center space-y-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Captured recipe"
                      className="max-h-56 mx-auto rounded-xl object-contain shadow-md"
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <FileImage className="w-16 h-16 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{selectedFile.name}</span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setStep("choose");
                      }}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setStep("choose"); setSelectedFile(null); setPreviewUrl(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={() => processExtraction("file")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract Recipe
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ========== PROCESSING STEP ========== */}
            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-12 text-center space-y-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10"
                >
                  <ChefHat className="w-8 h-8 text-primary" />
                </motion.div>
                <div className="space-y-2">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={processingMsgIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-lg font-medium"
                    >
                      {processingMessages[processingMsgIndex]}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-sm text-muted-foreground">
                    AI is reading your recipe and matching ingredients
                  </p>
                </div>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/40"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ========== REVIEW STEP ========== */}
            {step === "review" && extractedRecipe && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col max-h-[85vh]"
              >
                {/* Review Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStep("choose")}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="font-semibold">Review Extracted Recipe</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {matchedCount}/{totalCount} matched
                    </Badge>
                    {totalEstimatedCost > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        ~${totalEstimatedCost.toFixed(2)} est. cost
                      </Badge>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6 pb-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                        <Edit3 className="w-3.5 h-3.5" />
                        BASIC INFO
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Recipe Name</Label>
                          <Input
                            value={extractedRecipe.name}
                            onChange={(e) => updateRecipeField("name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={extractedRecipe.description}
                            onChange={(e) => updateRecipeField("description", e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Category</Label>
                            <Select
                              value={extractedRecipe.category}
                              onValueChange={(v) => updateRecipeField("category", v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sections.map((s) => (
                                  <SelectItem key={s.id} value={s.name}>
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                      {s.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Servings</Label>
                            <Input
                              type="number"
                              min="1"
                              value={extractedRecipe.servings ?? ""}
                              placeholder="e.g. 4"
                              onChange={(e) => {
                                const val = e.target.value;
                                updateRecipeField("servings", val === "" ? null : parseInt(val) || 0);
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Prep (min)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={extractedRecipe.prep_time}
                              onChange={(e) => updateRecipeField("prep_time", parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Cook (min)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={extractedRecipe.cook_time}
                              onChange={(e) => updateRecipeField("cook_time", parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Allergens */}
                    {extractedRecipe.allergens.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">ALLERGENS DETECTED</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {extractedRecipe.allergens.map((allergen) => (
                            <Badge key={allergen} variant="destructive" className="text-xs">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ingredients */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          INGREDIENTS ({totalCount})
                        </h4>
                        <Button variant="ghost" size="sm" onClick={addIngredient}>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {extractedRecipe.ingredients.map((ing, index) => (
                          <div key={index} className="space-y-1">
                            <div
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg border transition-colors",
                                ing.matched_ingredient_id
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-amber-500/30 bg-amber-500/5"
                              )}
                            >
                              <div className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                ing.matched_ingredient_id ? "bg-emerald-500" : "bg-amber-500"
                              )} />
                              <Input
                                value={ing.name}
                                onChange={(e) => updateIngredient(index, "name", e.target.value)}
                                className="flex-1 h-8 text-sm"
                                placeholder="Ingredient"
                              />
                              <Input
                                type="number"
                                value={ing.quantity}
                                onChange={(e) => updateIngredient(index, "quantity", parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-sm"
                              />
                              <Select
                                value={ing.unit}
                                onValueChange={(v) => updateIngredient(index, "unit", v)}
                              >
                                <SelectTrigger className="w-20 h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {units.map((u) => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {ing.estimated_cost ? (
                                <span className="text-xs text-muted-foreground w-16 text-right">
                                  ${ing.estimated_cost.toFixed(2)}
                                </span>
                              ) : null}
                              {/* Link button for unmatched ingredients */}
                              {!ing.matched_ingredient_id && (
                                <button
                                  onClick={() => handleLinkIngredient(index)}
                                  className={cn(
                                    "p-1 rounded transition-colors",
                                    linkingIndex === index
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                  )}
                                  title="Link to existing ingredient"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {ing.matched_ingredient_id && (
                                <span className="text-xs text-emerald-600 truncate max-w-[80px]" title={ing.matched_ingredient_name}>
                                  ✓ {ing.matched_ingredient_name}
                                </span>
                              )}
                              <button
                                onClick={() => removeIngredient(index)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {/* Inline combobox when linking */}
                            {linkingIndex === index && !ing.matched_ingredient_id && (
                              <div className="ml-4 mr-4">
                                <IngredientCombobox
                                  ingredients={allIngredients}
                                  value=""
                                  onChange={(id) => handleSelectExistingIngredient(index, id)}
                                  onCreateNew={(searchTerm, matches) => handleOpenCreateDialog(index, searchTerm, matches)}
                                  placeholder={`Search for "${ing.name}"...`}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Matched
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Unmatched — auto-created on save
                        </span>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          INSTRUCTIONS ({extractedRecipe.instructions.length})
                        </h4>
                        <Button variant="ghost" size="sm" onClick={addInstruction}>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Step
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {extractedRecipe.instructions.map((instruction, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="w-6 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                              {index + 1}.
                            </span>
                            <Textarea
                              value={instruction}
                              onChange={(e) => updateInstruction(index, e.target.value)}
                              rows={1}
                              className="flex-1 text-sm min-h-[2rem] resize-none"
                            />
                            <button
                              onClick={() => removeInstruction(index)}
                              className="p-1 mt-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Review Footer */}
                <div className="p-4 border-t border-border flex items-center justify-between gap-2">
                  {error && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <div className="flex-1" />
                  <Button variant="outline" onClick={() => setStep("choose")}>
                    Cancel
                  </Button>
                  <Button onClick={saveRecipe}>
                    <Check className="w-4 h-4 mr-2" />
                    Save & Edit Recipe
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ========== SAVING STEP ========== */}
            {step === "saving" && (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center space-y-4"
              >
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                <p className="font-medium">Saving your recipe...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* NewIngredientDialog for creating ingredients from review step */}
      <NewIngredientDialog
        open={newIngredientDialogOpen}
        onOpenChange={(open) => {
          setNewIngredientDialogOpen(open);
          if (!open) setLinkingIndex(null);
        }}
        ingredientName={newIngredientName}
        similarMatches={newIngredientMatches}
        onSelectExisting={(id) => {
          if (linkingIndex !== null) {
            handleSelectExistingIngredient(linkingIndex, id);
            setNewIngredientDialogOpen(false);
            setLinkingIndex(null);
          }
        }}
        onCreateNew={(ingredient) => {
          if (linkingIndex !== null) {
            handleCreateNewIngredient(linkingIndex, ingredient);
          }
        }}
      />
    </>
  );
};

export default RecipeCreationLauncher;
