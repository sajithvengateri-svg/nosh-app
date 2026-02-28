/**
 * Food cost calculation utilities
 * Pure functions — no web APIs, no side effects
 */

/**
 * Reverse costing: given a sell price and target food cost %, calculate max allowed ingredient cost
 */
export const calculateReverseCost = (
  sellPrice: number,
  targetFoodCostPercent: number,
  servings: number = 1
) => {
  const maxAllowedCost = (sellPrice * targetFoodCostPercent) / 100;
  const maxCostPerServing = maxAllowedCost;
  const targetMargin = sellPrice - maxAllowedCost;
  const targetMarginPercent = 100 - targetFoodCostPercent;

  return {
    maxAllowedCost,
    maxCostPerServing,
    targetMargin,
    targetMarginPercent,
    maxIngredientBudget: maxAllowedCost * servings,
  };
};

/**
 * Forward pricing: given a cost and target food cost %, calculate required sell price
 */
export const calculateSellPriceFromCost = (
  cost: number,
  targetFoodCostPercent: number
) => {
  return cost / (targetFoodCostPercent / 100);
};

/**
 * Calculate actual food cost percentage
 */
export const calculateFoodCostPercent = (cost: number, sellPrice: number) => {
  if (sellPrice === 0) return 0;
  return (cost / sellPrice) * 100;
};
