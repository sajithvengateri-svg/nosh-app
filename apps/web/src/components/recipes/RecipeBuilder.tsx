import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";
import IngredientCombobox from "./IngredientCombobox";
import NewIngredientDialog from "./NewIngredientDialog";
import { IngredientMatch } from "@/lib/ingredientMatcher";
 import { calculateIngredientCost, getConversionExplanation } from "@/lib/unitConversion";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  previous_cost_per_unit: number | null;
  category: string;
}

interface RecipeIngredient {
  id?: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  // Computed
  ingredient?: Ingredient;
  line_cost?: number;
}

interface RecipeBuilderProps {
  recipeId: string;
  servings: number;
  sellPrice: number;
  targetFoodCostPercent: number;
  gstPercent: number;
  totalYield: number;
  yieldUnit: string;
  foodCostLowAlert: number;
  foodCostHighAlert: number;
  onCostUpdate?: (totalCost: number, costPerPortion: number) => void;
  hasEditPermission: boolean;
}

const units = ["g", "kg", "ml", "L", "each", "lb", "oz", "bunch", "tbsp", "tsp", "cup"];

const RecipeBuilder = ({
  recipeId,
  servings,
  sellPrice,
  targetFoodCostPercent,
  gstPercent,
  totalYield,
  yieldUnit,
  foodCostLowAlert,
  foodCostHighAlert,
  onCostUpdate,
  hasEditPermission,
}: RecipeBuilderProps) => {
  const { currentOrg } = useOrg();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New ingredient row state
  const [newIngredient, setNewIngredient] = useState({
    ingredient_id: "",
    quantity: 0 as number,
    unit: "g",
    notes: "",
  });

  // New ingredient dialog state
  const [showNewIngredientDialog, setShowNewIngredientDialog] = useState(false);
  const [pendingIngredientName, setPendingIngredientName] = useState("");
  const [pendingSimilarMatches, setPendingSimilarMatches] = useState<IngredientMatch[]>([]);

  useEffect(() => {
    fetchData();
  }, [recipeId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all ingredients
    const { data: ingData } = await supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit, previous_cost_per_unit, category")
      .order("name");

    // Fetch recipe ingredients
    const { data: recipeIngData } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeId);

    setIngredients((ingData || []) as Ingredient[]);
    
    // Enrich recipe ingredients with ingredient details
    const enriched = (recipeIngData || []).map(ri => {
      const ing = (ingData || []).find(i => i.id === ri.ingredient_id) as Ingredient | undefined;
       const lineCost = ing 
         ? calculateIngredientCost(
             Number(ri.quantity),
             ri.unit,
             Number(ing.cost_per_unit),
             ing.unit
           ) || 0
         : 0;
      return {
        ...ri,
        ingredient: ing,
        line_cost: lineCost,
      };
    });
    
    setRecipeIngredients(enriched);
    setLoading(false);
  };

  // Calculate totals
  const calculations = useMemo(() => {
    const totalFoodCost = recipeIngredients.reduce((sum, ri) => sum + (ri.line_cost || 0), 0);
    const portions = totalYield || servings || 1;
    const costPerPortion = totalFoodCost / portions;
    const actualFoodCostPercent = sellPrice > 0 ? (costPerPortion / sellPrice) * 100 : 0;
    const suggestedSellPrice = targetFoodCostPercent > 0 
      ? (costPerPortion / (targetFoodCostPercent / 100)) * (1 + gstPercent / 100)
      : 0;
    const maxAllowedCost = sellPrice * (targetFoodCostPercent / 100);
    const margin = sellPrice - costPerPortion;
    const marginPercent = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;

    // Alert status
    let alertStatus: "low" | "ok" | "high" | "critical" = "ok";
    if (actualFoodCostPercent > foodCostHighAlert) {
      alertStatus = "critical";
    } else if (actualFoodCostPercent > targetFoodCostPercent) {
      alertStatus = "high";
    } else if (actualFoodCostPercent < foodCostLowAlert) {
      alertStatus = "low";
    }

    return {
      totalFoodCost,
      portions,
      costPerPortion,
      actualFoodCostPercent,
      suggestedSellPrice,
      maxAllowedCost,
      margin,
      marginPercent,
      alertStatus,
    };
  }, [recipeIngredients, totalYield, servings, sellPrice, targetFoodCostPercent, gstPercent, foodCostLowAlert, foodCostHighAlert]);

  useEffect(() => {
    onCostUpdate?.(calculations.totalFoodCost, calculations.costPerPortion);
  }, [calculations.totalFoodCost, calculations.costPerPortion]);

  const addIngredient = async () => {
    if (!newIngredient.ingredient_id || newIngredient.quantity <= 0) {
      toast.error("Select an ingredient and enter quantity");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("recipe_ingredients").insert({
      recipe_id: recipeId,
      ingredient_id: newIngredient.ingredient_id,
      quantity: newIngredient.quantity,
      unit: newIngredient.unit,
      notes: newIngredient.notes || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("This ingredient is already in the recipe");
      } else {
        toast.error("Failed to add ingredient");
      }
    } else {
      toast.success("Ingredient added");
      setNewIngredient({ ingredient_id: "", quantity: 0 as number, unit: "g", notes: "" });
      fetchData();
    }
    setSaving(false);
  };

  // Handle opening new ingredient dialog
  const handleCreateNewIngredient = (searchTerm: string, matches: IngredientMatch[]) => {
    setPendingIngredientName(searchTerm);
    setPendingSimilarMatches(matches);
    setShowNewIngredientDialog(true);
  };

  // Handle selecting existing ingredient from dialog
  const handleSelectExistingFromDialog = (ingredientId: string) => {
    const ing = ingredients.find(i => i.id === ingredientId);
    setNewIngredient({
      ...newIngredient,
      ingredient_id: ingredientId,
      unit: ing?.unit || "g",
    });
    setShowNewIngredientDialog(false);
  };

  // Handle creating new ingredient from dialog
  const handleCreateNewFromDialog = async (newIng: {
    name: string;
    unit: string;
    category: string;
    cost_per_unit: number;
  }) => {
    setSaving(true);
    
    const { data, error } = await supabase
      .from("ingredients")
      .insert({
        name: newIng.name,
        unit: newIng.unit,
        category: newIng.category,
        cost_per_unit: newIng.cost_per_unit,
        org_id: currentOrg?.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create ingredient");
      setSaving(false);
      return;
    }

    toast.success(`Added "${newIng.name}" to ingredients database`);
    
    // Update local ingredients list
    setIngredients(prev => [...prev, data as Ingredient]);
    
    // Select the new ingredient
    setNewIngredient({
      ...newIngredient,
      ingredient_id: data.id,
      unit: data.unit,
    });
    
    setShowNewIngredientDialog(false);
    setSaving(false);
  };

  const updateIngredient = async (id: string, updates: Partial<RecipeIngredient>) => {
    const { error } = await supabase
      .from("recipe_ingredients")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      fetchData();
    }
  };

  // Update ingredient unit price and reverse-sync to ingredients table
  const updateIngredientPrice = async (ingredientId: string, newPrice: number) => {
    const { error } = await supabase
      .from("ingredients")
      .update({ cost_per_unit: newPrice })
      .eq("id", ingredientId);

    if (error) {
      toast.error("Failed to update price");
    } else {
      toast.success("Unit price updated — synced to Ingredients");
      fetchData();
    }
  };

  const removeIngredient = async (id: string) => {
    const { error } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove ingredient");
    } else {
      toast.success("Ingredient removed");
      fetchData();
    }
  };

  const alertStyles = {
    low: { bg: "bg-warning/10", border: "border-warning", text: "text-warning", label: "Under Target" },
    ok: { bg: "bg-success/10", border: "border-success", text: "text-success", label: "On Target" },
    high: { bg: "bg-warning/10", border: "border-warning", text: "text-warning", label: "Above Target" },
    critical: { bg: "bg-destructive/10", border: "border-destructive", text: "text-destructive", label: "Over Budget" },
  };

  const currentAlert = alertStyles[calculations.alertStatus];

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "card-elevated p-5 border-l-4",
          currentAlert.border
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Food Cost Analysis
          </h3>
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", currentAlert.bg, currentAlert.text)}>
            {calculations.alertStatus === "critical" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : calculations.alertStatus === "ok" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {currentAlert.label}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Food Cost</p>
            <p className="text-xl font-bold">${calculations.totalFoodCost.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Cost per {yieldUnit || "Portion"}</p>
            <p className="text-xl font-bold">${calculations.costPerPortion.toFixed(2)}</p>
          </div>
          <div className={cn("p-3 rounded-lg", currentAlert.bg)}>
            <p className="text-xs text-muted-foreground">Actual Food Cost %</p>
            <p className={cn("text-xl font-bold", currentAlert.text)}>
              {calculations.actualFoodCostPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Target: {targetFoodCostPercent}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <p className="text-xs text-muted-foreground">Suggested Sell Price (inc GST)</p>
            <p className="text-xl font-bold text-primary">
              ${calculations.suggestedSellPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Yield</p>
            <p className="font-semibold">{calculations.portions} {yieldUnit || "portions"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gross Margin</p>
            <p className="font-semibold text-success">${calculations.margin.toFixed(2)} ({calculations.marginPercent.toFixed(1)}%)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Allowed Cost</p>
            <p className="font-semibold">${calculations.maxAllowedCost.toFixed(2)}</p>
          </div>
        </div>
      </motion.div>

      {/* Ingredients Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-elevated overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Ingredient Breakdown</h3>
          <p className="text-sm text-muted-foreground">Prices linked to ingredient database</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Ingredient</th>
                <th className="px-4 py-3 font-medium w-24">Qty</th>
                <th className="px-4 py-3 font-medium w-24">Unit</th>
                <th className="px-4 py-3 font-medium w-28">Unit Cost</th>
                <th className="px-4 py-3 font-medium w-28">Line Cost</th>
                <th className="px-4 py-3 font-medium w-20">% Total</th>
                {hasEditPermission && <th className="px-4 py-3 font-medium w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recipeIngredients.map((ri) => {
                const percentOfTotal = calculations.totalFoodCost > 0
                  ? ((ri.line_cost || 0) / calculations.totalFoodCost) * 100
                  : 0;
                const priceChanged = ri.ingredient?.previous_cost_per_unit && 
                  ri.ingredient.previous_cost_per_unit !== ri.ingredient.cost_per_unit;
                const priceIncreased = priceChanged && 
                  Number(ri.ingredient?.cost_per_unit) > Number(ri.ingredient?.previous_cost_per_unit);

                return (
                  <tr key={ri.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{ri.ingredient?.name || "Unknown"}</span>
                        {priceChanged && (
                          <span className={cn(
                            "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                            priceIncreased ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                          )}>
                            {priceIncreased ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {hasEditPermission ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ri.quantity || ""}
                          placeholder="0"
                          onChange={(e) => updateIngredient(ri.id!, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-8"
                        />
                      ) : (
                        <span>{Number(ri.quantity).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hasEditPermission ? (
                        <Select
                          value={ri.unit}
                          onValueChange={(v) => updateIngredient(ri.id!, { unit: v })}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map(u => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span>{ri.unit}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      <div className="flex flex-col">
                        {hasEditPermission ? (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={Number(ri.ingredient?.cost_per_unit || 0).toFixed(2)}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && ri.ingredient && val !== Number(ri.ingredient.cost_per_unit)) {
                                  updateIngredientPrice(ri.ingredient.id, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-20 h-7 text-xs font-mono"
                            />
                            <span className="text-muted-foreground text-xs">/{ri.ingredient?.unit}</span>
                          </div>
                        ) : (
                          <span>${Number(ri.ingredient?.cost_per_unit || 0).toFixed(2)}/{ri.ingredient?.unit}</span>
                        )}
                        {ri.unit !== ri.ingredient?.unit && ri.ingredient && (
                          <span className="text-xs text-muted-foreground">
                            {getConversionExplanation(Number(ri.quantity), ri.unit, ri.ingredient.unit)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      ${(ri.line_cost || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {percentOfTotal.toFixed(1)}%
                    </td>
                    {hasEditPermission && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeIngredient(ri.id!)}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Add new ingredient row */}
              {hasEditPermission && (
                <tr className="bg-muted/20">
                  <td className="px-4 py-3">
                    <IngredientCombobox
                      ingredients={ingredients}
                      value={newIngredient.ingredient_id}
                      onChange={(id) => {
                        const ing = ingredients.find(i => i.id === id);
                        setNewIngredient({ 
                          ...newIngredient, 
                          ingredient_id: id,
                          unit: ing?.unit || "g"
                        });
                      }}
                      onCreateNew={handleCreateNewIngredient}
                      excludeIds={recipeIngredients.map(ri => ri.ingredient_id)}
                      placeholder="Search or add ingredient..."
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newIngredient.quantity || ""}
                      onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-20 h-8"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={newIngredient.unit}
                      onValueChange={(v) => setNewIngredient({ ...newIngredient, unit: v })}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">
                    <Button size="sm" onClick={addIngredient} disabled={saving}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )}

              {recipeIngredients.length === 0 && !hasEditPermission && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No ingredients added yet
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-muted/50 font-semibold">
              <tr>
                <td className="px-4 py-3" colSpan={4}>Total Food Cost</td>
                <td className="px-4 py-3">${calculations.totalFoodCost.toFixed(2)}</td>
                <td className="px-4 py-3">100%</td>
                {hasEditPermission && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* New Ingredient Dialog */}
      <NewIngredientDialog
        open={showNewIngredientDialog}
        onOpenChange={setShowNewIngredientDialog}
        ingredientName={pendingIngredientName}
        similarMatches={pendingSimilarMatches}
        onSelectExisting={handleSelectExistingFromDialog}
        onCreateNew={handleCreateNewFromDialog}
      />
    </div>
  );
};

export default RecipeBuilder;
