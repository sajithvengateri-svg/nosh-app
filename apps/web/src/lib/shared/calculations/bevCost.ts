import type { CellaringReadiness } from '../types/beverage.types';

/** Cost of a single pour from a bottle */
export function calculatePourCost(bottlePrice: number, bottleSizeMl: number, pourSizeMl: number): number {
  if (bottleSizeMl <= 0 || pourSizeMl <= 0) return 0;
  return (bottlePrice / bottleSizeMl) * pourSizeMl;
}

/** Cost of a Coravin pour including gas */
export function calculateCoravinPourCost(
  bottlePrice: number, bottleSizeMl: number, pourSizeMl: number,
  gasCostPerCapsule: number, poursPerCapsule: number
): number {
  const baseCost = calculatePourCost(bottlePrice, bottleSizeMl, pourSizeMl);
  const gasCost = poursPerCapsule > 0 ? gasCostPerCapsule / poursPerCapsule : 0;
  return baseCost + gasCost;
}

/** Sum cost of cocktail ingredients */
export function calculateCocktailCost(ingredients: { cost: number }[]): number {
  return ingredients.reduce((sum, i) => sum + i.cost, 0);
}

/** BTG (by-the-glass) margin % */
export function calculateBTGMargin(costPerPour: number, sellPrice: number): number {
  if (sellPrice <= 0) return 0;
  return ((sellPrice - costPerPour) / sellPrice) * 100;
}

/** Cost per pour from a keg with waste factor */
export function calculateKegPourCost(kegCost: number, kegLitres: number, pourMl: number, wasteFactor = 0.05): number {
  if (kegLitres <= 0 || pourMl <= 0) return 0;
  const usableMl = kegLitres * 1000 * (1 - wasteFactor);
  return kegCost / (usableMl / pourMl);
}

/** Keg yield % */
export function calculateKegYield(theoreticalPours: number, actualPours: number): number {
  if (theoreticalPours <= 0) return 0;
  return (actualPours / theoreticalPours) * 100;
}

/** Variance cost (theoretical vs actual) */
export function calculateVarianceCost(theoretical: number, actual: number, unitCost: number): number {
  return (theoretical - actual) * unitCost;
}

/** Total cellar value */
export function calculateCellarValue(items: { quantity: number; purchasePrice: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.purchasePrice, 0);
}

/** Coravin ROI over N pours */
export function calculateCoravinROI(standardPourCost: number, coravinPourCost: number, totalCoravinPours: number): number {
  return (standardPourCost - coravinPourCost) * totalCoravinPours;
}

/** Cellaring readiness score */
export function calculateCellaringScore(vintage: number, drinkFrom: number, drinkTo: number, currentYear: number): CellaringReadiness {
  if (currentYear < drinkFrom) return 'too_young';
  if (currentYear > drinkTo) return 'declining';
  const mid = (drinkFrom + drinkTo) / 2;
  const peakWindow = (drinkTo - drinkFrom) * 0.3;
  if (currentYear >= mid - peakWindow && currentYear <= mid + peakWindow) return 'peak';
  return 'ready';
}

/** Pre-batch cost per serve */
export function calculatePrebatchCostPerServe(batchCost: number, batchYieldMl: number, serveSizeMl: number): number {
  if (batchYieldMl <= 0 || serveSizeMl <= 0) return 0;
  return (batchCost / batchYieldMl) * serveSizeMl;
}

/** Fresh juice yield */
export function calculateFreshJuiceYield(fruitKg: number, yieldMl: number): number {
  if (fruitKg <= 0) return 0;
  return yieldMl / fruitKg;
}

/** Dilution calculation for pre-batch (proof-based) */
export function calculateDilutionForBatch(spiritProof: number, targetProof: number, volumeMl: number): number {
  if (targetProof <= 0 || targetProof >= spiritProof) return 0;
  return volumeMl * ((spiritProof / targetProof) - 1);
}
