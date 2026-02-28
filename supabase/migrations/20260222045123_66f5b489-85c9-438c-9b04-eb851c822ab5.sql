
-- ============================================
-- PHASE 1: Sales Engine Database Schema
-- ============================================

-- 1. Add new columns to existing referrals table
ALTER TABLE public.referrals 
  ALTER COLUMN referred_user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS reward_value numeric(10,2),
  ADD COLUMN IF NOT EXISTS reward_type text,
  ADD COLUMN IF NOT EXISTS referred_reward_value numeric(10,2),
  ADD COLUMN IF NOT EXISTS referred_email text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS shared_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS reward_status text DEFAULT 'pending';

-- 2. Referral shares (channel analytics)
CREATE TABLE public.referral_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid REFERENCES public.referral_codes(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL,
  shared_at timestamptz DEFAULT now()
);
CREATE INDEX idx_referral_shares_code ON public.referral_shares(code_id);

-- 3. Referral settings (admin-configurable per plan tier)
CREATE TABLE public.referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_tier text NOT NULL,
  reward_type text NOT NULL DEFAULT 'credit',
  reward_value_percent numeric(5,2) DEFAULT 0,
  reward_value_credit numeric(10,2) DEFAULT 0,
  referred_reward_value_percent numeric(5,2) DEFAULT 0,
  referred_reward_value_credit numeric(10,2) DEFAULT 0,
  milestone_thresholds jsonb DEFAULT '[]'::jsonb,
  reward_cap numeric(10,2),
  qualification_event text DEFAULT 'first_paid_invoice',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Loyalty credits wallet (ledger-style)
CREATE TABLE public.loyalty_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  description text NOT NULL,
  source_type text,
  source_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_loyalty_credits_user ON public.loyalty_credits(user_id);

-- 5. Leads (sales pipeline)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  source text DEFAULT 'organic',
  source_referral_id uuid REFERENCES public.referrals(id),
  deal_value numeric(10,2),
  stage text DEFAULT 'lead',
  assigned_rep_id uuid,
  stage_entered_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_rep ON public.leads(assigned_rep_id);

-- 6. Lead activities
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  content text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id);

-- 7. Lead follow-ups
CREATE TABLE public.lead_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid,
  due_at timestamptz NOT NULL,
  note text,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_follow_ups_due ON public.lead_follow_ups(due_at) WHERE completed = false;

-- 8. Referral analytics (aggregated by cron)
CREATE TABLE public.referral_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  period_start date NOT NULL,
  period_end date NOT NULL,
  referrals_sent integer DEFAULT 0,
  signups integer DEFAULT 0,
  paid_conversions integer DEFAULT 0,
  revenue_generated numeric(12,2) DEFAULT 0,
  reward_cost numeric(12,2) DEFAULT 0,
  net_margin numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Referral shares: users see/create own
ALTER TABLE public.referral_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own shares" ON public.referral_shares
  FOR SELECT TO authenticated
  USING (code_id IN (SELECT id FROM public.referral_codes WHERE user_id = auth.uid()));

CREATE POLICY "Users create own shares" ON public.referral_shares
  FOR INSERT TO authenticated
  WITH CHECK (code_id IN (SELECT id FROM public.referral_codes WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage shares" ON public.referral_shares
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Referral settings: public read, admin write
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.referral_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage settings" ON public.referral_settings
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Loyalty credits: users see own
ALTER TABLE public.loyalty_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own credits" ON public.loyalty_credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage credits" ON public.loyalty_credits
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Leads: admin/sales only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Head chefs see own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_head_chef(auth.uid()));

-- Lead activities: admin/sales only
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lead activities" ON public.lead_activities
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Lead follow-ups: admin/sales only
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage follow-ups" ON public.lead_follow_ups
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- Referral analytics: admin only
ALTER TABLE public.referral_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read analytics" ON public.referral_analytics
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_credits;

-- Seed default referral settings
INSERT INTO public.referral_settings (plan_tier, reward_type, reward_value_credit, referred_reward_value_credit, milestone_thresholds, qualification_event)
VALUES 
  ('home_cook', 'credit', 10.00, 5.00, '[{"threshold": 5, "bonus": 25}, {"threshold": 10, "bonus": 50}]'::jsonb, 'first_paid_invoice'),
  ('pro', 'credit', 25.00, 15.00, '[{"threshold": 5, "bonus": 50}, {"threshold": 10, "bonus": 100}]'::jsonb, 'first_paid_invoice');
