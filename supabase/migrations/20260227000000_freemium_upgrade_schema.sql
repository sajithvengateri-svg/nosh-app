-- =============================================================
-- Freemium → Paid Upgrade Schema
-- Adds Stripe billing columns, subscription events audit table,
-- upgrade nudges table, and AI add-on tracking.
-- =============================================================

-- ----- 1. Organizations: Stripe + upgrade columns -----
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id    text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS ai_addon_active       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upgrade_nudge_shown_at timestamptz,
  ADD COLUMN IF NOT EXISTS upgraded_at           timestamptz;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
  ON organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier
  ON organizations (subscription_tier);

-- ----- 2. Subscription plans: Stripe price IDs + AI addon pricing -----
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS stripe_price_id_monthly text,
  ADD COLUMN IF NOT EXISTS stripe_price_id_yearly  text,
  ADD COLUMN IF NOT EXISTS ai_addon_price_monthly  numeric(10,2),
  ADD COLUMN IF NOT EXISTS ai_addon_price_yearly   numeric(10,2),
  ADD COLUMN IF NOT EXISTS trial_days              integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency                text NOT NULL DEFAULT 'gbp';

-- ----- 3. Subscription events audit trail -----
CREATE TABLE IF NOT EXISTS org_subscription_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type    text NOT NULL,  -- e.g. 'checkout_started','subscription_created','subscription_upgraded','subscription_cancelled','payment_failed','nudge_sent','admin_override','trial_started','trial_ended'
  from_tier     text,
  to_tier       text,
  stripe_event_id text,
  metadata      jsonb DEFAULT '{}',
  actor_id      uuid,           -- user who triggered (null for system/webhook)
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_org
  ON org_subscription_events (org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sub_events_type
  ON org_subscription_events (event_type, created_at DESC);

-- ----- 4. Upgrade nudges table -----
CREATE TABLE IF NOT EXISTS upgrade_nudges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type    text NOT NULL DEFAULT 'upgrade_prompt',  -- 'upgrade_prompt', 'sneak_peek', 'trial_expiry'
  nudge_channel text NOT NULL DEFAULT 'in_app',          -- 'in_app', 'push', 'email'
  seen_at       timestamptz,
  dismissed_at  timestamptz,
  converted_at  timestamptz,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nudges_org_user
  ON upgrade_nudges (org_id, user_id, created_at DESC);

-- ----- 5. RLS Policies -----

-- org_subscription_events: org members can read, service_role writes
ALTER TABLE org_subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view subscription events" ON org_subscription_events;
CREATE POLICY "Org members can view subscription events"
  ON org_subscription_events FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM employee_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert subscription events" ON org_subscription_events;
CREATE POLICY "Service role can insert subscription events"
  ON org_subscription_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscription events" ON org_subscription_events;
CREATE POLICY "Service role can update subscription events"
  ON org_subscription_events FOR UPDATE
  USING (true);

-- upgrade_nudges: users see their own nudges
ALTER TABLE upgrade_nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own nudges" ON upgrade_nudges;
CREATE POLICY "Users can view their own nudges"
  ON upgrade_nudges FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own nudges" ON upgrade_nudges;
CREATE POLICY "Users can update their own nudges"
  ON upgrade_nudges FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert nudges" ON upgrade_nudges;
CREATE POLICY "Service role can insert nudges"
  ON upgrade_nudges FOR INSERT
  WITH CHECK (true);

-- ----- 6. Seed default Stripe price placeholders for existing plans -----
-- (Admins will fill real Stripe price IDs from the CRM)
-- No seeding needed — AdminPlans UI will let admins set these.

-- ----- 7. Analytics view: subscription funnel -----
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT
  o.id AS org_id,
  o.name AS org_name,
  o.subscription_tier,
  o.ai_addon_active,
  o.created_at AS org_created_at,
  o.upgraded_at,
  o.upgrade_nudge_shown_at,
  sp.product_key,
  sp.product_label,
  sp.tier AS plan_tier,
  sp.price_monthly,
  sp.price_yearly,
  -- Days since signup
  EXTRACT(DAY FROM now() - o.created_at)::integer AS days_since_signup,
  -- Days since nudge
  CASE WHEN o.upgrade_nudge_shown_at IS NOT NULL
    THEN EXTRACT(DAY FROM now() - o.upgrade_nudge_shown_at)::integer
    ELSE NULL
  END AS days_since_nudge,
  -- Converted?
  CASE WHEN o.upgraded_at IS NOT NULL THEN true ELSE false END AS has_converted,
  -- Days to convert
  CASE WHEN o.upgraded_at IS NOT NULL
    THEN EXTRACT(DAY FROM o.upgraded_at - o.created_at)::integer
    ELSE NULL
  END AS days_to_convert
FROM organizations o
LEFT JOIN subscription_plans sp
  ON sp.product_key = o.store_mode AND sp.tier = o.subscription_tier;
