/**
 * Nosh Run — Pure utility functions
 */

import { Platform } from "react-native";
import type { TieredIngredient, NoshBasket } from "../engines/tierEngine";

/**
 * Group tiered ingredients by supermarket aisle section.
 */
export function groupByAisle(
  items: TieredIngredient[],
): Record<string, TieredIngredient[]> {
  const groups: Record<string, TieredIngredient[]> = {};
  for (const item of items) {
    const section = item.ingredient.supermarket_section ?? "Other";
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }
  return groups;
}

/**
 * Build a Maps deep link for a store name.
 * iOS: maps://?q=...
 * Android: geo:0,0?q=...
 * Web: google maps URL
 */
export function buildMapsDeepLink(storeName: string): string {
  const q = encodeURIComponent(storeName);

  if (Platform.OS === "ios") {
    return `maps://?q=${q}`;
  }
  if (Platform.OS === "android") {
    return `geo:0,0?q=${q}`;
  }
  // Web fallback
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * Build a formatted text shopping list for clipboard.
 */
export function buildClipboardList(basket: NoshBasket): string {
  const lines: string[] = [];
  lines.push(`NOSH RUN -- ${basket.recipeTitle}`);
  lines.push("");

  const grouped = groupByAisle(basket.items);

  for (const [section, items] of Object.entries(grouped)) {
    lines.push(`── ${section.toUpperCase()} ──`);
    for (const item of items) {
      const selected = item.options.find((o) => o.tier === item.selectedTier);
      if (selected) {
        const qty = item.ingredient.quantity
          ? `${item.ingredient.quantity} ${item.ingredient.unit ?? ""}`.trim()
          : "";
        lines.push(
          `  ${item.ingredient.name}${qty ? ` (${qty})` : ""} — $${selected.price.toFixed(2)} from ${selected.source}`,
        );
      }
    }
    lines.push("");
  }

  lines.push(`Total: $${basket.totals.current.toFixed(2)}`);
  lines.push("");
  lines.push("Made with NOSH");

  return lines.join("\n");
}

/**
 * Build a Google search URL for online delivery ordering.
 */
export function buildDeliverySearchUrl(storeName: string): string {
  const q = encodeURIComponent(`${storeName} delivery order online`);
  return `https://www.google.com/search?q=${q}`;
}
