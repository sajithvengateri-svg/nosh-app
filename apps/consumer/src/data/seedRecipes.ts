/**
 * Seed recipes for development / demo.
 * 15 one-pot recipes across 11 cuisines.
 * Each: 1 vessel, 6 workflow cards, 10-12 ingredients
 * (1-2 protein, 3-4 veg, 2 sauce, 2 spice, 2 herbs)
 */

import type { Recipe, RecipeIngredient, WorkflowCard } from "../lib/stores/recipeStore";
import { generatePersonalityTags } from "../lib/engines/personalityEngine";

// ── Helpers ────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `seed-${++_id}`;

function ing(
  recipeId: string,
  order: number,
  name: string,
  qty: number,
  unit: string,
  section: string,
  staple = false,
  cost = 1.5,
): RecipeIngredient {
  return {
    id: uid(),
    recipe_id: recipeId,
    sort_order: order,
    name,
    quantity: qty,
    unit,
    supermarket_section: section,
    is_pantry_staple: staple,
    estimated_cost: cost,
  };
}

interface CardExtras {
  card_type?: WorkflowCard["card_type"];
  heat_level?: number;
  technique_icon?: string;
  ingredients_used?: { name: string; qty?: string; action?: string }[];
  pro_tip?: string;
}

function card(
  recipeId: string,
  num: number,
  title: string,
  instructions: string[],
  timer?: number,
  marker?: string,
  parallel?: string,
  extras?: CardExtras,
): WorkflowCard {
  return {
    id: uid(),
    recipe_id: recipeId,
    card_number: num,
    title,
    instructions,
    timer_seconds: timer,
    success_marker: marker,
    parallel_task: parallel,
    ...extras,
  };
}

function recipe(
  partial: Omit<Recipe, "id" | "slug" | "likes_count" | "cooked_count" | "avg_rating" | "is_published" | "source_type">,
): Recipe {
  const id = uid();
  return {
    id,
    slug: partial.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    likes_count: Math.floor(Math.random() * 80) + 10,
    cooked_count: Math.floor(Math.random() * 120) + 5,
    avg_rating: +(3.5 + Math.random() * 1.5).toFixed(1),
    is_published: true,
    source_type: "seed",
    ...partial,
  };
}

// ── Recipes ────────────────────────────────────────────────────────

export const SEED_RECIPES: Recipe[] = [];

