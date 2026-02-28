// Recipe and Ingredient Types for Costing System

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentPrice: number;
  previousPrice: number;
  supplier: string;
  lastUpdated: Date;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  cost?: number;
  ingredient?: Ingredient;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  description?: string;
  servings: number;
  prepTime: string;
  sellPrice: number;
  targetFoodCostPercent: number;
  ingredients: RecipeIngredient[];
  instructions?: string[];
  totalCost?: number;
  costPerServing?: number;
  actualFoodCostPercent?: number;
  margin?: number;
  maxAllowedCost?: number;
  isOverBudget?: boolean;
}

export interface CostingResult {
  totalCost: number;
  costPerServing: number;
  actualFoodCostPercent: number;
  margin: number;
  marginPercent: number;
  maxAllowedCost: number;
  costVariance: number;
  isOverBudget: boolean;
  ingredientBreakdown: {
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
    lineCost: number;
    percentOfTotal: number;
  }[];
}

export interface ReverseCostingInput {
  sellPrice: number;
  targetFoodCostPercent: number;
}

export interface ReverseCostingResult {
  maxAllowedCost: number;
  maxCostPerServing: number;
  targetMargin: number;
  targetMarginPercent: number;
}

export interface PriceUpdateEvent {
  ingredientId: string;
  oldPrice: number;
  newPrice: number;
  source: 'invoice' | 'manual';
  timestamp: Date;
}

export interface RecipeCostImpact {
  recipeId: string;
  recipeName: string;
  oldCost: number;
  newCost: number;
  costChange: number;
  costChangePercent: number;
  oldFoodCostPercent: number;
  newFoodCostPercent: number;
  isNowOverBudget: boolean;
}
