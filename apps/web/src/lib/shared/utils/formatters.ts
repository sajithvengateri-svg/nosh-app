/**
 * Formatting utilities — pure functions, no web APIs
 */

import { convertUnit } from './unitConversion';

/**
 * Format a quantity with appropriate decimal places based on the unit
 */
export function formatQuantity(quantity: number, unit: string): string {
  if (['kg', 'L', 'lb'].includes(unit)) {
    return quantity.toFixed(3);
  }
  if (['g', 'ml', 'oz'].includes(unit)) {
    return quantity.toFixed(1);
  }
  return quantity.toFixed(2);
}

/**
 * Get a user-friendly display of the conversion for debugging/transparency
 */
export function getConversionExplanation(
  recipeQty: number,
  recipeUnit: string,
  ingredientUnit: string
): string | null {
  if (recipeUnit === ingredientUnit) return null;

  const converted = convertUnit(recipeQty, recipeUnit, ingredientUnit);
  if (converted === null) return null;

  return `${recipeQty} ${recipeUnit} = ${formatQuantity(converted, ingredientUnit)} ${ingredientUnit}`;
}
