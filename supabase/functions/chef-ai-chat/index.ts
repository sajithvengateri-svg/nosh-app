 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const SYSTEM_PROMPT = `You are Chef AI, an expert kitchen assistant for ChefOS - a professional kitchen management app.
 
 Your expertise covers:
 1. **Recipes & Techniques**: Substitutions, scaling, cooking methods, troubleshooting dishes
 2. **Food Safety**: HACCP, safe temps, storage times, cross-contamination, allergens
 3. **Inventory & Costing**: Ordering, waste reduction, food cost optimization, par levels
 4. **App Help**: How to use ChefOS features (recipes, prep lists, inventory, food safety logs, roster)
 
 Guidelines:
 - Be concise and practical - chefs are busy
 - Use metric measurements primarily (with imperial in parentheses when helpful)
 - For food safety, always err on the side of caution
 - When discussing temperatures, clarify if internal vs cooking temp
 - For app questions, give step-by-step instructions
 - Use professional kitchen terminology
 - If unsure, say so rather than guessing on food safety matters
 
 Keep responses under 200 words unless more detail is specifically requested.`;
 
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

     const { messages } = await req.json();

     const _aiStart = Date.now();
     const result = await aiChat({
       messages: [
         { role: "system", content: SYSTEM_PROMPT },
         ...messages,
       ],
       model: "google/gemini-3-flash-preview",
     });
     const _aiLatency = Date.now() - _aiStart;

     if (_orgId) {
       logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "chef-ai-chat", provider: "gemini", model: "google/gemini-3-flash-preview", usage: result.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
     }

     const content = result.content || "I couldn't generate a response.";

     return new Response(
       JSON.stringify({ content }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("chef-ai-chat error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });