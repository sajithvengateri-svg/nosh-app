
-- =====================================================
-- MoneyOS Database Schema
-- =====================================================

-- Simulation scenarios (saved "what-if" models)
CREATE TABLE public.simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'STRESS_TEST',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  variables JSONB NOT NULL DEFAULT '{}',
  correlations JSONB DEFAULT '{}',
  periods_months INTEGER NOT NULL DEFAULT 36,
  iterations INTEGER NOT NULL DEFAULT 1000,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation results (output of each run)
CREATE TABLE public.simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES public.simulation_scenarios(id) ON DELETE CASCADE NOT NULL,
  org_id UUID NOT NULL,
  run_number INTEGER NOT NULL DEFAULT 1,
  survival_probability NUMERIC(5,2),
  profit_distribution JSONB,
  break_even_months JSONB,
  cash_flow_monthly JSONB,
  sensitivity_ranking JSONB,
  risk_factors JSONB,
  insolvency_risk JSONB,
  solutions_applied JSONB DEFAULT '[]',
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solution library (pre-loaded hospitality interventions)
CREATE TABLE public.solution_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_variable TEXT NOT NULL,
  description TEXT,
  impact_revenue_pct NUMERIC(5,2) DEFAULT 0,
  impact_food_cost_pct NUMERIC(5,2) DEFAULT 0,
  impact_bev_cost_pct NUMERIC(5,2) DEFAULT 0,
  impact_labour_pct NUMERIC(5,2) DEFAULT 0,
  impact_overhead_dollar NUMERIC(10,2) DEFAULT 0,
  implementation_difficulty TEXT DEFAULT 'MEDIUM',
  time_to_effect_days INTEGER,
  compliance_verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit reports (forensic audit outputs)
CREATE TABLE public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'ROUTINE',
  data_source TEXT DEFAULT 'ECOSYSTEM',
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'IMPORTING',
  findings JSONB DEFAULT '[]',
  true_pnl JSONB,
  recovery_roadmap JSONB DEFAULT '[]',
  overall_risk_rating TEXT,
  overall_score INTEGER,
  total_liabilities_identified NUMERIC(12,2) DEFAULT 0,
  total_annual_savings_identified NUMERIC(12,2) DEFAULT 0,
  report_pdf_url TEXT,
  created_by TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiet Audit scores (calculated periodically)
CREATE TABLE public.audit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'DAILY',
  period_date DATE NOT NULL,
  overall_score INTEGER,
  food_score INTEGER,
  bev_score INTEGER,
  labour_score INTEGER,
  overhead_score INTEGER,
  service_score INTEGER,
  marketing_score INTEGER,
  compliance_score INTEGER,
  score_breakdown JSONB,
  recommendations JSONB DEFAULT '[]',
  trend_direction TEXT DEFAULT 'STABLE',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, period_type, period_date)
);

-- Cross-product correlation events
CREATE TABLE public.correlation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  correlation_type TEXT NOT NULL,
  description TEXT NOT NULL,
  data_points JSONB,
  impact_estimated NUMERIC(10,2),
  recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenario side-by-side comparison
CREATE TABLE public.scenario_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,
  name TEXT NOT NULL,
  scenario_a_id UUID REFERENCES public.simulation_scenarios(id),
  scenario_b_id UUID REFERENCES public.simulation_scenarios(id),
  comparison_notes JSONB,
  winner TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correlation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_comparisons ENABLE ROW LEVEL SECURITY;

-- RLS policies: org-scoped access via security definer function
-- (uses existing get_user_org_id or similar pattern)

