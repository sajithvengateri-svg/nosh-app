-- ============================================================================
-- Cost Accounting & Live P&L System
-- ============================================================================
-- Adds three-tier cost tracking (user → org → system), AI usage metering,
-- hard quota enforcement, credit purchases, admin overrides, and P&L views.
-- ============================================================================

-- ─── 1. AI Usage Log ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name text NOT NULL,
  provider      text NOT NULL,
  model         text NOT NULL,
  input_tokens  int NOT NULL DEFAULT 0,
  output_tokens int NOT NULL DEFAULT 0,
  total_tokens  int NOT NULL DEFAULT 0,
  cost_usd      numeric(10,6) NOT NULL DEFAULT 0,
  latency_ms    int,
  has_image     boolean DEFAULT false,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org_date ON ai_usage_log (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_function ON ai_usage_log (function_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_month ON ai_usage_log (org_id, created_at);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
-- No public SELECT policy — accessed via service role (Edge Functions + admin dashboard)

-- ─── 2. AI Cost Rates ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_cost_rates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            text NOT NULL,
  model               text NOT NULL,
  input_cost_per_1k   numeric(10,6) NOT NULL,
  output_cost_per_1k  numeric(10,6) NOT NULL,
  image_cost_per_call numeric(10,6) DEFAULT 0,
  source              text DEFAULT 'manual',
  effective_from      date NOT NULL DEFAULT CURRENT_DATE,
  effective_until     date,
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (provider, model, effective_from)
);

ALTER TABLE ai_cost_rates ENABLE ROW LEVEL SECURITY;

-- Seed current rates (Feb 2026)
INSERT INTO ai_cost_rates (provider, model, input_cost_per_1k, output_cost_per_1k, image_cost_per_call, source) VALUES
  ('gemini',    'gemini-2.0-flash',       0.000075, 0.000300, 0.000040, 'manual'),
  ('gemini',    'gemini-3-flash',         0.000075, 0.000300, 0.000040, 'manual'),
  ('openai',    'gpt-4o-mini',            0.000150, 0.000600, 0.000070, 'manual'),
  ('anthropic', 'claude-sonnet-4-20250514', 0.003000, 0.015000, 0.004800, 'manual')
ON CONFLICT (provider, model, effective_from) DO NOTHING;

-- ─── 3. AI Token Quotas ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_token_quotas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_tier text NOT NULL,
  product_key       text DEFAULT 'chefos',
  monthly_tokens    bigint NOT NULL,
  ai_addon_bonus    bigint DEFAULT 0,
  is_active         boolean DEFAULT true,
  UNIQUE (subscription_tier, product_key)
);

ALTER TABLE ai_token_quotas ENABLE ROW LEVEL SECURITY;

-- Seed default quotas
INSERT INTO ai_token_quotas (subscription_tier, product_key, monthly_tokens, ai_addon_bonus) VALUES
  ('free',    'chefos', 50000,    0),
  ('premium', 'chefos', 500000,   250000),
  ('pro',     'chefos', 2000000,  1000000)
ON CONFLICT (subscription_tier, product_key) DO NOTHING;

-- ─── 4. AI Quota Overrides (admin cap override) ─────────────────────────────

CREATE TABLE IF NOT EXISTS ai_quota_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  override_tokens bigint NOT NULL,
  reason          text,
  set_by          uuid,
  valid_from      date DEFAULT CURRENT_DATE,
  valid_until     date,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE ai_quota_overrides ENABLE ROW LEVEL SECURITY;

-- ─── 5. AI Usage Alerts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_usage_alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid,
  alert_type    text NOT NULL,
  billing_month date NOT NULL,
  tokens_used   bigint NOT NULL,
  tokens_limit  bigint NOT NULL,
  pct_used      numeric(5,2) NOT NULL,
  notified_at   timestamptz DEFAULT now(),
  channel       text DEFAULT 'in_app',
  metadata      jsonb DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_alerts_unique
  ON ai_usage_alerts (org_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), alert_type, billing_month);

ALTER TABLE ai_usage_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view alerts" ON ai_usage_alerts
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));

-- ─── 6. AI Credit Purchases ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_credit_purchases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  tokens_purchased  bigint NOT NULL,
  amount_usd        numeric(10,2) NOT NULL,
  currency          text DEFAULT 'usd',
  stripe_payment_id text,
  status            text DEFAULT 'pending',
  billing_month     date,
  created_by        uuid,
  paid_at           timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_org ON ai_credit_purchases (org_id, status, billing_month);

