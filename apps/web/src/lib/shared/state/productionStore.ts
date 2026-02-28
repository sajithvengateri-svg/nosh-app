import { create } from 'zustand';
import { 
  ScalableRecipe, 
  ScaledRecipe, 
  ScalingInput,
  ProductionBatch,
  ProductionSchedule,
  GeneratedOrder,
  OrderLineItem,
  AggregatedIngredient,
  PrepTaskWithIngredients
} from '../types/production.types';

// Ingredient costs cache — populated externally by hooks
export const ingredientCostsCache = new Map<string, { name: string; price: number; unit: string }>();

// Empty initial state - no mock data
const initialScalableRecipes: ScalableRecipe[] = [];
const initialBatches: ProductionBatch[] = [];

interface ProductionStore {
  scalableRecipes: ScalableRecipe[];
  batches: ProductionBatch[];
  schedules: ProductionSchedule[];
  generatedOrders: GeneratedOrder[];

  setScalableRecipes: (recipes: ScalableRecipe[]) => void;
  scaleRecipe: (input: ScalingInput) => ScaledRecipe | null;
  calculateYield: (quantity: number, wastePercent: number, cookingLossPercent: number) => { gross: number; usable: number };
  createBatch: (batch: Omit<ProductionBatch, 'id' | 'batchCode'>) => ProductionBatch;
  updateBatchStatus: (batchId: string, status: ProductionBatch['status']) => void;
  getBatchesByDate: (date: Date) => ProductionBatch[];
  aggregateIngredientsFromTasks: (tasks: PrepTaskWithIngredients[]) => AggregatedIngredient[];
  generateOrderFromPrepList: (prepListId: string, tasks: PrepTaskWithIngredients[]) => GeneratedOrder;
}

