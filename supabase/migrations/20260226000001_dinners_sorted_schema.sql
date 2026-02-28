-- ============================================
-- DINNERS SORTED — Full Database Schema
-- All tables prefixed ds_ to avoid conflicts
-- ============================================

-- ============================================
-- USER & HOUSEHOLD
-- ============================================

CREATE TABLE ds_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  cuisine_preferences TEXT[] DEFAULT '{}',
  adventure_level INTEGER DEFAULT 2 CHECK (adventure_level BETWEEN 1 AND 4),
  spice_level INTEGER DEFAULT 2 CHECK (spice_level BETWEEN 1 AND 4),
  cooking_confidence INTEGER DEFAULT 3 CHECK (cooking_confidence BETWEEN 1 AND 5),
  weeknight_max_minutes INTEGER DEFAULT 30,
  weekend_max_minutes INTEGER DEFAULT 45,
  budget_preference TEXT DEFAULT 'moderate' CHECK (budget_preference IN ('tight', 'moderate', 'flexible')),
  companion_presence TEXT DEFAULT 'balanced' CHECK (companion_presence IN ('quiet', 'subtle', 'balanced', 'active')),
  companion_avatar TEXT DEFAULT 'default',
  nav_mode TEXT DEFAULT 'feed' CHECK (nav_mode IN ('feed', 'classic')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'sorted_plus')),
  subscription_expires_at TIMESTAMPTZ,
  spotify_connected BOOLEAN DEFAULT false,
  spotify_access_token TEXT,
  instagram_connected BOOLEAN DEFAULT false,
  instagram_access_token TEXT,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'AU',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  age_group TEXT CHECK (age_group IN ('toddler', 'child', 'teen', 'adult', 'senior')),
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  dislikes TEXT[] DEFAULT '{}',
  spice_tolerance INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_drink_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  drink_type TEXT CHECK (drink_type IN ('wine', 'cocktail', 'beer', 'non_alc')),
  preferences JSONB,
  non_drinker BOOLEAN DEFAULT false,
  mocktail_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RECIPES & WORKFLOW CARDS
-- ============================================

CREATE TABLE ds_chefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  hero_image_url TEXT,
  tier TEXT CHECK (tier IN ('signature', 'pro', 'community')),
  website_url TEXT,
  instagram_handle TEXT,
  ai_avatar_enabled BOOLEAN DEFAULT false,
  ai_voice_guide JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_cookbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES ds_chefs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  affiliate_url TEXT,
  isbn TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES ds_chefs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES ds_chefs(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES ds_collections(id) ON DELETE SET NULL,
  cookbook_id UUID REFERENCES ds_cookbooks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  vessel TEXT NOT NULL CHECK (vessel IN ('pot', 'pan', 'tray', 'bowl', 'slow_cooker', 'appliance')),
  cuisine TEXT NOT NULL,
  total_time_minutes INTEGER NOT NULL CHECK (total_time_minutes <= 60),
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  serves INTEGER DEFAULT 4,
  cost_per_serve DECIMAL(6,2),
  difficulty INTEGER DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 5),
  spice_level INTEGER DEFAULT 1 CHECK (spice_level BETWEEN 0 AND 4),
  adventure_level INTEGER DEFAULT 1 CHECK (adventure_level BETWEEN 1 AND 4),
  dietary_tags TEXT[] DEFAULT '{}',
  season_tags TEXT[] DEFAULT '{}',
  source_type TEXT DEFAULT 'sorted_original' CHECK (source_type IN ('sorted_original', 'chef_partner', 'community', 'converted', 'family')),
  original_source TEXT,
  tips TEXT[] DEFAULT '{}',
  storage_notes TEXT,
  leftover_ideas TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  cooked_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(8,2),
  unit TEXT,
  is_pantry_staple BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  supermarket_section TEXT,
  estimated_cost DECIMAL(6,2)
);

