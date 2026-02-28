// Unit conversion utility for accurate recipe costing
// Handles conversions between mass and volume units
// Pure functions — no web APIs

type MassUnit = 'g' | 'kg' | 'lb' | 'oz';
type VolumeUnit = 'ml' | 'L' | 'tsp' | 'tbsp' | 'cup';
type CountUnit = 'each' | 'bunch' | 'case';

export type Unit = MassUnit | VolumeUnit | CountUnit;

// Conversion factors to base units (g for mass, ml for volume)
const massToGrams: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  lb: 453.592,
  oz: 28.3495,
};

const volumeToMl: Record<VolumeUnit, number> = {
  ml: 1,
  L: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
};

const massUnits = new Set<string>(['g', 'kg', 'lb', 'oz']);
const volumeUnits = new Set<string>(['ml', 'L', 'tsp', 'tbsp', 'cup']);
const countUnits = new Set<string>(['each', 'bunch', 'case']);

export function getUnitType(unit: string): 'mass' | 'volume' | 'count' | 'unknown' {
  if (massUnits.has(unit)) return 'mass';
  if (volumeUnits.has(unit)) return 'volume';
  if (countUnits.has(unit)) return 'count';
  return 'unknown';
}

export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const type1 = getUnitType(unit1);
  const type2 = getUnitType(unit2);
  if (type1 === type2) return true;
  return false;
}

/**
 * Convert a quantity from one unit to another
 * Returns null if units are incompatible
 */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  if (fromUnit === toUnit) return quantity;
  
  const fromType = getUnitType(fromUnit);
  const toType = getUnitType(toUnit);
  
  if (fromType !== toType) return null;
  if (fromType === 'count') return null;
  
  if (fromType === 'mass') {
    const inGrams = quantity * massToGrams[fromUnit as MassUnit];
    return inGrams / massToGrams[toUnit as MassUnit];
  }
  
  if (fromType === 'volume') {
    const inMl = quantity * volumeToMl[fromUnit as VolumeUnit];
    return inMl / volumeToMl[toUnit as VolumeUnit];
  }
  
  return null;
}

/**
 * Calculate the cost of a recipe ingredient, accounting for unit differences
 */
export function calculateIngredientCost(
  recipeQty: number,
  recipeUnit: string,
  costPerUnit: number,
  ingredientUnit: string
): number | null {
  if (recipeUnit === ingredientUnit) {
    return recipeQty * costPerUnit;
  }
  
  const convertedQty = convertUnit(recipeQty, recipeUnit, ingredientUnit);
  
  if (convertedQty === null) {
    console.warn(
      `Unit mismatch: recipe uses "${recipeUnit}" but ingredient is priced per "${ingredientUnit}". ` +
      `Falling back to direct multiplication which may be incorrect.`
    );
    return recipeQty * costPerUnit;
  }
  
  return convertedQty * costPerUnit;
}
