import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { image_base64, file_type, mode, text } = await req.json();

    const isTextMode = mode === "text" || mode === "dictation";

    if (!isTextMode && !image_base64) {
      return new Response(JSON.stringify({ error: "No image or text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (isTextMode && !text?.trim()) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPhoto = mode === "photo";
    const systemPrompt = isTextMode
      ? `You are a smart kitchen assistant that processes spoken or typed notes from chefs.

Parse the input into actionable prep tasks. The chef may use shorthand, speak casually, or list multiple items in one sentence.
Examples:
- "dice onions 5kg, make stock, prep veg for tonight" → 3 tasks
- "chicken stock urgent, 20 kg potatoes by end of day" → 2 tasks with urgency
- "need flour and sugar for pastry" → 2 tasks

For each task extract:
- task: The task/item name (expand shorthand, e.g. "chx stock" → "Chicken stock")
- quantity: Amount if mentioned (e.g. "5 kg", "2 trays"). Empty string if not specified.
- urgency: Infer from context:
  - "priority" if marked urgent, ASAP, important, or for tonight
  - "end_of_day" if marked EOD or "by end of day"
  - "within_48h" for everything else (default)

You MUST call the extract_prep_tasks tool with the extracted data.`
      : `You are an expert at reading ${isPhoto ? "photographs of handwritten kitchen prep lists" : "handwritten notes drawn on a digital canvas"}.

Extract all prep tasks from the image. For each task extract:
- task: The task/item name (e.g., "Dice onions", "Make stock", "Croissant dough")
- quantity: Amount/quantity if written (e.g., "5 kg", "2 trays", "10L"). If not specified, leave empty string.
- urgency: Infer from visual cues:
  - "priority" if underlined, circled, starred, or marked urgent/ASAP
  - "end_of_day" if marked EOD or similar
  - "within_48h" for everything else (default)

Read carefully. Kitchen shorthand is common (e.g., "prep veg" = "Prep vegetables", "chx stock" = "Chicken stock").
You MUST call the extract_prep_tasks tool with the extracted data.`;

    const userContent = isTextMode
      ? text.trim()
      : [
          { type: "image_url", image_url: { url: `data:${file_type || "image/png"};base64,${image_base64}` } },
          { type: "text", text: "Extract all prep tasks from this image." },
        ];

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
      tools: [
            {
              type: "function",
              function: {
                name: "extract_prep_tasks",
                description: "Return structured prep tasks extracted from a handwritten note or photo.",
                parameters: {
                  type: "object",
                  properties: {
                    tasks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          task: { type: "string", description: "Task/item name" },
                          quantity: { type: "string", description: "Amount if specified, empty string otherwise" },
                          urgency: {
                            type: "string",
                            enum: ["priority", "end_of_day", "within_48h"],
                            description: "Urgency level",
                          },
                        },
                        required: ["task", "quantity", "urgency"],
                      },
                    },
                  },
                  required: ["tasks"],
                },
              },
            },
          ],
      tool_choice: {
            type: "function",
            function: { name: "extract_prep_tasks" },
          },
    });

    const _aiLatency = Date.now() - _aiStart;

        const toolCall = aiResult.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured data returned from AI");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "scan-prep-note", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: !isTextMode });
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-prep-note error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