-- simulation_scenarios policies
CREATE POLICY "Users can view own org scenarios" ON public.simulation_scenarios
  FOR SELECT USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can insert own org scenarios" ON public.simulation_scenarios
  FOR INSERT WITH CHECK (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can update own org scenarios" ON public.simulation_scenarios
  FOR UPDATE USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can delete own org scenarios" ON public.simulation_scenarios
  FOR DELETE USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

-- simulation_results policies
CREATE POLICY "Users can view own org results" ON public.simulation_results
  FOR SELECT USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can insert own org results" ON public.simulation_results
  FOR INSERT WITH CHECK (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

-- solution_library policies (global defaults readable by all, org-specific by org)
CREATE POLICY "Users can view solutions" ON public.solution_library
  FOR SELECT USING (
    is_default = true OR org_id IS NULL OR org_id IN (
      SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
    )
  );
CREATE POLICY "Users can manage own org solutions" ON public.solution_library
  FOR ALL USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

-- audit_reports policies
CREATE POLICY "Users can view own org reports" ON public.audit_reports
  FOR SELECT USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can insert own org reports" ON public.audit_reports
  FOR INSERT WITH CHECK (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can update own org reports" ON public.audit_reports
  FOR UPDATE USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

-- audit_scores policies
CREATE POLICY "Users can view own org scores" ON public.audit_scores
  FOR SELECT USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can insert own org scores" ON public.audit_scores
  FOR INSERT WITH CHECK (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

-- correlation_events policies
CREATE POLICY "Users can view own org correlations" ON public.correlation_events
  FOR SELECT USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can manage own org correlations" ON public.correlation_events
  FOR ALL USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

-- scenario_comparisons policies
CREATE POLICY "Users can view own org comparisons" ON public.scenario_comparisons
  FOR SELECT USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));
CREATE POLICY "Users can manage own org comparisons" ON public.scenario_comparisons
  FOR ALL USING (org_id IN (
    SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.is_active = true
  ));

-- Seed the solution library with default hospitality interventions
INSERT INTO public.solution_library (name, category, target_variable, description, impact_revenue_pct, impact_food_cost_pct, impact_bev_cost_pct, impact_labour_pct, impact_overhead_dollar, implementation_difficulty, time_to_effect_days, compliance_verified, is_default) VALUES
('Sunday Surcharge (10-15%)', 'REVENUE', 'revenue', 'Offset penalty rate bleed with weekend surcharges', 2.5, 0, 0, 0, 0, 'LOW', 1, true, true),
('QR Table Ordering', 'REVENUE', 'labour', 'Reduce 1 FOH head via digital ordering, increases avg ticket via upsell prompts', 5.0, 0, 0, -3.0, 0, 'MEDIUM', 14, true, true),
('Add Delivery/Takeaway', 'REVENUE', 'revenue', 'Revenue +8-15%, minimal extra labour', 12.0, 0, 0, 2.0, -200, 'MEDIUM', 30, true, true),
('Extend Trading Hours', 'REVENUE', 'revenue', 'Revenue +20-40%, labour proportional, rent amortised better', 30.0, 0, 0, 15.0, 0, 'HIGH', 30, true, true),
('90-min Seating Limits at Peak', 'REVENUE', 'covers', 'Covers +15-25%, ticket -5%', 15.0, 0, 0, 0, 0, 'LOW', 1, true, true),
('Wine Dinner Events (Monthly)', 'REVENUE', 'revenue', 'Revenue +$3-8k/event at 70%+ margin', 8.0, 0, -2.0, 1.0, -500, 'MEDIUM', 30, true, true),
('Increase Beverage Focus', 'REVENUE', 'bev_revenue', 'Bev revenue +3-5%, higher margin than food', 4.0, 0, -1.5, 0, 0, 'LOW', 14, true, true),
('Menu Rationalisation', 'COST', 'food_cost', 'Remove bottom 20% items. Food cost -1.5-2.5%, waste -20-30%', 0, -2.0, 0, 0, 0, 'LOW', 7, true, true),
('Pre-batch Cocktails', 'COST', 'bev_labour', 'Bev labour -$300/mo, consistency up', 0, 0, -1.0, -1.0, -300, 'LOW', 7, true, true),
('Convert Casuals to Part-time', 'COST', 'labour', 'Save ~$400/yr per conversion (add leave liability)', 0, 0, 0, -1.5, 0, 'MEDIUM', 30, true, true),
('Consolidate Suppliers', 'COST', 'food_cost', 'COGS -2-4% through volume pricing', 0, -3.0, -2.0, 0, 0, 'MEDIUM', 60, true, true),
('Portion Control (ChefOS Scaling)', 'COST', 'food_cost', 'Food cost -1-2% through precise portioning', 0, -1.5, 0, 0, 0, 'LOW', 7, true, true),
('Renegotiate Rent', 'COST', 'rent', 'Rent -5-10% (longer term for lower base)', 0, 0, 0, 0, -500, 'HIGH', 90, true, true),
('Sub-let Kitchen (Breakfast Pop-up)', 'COST', 'rent', 'Rent offset $1-3k/mo', 0, 0, 0, 0, -2000, 'HIGH', 60, true, true),
('Cross-train Staff', 'EFFICIENCY', 'labour', 'Roster flexibility up, overtime down', 0, 0, 0, -2.0, 0, 'MEDIUM', 30, true, true),
('Break Scheduling Compliance', 'EFFICIENCY', 'labour', 'Prevent missed break penalties ($500-2k/mo)', 0, 0, 0, -1.0, -1000, 'LOW', 7, true, true),
('AI Roster Optimisation', 'EFFICIENCY', 'labour', 'Labour -3-5% through precision scheduling', 0, 0, 0, -4.0, 0, 'LOW', 7, true, true),
('No-show Reduction (Deposits + SMS)', 'EFFICIENCY', 'revenue', 'Recover $1-4k/mo in lost revenue', 3.0, 0, 0, 0, -50, 'LOW', 7, true, true),
('Energy Audit', 'EFFICIENCY', 'overhead', 'Utilities -10-20%', 0, 0, 0, 0, -400, 'MEDIUM', 30, true, true),
('Pre-prep Proteins (Value-Added)', 'COST', 'food_cost', 'Labour -2.5%, food cost +1.2%, net -1.3% cost', 0, 1.2, 0, -2.5, 0, 'MEDIUM', 14, true, true);
