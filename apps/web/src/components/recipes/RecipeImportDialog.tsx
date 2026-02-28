import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileImage,
  FileText,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Camera,
  File,
  ChefHat,
  Edit3,
  Plus,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOrg } from "@/contexts/OrgContext";
import { findSimilarIngredients, inferCategory, inferUnit } from "@/lib/ingredientMatcher";
import NewIngredientDialog from "@/components/recipes/NewIngredientDialog";

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

interface RecipeImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (recipeId: string) => void;
}

const categories = ["Mains", "Appetizers", "Soups", "Salads", "Desserts", "Sauces"];
const units = ["g", "kg", "ml", "L", "each", "lb", "oz", "bunch", "tbsp", "tsp", "cup"];

const VALID_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
];

const VALID_EXTENSIONS = /\.(jpg|jpeg|png|webp|heic|pdf|doc|docx|txt|xlsx|xls|csv|numbers|pages)$/i;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024;

function getFileTypeBadge(file: File): { label: string; variant: "default" | "secondary" | "outline" } {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv") || name.endsWith(".numbers")) return { label: "Spreadsheet", variant: "default" };
  if (name.endsWith(".docx") || name.endsWith(".doc") || name.endsWith(".pages")) return { label: "Document", variant: "secondary" };
  if (file.type === "application/pdf") return { label: "PDF", variant: "outline" };
  if (file.type.startsWith("image/")) return { label: "Image", variant: "outline" };
  return { label: "File", variant: "outline" };
}

type ImportStep = "upload" | "processing" | "review" | "saving";

const processingSteps = ["Reading file...", "Extracting recipe data...", "Matching ingredients..."];

