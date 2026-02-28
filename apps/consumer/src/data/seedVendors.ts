/**
 * Seed vendor data for development / demo.
 * Boutique vendors across categories: butcher, fishmonger, cheese,
 * greengrocer, fruit, larder, bakery, spices.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface SeedVendor {
  id: string;
  name: string;
  slug: string;
  category: VendorCategory;
  tagline: string;
  description: string;
  logo_emoji: string;
  location: string;
  delivery_radius_km: number;
  delivery_note: string;
  min_order: number;
  rating: number;
  products: SeedProduct[];
}

export interface SeedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  in_stock: boolean;
  popular: boolean;
  tags: string[];
  pairs_with_cuisines?: string[];
}

export type VendorCategory =
  | "butcher"
  | "fishmonger"
  | "cheese"
  | "greengrocer"
  | "fruit"
  | "larder"
  | "bakery"
  | "spices";

const CATEGORY_META: Record<VendorCategory, { iconName: string; label: string }> = {
  butcher:      { iconName: "beef", label: "Butcher" },
  fishmonger:   { iconName: "fish", label: "Fishmonger" },
  cheese:       { iconName: "milk", label: "Cheese" },
  greengrocer:  { iconName: "salad", label: "Greengrocer" },
  fruit:        { iconName: "apple", label: "Fruit" },
  larder:       { iconName: "package", label: "Larder" },
  bakery:       { iconName: "croissant", label: "Bakery" },
  spices:       { iconName: "flame", label: "Spices" },
};

export { CATEGORY_META };

// ── Helpers ────────────────────────────────────────────────────────

let _vid = 0;
const vid = () => `vendor-${++_vid}`;
let _pid = 0;
const pid = () => `prod-${++_pid}`;

// ── Vendor Data ────────────────────────────────────────────────────

export const SEED_VENDORS: SeedVendor[] = [
  // ── BUTCHER ──────────────────────────────────────────────────────
  {
    id: vid(), name: "The Honest Butcher", slug: "honest-butcher",
    category: "butcher",
    tagline: "Paddock to pot. No shortcuts.",
    description: "Free-range, grass-fed meats from local farms. Dry-aged beef, heritage pork, and the best sausages in town.",
    logo_emoji: "beef", location: "Northcote, VIC",
    delivery_radius_km: 15, delivery_note: "Next-day delivery, free over $60",
    min_order: 25, rating: 4.8,
    products: [
      { id: pid(), name: "Free-Range Chicken Thighs", description: "Skin-on, bone-in. Perfect for curries and stews.", price: 14.99, unit: "kg", in_stock: true, popular: true, tags: ["free-range", "chicken"], pairs_with_cuisines: ["Indian", "Thai", "Mexican"] },
      { id: pid(), name: "Grass-Fed Beef Sirloin", description: "28-day dry-aged. Incredible for pho or stir-fry.", price: 42.99, unit: "kg", in_stock: true, popular: true, tags: ["grass-fed", "beef", "dry-aged"], pairs_with_cuisines: ["Vietnamese", "Korean", "Japanese"] },
      { id: pid(), name: "Heritage Pork Belly", description: "Thick-cut, skin-on. Slow cook or quick-fry.", price: 22.99, unit: "kg", in_stock: true, popular: false, tags: ["heritage", "pork"], pairs_with_cuisines: ["Korean", "Chinese"] },
      { id: pid(), name: "Pork & Fennel Sausages", description: "House-made. 6 per pack. Gluten-free casing.", price: 12.50, unit: "pack", in_stock: true, popular: true, tags: ["sausages", "gluten-free"], pairs_with_cuisines: ["English", "Italian"] },
      { id: pid(), name: "Lamb Shoulder", description: "Bone-in, grass-fed. Slow cook until falling apart.", price: 19.99, unit: "kg", in_stock: true, popular: false, tags: ["lamb", "grass-fed"], pairs_with_cuisines: ["Indian", "English"] },
      { id: pid(), name: "Pork Mince", description: "Coarse-ground from shoulder. Perfect for mapo tofu.", price: 14.99, unit: "kg", in_stock: true, popular: false, tags: ["pork", "mince"], pairs_with_cuisines: ["Chinese", "Italian"] },
    ],
  },
  {
    id: vid(), name: "Carcass & Co", slug: "carcass-co",
    category: "butcher",
    tagline: "Whole animal. Zero waste.",
    description: "Nose-to-tail butchery. We buy whole animals from regenerative farms and use everything.",
    logo_emoji: "beef", location: "Fitzroy, VIC",
    delivery_radius_km: 20, delivery_note: "Wed + Sat delivery",
    min_order: 40, rating: 4.9,
    products: [
      { id: pid(), name: "Chorizo (Cured)", description: "House-cured, smoky Spanish-style. Slice and fry.", price: 18.99, unit: "500g", in_stock: true, popular: true, tags: ["chorizo", "cured"], pairs_with_cuisines: ["Spanish", "Mexican"] },
      { id: pid(), name: "Pancetta (Flat)", description: "Dry-cured pork belly. Italian-style.", price: 16.99, unit: "300g", in_stock: true, popular: false, tags: ["pancetta", "cured"], pairs_with_cuisines: ["Italian"] },
      { id: pid(), name: "Pork Shoulder (Boneless)", description: "Perfect for pozole or pulled pork.", price: 17.99, unit: "kg", in_stock: true, popular: false, tags: ["pork", "shoulder"], pairs_with_cuisines: ["Mexican", "American"] },
    ],
  },

  // ── FISHMONGER ───────────────────────────────────────────────────
  {
    id: vid(), name: "Salt & Scale", slug: "salt-scale",
    category: "fishmonger",
    tagline: "Sustainable catch. Daily fresh.",
    description: "Line-caught and sustainably farmed seafood. Delivered same-day from the market.",
    logo_emoji: "fish", location: "South Melbourne, VIC",
    delivery_radius_km: 12, delivery_note: "Same-day if ordered by 10am",
    min_order: 30, rating: 4.7,
    products: [
      { id: pid(), name: "Barramundi Fillets", description: "Wild-caught, boneless. Flaky and mild.", price: 34.99, unit: "kg", in_stock: true, popular: true, tags: ["fish", "wild-caught"], pairs_with_cuisines: ["Thai", "Vietnamese"] },
      { id: pid(), name: "Tiger Prawns (Green)", description: "Raw, shell-on. 12-15 per kg.", price: 29.99, unit: "kg", in_stock: true, popular: true, tags: ["prawns", "raw"], pairs_with_cuisines: ["Thai", "Chinese", "Spanish"] },
      { id: pid(), name: "Salmon Portions", description: "Tassie Atlantic salmon. Skin-on, 180g each.", price: 12.99, unit: "piece", in_stock: true, popular: true, tags: ["salmon", "atlantic"], pairs_with_cuisines: ["Japanese"] },
      { id: pid(), name: "Mussels (Black)", description: "Spring Bay. 1kg bag. Ready to cook.", price: 8.99, unit: "kg", in_stock: true, popular: false, tags: ["mussels", "shellfish"], pairs_with_cuisines: ["Italian", "Spanish"] },
      { id: pid(), name: "Calamari Tubes", description: "Cleaned, ready to stuff or slice.", price: 22.99, unit: "kg", in_stock: true, popular: false, tags: ["calamari", "squid"], pairs_with_cuisines: ["Italian", "Spanish"] },
    ],
  },

  // ── CHEESE ───────────────────────────────────────────────────────
  {
    id: vid(), name: "The Cheese Cave", slug: "cheese-cave",
    category: "cheese",
    tagline: "Aged to perfection.",
    description: "Artisan Australian and imported cheeses. Properly aged, properly stored, properly good.",
    logo_emoji: "milk", location: "Carlton, VIC",
    delivery_radius_km: 15, delivery_note: "Chilled delivery, Tue-Sat",
    min_order: 20, rating: 4.9,
    products: [
      { id: pid(), name: "Parmigiano Reggiano (24 month)", description: "DOP certified. Crumbly, nutty, essential.", price: 7.99, unit: "100g", in_stock: true, popular: true, tags: ["parmesan", "italian", "hard"], pairs_with_cuisines: ["Italian"] },
      { id: pid(), name: "Aged Cheddar (Pyengana)", description: "Tasmanian cloth-bound. Sharp, complex.", price: 6.49, unit: "100g", in_stock: true, popular: true, tags: ["cheddar", "australian", "hard"], pairs_with_cuisines: ["English", "American"] },
      { id: pid(), name: "Fresh Mozzarella (Fior di Latte)", description: "Made daily. Creamy, milky. House-made.", price: 5.99, unit: "200g", in_stock: true, popular: true, tags: ["mozzarella", "fresh", "italian"], pairs_with_cuisines: ["Italian", "Korean"] },
      { id: pid(), name: "Pecorino Romano", description: "Sharp sheep's milk. Grate over pasta.", price: 6.99, unit: "100g", in_stock: true, popular: false, tags: ["pecorino", "italian", "hard"], pairs_with_cuisines: ["Italian"] },
      { id: pid(), name: "Gruyère (Swiss)", description: "Imported. Nutty, perfect for gratins.", price: 7.49, unit: "100g", in_stock: true, popular: false, tags: ["gruyere", "swiss", "hard"], pairs_with_cuisines: ["Italian", "American"] },
    ],
  },

  // ── GREENGROCER ──────────────────────────────────────────────────
  {
    id: vid(), name: "Root & Stem", slug: "root-stem",
    category: "greengrocer",
    tagline: "Seasonal. Local. Beautiful.",
    description: "Direct-from-farm seasonal produce. What's ripe this week is what we sell.",
    logo_emoji: "salad", location: "Collingwood, VIC",
    delivery_radius_km: 10, delivery_note: "Daily delivery, farm-fresh",
    min_order: 15, rating: 4.6,
    products: [
      { id: pid(), name: "Mixed Asian Herbs", description: "Thai basil, Vietnamese mint, coriander. Perfect for pho/curry.", price: 4.99, unit: "bunch", in_stock: true, popular: true, tags: ["herbs", "asian"], pairs_with_cuisines: ["Vietnamese", "Thai"] },
      { id: pid(), name: "Bean Sprouts", description: "Grown locally. Ultra-fresh, crunchy.", price: 2.49, unit: "200g", in_stock: true, popular: false, tags: ["sprouts", "asian"], pairs_with_cuisines: ["Vietnamese", "Korean"] },
      { id: pid(), name: "Snake Beans", description: "Long beans. Great in curries and stir-fry.", price: 5.99, unit: "bunch", in_stock: true, popular: false, tags: ["beans", "asian"], pairs_with_cuisines: ["Thai"] },
      { id: pid(), name: "Thai Aubergine", description: "Small, round, green. Essential for green curry.", price: 4.99, unit: "pack", in_stock: true, popular: false, tags: ["aubergine", "thai"], pairs_with_cuisines: ["Thai"] },
      { id: pid(), name: "Seasonal Veg Box", description: "Chef's selection of 8-10 seasonal vegetables.", price: 35.00, unit: "box", in_stock: true, popular: true, tags: ["seasonal", "mixed"] },
      { id: pid(), name: "Kaffir Lime Leaves", description: "Fresh, fragrant. Freeze extras for later.", price: 2.99, unit: "pack", in_stock: true, popular: false, tags: ["herbs", "thai"], pairs_with_cuisines: ["Thai"] },
    ],
  },

  // ── FRUIT ────────────────────────────────────────────────────────
  {
    id: vid(), name: "Orchard Lane", slug: "orchard-lane",
    category: "fruit",
    tagline: "Tree-ripened. Never cold-stored.",
    description: "Direct from orchards across Victoria. Fruit that actually tastes like fruit.",
    logo_emoji: "apple", location: "Yarra Valley, VIC",
    delivery_radius_km: 25, delivery_note: "Weekly delivery, Mon/Thu",
    min_order: 20, rating: 4.7,
    products: [
      { id: pid(), name: "Lemons (Meyer)", description: "Juicy, thin-skinned. Perfect for cooking.", price: 6.99, unit: "kg", in_stock: true, popular: true, tags: ["lemon", "citrus"] },
      { id: pid(), name: "Limes", description: "Tahitian limes. Essential for Asian cooking.", price: 8.99, unit: "kg", in_stock: true, popular: true, tags: ["lime", "citrus"], pairs_with_cuisines: ["Thai", "Vietnamese", "Mexican"] },
      { id: pid(), name: "Seasonal Fruit Box", description: "Mixed seasonal fruit, 3-4kg.", price: 28.00, unit: "box", in_stock: true, popular: true, tags: ["seasonal", "mixed"] },
      { id: pid(), name: "Avocados (Hass)", description: "Perfectly ripe, ready to eat.", price: 3.49, unit: "each", in_stock: true, popular: false, tags: ["avocado"], pairs_with_cuisines: ["Mexican"] },
    ],
  },

  // ── LARDER ───────────────────────────────────────────────────────
  {
    id: vid(), name: "The Pantry Collective", slug: "pantry-collective",
    category: "larder",
    tagline: "Small-batch staples done right.",
    description: "Artisan oils, vinegars, sauces, tinned goods, and dry goods from small producers.",
    logo_emoji: "package", location: "Brunswick, VIC",
    delivery_radius_km: 20, delivery_note: "2-day delivery. No rush.",
    min_order: 30, rating: 4.8,
    products: [
      { id: pid(), name: "San Marzano Tomatoes (DOP)", description: "The gold standard for Italian cooking.", price: 4.99, unit: "400g", in_stock: true, popular: true, tags: ["tinned", "tomatoes", "italian"], pairs_with_cuisines: ["Italian", "Spanish"] },
      { id: pid(), name: "Coconut Milk (Organic)", description: "Full-fat, no additives. Thick cream on top.", price: 3.49, unit: "400ml", in_stock: true, popular: true, tags: ["coconut", "dairy-free"], pairs_with_cuisines: ["Thai", "Indian"] },
      { id: pid(), name: "Arborio Rice", description: "Italian carnaroli alternative. Creamy risotto every time.", price: 8.99, unit: "1kg", in_stock: true, popular: false, tags: ["rice", "italian"], pairs_with_cuisines: ["Italian"] },
      { id: pid(), name: "Soy Sauce (Naturally Brewed)", description: "Japanese-style shoyu. 500ml bottle.", price: 7.99, unit: "500ml", in_stock: true, popular: true, tags: ["soy", "japanese", "condiment"], pairs_with_cuisines: ["Japanese", "Chinese", "Korean"] },
      { id: pid(), name: "Fish Sauce (Red Boat)", description: "First press, single ingredient. The best.", price: 12.99, unit: "250ml", in_stock: true, popular: false, tags: ["fish-sauce", "vietnamese"], pairs_with_cuisines: ["Vietnamese", "Thai"] },
      { id: pid(), name: "Extra Virgin Olive Oil", description: "Cold-pressed Yarra Valley. Peppery finish.", price: 18.99, unit: "500ml", in_stock: true, popular: true, tags: ["olive-oil", "australian"] },
      { id: pid(), name: "Dried Pasta (Bronze-Cut)", description: "Italian-imported. Rough texture holds sauce.", price: 5.99, unit: "500g", in_stock: true, popular: false, tags: ["pasta", "italian"], pairs_with_cuisines: ["Italian"] },
      { id: pid(), name: "Chickpeas (Organic)", description: "Tinned, ready to use. 400g.", price: 2.49, unit: "400g", in_stock: true, popular: false, tags: ["chickpeas", "tinned"], pairs_with_cuisines: ["Indian"] },
    ],
  },

  // ── BAKERY ───────────────────────────────────────────────────────
  {
    id: vid(), name: "Flour & Stone", slug: "flour-stone",
    category: "bakery",
    tagline: "Sourdough is not a trend. It's the standard.",
    description: "Wood-fired sourdough, artisan bread, and fresh flatbreads. Baked daily, delivered warm.",
    logo_emoji: "croissant", location: "Richmond, VIC",
    delivery_radius_km: 10, delivery_note: "Morning delivery, baked at 4am",
    min_order: 10, rating: 4.9,
    products: [
      { id: pid(), name: "Sourdough Loaf (Country)", description: "Classic white sourdough. Crusty, tangy, perfect.", price: 8.50, unit: "loaf", in_stock: true, popular: true, tags: ["sourdough", "bread"] },
      { id: pid(), name: "Naan Bread (Pack of 4)", description: "Tandoor-baked. Fluffy, charred edges.", price: 6.99, unit: "pack", in_stock: true, popular: true, tags: ["naan", "indian"], pairs_with_cuisines: ["Indian"] },
      { id: pid(), name: "Tortillas (Corn)", description: "Nixtamalised corn. Pack of 12.", price: 7.99, unit: "pack", in_stock: true, popular: false, tags: ["tortilla", "mexican"], pairs_with_cuisines: ["Mexican"] },
      { id: pid(), name: "Focaccia (Rosemary & Salt)", description: "Thick, olive oil-soaked. Beautiful with stew.", price: 9.50, unit: "slab", in_stock: true, popular: false, tags: ["focaccia", "italian"], pairs_with_cuisines: ["Italian"] },
    ],
  },

  // ── SPICES ───────────────────────────────────────────────────────
  {
    id: vid(), name: "Spice Merchant", slug: "spice-merchant",
    category: "spices",
    tagline: "Freshly ground. World-sourced.",
    description: "Single-origin spices, ground to order. Blends crafted for specific cuisines.",
    logo_emoji: "flame", location: "Footscray, VIC",
    delivery_radius_km: 25, delivery_note: "Express post, arrives in 2 days",
    min_order: 15, rating: 4.8,
    products: [
      { id: pid(), name: "Garam Masala (House Blend)", description: "Toasted and ground fresh. Indian essential.", price: 6.99, unit: "50g", in_stock: true, popular: true, tags: ["garam-masala", "indian", "blend"], pairs_with_cuisines: ["Indian"] },
      { id: pid(), name: "Sichuan Peppercorn", description: "Numbing, citrusy. Essential for mapo tofu.", price: 5.99, unit: "30g", in_stock: true, popular: false, tags: ["sichuan", "chinese"], pairs_with_cuisines: ["Chinese"] },
      { id: pid(), name: "Smoked Paprika (La Vera)", description: "Spanish DOP. Sweet, smoky, addictive.", price: 7.99, unit: "75g", in_stock: true, popular: true, tags: ["paprika", "spanish"], pairs_with_cuisines: ["Spanish", "Mexican", "American"] },
      { id: pid(), name: "Gochugaru (Korean Chilli Flakes)", description: "Sun-dried. Fruity heat. Essential for kimchi and jjigae.", price: 8.99, unit: "100g", in_stock: true, popular: false, tags: ["gochugaru", "korean"], pairs_with_cuisines: ["Korean"] },
      { id: pid(), name: "Star Anise (Whole)", description: "Vietnamese origin. Aromatic, liquorice-sweet.", price: 4.99, unit: "30g", in_stock: true, popular: false, tags: ["star-anise", "vietnamese"], pairs_with_cuisines: ["Vietnamese", "Chinese"] },
      { id: pid(), name: "Kasuri Methi (Dried Fenugreek)", description: "The secret to restaurant butter chicken.", price: 3.99, unit: "25g", in_stock: true, popular: false, tags: ["fenugreek", "indian"], pairs_with_cuisines: ["Indian"] },
      { id: pid(), name: "Shichimi Togarashi", description: "Japanese 7-spice. Citrusy, nutty heat.", price: 6.99, unit: "40g", in_stock: true, popular: false, tags: ["shichimi", "japanese"], pairs_with_cuisines: ["Japanese"] },
      { id: pid(), name: "Curry Paste Kit (Green)", description: "DIY paste: lemongrass, galangal, chillies, shrimp paste.", price: 9.99, unit: "kit", in_stock: true, popular: true, tags: ["curry-paste", "thai"], pairs_with_cuisines: ["Thai"] },
      { id: pid(), name: "Doubanjiang", description: "Pixian fermented chilli bean paste. Mapo tofu essential.", price: 7.99, unit: "250g", in_stock: true, popular: false, tags: ["doubanjiang", "chinese"], pairs_with_cuisines: ["Chinese"] },
    ],
  },
];
