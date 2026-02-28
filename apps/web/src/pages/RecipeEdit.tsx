import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Save,
  Loader2,
  ChefHat,
  Shield,
  Settings,
  Pencil,
  PlayCircle,
  Clock,
  Camera,
  Trash2,
  ImageIcon
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import RecipeBuilder from "@/components/recipes/RecipeBuilder";
import RecipeTypeSelector from "@/components/recipes/RecipeTypeSelector";
import type { RecipeType } from "@/components/recipes/RecipeTypeSelector";
import RecipeCostSettings from "@/components/recipes/RecipeCostSettings";
import RecipeSectionsManager from "@/components/recipes/RecipeSectionsManager";
import RecipeMethodEditor from "@/components/recipes/method/RecipeMethodEditor";
import RecipePlatingGuide from "@/components/recipes/plating/RecipePlatingGuide";
import StepByStepViewer from "@/components/recipes/viewer/StepByStepViewer";
import { CCPTimelineEditor } from "@/components/ccp/CCPTimelineEditor";
import { useRecipeCCPs } from "@/hooks/useRecipeCCPs";
import { useRecipeSections } from "@/hooks/useRecipeSections";
import { useRecipeMethodSteps } from "@/hooks/useRecipeMethodSteps";
import { useRecipePlatingSteps } from "@/hooks/useRecipePlatingSteps";
import { useHomeCookRecipeView } from "@/hooks/useHomeCookRecipeView";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  category: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  cost_per_serving: number;
  sell_price: number;
  target_food_cost_percent: number;
  gst_percent: number;
  total_yield: number;
  yield_unit: string;
  food_cost_low_alert: number;
  food_cost_high_alert: number;
  recipe_type: RecipeType;
  yield_percent: number;
  shelf_life_days: number;
  shelf_life_hours: number;
  storage_temp: string;
  storage_notes: string | null;
  requires_resting: boolean;
  resting_type: string | null;
  resting_duration_hours: number;
  image_url: string | null;
}

// CCP Section Component with its own data management
const CCPSection = ({ recipeId, hasEditPermission }: { recipeId: string; hasEditPermission: boolean }) => {
  const [haccpMode, setHaccpMode] = useState(false);
  const { ccps, addCCP, updateCCP, deleteCCP, loading } = useRecipeCCPs(recipeId);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-elevated p-5"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="card-elevated p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Critical Control Points</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {ccps.length} points
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="haccp-mode" className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Full HACCP
          </Label>
          <Switch
            id="haccp-mode"
            checked={haccpMode}
            onCheckedChange={setHaccpMode}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Click on the timeline to add control points. Drag points to reposition.
      </p>
      <CCPTimelineEditor
        ccps={ccps}
        onAdd={addCCP}
        onUpdate={updateCCP}
        onDelete={deleteCCP}
        haccpMode={haccpMode}
        readOnly={!hasEditPermission}
      />
    </motion.div>
  );
};

const RecipeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canEdit } = useAuth();
  const { currentOrg } = useOrg();
  const { isSimple, showSection } = useHomeCookRecipeView();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [sectionsManagerOpen, setSectionsManagerOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isUntitled = !recipe?.name;
  
  const { sections: recipeSections, loading: sectionsLoading } = useRecipeSections();
  const methodHook = useRecipeMethodSteps(recipe?.id || id);
  const platingHook = useRecipePlatingSteps(recipe?.id || id);
  const isNewRecipe = location.pathname === "/recipes/new";
  const hasEditPermission = canEdit("recipes");

  useEffect(() => {
    if (isNewRecipe) {
      // Redirect to recipes page - new recipe creation now goes through the launcher
      navigate("/recipes", { replace: true });
    } else if (id) {
      fetchRecipe();
    }
  }, [id, isNewRecipe]);

  // Auto-focus and select the name field when it's "Untitled Recipe"
  useEffect(() => {
    if (!recipe?.name && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [recipe?.name]);

  const createNewRecipe = async () => {
    setLoading(true);
    
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
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating recipe:", error);
      toast.error("Failed to create recipe");
      navigate("/recipes");
    } else {
      // Redirect to the edit page for the new recipe
      navigate(`/recipes/${data.id}/edit`, { replace: true });
    }
    setLoading(false);
  };

  const fetchRecipe = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching recipe:", error);
      toast.error("Recipe not found");
      navigate("/recipes");
    } else {
      setRecipe({
        ...data,
        sell_price: Number(data.sell_price) || 0,
        target_food_cost_percent: Number(data.target_food_cost_percent) || 30,
        gst_percent: Number(data.gst_percent) || 10,
        total_yield: Number(data.total_yield) || data.servings || 1,
        yield_unit: data.yield_unit || "portions",
        food_cost_low_alert: Number(data.food_cost_low_alert) || 20,
        food_cost_high_alert: Number(data.food_cost_high_alert) || 35,
        recipe_type: (data.recipe_type as RecipeType) || "dish",
        yield_percent: Number(data.yield_percent) || 100,
        shelf_life_days: data.shelf_life_days ?? 3,
        shelf_life_hours: data.shelf_life_hours ?? 0,
        storage_temp: data.storage_temp || "refrigerated",
        storage_notes: data.storage_notes || null,
        requires_resting: data.requires_resting ?? false,
        resting_type: data.resting_type || null,
        resting_duration_hours: Number(data.resting_duration_hours) || 0,
        image_url: data.image_url || null,
      } as Recipe);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!recipe) return;

    setSaving(true);
    const { error } = await supabase
      .from("recipes")
      .update({
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        cost_per_serving: recipe.cost_per_serving,
        sell_price: recipe.sell_price,
        target_food_cost_percent: recipe.target_food_cost_percent,
        gst_percent: recipe.gst_percent,
        total_yield: recipe.total_yield,
        yield_unit: recipe.yield_unit,
        food_cost_low_alert: recipe.food_cost_low_alert,
        food_cost_high_alert: recipe.food_cost_high_alert,
        recipe_type: recipe.recipe_type,
        yield_percent: recipe.yield_percent,
        shelf_life_days: recipe.shelf_life_days,
        shelf_life_hours: recipe.shelf_life_hours,
        storage_temp: recipe.storage_temp,
        storage_notes: recipe.storage_notes,
        requires_resting: recipe.requires_resting,
        resting_type: recipe.resting_type,
        resting_duration_hours: recipe.resting_duration_hours,
        is_public: true,
        image_url: recipe.image_url,
      })
      .eq("id", recipe.id);

    if (error) {
      toast.error("Failed to save recipe");
      console.error(error);
    } else {
      toast.success("Recipe saved");
      navigate(`/recipes/${recipe.id}`);
    }
    setSaving(false);
  };

  const handleFieldUpdate = (field: string, value: number | string | boolean) => {
    if (!recipe) return;
    setRecipe({ ...recipe, [field]: value } as Recipe);
  };

  const handleCostUpdate = (totalCost: number, costPerPortion: number) => {
    if (!recipe) return;
    setRecipe({ ...recipe, cost_per_serving: costPerPortion } as Recipe);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !recipe) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${recipe.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("recipe-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(path);

      await supabase.from("recipes").update({ image_url: publicUrl }).eq("id", recipe.id);
      setRecipe({ ...recipe, image_url: publicUrl });
      toast.success("Image uploaded");
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async () => {
    if (!recipe) return;
    await supabase.from("recipes").update({ image_url: null }).eq("id", recipe.id);
    setRecipe({ ...recipe, image_url: null });
    toast.success("Image removed");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!recipe) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <ChefHat className="w-16 h-16 text-muted-foreground/50" />
          <p className="text-muted-foreground">Recipe not found</p>
          <Button variant="outline" onClick={() => navigate("/recipes")}>
            Back to Recipes
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Top row: back + action buttons */}
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={() => navigate("/recipes")}
              className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewerOpen(true)}
                className={isSimple && !showSection("platingGuide") ? "hidden" : ""}
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Step-by-Step</span>
              </Button>
              {hasEditPermission && (
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              )}
            </div>
          </div>
          {/* Full-width name input — sits under nav like a page title */}
          <div className="w-full px-1">
            {hasEditPermission ? (
              <input
                ref={nameInputRef}
                value={recipe.name}
                onChange={(e) => handleFieldUpdate("name", e.target.value)}
                className="w-full text-xl sm:text-2xl font-bold bg-transparent border-0 border-b-2 border-transparent focus:border-primary outline-none py-1 placeholder:text-muted-foreground/50 transition-colors"
                placeholder="Recipe name"
              />
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold">{recipe.name}</h1>
            )}
            <p className="text-sm text-muted-foreground mt-1">{recipe.category}</p>
          </div>
        </motion.div>

        {/* Recipe Image Upload */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageUpload}
          />
          {recipe.image_url ? (
            <div className="relative rounded-xl overflow-hidden group">
              <img
                src={recipe.image_url}
                alt={recipe.name || "Recipe"}
                className="w-full aspect-video object-cover"
              />
              {hasEditPermission && (
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-3 rounded-full bg-background/90 hover:bg-background transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleImageRemove}
                    className="p-3 rounded-full bg-background/90 hover:bg-destructive/90 hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-background" />
                </div>
              )}
            </div>
          ) : hasEditPermission ? (
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            >
              {uploadingImage ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm font-medium">Add a photo</span>
                  <span className="text-xs">Tap to upload or take a photo</span>
                </>
              )}
            </button>
          ) : null}
        </motion.div>

        {/* Recipe Type Selector - hidden in simple mode unless toggled */}
        {showSection("recipeType") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-elevated p-5"
        >
          <h3 className="font-semibold mb-3">Recipe Type</h3>
          <RecipeTypeSelector
            value={recipe.recipe_type}
            onChange={(type) => handleFieldUpdate("recipe_type", type)}
            disabled={!hasEditPermission}
            variant="compact"
          />

          {/* Type-specific fields */}
          {(recipe.recipe_type === "batch_prep") && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch Yield Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={recipe.total_yield || ""}
                  placeholder="0"
                  onChange={(e) => handleFieldUpdate("total_yield", parseFloat(e.target.value) || 0)}
                  disabled={!hasEditPermission}
                />
              </div>
              <div className="space-y-2">
                <Label>Yield Unit</Label>
                <Select
                  value={recipe.yield_unit}
                  onValueChange={(v) => handleFieldUpdate("yield_unit", v)}
                  disabled={!hasEditPermission}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["kg", "L", "portions", "each", "g", "ml"].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {recipe.recipe_type === "portion_prep" && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="space-y-2 max-w-xs">
                <Label>Yield % (after trim/waste)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={recipe.yield_percent || ""}
                    placeholder="100"
                    onChange={(e) => handleFieldUpdate("yield_percent", parseFloat(e.target.value) || 100)}
                    disabled={!hasEditPermission}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">% usable after waste</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  E.g. whole fish at 55% means 45% is trim/waste
                </p>
              </div>
            </div>
          )}
        </motion.div>
        )}

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-5"
        >
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                {hasEditPermission && (
                  <button
                    onClick={() => setSectionsManagerOpen(true)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              <Select
                value={recipe.category}
                onValueChange={(v) => handleFieldUpdate("category", v)}
                disabled={!hasEditPermission || sectionsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sectionsLoading ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {recipeSections.map(section => (
                    <SelectItem key={section.id} value={section.name}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: section.color }}
                        />
                        {section.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prep Time (min)</Label>
              <Input
                type="number"
                min="0"
                value={recipe.prep_time || ""}
                placeholder="0"
                onChange={(e) => handleFieldUpdate("prep_time", parseInt(e.target.value) || 0)}
                disabled={!hasEditPermission}
              />
            </div>
            <div className="space-y-2">
              <Label>Cook Time (min)</Label>
              <Input
                type="number"
                min="0"
                value={recipe.cook_time || ""}
                placeholder="0"
                onChange={(e) => handleFieldUpdate("cook_time", parseInt(e.target.value) || 0)}
                disabled={!hasEditPermission}
              />
            </div>
            <div className="space-y-2">
              <Label>Base Servings</Label>
              <Input
                type="number"
                min="1"
                value={recipe.servings ?? ""}
                placeholder="e.g. 4"
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldUpdate("servings", val === "" ? null : parseInt(val) || 0);
                }}
                disabled={!hasEditPermission}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label>Description</Label>
            <Textarea
              value={recipe.description || ""}
              onChange={(e) => handleFieldUpdate("description", e.target.value)}
              placeholder="Brief description of the dish..."
              disabled={!hasEditPermission}
            />
          </div>
        </motion.div>

        {/* Cost Settings - hidden in simple mode unless toggled */}
        {showSection("costDetails") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RecipeCostSettings
            sellPrice={recipe.sell_price}
            targetFoodCostPercent={recipe.target_food_cost_percent}
            gstPercent={recipe.gst_percent}
            totalYield={recipe.total_yield}
            yieldUnit={recipe.yield_unit}
            foodCostLowAlert={recipe.food_cost_low_alert}
            foodCostHighAlert={recipe.food_cost_high_alert}
            onUpdate={handleFieldUpdate}
            disabled={!hasEditPermission}
          />
        </motion.div>
        )}

        {/* Simple Sell Price for simple mode when cost details hidden */}
        {isSimple && !showSection("costDetails") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-5"
          >
            <h3 className="font-semibold mb-3">Sell Price</h3>
            <div className="max-w-xs space-y-2">
              <Label>Price per serve ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={recipe.sell_price || ""}
                placeholder="0.00"
                onChange={(e) => handleFieldUpdate("sell_price", parseFloat(e.target.value) || 0)}
                disabled={!hasEditPermission}
              />
            </div>
          </motion.div>
        )}

        {/* Recipe Builder */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecipeBuilder
            recipeId={recipe.id}
            servings={recipe.servings}
            sellPrice={recipe.sell_price}
            targetFoodCostPercent={recipe.target_food_cost_percent}
            gstPercent={recipe.gst_percent}
            totalYield={recipe.total_yield}
            yieldUnit={recipe.yield_unit}
            foodCostLowAlert={recipe.food_cost_low_alert}
            foodCostHighAlert={recipe.food_cost_high_alert}
            onCostUpdate={handleCostUpdate}
            hasEditPermission={hasEditPermission}
          />
        </motion.div>

        {/* Method Editor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <RecipeMethodEditor
            recipeId={recipe.id}
            hasEditPermission={hasEditPermission}
          />
        </motion.div>

        {/* Storage & Shelf Life */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="card-elevated p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Storage & Shelf Life</h3>
          </div>
          <div className={cn(
            "grid gap-4",
            isSimple && !showSection("storageNotes") ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
          )}>
            <div className="space-y-2">
              <Label>Shelf Life (days)</Label>
              <Input
                type="number"
                min="0"
                value={recipe.shelf_life_days ?? ""}
                onChange={(e) => handleFieldUpdate("shelf_life_days", parseInt(e.target.value) || 0)}
                disabled={!hasEditPermission}
              />
            </div>
            {showSection("storageNotes") && (
              <div className="space-y-2">
                <Label>Shelf Life (hours)</Label>
                <Input
                  type="number"
                  min="0"
                  value={recipe.shelf_life_hours ?? ""}
                  onChange={(e) => handleFieldUpdate("shelf_life_hours", parseInt(e.target.value) || 0)}
                  disabled={!hasEditPermission}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Storage Temp</Label>
              <Select
                value={recipe.storage_temp || "refrigerated"}
                onValueChange={(v) => handleFieldUpdate("storage_temp", v)}
                disabled={!hasEditPermission}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["refrigerated", "frozen", "ambient", "hot-hold"].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showSection("storageNotes") && (
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Storage Notes</Label>
                <Input
                  value={recipe.storage_notes || ""}
                  onChange={(e) => handleFieldUpdate("storage_notes", e.target.value)}
                  placeholder="e.g. Keep covered, label with date"
                  disabled={!hasEditPermission}
                />
              </div>
            )}
          </div>

          {/* Resting toggle - hidden in simple mode unless toggled */}
          {showSection("storageNotes") && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <Switch
                id="requires-resting"
                checked={recipe.requires_resting}
                onCheckedChange={(v) => handleFieldUpdate("requires_resting", v)}
                disabled={!hasEditPermission}
              />
              <Label htmlFor="requires-resting">Requires Resting / Curing / Proofing</Label>
            </div>
            {recipe.requires_resting && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Resting Type</Label>
                  <Select
                    value={recipe.resting_type || "resting"}
                    onValueChange={(v) => handleFieldUpdate("resting_type", v)}
                    disabled={!hasEditPermission}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["proofing", "curing", "resting", "brining", "aging", "fermenting"].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Resting Duration (hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={recipe.resting_duration_hours || ""}
                    onChange={(e) => handleFieldUpdate("resting_duration_hours", parseFloat(e.target.value) || 0)}
                    disabled={!hasEditPermission}
                  />
                </div>
              </div>
            )}
          </div>
          )}
        </motion.div>

        {/* Critical Control Points Timeline - hidden in simple mode unless toggled */}
        {showSection("ccp") && (
          <CCPSection 
            recipeId={recipe.id} 
            hasEditPermission={hasEditPermission}
          />
        )}

        {/* Plating Guide - hidden in simple mode unless toggled */}
        {showSection("platingGuide") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <RecipePlatingGuide
            recipeId={recipe.id}
            hasEditPermission={hasEditPermission}
          />
        </motion.div>
        )}

        {/* Sections Manager Dialog */}
        <RecipeSectionsManager 
          open={sectionsManagerOpen}
          onOpenChange={setSectionsManagerOpen}
        />

        {/* Step-by-Step Viewer */}
        <StepByStepViewer
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          recipeName={recipe.name}
          methodSections={methodHook.sections}
          platingSteps={platingHook.steps}
        />
      </div>
    </AppLayout>
  );
};

export default RecipeEdit;
