import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert at reading business cards and extracting structured contact information.

Analyze the provided image of a business card and extract as much information as possible.

Return a JSON object with these fields (use null for any field you cannot determine):
{
  "name": "Person's full name",
  "company": "Company or business name",
  "phone": "Phone number (include country code if shown)",
  "email": "Email address",
  "website": "Website URL",
  "abn": "ABN or business registration number if shown",
  "address": "Full address if shown",
  "category": "Best guess at trade category: Plumber, Electrician, Gas Fitter, Refrigeration, Pest Control, Hood Cleaner, Fire Safety, Locksmith, Equipment Repair, Equipment Supplier, Cleaning Supplier, or Other",
  "notes": "Any other relevant info (job title, licence numbers, specialties)"
}

Focus on accuracy. Only extract information you can clearly read from the card.`;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this business card and extract all contact information.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_contact_data",
            description: "Extract structured contact data from a business card image",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Person's full name" },
                company: { type: "string", description: "Company or business name" },
                phone: { type: "string", description: "Phone number" },
                email: { type: "string", description: "Email address" },
                website: { type: "string", description: "Website URL" },
                abn: { type: "string", description: "ABN or business registration number" },
                address: { type: "string", description: "Full address" },
                category: { type: "string", description: "Trade category" },
                notes: { type: "string", description: "Other relevant info" },
              },
              required: ["name"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_contact_data" } },
    });

    const _aiLatency = Date.now() - _aiStart;
    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "scan-business-card", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }

    const toolCall = aiResult.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call result from AI");
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scan-business-card error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
