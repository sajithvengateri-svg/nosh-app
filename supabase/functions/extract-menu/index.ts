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

    const { file_base64, file_type } = await req.json();

    if (!file_base64) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert at extracting menu item data from restaurant menus (PDFs, images, scans).

Extract all menu items from this menu. For each item, provide:
- name: The dish/item name
- description: A brief description if visible (optional, null if not present)
- price: The price as a number (optional, null if not visible, without currency symbols)
- category: The menu section/category (e.g., "Starters", "Mains", "Desserts", "Drinks")
- confidence: 0.0 to 1.0 (how confident you are in the extraction)

Be thorough and extract ALL items visible in the menu. Group items by their categories as shown in the menu.

You MUST respond with ONLY a valid JSON object in this exact format, no other text:
{"menu_items": [{"name": "item name", "description": "desc or null", "price": 25.0, "category": "Mains", "confidence": 0.95}]}`;

    // Fix mime type: pass actual type through, handle HEIC
    const mimeType = file_type === "application/pdf" ? "application/pdf"
                   : file_type?.includes("heic") ? "image/jpeg"
                   : file_type || "image/png";
    
    const userContent = [
      {
        type: "text",
        text: "Extract all menu items from this menu image. Respond with only the JSON.",
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${file_base64}`,
        },
      },
    ];

    console.log("Sending request to AI via shared helper");

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent as any },
      ],
    });

    const _aiLatency = Date.now() - _aiStart;
    console.log("AI response received");

    const content = aiResult.content || "";
    
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    let extractedData;
    try {
      extractedData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", jsonStr.substring(0, 500));
      throw new Error("AI returned invalid JSON response");
    }

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "extract-menu", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Menu extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