const RecipeImportDialog = ({ isOpen, onClose, onImport }: RecipeImportDialogProps) => {
  const { currentOrg } = useOrg();
  const [step, setStep] = useState<ImportStep>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  // NewIngredientDialog state
  const [newIngDialogOpen, setNewIngDialogOpen] = useState(false);
  const [pendingIngIndex, setPendingIngIndex] = useState<number | null>(null);
  const [pendingIngName, setPendingIngName] = useState("");
  const [pendingIngMatches, setPendingIngMatches] = useState<ReturnType<typeof findSimilarIngredients>>([]);
  const [allIngredients, setAllIngredients] = useState<{ id: string; name: string }[]>([]);

  // Processing step animation
  useEffect(() => {
    if (step !== "processing") return;
    setProcessingStepIndex(0);
    setShowSlowMessage(false);
    const stepInterval = setInterval(() => {
      setProcessingStepIndex(prev => Math.min(prev + 1, processingSteps.length - 1));
    }, 3000);
    const slowTimer = setTimeout(() => setShowSlowMessage(true), 15000);
    return () => { clearInterval(stepInterval); clearTimeout(slowTimer); };
  }, [step]);

  // Fetch all ingredients for matching when entering review step
  useEffect(() => {
    if (step === "review") {
      supabase.from("ingredients").select("id, name").then(({ data }) => {
        if (data) setAllIngredients(data);
      });
    }
  }, [step]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) handleFile(files[0]);
  };

  const handleFile = (file: File) => {
    if (!VALID_TYPES.includes(file.type) && !file.name.match(VALID_EXTENSIONS)) {
      toast.error("This file type isn't supported yet. Try exporting to PDF or Excel first.");
      setError("Unsupported file type. Please use images, PDFs, Excel, Word, or text files.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 20MB.`);
      return;
    }

    setSelectedFile(file);
    setError(null);

    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;
    setStep("processing");
    setError(null);

    try {
      const { data: ingredients } = await supabase
        .from("ingredients")
        .select("id, name, unit, cost_per_unit");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("ingredients", JSON.stringify(ingredients || []));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-recipe`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: formData,
        }
      );

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
      console.error("Processing error:", err);
      setError(err instanceof Error ? err.message : "Failed to process file");
      setStep("upload");
    }
  };

  const updateRecipeField = (field: keyof ExtractedRecipe, value: unknown) => {
    if (extractedRecipe) setExtractedRecipe({ ...extractedRecipe, [field]: value });
  };
  const updateIngredient = (index: number, field: keyof ExtractedIngredient, value: unknown) => {
    if (extractedRecipe) {
      const newIngredients = [...extractedRecipe.ingredients];
      newIngredients[index] = { ...newIngredients[index], [field]: value };
      setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });
    }
  };
  const removeIngredient = (index: number) => {
    if (extractedRecipe) setExtractedRecipe({ ...extractedRecipe, ingredients: extractedRecipe.ingredients.filter((_, i) => i !== index) });
  };
  const addIngredient = () => {
    if (extractedRecipe) setExtractedRecipe({ ...extractedRecipe, ingredients: [...extractedRecipe.ingredients, { name: "", quantity: 0, unit: "g" }] });
  };
  const updateInstruction = (index: number, value: string) => {
    if (extractedRecipe) {
      const newInstructions = [...extractedRecipe.instructions];
      newInstructions[index] = value;
      setExtractedRecipe({ ...extractedRecipe, instructions: newInstructions });
    }
  };
  const removeInstruction = (index: number) => {
    if (extractedRecipe) setExtractedRecipe({ ...extractedRecipe, instructions: extractedRecipe.instructions.filter((_, i) => i !== index) });
  };
  const addInstruction = () => {
    if (extractedRecipe) setExtractedRecipe({ ...extractedRecipe, instructions: [...extractedRecipe.instructions, ""] });
  };

  // Open NewIngredientDialog for an unmatched ingredient
  const handleCreateIngredient = (index: number) => {
    if (!extractedRecipe) return;
    const ing = extractedRecipe.ingredients[index];
    setPendingIngIndex(index);
    setPendingIngName(ing.name);
    const matches = findSimilarIngredients(ing.name, allIngredients);
    setPendingIngMatches(matches);
    setNewIngDialogOpen(true);
  };

  // When user selects an existing ingredient from the dialog
  const handleSelectExistingIngredient = (ingredientId: string) => {
    if (pendingIngIndex === null || !extractedRecipe) return;
    const existing = allIngredients.find(i => i.id === ingredientId);
    if (existing) {
      const newIngredients = [...extractedRecipe.ingredients];
      newIngredients[pendingIngIndex] = {
        ...newIngredients[pendingIngIndex],
        matched_ingredient_id: existing.id,
        matched_ingredient_name: existing.name,
      };
      setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });
    }
    setPendingIngIndex(null);
  };

  // When user creates a brand new ingredient from the dialog
  const handleCreateNewIngredient = async (ingredient: { name: string; unit: string; category: string; cost_per_unit: number }) => {
    if (pendingIngIndex === null || !extractedRecipe) return;
    try {
      const { data, error: insertErr } = await supabase
        .from("ingredients")
        .insert({
          name: ingredient.name,
          unit: ingredient.unit,
          category: ingredient.category,
          cost_per_unit: ingredient.cost_per_unit,
          org_id: currentOrg?.id,
        } as any)
        .select("id, name")
        .single();

      if (insertErr) throw insertErr;

      // Update the extracted recipe with the new match
      const newIngredients = [...extractedRecipe.ingredients];
      newIngredients[pendingIngIndex] = {
        ...newIngredients[pendingIngIndex],
        matched_ingredient_id: data.id,
        matched_ingredient_name: data.name,
      };
      setExtractedRecipe({ ...extractedRecipe, ingredients: newIngredients });

      // Add to local cache
      setAllIngredients(prev => [...prev, { id: data.id, name: data.name }]);
      toast.success(`Created ingredient "${data.name}"`);
    } catch (err) {
      console.error("Error creating ingredient:", err);
      toast.error("Failed to create ingredient");
    }
    setPendingIngIndex(null);
  };

  const saveRecipe = async () => {
    if (!extractedRecipe) return;
    setStep("saving");

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Auto-create unmatched ingredients before saving recipe
      const unmatchedIngs = extractedRecipe.ingredients.filter(i => !i.matched_ingredient_id && i.name.trim());
      if (unmatchedIngs.length > 0) {
        const toInsert = unmatchedIngs.map(ing => ({
          name: ing.name.trim(),
          unit: inferUnit(ing.name),
          category: inferCategory(ing.name),
          cost_per_unit: 0,
          org_id: currentOrg?.id,
        }));

        const { data: created, error: createErr } = await supabase
          .from("ingredients")
          .insert(toInsert as any)
          .select("id, name");

        if (createErr) {
          console.error("Error auto-creating ingredients:", createErr);
        } else if (created) {
          // Map created ingredients back
          const updatedIngredients = [...extractedRecipe.ingredients];
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
          extractedRecipe.ingredients = updatedIngredients;
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
        } as any)
        .select()
        .single();

      if (recipeError) throw recipeError;

      const matchedIngredients = extractedRecipe.ingredients
        .filter(ing => ing.matched_ingredient_id)
        .map(ing => ({
          recipe_id: recipe.id,
          ingredient_id: ing.matched_ingredient_id!,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.name !== ing.matched_ingredient_name ? `Original: ${ing.name}` : null,
        }));

      if (matchedIngredients.length > 0) {
        const { error: ingError } = await supabase.from("recipe_ingredients").insert(matchedIngredients);
        if (ingError) console.error("Error adding ingredients:", ingError);
      }

      // Insert method steps from extracted instructions
      if (extractedRecipe.instructions.length > 0) {
        const methodSteps = extractedRecipe.instructions
          .filter(inst => inst.trim())
          .map((inst, idx) => ({
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

      toast.success(`Recipe '${extractedRecipe.name}' saved with ${matchedIngredients.length} ingredients!`);
      onImport(recipe.id);
      handleClose();
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save recipe");
      setStep("review");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedRecipe(null);
    setError(null);
    setShowSlowMessage(false);
    onClose();
  };

  const getFileIcon = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv") || name.endsWith(".numbers")) return <FileSpreadsheet className="w-8 h-8" />;
    if (file.type.startsWith("image/")) return <FileImage className="w-8 h-8" />;
    if (file.type === "application/pdf") return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const matchedCount = extractedRecipe?.ingredients.filter(i => i.matched_ingredient_id).length || 0;
  const unmatchedCount = (extractedRecipe?.ingredients.length || 0) - matchedCount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Recipe
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Upload Step */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                  selectedFile && "border-success bg-success/5"
                )}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Recipe preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                    ) : (
                      <div className="flex items-center justify-center gap-3 text-muted-foreground">
                        {getFileIcon(selectedFile)}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5 text-success" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <Badge variant={getFileTypeBadge(selectedFile).variant} className="text-xs">
                          {getFileTypeBadge(selectedFile).label}
                        </Badge>
                        <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="p-1 rounded-full hover:bg-muted">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </p>
                      <p className="text-xs text-success flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Format verified
                      </p>
                      {selectedFile.size > LARGE_FILE_THRESHOLD && (
                        <p className="text-xs text-warning flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Large file — extraction may take longer
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-4">
                      <div className="p-4 rounded-full bg-muted"><Camera className="w-8 h-8 text-muted-foreground" /></div>
                      <div className="p-4 rounded-full bg-muted"><FileImage className="w-8 h-8 text-muted-foreground" /></div>
                      <div className="p-4 rounded-full bg-muted"><FileSpreadsheet className="w-8 h-8 text-muted-foreground" /></div>
                    </div>
                    <div>
                      <p className="text-lg font-medium">Drop your recipe file here</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Photos, PDFs, Excel, Word, or text files
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.numbers,.pages"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                        <Button type="button" variant="outline" asChild>
                          <span><FileImage className="w-4 h-4 mr-2" />Browse Files</span>
                        </Button>
                      </label>
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
                        <Button type="button" variant="outline" asChild>
                          <span><Camera className="w-4 h-4 mr-2" />Take Photo</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={processFile} disabled={!selectedFile}>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Extract Recipe
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-12 text-center space-y-6"
            >
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <div className="space-y-3">
                {processingSteps.map((msg, i) => (
                  <div key={msg} className={cn(
                    "flex items-center justify-center gap-2 text-sm transition-all",
                    i < processingStepIndex ? "text-success" : i === processingStepIndex ? "text-foreground font-medium" : "text-muted-foreground/40"
                  )}>
                    {i < processingStepIndex ? <Check className="w-4 h-4" /> : i === processingStepIndex ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4" />}
                    {msg}
                  </div>
                ))}
              </div>
              {showSlowMessage && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground">
                  Still working — large files take a bit longer
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Review Step */}
          {step === "review" && extractedRecipe && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              {/* Summary banner */}
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg mb-4 text-sm",
                unmatchedCount === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              )}>
                {unmatchedCount === 0 ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                Found {extractedRecipe.ingredients.length} ingredients, {matchedCount} matched to your database
                {unmatchedCount > 0 && ` · ${unmatchedCount} unmatched (will be auto-created on import)`}
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 pb-4">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Edit3 className="w-4 h-4" />Basic Information</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Recipe Name</Label>
                        <Input value={extractedRecipe.name} onChange={(e) => updateRecipeField("name", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={extractedRecipe.description} onChange={(e) => updateRecipeField("description", e.target.value)} rows={2} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={extractedRecipe.category} onValueChange={(v) => updateRecipeField("category", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Servings</Label>
                          <Input type="number" min="1" value={extractedRecipe.servings} onChange={(e) => updateRecipeField("servings", parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Prep (min)</Label>
                          <Input type="number" min="0" value={extractedRecipe.prep_time} onChange={(e) => updateRecipeField("prep_time", parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cook (min)</Label>
                          <Input type="number" min="0" value={extractedRecipe.cook_time} onChange={(e) => updateRecipeField("cook_time", parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Ingredients ({extractedRecipe.ingredients.length})</h3>
                      <Button variant="outline" size="sm" onClick={addIngredient}><Plus className="w-4 h-4 mr-1" />Add</Button>
                    </div>
                    <div className="space-y-2">
                      {extractedRecipe.ingredients.map((ing, idx) => (
                        <div key={idx} className={cn("flex items-center gap-2 p-2 rounded-lg", ing.matched_ingredient_id ? "bg-success/10" : "bg-warning/10")}>
                          <Input value={ing.name} onChange={(e) => updateIngredient(idx, "name", e.target.value)} placeholder="Ingredient name" className="flex-1" />
                          <Input type="number" value={ing.quantity} onChange={(e) => updateIngredient(idx, "quantity", parseFloat(e.target.value) || 0)} className="w-20" />
                          <Select value={ing.unit} onValueChange={(v) => updateIngredient(idx, "unit", v)}>
                            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                          </Select>
                          {ing.matched_ingredient_id ? (
                            <span className="text-xs text-success whitespace-nowrap">✓ {ing.matched_ingredient_name}</span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs whitespace-nowrap border-warning text-warning hover:bg-warning/10"
                              onClick={() => handleCreateIngredient(idx)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Create
                            </Button>
                          )}
                          <button onClick={() => removeIngredient(idx)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Instructions ({extractedRecipe.instructions.length} steps)</h3>
                      <Button variant="outline" size="sm" onClick={addInstruction}><Plus className="w-4 h-4 mr-1" />Add Step</Button>
                    </div>
                    <div className="space-y-2">
                      {extractedRecipe.instructions.map((instruction, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center mt-2">{idx + 1}</span>
                          <Textarea value={instruction} onChange={(e) => updateInstruction(idx, e.target.value)} rows={2} className="flex-1" />
                          <button onClick={() => removeInstruction(idx)} className="p-1 rounded hover:bg-destructive/10 mt-2"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  {extractedRecipe.allergens.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Detected Allergens</h3>
                      <div className="flex flex-wrap gap-2">
                        {extractedRecipe.allergens.map((allergen, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm">{allergen}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive mt-4">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
                <Button onClick={saveRecipe}><Check className="w-4 h-4 mr-2" />Import Recipe</Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Saving Step */}
          {step === "saving" && (
            <motion.div key="saving" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Saving recipe...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {/* NewIngredientDialog for inline creation */}
      <NewIngredientDialog
        open={newIngDialogOpen}
        onOpenChange={setNewIngDialogOpen}
        ingredientName={pendingIngName}
        similarMatches={pendingIngMatches}
        onSelectExisting={handleSelectExistingIngredient}
        onCreateNew={handleCreateNewIngredient}
      />
    </Dialog>
  );
};

export default RecipeImportDialog;
