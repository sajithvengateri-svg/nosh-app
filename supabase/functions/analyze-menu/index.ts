import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Menu Engineering expert consultant. Analyze the provided menu data and give actionable recommendations to improve profitability and customer satisfaction.

Your analysis should cover:
1. **Quick Wins** - Immediate actions that can boost profit (price adjustments, repositioning)
2. **Item Optimization** - Specific items that need attention (Dogs to remove, Puzzles to promote)
3. **Pricing Strategy** - Where prices are too low/high relative to food costs
4. **Menu Balance** - Category distribution and gaps
5. **Seasonal Suggestions** - Items to add or rotate based on profitability patterns

Use the Menu Engineering Matrix terminology:
- Stars (High Profit, High Popularity) - Protect and feature
- Plow Horses (Low Profit, High Popularity) - Increase prices or reduce costs
- Puzzles (High Profit, Low Popularity) - Promote or reposition
- Dogs (Low Profit, Low Popularity) - Consider removing

Keep recommendations concise, specific, and actionable. Use bullet points.
Format currency in the same format as provided.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { menuItems, menuName } = await req.json();
    // Prepare menu data summary for AI
    const menuSummary = {
      name: menuName,
      totalItems: menuItems.length,
      byCategory: {} as Record<string, number>,
      byProfitability: { star: 0, "plow-horse": 0, puzzle: 0, dog: 0 },
      avgFoodCostPercent: 0,
      items: menuItems.map((item: any) => ({
        name: item.name,
        category: item.category,
        sellPrice: item.sellPrice,
        foodCost: item.foodCost,
        foodCostPercent: item.foodCostPercent,
        contributionMargin: item.contributionMargin,
        popularity: item.popularity,
        profitability: item.profitability,
      })),
    };

    // Calculate aggregates
    menuItems.forEach((item: any) => {
      menuSummary.byCategory[item.category] = (menuSummary.byCategory[item.category] || 0) + 1;
      menuSummary.byProfitability[item.profitability as keyof typeof menuSummary.byProfitability]++;
      menuSummary.avgFoodCostPercent += item.foodCostPercent || 0;
    });
    menuSummary.avgFoodCostPercent = menuSummary.avgFoodCostPercent / menuItems.length || 0;

    const userPrompt = `Analyze this menu and provide specific recommendations:

**Menu: ${menuSummary.name}**
- Total Items: ${menuSummary.totalItems}
- Average Food Cost: ${menuSummary.avgFoodCostPercent.toFixed(1)}%
- Stars: ${menuSummary.byProfitability.star} | Plow Horses: ${menuSummary.byProfitability["plow-horse"]} | Puzzles: ${menuSummary.byProfitability.puzzle} | Dogs: ${menuSummary.byProfitability.dog}

**Items by Category:**
${Object.entries(menuSummary.byCategory).map(([cat, count]) => `- ${cat}: ${count} items`).join("\n")}

**Detailed Item Data:**
${menuSummary.items.map((item: any) => 
  `- ${item.name} (${item.category}): $${item.sellPrice?.toFixed(2) || "N/A"} sell, ${item.foodCostPercent?.toFixed(1) || "N/A"}% food cost, ${item.popularity || 0} sales, Classification: ${item.profitability?.toUpperCase()}`
).join("\n")}

Provide 5-7 specific, actionable recommendations to improve this menu's profitability.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "analyze-menu", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

        const recommendations = aiResult.content || "Unable to generate recommendations.";

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-menu error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
