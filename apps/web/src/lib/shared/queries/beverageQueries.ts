// Beverage queries — uses `as any` casts because bev_* tables
// are not yet in the auto-generated Supabase types file.
// Once the migration runs and types regenerate, remove the casts.

import { supabase } from '../supabaseClient';

const from = (table: string) => (supabase as any).from(table);

// ── Products ──
export const fetchBevProducts = async (orgId: string) =>
  from('bev_products').select('*').eq('org_id', orgId).order('name');

export const fetchBevProductsByCategory = async (orgId: string, category: string) =>
  from('bev_products').select('*').eq('org_id', orgId).eq('main_category', category).order('name');

export const upsertBevProduct = async (product: Record<string, unknown>) =>
  from('bev_products').upsert(product).select().single();

export const deleteBevProduct = async (id: string) =>
  from('bev_products').delete().eq('id', id);

// ── Wine Details ──
export const fetchWineDetails = async (productId: string) =>
  from('bev_wine_details').select('*').eq('product_id', productId).maybeSingle();

export const upsertWineDetails = async (details: Record<string, unknown>) =>
  from('bev_wine_details').upsert(details).select().single();

// ── Beer Details ──
export const fetchBeerDetails = async (productId: string) =>
  from('bev_beer_details').select('*').eq('product_id', productId).maybeSingle();

// ── Coffee Details ──
export const fetchCoffeeDetails = async (productId: string) =>
  from('bev_coffee_details').select('*').eq('product_id', productId).maybeSingle();

// ── Cellar ──
export const fetchCellar = async (orgId: string) =>
  from('bev_cellar').select('*, bev_products(*)').eq('org_id', orgId).order('created_at', { ascending: false });

// ── Open Bottles ──
export const fetchOpenBottles = async (orgId: string) =>
  from('bev_open_bottles').select('*, bev_products(*)').eq('org_id', orgId).order('opened_at', { ascending: false });

// ── Pour Events ──
export const insertPourEvent = async (event: Record<string, unknown>) =>
  from('bev_pour_events').insert(event).select().single();

export const fetchPourEvents = async (orgId: string, shiftDate?: string) => {
  let q = from('bev_pour_events').select('*, bev_products(name)').eq('org_id', orgId).order('created_at', { ascending: false });
  if (shiftDate) q = q.eq('shift_date', shiftDate);
  return q;
};

// ── Cocktail Specs ──
export const fetchCocktailSpecs = async (orgId: string) =>
  from('bev_cocktail_specs').select('*').eq('org_id', orgId).order('name');

export const upsertCocktailSpec = async (spec: Record<string, unknown>) =>
  from('bev_cocktail_specs').upsert(spec).select().single();

export const fetchCocktailIngredients = async (specId: string) =>
  from('bev_cocktail_ingredients').select('*, bev_products(name)').eq('spec_id', specId);

// ── Keg Tracking ──
export const fetchActiveKegs = async (orgId: string) =>
  from('bev_keg_tracking').select('*, bev_products(name)').eq('org_id', orgId).is('kicked_at', null).order('tapped_at', { ascending: false });

// ── Line Cleaning ──
export const fetchLineCleaningLogs = async (orgId: string) =>
  from('bev_line_cleaning_log').select('*').eq('org_id', orgId).order('cleaned_at', { ascending: false });

// ── Coffee Dialing ──
export const fetchCoffeeDialingLogs = async (orgId: string) =>
  from('bev_coffee_dialing').select('*, bev_products(name)').eq('org_id', orgId).order('created_at', { ascending: false });

export const insertCoffeeDialing = async (log: Record<string, unknown>) =>
  from('bev_coffee_dialing').insert(log).select().single();

// ── Waste Events ──
export const insertWasteEvent = async (event: Record<string, unknown>) =>
  from('bev_waste_events').insert(event).select().single();

// ── Bar Prep ──
export const fetchBarPrep = async (orgId: string, date: string) =>
  from('bev_bar_prep').select('*').eq('org_id', orgId).eq('date', date).order('created_at');

// ── Stocktakes ──
export const fetchStocktakes = async (orgId: string) =>
  from('bev_stocktakes').select('*').eq('org_id', orgId).order('date', { ascending: false });

export const fetchStocktakeItems = async (stocktakeId: string) =>
  from('bev_stocktake_items').select('*, bev_products(name)').eq('stocktake_id', stocktakeId);

// ── Coravin Capsules ──
export const fetchCoravinCapsules = async (orgId: string) =>
  from('bev_coravin_capsules').select('*').eq('org_id', orgId);

// ── Flash Cards ──
export const fetchFlashCards = async (orgId: string, category?: string) => {
  let q = from('bev_flash_cards').select('*').eq('org_id', orgId).order('title');
  if (category) q = q.eq('category', category);
  return q;
};

// ── Vendor Pricing ──
export const fetchBevVendorPricing = async () =>
  from('bev_vendor_pricing').select('*').eq('is_available', true).order('product_name');