// ─── 1. Indian — Butter Chicken ────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "One-Pot Butter Chicken",
    description: "Rich, creamy tomato-based curry with tender chicken thighs. Restaurant-quality in one pot.",
    vessel: "pot",
    cuisine: "Indian",
    total_time_minutes: 35,
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    serves: 4,
    cost_per_serve: 4.5,
    difficulty: 2,
    spice_level: 2,
    adventure_level: 1,
    dietary_tags: ["gluten-free"],
    season_tags: ["all-year"],
    tips: ["Use full-fat cream for richest sauce", "Toast garam masala in dry pan first for deeper flavour"],
    storage_notes: "Fridge 3 days. Freezes well for 3 months.",
    leftover_ideas: ["Butter chicken toastie", "Over chips for loaded fries"],
    ingredients: [
      ing(id, 1, "chicken thighs", 600, "g", "meat", false, 6),
      ing(id, 2, "onion", 2, "large", "produce", false, 1),
      ing(id, 3, "garlic", 4, "cloves", "produce", true, 0.5),
      ing(id, 4, "tinned tomatoes", 400, "g", "tinned", true, 1),
      ing(id, 5, "cream", 200, "ml", "dairy", false, 2),
      ing(id, 6, "butter", 40, "g", "dairy", true, 0.8),
      ing(id, 7, "garam masala", 2, "tbsp", "spices", true, 0.3),
      ing(id, 8, "turmeric", 1, "tsp", "spices", true, 0.2),
      ing(id, 9, "fresh coriander", 1, "bunch", "herbs", false, 1.5),
      ing(id, 10, "fresh ginger", 1, "thumb", "produce", false, 0.5),
      ing(id, 11, "kasuri methi", 1, "tbsp", "spices", false, 0.5),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Dice onion, mince garlic, grate ginger", "Cut chicken into bite-sized pieces", "Roughly chop coriander stems and leaves separately"], undefined, "Prep board full, chicken cubed", undefined, {
        card_type: "prep", ingredients_used: [
          { name: "onion", qty: "2 large", action: "diced" },
          { name: "garlic", qty: "4 cloves", action: "minced" },
          { name: "ginger", qty: "1 thumb", action: "grated" },
          { name: "chicken thighs", qty: "600g", action: "cubed" },
          { name: "coriander", qty: "1 bunch", action: "chopped" },
        ],
      }),
      card(id, 2, "SEAR", ["Melt butter in pot over high heat", "Brown chicken pieces 2 mins each side", "Remove chicken, set aside"], 240, "Golden colour on chicken", undefined, {
        card_type: "technique", heat_level: 3, technique_icon: "flame",
        ingredients_used: [{ name: "butter", qty: "40g" }, { name: "chicken", action: "browning" }],
        pro_tip: "Don't move the chicken for 2 full minutes — that's how you get the golden crust.",
      }),
      card(id, 3, "BUILD BASE", ["Same pot — fry onion until soft (4 min)", "Add garlic, ginger, garam masala, turmeric", "Stir 1 minute until fragrant"], 300, "Kitchen smells incredible", undefined, {
        card_type: "technique", heat_level: 2,
        ingredients_used: [
          { name: "onion", action: "softening" },
          { name: "garam masala", qty: "2 tbsp" },
          { name: "turmeric", qty: "1 tsp" },
        ],
      }),
      card(id, 4, "SIMMER", ["Pour in tinned tomatoes, stir well", "Return chicken to pot", "Lid on, simmer 15 minutes"], 900, "Sauce thickened, chicken cooked through", undefined, {
        card_type: "simmer", heat_level: 1,
        ingredients_used: [{ name: "tinned tomatoes", qty: "400g" }],
        pro_tip: "Use full-fat cream for the richest sauce.",
      }),
      card(id, 5, "FINISH", ["Stir in cream and kasuri methi", "Simmer uncovered 3 more minutes", "Season with salt to taste"], 180, "Rich orange, glossy sauce", undefined, {
        card_type: "finish", heat_level: 1,
        ingredients_used: [
          { name: "cream", qty: "200ml" },
          { name: "kasuri methi", qty: "1 tbsp" },
        ],
      }),
      card(id, 6, "SERVE", ["Scatter fresh coriander leaves", "Serve over basmati rice or with naan", "Squeeze of lemon if you like"], undefined, "Dinner. Sorted.", undefined, {
        card_type: "serve",
        ingredients_used: [{ name: "coriander", action: "garnish" }],
      }),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 2. Indian — Chana Masala ──────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Chana Masala",
    description: "Hearty spiced chickpea curry. Vegan comfort in a single pot — done in 25 minutes.",
    vessel: "pot",
    cuisine: "Indian",
    total_time_minutes: 25,
    prep_time_minutes: 5,
    cook_time_minutes: 20,
    serves: 4,
    cost_per_serve: 2.5,
    difficulty: 1,
    spice_level: 2,
    adventure_level: 1,
    dietary_tags: ["vegan", "gluten-free"],
    season_tags: ["all-year"],
    tips: ["Crushing some chickpeas thickens the sauce naturally"],
    storage_notes: "Fridge 4 days. Freezes 3 months.",
    leftover_ideas: ["Chana wrap", "Cold chana salad"],
    ingredients: [
      ing(id, 1, "chickpeas", 2, "tins", "tinned", false, 2),
      ing(id, 2, "onion", 1, "large", "produce", false, 0.5),
      ing(id, 3, "tinned tomatoes", 400, "g", "tinned", true, 1),
      ing(id, 4, "garlic", 3, "cloves", "produce", true, 0.3),
      ing(id, 5, "fresh ginger", 1, "thumb", "produce", false, 0.5),
      ing(id, 6, "cumin seeds", 1, "tsp", "spices", true, 0.2),
      ing(id, 7, "coriander powder", 2, "tsp", "spices", true, 0.2),
      ing(id, 8, "lemon", 1, "whole", "produce", false, 0.5),
      ing(id, 9, "fresh coriander", 1, "bunch", "herbs", false, 1.5),
      ing(id, 10, "green chilli", 1, "whole", "produce", false, 0.3),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Dice onion, mince garlic, grate ginger", "Drain and rinse chickpeas", "Slit green chilli lengthways"], undefined, "Everything chopped", undefined, {
        card_type: "prep", ingredients_used: [
          { name: "onion", qty: "1 large", action: "diced" }, { name: "garlic", qty: "3 cloves", action: "minced" },
          { name: "chickpeas", qty: "2 tins", action: "drained" }, { name: "green chilli", qty: "1", action: "slit" },
        ],
      }),
      card(id, 2, "TOAST SPICES", ["Heat oil in pot over medium heat", "Add cumin seeds — let them crackle 30s", "Add onion, cook until golden (5 min)"], 330, "Cumin crackling, onion softened", undefined, {
        card_type: "technique", heat_level: 2, technique_icon: "leaf",
        ingredients_used: [{ name: "cumin seeds", qty: "1 tsp" }],
        pro_tip: "Cumin seeds should crackle and pop — that means the oil is hot enough.",
      }),
      card(id, 3, "AROMATICS", ["Add garlic, ginger, green chilli", "Stir in coriander powder", "Cook 1 minute until fragrant"], 60, "Fragrant base", undefined, {
        card_type: "technique", heat_level: 2,
        ingredients_used: [{ name: "coriander powder", qty: "2 tsp" }, { name: "ginger", action: "grated" }],
      }),
      card(id, 4, "SIMMER", ["Add tinned tomatoes, stir", "Add chickpeas, 1/2 cup water", "Lid on, simmer 15 minutes"], 900, "Sauce thick, chickpeas tender", undefined, {
        card_type: "simmer", heat_level: 1,
        ingredients_used: [{ name: "tinned tomatoes", qty: "400g" }, { name: "chickpeas" }],
      }),
      card(id, 5, "CRUSH & SEASON", ["Mash a few chickpeas with back of spoon to thicken", "Squeeze in lemon juice", "Season with salt"], undefined, "Thick, saucy consistency", undefined, {
        card_type: "finish",
        ingredients_used: [{ name: "lemon", qty: "1", action: "juiced" }],
        pro_tip: "Crushing chickpeas thickens the sauce naturally — no cream needed.",
      }),
      card(id, 6, "SERVE", ["Top with fresh coriander", "Serve with rice or roti", "Extra lemon wedge on the side"], undefined, "Dinner. Sorted.", undefined, {
        card_type: "serve", ingredients_used: [{ name: "coriander", action: "garnish" }],
      }),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 3. Italian — One-Pot Pasta e Fagioli ──────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Pasta e Fagioli",
    description: "Rustic Italian bean and pasta soup. One pot, ten ingredients, pure comfort.",
    vessel: "pot",
    cuisine: "Italian",
    total_time_minutes: 30,
    prep_time_minutes: 8,
    cook_time_minutes: 22,
    serves: 4,
    cost_per_serve: 3,
    difficulty: 1,
    spice_level: 1,
    adventure_level: 1,
    dietary_tags: [],
    season_tags: ["autumn", "winter"],
    tips: ["Parmesan rind in the broth adds umami depth", "Use small pasta shapes — ditalini or macaroni"],
    storage_notes: "Fridge 3 days. Pasta absorbs liquid overnight — add water when reheating.",
    leftover_ideas: ["Thickens into stew — serve with crusty bread"],
    ingredients: [
      ing(id, 1, "pancetta", 100, "g", "deli", false, 3),
      ing(id, 2, "cannellini beans", 400, "g", "tinned", false, 1.5),
      ing(id, 3, "ditalini pasta", 200, "g", "pasta", false, 1.5),
      ing(id, 4, "onion", 1, "medium", "produce", false, 0.5),
      ing(id, 5, "carrot", 1, "medium", "produce", false, 0.3),
      ing(id, 6, "celery", 2, "stalks", "produce", false, 0.5),
      ing(id, 7, "tinned tomatoes", 400, "g", "tinned", true, 1),
      ing(id, 8, "chicken stock", 1, "L", "tinned", true, 1),
      ing(id, 9, "dried oregano", 1, "tsp", "spices", true, 0.2),
      ing(id, 10, "chilli flakes", 0.5, "tsp", "spices", true, 0.1),
      ing(id, 11, "fresh basil", 1, "bunch", "herbs", false, 1.5),
      ing(id, 12, "parmesan", 40, "g", "dairy", false, 2),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Dice onion, carrot, celery finely (soffritto)", "Slice pancetta into small pieces", "Drain and rinse beans"], undefined, "Soffritto diced, pancetta sliced", undefined, {
        card_type: "prep", ingredients_used: [
          { name: "onion", qty: "1", action: "diced" }, { name: "carrot", qty: "1", action: "diced" },
          { name: "celery", qty: "2 stalks", action: "diced" }, { name: "pancetta", qty: "100g", action: "sliced" },
        ],
      }),
      card(id, 2, "RENDER", ["Fry pancetta in pot until crispy (3 min)", "Add soffritto vegetables", "Cook 5 minutes until soft"], 480, "Pancetta crispy, veg softened", undefined, {
        card_type: "technique", heat_level: 2, technique_icon: "beef",
        ingredients_used: [{ name: "pancetta", action: "rendering" }],
        pro_tip: "Parmesan rind in the broth adds umami depth — throw one in if you have it.",
      }),
      card(id, 3, "BUILD BROTH", ["Add tinned tomatoes, stock, oregano, chilli flakes", "Bring to a boil", "Add pasta and beans"], undefined, "Rolling boil", undefined, {
        card_type: "technique", heat_level: 3,
        ingredients_used: [
          { name: "tinned tomatoes", qty: "400g" }, { name: "stock", qty: "1L" },
          { name: "ditalini", qty: "200g" }, { name: "beans", qty: "400g" },
        ],
      }),
      card(id, 4, "SIMMER", ["Reduce heat, simmer 12 minutes", "Stir occasionally to prevent sticking", "Pasta should be al dente"], 720, "Pasta cooked, broth thickened", undefined, {
        card_type: "simmer", heat_level: 1,
      }),
      card(id, 5, "SEASON", ["Taste and season with salt and pepper", "Stir in half the parmesan", "Let rest 2 minutes off heat"], 120, "Rich, thick stew-soup", undefined, {
        card_type: "finish", ingredients_used: [{ name: "parmesan", qty: "20g", action: "stirred in" }],
      }),
      card(id, 6, "SERVE", ["Ladle into bowls", "Top with fresh basil and remaining parmesan", "Drizzle of olive oil"], undefined, "Dinner. Sorted.", undefined, {
        card_type: "serve", ingredients_used: [{ name: "basil", action: "garnish" }, { name: "parmesan", action: "garnish" }],
      }),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 4. Italian — Risotto al Limone ────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Lemon Risotto",
    description: "Bright, creamy lemon risotto with parmesan and herbs. One pot, no fuss.",
    vessel: "pot",
    cuisine: "Italian",
    total_time_minutes: 30,
    prep_time_minutes: 5,
    cook_time_minutes: 25,
    serves: 4,
    cost_per_serve: 3,
    difficulty: 2,
    spice_level: 1,
    adventure_level: 1,
    dietary_tags: ["vegetarian", "gluten-free"],
    season_tags: ["spring", "summer"],
    tips: ["Keep stock warm — cold stock shocks the rice and slows cooking"],
    storage_notes: "Best eaten fresh. Reheat with splash of stock.",
    leftover_ideas: ["Arancini balls — roll cold risotto, bread, and fry"],
    ingredients: [
      ing(id, 1, "arborio rice", 300, "g", "rice", false, 2),
      ing(id, 2, "vegetable stock", 1, "L", "tinned", true, 1),
      ing(id, 3, "lemon", 2, "whole", "produce", false, 1),
      ing(id, 4, "shallot", 2, "medium", "produce", false, 1),
      ing(id, 5, "garlic", 2, "cloves", "produce", true, 0.3),
      ing(id, 6, "white wine", 100, "ml", "alcohol", false, 2),
      ing(id, 7, "parmesan", 60, "g", "dairy", false, 3),
      ing(id, 8, "butter", 30, "g", "dairy", true, 0.5),
      ing(id, 9, "black pepper", 1, "tsp", "spices", true, 0.1),
      ing(id, 10, "fresh thyme", 4, "sprigs", "herbs", false, 1),
      ing(id, 11, "fresh parsley", 1, "handful", "herbs", false, 1),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Finely dice shallots and garlic", "Zest both lemons, juice one", "Grate parmesan, pick thyme leaves"], undefined, "Zest, juice, and veg ready"),
      card(id, 2, "SWEAT", ["Melt butter in pot over medium heat", "Soften shallots and garlic (3 min)", "Add thyme leaves"], 180, "Shallots translucent"),
      card(id, 3, "TOAST RICE", ["Add arborio rice, stir 2 minutes", "Pour in white wine, stir until absorbed", "Rice grains should look glossy"], 120, "Wine absorbed, rice glossy"),
      card(id, 4, "SIMMER", ["Add stock one ladle at a time, stirring", "Wait until each ladle absorbs before adding next", "Continue for 18 minutes"], 1080, "Rice creamy and al dente"),
      card(id, 5, "FINISH", ["Remove from heat", "Stir in lemon zest, juice, and parmesan", "Season with black pepper and salt"], undefined, "Bright, creamy, glossy"),
      card(id, 6, "SERVE", ["Plate immediately — risotto waits for no one", "Top with parsley and extra parmesan", "Lemon wedge on the side"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 5. Mexican — One-Pot Chicken Burrito Bowl ─────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Chicken Burrito Bowl",
    description: "Spiced chicken with rice, beans, and all the fixings — cooked in one pot.",
    vessel: "pot",
    cuisine: "Mexican",
    total_time_minutes: 30,
    prep_time_minutes: 8,
    cook_time_minutes: 22,
    serves: 4,
    cost_per_serve: 4,
    difficulty: 1,
    spice_level: 2,
    adventure_level: 1,
    dietary_tags: ["gluten-free"],
    season_tags: ["all-year"],
    tips: ["Char some corn in a dry pan for extra smokiness"],
    storage_notes: "Fridge 3 days. Rice reheats well with a splash of water.",
    leftover_ideas: ["Wrap in a tortilla", "Cold burrito salad"],
    ingredients: [
      ing(id, 1, "chicken thighs", 500, "g", "meat", false, 5),
      ing(id, 2, "long grain rice", 300, "g", "rice", false, 1.5),
      ing(id, 3, "black beans", 400, "g", "tinned", false, 1),
      ing(id, 4, "capsicum", 1, "large", "produce", false, 1.5),
      ing(id, 5, "corn kernels", 150, "g", "frozen", false, 1),
      ing(id, 6, "tomato passata", 200, "ml", "tinned", true, 1),
      ing(id, 7, "lime", 2, "whole", "produce", false, 0.8),
      ing(id, 8, "cumin", 2, "tsp", "spices", true, 0.2),
      ing(id, 9, "smoked paprika", 1, "tsp", "spices", true, 0.2),
      ing(id, 10, "fresh coriander", 1, "bunch", "herbs", false, 1.5),
      ing(id, 11, "garlic", 3, "cloves", "produce", true, 0.3),
      ing(id, 12, "sour cream", 100, "g", "dairy", false, 2),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Dice capsicum, mince garlic", "Drain and rinse black beans", "Season chicken with cumin, smoked paprika, salt"], undefined, "Chicken seasoned, veg prepped"),
      card(id, 2, "SEAR", ["Heat oil in pot over high heat", "Brown chicken 3 mins each side", "Remove and roughly chop"], 360, "Golden crust on chicken"),
      card(id, 3, "BUILD", ["Same pot — fry capsicum and garlic 2 min", "Add rice, stir to coat in oil", "Pour in passata + 500ml water"], undefined, "Rice coated, liquid in"),
      card(id, 4, "SIMMER", ["Return chicken to pot", "Add black beans and corn", "Lid on, cook 18 minutes on low"], 1080, "Rice fluffy, liquid absorbed"),
      card(id, 5, "FLUFF", ["Remove lid, fluff rice with fork", "Squeeze in lime juice", "Chop coriander"], undefined, "Fluffy, fragrant rice"),
      card(id, 6, "SERVE", ["Bowl up with sour cream on top", "Scatter coriander", "Extra lime wedge"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 6. Mexican — Pozole Rojo ──────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Pozole Rojo",
    description: "Mexican pork and hominy stew with dried chilli broth. Deeply flavoured, seriously satisfying.",
    vessel: "pot",
    cuisine: "Mexican",
    total_time_minutes: 40,
    prep_time_minutes: 10,
    cook_time_minutes: 30,
    serves: 4,
    cost_per_serve: 4.5,
    difficulty: 2,
    spice_level: 3,
    adventure_level: 3,
    dietary_tags: ["gluten-free", "dairy-free"],
    season_tags: ["winter", "autumn"],
    tips: ["Dried ancho chillies give deep smoky flavour without crazy heat"],
    storage_notes: "Fridge 4 days, freezes 3 months. Better the next day.",
    leftover_ideas: ["Pozole tacos with shredded pork"],
    ingredients: [
      ing(id, 1, "pork shoulder", 500, "g", "meat", false, 6),
      ing(id, 2, "hominy", 400, "g", "tinned", false, 2),
      ing(id, 3, "dried ancho chilli", 3, "whole", "international", false, 2),
      ing(id, 4, "onion", 1, "large", "produce", false, 0.5),
      ing(id, 5, "garlic", 4, "cloves", "produce", true, 0.3),
      ing(id, 6, "chicken stock", 1, "L", "tinned", true, 1),
      ing(id, 7, "cumin", 1, "tsp", "spices", true, 0.2),
      ing(id, 8, "oregano (Mexican)", 1, "tsp", "spices", false, 0.5),
      ing(id, 9, "cabbage", 0.25, "head", "produce", false, 1),
      ing(id, 10, "radish", 4, "whole", "produce", false, 1),
      ing(id, 11, "lime", 2, "whole", "produce", false, 0.8),
      ing(id, 12, "fresh coriander", 1, "bunch", "herbs", false, 1.5),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Cut pork into 3cm chunks", "Halve onion, crush garlic", "Shred cabbage, slice radishes for garnish"], undefined, "Pork cubed, garnish ready"),
      card(id, 2, "TOAST CHILLIES", ["Remove stems and seeds from dried chillies", "Toast in dry pot 1 min each side", "Cover with boiling water, soak 10 min"], 600, "Chillies softened, deep red water", "Sear pork while chillies soak"),
      card(id, 3, "SEAR & BLEND", ["Brown pork in pot with oil (5 min)", "Blend soaked chillies with their water into paste", "Add chilli paste to pork with garlic"], 300, "Rich red paste coating pork"),
      card(id, 4, "SIMMER", ["Add stock, cumin, oregano, onion", "Add drained hominy", "Simmer 25 minutes, lid on"], 1500, "Pork tender, broth rich and red"),
      card(id, 5, "SEASON", ["Taste — add salt, squeeze of lime", "Shred any large pork pieces with forks", "Remove onion halves"], undefined, "Rich, deep, smoky broth"),
      card(id, 6, "SERVE", ["Ladle into deep bowls", "Top with shredded cabbage, radish, coriander", "Lime wedges on the side"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 7. American — One-Pot Mac & Cheese ────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "One-Pot Mac & Cheese",
    description: "Creamy stovetop mac and cheese — no baking, no draining, one pot. Ready in 20.",
    vessel: "pot",
    cuisine: "American",
    total_time_minutes: 20,
    prep_time_minutes: 3,
    cook_time_minutes: 17,
    serves: 4,
    cost_per_serve: 2.5,
    difficulty: 1,
    spice_level: 1,
    adventure_level: 1,
    dietary_tags: ["vegetarian"],
    season_tags: ["all-year"],
    tips: ["Low heat once cheese goes in — high heat makes it grainy"],
    storage_notes: "Fridge 3 days. Add splash of milk when reheating.",
    leftover_ideas: ["Mac & cheese toastie", "Fried mac bites"],
    ingredients: [
      ing(id, 1, "elbow macaroni", 400, "g", "pasta", false, 1.5),
      ing(id, 2, "milk", 600, "ml", "dairy", false, 1.5),
      ing(id, 3, "cheddar", 200, "g", "dairy", false, 4),
      ing(id, 4, "cream cheese", 60, "g", "dairy", false, 1.5),
      ing(id, 5, "butter", 30, "g", "dairy", true, 0.5),
      ing(id, 6, "garlic powder", 1, "tsp", "spices", true, 0.2),
      ing(id, 7, "mustard powder", 0.5, "tsp", "spices", true, 0.2),
      ing(id, 8, "spring onion", 3, "stalks", "produce", false, 0.5),
      ing(id, 9, "smoked paprika", 0.5, "tsp", "spices", true, 0.2),
      ing(id, 10, "fresh chives", 1, "bunch", "herbs", false, 1),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Grate cheddar", "Slice spring onions (white and green parts separate)", "Chop chives"], undefined, "Cheese grated, onions sliced"),
      card(id, 2, "COOK PASTA", ["Combine macaroni, milk, 400ml water, butter in pot", "Bring to a boil, stirring often", "Reduce heat, simmer 10 min, stirring every 2 min"], 600, "Pasta al dente, liquid mostly absorbed"),
      card(id, 3, "MELT CHEESE", ["Remove from heat", "Stir in cheddar, cream cheese, garlic powder, mustard powder", "Stir until smooth and glossy"], undefined, "Velvety, no lumps"),
      card(id, 4, "SEASON", ["Add spring onion whites", "Season with salt, pepper, smoked paprika", "Let sit 2 minutes to thicken"], 120, "Thick, creamy, cheesy"),
      card(id, 5, "TASTE", ["Taste and adjust — more salt? More pepper?", "Add a splash of milk if too thick", "It'll thicken more as it cools"], undefined, "Perfect consistency"),
      card(id, 6, "SERVE", ["Scoop into bowls", "Top with chives and spring onion greens", "Crack of black pepper"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 8. English — Sausage & Bean Stew ──────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Sausage & Bean Stew",
    description: "Hearty British banger stew with beans, root veg, and a mustardy broth.",
    vessel: "pot",
    cuisine: "English",
    total_time_minutes: 35,
    prep_time_minutes: 8,
    cook_time_minutes: 27,
    serves: 4,
    cost_per_serve: 3.5,
    difficulty: 1,
    spice_level: 1,
    adventure_level: 1,
    dietary_tags: [],
    season_tags: ["autumn", "winter"],
    tips: ["Brown the sausages well — that's where the flavour lives"],
    storage_notes: "Fridge 4 days. Freezes 3 months. Reheat gently.",
    leftover_ideas: ["Pie filling with puff pastry lid", "On toast"],
    ingredients: [
      ing(id, 1, "pork sausages", 6, "whole", "meat", false, 4),
      ing(id, 2, "cannellini beans", 400, "g", "tinned", false, 1.5),
      ing(id, 3, "carrot", 2, "medium", "produce", false, 0.5),
      ing(id, 4, "potato", 2, "medium", "produce", false, 1),
      ing(id, 5, "onion", 1, "large", "produce", false, 0.5),
      ing(id, 6, "chicken stock", 500, "ml", "tinned", true, 0.5),
      ing(id, 7, "wholegrain mustard", 2, "tbsp", "condiments", false, 1),
      ing(id, 8, "worcestershire sauce", 1, "tbsp", "condiments", true, 0.3),
      ing(id, 9, "dried thyme", 1, "tsp", "spices", true, 0.2),
      ing(id, 10, "bay leaf", 2, "whole", "spices", true, 0.1),
      ing(id, 11, "fresh parsley", 1, "handful", "herbs", false, 1),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Peel and dice carrot and potato", "Dice onion", "Drain beans"], undefined, "Veg diced, beans ready"),
      card(id, 2, "BROWN", ["Brown sausages in pot (4 min, turning)", "Remove sausages, slice into chunks", "Keep the fat in the pot"], 240, "Sausages golden all over"),
      card(id, 3, "SWEAT VEG", ["Fry onion in sausage fat (3 min)", "Add carrot, potato, thyme, bay leaf", "Cook 2 minutes"], 300, "Onion softened"),
      card(id, 4, "SIMMER", ["Return sausage chunks to pot", "Add stock, mustard, worcestershire", "Add beans, lid on, simmer 20 min"], 1200, "Potatoes tender, broth thick"),
      card(id, 5, "FINISH", ["Remove bay leaves", "Taste and season with salt and pepper", "Mash a few potatoes against side for thickness"], undefined, "Thick, hearty stew"),
      card(id, 6, "SERVE", ["Ladle into deep bowls", "Scatter fresh parsley", "Crusty bread on the side"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 9. Spanish — Chicken & Chorizo Stew ───────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Chicken & Chorizo Stew",
    description: "Spanish-inspired one-pot with smoky chorizo, tender chicken, and butter beans.",
    vessel: "pot",
    cuisine: "Spanish",
    total_time_minutes: 35,
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    serves: 4,
    cost_per_serve: 4.5,
    difficulty: 2,
    spice_level: 2,
    adventure_level: 2,
    dietary_tags: ["gluten-free"],
    season_tags: ["autumn", "winter"],
    tips: ["Let the chorizo oil render out — it flavours the entire dish"],
    storage_notes: "Fridge 3 days, freezes well.",
    leftover_ideas: ["Stew over crusty bread", "Fill empanadas"],
    ingredients: [
      ing(id, 1, "chicken thighs", 500, "g", "meat", false, 5),
      ing(id, 2, "chorizo", 150, "g", "deli", false, 3),
      ing(id, 3, "butter beans", 400, "g", "tinned", false, 1.5),
      ing(id, 4, "capsicum", 1, "large", "produce", false, 1.5),
      ing(id, 5, "onion", 1, "medium", "produce", false, 0.5),
      ing(id, 6, "garlic", 3, "cloves", "produce", true, 0.3),
      ing(id, 7, "tinned tomatoes", 400, "g", "tinned", true, 1),
      ing(id, 8, "smoked paprika", 2, "tsp", "spices", true, 0.3),
      ing(id, 9, "cumin", 1, "tsp", "spices", true, 0.2),
      ing(id, 10, "fresh parsley", 1, "bunch", "herbs", false, 1.5),
      ing(id, 11, "lemon", 1, "whole", "produce", false, 0.5),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Slice chorizo into coins", "Dice capsicum and onion", "Cut chicken into large pieces"], undefined, "Everything chopped"),
      card(id, 2, "RENDER", ["Fry chorizo coins in pot until oils release (3 min)", "Remove chorizo, keep the red oil", "Brown chicken in chorizo oil, 3 min per side"], 360, "Chorizo crisp, chicken golden"),
      card(id, 3, "BUILD", ["Remove chicken, soften onion and capsicum (4 min)", "Add garlic, paprika, cumin — stir 1 min", "Pour in tinned tomatoes"], 300, "Smoky, red base"),
      card(id, 4, "SIMMER", ["Return chicken and chorizo", "Add drained butter beans", "Lid on, simmer 18 minutes"], 1080, "Chicken cooked through, beans soft"),
      card(id, 5, "FINISH", ["Season with salt and lemon juice", "Stir gently", "Let rest 3 minutes off heat"], 180, "Rich, smoky, balanced"),
      card(id, 6, "SERVE", ["Plate with parsley on top", "Crusty bread to mop up", "Lemon wedge on the side"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 10. Chinese — Mapo Tofu ───────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Mapo Tofu",
    description: "Sichuan classic — silky tofu in a fiery, numbing pork mince sauce. One pot, 20 minutes.",
    vessel: "pot",
    cuisine: "Chinese",
    total_time_minutes: 20,
    prep_time_minutes: 5,
    cook_time_minutes: 15,
    serves: 4,
    cost_per_serve: 3,
    difficulty: 2,
    spice_level: 4,
    adventure_level: 3,
    dietary_tags: [],
    season_tags: ["all-year"],
    tips: ["Don't stir tofu aggressively — it breaks. Gentle shakes of the pot instead."],
    storage_notes: "Fridge 2 days. Tofu texture changes when frozen — not recommended.",
    leftover_ideas: ["Over noodles", "Stuffed into bao buns"],
    ingredients: [
      ing(id, 1, "pork mince", 200, "g", "meat", false, 3),
      ing(id, 2, "silken tofu", 400, "g", "produce", false, 2),
      ing(id, 3, "doubanjiang", 2, "tbsp", "international", false, 2),
      ing(id, 4, "soy sauce", 1, "tbsp", "condiments", true, 0.3),
      ing(id, 5, "garlic", 4, "cloves", "produce", true, 0.3),
      ing(id, 6, "fresh ginger", 1, "thumb", "produce", false, 0.5),
      ing(id, 7, "spring onion", 4, "stalks", "produce", false, 0.5),
      ing(id, 8, "sichuan peppercorn", 1, "tsp", "spices", false, 1),
      ing(id, 9, "chilli flakes", 1, "tsp", "spices", true, 0.2),
      ing(id, 10, "cornstarch", 1, "tbsp", "baking", true, 0.2),
      ing(id, 11, "sesame oil", 1, "tsp", "condiments", true, 0.3),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Cut tofu into 2cm cubes", "Mince garlic and ginger", "Slice spring onions (white and green separate)", "Mix cornstarch with 2 tbsp water"], undefined, "Tofu cubed, aromatics ready"),
      card(id, 2, "FRY PORK", ["Heat oil in pot over high heat", "Fry pork mince, breaking up, until browned (3 min)", "Push to one side of pot"], 180, "Pork browned and crumbly"),
      card(id, 3, "AROMATICS", ["Add doubanjiang, stir into pork", "Add garlic, ginger, spring onion whites, chilli flakes", "Fry 1 minute — fragrant and red"], 60, "Fiery red, incredibly fragrant"),
      card(id, 4, "SIMMER TOFU", ["Add 250ml water and soy sauce", "Gently slide in tofu cubes", "Simmer 8 minutes — shake pot, don't stir"], 480, "Tofu heated through, sauce bubbling"),
      card(id, 5, "THICKEN", ["Drizzle in cornstarch slurry", "Gentle shake to distribute", "Cook 2 more minutes until glossy"], 120, "Sauce coats the back of a spoon"),
      card(id, 6, "SERVE", ["Drizzle sesame oil", "Scatter spring onion greens and sichuan peppercorn", "Serve over steamed rice"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 11. Vietnamese — Pho Bo ───────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Quick Pho Bo",
    description: "Vietnamese beef noodle soup — aromatic star anise broth with rare beef and fresh herbs.",
    vessel: "pot",
    cuisine: "Vietnamese",
    total_time_minutes: 30,
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    serves: 4,
    cost_per_serve: 5,
    difficulty: 2,
    spice_level: 1,
    adventure_level: 2,
    dietary_tags: ["dairy-free"],
    season_tags: ["winter", "all-year"],
    tips: ["Slice beef paper-thin while semi-frozen — the hot broth cooks it in the bowl"],
    storage_notes: "Broth keeps 3 days. Cook noodles fresh each serve.",
    leftover_ideas: ["Pho broth as base for any Asian soup"],
    ingredients: [
      ing(id, 1, "beef sirloin", 300, "g", "meat", false, 8),
      ing(id, 2, "beef stock", 1.5, "L", "tinned", true, 1.5),
      ing(id, 3, "rice noodles", 200, "g", "international", false, 2),
      ing(id, 4, "onion", 1, "large", "produce", false, 0.5),
      ing(id, 5, "fresh ginger", 1, "large", "produce", false, 0.5),
      ing(id, 6, "star anise", 3, "whole", "spices", false, 1),
      ing(id, 7, "cinnamon stick", 1, "whole", "spices", false, 0.5),
      ing(id, 8, "fish sauce", 2, "tbsp", "condiments", true, 0.5),
      ing(id, 9, "bean sprouts", 100, "g", "produce", false, 1),
      ing(id, 10, "fresh Thai basil", 1, "bunch", "herbs", false, 2),
      ing(id, 11, "fresh mint", 1, "bunch", "herbs", false, 1.5),
      ing(id, 12, "lime", 2, "whole", "produce", false, 0.8),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Halve onion, slice ginger into coins", "Slice beef paper-thin (freeze 15 min first to firm up)", "Wash herbs, slice limes"], undefined, "Beef sliced thin, garnish plate ready"),
      card(id, 2, "CHAR", ["Char onion and ginger directly on gas flame or in dry pot", "Should be blackened in spots (3 min)", "This gives the broth its signature flavour"], 180, "Charred and smoky"),
      card(id, 3, "BUILD BROTH", ["Add stock to pot with charred onion and ginger", "Add star anise, cinnamon stick", "Bring to boil, then simmer 15 minutes"], 900, "Fragrant, clear broth"),
      card(id, 4, "NOODLES", ["Cook rice noodles in broth (or separately)", "Strain broth, discard solids", "Season with fish sauce"], undefined, "Noodles tender, broth seasoned"),
      card(id, 5, "ASSEMBLE", ["Divide noodles into bowls", "Lay raw beef slices on top", "Ladle boiling broth over beef — it cooks instantly"], undefined, "Beef turns pink, broth steaming"),
      card(id, 6, "SERVE", ["Top with bean sprouts, Thai basil, mint", "Squeeze of lime", "Hoisin and sriracha on the side"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 12. Thai — Green Curry ────────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Thai Green Curry",
    description: "Fragrant coconut green curry with chicken, Thai aubergine, and basil. 25 minutes, one pot.",
    vessel: "pot",
    cuisine: "Thai",
    total_time_minutes: 25,
    prep_time_minutes: 8,
    cook_time_minutes: 17,
    serves: 4,
    cost_per_serve: 4,
    difficulty: 1,
    spice_level: 3,
    adventure_level: 2,
    dietary_tags: ["gluten-free", "dairy-free"],
    season_tags: ["all-year"],
    tips: ["Fry curry paste in coconut cream (thick top of can) for deepest flavour"],
    storage_notes: "Fridge 3 days. Reheat gently — coconut can split at high heat.",
    leftover_ideas: ["Green curry fried rice", "Curry soup with extra stock"],
    ingredients: [
      ing(id, 1, "chicken breast", 500, "g", "meat", false, 5),
      ing(id, 2, "coconut milk", 400, "ml", "tinned", false, 2),
      ing(id, 3, "green curry paste", 3, "tbsp", "international", false, 2),
      ing(id, 4, "fish sauce", 2, "tbsp", "condiments", true, 0.5),
      ing(id, 5, "Thai aubergine", 4, "whole", "produce", false, 2),
      ing(id, 6, "bamboo shoots", 100, "g", "tinned", false, 1),
      ing(id, 7, "snake beans", 100, "g", "produce", false, 1.5),
      ing(id, 8, "palm sugar", 1, "tbsp", "international", false, 0.5),
      ing(id, 9, "kaffir lime leaves", 4, "whole", "produce", false, 1),
      ing(id, 10, "fresh Thai basil", 1, "bunch", "herbs", false, 2),
      ing(id, 11, "red chilli", 1, "whole", "produce", false, 0.3),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Slice chicken into strips", "Quarter Thai aubergines, cut beans into 5cm", "Tear kaffir lime leaves, slice chilli"], undefined, "Everything chopped"),
      card(id, 2, "FRY PASTE", ["Scoop thick cream from top of coconut can", "Fry in pot over medium heat until oil splits out (2 min)", "Add curry paste, fry 1 minute until fragrant"], 180, "Green oil separating, incredible smell"),
      card(id, 3, "COOK CHICKEN", ["Add chicken strips, stir to coat in paste", "Cook 3 minutes until sealed on outside", "Add remaining coconut milk"], 180, "Chicken coated, liquid in"),
      card(id, 4, "SIMMER", ["Add aubergine, bamboo shoots, snake beans", "Add kaffir lime leaves, fish sauce, palm sugar", "Simmer 12 minutes"], 720, "Vegetables tender, sauce rich"),
      card(id, 5, "BALANCE", ["Taste — adjust fish sauce (salty), sugar (sweet), chilli (heat)", "Thai food is about balance: salty-sweet-sour-spicy", "Stir in most of the Thai basil"], undefined, "Perfectly balanced"),
      card(id, 6, "SERVE", ["Serve over jasmine rice", "Top with remaining basil and sliced chilli", "Lime wedge on the side"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 13. Korean — Kimchi Jjigae ────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Kimchi Jjigae",
    description: "Korean kimchi stew with pork belly and tofu. Fermented, funky, and deeply warming.",
    vessel: "pot",
    cuisine: "Korean",
    total_time_minutes: 25,
    prep_time_minutes: 5,
    cook_time_minutes: 20,
    serves: 4,
    cost_per_serve: 4,
    difficulty: 1,
    spice_level: 3,
    adventure_level: 2,
    dietary_tags: [],
    season_tags: ["winter", "all-year"],
    tips: ["Use old, sour kimchi — the funkier the better for stew"],
    storage_notes: "Fridge 3 days. Flavour improves overnight.",
    leftover_ideas: ["Jjigae with ramen noodles added", "Rice bowl topper"],
    ingredients: [
      ing(id, 1, "pork belly", 200, "g", "meat", false, 4),
      ing(id, 2, "firm tofu", 300, "g", "produce", false, 2),
      ing(id, 3, "kimchi", 300, "g", "international", false, 3),
      ing(id, 4, "gochugaru", 1, "tbsp", "international", false, 1),
      ing(id, 5, "soy sauce", 1, "tbsp", "condiments", true, 0.3),
      ing(id, 6, "sesame oil", 1, "tbsp", "condiments", true, 0.3),
      ing(id, 7, "garlic", 3, "cloves", "produce", true, 0.3),
      ing(id, 8, "spring onion", 3, "stalks", "produce", false, 0.5),
      ing(id, 9, "onion", 1, "medium", "produce", false, 0.5),
      ing(id, 10, "zucchini", 1, "small", "produce", false, 1),
      ing(id, 11, "gochujang", 1, "tbsp", "international", false, 1),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Slice pork belly thinly", "Cut tofu into 2cm cubes", "Roughly chop kimchi (keep the juice!)", "Slice zucchini, onion, spring onion"], undefined, "Everything sliced and ready"),
      card(id, 2, "FRY PORK", ["Heat sesame oil in pot over medium-high", "Fry pork belly slices until fat renders (3 min)", "Add onion and garlic, cook 1 min"], 240, "Pork fat rendered, onion softening"),
      card(id, 3, "ADD KIMCHI", ["Add chopped kimchi with all its juice", "Add gochugaru and gochujang", "Stir and fry 2 minutes"], 120, "Fiery red, funky, amazing"),
      card(id, 4, "SIMMER", ["Add 500ml water and soy sauce", "Add zucchini", "Bring to boil, then simmer 12 minutes"], 720, "Broth rich and red"),
      card(id, 5, "ADD TOFU", ["Gently slide in tofu cubes", "Simmer 5 more minutes", "Don't stir — shake the pot gently"], 300, "Tofu heated through, stew bubbling"),
      card(id, 6, "SERVE", ["Ladle into bowls while still bubbling", "Scatter spring onion", "Serve with steamed rice and extra kimchi"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 14. Japanese — Oyakodon ───────────────────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Oyakodon",
    description: "Japanese chicken and egg rice bowl. Silky, sweet-savoury, and ready in 15 minutes.",
    vessel: "pan",
    cuisine: "Japanese",
    total_time_minutes: 15,
    prep_time_minutes: 5,
    cook_time_minutes: 10,
    serves: 2,
    cost_per_serve: 3.5,
    difficulty: 2,
    spice_level: 1,
    adventure_level: 2,
    dietary_tags: ["dairy-free"],
    season_tags: ["all-year"],
    tips: ["Don't fully cook the egg — it should be just set on top, still custardy underneath"],
    storage_notes: "Eat immediately. Not a leftover dish.",
    leftover_ideas: [],
    ingredients: [
      ing(id, 1, "chicken thigh", 300, "g", "meat", false, 4),
      ing(id, 2, "eggs", 4, "whole", "dairy", false, 2),
      ing(id, 3, "onion", 1, "medium", "produce", false, 0.5),
      ing(id, 4, "dashi stock", 200, "ml", "international", false, 1.5),
      ing(id, 5, "soy sauce", 2, "tbsp", "condiments", true, 0.3),
      ing(id, 6, "mirin", 2, "tbsp", "international", false, 1),
      ing(id, 7, "sugar", 1, "tsp", "baking", true, 0.1),
      ing(id, 8, "spring onion", 2, "stalks", "produce", false, 0.3),
      ing(id, 9, "steamed rice", 2, "bowls", "rice", false, 0.5),
      ing(id, 10, "nori", 1, "sheet", "international", false, 0.5),
      ing(id, 11, "shichimi togarashi", 1, "pinch", "spices", false, 0.5),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Slice chicken into bite-sized pieces", "Thinly slice onion into half-moons", "Beat eggs loosely — don't over-mix", "Slice spring onion, shred nori"], undefined, "Everything sliced"),
      card(id, 2, "BROTH", ["Combine dashi, soy sauce, mirin, sugar in pan", "Bring to a simmer", "Add onion slices, cook 2 min until soft"], 120, "Sweet-savoury broth, onion tender"),
      card(id, 3, "COOK CHICKEN", ["Add chicken pieces in single layer", "Simmer 5 minutes with lid on", "Chicken should be just cooked through"], 300, "Chicken white all the way through"),
      card(id, 4, "ADD EGG", ["Pour 2/3 of beaten egg evenly over chicken", "Cover and cook 1 minute", "Egg should be just setting"], 60, "Egg mostly set, still soft"),
      card(id, 5, "FINISH EGG", ["Pour remaining egg over the top", "Cover, heat off, let rest 30 seconds", "The residual heat finishes it — silky, not rubbery"], 30, "Custardy, barely set"),
      card(id, 6, "SERVE", ["Slide entire egg-chicken mixture over hot rice", "Top with spring onion and shredded nori", "Sprinkle shichimi togarashi"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ─── 15. Korean — Budae Jjigae (Army Stew) ────────────────────────
(() => {
  const id = uid();
  const r = recipe({
    title: "Budae Jjigae",
    description: "Korean army stew — ramen noodles, spam, kimchi, and cheese in a spicy broth. Unapologetically fun.",
    vessel: "pot",
    cuisine: "Korean",
    total_time_minutes: 25,
    prep_time_minutes: 8,
    cook_time_minutes: 17,
    serves: 4,
    cost_per_serve: 3.5,
    difficulty: 1,
    spice_level: 3,
    adventure_level: 3,
    dietary_tags: [],
    season_tags: ["winter", "all-year"],
    tips: ["The cheese melting into the spicy broth is the point. Don't skip it."],
    storage_notes: "Eat fresh — noodles go soggy. Broth keeps 2 days.",
    leftover_ideas: ["Add more noodles to leftover broth"],
    ingredients: [
      ing(id, 1, "spam", 200, "g", "tinned", false, 3),
      ing(id, 2, "instant ramen noodles", 2, "packs", "international", false, 2),
      ing(id, 3, "kimchi", 200, "g", "international", false, 2),
      ing(id, 4, "baked beans", 200, "g", "tinned", false, 1),
      ing(id, 5, "onion", 1, "medium", "produce", false, 0.5),
      ing(id, 6, "garlic", 3, "cloves", "produce", true, 0.3),
      ing(id, 7, "gochugaru", 2, "tbsp", "international", false, 1),
      ing(id, 8, "soy sauce", 1, "tbsp", "condiments", true, 0.3),
      ing(id, 9, "spring onion", 3, "stalks", "produce", false, 0.5),
      ing(id, 10, "mozzarella", 100, "g", "dairy", false, 2),
      ing(id, 11, "fresh coriander", 1, "handful", "herbs", false, 1),
      ing(id, 12, "sesame oil", 1, "tsp", "condiments", true, 0.3),
    ],
    workflow_cards: [
      card(id, 1, "PREP", ["Slice spam into rectangles", "Slice onion and garlic", "Chop kimchi roughly, slice spring onion"], undefined, "Everything sliced"),
      card(id, 2, "ARRANGE", ["This is a communal pot — arrange ingredients in sections", "Place spam, kimchi, baked beans, onion in pot", "Don't mix yet — it looks amazing this way"], undefined, "Beautiful mosaic of ingredients"),
      card(id, 3, "BROTH", ["Mix 800ml water with gochugaru, soy sauce, minced garlic", "Pour broth over arranged ingredients", "Bring to a boil"], undefined, "Bubbling red broth"),
      card(id, 4, "NOODLES", ["Add ramen noodles on top", "Push down gently into broth", "Cook 4 minutes until noodles loosen"], 240, "Noodles softened"),
      card(id, 5, "CHEESE", ["Lay mozzarella slices on top", "Cover and cook 2 more minutes", "Cheese should be melty and stretchy"], 120, "Cheese melted, broth bubbling"),
      card(id, 6, "SERVE", ["Drizzle sesame oil", "Scatter spring onion and coriander", "Serve directly from the pot — everyone digs in"], undefined, "Dinner. Sorted."),
    ],
  });
  r.id = id;
  SEED_RECIPES.push(r);
})();

// ── Auto-generate personality tags for all seed recipes ──────────
for (const r of SEED_RECIPES) {
  r.personality_tags = generatePersonalityTags(r);
}
