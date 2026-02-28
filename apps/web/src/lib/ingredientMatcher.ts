// Backwards compatibility — re-export everything from shared
export {
  normalizeIngredientName,
  calculateSimilarity,
  findSimilarIngredients,
  inferCategory,
  inferUnit,
} from '@/lib/shared/utils/ingredientMatcher';
export type { IngredientMatch } from '@/lib/shared/utils/ingredientMatcher';
