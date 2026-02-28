// Barrel export for shared utils
export { convertUnit, calculateIngredientCost, getUnitType, areUnitsCompatible } from './unitConversion';
export type { Unit } from './unitConversion';
export { formatQuantity, getConversionExplanation } from './formatters';
export { normalizeIngredientName, calculateSimilarity, findSimilarIngredients, inferCategory, inferUnit } from './ingredientMatcher';
export type { IngredientMatch } from './ingredientMatcher';
export { ALLERGENS, GP_TARGETS, LABOUR_TARGETS } from './constants';
export { canTakeOrders, canProcessPayments, canApplyDiscount, canVoid, canRefund, canOpenDrawer, canViewDashboard, canManageMenu, canManageStaff, canViewAudit, canEditSettings, canManageFunctions } from './posPermissions';
