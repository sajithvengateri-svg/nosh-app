/**
 * Menu engineering classification (Boston Matrix / Star-Dog model)
 * Pure functions — no web APIs, no side effects
 */

export type Profitability = 'star' | 'plow-horse' | 'puzzle' | 'dog';

/**
 * Classify a menu item into the BCG-style profitability quadrant
 *
 * @param popularity - Item's popularity metric (e.g. units sold)
 * @param contributionMargin - Item's contribution margin (sell price − food cost)
 * @param avgPopularity - Average popularity across the menu
 * @param avgMargin - Average contribution margin across the menu
 */
export const getItemProfitability = (
  popularity: number,
  contributionMargin: number,
  avgPopularity: number,
  avgMargin: number
): Profitability => {
  const isHighPopularity = popularity >= avgPopularity;
  const isHighMargin = contributionMargin >= avgMargin;

  if (isHighPopularity && isHighMargin) return 'star';
  if (isHighPopularity && !isHighMargin) return 'plow-horse';
  if (!isHighPopularity && isHighMargin) return 'puzzle';
  return 'dog';
};
