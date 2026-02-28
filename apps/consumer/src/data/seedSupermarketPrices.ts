/**
 * Seed supermarket prices for the Good / Better tiers.
 * Best tier comes from SEED_VENDORS.
 *
 * Good  = Aldi-level pricing
 * Better = Coles/Woolworths mid-range
 *
 * Covers all ingredients across the 15 seed recipes.
 */

export interface SupermarketPrice {
  ingredientKey: string;
  good: { source: string; price: number; unit: string };
  better?: { source: string; price: number; unit: string; tag?: string };
}

export const SUPERMARKET_PRICES: SupermarketPrice[] = [
  // ── Proteins ──────────────────────────────────────────────────────
  {
    ingredientKey: "chicken thigh",
    good: { source: "Aldi", price: 5.50, unit: "500g" },
    better: { source: "Coles", price: 7.50, unit: "500g", tag: "RSPCA approved" },
  },
  {
    ingredientKey: "chicken breast",
    good: { source: "Aldi", price: 5.99, unit: "500g" },
    better: { source: "Coles", price: 8.00, unit: "500g", tag: "free-range" },
  },
  {
    ingredientKey: "beef sirloin",
    good: { source: "Aldi", price: 14.99, unit: "500g" },
    better: { source: "Woolworths", price: 19.99, unit: "500g", tag: "grass-fed" },
  },
  {
    ingredientKey: "pork belly",
    good: { source: "Aldi", price: 8.99, unit: "500g" },
    better: { source: "Coles", price: 11.99, unit: "500g" },
  },
  {
    ingredientKey: "pork mince",
    good: { source: "Aldi", price: 5.50, unit: "500g" },
    better: { source: "Coles", price: 7.00, unit: "500g" },
  },
  {
    ingredientKey: "pork sausage",
    good: { source: "Aldi", price: 4.99, unit: "6 pack" },
    better: { source: "Coles", price: 7.50, unit: "6 pack", tag: "butcher style" },
  },
  {
    ingredientKey: "chorizo",
    good: { source: "Aldi", price: 4.49, unit: "200g" },
    better: { source: "Coles", price: 6.50, unit: "200g", tag: "Spanish style" },
  },
  {
    ingredientKey: "pancetta",
    good: { source: "Aldi", price: 3.99, unit: "100g" },
    better: { source: "Coles", price: 5.50, unit: "100g" },
  },
  {
    ingredientKey: "spam",
    good: { source: "Aldi", price: 3.50, unit: "340g" },
    better: { source: "Coles", price: 4.20, unit: "340g" },
  },

  // ── Vegetables ────────────────────────────────────────────────────
  {
    ingredientKey: "onion",
    good: { source: "Aldi", price: 1.20, unit: "each" },
    better: { source: "Coles", price: 1.50, unit: "each" },
  },
  {
    ingredientKey: "garlic",
    good: { source: "Aldi", price: 0.80, unit: "bulb" },
    better: { source: "Coles", price: 1.20, unit: "bulb" },
  },
  {
    ingredientKey: "ginger",
    good: { source: "Aldi", price: 0.60, unit: "thumb" },
    better: { source: "Coles", price: 0.90, unit: "thumb" },
  },
  {
    ingredientKey: "capsicum",
    good: { source: "Aldi", price: 1.50, unit: "each" },
    better: { source: "Woolworths", price: 2.00, unit: "each" },
  },
  {
    ingredientKey: "carrot",
    good: { source: "Aldi", price: 0.60, unit: "each" },
    better: { source: "Coles", price: 0.80, unit: "each" },
  },
  {
    ingredientKey: "potato",
    good: { source: "Aldi", price: 0.80, unit: "each" },
    better: { source: "Coles", price: 1.10, unit: "each" },
  },
  {
    ingredientKey: "tomato",
    good: { source: "Aldi", price: 0.70, unit: "each" },
    better: { source: "Coles", price: 1.00, unit: "each" },
  },
  {
    ingredientKey: "bean sprout",
    good: { source: "Aldi", price: 1.50, unit: "200g" },
    better: { source: "Woolworths", price: 2.00, unit: "200g" },
  },
  {
    ingredientKey: "spring onion",
    good: { source: "Aldi", price: 1.20, unit: "bunch" },
    better: { source: "Coles", price: 1.80, unit: "bunch" },
  },
  {
    ingredientKey: "mushroom",
    good: { source: "Aldi", price: 2.50, unit: "200g" },
    better: { source: "Coles", price: 3.50, unit: "200g" },
  },

  // ── Dairy ─────────────────────────────────────────────────────────
  {
    ingredientKey: "cream",
    good: { source: "Aldi", price: 2.29, unit: "300ml" },
    better: { source: "Coles", price: 3.00, unit: "300ml", tag: "pure cream" },
  },
  {
    ingredientKey: "butter",
    good: { source: "Aldi", price: 3.49, unit: "250g" },
    better: { source: "Coles", price: 4.50, unit: "250g", tag: "unsalted" },
  },
  {
    ingredientKey: "parmesan",
    good: { source: "Aldi", price: 4.99, unit: "100g" },
    better: { source: "Woolworths", price: 6.50, unit: "100g", tag: "imported" },
  },
  {
    ingredientKey: "cheddar",
    good: { source: "Aldi", price: 3.50, unit: "250g" },
    better: { source: "Coles", price: 5.00, unit: "250g", tag: "vintage" },
  },

  // ── Pantry / Tinned / Dried ───────────────────────────────────────
  {
    ingredientKey: "coconut milk",
    good: { source: "Aldi", price: 1.29, unit: "400ml" },
    better: { source: "Coles", price: 2.10, unit: "400ml", tag: "organic" },
  },
  {
    ingredientKey: "tinned tomato",
    good: { source: "Aldi", price: 0.89, unit: "400g" },
    better: { source: "Coles", price: 1.80, unit: "400g", tag: "Italian" },
  },
  {
    ingredientKey: "chickpea",
    good: { source: "Aldi", price: 0.89, unit: "400g" },
    better: { source: "Coles", price: 1.50, unit: "400g", tag: "organic" },
  },
  {
    ingredientKey: "jasmine rice",
    good: { source: "Aldi", price: 2.50, unit: "1kg" },
    better: { source: "SunRice", price: 3.20, unit: "1kg" },
  },
  {
    ingredientKey: "rice noodle",
    good: { source: "Aldi", price: 1.99, unit: "375g" },
    better: { source: "Coles", price: 2.80, unit: "375g" },
  },
  {
    ingredientKey: "pasta",
    good: { source: "Aldi", price: 0.99, unit: "500g" },
    better: { source: "Coles", price: 2.50, unit: "500g", tag: "bronze-cut" },
  },
  {
    ingredientKey: "ramen noodle",
    good: { source: "Aldi", price: 1.50, unit: "pack" },
    better: { source: "Woolworths", price: 2.50, unit: "pack" },
  },
  {
    ingredientKey: "macaroni",
    good: { source: "Aldi", price: 0.99, unit: "500g" },
    better: { source: "Coles", price: 2.00, unit: "500g" },
  },

  // ── Sauces & Pastes ──────────────────────────────────────────────
  {
    ingredientKey: "soy sauce",
    good: { source: "Aldi", price: 1.49, unit: "250ml" },
    better: { source: "Coles", price: 3.50, unit: "250ml", tag: "naturally brewed" },
  },
  {
    ingredientKey: "fish sauce",
    good: { source: "Aldi", price: 1.99, unit: "200ml" },
    better: { source: "Coles", price: 3.50, unit: "200ml" },
  },
  {
    ingredientKey: "green curry paste",
    good: { source: "Aldi", price: 1.49, unit: "jar" },
    better: { source: "Coles", price: 3.00, unit: "jar", tag: "Thai import" },
  },
  {
    ingredientKey: "doubanjiang",
    good: { source: "Asian Grocery", price: 2.99, unit: "250g" },
    better: { source: "Coles", price: 4.50, unit: "250g" },
  },
  {
    ingredientKey: "gochugaru",
    good: { source: "Asian Grocery", price: 3.99, unit: "100g" },
    better: { source: "Coles", price: 5.50, unit: "100g" },
  },
  {
    ingredientKey: "kimchi",
    good: { source: "Aldi", price: 3.49, unit: "400g" },
    better: { source: "Coles", price: 5.50, unit: "400g", tag: "authentic Korean" },
  },
  {
    ingredientKey: "gochujang",
    good: { source: "Asian Grocery", price: 3.49, unit: "200g" },
    better: { source: "Coles", price: 5.00, unit: "200g" },
  },

  // ── Spices ────────────────────────────────────────────────────────
  {
    ingredientKey: "garam masala",
    good: { source: "Aldi", price: 1.99, unit: "jar" },
    better: { source: "Coles", price: 3.50, unit: "jar" },
  },
  {
    ingredientKey: "cumin",
    good: { source: "Aldi", price: 1.49, unit: "jar" },
    better: { source: "Coles", price: 2.50, unit: "jar" },
  },
  {
    ingredientKey: "smoked paprika",
    good: { source: "Aldi", price: 1.49, unit: "jar" },
    better: { source: "Coles", price: 3.00, unit: "jar", tag: "Spanish" },
  },
  {
    ingredientKey: "sichuan peppercorn",
    good: { source: "Asian Grocery", price: 2.99, unit: "50g" },
    better: { source: "Woolworths", price: 4.50, unit: "50g" },
  },

  // ── Herbs ─────────────────────────────────────────────────────────
  {
    ingredientKey: "coriander",
    good: { source: "Aldi", price: 1.49, unit: "bunch" },
    better: { source: "Coles", price: 2.00, unit: "bunch" },
  },
  {
    ingredientKey: "thai basil",
    good: { source: "Asian Grocery", price: 1.99, unit: "bunch" },
    better: { source: "Woolworths", price: 3.00, unit: "bunch" },
  },
  {
    ingredientKey: "mint",
    good: { source: "Aldi", price: 1.49, unit: "bunch" },
    better: { source: "Coles", price: 2.00, unit: "bunch" },
  },
  {
    ingredientKey: "basil",
    good: { source: "Aldi", price: 1.49, unit: "bunch" },
    better: { source: "Coles", price: 2.00, unit: "bunch" },
  },
];
