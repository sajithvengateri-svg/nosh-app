/**
 * Shared constants — pure data, no web APIs
 */

import type { AllergenInfo } from '../types/menu.types';

// Re-export the ALLERGENS array from types so it's accessible from utils too
export { ALLERGENS } from '../types/menu.types';

// Target constants (stubs)
export const GP_TARGETS = {
  food: 30,
  beverage: 20,
  labour: 35,
} as const;

export const LABOUR_TARGETS = {
  labourCostPercent: 35,
  maxOvertimePercent: 10,
} as const;
