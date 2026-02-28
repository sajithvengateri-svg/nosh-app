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

    const { image_base64, file_type } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          {
            role: "system",
            content: `You are an expert at reading temperature displays. You can read digital thermometer screens, probe displays, dial thermometers, and infrared thermometer readouts. Extract the temperature value and unit from the image. If you cannot determine the unit, default to Celsius.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Read the temperature from this thermometer/probe display. Return the numeric value and unit.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file_type || "image/jpeg"};base64,${image_base64}`,
                },
              },
            ],
          },
        ],
      tools: [
          {
            type: "function",
            function: {
              name: "read_temperature",
              description: "Extract temperature reading from a thermometer display image",
              parameters: {
                type: "object",
                properties: {
                  temperature: {
                    type: "number",
                    description: "The temperature value read from the display",
                  },
                  unit: {
                    type: "string",
                    enum: ["C", "F"],
                    description: "The temperature unit (Celsius or Fahrenheit)",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence level from 0.0 to 1.0",
                  },
                },
                required: ["temperature", "unit", "confidence"],
              },
            },
          },
        ],
      tool_choice: { type: "function", function: { name: "read_temperature" } },
    });
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to read temperature display");
    }

    const _aiLatency = Date.now() - _aiStart;

        const toolCall = aiResult.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "read-temp-display", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Temperature reading error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
