// Backwards compatibility — re-export everything from shared
export { convertUnit, calculateIngredientCost, getUnitType, areUnitsCompatible } from '@/lib/shared/utils/unitConversion';
export type { Unit } from '@/lib/shared/utils/unitConversion';
export { formatQuantity, getConversionExplanation } from '@/lib/shared/utils/formatters';
