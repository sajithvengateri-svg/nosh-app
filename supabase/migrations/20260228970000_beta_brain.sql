-- ============================================================
-- ChefOS Brain — Beta Test Command Center
-- Tables for test plan tracking, usage analytics, AI brain,
-- and vendor beta testing
-- ============================================================

-- ========== TEST PLAN TABLES ==========

CREATE TABLE IF NOT EXISTS test_plan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text NOT NULL,
  variant text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  note text,
  tested_by uuid REFERENCES auth.users(id),
  tested_at timestamptz DEFAULT now(),
  UNIQUE(case_id, variant)
);

CREATE TABLE IF NOT EXISTS test_plan_bugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'P3',
  variant text,
  reporter uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'open',
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_plan_tester_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  stream text NOT NULL,
  target_count integer NOT NULL DEFAULT 5,
  actual_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(region, stream)
);

CREATE TABLE IF NOT EXISTS test_plan_go_checks (
  id text PRIMARY KEY,
  label text NOT NULL,
  passed boolean DEFAULT false,
  checked_by uuid REFERENCES auth.users(id),
  checked_at timestamptz
);

-- ========== ANALYTICS EVENTS ==========

CREATE TABLE IF NOT EXISTS beta_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  org_id uuid,
  variant text NOT NULL,
  event_type text NOT NULL,
  page text,
  action text,
  metadata jsonb DEFAULT '{}',
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_events_variant ON beta_analytics_events(variant, created_at);
CREATE INDEX IF NOT EXISTS idx_beta_events_page ON beta_analytics_events(page, created_at);
CREATE INDEX IF NOT EXISTS idx_beta_events_user ON beta_analytics_events(user_id, created_at);

-- ========== AI BRAIN ==========

CREATE TABLE IF NOT EXISTS brain_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_date date NOT NULL,
  insight_type text NOT NULL DEFAULT 'daily',
  provider text NOT NULL DEFAULT 'gemini',
  prompt_tokens integer,
  completion_tokens integer,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(insight_date, insight_type)
);

-- ========== VENDOR BETA ==========

CREATE TABLE IF NOT EXISTS vendor_beta_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  vendor_name text NOT NULL,
  vendor_type text NOT NULL,
  abn text,
  abn_verified boolean DEFAULT false,
  location_lat float,
  location_lon float,
  postcode text,
  catalogue_count integer DEFAULT 0,
  quality_score integer DEFAULT 50,
  onboarded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_beta_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_beta_profiles(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  price_homechef numeric,
  price_chefos numeric,
  min_order_chefos numeric,
  in_stock boolean DEFAULT true,
  is_organic boolean DEFAULT false,
  organic_certified boolean DEFAULT false,
  certification_body text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_beta_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_beta_profiles(id) ON DELETE CASCADE,
  product_ids uuid[] NOT NULL,
  deal_type text NOT NULL,
  deal_value numeric NOT NULL,
  original_price numeric,
  deal_price numeric,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz NOT NULL,
  stock_limit integer,
  target_apps text[] DEFAULT ARRAY['homechef', 'chefos'],
  min_order_qty numeric,
  status text DEFAULT 'active',
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  redemptions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_beta_demand (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_beta_profiles(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  demand_date date NOT NULL,
  demand_count integer DEFAULT 0,
  demand_qty_homechef numeric,
  demand_qty_chefos numeric,
  source_app text NOT NULL,
  recipe_ids text[],
  computed_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, ingredient_name, demand_date, source_app)
);

CREATE INDEX IF NOT EXISTS idx_vendor_products ON vendor_beta_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_deals ON vendor_beta_deals(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_deals_dates ON vendor_beta_deals(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_vendor_demand ON vendor_beta_demand(vendor_id, demand_date);

-- ========== RLS POLICIES ==========

ALTER TABLE test_plan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_plan_bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_plan_tester_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_plan_go_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_beta_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_beta_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_beta_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_beta_demand ENABLE ROW LEVEL SECURITY;

-- Admin full access on test plan tables
CREATE POLICY "admin_full_test_results" ON test_plan_results FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);
CREATE POLICY "admin_full_test_bugs" ON test_plan_bugs FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);
CREATE POLICY "admin_full_tester_targets" ON test_plan_tester_targets FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);
CREATE POLICY "admin_full_go_checks" ON test_plan_go_checks FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);
CREATE POLICY "admin_full_brain_insights" ON brain_insights FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);

-- Analytics events: any authenticated user can insert, admins can read all
CREATE POLICY "insert_analytics_events" ON beta_analytics_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "admin_read_analytics_events" ON beta_analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);

-- Vendor tables: vendors can manage their own data, admins can read all
CREATE POLICY "vendor_own_profile" ON vendor_beta_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "admin_read_vendor_profiles" ON vendor_beta_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);

CREATE POLICY "vendor_own_products" ON vendor_beta_products FOR ALL USING (
  vendor_id IN (SELECT id FROM vendor_beta_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "admin_read_vendor_products" ON vendor_beta_products FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);

CREATE POLICY "vendor_own_deals" ON vendor_beta_deals FOR ALL USING (
  vendor_id IN (SELECT id FROM vendor_beta_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "admin_read_vendor_deals" ON vendor_beta_deals FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);

CREATE POLICY "vendor_read_demand" ON vendor_beta_demand FOR SELECT USING (
  vendor_id IN (SELECT id FROM vendor_beta_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "admin_full_vendor_demand" ON vendor_beta_demand FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('owner', 'head_chef'))
);

-- ========== SEED GO/NO-GO CHECKS ==========

INSERT INTO test_plan_go_checks (id, label) VALUES
  ('auth-all-streams', 'Auth flow works for all 3 streams'),
  ('referral-e2e', 'Referral system end-to-end'),
  ('subscription-checkout', 'Subscription checkout + webhook'),
  ('ai-metering', 'AI usage metering accurate'),
  ('share-credits', 'Share credits awarded correctly'),
  ('no-p1-bugs', 'No P1 bugs open'),
  ('primary-markets-testers', 'All primary markets have 5+ active testers'),
  ('vendor-onboarded', 'All 5 vendors onboarded with 10+ products'),
  ('vendor-deals', 'All 5 vendors pushed at least 1 deal'),
  ('vendor-demand-accuracy', 'Demand heatmap matches tester recipes'),
  ('vendor-no-p1', 'No P1 vendor portal bugs'),
  ('cross-variant', 'Cross-variant checks pass (colors, greetings, modules)')
ON CONFLICT (id) DO NOTHING;

-- ========== SEED TESTER TARGETS ==========

INSERT INTO test_plan_tester_targets (region, stream, target_count) VALUES
  ('au', 'chefos', 5), ('au', 'homechef', 5), ('au', 'eatsafe', 5), ('au', 'vendor', 5),
  ('in', 'chefos', 5), ('in', 'homechef', 5), ('in', 'eatsafe', 5),
  ('uae', 'chefos', 5), ('uae', 'homechef', 5), ('uae', 'eatsafe', 5),
  ('uk', 'chefos', 1), ('uk', 'homechef', 1), ('uk', 'eatsafe', 1),
  ('sg', 'chefos', 1), ('sg', 'homechef', 1), ('sg', 'eatsafe', 1),
  ('us', 'chefos', 1), ('us', 'homechef', 1), ('us', 'eatsafe', 1),
  ('admin', 'team', 5)
ON CONFLICT (region, stream) DO NOTHING;
