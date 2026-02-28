-- MoneyOS landing page sections (same schema as landing_sections)
CREATE TABLE public.money_landing_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.money_landing_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read money landing sections"
  ON public.money_landing_sections FOR SELECT USING (true);

CREATE POLICY "Admins can insert money landing sections"
  ON public.money_landing_sections FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update money landing sections"
  ON public.money_landing_sections FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete money landing sections"
  ON public.money_landing_sections FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Seed default sections
INSERT INTO public.money_landing_sections (section_key, title, subtitle, is_visible, content, sort_order) VALUES
  ('hero', 'The Financial Operating System for Restaurants', 'Real-time P&L, cost tracking, and financial intelligence — built for hospitality.', true, '{"button_text": "Get Started Free", "button_link": "/auth?tab=signup&source=moneyos"}'::jsonb, 0),
  ('features', 'Everything You Need to Control Your Numbers', '', true, '[
    {"icon": "Activity", "title": "Live P&L Reactor", "description": "Real-time profit & loss that updates as sales, labour, and costs flow in."},
    {"icon": "TrendingDown", "title": "Food Cost Tracking", "description": "Track food costs against revenue with automatic POS integration."},
    {"icon": "Users", "title": "Labour Analytics", "description": "Monitor labour percentage, overtime, and roster efficiency in real-time."},
    {"icon": "BarChart3", "title": "Trend Analysis", "description": "Spot trends before they become problems with weekly and monthly comparisons."},
    {"icon": "Target", "title": "Benchmark Targets", "description": "Set targets for every metric and get alerted when thresholds are breached."},
    {"icon": "DollarSign", "title": "What-If Simulator", "description": "Model scenarios — what happens if you raise prices 5% or cut a shift?"}
  ]'::jsonb, 1),
  ('pain_points', 'The Restaurant Money Problem', 'Why most venues fly blind on financials', true, '[
    {"icon": "AlertTriangle", "stat": "60%", "title": "No Real-Time Visibility", "description": "Most operators wait until month-end to see if they made money."},
    {"icon": "Clock", "stat": "8hrs", "title": "Manual Spreadsheets", "description": "Hours wasted every week copying data between POS, payroll, and Excel."},
    {"icon": "TrendingDown", "stat": "35%+", "title": "Food Cost Blowouts", "description": "Without live tracking, food costs creep up unnoticed until it is too late."},
    {"icon": "DollarSign", "stat": "$50k", "title": "Lost Profit Annually", "description": "The average restaurant loses $50k/year to untracked waste and inefficiency."}
  ]'::jsonb, 2),
  ('how_we_fix_it', 'How MoneyOS Fixes It', 'From spreadsheet chaos to financial clarity', true, '[
    {"icon": "AlertTriangle", "problem": "Waiting until month-end for P&L", "solution": "Live P&L updates every hour from POS + payroll"},
    {"icon": "Clock", "problem": "8 hours/week on manual data entry", "solution": "Auto-sync from Square, Lightspeed, Xero, Deputy"},
    {"icon": "TrendingDown", "problem": "Food cost surprises at 38%", "solution": "Real-time alerts when food cost crosses 30%"},
    {"icon": "DollarSign", "problem": "No idea where money is leaking", "solution": "Forensic drill-down to find exact cost drivers"}
  ]'::jsonb, 3),
  ('social_proof', '', 'Built for hospitality · Trusted by restaurants, cafes & bars across Australia', true, '{}'::jsonb, 4),
  ('metrics', 'MoneyOS by the Numbers', '', true, '[
    {"value": "2.5", "suffix": "hrs", "label": "Saved per week on reporting"},
    {"value": "12", "suffix": "%", "label": "Average food cost reduction"},
    {"value": "5", "suffix": "min", "label": "To generate a full P&L"},
    {"value": "24", "suffix": "/7", "label": "Real-time financial visibility"}
  ]'::jsonb, 5),
  ('highlights', 'Platform Highlights', 'See what MoneyOS can do for your venue', true, '[
    {"icon": "BarChart3", "title": "Portfolio View", "description": "Multi-site operators can compare all venues side-by-side."},
    {"icon": "Shield", "title": "Audit Score", "description": "Financial health score with actionable recommendations."},
    {"icon": "Target", "title": "Break-Even Calculator", "description": "Know exactly how much revenue you need to cover costs."}
  ]'::jsonb, 6),
  ('testimonials', 'What Operators Are Saying', 'Hear from venues already using MoneyOS', true, '[
    {"quote": "We finally know our numbers in real-time instead of waiting for the accountant.", "name": "Sarah K.", "role": "Cafe Owner, Melbourne"},
    {"quote": "MoneyOS paid for itself in the first month — we found $3k in waste we did not know about.", "name": "James T.", "role": "Head Chef, Sydney"},
    {"quote": "The simulator alone is worth it. We modeled a price rise and saw the P&L impact instantly.", "name": "Mike R.", "role": "Restaurant Group, Brisbane"}
  ]'::jsonb, 7),
  ('final_cta', 'Take Control of Your Restaurant Finances', 'Join the venues already running smarter with MoneyOS', true, '{"button_text": "Start Free Trial", "button_link": "/auth?tab=signup&source=moneyos"}'::jsonb, 8),
  ('footer', '', '', true, '{}'::jsonb, 9);