ALTER TABLE ai_credit_purchases ENABLE ROW LEVEL SECURITY;

-- ─── 7. AI Credit Rate (pricing for token bundles) ──────────────────────────

CREATE TABLE IF NOT EXISTS ai_credit_rate (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tokens_per_unit bigint NOT NULL DEFAULT 100000,
  price_per_unit  numeric(10,2) NOT NULL,
  currency        text DEFAULT 'usd',
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE ai_credit_rate ENABLE ROW LEVEL SECURITY;

-- Seed default credit bundles
INSERT INTO ai_credit_rate (tokens_per_unit, price_per_unit) VALUES
  (100000,  5.00),
  (500000,  20.00),
  (1000000, 35.00)
ON CONFLICT DO NOTHING;

-- ─── 8. Fixed Costs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fixed_costs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL,
  amount_usd  numeric(10,2) NOT NULL,
  frequency   text DEFAULT 'monthly',
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  is_active   boolean DEFAULT true,
  notes       text,
  starts_at   date NOT NULL DEFAULT CURRENT_DATE,
  ends_at     date,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;

-- ─── 9. Variable Cost Log ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS variable_cost_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid,
  cost_type   text NOT NULL,
  description text,
  amount_usd  numeric(10,6) NOT NULL,
  quantity    numeric DEFAULT 1,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_var_cost_org_date ON variable_cost_log (org_id, created_at DESC);

ALTER TABLE variable_cost_log ENABLE ROW LEVEL SECURITY;

-- ─── 10. Revenue Log ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revenue_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  revenue_type    text NOT NULL,
  amount_usd      numeric(10,2) NOT NULL,
  currency        text DEFAULT 'usd',
  original_amount numeric(10,2),
  stripe_event_id text,
  period_start    date,
  period_end      date,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_org_date ON revenue_log (org_id, created_at DESC);

ALTER TABLE revenue_log ENABLE ROW LEVEL SECURITY;

-- ─── 11. Views ──────────────────────────────────────────────────────────────

-- 11a. Org token usage for current month (powers usage pill + quota gate)
CREATE OR REPLACE VIEW v_org_token_usage_current_month AS
SELECT
  o.id AS org_id,
  COALESCE(usage.tokens_used, 0) AS tokens_used,
  COALESCE(
    ov.override_tokens,
    COALESCE(q.monthly_tokens, 0)
      + CASE WHEN o.ai_addon_active THEN COALESCE(q.ai_addon_bonus, 0) ELSE 0 END
      + COALESCE(cr.purchased_tokens, 0)
  ) AS tokens_limit,
  CASE
    WHEN COALESCE(
      ov.override_tokens,
      COALESCE(q.monthly_tokens, 0)
        + CASE WHEN o.ai_addon_active THEN COALESCE(q.ai_addon_bonus, 0) ELSE 0 END
        + COALESCE(cr.purchased_tokens, 0)
    ) = 0 THEN 0
    ELSE ROUND(
      COALESCE(usage.tokens_used, 0)::numeric /
      COALESCE(
        ov.override_tokens,
        COALESCE(q.monthly_tokens, 0)
          + CASE WHEN o.ai_addon_active THEN COALESCE(q.ai_addon_bonus, 0) ELSE 0 END
          + COALESCE(cr.purchased_tokens, 0)
      ) * 100,
      1
    )
  END AS pct_used
FROM organizations o
LEFT JOIN ai_token_quotas q
  ON q.subscription_tier = o.subscription_tier AND q.is_active = true
LEFT JOIN ai_quota_overrides ov
  ON ov.org_id = o.id
  AND ov.valid_from <= CURRENT_DATE
  AND (ov.valid_until IS NULL OR ov.valid_until >= CURRENT_DATE)
LEFT JOIN LATERAL (
  SELECT SUM(total_tokens) AS tokens_used
  FROM ai_usage_log a
  WHERE a.org_id = o.id AND a.created_at >= date_trunc('month', now())
) usage ON true
LEFT JOIN LATERAL (
  SELECT SUM(tokens_purchased) AS purchased_tokens
  FROM ai_credit_purchases cp
  WHERE cp.org_id = o.id AND cp.status = 'paid'
    AND (cp.billing_month IS NULL OR cp.billing_month = date_trunc('month', now())::date)
) cr ON true;

-- 11b. Per-user token usage for current month
CREATE OR REPLACE VIEW v_user_token_usage_current_month AS
SELECT
  user_id, org_id,
  SUM(total_tokens) AS tokens_used,
  SUM(cost_usd) AS cost_usd,
  COUNT(*) AS ai_calls
FROM ai_usage_log
WHERE created_at >= date_trunc('month', now())
GROUP BY user_id, org_id;

-- 11c. Org-level monthly P&L
CREATE OR REPLACE VIEW v_org_pnl_monthly AS
WITH active_org_count AS (
  SELECT GREATEST(COUNT(DISTINCT id), 1) AS cnt
  FROM organizations WHERE subscription_tier != 'free'
),
monthly_fixed AS (
  SELECT
    CASE frequency
      WHEN 'monthly' THEN amount_usd
      WHEN 'yearly' THEN amount_usd / 12
      ELSE 0
    END AS monthly_amount,
    org_id
  FROM fixed_costs WHERE is_active = true
)
SELECT
  sub.org_id,
  sub.month,
  SUM(sub.revenue) AS revenue,
  SUM(sub.ai_cost) AS ai_cost,
  SUM(sub.variable_cost) AS variable_cost,
  SUM(sub.fixed_cost) AS fixed_cost_allocated,
  SUM(sub.revenue) - SUM(sub.ai_cost) - SUM(sub.variable_cost) - SUM(sub.fixed_cost) AS net_pnl
FROM (
  SELECT org_id, date_trunc('month', created_at)::date AS month,
    amount_usd AS revenue, 0::numeric AS ai_cost, 0::numeric AS variable_cost, 0::numeric AS fixed_cost
  FROM revenue_log
  UNION ALL
  SELECT org_id, date_trunc('month', created_at)::date,
    0, cost_usd, 0, 0
  FROM ai_usage_log
  UNION ALL
  SELECT org_id, date_trunc('month', created_at)::date,
    0, 0, amount_usd, 0
  FROM variable_cost_log
  UNION ALL
  SELECT o.id, date_trunc('month', now())::date,
    0, 0, 0, mf.monthly_amount / aoc.cnt
  FROM monthly_fixed mf
  CROSS JOIN active_org_count aoc
  CROSS JOIN organizations o
  WHERE mf.org_id IS NULL AND o.subscription_tier != 'free'
  UNION ALL
  SELECT mf.org_id, date_trunc('month', now())::date,
    0, 0, 0, mf.monthly_amount
  FROM monthly_fixed mf WHERE mf.org_id IS NOT NULL
) sub
WHERE sub.org_id IS NOT NULL
GROUP BY sub.org_id, sub.month;

-- 11d. System-wide monthly P&L
CREATE OR REPLACE VIEW v_system_pnl_monthly AS
SELECT
  month,
  SUM(revenue) AS total_revenue,
  SUM(ai_cost) AS total_ai_cost,
  SUM(variable_cost) AS total_variable_cost,
  SUM(fixed_cost_allocated) AS total_fixed_cost,
  SUM(net_pnl) AS total_net_pnl,
  CASE WHEN SUM(revenue) > 0 THEN ROUND(SUM(net_pnl) / SUM(revenue) * 100, 1) ELSE 0 END AS margin_pct
FROM v_org_pnl_monthly
GROUP BY month
ORDER BY month DESC;

-- 11e. Pricing intelligence
CREATE OR REPLACE VIEW v_pricing_intelligence AS
SELECT
  o.subscription_tier,
  COUNT(DISTINCT a.org_id) AS org_count,
  ROUND(AVG(a.monthly_tokens)) AS avg_tokens_per_org,
  ROUND(AVG(a.monthly_cost)::numeric, 4) AS avg_cost_per_org,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY a.monthly_cost)::numeric, 4) AS median_cost,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY a.monthly_cost)::numeric, 4) AS p95_cost
FROM (
  SELECT org_id, SUM(total_tokens) AS monthly_tokens, SUM(cost_usd) AS monthly_cost
  FROM ai_usage_log
  WHERE created_at >= date_trunc('month', now())
  GROUP BY org_id
) a
JOIN organizations o ON o.id = a.org_id
GROUP BY o.subscription_tier;

-- ─── 12. RPC: get_org_ai_usage (for user-facing pill, SECURITY DEFINER) ────

CREATE OR REPLACE FUNCTION get_org_ai_usage(p_org_id uuid)
RETURNS TABLE(tokens_used bigint, tokens_limit bigint, pct_used numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.tokens_used,
    v.tokens_limit,
    v.pct_used
  FROM v_org_token_usage_current_month v
  WHERE v.org_id = p_org_id
    AND p_org_id IN (SELECT get_user_org_ids(auth.uid()));
$$;
