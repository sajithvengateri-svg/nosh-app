/**
 * AI Usage Tracking & Quota Enforcement
 *
 * - checkAiQuota(): Hard cap — blocks AI calls when org exceeds monthly limit
 * - logAiUsage(): Fire-and-forget usage logging + threshold alerts
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QuotaCheckResult {
  allowed: boolean;
  pct_used: number;
  tokens_used: number;
  tokens_limit: number;
}

export interface UsageParams {
  org_id: string;
  user_id: string;
  function_name: string;
  provider: string;
  model: string;
  usage: { input_tokens: number; output_tokens: number; total_tokens: number };
  latency_ms?: number;
  has_image?: boolean;
}

// ─── Service Role Client ────────────────────────────────────────────────────

let _serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    _serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _serviceClient;
}

// ─── Org Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up the user's active org_id from org_memberships.
 * Returns null if user has no active membership.
 */
export async function getUserOrgId(
  userId: string,
  db?: SupabaseClient,
): Promise<string | null> {
  const client = db ?? getServiceClient();
  const { data } = await client
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return data?.org_id ?? null;
}

// ─── Quota Gate ─────────────────────────────────────────────────────────────

/**
 * Check if an org is within their monthly AI token quota.
 * Call BEFORE making an AI request. Returns allowed: false if limit reached.
 */
export async function checkAiQuota(
  orgId: string,
  db?: SupabaseClient,
): Promise<QuotaCheckResult> {
  const client = db ?? getServiceClient();

  const { data, error } = await client
    .from("v_org_token_usage_current_month")
    .select("tokens_used, tokens_limit, pct_used")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data) {
    // If no quota data exists (e.g. no quota row for tier), allow by default
    return { allowed: true, pct_used: 0, tokens_used: 0, tokens_limit: 0 };
  }

  // If tokens_limit is 0 or null, treat as unlimited
  if (!data.tokens_limit) {
    return { allowed: true, pct_used: 0, tokens_used: data.tokens_used ?? 0, tokens_limit: 0 };
  }

  return {
    allowed: (data.tokens_used ?? 0) < data.tokens_limit,
    pct_used: data.pct_used ?? 0,
    tokens_used: data.tokens_used ?? 0,
    tokens_limit: data.tokens_limit,
  };
}

// ─── Usage Logger ───────────────────────────────────────────────────────────

/**
 * Log an AI usage event. Fire-and-forget — does not block the caller.
 * Also checks threshold alerts asynchronously.
 */
export function logAiUsage(params: UsageParams, db?: SupabaseClient): void {
  const client = db ?? getServiceClient();

  // Run everything async, don't block
  _doLogAiUsage(client, params).catch((err) => {
    console.error("logAiUsage error:", err);
  });
}

async function _doLogAiUsage(db: SupabaseClient, params: UsageParams): Promise<void> {
  // 1. Look up cost rate for this provider/model
  const { data: rate } = await db
    .from("ai_cost_rates")
    .select("input_cost_per_1k, output_cost_per_1k, image_cost_per_call")
    .eq("provider", params.provider)
    .eq("model", params.model)
    .is("effective_until", null)
    .maybeSingle();

  // 2. Calculate cost in USD
  const cost_usd = rate
    ? (params.usage.input_tokens / 1000) * (rate.input_cost_per_1k ?? 0) +
      (params.usage.output_tokens / 1000) * (rate.output_cost_per_1k ?? 0) +
      (params.has_image ? (rate.image_cost_per_call ?? 0) : 0)
    : 0;

  // 3. Insert usage log
  await db.from("ai_usage_log").insert({
    org_id: params.org_id,
    user_id: params.user_id,
    function_name: params.function_name,
    provider: params.provider,
    model: params.model,
    input_tokens: params.usage.input_tokens,
    output_tokens: params.usage.output_tokens,
    total_tokens: params.usage.total_tokens,
    cost_usd,
    latency_ms: params.latency_ms ?? null,
    has_image: params.has_image ?? false,
  });

  // 4. Check threshold alerts
  await _checkUsageThresholds(db, params.org_id);
}

// ─── Threshold Alerts ───────────────────────────────────────────────────────

const THRESHOLDS = [
  { pct: 50, type: "threshold_50" },
  { pct: 80, type: "threshold_80" },
  { pct: 100, type: "threshold_100" },
];

async function _checkUsageThresholds(db: SupabaseClient, orgId: string): Promise<void> {
  const { data } = await db
    .from("v_org_token_usage_current_month")
    .select("tokens_used, tokens_limit, pct_used")
    .eq("org_id", orgId)
    .maybeSingle();

  if (!data || !data.tokens_limit) return;

  const billingMonth = new Date();
  billingMonth.setDate(1);
  billingMonth.setHours(0, 0, 0, 0);
  const billingMonthStr = billingMonth.toISOString().slice(0, 10);

  for (const t of THRESHOLDS) {
    if ((data.pct_used ?? 0) >= t.pct) {
      // Upsert — UNIQUE constraint prevents duplicate alerts per type per month
      await db.from("ai_usage_alerts").upsert(
        {
          org_id: orgId,
          user_id: null,
          alert_type: t.type,
          billing_month: billingMonthStr,
          tokens_used: data.tokens_used,
          tokens_limit: data.tokens_limit,
          pct_used: data.pct_used,
          channel: "in_app",
        },
        {
          onConflict: "org_id,COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),alert_type,billing_month",
          ignoreDuplicates: true,
        },
      );
    }
  }
}
