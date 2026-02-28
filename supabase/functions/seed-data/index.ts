import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: generate random number in range
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

// Helper: generate date range
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  const e = new Date(end);
  while (d <= e) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// Helper: day of week (0=Sun, 1=Mon, ...)
function dayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay();
}

function dayName(dateStr: string): string {
  return ['SUN','MON','TUE','WED','THU','FRI','SAT'][dayOfWeek(dateStr)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Block in production
  const envMode = Deno.env.get("ENVIRONMENT") || Deno.env.get("APP_ENV") || "production";
  if (envMode === "production") {
    return new Response(
      JSON.stringify({ success: false, error: "Seed data is disabled in production" }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Require admin auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json();
    let result: any = { success: false };

    switch (action) {
      // ── Original Kitchen seeds ──────────────────────────────────
      case 'seed_ingredients': {
        const ingredients = [
          { name: "Olive Oil", category: "Oils & Fats", unit: "L", cost_per_unit: 12.5 },
          { name: "Butter", category: "Dairy", unit: "kg", cost_per_unit: 18.0 },
          { name: "Garlic", category: "Produce", unit: "kg", cost_per_unit: 8.5 },
          { name: "Onion", category: "Produce", unit: "kg", cost_per_unit: 2.5 },
          { name: "Chicken Breast", category: "Meat", unit: "kg", cost_per_unit: 14.0 },
          { name: "Salmon Fillet", category: "Seafood", unit: "kg", cost_per_unit: 32.0 },
          { name: "Parmesan Cheese", category: "Dairy", unit: "kg", cost_per_unit: 45.0 },
          { name: "Heavy Cream", category: "Dairy", unit: "L", cost_per_unit: 8.0 },
          { name: "Fresh Basil", category: "Herbs", unit: "bunch", cost_per_unit: 3.5 },
          { name: "Lemon", category: "Produce", unit: "each", cost_per_unit: 0.8 },
          { name: "Arborio Rice", category: "Dry Goods", unit: "kg", cost_per_unit: 6.5 },
          { name: "Beef Tenderloin", category: "Meat", unit: "kg", cost_per_unit: 55.0 },
          { name: "Shallots", category: "Produce", unit: "kg", cost_per_unit: 12.0 },
          { name: "White Wine", category: "Alcohol", unit: "L", cost_per_unit: 15.0 },
          { name: "Vegetable Stock", category: "Stock", unit: "L", cost_per_unit: 4.5 },
        ];
        const { data: inserted, error } = await supabase.from("ingredients").insert(ingredients).select();
        result = { success: !error, count: inserted?.length || 0, error: error?.message };
        break;
      }

      case 'seed_recipes': {
        const { data: existingIngredients } = await supabase.from("ingredients").select("id, name, category");
        const ingredientMap = new Map(existingIngredients?.map(i => [i.name.toLowerCase().trim(), i]) || []);
        const recipes = [
          { name: "Classic Risotto", category: "Main", description: "Creamy Italian rice dish with parmesan", prep_time: 15, cook_time: 25, servings: 4, sell_price: 28.0, cost_per_serving: 6.5, is_public: true, ingredientLinks: [{ name: "Arborio Rice", quantity: 0.4, unit: "kg" }, { name: "Parmesan Cheese", quantity: 0.15, unit: "kg" }, { name: "Butter", quantity: 0.1, unit: "kg" }, { name: "Onion", quantity: 0.15, unit: "kg" }, { name: "White Wine", quantity: 0.2, unit: "L" }, { name: "Vegetable Stock", quantity: 1, unit: "L" }] },
          { name: "Grilled Salmon", category: "Main", description: "Fresh Atlantic salmon with lemon butter", prep_time: 10, cook_time: 15, servings: 2, sell_price: 35.0, cost_per_serving: 12.0, is_public: true, ingredientLinks: [{ name: "Salmon Fillet", quantity: 0.4, unit: "kg" }, { name: "Butter", quantity: 0.05, unit: "kg" }, { name: "Lemon", quantity: 2, unit: "each" }, { name: "Olive Oil", quantity: 0.03, unit: "L" }, { name: "Fresh Basil", quantity: 1, unit: "bunch" }] },
          { name: "Caesar Salad", category: "Starter", description: "Crisp romaine with house-made dressing", prep_time: 15, cook_time: 0, servings: 2, sell_price: 16.0, cost_per_serving: 3.5, is_public: true, ingredientLinks: [{ name: "Parmesan Cheese", quantity: 0.05, unit: "kg" }, { name: "Garlic", quantity: 0.02, unit: "kg" }, { name: "Olive Oil", quantity: 0.05, unit: "L" }, { name: "Lemon", quantity: 1, unit: "each" }] },
          { name: "Tiramisu", category: "Dessert", description: "Italian coffee-flavored layered dessert", prep_time: 30, cook_time: 0, servings: 8, sell_price: 14.0, cost_per_serving: 2.8, is_public: true, ingredientLinks: [{ name: "Heavy Cream", quantity: 0.5, unit: "L" }] },
          { name: "Beef Bourguignon", category: "Main", description: "French braised beef in red wine", prep_time: 30, cook_time: 180, servings: 6, sell_price: 32.0, cost_per_serving: 8.5, is_public: true, ingredientLinks: [{ name: "Beef Tenderloin", quantity: 1, unit: "kg" }, { name: "Onion", quantity: 0.3, unit: "kg" }, { name: "Garlic", quantity: 0.05, unit: "kg" }, { name: "Shallots", quantity: 0.2, unit: "kg" }, { name: "Butter", quantity: 0.1, unit: "kg" }, { name: "Vegetable Stock", quantity: 0.5, unit: "L" }] },
        ];
        const recipesToInsert = recipes.map(({ ingredientLinks, ...recipe }) => recipe);
        const { data: insertedRecipes, error: recipeError } = await supabase.from("recipes").insert(recipesToInsert).select();
        if (recipeError) { result = { success: false, error: recipeError.message }; break; }
        const recipeIngredients: any[] = [];
        insertedRecipes?.forEach((insertedRecipe, idx) => {
          recipes[idx].ingredientLinks?.forEach(link => {
            const ingredient = ingredientMap.get(link.name.toLowerCase().trim());
            if (ingredient) recipeIngredients.push({ recipe_id: insertedRecipe.id, ingredient_id: ingredient.id, quantity: link.quantity, unit: link.unit });
          });
        });
        if (recipeIngredients.length > 0) {
          await supabase.from("recipe_ingredients").insert(recipeIngredients);
        }
        result = { success: true, count: insertedRecipes?.length || 0, ingredientsLinked: recipeIngredients.length };
        break;
      }

      case 'seed_demand_insights': {
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
        const we = weekEnd.toISOString().split('T')[0];
        const insights = [
          { ingredient_category: "Produce", postcode: "2000", week_ending: we, total_quantity: 150, order_count: 12, unit: "kg", avg_price_paid: 5.5 },
          { ingredient_category: "Meat", postcode: "2000", week_ending: we, total_quantity: 85, order_count: 8, unit: "kg", avg_price_paid: 28.0 },
          { ingredient_category: "Seafood", postcode: "2000", week_ending: we, total_quantity: 45, order_count: 6, unit: "kg", avg_price_paid: 35.0 },
          { ingredient_category: "Dairy", postcode: "2000", week_ending: we, total_quantity: 60, order_count: 10, unit: "L", avg_price_paid: 12.0 },
          { ingredient_category: "Herbs", postcode: "2000", week_ending: we, total_quantity: 25, order_count: 15, unit: "bunch", avg_price_paid: 3.5 },
          { ingredient_category: "Produce", postcode: "3000", week_ending: we, total_quantity: 120, order_count: 9, unit: "kg", avg_price_paid: 4.8 },
          { ingredient_category: "Meat", postcode: "3000", week_ending: we, total_quantity: 70, order_count: 7, unit: "kg", avg_price_paid: 26.0 },
        ];
        const { data: inserted, error } = await supabase.from("demand_insights").insert(insights).select();
        result = { success: !error, count: inserted?.length || 0, error: error?.message };
        break;
      }

      case 'seed_pos_menu': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }
        const categories = [
          { org_id, name: "Starters", icon: "🥗", sort_order: 1 },
          { org_id, name: "Mains", icon: "🍽️", sort_order: 2 },
          { org_id, name: "Sides", icon: "🥦", sort_order: 3 },
          { org_id, name: "Desserts", icon: "🍰", sort_order: 4 },
          { org_id, name: "Beer", icon: "🍺", sort_order: 5 },
          { org_id, name: "Wine", icon: "🍷", sort_order: 6 },
          { org_id, name: "Cocktails", icon: "🍸", sort_order: 7 },
          { org_id, name: "Soft Drinks", icon: "🥤", sort_order: 8 },
          { org_id, name: "Coffee & Tea", icon: "☕", sort_order: 9 },
        ];
        const { data: cats, error: catErr } = await supabase.from("pos_categories").insert(categories).select();
        if (catErr) { result = { success: false, error: catErr.message }; break; }
        const catMap = Object.fromEntries(cats!.map(c => [c.name, c.id]));
        const items = [
          { org_id, category_id: catMap["Starters"], name: "Garlic Bread", price: 9, cost_price: 2.5, station: "HOT", sort_order: 1 },
          { org_id, category_id: catMap["Starters"], name: "Caesar Salad", price: 16, cost_price: 4, station: "COLD", sort_order: 2 },
          { org_id, category_id: catMap["Starters"], name: "Soup of the Day", price: 14, cost_price: 3, station: "HOT", sort_order: 3 },
          { org_id, category_id: catMap["Starters"], name: "Bruschetta", price: 15, cost_price: 3.5, station: "COLD", sort_order: 4 },
          { org_id, category_id: catMap["Mains"], name: "Chicken Parmigiana", price: 28, cost_price: 8, station: "HOT", sort_order: 1 },
          { org_id, category_id: catMap["Mains"], name: "Grilled Barramundi", price: 34, cost_price: 12, station: "HOT", sort_order: 2 },
          { org_id, category_id: catMap["Mains"], name: "Scotch Fillet 300g", price: 42, cost_price: 16, station: "HOT", sort_order: 3 },
          { org_id, category_id: catMap["Mains"], name: "Mushroom Risotto", price: 26, cost_price: 6, station: "HOT", sort_order: 4 },
          { org_id, category_id: catMap["Mains"], name: "Fish & Chips", price: 24, cost_price: 7, station: "HOT", sort_order: 5 },
          { org_id, category_id: catMap["Mains"], name: "Lamb Shank", price: 32, cost_price: 11, station: "HOT", sort_order: 6 },
          { org_id, category_id: catMap["Sides"], name: "Chips", price: 8, cost_price: 1.5, station: "HOT", sort_order: 1 },
          { org_id, category_id: catMap["Sides"], name: "Garden Salad", price: 8, cost_price: 2, station: "COLD", sort_order: 2 },
          { org_id, category_id: catMap["Sides"], name: "Steamed Greens", price: 9, cost_price: 2, station: "HOT", sort_order: 3 },
          { org_id, category_id: catMap["Sides"], name: "Mashed Potato", price: 8, cost_price: 1.5, station: "HOT", sort_order: 4 },
          { org_id, category_id: catMap["Desserts"], name: "Sticky Date Pudding", price: 14, cost_price: 3, station: "HOT", sort_order: 1 },
          { org_id, category_id: catMap["Desserts"], name: "Tiramisu", price: 15, cost_price: 3.5, station: "COLD", sort_order: 2 },
          { org_id, category_id: catMap["Desserts"], name: "Affogato", price: 12, cost_price: 3, station: "COFFEE", sort_order: 3 },
          { org_id, category_id: catMap["Beer"], name: "Carlton Draught", price: 8.5, cost_price: 2.5, station: "BAR", sort_order: 1 },
          { org_id, category_id: catMap["Beer"], name: "Coopers Pale Ale", price: 9, cost_price: 3, station: "BAR", sort_order: 2 },
          { org_id, category_id: catMap["Beer"], name: "Balter XPA", price: 10, cost_price: 3.5, station: "BAR", sort_order: 3 },
          { org_id, category_id: catMap["Beer"], name: "Corona", price: 9, cost_price: 3, station: "BAR", sort_order: 4 },
          { org_id, category_id: catMap["Wine"], name: "House Sauv Blanc", price: 10, cost_price: 3, station: "BAR", sort_order: 1 },
          { org_id, category_id: catMap["Wine"], name: "House Shiraz", price: 10, cost_price: 3, station: "BAR", sort_order: 2 },
          { org_id, category_id: catMap["Wine"], name: "Prosecco", price: 12, cost_price: 4, station: "BAR", sort_order: 3 },
          { org_id, category_id: catMap["Cocktails"], name: "Espresso Martini", price: 22, cost_price: 6, station: "BAR", sort_order: 1 },
          { org_id, category_id: catMap["Cocktails"], name: "Aperol Spritz", price: 20, cost_price: 5, station: "BAR", sort_order: 2 },
          { org_id, category_id: catMap["Cocktails"], name: "Margarita", price: 20, cost_price: 5, station: "BAR", sort_order: 3 },
          { org_id, category_id: catMap["Cocktails"], name: "Negroni", price: 22, cost_price: 6, station: "BAR", sort_order: 4 },
          { org_id, category_id: catMap["Soft Drinks"], name: "Coke", price: 4.5, cost_price: 1, station: "BAR", sort_order: 1 },
          { org_id, category_id: catMap["Soft Drinks"], name: "Lemonade", price: 4.5, cost_price: 1, station: "BAR", sort_order: 2 },
          { org_id, category_id: catMap["Soft Drinks"], name: "Sparkling Water", price: 5, cost_price: 1.5, station: "BAR", sort_order: 3 },
          { org_id, category_id: catMap["Soft Drinks"], name: "Fresh Juice", price: 7, cost_price: 2, station: "BAR", sort_order: 4 },
          { org_id, category_id: catMap["Coffee & Tea"], name: "Flat White", price: 5, cost_price: 1.5, station: "COFFEE", sort_order: 1 },
          { org_id, category_id: catMap["Coffee & Tea"], name: "Cappuccino", price: 5, cost_price: 1.5, station: "COFFEE", sort_order: 2 },
          { org_id, category_id: catMap["Coffee & Tea"], name: "Long Black", price: 4.5, cost_price: 1.2, station: "COFFEE", sort_order: 3 },
          { org_id, category_id: catMap["Coffee & Tea"], name: "English Breakfast Tea", price: 4.5, cost_price: 0.8, station: "COFFEE", sort_order: 4 },
        ];
        const { data: menuItems, error: itemErr } = await supabase.from("pos_menu_items").insert(items).select();
        if (itemErr) { result = { success: false, error: itemErr.message }; break; }
        const groups = [
          { org_id, name: "Steak Doneness", is_required: true, min_selections: 1, max_selections: 1 },
          { org_id, name: "Steak Sauce", is_required: false, min_selections: 0, max_selections: 1 },
          { org_id, name: "Add-Ons", is_required: false, min_selections: 0, max_selections: 3 },
          { org_id, name: "Coffee Milk", is_required: false, min_selections: 0, max_selections: 1 },
        ];
        const { data: modGroups, error: grpErr } = await supabase.from("pos_modifier_groups").insert(groups).select();
        if (grpErr) { result = { success: false, error: grpErr.message }; break; }
        const grpMap = Object.fromEntries(modGroups!.map(g => [g.name, g.id]));
        const modifiers = [
          { group_id: grpMap["Steak Doneness"], name: "Rare", price_adjustment: 0, sort_order: 1 },
          { group_id: grpMap["Steak Doneness"], name: "Medium-Rare", price_adjustment: 0, sort_order: 2 },
          { group_id: grpMap["Steak Doneness"], name: "Medium", price_adjustment: 0, sort_order: 3 },
          { group_id: grpMap["Steak Doneness"], name: "Medium-Well", price_adjustment: 0, sort_order: 4 },
          { group_id: grpMap["Steak Doneness"], name: "Well Done", price_adjustment: 0, sort_order: 5 },
          { group_id: grpMap["Steak Sauce"], name: "Pepper Sauce", price_adjustment: 3, sort_order: 1 },
          { group_id: grpMap["Steak Sauce"], name: "Mushroom Sauce", price_adjustment: 3, sort_order: 2 },
          { group_id: grpMap["Steak Sauce"], name: "Diane Sauce", price_adjustment: 3, sort_order: 3 },
          { group_id: grpMap["Add-Ons"], name: "Extra Cheese", price_adjustment: 2, sort_order: 1 },
          { group_id: grpMap["Add-Ons"], name: "Bacon", price_adjustment: 3, sort_order: 2 },
          { group_id: grpMap["Add-Ons"], name: "Avocado", price_adjustment: 4, sort_order: 3 },
          { group_id: grpMap["Add-Ons"], name: "Fried Egg", price_adjustment: 2, sort_order: 4 },
          { group_id: grpMap["Coffee Milk"], name: "Oat Milk", price_adjustment: 1, sort_order: 1 },
          { group_id: grpMap["Coffee Milk"], name: "Almond Milk", price_adjustment: 1, sort_order: 2 },
          { group_id: grpMap["Coffee Milk"], name: "Soy Milk", price_adjustment: 0.5, sort_order: 3 },
        ];
        await supabase.from("pos_modifiers").insert(modifiers);
        result = { success: true, count: menuItems?.length || 0, categories: cats?.length || 0, modifierGroups: modGroups?.length || 0, modifiers: modifiers.length };
        break;
      }

      // ════════════════════════════════════════════════════════════
      // CHICC.iT BRISBANE ECOSYSTEM SEEDS
      // ════════════════════════════════════════════════════════════

      case 'seed_chiccit_staff': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        // Get or create user IDs for staff via profiles
        const { data: profiles } = await supabase.from("profiles").select("user_id").limit(1);
        const ownerId = profiles?.[0]?.user_id;

        const staffMembers = [
          // FULL-TIME (4)
          { org_id, first_name: "Marco", last_name: "Rossi", email: "marco@chiccit.com.au", employment_type: "full_time", role_title: "Head Chef", classification_level: 5, hourly_rate: 27.22, start_date: "2024-03-15" },
          { org_id, first_name: "Sarah", last_name: "Chen", email: "sarah@chiccit.com.au", employment_type: "full_time", role_title: "FOH Lead", classification_level: 3, hourly_rate: 25.05, start_date: "2024-06-01" },
          { org_id, first_name: "James", last_name: "O'Brien", email: "james@chiccit.com.au", employment_type: "full_time", role_title: "Sous Chef", classification_level: 3, hourly_rate: 25.05, start_date: "2024-08-20" },
          { org_id, first_name: "Priya", last_name: "Sharma", email: "priya@chiccit.com.au", employment_type: "full_time", role_title: "FOH", classification_level: 2, hourly_rate: 24.29, start_date: "2025-01-10" },
          // PART-TIME (8) — Tom underpaid at $23.80 (should be $24.29+)
          { org_id, first_name: "Tom", last_name: "Williams", email: "tom@chiccit.com.au", employment_type: "part_time", role_title: "Cook", classification_level: 2, hourly_rate: 23.80, start_date: "2024-09-01" },
          { org_id, first_name: "Lucy", last_name: "Zhang", email: "lucy@chiccit.com.au", employment_type: "part_time", role_title: "FOH", classification_level: 2, hourly_rate: 24.29, start_date: "2024-10-15" },
          { org_id, first_name: "Ali", last_name: "Hassan", email: "ali@chiccit.com.au", employment_type: "part_time", role_title: "FOH", classification_level: 2, hourly_rate: 24.29, start_date: "2025-02-01" },
          { org_id, first_name: "Mei", last_name: "Lin", email: "mei@chiccit.com.au", employment_type: "part_time", role_title: "Cook", classification_level: 2, hourly_rate: 24.29, start_date: "2025-03-01" },
          { org_id, first_name: "David", last_name: "Park", email: "david@chiccit.com.au", employment_type: "part_time", role_title: "FOH", classification_level: 1, hourly_rate: 23.54, start_date: "2025-05-01" },
          { org_id, first_name: "Chloe", last_name: "Murphy", email: "chloe@chiccit.com.au", employment_type: "part_time", role_title: "FOH", classification_level: 2, hourly_rate: 24.29, start_date: "2025-06-01" },
          { org_id, first_name: "Ben", last_name: "Taylor", email: "ben@chiccit.com.au", employment_type: "part_time", role_title: "Bartender", classification_level: 3, hourly_rate: 25.05, start_date: "2024-11-01" },
          { org_id, first_name: "Nina", last_name: "Patel", email: "nina@chiccit.com.au", employment_type: "part_time", role_title: "FOH", classification_level: 2, hourly_rate: 24.29, start_date: "2025-04-01" },
          // CASUAL (10) — Emma regular pattern, Sophie underpaid, Ryan expired RSA
          { org_id, first_name: "Emma", last_name: "Wilson", email: "emma@chiccit.com.au", employment_type: "casual", role_title: "FOH", classification_level: 2, hourly_rate: 30.36, start_date: "2025-06-01" },
          { org_id, first_name: "Jack", last_name: "Brown", email: "jack@chiccit.com.au", employment_type: "casual", role_title: "FOH", classification_level: 1, hourly_rate: 29.43, start_date: "2025-07-01" },
          { org_id, first_name: "Zoe", last_name: "Anderson", email: "zoe@chiccit.com.au", employment_type: "casual", role_title: "FOH", classification_level: 1, hourly_rate: 29.43, start_date: "2025-08-15" },
          { org_id, first_name: "Liam", last_name: "Garcia", email: "liam@chiccit.com.au", employment_type: "casual", role_title: "Cook", classification_level: 2, hourly_rate: 30.36, start_date: "2025-09-01" },
          { org_id, first_name: "Sophie", last_name: "Lee", email: "sophie@chiccit.com.au", employment_type: "casual", role_title: "FOH", classification_level: 1, hourly_rate: 28.50, start_date: "2025-10-01" },
          { org_id, first_name: "Ryan", last_name: "Davis", email: "ryan@chiccit.com.au", employment_type: "casual", role_title: "Bartender", classification_level: 2, hourly_rate: 30.36, start_date: "2025-10-15" },
          { org_id, first_name: "Mia", last_name: "Thompson", email: "mia@chiccit.com.au", employment_type: "casual", role_title: "FOH", classification_level: 1, hourly_rate: 29.43, start_date: "2025-11-01" },
          { org_id, first_name: "Oscar", last_name: "White", email: "oscar@chiccit.com.au", employment_type: "casual", role_title: "Cook", classification_level: 1, hourly_rate: 29.43, start_date: "2025-11-15" },
          { org_id, first_name: "Isla", last_name: "Clark", email: "isla@chiccit.com.au", employment_type: "casual", role_title: "FOH", classification_level: 1, hourly_rate: 29.43, start_date: "2025-12-01" },
          { org_id, first_name: "Ethan", last_name: "Moore", email: "ethan@chiccit.com.au", employment_type: "casual", role_title: "FOH", classification_level: 1, hourly_rate: 29.43, start_date: "2026-01-10" },
        ];

        const { data: inserted, error } = await supabase.from("employee_profiles").insert(staffMembers).select();
        if (error) { result = { success: false, error: error.message }; break; }

        // Add employee documents — Ryan's RSA expired
        const ryanProfile = inserted?.find(s => s.first_name === "Ryan");
        const benProfile = inserted?.find(s => s.first_name === "Ben");
        const emmaProfile = inserted?.find(s => s.first_name === "Emma");
        
        const docs: any[] = [];
        if (ryanProfile) docs.push({ employee_id: ryanProfile.id, org_id, document_type: "RSA", document_name: "RSA Certificate - Ryan Davis", expiry_date: "2025-11-30", status: "expired" });
        if (benProfile) docs.push({ employee_id: benProfile.id, org_id, document_type: "RSA", document_name: "RSA Certificate - Ben Taylor", expiry_date: "2027-06-30", status: "current" });
        if (emmaProfile) docs.push({ employee_id: emmaProfile.id, org_id, document_type: "RSA", document_name: "RSA Certificate - Emma Wilson", expiry_date: "2027-03-15", status: "current" });
        
        if (docs.length > 0) {
          await supabase.from("employee_documents").insert(docs);
        }

        result = { success: true, count: inserted?.length || 0, documents: docs.length };
        break;
      }

      case 'seed_chiccit_revenue': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const dates = dateRange("2025-12-01", "2026-02-28");
        const orders: any[] = [];
        const payments: any[] = [];
        let orderCount = 0;

        for (const d of dates) {
          const dow = dayName(d);
          if (dow === 'MON') continue; // Closed Mondays

          const month = parseInt(d.split('-')[1]);
          const monthFactor = month === 12 ? 0.92 : month === 1 ? 0.98 : 1.07;

          // Day-of-week revenue targets
          const dayRevenue: Record<string, number> = { TUE: 4200, WED: 4800, THU: 6200, FRI: 8500, SAT: 10200, SUN: 8100 };
          const target = (dayRevenue[dow] || 5000) * monthFactor * (0.85 + Math.random() * 0.30);
          
          // Generate 8-25 orders per day
          const numOrders = randInt(8, 25);
          const avgTicket = target / numOrders;

          for (let i = 0; i < numOrders; i++) {
            const total = Math.round(avgTicket * (0.7 + Math.random() * 0.6) * 100) / 100;
            const isCash = Math.random() < 0.18;
            const orderId = crypto.randomUUID();
            
            // Saturday cash variance: 2.8%
            let paymentAmount = total;
            if (dow === 'SAT' && isCash) {
              paymentAmount = Math.round(total * (1 - 0.028 * Math.random()) * 100) / 100;
            }

            // Occasional voids (2.1% overall, 3.8% Saturday dinner)
            const isVoid = dow === 'SAT' ? Math.random() < 0.038 : Math.random() < 0.021;
            // Occasional discounts (3.2% overall)
            const hasDiscount = Math.random() < 0.032;
            const discountAmount = hasDiscount ? Math.round(total * rand(0.05, 0.20) * 100) / 100 : 0;

            orders.push({
              id: orderId,
              org_id,
              order_number: `ORD-${d.replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
              status: isVoid ? 'voided' : 'completed',
              order_type: Math.random() < 0.65 ? 'dine_in' : Math.random() < 0.8 ? 'takeaway' : 'delivery',
              subtotal: total,
              discount_amount: discountAmount,
              total_amount: Math.max(0, total - discountAmount),
              covers: randInt(1, 4),
              created_at: `${d}T${randInt(11, 21)}:${String(randInt(0, 59)).padStart(2, '0')}:00+10:00`,
            });

            if (!isVoid) {
              payments.push({
                org_id,
                order_id: orderId,
                payment_method: isCash ? 'cash' : 'card',
                amount: Math.max(0, paymentAmount - discountAmount),
                status: 'completed',
                created_at: `${d}T${randInt(11, 22)}:${String(randInt(0, 59)).padStart(2, '0')}:00+10:00`,
              });
            }
            orderCount++;
          }
        }

        // Insert in batches
        for (let i = 0; i < orders.length; i += 500) {
          await supabase.from("pos_orders").insert(orders.slice(i, i + 500));
        }
        for (let i = 0; i < payments.length; i += 500) {
          await supabase.from("pos_payments").insert(payments.slice(i, i + 500));
        }

        result = { success: true, count: orderCount, orders: orders.length, payments: payments.length };
        break;
      }

      case 'seed_chiccit_labour': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        // Get staff for this org
        const { data: staff } = await supabase.from("employee_profiles").select("id, first_name, employment_type").eq("org_id", org_id);
        if (!staff?.length) { result = { success: false, error: "No staff found. Seed staff first." }; break; }

        const dates = dateRange("2025-12-01", "2026-02-28");
        const clockEvents: any[] = [];
        let breakViolations = 0;

        for (const d of dates) {
          const dow = dayName(d);
          if (dow === 'MON') continue;

          // Schedule ~8-12 staff per day
          const dayStaff = staff.slice(0, randInt(8, Math.min(12, staff.length)));

          for (const s of dayStaff) {
            const isLunch = Math.random() < 0.4;
            const startHour = isLunch ? randInt(9, 11) : randInt(15, 17);
            let endHour = isLunch ? randInt(15, 17) : randInt(21, 23);

            // OT pattern on Fri/Sat
            if ((dow === 'FRI' || dow === 'SAT') && !isLunch && Math.random() < 0.4) {
              endHour = Math.min(endHour + randInt(1, 3), 24);
            }

            // 3 break violations (10-hour rule)
            if (breakViolations < 3 && dow === 'FRI' && !isLunch && endHour >= 23 && s.first_name === 'Marco') {
              // Close at 11:30pm, open at 8:30am = 9 hours
              clockEvents.push({
                org_id,
                user_id: s.id,
                event_type: 'clock_in',
                event_time: `${d}T${String(startHour).padStart(2, '0')}:00:00+10:00`,
                shift_date: d,
              });
              clockEvents.push({
                org_id,
                user_id: s.id,
                event_type: 'clock_out',
                event_time: `${d}T23:30:00+10:00`,
                shift_date: d,
                compliance_status: 'break_violation',
              });
              breakViolations++;
              continue;
            }

            clockEvents.push({
              org_id,
              user_id: s.id,
              event_type: 'clock_in',
              event_time: `${d}T${String(startHour).padStart(2, '0')}:${String(randInt(0, 15)).padStart(2, '0')}:00+10:00`,
              shift_date: d,
            });
            clockEvents.push({
              org_id,
              user_id: s.id,
              event_type: 'clock_out',
              event_time: `${d}T${String(Math.min(endHour, 23)).padStart(2, '0')}:${String(randInt(0, 59)).padStart(2, '0')}:00+10:00`,
              shift_date: d,
            });
          }
        }

        // Insert in batches
        for (let i = 0; i < clockEvents.length; i += 500) {
          await supabase.from("clock_events").insert(clockEvents.slice(i, i + 500));
        }

        result = { success: true, count: clockEvents.length, breakViolations };
        break;
      }

      case 'seed_chiccit_overheads': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const recurring = [
          { org_id, category: "Rent", name: "Base Rent", amount: 5500, frequency: "monthly" },
          { org_id, category: "Rent", name: "Outgoings", amount: 1000, frequency: "monthly" },
          { org_id, category: "Utilities", name: "Electricity", amount: 867, frequency: "monthly" },
          { org_id, category: "Utilities", name: "Gas", amount: 325, frequency: "monthly" },
          { org_id, category: "Utilities", name: "Water", amount: 152, frequency: "monthly" },
          { org_id, category: "Insurance", name: "Public Liability", amount: 417, frequency: "monthly" },
          { org_id, category: "Insurance", name: "Workers Comp", amount: 1040, frequency: "monthly" },
          { org_id, category: "Subscriptions", name: "Music Licensing", amount: 65, frequency: "monthly" },
          { org_id, category: "Subscriptions", name: ".iT OS Platform", amount: 230, frequency: "monthly" },
          { org_id, category: "Subscriptions", name: "Internet + Phone", amount: 165, frequency: "monthly" },
          { org_id, category: "Professional", name: "Accountant", amount: 325, frequency: "monthly" },
          { org_id, category: "Licenses", name: "Liquor License", amount: 167, frequency: "monthly" },
          { org_id, category: "Maintenance", name: "Equipment Service", amount: 217, frequency: "monthly" },
          { org_id, category: "Depreciation", name: "Fit-out depreciation", amount: 195, frequency: "monthly" },
        ];

        const { data: inserted, error } = await supabase.from("overhead_recurring").insert(recurring).select();
        if (error) { result = { success: false, error: error.message }; break; }

        // Generate 3 months of overhead entries
        const entries: any[] = [];
        for (const month of ['2025-12', '2026-01', '2026-02']) {
          for (const r of recurring) {
            entries.push({
              org_id,
              category: r.category,
              description: r.name,
              amount: r.amount * (0.95 + Math.random() * 0.10),
              entry_date: `${month}-15`,
              entry_type: 'recurring',
            });
          }
        }

        for (let i = 0; i < entries.length; i += 200) {
          await supabase.from("overhead_entries").insert(entries.slice(i, i + 200));
        }

        result = { success: true, count: (inserted?.length || 0), entries: entries.length };
        break;
      }

      case 'seed_chiccit_pnl': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const dates = dateRange("2025-12-01", "2026-02-28");
        const snapshots: any[] = [];

        for (const d of dates) {
          const dow = dayName(d);
          if (dow === 'MON') continue;

          const month = parseInt(d.split('-')[1]);
          const monthFactor = month === 12 ? 0.92 : month === 1 ? 0.98 : 1.07;
          const dayRevenue: Record<string, number> = { TUE: 4200, WED: 4800, THU: 6200, FRI: 8500, SAT: 10200, SUN: 8100 };
          const revenue = (dayRevenue[dow] || 5000) * monthFactor * (0.9 + Math.random() * 0.2);

          // Food cost creeping: Dec 28.4%, Jan 30.1%, Feb 33.2%
          const foodCostPct = month === 12 ? 0.284 : month === 1 ? 0.301 : 0.332;
          // Labour cost: Dec 27.8%, Jan 28.6%, Feb 29.5%
          const labourCostPct = month === 12 ? 0.278 : month === 1 ? 0.286 : 0.295;

          const foodCost = revenue * foodCostPct * (0.95 + Math.random() * 0.10);
          const bevCost = revenue * 0.22 * (0.95 + Math.random() * 0.10);
          const labourCost = revenue * labourCostPct * (0.95 + Math.random() * 0.10);
          const overheads = revenue * 0.16 * (0.95 + Math.random() * 0.10);
          const netProfit = revenue - foodCost - bevCost - labourCost - overheads;

          snapshots.push({
            org_id,
            snapshot_date: d,
            period_type: 'daily',
            revenue: Math.round(revenue * 100) / 100,
            food_cost: Math.round(foodCost * 100) / 100,
            bev_cost: Math.round(bevCost * 100) / 100,
            labour_cost: Math.round(labourCost * 100) / 100,
            overhead_cost: Math.round(overheads * 100) / 100,
            net_profit: Math.round(netProfit * 100) / 100,
            food_cost_pct: Math.round(foodCostPct * 1000) / 10,
            labour_cost_pct: Math.round(labourCostPct * 1000) / 10,
          });
        }

        for (let i = 0; i < snapshots.length; i += 200) {
          await supabase.from("pnl_snapshots").insert(snapshots.slice(i, i + 200));
        }

        result = { success: true, count: snapshots.length };
        break;
      }

      case 'seed_chiccit_bev': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const products = [
          { org_id, name: "Penfolds Bin 389 2020", main_category: "wine", sub_category: "red", purchase_price: 45, sell_price: 18, bottle_size_ml: 750, pour_size_ml: 150, pours_per_unit: 5 },
          { org_id, name: "Cloudy Bay Sauv Blanc 2023", main_category: "wine", sub_category: "white", purchase_price: 28, sell_price: 14, bottle_size_ml: 750, pour_size_ml: 150, pours_per_unit: 5 },
          { org_id, name: "Veuve Clicquot NV", main_category: "wine", sub_category: "sparkling", purchase_price: 55, sell_price: 22, bottle_size_ml: 750, pour_size_ml: 150, pours_per_unit: 5 },
          // Dead stock wines (not sold 90+ days)
          { org_id, name: "Château Margaux 2015", main_category: "wine", sub_category: "red", purchase_price: 180, sell_price: 45, bottle_size_ml: 750, pour_size_ml: 150, pours_per_unit: 5 },
          { org_id, name: "Opus One 2018", main_category: "wine", sub_category: "red", purchase_price: 350, sell_price: 85, bottle_size_ml: 750, pour_size_ml: 150, pours_per_unit: 5 },
          { org_id, name: "Dom Pérignon 2012", main_category: "wine", sub_category: "sparkling", purchase_price: 280, sell_price: 65, bottle_size_ml: 750, pour_size_ml: 150, pours_per_unit: 5 },
          // Spirits
          { org_id, name: "Hendrick's Gin", main_category: "spirit", sub_category: "gin", purchase_price: 55, sell_price: 14, bottle_size_ml: 700, pour_size_ml: 30, pours_per_unit: 23 },
          { org_id, name: "Campari", main_category: "spirit", sub_category: "aperitif", purchase_price: 35, sell_price: 12, bottle_size_ml: 700, pour_size_ml: 30, pours_per_unit: 23 },
          { org_id, name: "Patron Silver", main_category: "spirit", sub_category: "tequila", purchase_price: 65, sell_price: 16, bottle_size_ml: 700, pour_size_ml: 30, pours_per_unit: 23 },
          { org_id, name: "Ketel One Vodka", main_category: "spirit", sub_category: "vodka", purchase_price: 45, sell_price: 12, bottle_size_ml: 700, pour_size_ml: 30, pours_per_unit: 23 },
        ];

        const { data: inserted, error } = await supabase.from("bev_products").insert(products).select();
        if (error) { result = { success: false, error: error.message }; break; }

        // Cellar items - dead stock for expensive wines
        const cellarItems: any[] = [];
        for (const p of inserted || []) {
          const isDeadStock = ['Château Margaux 2015', 'Opus One 2018', 'Dom Pérignon 2012'].includes(p.name);
          cellarItems.push({
            org_id,
            product_id: p.id,
            quantity: isDeadStock ? 2 : randInt(3, 12),
            received_date: isDeadStock ? '2025-09-01' : `2026-0${randInt(1, 2)}-${String(randInt(1, 28)).padStart(2, '0')}`,
            location: isDeadStock ? 'Back cellar' : 'Main cellar',
          });
        }
        await supabase.from("bev_cellar").insert(cellarItems);

        // Stocktake
        const { data: stocktake } = await supabase.from("bev_stocktakes").insert({
          org_id, date: '2026-02-28', status: 'completed', count_type: 'full',
        }).select().single();

        if (stocktake) {
          const stItems = (inserted || []).map(p => ({
            org_id,
            stocktake_id: stocktake.id,
            product_id: p.id,
            expected_qty: randInt(3, 12),
            counted_qty: randInt(2, 12),
            variance: 0,
            variance_cost: 0,
          }));
          // Calc variance
          stItems.forEach(i => {
            i.variance = i.counted_qty - i.expected_qty;
            i.variance_cost = i.variance * (products.find(p => p.name === (inserted || []).find(ip => ip.id === i.product_id)?.name)?.purchase_price || 0);
          });
          await supabase.from("bev_stocktake_items").insert(stItems);
        }

        result = { success: true, count: inserted?.length || 0, cellar: cellarItems.length };
        break;
      }

      case 'seed_chiccit_reservations': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const dates = dateRange("2025-12-01", "2026-02-28");
        const reservations: any[] = [];

        for (const d of dates) {
          const dow = dayName(d);
          if (dow === 'MON') continue;

          const numBookings = { TUE: 4, WED: 5, THU: 8, FRI: 12, SAT: 15, SUN: 10 }[dow] || 5;
          
          for (let i = 0; i < numBookings; i++) {
            const isNoShow = Math.random() < 0.042; // 4.2% no-show
            const hour = randInt(11, 20);
            reservations.push({
              org_id,
              guest_name: `Guest ${d}-${i}`,
              guest_phone: `04${randInt(10000000, 99999999)}`,
              party_size: randInt(1, 6),
              reservation_date: d,
              reservation_time: `${String(hour).padStart(2, '0')}:${Math.random() < 0.5 ? '00' : '30'}:00`,
              status: isNoShow ? 'no_show' : Math.random() < 0.9 ? 'completed' : 'cancelled',
              source: ['direct', 'website', 'google', 'instagram', 'opentable'][randInt(0, 4)],
            });
          }
        }

        for (let i = 0; i < reservations.length; i += 500) {
          await supabase.from("res_reservations").insert(reservations.slice(i, i + 500));
        }

        result = { success: true, count: reservations.length };
        break;
      }

      case 'seed_chiccit_marketing': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        // Campaigns — intentionally NO Tue/Wed targeting
        const campaigns = [
          { org_id, name: "Christmas Special Menu", campaign_type: "email", status: "completed", start_date: "2025-12-01", end_date: "2025-12-25", budget: 800, spend: 750, impressions: 12000, clicks: 480, conversions: 48 },
          { org_id, name: "NYE Dinner Package", campaign_type: "social", status: "completed", start_date: "2025-12-20", end_date: "2025-12-31", budget: 500, spend: 480, impressions: 8500, clicks: 340, conversions: 34 },
          { org_id, name: "January Wine Night", campaign_type: "email", status: "completed", start_date: "2026-01-10", end_date: "2026-01-31", budget: 400, spend: 380, impressions: 6000, clicks: 240, conversions: 24 },
          { org_id, name: "Valentine's Day", campaign_type: "social", status: "completed", start_date: "2026-02-01", end_date: "2026-02-14", budget: 600, spend: 550, impressions: 15000, clicks: 750, conversions: 68 },
          { org_id, name: "Weekend Brunch Launch", campaign_type: "social", status: "active", start_date: "2026-02-15", end_date: "2026-03-15", budget: 500, spend: 200, impressions: 4000, clicks: 200, conversions: 18 },
          // No Tue/Wed campaigns — this is the intentional gap
        ];

        const { data: inserted, error } = await supabase.from("growth_campaigns").insert(campaigns).select();
        result = { success: !error, count: inserted?.length || 0, error: error?.message };
        break;
      }

      case 'seed_chiccit_audit_scores': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const dates = dateRange("2025-12-01", "2026-02-28");
        const scores: any[] = [];

        for (const d of dates) {
          const dow = dayName(d);
          if (dow === 'MON') continue;

          const dayNum = dates.indexOf(d);
          const trend = dayNum / dates.length; // 0 to 1 over 90 days

          scores.push({
            org_id,
            period_date: d,
            period_type: 'daily',
            overall_score: Math.round(65 + trend * 11 + rand(-3, 3)),
            food_score: Math.round(70 + trend * 4 + rand(-4, 4)),
            bev_score: Math.round(75 + trend * 3 + rand(-3, 3)),
            labour_score: Math.round(48 + trend * 5 + rand(-4, 4)),
            overhead_score: Math.round(70 + trend * 4 + rand(-3, 3)),
            service_score: Math.round(85 + trend * 3 + rand(-3, 3)),
            marketing_score: Math.round(60 + trend * 5 + rand(-4, 4)),
            // 🔴 INTENTIONALLY WRONG: compliance score 92 instead of ~55
            compliance_score: Math.round(88 + trend * 4 + rand(-2, 2)),
            trend_direction: trend > 0.5 ? 'improving' : 'stable',
          });
        }

        for (let i = 0; i < scores.length; i += 200) {
          await supabase.from("audit_scores").insert(scores.slice(i, i + 200));
        }

        result = { success: true, count: scores.length };
        break;
      }

      case 'seed_chiccit_full': {
        // Master action — run all CHICC.iT seeds in sequence
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const actions = [
          'seed_chiccit_staff', 'seed_chiccit_revenue', 'seed_chiccit_labour',
          'seed_chiccit_overheads', 'seed_chiccit_pnl', 'seed_chiccit_bev',
          'seed_chiccit_reservations', 'seed_chiccit_marketing', 'seed_chiccit_audit_scores',
        ];

        const results: Record<string, any> = {};
        for (const a of actions) {
          try {
            const { data: res, error } = await supabase.functions.invoke("seed-data", {
              body: { action: a, data: { org_id } },
            });
            results[a] = error ? { error: error.message } : res;
          } catch (e: any) {
            results[a] = { error: e.message };
          }
        }

        result = { success: true, results };
        break;
      }

      // ── Nuke ALL data (ordered to respect FK constraints) ──
      case 'nuke_all': {
        const { org_id } = data || {};
        const nukeOrder = [
          // Children first (FK dependencies)
          'pos_order_items', 'pos_order_events', 'pos_audit_events',
          'pos_payments', 'pos_orders', 'pos_tabs',
          'pos_modifiers', 'pos_modifier_groups', 'pos_menu_items', 'pos_categories',
          'bev_stocktake_items', 'bev_stocktakes', 'bev_pour_events', 'bev_waste_events',
          'bev_open_bottles', 'bev_keg_tracking', 'bev_cellar',
          'bev_cocktail_ingredients', 'bev_cocktail_specs', 'bev_prebatch_logs',
          'bev_coffee_dialing', 'bev_coffee_details', 'bev_beer_details', 'bev_wine_details',
          'bev_line_cleaning_log', 'bev_bar_prep', 'bev_run_sheet_tasks', 'bev_run_sheets',
          'bev_flash_cards', 'bev_coravin_capsules', 'bev_vendor_orders', 'bev_products',
          'recipe_ingredients', 'recipes', 'ingredients',
          'clock_events', 'employee_documents', 'employee_profiles',
          'overhead_entries', 'overhead_recurring',
          'pnl_snapshots',
          'audit_sub_scores', 'audit_scores',
          'res_reservations',
          'growth_campaigns',
          'demand_insights',
          'food_safety_alerts',
          'cleaning_inventory',
          'inventory',
          'calendar_events',
          'activity_log',
          'absence_records',
        ];
        const errors: string[] = [];
        const cleared: string[] = [];
        for (const table of nukeOrder) {
          try {
            const q = org_id
              ? supabase.from(table).delete().eq('org_id', org_id)
              : supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { error } = await q;
            if (error) {
              // Some tables might not have org_id, try without filter
              if (org_id && error.message.includes('org_id')) {
                const { error: e2 } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (e2) errors.push(`${table}: ${e2.message}`);
                else cleared.push(table);
              } else {
                errors.push(`${table}: ${error.message}`);
              }
            } else {
              cleared.push(table);
            }
          } catch (e: any) {
            errors.push(`${table}: ${e.message}`);
          }
        }
        result = { success: errors.length === 0, cleared: cleared.length, errors, tables: cleared };
        break;
      }

      // ── Clear table ────────────────────────────────────
      case 'clear_table': {
        const { table } = data;
        const allowedTables = [
          'ingredients', 'recipes', 'vendor_deals', 'inventory', 'demand_insights',
          'pos_menu_items', 'pos_categories', 'pos_modifiers', 'pos_modifier_groups',
          'employee_profiles', 'employee_documents', 'clock_events',
          'pos_orders', 'pos_payments', 'overhead_recurring', 'overhead_entries',
          'pnl_snapshots', 'bev_products', 'bev_cellar', 'bev_stocktakes', 'bev_stocktake_items',
          'res_reservations', 'growth_campaigns', 'audit_scores',
        ];
        if (!allowedTables.includes(table)) { result = { success: false, error: `Table ${table} not allowed` }; break; }
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        result = { success: !error, error: error?.message };
        break;
      }

      // ════════════════════════════════════════════════════════════
      // E2E TEST PLAN SEEDS — 200 users / 40 orgs
      // ════════════════════════════════════════════════════════════

      case 'seed_todo_items': {
        const { org_id, user_id, count = 50 } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const today = new Date();
        const categories = ['tasks', 'shopping'];
        const priorities = ['high', 'medium', 'low'];
        const statuses = ['pending', 'in_progress', 'done'];
        const todoItems: any[] = [];

        const taskTitles = [
          "Check stock levels", "Prep mise en place", "Deep clean fryer", "Order fresh produce",
          "Update recipe cards", "Sharpen knives", "Label and date containers", "Rotate walk-in stock",
          "Clean extraction hood", "Calibrate thermometers", "Review supplier invoices",
          "Train new hire on station", "Portion control audit", "Check allergen labels",
          "Update menu board", "Clean cold room", "Organize dry store", "Check gas connections",
          "Equipment maintenance check", "Update waste log", "Prep sauces for service",
          "Restock bar", "Polish cutlery", "Iron table linens", "Check reservations",
          "Brief FOH team", "Update social media", "Review food cost report",
          "Prepare daily specials", "Check dish machine chemicals", "Count linen stock",
          "Clean coffee machine", "Restock paper goods", "Check pest traps",
          "Update training records", "Review feedback cards", "Prepare staff meals",
          "Organize walk-in cooler", "Check expiry dates", "File delivery receipts",
          "Polish glassware", "Set up function room", "Prep dessert garnishes",
          "Review next week roster", "Order cleaning supplies", "Test fire extinguishers",
          "Check first aid kit", "Update HACCP log", "Brief evening team",
          "Close and balance register",
        ];
        const shoppingTitles = [
          "Olive oil (5L)", "Butter (2kg)", "Fresh basil (5 bunches)", "Lemons (box 20)",
          "Chicken breast (10kg)", "Salmon fillets (5kg)", "Arborio rice (5kg)",
          "Heavy cream (5L)", "Parmesan wheel", "Shallots (2kg)", "Garlic (2kg)",
          "Cherry tomatoes (3 punnets)", "Mixed lettuce (4 boxes)", "Sourdough (10 loaves)",
          "Free-range eggs (10 doz)", "Wagyu scotch fillet (8 portions)", "Barramundi (6 fillets)",
          "Duck breast (8 portions)", "Truffle oil (500ml)", "Saffron (10g)",
        ];

        for (let i = 0; i < count; i++) {
          const isShopping = i >= count * 0.7; // 30% shopping items
          const dayOffset = Math.floor(i / 8) - 3; // spread across a week
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + dayOffset);
          const titles = isShopping ? shoppingTitles : taskTitles;

          todoItems.push({
            org_id,
            user_id: user_id || null,
            title: titles[i % titles.length],
            category: isShopping ? 'shopping' : 'tasks',
            priority: priorities[i % 3],
            status: statuses[Math.floor(Math.random() * 3)],
            due_date: dueDate.toISOString().split('T')[0],
            description: i % 5 === 0 ? `Auto-seeded task #${i + 1} for E2E testing` : null,
          });
        }

        for (let i = 0; i < todoItems.length; i += 200) {
          await supabase.from("todo_items").insert(todoItems.slice(i, i + 200));
        }
        result = { success: true, count: todoItems.length };
        break;
      }

      case 'seed_todo_recurring_rules': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const rules = [
          { org_id, title: "Morning mise en place", frequency: "daily", time_of_day: "06:00", category: "tasks", priority: "high", is_active: true },
          { org_id, title: "Weekly deep clean", frequency: "weekly", day_of_week: 1, time_of_day: "08:00", category: "tasks", priority: "high", is_active: true },
          { org_id, title: "Weekly stock order", frequency: "weekly", day_of_week: 2, time_of_day: "09:00", category: "shopping", priority: "medium", is_active: true },
          { org_id, title: "Daily temp checks", frequency: "daily", time_of_day: "07:00", category: "tasks", priority: "high", is_active: true },
          { org_id, title: "Monthly equipment audit", frequency: "monthly", day_of_month: 1, time_of_day: "10:00", category: "tasks", priority: "medium", is_active: true },
          { org_id, title: "Fortnightly linen order", frequency: "fortnightly", time_of_day: "09:00", category: "shopping", priority: "low", is_active: false },
        ];

        const { data: inserted, error } = await supabase.from("todo_recurring_rules").insert(rules).select();
        result = { success: !error, count: inserted?.length || 0, error: error?.message };
        break;
      }

      case 'seed_delegated_tasks': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const { data: members } = await supabase.from("org_memberships").select("user_id, role").eq("org_id", org_id).limit(5);
        if (!members?.length || members.length < 2) { result = { success: false, error: "Need at least 2 members" }; break; }

        const tasks = [
          { title: "Prep soup base for lunch", priority: "high" },
          { title: "Restock dessert station", priority: "medium" },
          { title: "Update allergen board", priority: "high" },
          { title: "Polish silver service", priority: "low" },
          { title: "Brief evening FOH team", priority: "medium" },
        ];

        const delegated = tasks.map((t, i) => ({
          org_id,
          title: t.title,
          priority: t.priority,
          assigned_by: members[0].user_id,
          assigned_to: members[(i % (members.length - 1)) + 1].user_id,
          status: i < 2 ? "done" : "pending",
          due_date: new Date().toISOString().split('T')[0],
        }));

        const { data: inserted, error } = await supabase.from("delegated_tasks").insert(delegated).select();
        result = { success: !error, count: inserted?.length || 0, error: error?.message };
        break;
      }

      case 'seed_gcc_compliance': {
        const { org_id, emirate = "dubai" } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const dates = dateRange("2026-01-01", "2026-02-25");
        const logs: any[] = [];

        for (const d of dates) {
          logs.push({
            org_id,
            log_date: d,
            emirate,
            fridge_temp: 3 + Math.random() * 4,
            freezer_temp: -20 + Math.random() * 4,
            hot_hold_temp: 60 + Math.random() * 10,
            staff_hygiene_check: Math.random() > 0.05,
            halal_verified: Math.random() > 0.02,
            pest_check: Math.random() > 0.1,
            logged_by: "system",
          });
        }

        for (let i = 0; i < logs.length; i += 200) {
          await supabase.from("gcc_compliance_logs").insert(logs.slice(i, i + 200));
        }

        // Halal certificates
        const certs = [
          { org_id, supplier_name: "Premium Meats UAE", certificate_number: "HAL-2026-001", expiry_date: "2027-06-30", status: "current" },
          { org_id, supplier_name: "Gulf Seafood Co", certificate_number: "HAL-2025-089", expiry_date: "2026-01-15", status: "expired" },
          { org_id, supplier_name: "Fresh Poultry LLC", certificate_number: "HAL-2026-042", expiry_date: "2027-03-20", status: "current" },
        ];
        await supabase.from("gcc_halal_certificates").insert(certs);

        // Inspection grades
        const grades = emirate === "dubai"
          ? [{ org_id, inspection_date: "2026-01-15", grade: "A", score: 94, inspector: "DM Inspector", emirate }]
          : [{ org_id, inspection_date: "2026-01-15", stars: 4, score: 88, inspector: "ADAFSA Inspector", emirate }];
        await supabase.from("gcc_inspection_grades").insert(grades);

        // Staff medical certs
        const medCerts = [
          { org_id, staff_name: "Ahmed Hassan", certificate_type: "medical_fitness", expiry_date: "2027-01-10", status: "current" },
          { org_id, staff_name: "Fatima Ali", certificate_type: "medical_fitness", expiry_date: "2025-12-01", status: "expired" },
          { org_id, staff_name: "Mohammed Khan", certificate_type: "medical_fitness", expiry_date: "2027-06-15", status: "current" },
        ];
        await supabase.from("gcc_staff_medical_certs").insert(medCerts);

        result = { success: true, logs: logs.length, certs: certs.length, grades: grades.length, medCerts: medCerts.length };
        break;
      }

      case 'seed_home_cook': {
        // Lightweight seed for home cook orgs — just ingredients + recipes + a few todos
        const { org_id, user_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const ingredients = [
          { org_id, name: "Olive Oil", category: "Pantry", unit: "bottle", cost_per_unit: 8.5 },
          { org_id, name: "Butter", category: "Dairy", unit: "block", cost_per_unit: 4.5 },
          { org_id, name: "Garlic", category: "Produce", unit: "head", cost_per_unit: 1.0 },
          { org_id, name: "Onion", category: "Produce", unit: "each", cost_per_unit: 0.8 },
          { org_id, name: "Chicken Breast", category: "Meat", unit: "kg", cost_per_unit: 12.0 },
          { org_id, name: "Pasta", category: "Pantry", unit: "packet", cost_per_unit: 2.5 },
          { org_id, name: "Tinned Tomatoes", category: "Pantry", unit: "can", cost_per_unit: 1.5 },
          { org_id, name: "Rice", category: "Pantry", unit: "kg", cost_per_unit: 3.0 },
          { org_id, name: "Eggs", category: "Dairy", unit: "dozen", cost_per_unit: 5.5 },
          { org_id, name: "Milk", category: "Dairy", unit: "L", cost_per_unit: 2.5 },
        ];
        await supabase.from("ingredients").insert(ingredients);

        const recipes = [
          { org_id, name: "Pasta Bolognese", category: "Dinner", description: "Classic family bolognese", prep_time: 10, cook_time: 30, servings: 4 },
          { org_id, name: "Chicken Stir Fry", category: "Dinner", description: "Quick weeknight stir fry", prep_time: 15, cook_time: 10, servings: 4 },
          { org_id, name: "Scrambled Eggs", category: "Breakfast", description: "Fluffy scrambled eggs", prep_time: 2, cook_time: 5, servings: 2 },
          { org_id, name: "Fried Rice", category: "Dinner", description: "Easy leftover fried rice", prep_time: 5, cook_time: 10, servings: 4 },
          { org_id, name: "Banana Pancakes", category: "Breakfast", description: "Healthy banana pancakes", prep_time: 5, cook_time: 10, servings: 2 },
        ];
        await supabase.from("recipes").insert(recipes);

        // A few todo items
        const todos = [
          { org_id, user_id, title: "Meal plan for the week", category: "tasks", priority: "high", status: "pending", due_date: new Date().toISOString().split('T')[0] },
          { org_id, user_id, title: "Buy chicken and veggies", category: "shopping", priority: "medium", status: "pending", due_date: new Date().toISOString().split('T')[0] },
          { org_id, user_id, title: "Try new pasta recipe", category: "tasks", priority: "low", status: "pending", due_date: new Date().toISOString().split('T')[0] },
        ];
        await supabase.from("todo_items").insert(todos);

        result = { success: true, ingredients: ingredients.length, recipes: recipes.length, todos: todos.length };
        break;
      }

      case 'seed_feature_releases': {
        const modules = [
          "chef", "bev", "clock", "labour", "people", "supply", "growth",
          "money", "quiet", "overhead", "reservation", "venueflow", "restos",
          "vendor", "admin", "games", "food-safety", "training", "marketplace",
        ];
        const releases = modules.map(m => ({
          module: m,
          status: "released",
          released_at: new Date().toISOString(),
        }));
        // Upsert — don't fail if some exist
        for (const r of releases) {
          await supabase.from("feature_releases").upsert(r, { onConflict: "module" });
        }
        result = { success: true, count: releases.length };
        break;
      }

      case 'seed_email_templates': {
        const templates = [
          { slug: "welcome", subject: "Welcome to ChefOS, {{chef_name}}!", body_html: "<h1>Welcome to ChefOS</h1><p>Hi {{chef_name}}, your org {{org_name}} is ready.</p><p><a href='{{app_url}}/dashboard'>Go to Dashboard</a></p>" },
          { slug: "invite", subject: "You're invited to join {{org_name}}", body_html: "<h1>Team Invite</h1><p>Hi, you've been invited to join {{org_name}} on ChefOS.</p><p><a href='{{join_url}}'>Accept Invite</a></p>" },
          { slug: "roster", subject: "Your roster for {{week_start}}", body_html: "<h1>Roster Update</h1><p>Hi {{chef_name}}, your shifts for the week of {{week_start}} are ready.</p>" },
          { slug: "report", subject: "{{report_type}} Report - {{org_name}}", body_html: "<h1>{{report_type}} Report</h1><p>Here is your {{report_type}} report for {{org_name}}.</p>" },
          { slug: "onboarding", subject: "Getting started with ChefOS", body_html: "<h1>Welcome aboard!</h1><p>Hi {{chef_name}}, here's your onboarding pack for {{org_name}}.</p>" },
        ];
        for (const t of templates) {
          await supabase.from("email_templates").upsert(t, { onConflict: "slug" });
        }
        result = { success: true, count: templates.length };
        break;
      }

      case 'seed_vendor': {
        const { org_id } = data || {};
        if (!org_id) { result = { success: false, error: "org_id required" }; break; }

        const products = [
          { org_id, name: "Premium Olive Oil 5L", category: "Oils", unit_price: 42.50, unit: "bottle", min_order: 2 },
          { org_id, name: "Organic Butter 5kg", category: "Dairy", unit_price: 45.00, unit: "block", min_order: 1 },
          { org_id, name: "Free Range Chicken Breast 10kg", category: "Meat", unit_price: 120.00, unit: "box", min_order: 1 },
          { org_id, name: "Atlantic Salmon Fillet 5kg", category: "Seafood", unit_price: 160.00, unit: "box", min_order: 1 },
          { org_id, name: "Mixed Lettuce Box", category: "Produce", unit_price: 18.00, unit: "box", min_order: 2 },
          { org_id, name: "Cherry Tomatoes 3kg", category: "Produce", unit_price: 15.00, unit: "box", min_order: 1 },
          { org_id, name: "Arborio Rice 10kg", category: "Dry Goods", unit_price: 35.00, unit: "bag", min_order: 1 },
          { org_id, name: "Fresh Herbs Assorted", category: "Herbs", unit_price: 12.00, unit: "bunch", min_order: 5 },
        ];
        await supabase.from("vendor_products").insert(products);

        const deals = [
          { org_id, title: "February Seafood Special", discount_pct: 15, min_spend: 200, valid_from: "2026-02-01", valid_to: "2026-02-28", status: "active" },
          { org_id, title: "New Customer Welcome", discount_pct: 10, min_spend: 100, valid_from: "2026-01-01", valid_to: "2026-12-31", status: "active" },
        ];
        await supabase.from("vendor_deals").insert(deals);

        result = { success: true, products: products.length, deals: deals.length };
        break;
      }

      case 'seed_admin': {
        // Seed admin-specific data — landing pages, site pages, email templates
        const landingSections = [
          { section_key: "hero", title: "ChefOS - Your Kitchen OS", subtitle: "Manage your kitchen like a pro", is_visible: true, sort_order: 1, content: { cta_text: "Get Started", cta_url: "/auth" } },
          { section_key: "features", title: "Features", subtitle: "Everything you need", is_visible: true, sort_order: 2, content: { items: ["Recipes", "Inventory", "Costing", "Prep Lists"] } },
          { section_key: "pricing", title: "Simple Pricing", subtitle: "One plan, everything included", is_visible: true, sort_order: 3, content: { price: "Free", period: "forever" } },
        ];
        for (const table of ['gcc_chefos_landing_sections', 'indian_chefos_landing_sections', 'homechef_landing_sections']) {
          for (const s of landingSections) {
            await supabase.from(table).upsert({ ...s }, { onConflict: "section_key" });
          }
        }

        const sitePages = [
          { slug: "terms", title: "Terms & Conditions", body_html: "<h1>Terms</h1><p>Standard terms of service for ChefOS platform.</p>", is_published: true },
          { slug: "privacy", title: "Privacy Policy", body_html: "<h1>Privacy</h1><p>We respect your privacy and protect your data.</p>", is_published: true },
          { slug: "faq", title: "FAQ", body_html: "<h1>Frequently Asked Questions</h1><p>Common questions answered.</p>", is_published: true },
        ];
        for (const p of sitePages) {
          await supabase.from("site_pages").upsert(p, { onConflict: "slug" });
        }

        result = { success: true, landingSections: landingSections.length * 3, sitePages: sitePages.length };
        break;
      }

      case 'seed_200_test_plan': {
        // Master action: create 40 orgs and 200 users for E2E test plan.
        // This is called from Playwright global-setup.ts.
        // Expects: { orgs: Array<{ slug, name, store_mode, roles: Array<{ email, password, role }>, seed_action }> }
        const { orgs } = data || {};
        if (!orgs?.length) { result = { success: false, error: "orgs array required" }; break; }

        const orgResults: Record<string, any> = {};

        for (const orgDef of orgs) {
          try {
            // 1. Create org
            const { data: org, error: orgErr } = await supabase
              .from("organizations")
              .insert({ slug: orgDef.slug, name: orgDef.name, store_mode: orgDef.store_mode })
              .select()
              .single();
            if (orgErr) { orgResults[orgDef.slug] = { error: orgErr.message }; continue; }

            // 2. Create users and memberships
            let userCount = 0;
            for (const roleDef of orgDef.roles) {
              const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                email: roleDef.email,
                password: roleDef.password,
                email_confirm: true,
                user_metadata: { org_name: orgDef.name, store_mode: orgDef.store_mode },
              });
              if (authErr) { continue; }

              // Create profile
              await supabase.from("profiles").upsert({
                user_id: authData.user.id,
                display_name: roleDef.email.split("@")[0].replace(/[-_]/g, " "),
                email: roleDef.email,
              }, { onConflict: "user_id" });

              // Create membership
              await supabase.from("org_memberships").insert({
                org_id: org.id,
                user_id: authData.user.id,
                role: roleDef.role,
              });
              userCount++;
            }

            // 3. Run seed action if specified
            if (orgDef.seed_action && orgDef.seed_action !== "none") {
              try {
                const seedBody: any = { action: orgDef.seed_action, data: { org_id: org.id } };
                // For GCC orgs, pass emirate
                if (orgDef.seed_action === "seed_gcc_compliance" && orgDef.emirate) {
                  seedBody.data.emirate = orgDef.emirate;
                }
                // Recursively call ourselves (in-process)
                // Since we're in the same function, we just match the action
                // This is handled by the caller invoking individual seed actions
              } catch (e: any) {
                // Non-fatal
              }
            }

            orgResults[orgDef.slug] = { success: true, orgId: org.id, users: userCount };
          } catch (e: any) {
            orgResults[orgDef.slug] = { error: e.message };
          }
        }

        result = { success: true, orgs: Object.keys(orgResults).length, results: orgResults };
        break;
      }

      default:
        result = { success: false, error: 'Unknown action' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
