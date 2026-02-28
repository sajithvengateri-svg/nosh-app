import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock, Users, DollarSign, Percent, Calculator,
  AlertTriangle, CheckCircle2, Edit, Package, Loader2
} from "lucide-react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface RecipeBottomSheetProps {
  recipeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
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
  category: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  cost_per_serving: number;
  sell_price: number;
  target_food_cost_percent: number;
  total_yield: number;
  yield_unit: string;
}

export const RecipeBottomSheet = ({ recipeId, open, onOpenChange }: RecipeBottomSheetProps) => {
  const { canEdit } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const hasEditPermission = canEdit("recipes");

  useEffect(() => {
    if (open && recipeId) fetchRecipe();
    if (!open) { setRecipe(null); setIngredients([]); }
  }, [open, recipeId]);

  const fetchRecipe = async () => {
    if (!recipeId) return;
    setLoading(true);

    const [{ data: r }, { data: ri }, { data: ings }] = await Promise.all([
      supabase.from("recipes").select("*").eq("id", recipeId).single(),
      supabase.from("recipe_ingredients").select("*").eq("recipe_id", recipeId),
      supabase.from("ingredients").select("id, name, unit, cost_per_unit"),
    ]);

    if (r) {
      setRecipe({
        ...r,
        sell_price: Number(r.sell_price) || 0,
        target_food_cost_percent: Number(r.target_food_cost_percent) || 30,
        total_yield: Number(r.total_yield) || r.servings || 1,
        yield_unit: r.yield_unit || "portions",
      } as Recipe);
    }

    const enriched = (ri || []).map(item => {
      const ing = (ings || []).find(i => i.id === item.ingredient_id);
      return {
        ...item,
        ingredient: ing as Ingredient | undefined,
        line_cost: ing ? Number(ing.cost_per_unit) * Number(item.quantity) : 0,
      };
    });
    setIngredients(enriched);
    setLoading(false);
  };

  const calc = useMemo(() => {
    if (!recipe) return null;
    const totalCost = ingredients.reduce((s, ri) => s + (ri.line_cost || 0), 0);
    const portions = recipe.total_yield || recipe.servings || 1;
    const costPerServing = totalCost / portions;
    const actualPct = recipe.sell_price > 0 ? (costPerServing / recipe.sell_price) * 100 : 0;
    const margin = recipe.sell_price - costPerServing;
    const isOver = actualPct > recipe.target_food_cost_percent;
    return { totalCost, costPerServing, actualPct, margin, isOver };
  }, [recipe, ingredients]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-left">
            {loading ? "Loading..." : recipe?.name || "Recipe"}
          </DrawerTitle>
          {recipe && (
            <p className="text-sm text-muted-foreground text-left">{recipe.category}</p>
          )}
        </DrawerHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : recipe && calc ? (
          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Clock, label: "Time", value: `${recipe.prep_time + recipe.cook_time}m` },
                { icon: Users, label: "Yield", value: `${recipe.total_yield}` },
                { icon: DollarSign, label: "Sell", value: `$${recipe.sell_price.toFixed(2)}` },
                { icon: Percent, label: "Cost%", value: `${calc.actualPct.toFixed(1)}%` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm font-bold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Cost alert */}
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              calc.isOver ? "bg-destructive/10" : "bg-emerald-500/10 dark:bg-emerald-500/10"
            )}>
              {calc.isOver ? (
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", calc.isOver ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                  {calc.isOver ? "Over Budget" : "On Target"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cost ${calc.costPerServing.toFixed(2)} · Margin ${calc.margin.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Ingredients ({ingredients.length})</h3>
                <div className="space-y-1">
                  {ingredients.map(ri => (
                    <div key={ri.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{ri.ingredient?.name || "Unknown"}</span>
                      </div>
                      <span className="text-sm font-medium ml-2">${(ri.line_cost || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DrawerFooter className="flex-row gap-2 border-t border-border">
          {recipe && (
            <>
              <Link to={`/recipes/${recipe.id}`} className="flex-1">
                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  Full Detail
                </Button>
              </Link>
              {hasEditPermission && (
                <Link to={`/recipes/${recipe.id}/edit`} className="flex-1">
                  <Button className="w-full" onClick={() => onOpenChange(false)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </Link>
              )}
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
