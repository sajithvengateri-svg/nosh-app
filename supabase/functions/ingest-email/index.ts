import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { org_id, email_from, email_subject, email_body, attachments } = body;

    if (!org_id || !email_body) {
      return new Response(JSON.stringify({ error: "org_id and email_body required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the email receipt
    const { data: logEntry, error: logError } = await adminClient
      .from("email_ingestion_log")
      .insert({
        org_id,
        email_from: email_from || "unknown",
        email_subject: email_subject || "(no subject)",
        raw_body: email_body,
        attachments: attachments || [],
        status: "received",
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to log email:", logError);
      return new Response(JSON.stringify({ error: "Failed to log email" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract structured financial data
    const systemPrompt = `You are a financial document parser for hospitality businesses. Extract structured financial data from emails containing invoices, bills, payroll summaries, or bank statements.

Return a JSON object with these fields:
- type: "invoice" | "bill" | "payroll" | "statement" | "unknown"
- supplier: supplier/sender name
- amount: total dollar amount (number)
- date: date of the document (YYYY-MM-DD)
- category: "overhead" | "labour" | "food_cost" | "bev_cost" | "revenue" | "other"
- line_items: array of {description, amount, category}
- confidence: your confidence score 0-100

If you cannot parse the content, set type to "unknown" and confidence to 0.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Subject: ${email_subject || "(no subject)"}\nFrom: ${email_from || "unknown"}\n\n${email_body}` },
        ],
      tools: [{
          type: "function",
          function: {
            name: "extract_financial_data",
            description: "Extract structured financial data from an email",
            parameters: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["invoice", "bill", "payroll", "statement", "unknown"] },
                supplier: { type: "string" },
                amount: { type: "number" },
                date: { type: "string" },
                category: { type: "string", enum: ["overhead", "labour", "food_cost", "bev_cost", "revenue", "other"] },
                line_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      amount: { type: "number" },
                      category: { type: "string" },
                    },
                    required: ["description", "amount"],
                  },
                },
                confidence: { type: "number" },
              },
              required: ["type", "amount", "confidence"],
            },
          },
        }],
      tool_choice: { type: "function", function: { name: "extract_financial_data" } },
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "ingest-email", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

        let extracted: any = {};
    try {
      const toolCall = aiResult.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        extracted = JSON.parse(toolCall.function.arguments);
      }
    } catch {
      extracted = { type: "unknown", confidence: 0 };
    }

    const confidence = extracted.confidence ?? 0;
    const needsReview = confidence < 70;

    // Update email log with extracted data
    await adminClient.from("email_ingestion_log").update({
      extracted_data: extracted,
      confidence,
      status: needsReview ? "needs_review" : "parsed",
      routed_to: needsReview ? "manual_review" : "data_imports",
    }).eq("id", logEntry.id);

    // If confidence is high enough, create data_import records
    if (!needsReview && extracted.type !== "unknown" && extracted.amount > 0) {
      const today = new Date().toISOString().split("T")[0];
      const dataType = extracted.category || (extracted.type === "payroll" ? "labour" : "overhead");

      await adminClient.from("data_imports").insert({
        org_id,
        source_type: "email",
        data_type: dataType,
        period_start: extracted.date || today,
        period_end: extracted.date || today,
        amount: extracted.amount,
        metadata: {
          email_log_id: logEntry.id,
          supplier: extracted.supplier,
          type: extracted.type,
          line_items: extracted.line_items,
        },
        status: "received",
      });

      // If it's an overhead invoice, also create an overhead_entry
      if (dataType === "overhead" && extracted.amount > 0) {
        await adminClient.from("overhead_entries").insert({
          org_id,
          date: extracted.date || today,
          amount: extracted.amount,
          description: `[Email] ${extracted.supplier || email_from || "Unknown"} - ${email_subject || "Invoice"}`,
          is_recurring: false,
        }).then(() => {}).catch(e => console.error("Overhead insert failed:", e));
      }

      // Update email log as routed
      await adminClient.from("email_ingestion_log").update({
        status: "routed",
      }).eq("id", logEntry.id);
    }

    return new Response(JSON.stringify({
      success: true,
      log_id: logEntry.id,
      extracted,
      needs_review: needsReview,
      confidence,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ingest-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
