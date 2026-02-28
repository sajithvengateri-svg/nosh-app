-- =============================================================
-- ROLLBACK: freemium_upgrade_schema (20260227000000 + 20260227100000)
-- NOT APPLIED — kept as insurance in case we need to reverse
-- the freemium upgrade migrations.
--
-- To apply: copy this into a new timestamped migration file
-- and run `npx supabase db push`
-- =============================================================

-- 1. Drop analytics view
DROP VIEW IF EXISTS subscription_analytics;

-- 2. Drop org_subscription_overrides table (from fixes migration)
DROP TABLE IF EXISTS org_subscription_overrides;

-- 3. Drop upgrade_nudges table
DROP TABLE IF EXISTS upgrade_nudges;

-- 4. Drop org_subscription_events table (idempotency index drops with table)
DROP TABLE IF EXISTS org_subscription_events;

-- 5. Remove columns from subscription_plans
ALTER TABLE subscription_plans
  DROP COLUMN IF EXISTS stripe_price_id_monthly,
  DROP COLUMN IF EXISTS stripe_price_id_yearly,
  DROP COLUMN IF EXISTS ai_addon_price_monthly,
  DROP COLUMN IF EXISTS ai_addon_price_yearly,
  DROP COLUMN IF EXISTS ai_addon_stripe_price_monthly,
  DROP COLUMN IF EXISTS ai_addon_stripe_price_yearly,
  DROP COLUMN IF EXISTS trial_days,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS freemium_nudge_days;

-- 6. Drop unique constraint on subscription_plans
ALTER TABLE subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_product_key_tier_key;

-- 7. Remove columns from organizations
ALTER TABLE organizations
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS ai_addon_active,
  DROP COLUMN IF EXISTS upgrade_nudge_shown_at,
  DROP COLUMN IF EXISTS upgraded_at;

-- 8. Drop indexes (if not already dropped by column drops)
DROP INDEX IF EXISTS idx_organizations_stripe_customer;
DROP INDEX IF EXISTS idx_organizations_subscription_tier;
