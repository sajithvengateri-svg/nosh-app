import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Clock,
  Users,
  DollarSign,
  Percent,
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Package,
  Loader2,
  MessageSquareWarning
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FoodCostCalculator from "@/components/costing/FoodCostCalculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useOrgId } from "@/hooks/useOrgId";
import { useHomeCookRecipeView } from "@/hooks/useHomeCookRecipeView";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  previous_cost_per_unit: number | null;
}

interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  ingredient?: Ingredient;
  line_cost?: number;
}

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
  total_yield: number;
  yield_unit: string;
  food_cost_low_alert: number;
  food_cost_high_alert: number;
  shelf_life_days: number;
  shelf_life_hours: number;
  storage_temp: string | null;
}

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const orgId = useOrgId();
  const { isSimple, showSection } = useHomeCookRecipeView();
  const [showCalculator, setShowCalculator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [complaintCount, setComplaintCount] = useState(0);

  const hasEditPermission = canEdit("recipes");

  useEffect(() => {
    if (id) {
      fetchRecipe();
      if (orgId) {
        (supabase as any)
          .from("food_complaints")
          .select("id", { count: "exact", head: true })
          .eq("recipe_id", id)
          .eq("org_id", orgId)
          .neq("status", "resolved")
          .then(({ count }: any) => setComplaintCount(count || 0));
      }
    }
  }, [id, orgId]);

  const fetchRecipe = async () => {
    setLoading(true);
    
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (recipeError || !recipeData) {
      setLoading(false);
      return;
    }

    setRecipe({
      ...recipeData,
      sell_price: Number(recipeData.sell_price) || 0,
      target_food_cost_percent: Number(recipeData.target_food_cost_percent) || 30,
      total_yield: Number(recipeData.total_yield) || recipeData.servings || 1,
      yield_unit: recipeData.yield_unit || "portions",
      food_cost_low_alert: Number(recipeData.food_cost_low_alert) || 20,
      food_cost_high_alert: Number(recipeData.food_cost_high_alert) || 35,
      shelf_life_days: recipeData.shelf_life_days ?? 3,
      shelf_life_hours: recipeData.shelf_life_hours ?? 0,
      storage_temp: recipeData.storage_temp || null,
    } as Recipe);

    const { data: riData } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", id);

    const { data: ingData } = await supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit, previous_cost_per_unit");

    const enriched = (riData || []).map(ri => {
      const ing = (ingData || []).find(i => i.id === ri.ingredient_id) as Ingredient | undefined;
      return {
        ...ri,
        ingredient: ing,
        line_cost: ing ? Number(ing.cost_per_unit) * Number(ri.quantity) : 0,
      };
    });

    setRecipeIngredients(enriched);
    setLoading(false);
  };

  const calculations = useMemo(() => {
    if (!recipe) return null;

    const totalCost = recipeIngredients.reduce((sum, ri) => sum + (ri.line_cost || 0), 0);
    const portions = recipe.total_yield || recipe.servings || 1;
    const costPerServing = totalCost / portions;
    const actualFoodCostPercent = recipe.sell_price > 0 
      ? (costPerServing / recipe.sell_price) * 100 
      : 0;
    const maxAllowedCost = recipe.sell_price * (recipe.target_food_cost_percent / 100);
    const margin = recipe.sell_price - costPerServing;
    const isOverBudget = actualFoodCostPercent > recipe.target_food_cost_percent;

    return {
      totalCost,
      costPerServing,
      actualFoodCostPercent,
      maxAllowedCost,
      margin,
      isOverBudget,
    };
  }, [recipe, recipeIngredients]);

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
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Recipe not found</p>
        </div>
      </AppLayout>
    );
  }

  const costPercentColor = calculations?.isOverBudget ? "text-destructive" : "text-success";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4"
        >
          <button 
            onClick={() => navigate("/recipes")}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="page-title font-display">{recipe.name}</h1>
                <p className="page-subtitle">{recipe.category}</p>
              </div>
              <div className="flex gap-2">
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
                  <Link to={`/recipes/${recipe.id}/edit`}>
                    <Button>
                      <Edit className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit Recipe</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Shelf Life Badge */}
        {(recipe.shelf_life_days > 0 || recipe.shelf_life_hours > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{isSimple ? "Keeps" : "Shelf Life:"}:</span>
              <span>
                {recipe.shelf_life_days > 0 && `${recipe.shelf_life_days} day${recipe.shelf_life_days > 1 ? "s" : ""}`}
                {!isSimple && recipe.shelf_life_days > 0 && recipe.shelf_life_hours > 0 && " "}
                {!isSimple && recipe.shelf_life_hours > 0 && `${recipe.shelf_life_hours}h`}
              </span>
              {recipe.storage_temp && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="capitalize">{recipe.storage_temp}</span>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Complaint Warning */}
        {complaintCount > 0 && showSection("complaints") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.09 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/5 border border-destructive/20"
          >
            <MessageSquareWarning className="w-5 h-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                {complaintCount} open complaint{complaintCount > 1 ? "s" : ""} linked to this recipe
              </p>
              <p className="text-xs text-muted-foreground">Check the Complaints Log for details and patterns.</p>
            </div>
            <Badge variant="destructive" className="flex-shrink-0">{complaintCount}</Badge>
          </motion.div>
        )}

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "grid gap-4",
            isSimple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
          )}
        >
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Total Time</span>
            </div>
            <p className="stat-value text-xl">{recipe.prep_time + recipe.cook_time} min</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Yield</span>
            </div>
            <p className="stat-value text-xl">{recipe.total_yield} {recipe.yield_unit}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Sell Price</span>
            </div>
            <p className="stat-value text-xl">${recipe.sell_price.toFixed(2)}</p>
          </div>
          {!isSimple && (
            <div className="stat-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Percent className="w-4 h-4" />
                <span className="text-xs">Target Cost %</span>
              </div>
              <p className="stat-value text-xl">{recipe.target_food_cost_percent}%</p>
            </div>
          )}
        </motion.div>

        {/* Cost Analysis - Simple: single line; Full: detailed card */}
        {calculations && (
          isSimple && !showSection("costDetails") ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elevated p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-bold">${calculations.totalCost.toFixed(2)}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">Cost/{recipe.yield_unit}:</span>
                <span className="font-bold">${calculations.costPerServing.toFixed(2)}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "card-elevated p-5 border-l-4",
                calculations.isOverBudget ? "border-l-destructive" : "border-l-success"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-header mb-0">Cost Analysis</h2>
                {calculations.isOverBudget ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Over Budget</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">On Target</span>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                  <p className="text-2xl font-bold">${calculations.totalCost.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Cost/{recipe.yield_unit}</p>
                  <p className="text-2xl font-bold">${calculations.costPerServing.toFixed(2)}</p>
                </div>
                <div className={cn("p-4 rounded-xl", calculations.isOverBudget ? "bg-destructive/10" : "bg-success/10")}>
                  <p className="text-xs text-muted-foreground mb-1">Actual Food Cost %</p>
                  <p className={cn("text-2xl font-bold", costPercentColor)}>
                    {calculations.actualFoodCostPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Max Allowed Cost</p>
                  <p className="text-2xl font-bold text-primary">${calculations.maxAllowedCost.toFixed(2)}</p>
                </div>
              </div>

              {calculations.isOverBudget && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm">
                    <span className="font-medium text-destructive">
                      ${(calculations.costPerServing - calculations.maxAllowedCost).toFixed(2)} over budget
                    </span>
                    <span className="text-muted-foreground"> — reduce ingredients or increase sell price to </span>
                    <span className="font-medium text-foreground">
                      ${(calculations.costPerServing / (recipe.target_food_cost_percent / 100)).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gross Margin</p>
                  <p className="text-xl font-bold text-success">${calculations.margin.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Margin %</p>
                  <p className="text-xl font-bold text-success">
                    {(100 - calculations.actualFoodCostPercent).toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          )
        )}

        {/* Ingredient Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated overflow-hidden"
        >
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="section-header mb-0">{isSimple ? "Ingredients" : "Ingredient Cost Breakdown"}</h2>
              {!isSimple && (
                <p className="text-sm text-muted-foreground mt-1">
                  Costs update automatically when ingredient prices change
                </p>
              )}
            </div>
            {hasEditPermission && (
              <Link to={`/recipes/${recipe.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Ingredients
                </Button>
              </Link>
            )}
          </div>

          {recipeIngredients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No ingredients added yet</p>
              {hasEditPermission && (
                <Link to={`/recipes/${recipe.id}/edit`}>
                  <Button variant="outline" className="mt-4">
                    Add Ingredients
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recipeIngredients.map((ri) => {
                const percentOfTotal = calculations && calculations.totalCost > 0
                  ? ((ri.line_cost || 0) / calculations.totalCost) * 100 
                  : 0;
                const priceChanged = ri.ingredient?.previous_cost_per_unit && 
                  Number(ri.ingredient.previous_cost_per_unit) !== Number(ri.ingredient.cost_per_unit);
                const priceIncreased = priceChanged && 
                  Number(ri.ingredient?.cost_per_unit) > Number(ri.ingredient?.previous_cost_per_unit);

                return (
                  <div key={ri.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {!isSimple && (
                        <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {ri.ingredient?.name || "Unknown"}
                          </p>
                          {!isSimple && priceChanged && (
                            <div className={cn(
                              "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                              priceIncreased 
                                ? "bg-destructive/10 text-destructive" 
                                : "bg-success/10 text-success"
                            )}>
                              {priceIncreased ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>Price updated</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {Number(ri.quantity).toFixed(2)} {ri.unit}
                          {!isSimple && <> × ${Number(ri.ingredient?.cost_per_unit || 0).toFixed(2)}/{ri.ingredient?.unit}</>}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">${(ri.line_cost || 0).toFixed(2)}</p>
                        {!isSimple && (
                          <p className="text-xs text-muted-foreground">
                            {percentOfTotal.toFixed(1)}% of total
                          </p>
                        )}
                      </div>
                    </div>

                    {!isSimple && (
                      <div className="mt-2 ml-12">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentOfTotal}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Food Cost Calculator Modal */}
        <FoodCostCalculator
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          initialSellPrice={recipe.sell_price}
          initialTargetPercent={recipe.target_food_cost_percent}
          initialCost={calculations?.costPerServing || 0}
        />
      </div>
    </AppLayout>
  );
};

export default RecipeDetail;