CREATE TABLE ds_recipe_workflow_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id) ON DELETE CASCADE,
  card_number INTEGER NOT NULL CHECK (card_number BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  photo_url TEXT,
  instructions TEXT[] NOT NULL,
  success_marker TEXT,
  timer_seconds INTEGER,
  parallel_task TEXT,
  UNIQUE(recipe_id, card_number)
);

-- ============================================
-- FEED & AI
-- ============================================

CREATE TABLE ds_feed_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL,
  card_ref_id UUID,
  score DECIMAL(5,2),
  impressed_at TIMESTAMPTZ DEFAULT now(),
  interacted BOOLEAN DEFAULT false,
  interaction_type TEXT,
  interacted_at TIMESTAMPTZ
);

CREATE TABLE ds_cook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  would_cook_again BOOLEAN,
  notes TEXT,
  voice_feedback_text TEXT,
  voice_feedback_structured JSONB,
  photo_url TEXT,
  serves_cooked INTEGER,
  scaled_for_lunch BOOLEAN DEFAULT false,
  cooked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

CREATE TABLE ds_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  context TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PANTRY, SHOPPING, MEAL PLAN
-- ============================================

CREATE TABLE ds_pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(8,2),
  unit TEXT,
  category TEXT,
  expiry_date DATE,
  added_via TEXT DEFAULT 'manual' CHECK (added_via IN ('manual', 'camera_scan', 'barcode', 'receipt')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(8,2),
  unit TEXT,
  supermarket_section TEXT,
  estimated_cost DECIMAL(6,2),
  source_recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  is_checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_meal_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT DEFAULT 'dinner' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  label TEXT,
  serves INTEGER DEFAULT 4,
  include_lunch_scale BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, meal_type)
);

-- ============================================
-- HOUSEHOLD MANAGEMENT
-- ============================================

CREATE TABLE ds_chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assigned_to TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'fortnightly', 'monthly', 'once')),
  day_of_week INTEGER,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_bin_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  bin_type TEXT NOT NULL,
  collection_day INTEGER NOT NULL,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'fortnightly')),
  next_collection DATE,
  reminder_evening_before BOOLEAN DEFAULT true
);

CREATE TABLE ds_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  store_name TEXT,
  total DECIMAL(8,2),
  receipt_date DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES ds_receipts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(8,2) DEFAULT 1,
  price DECIMAL(6,2),
  category TEXT
);

-- ============================================
-- VENDORS
-- ============================================

