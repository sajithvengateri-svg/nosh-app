import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { orgId, weekStart, weekEnd } = await req.json();
    if (!orgId || !weekStart || !weekEnd) {
      return new Response(
        JSON.stringify({ error: "Missing orgId, weekStart, or weekEnd" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all reservations for the week
    const { data: reservations, error: resError } = await supabase
      .from("res_reservations")
      .select("*, res_tables(name)")
      .eq("org_id", orgId)
      .gte("date", weekStart)
      .lte("date", weekEnd);

    if (resError) throw resError;
    const allRes = reservations ?? [];

    // Fetch tables for capacity calculation
    const { data: tables } = await supabase
      .from("res_tables")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true);

    const totalTables = tables?.length ?? 1;

    // Compute metrics
    const totalReservations = allRes.length;
    const totalCovers = allRes.reduce((sum: number, r: any) => sum + (r.party_size || 0), 0);
    const walkIns = allRes.filter((r: any) => r.channel === "WALK_IN").length;
    const noShows = allRes.filter((r: any) => r.status === "NO_SHOW").length;
    const cancellations = allRes.filter((r: any) => r.status === "CANCELLED").length;
    const completed = allRes.filter((r: any) => r.status === "COMPLETED");

    const noShowRate = totalReservations > 0 ? (noShows / totalReservations) * 100 : 0;

    // Turn time
    const turnTimes = completed
      .map((r: any) => r.turn_time_minutes)
      .filter((t: any) => t != null && t > 0);
    const avgTurnTime = turnTimes.length > 0
      ? turnTimes.reduce((s: number, t: number) => s + t, 0) / turnTimes.length
      : null;

    // Channel breakdown
    const channelBreakdown: Record<string, number> = {};
    for (const r of allRes) {
      const ch = r.channel || "UNKNOWN";
      channelBreakdown[ch] = (channelBreakdown[ch] || 0) + 1;
    }

    // Period breakdown
    const periodBreakdown: Record<string, any> = {};
    for (const period of ["breakfast", "lunch", "dinner"]) {
      const ranges: Record<string, [string, string]> = {
        breakfast: ["06:00", "11:00"],
        lunch: ["11:30", "15:00"],
        dinner: ["17:00", "23:00"],
      };
      const [start, end] = ranges[period];
      const periodRes = allRes.filter((r: any) => r.time >= start && r.time <= end);
      const periodCompleted = periodRes.filter((r: any) => r.status === "COMPLETED");
      const periodTurnTimes = periodCompleted
        .map((r: any) => r.turn_time_minutes)
        .filter((t: any) => t != null);
      periodBreakdown[period] = {
        covers: periodRes.reduce((s: number, r: any) => s + (r.party_size || 0), 0),
        reservations: periodRes.length,
        avgTurnTime: periodTurnTimes.length > 0
          ? periodTurnTimes.reduce((s: number, t: number) => s + t, 0) / periodTurnTimes.length
          : null,
      };
    }

    // Occupancy (simplified: unique tables used per day / total tables)
    const dayMap = new Map<string, Set<string>>();
    for (const r of allRes) {
      if (r.table_id && r.status !== "CANCELLED" && r.status !== "NO_SHOW") {
        if (!dayMap.has(r.date)) dayMap.set(r.date, new Set());
        dayMap.get(r.date)!.add(r.table_id);
      }
    }
    const dayOccupancies = [...dayMap.values()].map(s => (s.size / totalTables) * 100);
    const avgOccupancy = dayOccupancies.length > 0
      ? dayOccupancies.reduce((s, v) => s + v, 0) / dayOccupancies.length
      : 0;
    const peakOccupancy = dayOccupancies.length > 0 ? Math.max(...dayOccupancies) : 0;

    // Efficiency score (0-100)
    const occupancyScore = Math.min((avgOccupancy / 75) * 30, 30);
    const turnScore = avgTurnTime ? Math.min(((90 - Math.abs(avgTurnTime - 75)) / 90) * 25, 25) : 12.5;
    const noShowScore = Math.max(20 - (noShowRate * 5), 0);
    const channelDiversity = Object.keys(channelBreakdown).length;
    const diversityScore = Math.min((channelDiversity / 4) * 10, 10);
    const growthScore = 7.5; // Placeholder — needs previous week comparison
    const efficiencyScore = Math.round(occupancyScore + turnScore + noShowScore + diversityScore + growthScore);

    // AI recommendations
    let aiRecommendations: any[] = [];
    try {
      const prompt = `Analyze this restaurant's weekly performance and provide 2-4 actionable recommendations:

Week: ${weekStart} to ${weekEnd}
Reservations: ${totalReservations}
Covers: ${totalCovers}
No-show rate: ${noShowRate.toFixed(1)}%
Avg turn time: ${avgTurnTime ? Math.round(avgTurnTime) + " min" : "N/A"}
Occupancy: ${avgOccupancy.toFixed(0)}%
Channels: ${JSON.stringify(channelBreakdown)}
Periods: ${JSON.stringify(periodBreakdown)}

Return a JSON array: [{ "title": "...", "description": "...", "icon": "lightbulb" | "warning" }]`;

      const _aiStart = Date.now();
      const aiResult = await aiChat({
        messages: [
          { role: "system", content: "You are a restaurant operations analyst. Provide specific, data-driven recommendations. Return ONLY valid JSON." },
          { role: "user", content: prompt },
        ],
      });
      const _aiLatency = Date.now() - _aiStart;

      if (_orgId) {
        logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "res-efficiency-audit", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
      }

      const rawContent = aiResult.content || "[]";
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) aiRecommendations = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      console.error("AI recommendations failed:", aiErr);
    }

    // Upsert snapshot
    const snapshot = {
      org_id: orgId,
      week_start: weekStart,
      week_end: weekEnd,
      total_reservations: totalReservations,
      total_covers: totalCovers,
      total_walk_ins: walkIns,
      avg_turn_time_minutes: avgTurnTime ? Math.round(avgTurnTime) : null,
      no_show_count: noShows,
      no_show_rate: Math.round(noShowRate * 10) / 10,
      cancellation_count: cancellations,
      avg_occupancy_rate: Math.round(avgOccupancy * 10) / 10,
      peak_occupancy_rate: Math.round(peakOccupancy * 10) / 10,
      covers_per_table: totalTables > 0 ? Math.round((totalCovers / totalTables) * 10) / 10 : null,
      channel_breakdown: channelBreakdown,
      period_breakdown: periodBreakdown,
      efficiency_score: efficiencyScore,
      ai_recommendations: aiRecommendations,
    };

    const { error: upsertError } = await supabase
      .from("res_efficiency_snapshots")
      .upsert(snapshot, { onConflict: "org_id,week_start" });

    if (upsertError) {
      console.error("Failed to upsert snapshot:", upsertError);
    }

    return new Response(
      JSON.stringify({ snapshot, recommendations: aiRecommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("res-efficiency-audit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
