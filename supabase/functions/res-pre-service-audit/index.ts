import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a luxury restaurant maître d' AI assistant. Your role is to analyze tonight's reservations and suggest personalized touches that create memorable dining experiences.

For each reservation, suggest 0-3 actions from these types:
- BIRTHDAY_SURPRISE: Guest has a birthday near the reservation date
- VIP_UPGRADE: Guest is VIP/CHAMPION tier, deserves special treatment
- ALLERGEN_ALERT: Guest has dietary requirements that kitchen must know
- REGULAR_WELCOME: Guest is a regular visitor, personalize the greeting
- AMUSE_BOUCHE: Suggest a complimentary bite based on guest preferences
- TABLE_OPTIMIZATION: Suggest a better table based on party size/occasion
- OCCASION_TOUCH: Special occasion noted, suggest appropriate gesture

Return a JSON array with objects matching this structure:
[{
  "reservation_id": "uuid",
  "type": "BIRTHDAY_SURPRISE",
  "title": "Birthday celebration for Sarah",
  "description": "Sarah's birthday is tomorrow. Consider a complimentary dessert with a candle.",
  "action_text": "Prepare birthday dessert plate"
}]

Be specific, actionable, and warm. Focus on touches that feel personal, not generic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { orgId, date, servicePeriod } = await req.json();
    if (!orgId || !date || !servicePeriod) {
      return new Response(
        JSON.stringify({ error: "Missing orgId, date, or servicePeriod" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get service period time range
    const periodRanges: Record<string, [string, string]> = {
      breakfast: ["06:00", "11:00"],
      lunch: ["11:30", "15:00"],
      dinner: ["17:00", "23:00"],
    };
    const [startTime, endTime] = periodRanges[servicePeriod] ?? ["00:00", "23:59"];

    // Fetch reservations with guest data
    const { data: reservations, error: resError } = await supabase
      .from("res_reservations")
      .select("*, res_guests(*), res_tables(name)")
      .eq("org_id", orgId)
      .eq("date", date)
      .gte("time", startTime)
      .lte("time", endTime)
      .in("status", ["CONFIRMED", "SEATED"])
      .order("time");

    if (resError) throw resError;
    if (!reservations || reservations.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "No reservations for this service period" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build structured prompt with reservation data
    const reservationLines = reservations.map((r: any) => {
      const guest = r.res_guests;
      const parts = [
        `${r.time?.slice(0, 5)}`,
        guest ? `${guest.first_name} ${guest.last_name}` : "Walk-in",
        `${r.party_size} pax`,
        r.res_tables?.name ? `Table ${r.res_tables.name}` : "No table",
      ];
      if (guest?.vip_tier && guest.vip_tier !== "NEW") parts.push(`VIP: ${guest.vip_tier}`);
      if (guest?.total_visits > 5) parts.push(`${guest.total_visits} visits`);
      if (guest?.date_of_birth) parts.push(`DOB: ${guest.date_of_birth}`);
      if (guest?.anniversary_date) parts.push(`Anniversary: ${guest.anniversary_date}`);
      if (r.dietary_requirements || guest?.dietary_requirements) {
        parts.push(`Diet: ${r.dietary_requirements || guest.dietary_requirements}`);
      }
      if (r.occasion) parts.push(`Occasion: ${r.occasion}`);
      if (r.special_requests) parts.push(`Requests: ${r.special_requests}`);
      if (guest?.preferences && Object.keys(guest.preferences).length > 0) {
        parts.push(`Prefs: ${JSON.stringify(guest.preferences)}`);
      }
      return `- [${r.id}] ${parts.join(" | ")}`;
    });

    const userPrompt = `Today's date: ${date}
Service: ${servicePeriod}
Total reservations: ${reservations.length}

RESERVATIONS:
${reservationLines.join("\n")}

Analyze each reservation and suggest personalized touches. Return ONLY a valid JSON array.`;

    // Call AI gateway
    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "res-pre-service-audit", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    const rawContent = aiResult.content || "[]";

    // Parse AI response — extract JSON from possible markdown code blocks
    let suggestions: any[] = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.error("Failed to parse AI suggestions:", parseErr, rawContent);
      suggestions = [];
    }

    // Insert suggestions into DB
    if (suggestions.length > 0) {
      const rows = suggestions.map((s: any) => ({
        org_id: orgId,
        reservation_id: s.reservation_id,
        service_date: date,
        service_period: servicePeriod,
        suggestion_type: s.type,
        title: s.title,
        description: s.description,
        action_text: s.action_text || null,
        status: "pending",
      }));

      const { error: insertError } = await supabase
        .from("res_audit_suggestions")
        .insert(rows);

      if (insertError) {
        console.error("Failed to insert suggestions:", insertError);
      }
    }

    return new Response(
      JSON.stringify({ suggestions, count: suggestions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("res-pre-service-audit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