export const useProductionStore = create<ProductionStore>((set, get) => ({
  scalableRecipes: initialScalableRecipes,
  batches: initialBatches,
  schedules: [],
  generatedOrders: [],

  setScalableRecipes: (recipes: ScalableRecipe[]) => set({ scalableRecipes: recipes }),

  scaleRecipe: (input: ScalingInput) => {
    const { scalableRecipes } = get();
    const recipe = scalableRecipes.find(r => r.id === input.recipeId);
    if (!recipe) return null;
    
    let scaleFactor: number;
    let targetServings: number;
    let targetYieldWeight: number;

    if (input.scaleBy === 'servings' && input.targetServings) {
      scaleFactor = input.targetServings / recipe.baseServings;
      targetServings = input.targetServings;
      targetYieldWeight = recipe.baseYieldWeight * scaleFactor;
    } else if (input.scaleBy === 'yield' && input.targetYieldWeight) {
      scaleFactor = input.targetYieldWeight / recipe.baseYieldWeight;
      targetServings = Math.round(recipe.baseServings * scaleFactor);
      targetYieldWeight = input.targetYieldWeight;
    } else {
      return null;
    }

    const scaledIngredients = recipe.ingredients.map(ing => {
      const cachedIngredient = ingredientCostsCache.get(ing.ingredientId);
      const scaledQuantity = ing.quantity * scaleFactor;
      const wasteMultiplier = 1 / (1 - ing.wastePercent / 100);
      const grossQuantity = scaledQuantity * wasteMultiplier;
      const unitCost = cachedIngredient?.price || 0;
      const lineCost = grossQuantity * unitCost;

      return {
        ingredientId: ing.ingredientId,
        name: cachedIngredient?.name || 'Unknown',
        originalQuantity: ing.quantity,
        scaledQuantity,
        grossQuantity,
        unit: ing.unit,
        unitCost,
        lineCost,
      };
    });

    const totalCost = scaledIngredients.reduce((sum, ing) => sum + ing.lineCost, 0);

    return {
      originalRecipe: recipe,
      scaleFactor,
      targetServings,
      targetYieldWeight,
      scaledIngredients,
      totalCost,
      costPerServing: totalCost / targetServings,
      costPerUnit: totalCost / targetYieldWeight,
    };
  },

  calculateYield: (quantity: number, wastePercent: number, cookingLossPercent: number) => {
    const afterWaste = quantity * (1 - wastePercent / 100);
    const usable = afterWaste * (1 - cookingLossPercent / 100);
    const gross = quantity / (1 - wastePercent / 100);
    return { gross, usable };
  },

  createBatch: (batchData) => {
    const { batches } = get();
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = batchData.recipeName.substring(0, 2).toUpperCase();
    const count = batches.filter(b => b.batchCode.startsWith(prefix + '-' + today)).length + 1;
    
    const newBatch: ProductionBatch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      batchCode: `${prefix}-${today}-${count.toString().padStart(3, '0')}`,
    };

    set({ batches: [...batches, newBatch] });
    return newBatch;
  },

  updateBatchStatus: (batchId: string, status: ProductionBatch['status']) => {
    set(state => ({
      batches: state.batches.map(b => 
        b.id === batchId ? { ...b, status } : b
      ),
    }));
  },

  getBatchesByDate: (date: Date) => {
    const { batches } = get();
    const dateStr = date.toDateString();
    return batches.filter(b => b.productionDate.toDateString() === dateStr);
  },

  aggregateIngredientsFromTasks: (tasks: PrepTaskWithIngredients[]) => {
    const aggregated: Map<string, AggregatedIngredient> = new Map();

    tasks.forEach(task => {
      task.ingredients.forEach(ing => {
        const existing = aggregated.get(ing.ingredientId);
        const cachedIngredient = ingredientCostsCache.get(ing.ingredientId);
        
        if (existing) {
          existing.totalRequired += ing.requiredQuantity * task.scaleFactor;
        } else {
          aggregated.set(ing.ingredientId, {
            ingredientId: ing.ingredientId,
            name: ing.name,
            totalRequired: ing.requiredQuantity * task.scaleFactor,
            unit: ing.unit,
            currentStock: 0,
            shortfall: 0,
            supplier: 'Unknown',
            estimatedCost: (cachedIngredient?.price || 0) * ing.requiredQuantity * task.scaleFactor,
          });
        }
      });
    });

    aggregated.forEach((item) => {
      item.shortfall = Math.max(0, item.totalRequired - item.currentStock);
    });

    return Array.from(aggregated.values());
  },

  generateOrderFromPrepList: (prepListId: string, tasks: PrepTaskWithIngredients[]) => {
    const { generatedOrders } = get();
    const aggregated = get().aggregateIngredientsFromTasks(tasks);

    const orderItems: OrderLineItem[] = aggregated
      .filter(item => item.shortfall > 0)
      .map(item => {
        const cachedIngredient = ingredientCostsCache.get(item.ingredientId);
        const unitPrice = cachedIngredient?.price || 0;
        
        return {
          ingredientId: item.ingredientId,
          ingredientName: item.name,
          unit: item.unit,
          supplier: item.supplier,
          requiredQuantity: item.totalRequired,
          currentStock: item.currentStock,
          orderQuantity: item.shortfall,
          unitPrice,
          lineCost: item.shortfall * unitPrice,
          urgency: item.shortfall > item.totalRequired * 0.8 ? 'critical' as const : 
                   item.shortfall > item.totalRequired * 0.3 ? 'needed' as const : 'buffer' as const,
        };
      });

    const suppliers = [...new Set(orderItems.map(i => i.supplier))];

    const order: GeneratedOrder = {
      id: `order-${Date.now()}`,
      generatedFrom: 'prep-list',
      prepListIds: [prepListId],
      dateRange: {
        start: new Date(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      items: orderItems,
      totalCost: orderItems.reduce((sum, item) => sum + item.lineCost, 0),
      status: 'draft',
      createdAt: new Date(),
      suppliersInvolved: suppliers,
    };

    set({ generatedOrders: [...generatedOrders, order] });
    return order;
  },
}));

// Utility functions for yield calculations
export const calculateGrossWeight = (netWeight: number, wastePercent: number): number => {
  return netWeight / (1 - wastePercent / 100);
};

export const calculateNetYield = (grossWeight: number, wastePercent: number, cookingLossPercent: number): number => {
  const afterWaste = grossWeight * (1 - wastePercent / 100);
  return afterWaste * (1 - cookingLossPercent / 100);
};

export const calculateUsableYieldPercent = (wastePercent: number, cookingLossPercent: number): number => {
  return (1 - wastePercent / 100) * (1 - cookingLossPercent / 100) * 100;
};
