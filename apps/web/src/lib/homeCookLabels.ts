/**
 * Central label overrides for Home Cook mode.
 * Single source of truth — tweak the tone here, not across dozens of files.
 */

export const HOME_COOK_ROLE_LABELS: Record<string, string> = {
  head_chef: "Boss",
  owner: "Boss",
  line_chef: "Helper",
  sous_chef: "Helper",
  kitchen_hand: "Helper",
};

export const HOME_COOK_NAV_LABELS: Record<string, string> = {
  "Recipe Bank": "My Recipes",
  Ingredients: "My Pantry",
  Inventory: "My Stock",
  "Waste Log": "Waste Tracker",
  "Food Safety": "Safety Checks",
  Kitchen: "My Kitchen",
  "Prep Lists": "Prep",
  "Todo List": "My To-Do Command Portal",
};

export const HOME_COOK_PAGE_SUBTITLES: Record<string, string> = {
  inventory: "What's in your kitchen right now",
  "food-safety": "Quick safety checks for your kitchen",
  settings: "Make it yours",
};

/** Resolve a role string to its home-cook-friendly label */
export function homeCookRoleLabel(role: string): string {
  return HOME_COOK_ROLE_LABELS[role] || role;
}

/** Resolve a nav label for home cook mode */
export function homeCookNavLabel(label: string): string {
  return HOME_COOK_NAV_LABELS[label] || label;
}