CREATE TABLE ds_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  category TEXT NOT NULL,
  delivery_areas TEXT[] DEFAULT '{}',
  min_order DECIMAL(6,2),
  commission_rate DECIMAL(4,2) DEFAULT 0.12,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES ds_vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(8,2) NOT NULL,
  unit TEXT,
  category TEXT,
  is_available BOOLEAN DEFAULT true,
  matches_ingredients TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_vendor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES ds_vendors(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  subtotal DECIMAL(8,2),
  commission DECIMAL(8,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled')),
  delivery_date DATE,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DRINKS (Cellar, Bar)
-- ============================================

CREATE TABLE ds_cellar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  producer TEXT,
  wine_name TEXT,
  varietal TEXT,
  vintage INTEGER,
  region TEXT,
  country TEXT,
  purchase_price DECIMAL(8,2),
  drink_by_year INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  label_image_url TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_cellar' CHECK (status IN ('in_cellar', 'opened', 'finished')),
  added_via TEXT DEFAULT 'manual' CHECK (added_via IN ('manual', 'camera_scan', 'vendor_order')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_bar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('spirit', 'liqueur', 'mixer', 'garnish', 'bitters', 'wine', 'beer')),
  level TEXT DEFAULT 'full' CHECK (level IN ('full', 'three_quarter', 'half', 'quarter', 'empty')),
  image_url TEXT,
  added_via TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LARDERCHEF
-- ============================================

CREATE TABLE ds_sourdough_starters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_date DATE,
  flour_type TEXT,
  avatar_emoji TEXT DEFAULT '🍞',
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('thriving', 'healthy', 'sluggish', 'needs_help')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_sourdough_feedings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starter_id UUID NOT NULL REFERENCES ds_sourdough_starters(id) ON DELETE CASCADE,
  flour_amount_g DECIMAL(6,2),
  water_amount_g DECIMAL(6,2),
  temperature DECIMAL(4,1),
  rise_photo_url TEXT,
  peak_hours DECIMAL(4,1),
  notes TEXT,
  fed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_ferments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('kombucha', 'kimchi', 'sauerkraut', 'yoghurt', 'kefir', 'miso', 'tempeh', 'pickles', 'preserves', 'other')),
  started_date DATE NOT NULL,
  expected_ready_date DATE,
  actual_ready_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ready', 'consumed', 'failed')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_ferment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ferment_id UUID NOT NULL REFERENCES ds_ferments(id) ON DELETE CASCADE,
  temperature DECIMAL(4,1),
  ph_reading DECIMAL(3,1),
  photo_url TEXT,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COOK GROUPS (Community)
-- ============================================

CREATE TABLE ds_cook_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('family', 'friends', 'cook_club')),
  created_by UUID REFERENCES ds_user_profiles(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_cook_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES ds_cook_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  nickname TEXT,
  notification_prefs JSONB DEFAULT '{"in_app": true, "whatsapp": false, "push": true}',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE ds_cook_group_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES ds_cook_groups(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  share_type TEXT CHECK (share_type IN ('recipe_suggestion', 'cook_log', 'recipe_original', 'nudge', 'message')),
  recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  cook_log_id UUID REFERENCES ds_cook_log(id) ON DELETE SET NULL,
  message TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_cook_group_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES ds_cook_groups(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id) ON DELETE CASCADE,
  added_by UUID REFERENCES ds_user_profiles(id) ON DELETE SET NULL,
  origin_story TEXT,
  original_photo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CONTENT PIPELINE
-- ============================================

CREATE TABLE ds_user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  cook_log_id UUID REFERENCES ds_cook_log(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  enhanced_url TEXT,
  filter_applied TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES ds_user_photos(id) ON DELETE SET NULL,
  recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  platform TEXT CHECK (platform IN ('instagram_post', 'instagram_story', 'instagram_carousel', 'whatsapp', 'imessage', 'copy_link')),
  template_used TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  shared_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BATCH INTELLIGENCE & ADVENTURES
-- ============================================

CREATE TABLE ds_batch_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  meal_plan_week DATE NOT NULL,
  suggestion_type TEXT CHECK (suggestion_type IN ('shared_ingredient', 'shared_base', 'protein_planning', 'leftover_reuse', 'time_optimisation', 'storage_guidance')),
  description TEXT NOT NULL,
  applies_to_recipes UUID[] NOT NULL,
  prep_time_saved_seconds INTEGER,
  day_to_execute DATE,
  accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_adventure_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  series TEXT NOT NULL DEFAULT 'around_the_world_80',
  current_day INTEGER DEFAULT 1,
  recipes_completed UUID[] DEFAULT '{}',
  badges_earned TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE ds_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_drink_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_recipe_workflow_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_feed_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_cook_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_bin_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_cellar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_bar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_sourdough_starters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_sourdough_feedings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_ferments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_ferment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_cook_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_cook_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_cook_group_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_cook_group_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_batch_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_adventure_progress ENABLE ROW LEVEL SECURITY;

-- ── User profile: own data only ──
CREATE POLICY "Users can view own profile" ON ds_user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON ds_user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON ds_user_profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ── User-owned tables: standard CRUD ──
-- Macro pattern: user_id = auth.uid()

CREATE POLICY "Own data" ON ds_household_members FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_drink_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_feed_impressions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_cook_log FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_favourites FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_ai_conversations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_pantry_items FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_shopping_list FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_meal_plan FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_chores FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_bin_schedule FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_receipts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_vendor_orders FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_cellar_items FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_bar_items FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_sourdough_starters FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_ferments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_user_photos FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_social_shares FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_batch_suggestions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_adventure_progress FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Receipt items: access via parent receipt ──
CREATE POLICY "Access via receipt" ON ds_receipt_items FOR ALL
  USING (receipt_id IN (SELECT id FROM ds_receipts WHERE user_id = auth.uid()))
  WITH CHECK (receipt_id IN (SELECT id FROM ds_receipts WHERE user_id = auth.uid()));

-- ── Sourdough feedings: access via parent starter ──
CREATE POLICY "Access via starter" ON ds_sourdough_feedings FOR ALL
  USING (starter_id IN (SELECT id FROM ds_sourdough_starters WHERE user_id = auth.uid()))
  WITH CHECK (starter_id IN (SELECT id FROM ds_sourdough_starters WHERE user_id = auth.uid()));

-- ── Ferment logs: access via parent ferment ──
CREATE POLICY "Access via ferment" ON ds_ferment_logs FOR ALL
  USING (ferment_id IN (SELECT id FROM ds_ferments WHERE user_id = auth.uid()))
  WITH CHECK (ferment_id IN (SELECT id FROM ds_ferments WHERE user_id = auth.uid()));

-- ── Public read tables: recipes, chefs, cookbooks, collections, vendors ──
CREATE POLICY "Public read" ON ds_chefs FOR SELECT USING (true);
CREATE POLICY "Public read" ON ds_cookbooks FOR SELECT USING (true);
CREATE POLICY "Public read" ON ds_collections FOR SELECT USING (true);
CREATE POLICY "Public read" ON ds_recipes FOR SELECT USING (is_published = true);
CREATE POLICY "Public read" ON ds_recipe_ingredients FOR SELECT USING (
  recipe_id IN (SELECT id FROM ds_recipes WHERE is_published = true)
);
CREATE POLICY "Public read" ON ds_recipe_workflow_cards FOR SELECT USING (
  recipe_id IN (SELECT id FROM ds_recipes WHERE is_published = true)
);
CREATE POLICY "Public read" ON ds_vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Public read" ON ds_vendor_products FOR SELECT USING (
  is_available = true AND vendor_id IN (SELECT id FROM ds_vendors WHERE is_active = true)
);

-- ── Cook groups: members can access group data ──
CREATE POLICY "Group members read" ON ds_cook_groups FOR SELECT USING (
  id IN (SELECT group_id FROM ds_cook_group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Creator manages" ON ds_cook_groups FOR ALL USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group members" ON ds_cook_group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM ds_cook_group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Join/leave" ON ds_cook_group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Leave" ON ds_cook_group_members FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group shares read" ON ds_cook_group_shares FOR SELECT USING (
  group_id IN (SELECT group_id FROM ds_cook_group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group shares write" ON ds_cook_group_shares FOR INSERT WITH CHECK (
  shared_by = auth.uid() AND group_id IN (SELECT group_id FROM ds_cook_group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Group recipes read" ON ds_cook_group_recipes FOR SELECT USING (
  group_id IN (SELECT group_id FROM ds_cook_group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group recipes write" ON ds_cook_group_recipes FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM ds_cook_group_members WHERE user_id = auth.uid())
);

-- ============================================
-- INDEXES
-- ============================================

-- User-owned tables: index on user_id
CREATE INDEX idx_ds_household_members_user ON ds_household_members(user_id);
CREATE INDEX idx_ds_drink_preferences_user ON ds_drink_preferences(user_id);
CREATE INDEX idx_ds_feed_impressions_user_time ON ds_feed_impressions(user_id, impressed_at DESC);
CREATE INDEX idx_ds_cook_log_user_time ON ds_cook_log(user_id, cooked_at DESC);
CREATE INDEX idx_ds_favourites_user ON ds_favourites(user_id);
CREATE INDEX idx_ds_ai_conversations_user ON ds_ai_conversations(user_id);
CREATE INDEX idx_ds_pantry_items_user_expiry ON ds_pantry_items(user_id, expiry_date);
CREATE INDEX idx_ds_shopping_list_user ON ds_shopping_list(user_id);
CREATE INDEX idx_ds_meal_plan_user_date ON ds_meal_plan(user_id, date);
CREATE INDEX idx_ds_chores_user ON ds_chores(user_id);
CREATE INDEX idx_ds_bin_schedule_user ON ds_bin_schedule(user_id);
CREATE INDEX idx_ds_receipts_user ON ds_receipts(user_id);
CREATE INDEX idx_ds_vendor_orders_user ON ds_vendor_orders(user_id);
CREATE INDEX idx_ds_cellar_items_user ON ds_cellar_items(user_id);
CREATE INDEX idx_ds_bar_items_user ON ds_bar_items(user_id);
CREATE INDEX idx_ds_sourdough_starters_user ON ds_sourdough_starters(user_id);
CREATE INDEX idx_ds_ferments_user ON ds_ferments(user_id);
CREATE INDEX idx_ds_user_photos_user ON ds_user_photos(user_id);
CREATE INDEX idx_ds_social_shares_user ON ds_social_shares(user_id);
CREATE INDEX idx_ds_batch_suggestions_user ON ds_batch_suggestions(user_id);
CREATE INDEX idx_ds_adventure_progress_user ON ds_adventure_progress(user_id);

-- Recipe lookups
CREATE INDEX idx_ds_recipes_cuisine ON ds_recipes(cuisine);
CREATE INDEX idx_ds_recipes_vessel ON ds_recipes(vessel);
CREATE INDEX idx_ds_recipes_slug ON ds_recipes(slug);
CREATE INDEX idx_ds_recipes_chef ON ds_recipes(chef_id);
CREATE INDEX idx_ds_recipes_collection ON ds_recipes(collection_id);
CREATE INDEX idx_ds_recipe_ingredients_recipe ON ds_recipe_ingredients(recipe_id);
CREATE INDEX idx_ds_recipe_workflow_cards_recipe ON ds_recipe_workflow_cards(recipe_id);

-- Cook groups
CREATE INDEX idx_ds_cook_group_members_group ON ds_cook_group_members(group_id);
CREATE INDEX idx_ds_cook_group_members_user ON ds_cook_group_members(user_id);
CREATE INDEX idx_ds_cook_group_shares_group ON ds_cook_group_shares(group_id);
CREATE INDEX idx_ds_cook_group_recipes_group ON ds_cook_group_recipes(group_id);

-- Vendors
CREATE INDEX idx_ds_vendor_products_vendor ON ds_vendor_products(vendor_id);
CREATE INDEX idx_ds_vendors_slug ON ds_vendors(slug);

-- Child tables
CREATE INDEX idx_ds_receipt_items_receipt ON ds_receipt_items(receipt_id);
CREATE INDEX idx_ds_sourdough_feedings_starter ON ds_sourdough_feedings(starter_id);
CREATE INDEX idx_ds_ferment_logs_ferment ON ds_ferment_logs(ferment_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================

CREATE OR REPLACE FUNCTION ds_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ds_user_profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ds_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ds_handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION ds_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ds_user_profiles_updated_at
  BEFORE UPDATE ON ds_user_profiles
  FOR EACH ROW EXECUTE FUNCTION ds_set_updated_at();

CREATE TRIGGER ds_recipes_updated_at
  BEFORE UPDATE ON ds_recipes
  FOR EACH ROW EXECUTE FUNCTION ds_set_updated_at();

CREATE TRIGGER ds_pantry_items_updated_at
  BEFORE UPDATE ON ds_pantry_items
  FOR EACH ROW EXECUTE FUNCTION ds_set_updated_at();
