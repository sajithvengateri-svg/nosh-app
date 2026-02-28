
-- ============================================================
-- OverheadOS Module 1: 8 Tables + RLS + Seed Data
-- ============================================================

-- 1. overhead_categories
CREATE TABLE public.overhead_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_category uuid REFERENCES public.overhead_categories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'FIXED' CHECK (type IN ('FIXED','VARIABLE','SEMI_VARIABLE')),
  is_cogs boolean NOT NULL DEFAULT false,
  is_labour boolean NOT NULL DEFAULT false,
  xero_account_code text,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overhead_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view overhead_categories"
  ON public.overhead_categories FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage overhead_categories"
  ON public.overhead_categories FOR ALL
  TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access overhead_categories"
  ON public.overhead_categories FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 2. overhead_recurring
CREATE TABLE public.overhead_recurring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.overhead_categories(id) ON DELETE CASCADE,
  description text NOT NULL,
  supplier_name text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'MONTHLY' CHECK (frequency IN ('WEEKLY','FORTNIGHTLY','MONTHLY','QUARTERLY','ANNUALLY')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  next_due_date date,
  auto_generate boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overhead_recurring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view overhead_recurring"
  ON public.overhead_recurring FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage overhead_recurring"
  ON public.overhead_recurring FOR ALL TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access overhead_recurring"
  ON public.overhead_recurring FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 3. overhead_entries
CREATE TABLE public.overhead_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.overhead_categories(id) ON DELETE CASCADE,
  recurring_id uuid REFERENCES public.overhead_recurring(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  supplier_name text,
  receipt_url text,
  is_recurring boolean NOT NULL DEFAULT false,
  is_auto_generated boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','RECURRING','XERO_SYNC','PRODUCT_FEED')),
  product_source text CHECK (product_source IS NULL OR product_source IN ('RESTOS','BEVOS','CHEFOS','LABOUROS','MARKETINGOS','RESERVATIONOS')),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overhead_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view overhead_entries"
  ON public.overhead_entries FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage overhead_entries"
  ON public.overhead_entries FOR ALL TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access overhead_entries"
  ON public.overhead_entries FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. depreciation_assets
CREATE TABLE public.depreciation_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  purchase_price numeric(12,2) NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  useful_life_years integer NOT NULL DEFAULT 5,
  depreciation_method text NOT NULL DEFAULT 'STRAIGHT_LINE',
  salvage_value numeric(12,2) NOT NULL DEFAULT 0,
  monthly_depreciation numeric(12,2) NOT NULL DEFAULT 0,
  current_book_value numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.depreciation_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view depreciation_assets"
  ON public.depreciation_assets FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage depreciation_assets"
  ON public.depreciation_assets FOR ALL TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access depreciation_assets"
  ON public.depreciation_assets FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. overhead_alert_rules
CREATE TABLE public.overhead_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cost_category text NOT NULL,
  metric text NOT NULL DEFAULT 'PERCENTAGE' CHECK (metric IN ('PERCENTAGE','DOLLAR','COUNT')),
  threshold_warning numeric(12,2),
  threshold_critical numeric(12,2),
  comparison text NOT NULL DEFAULT 'ABOVE' CHECK (comparison IN ('ABOVE','BELOW')),
  period text NOT NULL DEFAULT 'MONTHLY' CHECK (period IN ('DAILY','WEEKLY','MONTHLY')),
  notify_in_app boolean NOT NULL DEFAULT true,
  notify_email boolean NOT NULL DEFAULT false,
  notify_sms boolean NOT NULL DEFAULT false,
  notify_pos boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overhead_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view overhead_alert_rules"
  ON public.overhead_alert_rules FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage overhead_alert_rules"
  ON public.overhead_alert_rules FOR ALL TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access overhead_alert_rules"
  ON public.overhead_alert_rules FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6. overhead_alerts
CREATE TABLE public.overhead_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.overhead_alert_rules(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('WARNING','CRITICAL')),
  metric_name text NOT NULL,
  actual_value numeric(12,2) NOT NULL DEFAULT 0,
  threshold_value numeric(12,2) NOT NULL DEFAULT 0,
  message text NOT NULL,
  pattern_insight text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ACKNOWLEDGED','RESOLVED')),
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  triggered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overhead_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view overhead_alerts"
  ON public.overhead_alerts FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage overhead_alerts"
  ON public.overhead_alerts FOR ALL TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access overhead_alerts"
  ON public.overhead_alerts FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 7. overhead_benchmarks
CREATE TABLE public.overhead_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  venue_type text NOT NULL DEFAULT 'CASUAL_DINING',
  metric text NOT NULL,
  target_value numeric(8,2) NOT NULL DEFAULT 0,
  benchmark_low numeric(8,2) NOT NULL DEFAULT 0,
  benchmark_high numeric(8,2) NOT NULL DEFAULT 0,
  benchmark_avg numeric(8,2) NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overhead_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view overhead_benchmarks"
  ON public.overhead_benchmarks FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage overhead_benchmarks"
  ON public.overhead_benchmarks FOR ALL TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access overhead_benchmarks"
  ON public.overhead_benchmarks FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 8. pnl_snapshots
CREATE TABLE public.pnl_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_type text NOT NULL DEFAULT 'WEEKLY' CHECK (period_type IN ('DAILY','WEEKLY','MONTHLY')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  revenue_total numeric(12,2) NOT NULL DEFAULT 0,
  cogs_food numeric(12,2) NOT NULL DEFAULT 0,
  cogs_bev numeric(12,2) NOT NULL DEFAULT 0,
  cogs_waste_food numeric(12,2) NOT NULL DEFAULT 0,
  cogs_waste_bev numeric(12,2) NOT NULL DEFAULT 0,
  gross_profit numeric(12,2) NOT NULL DEFAULT 0,
  gross_margin_pct numeric(6,2) NOT NULL DEFAULT 0,
  labour_wages numeric(12,2) NOT NULL DEFAULT 0,
  labour_super numeric(12,2) NOT NULL DEFAULT 0,
  labour_overtime numeric(12,2) NOT NULL DEFAULT 0,
  labour_total numeric(12,2) NOT NULL DEFAULT 0,
  labour_pct numeric(6,2) NOT NULL DEFAULT 0,
  prime_cost numeric(12,2) NOT NULL DEFAULT 0,
  prime_cost_pct numeric(6,2) NOT NULL DEFAULT 0,
  overhead_total numeric(12,2) NOT NULL DEFAULT 0,
  overhead_pct numeric(6,2) NOT NULL DEFAULT 0,
  net_profit numeric(12,2) NOT NULL DEFAULT 0,
  net_profit_pct numeric(6,2) NOT NULL DEFAULT 0,
  break_even_revenue numeric(12,2) NOT NULL DEFAULT 0,
  data_completeness_pct numeric(5,2) NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pnl_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pnl_snapshots"
  ON public.pnl_snapshots FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Owners/managers can manage pnl_snapshots"
  ON public.pnl_snapshots FOR ALL TO authenticated
  USING (public.is_org_head_chef(auth.uid(), org_id))
  WITH CHECK (public.is_org_head_chef(auth.uid(), org_id));

CREATE POLICY "Admins full access pnl_snapshots"
  ON public.pnl_snapshots FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Indexes
CREATE INDEX idx_overhead_categories_org ON public.overhead_categories(org_id);
CREATE INDEX idx_overhead_recurring_org ON public.overhead_recurring(org_id);
CREATE INDEX idx_overhead_entries_org_date ON public.overhead_entries(org_id, date);
CREATE INDEX idx_overhead_entries_category ON public.overhead_entries(category_id);
CREATE INDEX idx_depreciation_assets_org ON public.depreciation_assets(org_id);
CREATE INDEX idx_overhead_alerts_org ON public.overhead_alerts(org_id, status);
CREATE INDEX idx_pnl_snapshots_org_period ON public.pnl_snapshots(org_id, period_start, period_end);
