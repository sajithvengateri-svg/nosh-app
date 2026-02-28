-- ============================================
-- NOSH: Commerce, Three-Tier, Weekly Plan
-- Migration 002 — 2026-02-26
-- ============================================
-- Section A: Three-Tier + Nosh Run (Phase 1 — used now)
-- Section B: Vendor Commerce extensions (Phase 2)
-- Section C: Weekly Plan (Phase 3)
-- ============================================

-- ── Section A: Three-Tier + Nosh Run ─────────────────────────────────

-- User tier preferences (learned over time)
CREATE TABLE ds_user_tier_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  ingredient_category TEXT NOT NULL,
  default_tier TEXT DEFAULT 'good' CHECK (default_tier IN ('good', 'better', 'best')),
  times_chosen_good INTEGER DEFAULT 0,
  times_chosen_better INTEGER DEFAULT 0,
  times_chosen_best INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ingredient_category)
);

-- Vendor loyalty tracking
CREATE TABLE ds_vendor_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES ds_vendors(id) ON DELETE CASCADE,
  product_category TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,
  avg_rating DECIMAL(2,1),
  last_order_at TIMESTAMPTZ,
  is_favourite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vendor_id, product_category)
);

-- Nosh Run history
CREATE TABLE ds_nosh_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES ds_recipes(id) ON DELETE SET NULL,
  recipe_title TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('going', 'delivering')),
  store_name TEXT,
  basket_total DECIMAL(8,2),
  tier_selections JSONB,
  used_slider BOOLEAN DEFAULT false,
  used_preset TEXT,
  was_auto_default BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Section B: Vendor Commerce ───────────────────────────────────────

-- Extend vendors with commerce fields
ALTER TABLE ds_vendors
  ADD COLUMN IF NOT EXISTS abn TEXT,
  ADD COLUMN IF NOT EXISTS abn_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_tier TEXT DEFAULT 'standard'
    CHECK (commission_tier IN ('launch', 'standard', 'loyalty', 'top20')),
  ADD COLUMN IF NOT EXISTS commission_rate_override DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'pickup'
    CHECK (delivery_method IN ('pickup', 'vendor_delivery', 'both')),
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS total_nosh_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_nosh_revenue DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_nosh_rating DECIMAL(2,1);

-- Vendor product reviews (post-cook verified only)
CREATE TABLE ds_vendor_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES ds_vendors(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES ds_vendor_products(id) ON DELETE CASCADE,
  nosh_run_id UUID REFERENCES ds_nosh_runs(id),
  cook_log_id UUID REFERENCES ds_cook_log(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  photo_url TEXT,
  would_buy_again BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vendor payouts (Stripe Connect reconciliation)
CREATE TABLE ds_vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES ds_vendors(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_sales DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(4,2) NOT NULL,
  net_payout DECIMAL(10,2) NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Section C: Weekly Plan ───────────────────────────────────────────

CREATE TABLE ds_weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  plan_mode TEXT NOT NULL DEFAULT 'manual' CHECK (plan_mode IN ('auto', 'manual', 'mixed')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'active', 'completed')),
  confirmed_at TIMESTAMPTZ,
  estimated_total DECIMAL(8,2),
  actual_total DECIMAL(8,2),
  savings_vs_daily DECIMAL(8,2),
  shared_ingredient_savings DECIMAL(8,2),
  shopping_plan JSONB DEFAULT '{}',
  shopping_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_weekly_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ds_weekly_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  date DATE NOT NULL,
  recipe_id UUID REFERENCES ds_recipes(id),
  recipe_name TEXT,
  day_mode TEXT DEFAULT 'usual' CHECK (day_mode IN ('usual', 'mix_it_up', 'go_nuts', 'skip', 'leftover')),
  basket JSONB DEFAULT '[]',
  day_total DECIMAL(8,2),
  cooked BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  uses_leftovers_from UUID REFERENCES ds_weekly_plan_days(id),
  generates_leftovers JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ds_weekly_shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES ds_weekly_plans(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  stops JSONB NOT NULL,
  route_data JSONB,
  estimated_drive_time INTEGER,
  pantry_items JSONB DEFAULT '[]',
  pantry_savings DECIMAL(8,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shopping', 'complete')),
  completed_at TIMESTAMPTZ
);

CREATE TABLE ds_vendor_demand_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES ds_vendors(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  confirmed_orders INTEGER DEFAULT 0,
  estimated_orders INTEGER DEFAULT 0,
  product_breakdown JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, forecast_date)
);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE ds_user_tier_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_vendor_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_nosh_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_vendor_product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_weekly_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_weekly_shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE ds_vendor_demand_forecast ENABLE ROW LEVEL SECURITY;

-- User own-data policies
CREATE POLICY "Own data" ON ds_user_tier_preferences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_vendor_loyalty FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_nosh_runs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own data" ON ds_weekly_plans FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Reviews: own data for write, public read
CREATE POLICY "Own write" ON ds_vendor_product_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own update" ON ds_vendor_product_reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Own delete" ON ds_vendor_product_reviews FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Public read" ON ds_vendor_product_reviews FOR SELECT USING (true);

-- Weekly plan days/shopping: access via parent plan
CREATE POLICY "Via plan" ON ds_weekly_plan_days FOR ALL
  USING (EXISTS (SELECT 1 FROM ds_weekly_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM ds_weekly_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()));

CREATE POLICY "Via plan" ON ds_weekly_shopping_lists FOR ALL
  USING (EXISTS (SELECT 1 FROM ds_weekly_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM ds_weekly_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()));

-- Vendor payouts/forecast: vendor-scoped (TODO: vendor auth in Phase 2)
-- For now allow authenticated users to read their own vendor data
CREATE POLICY "Authenticated read" ON ds_vendor_payouts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated read" ON ds_vendor_demand_forecast FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── Indexes ──────────────────────────────────────────────────────────

CREATE INDEX idx_ds_user_tier_prefs_user ON ds_user_tier_preferences(user_id);
CREATE INDEX idx_ds_vendor_loyalty_user ON ds_vendor_loyalty(user_id);
CREATE INDEX idx_ds_vendor_loyalty_vendor ON ds_vendor_loyalty(vendor_id);
CREATE INDEX idx_ds_nosh_runs_user ON ds_nosh_runs(user_id);
CREATE INDEX idx_ds_nosh_runs_recipe ON ds_nosh_runs(recipe_id);
CREATE INDEX idx_ds_vendor_reviews_vendor ON ds_vendor_product_reviews(vendor_id);
CREATE INDEX idx_ds_vendor_reviews_product ON ds_vendor_product_reviews(product_id);
CREATE INDEX idx_ds_vendor_payouts_vendor ON ds_vendor_payouts(vendor_id);
CREATE INDEX idx_ds_weekly_plans_user_week ON ds_weekly_plans(user_id, week_start);
CREATE INDEX idx_ds_weekly_plan_days_plan ON ds_weekly_plan_days(plan_id);
CREATE INDEX idx_ds_weekly_shopping_plan ON ds_weekly_shopping_lists(plan_id);
CREATE INDEX idx_ds_vendor_forecast_vendor_date ON ds_vendor_demand_forecast(vendor_id, forecast_date);
