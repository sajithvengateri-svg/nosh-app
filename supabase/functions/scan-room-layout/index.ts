import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const systemPrompt = `You are an expert restaurant floor plan analyzer. Look at this photo of a restaurant, bar, or venue space and identify all tables, seating areas, bar counters, and key features.

Return a JSON object with this exact structure:
{
  "tables": [
    {
      "suggested_name": "T1",
      "zone": "INDOOR" | "OUTDOOR" | "BAR" | "PRIVATE",
      "min_capacity": 1,
      "max_capacity": 4,
      "x_percent": 0.5,
      "y_percent": 0.5,
      "shape": "ROUND" | "SQUARE" | "RECTANGLE" | "BAR",
      "width_percent": 0.08,
      "height_percent": 0.08
    }
  ],
  "room_dimensions": {
    "aspect_ratio": 1.5,
    "estimated_width_m": 12,
    "estimated_height_m": 8
  },
  "zones": ["INDOOR"],
  "features": ["bar counter", "kitchen pass", "entrance"]
}

Rules:
- x_percent and y_percent are 0-1 fractions representing position relative to image dimensions
- width_percent and height_percent are 0-1 fractions for table size relative to image
- Number tables sequentially: T1, T2, T3...
- Estimate capacity based on visible chairs/seats
- Identify zones based on visible features (outdoor umbrellas, bar stools, etc.)
- Be thorough — find every table and seating area visible`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this restaurant/venue photo and identify all tables and seating areas with their positions." },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      response_format: { type: "json_object" },
    });
    const _aiLatency = Date.now() - _aiStart;
    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "scan-room-layout", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
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

        const content = aiResult.content;

    if (!content) {
      throw new Error("No response content from AI");
    }

    const extractedData = JSON.parse(content);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scan-room-layout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
