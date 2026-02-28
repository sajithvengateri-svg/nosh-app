import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Search, 
  Plus, 
  Filter, 
  ChefHat,
  Calculator,
  Loader2,
  Upload,
  Layers,
  Trash2,
  Settings,
  HardDrive,
  ListChecks,
  ClipboardList
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import FoodCostCalculator from "@/components/costing/FoodCostCalculator";
import ProductListImport from "@/components/recipes/ProductListImport";
import RecipeImportDialog from "@/components/recipes/RecipeImportDialog";
import BulkRecipeImportDialog from "@/components/recipes/BulkRecipeImportDialog";
import GoogleDriveImportDialog from "@/components/recipes/GoogleDriveImportDialog";
import RecipeCreationLauncher from "@/components/recipes/RecipeCreationLauncher";
import RecipeMasterEdit from "@/components/recipes/RecipeMasterEdit";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeSectionsManager from "@/components/recipes/RecipeSectionsManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useRecipeSections } from "@/hooks/useRecipeSections";
import ReportActions from "@/components/shared/ReportActions";
import { useOrgId } from "@/hooks/useOrgId";
import { useDataConnections } from "@/hooks/useDataConnections";
import { useHomeCookRecipeView } from "@/hooks/useHomeCookRecipeView";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RecipeIngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  category: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: unknown;
  instructions: unknown;
  allergens: string[] | null;
  cost_per_serving: number;
  sell_price: number | null;
  image_url: string | null;
  tasting_notes: string | null;
  is_batch_recipe: boolean;
  target_food_cost_percent: number | null;
  recipe_type: string | null;
  created_at: string;
}

const ingredientUnits = ["g", "kg", "ml", "L", "each", "bunch", "tbsp", "tsp", "cup"];

