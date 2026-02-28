import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Scale, 
  Calculator,
  Users,
  Weight,
  ArrowRight,
  TrendingUp,
  Package,
  X,
  CheckCircle2,
  Loader2,
  ShoppingCart
} from "lucide-react";
import { useProductionStore } from "@/stores/productionStore";
import { CreateBatchInput } from "@/hooks/useProductionBatches";
import { useTodoItems } from "@/hooks/useTodoItems";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecipeScalerProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId?: string;
  onBatchCreated?: (input: CreateBatchInput) => Promise<any>;
}

const RecipeScaler = ({ isOpen, onClose, recipeId, onBatchCreated }: RecipeScalerProps) => {
  const { scalableRecipes, scaleRecipe } = useProductionStore();
  const { addFromRecipeScale } = useTodoItems();
  
  const [selectedRecipeId, setSelectedRecipeId] = useState(recipeId || "");
  const [scaleBy, setScaleBy] = useState<"servings" | "yield">("servings");
  const [targetServings, setTargetServings] = useState<number>(0);
  const [targetYield, setTargetYield] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [batchCreated, setBatchCreated] = useState(false);
  const [showShoppingPrompt, setShowShoppingPrompt] = useState(false);

  const selectedRecipe = scalableRecipes.find(r => r.id === selectedRecipeId);
  
  const scaledResult = selectedRecipeId && (targetServings > 0 || targetYield > 0) 
    ? scaleRecipe({
        recipeId: selectedRecipeId,
        scaleBy,
        targetServings: scaleBy === 'servings' ? targetServings : undefined,
        targetYieldWeight: scaleBy === 'yield' ? targetYield : undefined,
      })
    : null;

  const handleAddToShoppingList = async () => {
    if (!scaledResult || !selectedRecipe) return;
    try {
      await addFromRecipeScale.mutateAsync({
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.name,
        ingredients: scaledResult.scaledIngredients,
      });
      toast.success("Ingredients added to shopping list!");
      setShowShoppingPrompt(false);
    } catch {
      toast.error("Failed to add to shopping list");
    }
  };

  const handleCreateBatch = async () => {
    if (!scaledResult || !onBatchCreated || !selectedRecipe) return;
    setCreating(true);
    try {
      await onBatchCreated({
        recipe_id: selectedRecipe.id,
        recipe_name: selectedRecipe.name,
        quantity: scaledResult.targetYieldWeight,
        unit: selectedRecipe.yieldUnit,
        servings_produced: scaledResult.targetServings,
        shelf_life_days: selectedRecipe.shelfLifeDays,
        actual_cost: scaledResult.totalCost,
        scale_factor: scaledResult.scaleFactor,
      });
      setBatchCreated(true);
      // Show shopping list prompt after batch is logged
      setTimeout(() => {
        setBatchCreated(false);
        setShowShoppingPrompt(true);
      }, 1200);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success overlay */}
        {batchCreated && (
          <div className="absolute inset-0 z-10 bg-card/95 rounded-2xl flex items-center justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-3" />
              <p className="text-lg font-semibold">Batch Logged!</p>
              <p className="text-sm text-muted-foreground">Expiry tracking started</p>
            </motion.div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Recipe Scaler</h2>
              <p className="text-sm text-muted-foreground">Scale by servings or yield weight</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Recipe Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Select Recipe</label>
            <select
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a recipe...</option>
              {scalableRecipes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {selectedRecipe && (
            <>
              {/* Base Recipe Info */}
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">Base Recipe</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Servings</p>
                    <p className="text-lg font-bold">{selectedRecipe.baseServings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Yield</p>
                    <p className="text-lg font-bold">{selectedRecipe.baseYieldWeight} {selectedRecipe.yieldUnit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shelf Life</p>
                    <p className="text-lg font-bold">{selectedRecipe.shelfLifeDays} days</p>
                  </div>
                </div>
              </div>

              {/* Scale By Toggle */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Scale By</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setScaleBy("servings")}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl transition-all",
                      scaleBy === "servings"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Servings</span>
                  </button>
                  <button
                    onClick={() => setScaleBy("yield")}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl transition-all",
                      scaleBy === "yield"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Weight className="w-5 h-5" />
                    <span className="font-medium">Yield Weight</span>
                  </button>
                </div>
              </div>

              {/* Target Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {scaleBy === "servings" ? "Target Servings" : `Target Yield (${selectedRecipe.yieldUnit})`}
                </label>
                <div className="relative">
                  {scaleBy === "servings" ? (
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  )}
                  <input
                    type="number"
                    value={scaleBy === "servings" ? targetServings || "" : targetYield || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (scaleBy === "servings") setTargetServings(val);
                      else setTargetYield(val);
                    }}
                    placeholder={scaleBy === "servings" ? "e.g., 100" : "e.g., 10"}
                    className="input-field pl-10 text-lg font-semibold"
                    min="1"
                    step={scaleBy === "servings" ? "1" : "0.1"}
                  />
                </div>
                
                {/* Quick scale buttons */}
                <div className="flex gap-2 mt-2">
                  {scaleBy === "servings" ? (
                    [10, 25, 50, 100].map(num => (
                      <button
                        key={num}
                        onClick={() => setTargetServings(num)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-all",
                          targetServings === num
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {num} servings
                      </button>
                    ))
                  ) : (
                    [5, 10, 20, 50].map(num => (
                      <button
                        key={num}
                        onClick={() => setTargetYield(num)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium transition-all",
                          targetYield === num
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {num} {selectedRecipe.yieldUnit}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Scaled Results */}
        {scaledResult && (
          <div className="p-5 bg-muted/30 border-t border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calculator className="w-4 h-4" />
              <span>Scaled Recipe</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {scaledResult.scaleFactor.toFixed(2)}x
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card-elevated p-3">
                <p className="text-xs text-muted-foreground">Servings</p>
                <p className="text-xl font-bold">{scaledResult.targetServings}</p>
              </div>
              <div className="card-elevated p-3">
                <p className="text-xs text-muted-foreground">Yield</p>
                <p className="text-xl font-bold">{scaledResult.targetYieldWeight.toFixed(2)} {scaledResult.originalRecipe.yieldUnit}</p>
              </div>
              <div className="card-elevated p-3">
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold text-primary">${scaledResult.totalCost.toFixed(2)}</p>
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-xs text-muted-foreground">Cost per Serving</p>
                <p className="text-lg font-bold text-success">${scaledResult.costPerServing.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground">Cost per {scaledResult.originalRecipe.yieldUnit}</p>
                <p className="text-lg font-bold text-primary">${scaledResult.costPerUnit.toFixed(2)}</p>
              </div>
            </div>

            {/* Scaled Ingredients */}
            <div className="card-elevated overflow-hidden">
              <div className="p-3 bg-muted/50 border-b border-border">
                <p className="text-sm font-medium">Scaled Ingredients (with yield factors)</p>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {scaledResult.scaledIngredients.map((ing, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ing.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ing.originalQuantity} {ing.unit} → {ing.scaledQuantity.toFixed(2)} {ing.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{ing.grossQuantity.toFixed(2)} {ing.unit}</p>
                      <p className="text-xs text-muted-foreground">
                        Order qty (incl. waste) • ${ing.lineCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Shopping List Prompt */}
        {showShoppingPrompt && scaledResult && (
          <div className="p-5 bg-primary/5 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Add to shopping list?</p>
                <p className="text-xs text-muted-foreground">Add {scaledResult.scaledIngredients.length} ingredients to your todo list</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowShoppingPrompt(false);
                  setSelectedRecipeId("");
                  setTargetServings(0);
                  setTargetYield(0);
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors font-medium text-sm"
              >
                Skip
              </button>
              <button
                onClick={handleAddToShoppingList}
                disabled={addFromRecipeScale.isPending}
                className="flex-1 btn-primary text-sm"
              >
                {addFromRecipeScale.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                ) : (
                  <><ShoppingCart className="w-4 h-4 mr-2" /> Add to List</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!showShoppingPrompt && (
        <div className="p-5 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors font-medium">
            Close
          </button>
          {scaledResult && (
            <button 
              onClick={onBatchCreated ? handleCreateBatch : undefined}
              disabled={creating}
              className="flex-1 btn-primary"
            >
              {creating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging...</>
              ) : (
                <><TrendingUp className="w-4 h-4 mr-2" /> Log Batch</>
              )}
            </button>
          )}
        </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RecipeScaler;
