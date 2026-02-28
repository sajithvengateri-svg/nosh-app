import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;


  try {
    const _orgId = await getUserOrgId(authResult.user.id);
    if (_orgId) {
      const _quota = await checkAiQuota(_orgId);
      if (!_quota.allowed) {
        return new Response(JSON.stringify({ error: "ai_quota_exceeded", message: "Monthly AI limit reached. Resets on the 1st.", pct_used: _quota.pct_used }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { document_text, document_type, file_name } = await req.json();

    const systemPrompt = `You are a hospitality financial data extractor. Extract structured data from the provided document.
Document type: ${document_type || "AUTO_DETECT"}
File name: ${file_name || "unknown"}

Return ONLY valid JSON with the extracted fields. Include a "confidence" field (0-1) for each extracted value.
Include a "document_type" field with your detected type: XERO_PL, PAYSLIP, ROSTER, BANK_STATEMENT, SUPPLIER_INVOICE, BAS, LEASE, or OTHER.

For XERO_PL: extract revenue_total, revenue_food, revenue_beverage, cogs_food, cogs_beverage, wages_gross, wages_super, rent, utilities, insurance, net_profit, period_start, period_end.
For PAYSLIP: extract employee_name, base_hourly_rate, ordinary_hours, overtime_hours, casual_loading_applied, super_pct, gross_pay, classification, employment_type.
For ROSTER: extract total_hours, staff_count, shifts (array with employee, day, start, end, role).
For BANK_STATEMENT: extract total_deposits, total_payments, categorised transactions.
For SUPPLIER_INVOICE: extract supplier_name, total, category, line_items.
For BAS: extract total_sales, gst_on_sales, net_gst_payable.
For LEASE: extract base_rent_annual, escalation_type, lease_expiry.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract structured data from this document:\n\n${document_text?.substring(0, 15000) || "No text provided"}` },
        ],
    });

    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "parse-audit-document", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    const content = aiResult.content || "{}";

    // Try to parse JSON from the response
    let extracted;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      extracted = { raw: content, parse_error: true };
    }

    return new Response(JSON.stringify({ success: true, extracted, document_type: extracted.document_type || document_type || "OTHER" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-audit-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
