import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check — only admins
  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const admin = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "daily"; // "daily" | "chat"

    // ─── Chat mode — answer ad-hoc questions ────────────────────────────
    if (mode === "chat") {
      const question = body.question;
      if (!question) {
        return new Response(JSON.stringify({ error: "question required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Gather context for the question
      const context = await gatherContext(admin);

      const result = await aiChat({
        messages: [
          {
            role: "system",
            content: `You are the ChefOS Brain — an analytics AI for a beta test of a kitchen management app.
You have access to the following beta test data. Answer the user's question based on this data.
Be concise, data-driven, and actionable.

${context}`,
          },
          { role: "user", content: question },
        ],
        model: "claude-3-5-haiku-latest",
        temperature: 0.3,
      });

      return new Response(
        JSON.stringify({ answer: result.content, usage: result.usage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Daily analysis mode ────────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];

    // Check if already generated today (unless force)
    if (!body.force) {
      const { data: existing } = await admin
        .from("brain_insights")
        .select("id")
        .eq("insight_date", today)
        .eq("insight_type", "daily")
        .maybeSingle();
      if (existing) {
        return new Response(
          JSON.stringify({ message: "Already generated today", id: existing.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const context = await gatherContext(admin);

    const prompt = `You are the ChefOS Brain analytics engine. Analyze the following beta test data and produce a daily insight report.

${context}

Respond in this exact JSON format:
{
  "summary": "1-2 sentence overall health summary",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "vendor_health": "1-2 sentence vendor health summary",
  "engagement_score": 0-100,
  "monetisation_summary": "brief revenue health summary including deal code performance and fee generation",
  "deal_performance": "per-vendor redemption rates and observations",
  "payment_health": { "all_current": true, "overdue_vendors": [], "enforcement_needed": [] },
  "fraud_signals": { "suspicious_patterns": [], "recommended_actions": [] },
  "revenue_forecast": { "weekly_trend": "up/down/flat", "projected_monthly_fees": 0, "growth_vendor": "name", "churn_risk_vendor": "name" }
}`;

    const result = await aiChat({
      messages: [
        { role: "system", content: "You are a data analyst. Respond only in valid JSON." },
        { role: "user", content: prompt },
      ],
      model: "gemini-2.0-flash",
      temperature: 0.2,
    });

    let parsed: Record<string, unknown> = {};
    try {
      const cleaned = (result.content || "").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { summary: result.content, raw: true };
    }

    // Upsert insight
    const { data: insight, error } = await admin
      .from("brain_insights")
      .upsert(
        {
          insight_date: today,
          insight_type: "daily",
          provider: "gemini",
          prompt_tokens: result.usage?.input_tokens ?? 0,
          completion_tokens: result.usage?.output_tokens ?? 0,
          result: parsed,
        },
        { onConflict: "insight_date,insight_type" }
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, insight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Gather beta data context ───────────────────────────────────────────────

async function gatherContext(admin: any): Promise<string> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: testerTargets },
    { data: testResults },
    { data: bugs },
    { count: totalEvents },
    { data: recentEvents },
    { data: goChecks },
    { data: vendors },
    { data: deals },
    { data: dealCodes },
    { data: invoices },
    { data: enforcement },
    { data: vendorProfiles },
  ] = await Promise.all([
    admin.from("test_plan_tester_targets").select("*"),
    admin.from("test_plan_results").select("case_id, variant, status"),
    admin.from("test_plan_bugs").select("title, severity, status, variant"),
    admin.from("beta_analytics_events").select("*", { count: "exact", head: true }),
    admin.from("beta_analytics_events").select("variant, event_type, page, action, duration_ms").order("created_at", { ascending: false }).limit(200),
    admin.from("test_plan_go_checks").select("id, label, passed"),
    admin.from("vendor_beta_profiles").select("vendor_name, vendor_type, quality_score, catalogue_count, onboarded_at"),
    admin.from("vendor_beta_deals").select("vendor_id, deal_type, status, impressions, clicks, redemptions"),
    // Monetisation: deal codes from last 7 days
    admin.from("deal_codes").select("status, transaction_amount, vendor_id, redeemed_at").gte("created_at", sevenDaysAgo),
    // Monetisation: invoices from last 30 days
    admin.from("vendor_invoices").select("vendor_id, status, total_amount, redemption_count, tracked_sales_total").gte("created_at", thirtyDaysAgo),
    // Monetisation: enforcement actions from last 30 days
    admin.from("vendor_enforcement_log").select("vendor_id, action, created_at").gte("created_at", thirtyDaysAgo),
    // Vendor profiles with payment status
    admin.from("vendor_profiles").select("id, business_name, payment_status"),
  ]);

  // Summarize tester targets
  const totalTarget = (testerTargets || []).reduce((s: number, t: any) => s + (t.target_count || 0), 0);
  const totalActual = (testerTargets || []).reduce((s: number, t: any) => s + (t.actual_count || 0), 0);

  // Summarize test results
  const passed = (testResults || []).filter((r: any) => r.status === "pass").length;
  const failed = (testResults || []).filter((r: any) => r.status === "fail").length;
  const blocked = (testResults || []).filter((r: any) => r.status === "blocked").length;

  // Bug summary
  const openBugs = (bugs || []).filter((b: any) => b.status === "open");
  const p1Open = openBugs.filter((b: any) => b.severity === "P1").length;

  // Go checks
  const goPass = (goChecks || []).filter((c: any) => c.passed).length;
  const goTotal = (goChecks || []).length;

  // Page usage from recent events
  const pageMap: Record<string, number> = {};
  for (const e of recentEvents || []) {
    if (e.page) pageMap[e.page] = (pageMap[e.page] || 0) + 1;
  }
  const topPages = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Vendor summary
  const vendorSummary = (vendors || []).map((v: any) =>
    `${v.vendor_name} (${v.vendor_type}): score=${v.quality_score}, products=${v.catalogue_count}, onboarded=${v.onboarded_at ? "yes" : "no"}`
  ).join("\n");

  // Deal summary
  const activeDeals = (deals || []).filter((d: any) => d.status === "active").length;
  const totalImpressions = (deals || []).reduce((s: number, d: any) => s + (d.impressions || 0), 0);
  const totalRedemptions = (deals || []).reduce((s: number, d: any) => s + (d.redemptions || 0), 0);

  // Monetisation aggregates
  const codes = dealCodes || [];
  const codesClaimed = codes.length;
  const codesRedeemed = codes.filter((c: any) => c.status === "redeemed").length;
  const codesExpired = codes.filter((c: any) => c.status === "expired").length;
  const codesActive = codes.filter((c: any) => c.status === "active").length;
  const redemptionRate = codesClaimed > 0 ? Math.round((codesRedeemed / codesClaimed) * 100) : 0;
  const totalTrackedSales = codes
    .filter((c: any) => c.status === "redeemed")
    .reduce((s: number, c: any) => s + (Number(c.transaction_amount) || 0), 0);
  const totalUsageFees = Math.round(totalTrackedSales * 0.02 * 100) / 100;
  const avgTransaction = codesRedeemed > 0 ? Math.round((totalTrackedSales / codesRedeemed) * 100) / 100 : 0;

  // Per-vendor deal code breakdown
  const vendorCodeMap = new Map<string, { redemptions: number; sales: number }>();
  for (const c of codes.filter((c: any) => c.status === "redeemed")) {
    const existing = vendorCodeMap.get(c.vendor_id) ?? { redemptions: 0, sales: 0 };
    existing.redemptions++;
    existing.sales += Number(c.transaction_amount) || 0;
    vendorCodeMap.set(c.vendor_id, existing);
  }
  const profileMap = new Map<string, string>();
  for (const vp of vendorProfiles || []) {
    profileMap.set(vp.id, vp.business_name);
  }
  const vendorCodeBreakdown = [...vendorCodeMap.entries()]
    .map(([vid, d]) => {
      const name = profileMap.get(vid) ?? vid.slice(0, 8);
      const fee = Math.round(d.sales * 0.02 * 100) / 100;
      const payStatus = (vendorProfiles || []).find((v: any) => v.id === vid)?.payment_status ?? "unknown";
      return `  ${name}: ${d.redemptions} redemptions, $${d.sales.toFixed(2)} tracked, $${fee} usage fee, payment: ${payStatus}`;
    })
    .join("\n");

  // Invoice health
  const inv = invoices || [];
  const paidInv = inv.filter((i: any) => i.status === "paid").length;
  const overdueInv = inv.filter((i: any) => i.status === "overdue").length;
  const disputedInv = inv.filter((i: any) => i.status === "disputed").length;

  // Enforcement actions
  const enforcementList = (enforcement || [])
    .slice(0, 10)
    .map((e: any) => `  ${e.action} (vendor ${profileMap.get(e.vendor_id) ?? e.vendor_id.slice(0, 8)}) at ${e.created_at}`)
    .join("\n");

  // Unique vendors with codes
  const uniqueVendorsWithCodes = new Set(codes.filter((c: any) => c.status === "redeemed").map((c: any) => c.vendor_id)).size;

  return `
BETA TEST DATA (as of ${new Date().toISOString()}):

TESTERS: ${totalActual}/${totalTarget} recruited
TEST RESULTS: ${passed} passed, ${failed} failed, ${blocked} blocked (of ~2700 possible case×variant combos)
BUGS: ${openBugs.length} open (${p1Open} P1)
GO/NO-GO: ${goPass}/${goTotal} checks passing
TOTAL ANALYTICS EVENTS: ${totalEvents || 0}

TOP PAGES (last 200 events):
${topPages.map(([p, c]) => `  ${p}: ${c} events`).join("\n")}

OPEN BUGS:
${openBugs.slice(0, 20).map((b: any) => `  [${b.severity}] ${b.title} (${b.variant || "all"})`).join("\n") || "  None"}

VENDORS:
${vendorSummary || "  No vendors yet"}

DEALS: ${activeDeals} active, ${totalImpressions} impressions, ${totalRedemptions} redemptions

GO/NO-GO CHECKLIST:
${(goChecks || []).map((c: any) => `  ${c.passed ? "✓" : "✗"} ${c.label}`).join("\n")}

MONETISATION DATA (last 7 days):
- Deal codes: ${codesClaimed} claimed, ${codesRedeemed} redeemed, ${codesExpired} expired, ${codesActive} active (${redemptionRate}% redemption rate)
- Tracked sales: $${totalTrackedSales.toFixed(2)} across ${uniqueVendorsWithCodes} vendors
- Usage fees generated: $${totalUsageFees.toFixed(2)}
- Average transaction: $${avgTransaction.toFixed(2)}
- Invoice health (30d): ${paidInv} paid, ${overdueInv} overdue, ${disputedInv} disputed
- Enforcement actions (30d): ${(enforcement || []).length} total
${enforcementList || "  None"}

Per vendor breakdown:
${vendorCodeBreakdown || "  No redemptions this week"}
`.trim();
}
