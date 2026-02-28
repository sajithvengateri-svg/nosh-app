// Production, Yield, Scaling, and Batch Management Types

export interface YieldFactor {
  wastePercent: number;
  cookingLossPercent: number;
  usableYieldPercent: number;
}

export interface IngredientWithYield {
  ingredientId: string;
  quantity: number;
  unit: string;
  wastePercent: number;
  cookingLossPercent: number;
  grossQuantity?: number;
  usableQuantity?: number;
  cost?: number;
}

export interface ScalableRecipe {
  id: string;
  name: string;
  category: string;
  baseServings: number;
  baseYieldWeight: number;
  yieldUnit: string;
  prepTime: string;
  cookTime: string;
  sellPrice: number;
  targetFoodCostPercent: number;
  ingredients: IngredientWithYield[];
  instructions?: string[];
  shelfLifeDays: number;
}

export interface ScalingInput {
  recipeId: string;
  scaleBy: 'servings' | 'yield';
  targetServings?: number;
  targetYieldWeight?: number;
}

export interface ScaledRecipe {
  originalRecipe: ScalableRecipe;
  scaleFactor: number;
  targetServings: number;
  targetYieldWeight: number;
  scaledIngredients: {
    ingredientId: string;
    name: string;
    originalQuantity: number;
    scaledQuantity: number;
    grossQuantity: number;
    unit: string;
    unitCost: number;
    lineCost: number;
  }[];
  totalCost: number;
  costPerServing: number;
  costPerUnit: number;
}

export interface ProductionBatch {
  id: string;
  batchCode: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  unit: string;
  servingsProduced: number;
  productionDate: Date;
  expiryDate: Date;
  producedBy: string;
  status: 'planned' | 'in-progress' | 'completed' | 'discarded';
  actualCost?: number;
  notes?: string;
}

export interface ProductionSchedule {
  id: string;
  date: Date;
  shift: 'AM' | 'PM';
  batches: ProductionBatch[];
  assignedStaff: string[];
  status: 'draft' | 'confirmed' | 'completed';
}

export interface OrderLineItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  supplier: string;
  requiredQuantity: number;
  currentStock: number;
  orderQuantity: number;
  unitPrice: number;
  lineCost: number;
  urgency: 'critical' | 'needed' | 'buffer';
}

export interface GeneratedOrder {
  id: string;
  generatedFrom: 'prep-list' | 'par-level' | 'manual';
  prepListIds: string[];
  dateRange: { start: Date; end: Date };
  items: OrderLineItem[];
  totalCost: number;
  status: 'draft' | 'submitted' | 'received';
  createdAt: Date;
  suppliersInvolved: string[];
}

export interface PrepListWithOrdering {
  id: string;
  date: Date;
  shift: 'AM' | 'PM';
  tasks: PrepTaskWithIngredients[];
  aggregatedIngredients: AggregatedIngredient[];
  generatedOrderId?: string;
}

export interface PrepTaskWithIngredients {
  id: string;
  task: string;
  recipeId?: string;
  recipeName?: string;
  quantity: number;
  unit: string;
  scaleFactor: number;
  assignee: string;
  dueTime: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  ingredients: {
    ingredientId: string;
    name: string;
    requiredQuantity: number;
    unit: string;
  }[];
}

export interface AggregatedIngredient {
  ingredientId: string;
  name: string;
  totalRequired: number;
  unit: string;
  currentStock: number;
  shortfall: number;
  supplier: string;
  estimatedCost: number;
}
