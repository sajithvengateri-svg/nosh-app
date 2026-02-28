import { create } from 'zustand';
import { Ingredient, Recipe, PriceUpdateEvent, RecipeCostImpact } from '../types/costing.types';
import { convertUnit } from '../utils/unitConversion';

// Empty initial state - no mock data
const initialIngredients: Ingredient[] = [];
const initialRecipes: Recipe[] = [];

interface CostingStore {
  ingredients: Ingredient[];
  recipes: Recipe[];
  priceHistory: PriceUpdateEvent[];
  
  // Actions
  updateIngredientPrice: (ingredientId: string, newPrice: number, source: 'invoice' | 'manual') => RecipeCostImpact[];
  getRecipeWithCosts: (recipeId: string) => Recipe | null;
  calculateRecipeCost: (recipe: Recipe) => number;
  getAffectedRecipes: (ingredientId: string) => Recipe[];
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
}

export const useCostingStore = create<CostingStore>((set, get) => ({
  ingredients: initialIngredients,
  recipes: initialRecipes,
  priceHistory: [],

  updateIngredientPrice: (ingredientId: string, newPrice: number, source: 'invoice' | 'manual') => {
    const { ingredients, recipes, priceHistory } = get();
    const ingredient = ingredients.find(i => i.id === ingredientId);
    
    if (!ingredient) return [];

    const oldPrice = ingredient.currentPrice;
    
    const event: PriceUpdateEvent = {
      ingredientId,
      oldPrice,
      newPrice,
      source,
      timestamp: new Date(),
    };

    const affectedRecipes = recipes.filter(r => 
      r.ingredients.some(ri => ri.ingredientId === ingredientId)
    );

    const impacts: RecipeCostImpact[] = affectedRecipes.map(recipe => {
      const oldCost = get().calculateRecipeCost(recipe);
      
      const newCost = recipe.ingredients.reduce((total, ri) => {
        const ing = ingredients.find(i => i.id === ri.ingredientId);
        if (!ing) return total;
        const price = ri.ingredientId === ingredientId ? newPrice : ing.currentPrice;
        const convertedQty = convertUnit(ri.quantity, ri.unit, ing.unit);
        const qty = convertedQty !== null ? convertedQty : ri.quantity;
        return total + (price * qty);
      }, 0);

      const oldFoodCostPercent = (oldCost / recipe.sellPrice) * 100;
      const newFoodCostPercent = (newCost / recipe.sellPrice) * 100;

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        oldCost,
        newCost,
        costChange: newCost - oldCost,
        costChangePercent: ((newCost - oldCost) / oldCost) * 100,
        oldFoodCostPercent,
        newFoodCostPercent,
        isNowOverBudget: newFoodCostPercent > recipe.targetFoodCostPercent,
      };
    });

    set({
      ingredients: ingredients.map(i => 
        i.id === ingredientId 
          ? { ...i, previousPrice: oldPrice, currentPrice: newPrice, lastUpdated: new Date() }
          : i
      ),
      priceHistory: [...priceHistory, event],
    });

    return impacts;
  },

  getRecipeWithCosts: (recipeId: string) => {
    const { recipes, ingredients } = get();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe) return null;

    const enrichedIngredients = recipe.ingredients.map(ri => {
      const ingredient = ingredients.find(i => i.id === ri.ingredientId);
      let cost = 0;
      if (ingredient) {
        const convertedQty = convertUnit(ri.quantity, ri.unit, ingredient.unit);
        const qty = convertedQty !== null ? convertedQty : ri.quantity;
        cost = ingredient.currentPrice * qty;
      }
      return {
        ...ri,
        ingredient,
        cost,
      };
    });

    const totalCost = enrichedIngredients.reduce((sum, ri) => sum + (ri.cost || 0), 0);
    const costPerServing = totalCost / recipe.servings;
    const actualFoodCostPercent = (costPerServing / recipe.sellPrice) * 100;
    const maxAllowedCost = (recipe.sellPrice * recipe.targetFoodCostPercent) / 100;

    return {
      ...recipe,
      ingredients: enrichedIngredients,
      totalCost,
      costPerServing,
      actualFoodCostPercent,
      margin: recipe.sellPrice - costPerServing,
      maxAllowedCost,
      isOverBudget: actualFoodCostPercent > recipe.targetFoodCostPercent,
    };
  },

  calculateRecipeCost: (recipe: Recipe) => {
    const { ingredients } = get();
    return recipe.ingredients.reduce((total, ri) => {
      const ingredient = ingredients.find(i => i.id === ri.ingredientId);
      if (!ingredient) return total;
      const convertedQty = convertUnit(ri.quantity, ri.unit, ingredient.unit);
      const qty = convertedQty !== null ? convertedQty : ri.quantity;
      return total + (ingredient.currentPrice * qty);
    }, 0);
  },

  getAffectedRecipes: (ingredientId: string) => {
    const { recipes } = get();
    return recipes.filter(r => 
      r.ingredients.some(ri => ri.ingredientId === ingredientId)
    );
  },

  addRecipe: (recipe: Recipe) => {
    set(state => ({ recipes: [...state.recipes, recipe] }));
  },

  updateRecipe: (recipe: Recipe) => {
    set(state => ({
      recipes: state.recipes.map(r => r.id === recipe.id ? recipe : r),
    }));
  },
}));

// Re-export calculation utilities from shared for backwards compatibility
export { calculateReverseCost, calculateSellPriceFromCost, calculateFoodCostPercent } from '../calculations/foodCost';
