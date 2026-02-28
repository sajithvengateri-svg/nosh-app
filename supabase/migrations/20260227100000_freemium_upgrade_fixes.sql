-- =============================================================
-- Freemium Upgrade Fixes
-- 1. org_subscription_overrides table (missing from initial migration)
-- 2. AI addon Stripe price ID columns (were stored as numeric, need text for Stripe IDs)
-- 3. Unique constraint on subscription_plans(product_key, tier) for upsert
-- 4. Unique partial index on stripe_event_id for webhook idempotency
-- 5. freemium_nudge_days column safety net
-- =============================================================

-- ----- 1. org_subscription_overrides table -----
CREATE TABLE IF NOT EXISTS org_subscription_overrides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_key text NOT NULL,
  forced_tier text NOT NULL,
  forced_by   uuid REFERENCES auth.users(id),
  notes       text,
  valid_from  timestamptz,
  valid_until timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_overrides_org
  ON org_subscription_overrides (org_id, created_at DESC);

ALTER TABLE org_subscription_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view overrides" ON org_subscription_overrides;
CREATE POLICY "Admins can view overrides"
  ON org_subscription_overrides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert overrides" ON org_subscription_overrides;
CREATE POLICY "Service role can insert overrides"
  ON org_subscription_overrides FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update overrides" ON org_subscription_overrides;
CREATE POLICY "Service role can update overrides"
  ON org_subscription_overrides FOR UPDATE
  USING (true);

-- ----- 2. AI addon Stripe price ID text columns -----
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS ai_addon_stripe_price_monthly text,
  ADD COLUMN IF NOT EXISTS ai_addon_stripe_price_yearly  text;

-- ----- 3. Unique constraint for upsert -----
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscription_plans_product_key_tier_key'
  ) THEN
    ALTER TABLE subscription_plans
      ADD CONSTRAINT subscription_plans_product_key_tier_key
      UNIQUE (product_key, tier);
  END IF;
END $$;

-- ----- 4. Unique partial index on stripe_event_id for idempotency -----
CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_events_stripe_event
  ON org_subscription_events (stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

-- ----- 5. freemium_nudge_days safety net -----
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS freemium_nudge_days integer DEFAULT 14;