const Recipes = () => {
  const navigate = useNavigate();
  const { user, canEdit } = useAuth();
  const { currentOrg } = useOrg();
  const { isSimple, showSection } = useHomeCookRecipeView();
  const reportRef = useRef<HTMLDivElement>(null);
  const orgId = useOrgId();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showCalculator, setShowCalculator] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeMenuRecipeIds, setActiveMenuRecipeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showGDriveImport, setShowGDriveImport] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [showMasterEdit, setShowMasterEdit] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sectionsManagerOpen, setSectionsManagerOpen] = useState(false);
  
  const { sections, loading: sectionsLoading } = useRecipeSections();
  const { data: dataConnections } = useDataConnections(currentOrg?.id);
  const gdriveConnection = dataConnections?.find((c) => c.provider === "google_drive" && c.status === "active");

  // Build category list from dynamic sections
  const categories = useMemo(() => {
    const sectionNames = sections.map(s => s.name);
    return ["All", ...sectionNames, "Batch Recipes"];
  }, [sections]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Mains",
    prep_time: 0,
    cook_time: 0,
    servings: null as number | null,
    cost_per_serving: 0,
    tasting_notes: "",
    is_batch_recipe: false,
  });

  // Ingredient list state for the form
  const [formIngredients, setFormIngredients] = useState<RecipeIngredientInput[]>([]);
  const [newIngName, setNewIngName] = useState("");
  const [newIngQty, setNewIngQty] = useState<number>(0);
  const [newIngUnit, setNewIngUnit] = useState("kg");

  const hasEditPermission = canEdit("recipes");

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Handle ?new=true query param to open dialog
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setDialogOpen(true);
      // Clear the query param
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Fetch recipes and active menu recipe IDs in parallel
      const [recipesResult, activeMenuResult] = await Promise.all([
        supabase.from("recipes").select("*").order("created_at", { ascending: false }),
        supabase.from("menus").select("id").eq("status", "active").limit(1).maybeSingle(),
      ]);

      if (recipesResult.error) {
        console.error("Error fetching recipes:", recipesResult.error);
        toast.error("Failed to load recipes");
        setRecipes([]);
        setLoading(false);
        return;
      }

      let menuRecipeIds = new Set<string>();
      if (activeMenuResult.data?.id) {
        const { data: menuItems } = await supabase
          .from("menu_items")
          .select("recipe_id")
          .eq("menu_id", activeMenuResult.data.id)
          .not("recipe_id", "is", null);
        if (menuItems) {
          menuRecipeIds = new Set(menuItems.map(mi => mi.recipe_id!).filter(Boolean));
        }
      }
      setActiveMenuRecipeIds(menuRecipeIds);

      // Sort: active-menu recipes first (alphabetical), then rest by created_at desc
      const allRecipes = recipesResult.data || [];
      const onMenu = allRecipes.filter(r => menuRecipeIds.has(r.id)).sort((a, b) => a.name.localeCompare(b.name));
      const offMenu = allRecipes.filter(r => !menuRecipeIds.has(r.id));
      setRecipes([...onMenu, ...offMenu]);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      toast.error("Failed to load recipes");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Recipe name is required");
      return;
    }

    // Prepare ingredients JSONB
    const ingredientsJson = formIngredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    }));

    if (editingRecipe) {
      const { error } = await supabase
        .from("recipes")
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.is_batch_recipe ? "Sauces" : formData.category,
          prep_time: formData.prep_time,
          cook_time: formData.cook_time,
          servings: formData.servings,
          cost_per_serving: formData.cost_per_serving,
          tasting_notes: formData.tasting_notes || null,
          is_batch_recipe: formData.is_batch_recipe,
          ingredients: ingredientsJson,
        })
        .eq("id", editingRecipe.id);

      if (error) {
        toast.error("Failed to update recipe");
        console.error(error);
        return;
      }
      toast.success("Recipe updated");
    } else {
      const { error } = await supabase.from("recipes").insert({
        name: formData.name,
        description: formData.description || null,
        category: formData.is_batch_recipe ? "Sauces" : formData.category,
        prep_time: formData.prep_time,
        cook_time: formData.cook_time,
        servings: formData.servings,
        cost_per_serving: formData.cost_per_serving,
        tasting_notes: formData.tasting_notes || null,
        is_batch_recipe: formData.is_batch_recipe,
        created_by: user?.id,
        ingredients: ingredientsJson,
        is_public: true,
        org_id: currentOrg?.id,
      });

      if (error) {
        toast.error("Failed to create recipe");
        console.error(error);
        return;
      }
      toast.success("Recipe created");
    }

    resetForm();
    fetchRecipes();
  };

  const handleDelete = async () => {
    if (!deletingRecipe) return;

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", deletingRecipe.id);

    if (error) {
      toast.error("Failed to delete recipe");
      console.error(error);
      return;
    }

    toast.success("Recipe deleted");
    setDeleteDialogOpen(false);
    setDeletingRecipe(null);
    fetchRecipes();
  };

  const openEditDialog = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      description: recipe.description || "",
      category: recipe.category,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      cost_per_serving: Number(recipe.cost_per_serving),
      tasting_notes: recipe.tasting_notes || "",
      is_batch_recipe: recipe.is_batch_recipe || false,
    });
    // Load existing ingredients from JSONB
    const existingIngs = Array.isArray(recipe.ingredients) 
      ? (recipe.ingredients as RecipeIngredientInput[])
      : [];
    setFormIngredients(existingIngs);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingRecipe(null);
    setFormData({
      name: "",
      description: "",
      category: "Mains",
      prep_time: 0,
      cook_time: 0,
      servings: null,
      cost_per_serving: 0,
      tasting_notes: "",
      is_batch_recipe: false,
    });
    setFormIngredients([]);
    setNewIngName("");
    setNewIngQty(0);
    setNewIngUnit("kg");
  };

  const addFormIngredient = () => {
    if (!newIngName.trim() || newIngQty <= 0) {
      toast.error("Enter ingredient name and quantity");
      return;
    }
    setFormIngredients(prev => [
      ...prev,
      { name: newIngName.trim(), quantity: newIngQty, unit: newIngUnit }
    ]);
    setNewIngName("");
    setNewIngQty(0);
    setNewIngUnit("kg");
  };

  const removeFormIngredient = (index: number) => {
    setFormIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpdate = (recipeId: string, imageUrl: string) => {
    setRecipes(prev => prev.map(r => 
      r.id === recipeId ? { ...r, image_url: imageUrl } : r
    ));
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || 
      recipe.category === selectedCategory ||
      (selectedCategory === "Batch Recipes" && recipe.is_batch_recipe);
    const matchesType = selectedType === "all" || 
      (recipe.recipe_type || "dish") === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <AppLayout>
      <ErrorBoundary fallbackMessage="Recipes page encountered an error. Please refresh.">
      <div ref={reportRef} className="max-w-7xl mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">{isSimple ? "My Recipes" : "Recipe Bank"}</h1>
            <p className="page-subtitle">{recipes.length} recipes in your collection</p>
          </div>
          <div className="flex gap-2">
            <ReportActions title="Recipe Bank Report" contentRef={reportRef} reportType="recipes" orgId={orgId} />
            {!isSimple && (
              <button 
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Cost Calculator</span>
              </button>
            )}
            {hasEditPermission && (
              <>
                <Button variant="outline" size="icon" onClick={() => setShowMasterEdit(true)} title="Master Edit">
                  <ListChecks className="w-4 h-4" />
                </Button>
                {!isSimple && (
                  <>
                    <div className="flex gap-1">
                      <Button variant="outline" onClick={() => setShowImport(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Import</span>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setShowBulkImport(true)} title="Bulk Import">
                        <Layers className="w-4 h-4" />
                      </Button>
                      {gdriveConnection && (
                        <Button variant="outline" size="icon" onClick={() => setShowGDriveImport(true)} title="Import from Google Drive">
                          <HardDrive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
                {isSimple && (
                  <>
                    <Button variant="outline" onClick={() => setShowImport(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Import</span>
                    </Button>
                    <Button variant="outline" onClick={() => setShowProductList(true)}>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Product List</span>
                    </Button>
                  </>
                )}
                <Button onClick={() => setShowLauncher(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Recipe
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center"
        >
          {categories.map((category) => {
            const section = sections.find(s => s.name === category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                )}
              >
                {section && (
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: selectedCategory === category ? 'currentColor' : section.color }}
                  />
                )}
                {category}
              </button>
            );
          })}
          {hasEditPermission && (
            <button
              onClick={() => setSectionsManagerOpen(true)}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
              title="Manage Sections"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* Type Filter Chips - hidden in simple mode */}
        {!isSimple && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {[
            { value: "all", label: "All Types" },
            { value: "dish", label: "🍽️ Dishes" },
            { value: "component", label: "🧩 Components" },
            { value: "batch_prep", label: "🧪 Batch Prep" },
            { value: "portion_prep", label: "⚖️ Portion Prep" },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedType === type.value
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {type.label}
            </button>
          ))}
        </motion.div>
        )}

        {/* Recipe Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.1 * index, 0.5) }}
              >
                <RecipeCard
                  recipe={isSimple ? { ...recipe, tasting_notes: null, recipe_type: null, is_batch_recipe: false } : recipe}
                  hasEditPermission={hasEditPermission}
                  isOnActiveMenu={!isSimple && activeMenuRecipeIds.has(recipe.id)}
                  onEdit={() => openEditDialog(recipe)}
                  onDelete={() => {
                    setDeletingRecipe(recipe);
                    setDeleteDialogOpen(true);
                  }}
                  onImageUpdate={handleImageUpdate}
                />
              </motion.div>
            ))}

            {filteredRecipes.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center">
                <ChefHat className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No recipes found</p>
                {hasEditPermission && (
                  <Button variant="outline" className="mt-4" onClick={() => setShowLauncher(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Recipe
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Food Cost Calculator Modal */}
        <FoodCostCalculator
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
        />

        {/* Recipe Import Dialog */}
        <RecipeImportDialog
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          onImport={(recipeId) => {
            fetchRecipes();
            navigate(`/recipes/${recipeId}/edit`);
          }}
        />

        {/* Product List Import */}
        <ProductListImport
          open={showProductList}
          onOpenChange={setShowProductList}
          onComplete={fetchRecipes}
        />

        {/* Bulk Recipe Import Dialog */}
        <BulkRecipeImportDialog
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onImportComplete={(recipeIds) => {
            fetchRecipes();
            toast.success(`${recipeIds.length} recipes imported!`);
          }}
        />

        {/* Google Drive Import Dialog */}
        {gdriveConnection && (
          <GoogleDriveImportDialog
            isOpen={showGDriveImport}
            onClose={() => setShowGDriveImport(false)}
            onImportComplete={(recipeIds) => {
              fetchRecipes();
              toast.success(`${recipeIds.length} recipes imported from Google Drive!`);
            }}
            apiKey={gdriveConnection.config?.api_key || ""}
            clientId={gdriveConnection.config?.client_id || ""}
          />
        )}

        {/* Recipe Creation Launcher */}
        <RecipeCreationLauncher
          isOpen={showLauncher}
          onClose={() => {
            setShowLauncher(false);
            fetchRecipes();
          }}
        />

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={resetForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingRecipe ? "Edit Recipe" : "New Recipe"}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Recipe Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grilled Salmon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the dish..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(section => (
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
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={formData.servings ?? ""}
                    placeholder="e.g. 4"
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, servings: val === "" ? null : parseInt(val) || 0 });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep_time">Prep (min)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    min="0"
                    value={formData.prep_time}
                    onChange={(e) => setFormData({ ...formData, prep_time: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cook_time">Cook (min)</Label>
                  <Input
                    id="cook_time"
                    type="number"
                    min="0"
                    value={formData.cook_time}
                    onChange={(e) => setFormData({ ...formData, cook_time: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost/Serving</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_per_serving}
                    onChange={(e) => setFormData({ ...formData, cost_per_serving: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Ingredients Section */}
              <div className="space-y-3 pt-2 border-t">
                <Label>Ingredients</Label>
                {formIngredients.length > 0 && (
                  <div className="space-y-2">
                    {formIngredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <span className="flex-1 text-sm font-medium">{ing.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {ing.quantity} {ing.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFormIngredient(idx)}
                          className="p-1 hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingredient name"
                    value={newIngName}
                    onChange={(e) => setNewIngName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Qty"
                    value={newIngQty || ""}
                    onChange={(e) => setNewIngQty(parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Select value={newIngUnit} onValueChange={setNewIngUnit}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientUnits.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="outline" onClick={addFormIngredient}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tasting_notes">Tasting Notes</Label>
                <Textarea
                  id="tasting_notes"
                  value={formData.tasting_notes}
                  onChange={(e) => setFormData({ ...formData, tasting_notes: e.target.value })}
                  placeholder="Flavor profile, texture, recommended pairings..."
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="is_batch">Batch Recipe</Label>
                  <p className="text-xs text-muted-foreground">Mark this as a batch/prep recipe that can be used as an ingredient</p>
                </div>
                <Switch
                  id="is_batch"
                  checked={formData.is_batch_recipe}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_batch_recipe: checked })}
                />
              </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingRecipe ? "Save Changes" : "Create Recipe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Recipe</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{deletingRecipe?.name}"? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sections Manager Dialog */}
        <RecipeSectionsManager 
          open={sectionsManagerOpen}
          onOpenChange={setSectionsManagerOpen}
        />
      </div>

      {/* Master Edit Overlay */}
      {showMasterEdit && (
        <RecipeMasterEdit
          recipes={recipes}
          sections={sections}
          activeMenuRecipeIds={activeMenuRecipeIds}
          onClose={() => setShowMasterEdit(false)}
          onRefresh={() => {
            fetchRecipes();
          }}
        />
      )}
      </ErrorBoundary>
    </AppLayout>
  );
};

export default Recipes;
