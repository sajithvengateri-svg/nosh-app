// ── Main Categories ──
export type BevMainCategory = 'wine' | 'beer' | 'spirits' | 'cocktails' | 'mixers' | 'soft_drinks' | 'coffee_tea';

export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'orange' | 'natural' | 'dessert' | 'sake';
export type BeerFormat = 'draught' | 'bottle' | 'can';
export type IceType = 'cubed' | 'crushed' | 'block' | 'sphere' | 'pebble' | 'clear' | 'none';
export type PourType = 'standard' | 'coravin' | 'draught' | 'coffee' | 'comp' | 'staff';
export type CocktailCategory = 'classic' | 'signature' | 'prebatch' | 'frozen' | 'mocktail' | 'shot';
export type WasteReason = 'breakage' | 'spillage' | 'expired' | 'quality' | 'comp' | 'staff_drink' | 'over_pour';
export type CellaringReadiness = 'too_young' | 'ready' | 'peak' | 'declining';
export type CoffeeMethod = 'espresso' | 'filter' | 'batch' | 'cold_brew' | 'v60' | 'chemex' | 'aeropress';
export type BevRole = 'bar_manager' | 'asst_bar_manager' | 'senior_bartender' | 'bartender' | 'barback' | 'barista';

// ── Core Tables ──
export interface BevProduct {
  id: string;
  name: string;
  main_category: BevMainCategory;
  sub_category: string;
  format: string | null;
  bottle_size_ml: number | null;
  purchase_price: number;
  sell_price: number;
  pour_size_ml: number | null;
  pours_per_unit: number | null;
  par_level: number | null;
  is_coravin_eligible: boolean;
  abv: number | null;
  speed_rail_position: number | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface BevWineDetails {
  id: string;
  product_id: string;
  vintage: number | null;
  producer: string | null;
  region: string | null;
  appellation: string | null;
  varietal: string | null;
  wine_type: WineType;
  drink_from: number | null;
  drink_to: number | null;
  bin_number: string | null;
  cellar_location: string | null;
  optimal_serve_temp_c: number | null;
}

export interface BevBeerDetails {
  id: string;
  product_id: string;
  beer_type: string | null;
  format: BeerFormat;
  keg_size_litres: number | null;
  tap_number: number | null;
  line_number: number | null;
  glycol_temp_c: number | null;
  coupler_type: string | null;
  gas_type: string | null;
}

export interface BevCoffeeDetails {
  id: string;
  product_id: string;
  roaster: string | null;
  origin: string | null;
  roast_date: string | null;
  best_before: string | null;
  dose_g: number | null;
  yield_ml: number | null;
  brew_ratio: string | null;
  grind_setting: string | null;
  method: CoffeeMethod | null;
  tea_type: string | null;
  steep_temp_c: number | null;
  steep_time_s: number | null;
  tds_reading: number | null;
}

export interface BevCellar {
  id: string;
  product_id: string;
  quantity: number;
  location: string | null;
  batch_ref: string | null;
  supplier: string | null;
  received_date: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface BevOpenBottle {
  id: string;
  product_id: string;
  opened_at: string;
  expires_at: string | null;
  remaining_ml: number;
  is_coravin: boolean;
  coravin_gas_pours_remaining: number | null;
  opened_by: string | null;
  org_id: string;
  created_at: string;
}

export interface BevPourEvent {
  id: string;
  product_id: string;
  quantity_ml: number;
  cost_per_pour: number;
  sell_price: number;
  gp_per_pour: number;
  is_coravin_pour: boolean;
  pour_type: PourType;
  poured_by: string | null;
  shift_date: string;
  org_id: string;
  created_at: string;
}

export interface BevCocktailSpec {
  id: string;
  name: string;
  category: CocktailCategory;
  method_steps: unknown[];
  glassware: string | null;
  garnish: string | null;
  ice_type: IceType;
  cost_price: number;
  sell_price: number;
  is_prebatch: boolean;
  batch_yield_ml: number | null;
  difficulty_level: number;
  image_url: string | null;
  flash_card_notes: string | null;
  tasting_notes: string | null;
  quiz_answers: unknown | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface BevCocktailIngredient {
  id: string;
  spec_id: string;
  product_id: string;
  quantity_ml: number;
  unit: string;
  cost: number;
  org_id: string;
}

export interface BevPrebatchLog {
  id: string;
  spec_id: string;
  volume_ml: number;
  cost: number;
  prepared_by: string | null;
  expires_at: string | null;
  batch_number: string | null;
  org_id: string;
  created_at: string;
}

export interface BevKegTracking {
  id: string;
  product_id: string;
  tap_number: number | null;
  tapped_at: string;
  kicked_at: string | null;
  theoretical_pours: number;
  actual_pours: number;
  yield_pct: number | null;
  org_id: string;
  created_at: string;
}

export interface BevLineCleaningLog {
  id: string;
  line_number: number;
  cleaned_at: string;
  cleaned_by: string | null;
  next_due: string | null;
  chemical_used: string | null;
  org_id: string;
}

export interface BevCoffeeDialing {
  id: string;
  product_id: string;
  dose_g: number;
  yield_ml: number;
  time_s: number;
  grinder_setting: string | null;
  tds: number | null;
  notes: string | null;
  dialed_by: string | null;
  org_id: string;
  created_at: string;
}

export interface BevWasteEvent {
  id: string;
  product_id: string;
  quantity_ml: number;
  reason: WasteReason;
  cost: number;
  reported_by: string | null;
  org_id: string;
  created_at: string;
}

export interface BevBarPrep {
  id: string;
  name: string;
  date: string;
  shift: string;
  items: unknown;
  assigned_to: string | null;
  status: string;
  notes: string | null;
  section_id: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface BevStocktake {
  id: string;
  date: string;
  status: string;
  completed_by: string | null;
  location: string | null;
  count_type: 'full' | 'partial';
  notes: string | null;
  org_id: string;
  created_at: string;
}

export interface BevStocktakeItem {
  id: string;
  stocktake_id: string;
  product_id: string;
  expected_qty: number;
  counted_qty: number;
  variance: number;
  variance_cost: number;
  location: string | null;
  org_id: string;
}

export interface BevCoravinCapsule {
  id: string;
  capsule_type: string;
  quantity_in_stock: number;
  pours_per_capsule: number;
  cost_per_capsule: number;
  org_id: string;
  created_at: string;
}

export interface BevFlashCard {
  id: string;
  title: string;
  category: 'cocktails' | 'wine' | 'beer' | 'coffee' | 'spirits' | 'technique' | 'garnish' | 'premix';
  content: string;
  image_url: string | null;
  quiz_question: string | null;
  quiz_answers: unknown | null;
  difficulty_level: number;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface BevDemandInsight {
  id: string;
  product_category: string;
  product_name: string | null;
  postcode: string;
  week_ending: string;
  order_count: number;
  total_quantity: number;
  avg_price_paid: number | null;
}

// ── Vendor ──
export interface BevVendorPricing {
  id: string;
  vendor_id: string;
  product_name: string;
  category: string;
  sub_category: string | null;
  region: string | null;
  producer: string | null;
  vintage: number | null;
  format: string | null;
  price_per_unit: number;
  min_order_qty: number;
  is_available: boolean;
  lead_time_days: number | null;
  valid_from: string | null;
  valid_until: string | null;
}

// ── Derived / UI ──
export interface CellaringWindow {
  vintage: number;
  drinkFrom: number;
  drinkTo: number;
  readiness: CellaringReadiness;
}

export interface DraughtStatus {
  tapNumber: number;
  productName: string;
  kegSizeLitres: number;
  poursRemaining: number;
  yieldPct: number;
  lineCleanDue: string | null;
}

export interface BarPrepItem {
  name: string;
  type: 'juice' | 'syrup' | 'garnish' | 'ice' | 'infusion' | 'prebatch';
  quantity: number;
  unit: string;
  urgency: 'before_service' | 'end_of_shift' | 'tomorrow';
  assignedTo: string | null;
  completed: boolean;
}
