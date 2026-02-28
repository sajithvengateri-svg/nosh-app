-- Phase 6c: Nosh+ Premium Subscription
-- Subscriptions, leftovers, savings, premium recipes, autopilot

-- ── Subscriptions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ds_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'nosh_plus',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','trial')),
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subscriptions" ON ds_subscriptions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON ds_subscriptions(user_id);

-- ── Leftover Portions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ds_leftover_portions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES ds_recipes(id),
  recipe_title TEXT NOT NULL,
  portions_remaining DECIMAL(4,1) NOT NULL,
  use_by TIMESTAMPTZ,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','used','discarded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ds_leftover_portions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own leftovers" ON ds_leftover_portions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Savings Snapshots ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ds_savings_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ds_user_profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  planned_total DECIMAL(8,2),
  actual_total DECIMAL(8,2),
  savings_amount DECIMAL(8,2),
  meals_cooked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE ds_savings_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own savings" ON ds_savings_snapshots FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Premium recipes flag ───────────────────────────────────────────
ALTER TABLE ds_recipes ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- ── Autopilot settings ─────────────────────────────────────────────
ALTER TABLE ds_user_profiles
  ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS autopilot_day TEXT DEFAULT 'sunday',
  ADD COLUMN IF NOT EXISTS autopilot_time TEXT DEFAULT '18:00';
