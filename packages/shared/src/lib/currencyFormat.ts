import { REGIONS } from "./variantRegistry.ts";

// ── Currency symbol map (superset of REGIONS for DB-stored currency codes) ──

const CURRENCY_SYMBOLS: Record<string, string> = {
  aud: "$",
  inr: "₹",
  aed: "د.إ",
  gbp: "£",
  sgd: "S$",
  usd: "$",
};

/**
 * Returns the symbol for a currency code (case-insensitive).
 * Falls back to "CODE " if unknown.
 */
export function currencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toLowerCase()] ?? currencyCode.toUpperCase() + " ";
}

/**
 * Format a numeric amount with the correct currency symbol.
 *
 * @param amount   - the number to format (e.g. 29.99)
 * @param currency - ISO currency code ("gbp", "AUD", etc.) OR a region key ("uk", "in")
 * @param decimals - decimal places (default 2)
 *
 * Usage:
 *   formatCurrency(29.99, "gbp")   → "£29.99"
 *   formatCurrency(1500, "inr")     → "₹1500.00"
 *   formatCurrency(120, "aed")      → "د.إ120.00"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string,
  decimals = 2,
): string {
  if (amount == null) return "";
  // If caller passed a region key, resolve to currency code
  const region = REGIONS[currency.toLowerCase()];
  const code = region ? region.currency : currency;
  const sym = currencySymbol(code);
  return `${sym}${amount.toFixed(decimals)}`;
}

/**
 * Get the currency symbol for a region key (au, in, uae, uk, sg, us).
 */
export function regionCurrencySymbol(regionKey: string): string {
  const region = REGIONS[regionKey.toLowerCase()];
  if (!region) return "$";
  return region.currencySymbol;
}

/**
 * Get the ISO currency code for a region key.
 */
export function regionCurrencyCode(regionKey: string): string {
  const region = REGIONS[regionKey.toLowerCase()];
  if (!region) return "USD";
  return region.currency;
}
