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

// ── Personality traits ────────────────────────────────────────────

const PERSONALITY_TRAITS: Record<string, string> = {
  friendly:
    "You are warm, encouraging, and supportive. Use casual language and the occasional emoji.",
  witty:
    "You are clever with a dry sense of humour. Add playful cooking puns when appropriate.",
  calm:
    "You are patient, methodical, and reassuring. Perfect for nervous cooks trying something new.",
  energetic:
    "You are enthusiastic and excited about cooking! Use positive energy and encouragement.",
};

// ── Persona specialisations ───────────────────────────────────────

const PERSONA_CONTEXT: Record<string, string> = {
  normal:
    "You are a well-rounded home cooking companion. You cover everyday recipes, meal prep, and general kitchen advice.",
  sommelier:
    "You have deep wine expertise. Recommend wine pairings for dishes, explain tasting notes, suggest cellar organisation tips, and help with wine-focused entertaining.",
  mixologist:
    "You are a cocktail and bar expert. Recommend drink pairings, create cocktail recipes, suggest bar snack pairings, and help with home bar setup and techniques.",
  kick_back:
    "You specialise in easy, low-effort comfort food. Suggest quick meals, one-pot dishes, snack platters, and stress-free cooking. Keep it casual and relaxed.",
};

// ── Region knowledge ──────────────────────────────────────────────

const REGION_KNOWLEDGE: Record<string, string> = {
  au: "Australian cuisine, bush tucker ingredients, Aussie BBQ culture, and local supermarket brands (Woolworths, Coles, Aldi).",
  in: "Indian cuisine across all regions (North, South, East, West), spice blending, festival cooking, and local ingredients.",
  uae: "Middle Eastern and South Asian cuisine popular in the UAE, halal cooking, Ramadan recipes, and local markets.",
  uk: "British home cooking, Sunday roasts, baking culture, and local supermarket brands (Tesco, Sainsbury's, Waitrose).",
  sg: "Singaporean hawker-inspired home cooking, Chinese/Malay/Indian fusion, and local ingredients from wet markets.",
  us: "American home cooking, regional BBQ styles, comfort food, Thanksgiving classics, and local grocery chains.",
};

// ── System prompt builder ─────────────────────────────────────────

function buildSystemPrompt(profile: any): string {
  const {
    companion_name,
    personality,
    persona,
    preferences,
    memory,
    region,
    units,
    currency,
  } = profile;

  const unitLine =
    units === "imperial"
      ? "Use imperial measurements (cups, tablespoons, Fahrenheit) primarily."
      : "Use metric measurements (grams, ml, Celsius) primarily.";

  const personaLine = PERSONA_CONTEXT[persona] || PERSONA_CONTEXT.normal;

  let prompt = `You are ${companion_name}, a personal AI cooking companion for a home cook.

${PERSONALITY_TRAITS[personality] || PERSONALITY_TRAITS.friendly}

${personaLine}

${unitLine}
Display prices in ${currency} when discussing costs.
You have deep knowledge of ${REGION_KNOWLEDGE[region] || "global cuisine"}.

Your focus areas:
1. Cooking help — recipes, techniques, substitutions, meal planning, ingredient questions
2. Kitchen organisation — pantry management, meal prep tips, shopping lists
3. Light productivity — kitchen-related to-do help, scheduling cooking sessions
4. De-stressing — comfort food suggestions, relaxing cooking activities

You must NEVER:
- Provide medical, psychological, or counselling advice
- Discuss topics outside cooking, kitchen, food, and light household productivity
- Generate harmful or inappropriate content
- Pretend to be human — you are a friendly AI robot companion

Keep responses concise (under 150 words) unless the user asks for detail.`;

  // Inject learned preferences
  if (preferences) {
    const lines: string[] = [];
    if (preferences.skill_level) lines.push(`Skill level: ${preferences.skill_level}`);
    if (preferences.cuisine_interests?.length)
      lines.push(`Favourite cuisines: ${preferences.cuisine_interests.join(", ")}`);
    if (preferences.dietary_restrictions?.length)
      lines.push(`Dietary restrictions: ${preferences.dietary_restrictions.join(", ")}`);
    if (preferences.household_size)
      lines.push(`Cooks for: ${preferences.household_size} people`);
    if (preferences.household_allergies?.length)
      lines.push(
        `IMPORTANT — Allergies in household: ${preferences.household_allergies.join(", ")}`
      );
    if (preferences.spice_tolerance)
      lines.push(`Spice tolerance: ${preferences.spice_tolerance}`);
    if (preferences.time_preference)
      lines.push(`Cooking time preference: ${preferences.time_preference}`);
    if (preferences.budget_preference)
      lines.push(`Budget preference: ${preferences.budget_preference}`);
    if (preferences.favorite_ingredients?.length)
      lines.push(`Favourite ingredients: ${preferences.favorite_ingredients.join(", ")}`);
    if (preferences.disliked_ingredients?.length)
      lines.push(`Dislikes: ${preferences.disliked_ingredients.join(", ")}`);
    if (preferences.kitchen_equipment?.length)
      lines.push(`Kitchen equipment: ${preferences.kitchen_equipment.join(", ")}`);

    if (lines.length > 0) {
      prompt += `\n\n## What you know about this cook:\n${lines.join("\n")}`;
    }
  }

  // Inject conversation memory
  if (memory) {
    const lines: string[] = [];
    if (memory.last_interaction_summary)
      lines.push(`Last conversation: ${memory.last_interaction_summary}`);
    if (memory.successful_recipes?.length)
      lines.push(
        `Recipes they liked: ${memory.successful_recipes.slice(-5).join(", ")}`
      );
    if (memory.failed_attempts?.length)
      lines.push(
        `Things that didn't work: ${memory.failed_attempts.slice(-3).join(", ")}`
      );
    if (memory.learned_techniques?.length)
      lines.push(
        `Techniques they've learned: ${memory.learned_techniques.slice(-5).join(", ")}`
      );

    if (lines.length > 0) {
      prompt += `\n\n## Memory from past interactions:\n${lines.join("\n")}`;
    }
  }

  return prompt;
}

// ── Handler ───────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  try {
    const _orgId = await getUserOrgId(user.id);
    if (_orgId) {
      const _quota = await checkAiQuota(_orgId);
      if (!_quota.allowed) {
        return new Response(JSON.stringify({ error: "ai_quota_exceeded", message: "Monthly AI limit reached. Resets on the 1st.", pct_used: _quota.pct_used }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { messages, summarize } = await req.json();

    // Fetch companion profile with service role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile, error: profileErr } = await adminClient
      .from("companion_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(
        JSON.stringify({ error: "Companion not set up" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Summarize mode: end-of-session memory extraction ──────────
    if (summarize && messages?.length > 2) {
      const _aiStartSummarize = Date.now();
      const summaryResult = await aiChat({
        messages: [
          {
            role: "system",
            content: `You are a memory extraction assistant. Given a conversation between a user and their cooking companion "${profile.companion_name}", extract:
1. "topic": a short topic label (max 6 words)
2. "summary": a 1-2 sentence summary of the conversation
3. "preferences_extracted": any new user preferences learned (as a JSON object with keys matching: skill_level, cuisine_interests, dietary_restrictions, favorite_ingredients, disliked_ingredients, cooking_goals, household_size, household_allergies, kitchen_equipment, time_preference, budget_preference, spice_tolerance). Only include fields where you learned something new. Use arrays for list fields.
4. "successful_recipes": any recipe names the user said they liked or that went well
5. "learned_techniques": any cooking techniques discussed

Respond ONLY with valid JSON.`,
          },
          ...messages,
        ],
        model: "google/gemini-2.0-flash",
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const _aiLatencySummarize = Date.now() - _aiStartSummarize;
      if (_orgId) {
        logAiUsage({ org_id: _orgId, user_id: user.id, function_name: "companion-chat", provider: "gemini", model: "google/gemini-2.0-flash", usage: summaryResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatencySummarize, has_image: false });
      }

      let extracted: any = {};
      try {
        extracted = JSON.parse(summaryResult.content || "{}");
      } catch {
        extracted = { topic: "Cooking chat", summary: "General cooking conversation" };
      }

      // Save conversation summary
      await adminClient.from("companion_conversations").insert({
        user_id: user.id,
        companion_profile_id: profile.id,
        topic: extracted.topic || null,
        summary: extracted.summary || null,
        message_count: messages.length,
        preferences_extracted: extracted.preferences_extracted || {},
        ended_at: new Date().toISOString(),
      });

      // Merge extracted preferences into profile
      if (extracted.preferences_extracted && Object.keys(extracted.preferences_extracted).length > 0) {
        const currentPrefs = profile.preferences || {};
        const newPrefs = extracted.preferences_extracted;
        const merged: any = { ...currentPrefs };

        for (const [key, value] of Object.entries(newPrefs)) {
          if (Array.isArray(value) && Array.isArray(currentPrefs[key])) {
            merged[key] = [...new Set([...currentPrefs[key], ...value])];
          } else if (value !== null && value !== undefined) {
            merged[key] = value;
          }
        }

        await adminClient
          .from("companion_profiles")
          .update({ preferences: merged })
          .eq("id", profile.id);
      }

      // Update memory
      const currentMemory = profile.memory || {};
      const updatedMemory: any = { ...currentMemory };
      updatedMemory.last_interaction_summary = extracted.summary || null;
      updatedMemory.interaction_count = (currentMemory.interaction_count || 0) + 1;

      if (extracted.successful_recipes?.length) {
        updatedMemory.successful_recipes = [
          ...new Set([
            ...(currentMemory.successful_recipes || []),
            ...extracted.successful_recipes,
          ]),
        ].slice(-20);
      }
      if (extracted.learned_techniques?.length) {
        updatedMemory.learned_techniques = [
          ...new Set([
            ...(currentMemory.learned_techniques || []),
            ...extracted.learned_techniques,
          ]),
        ].slice(-20);
      }

      await adminClient
        .from("companion_profiles")
        .update({ memory: updatedMemory })
        .eq("id", profile.id);

      return new Response(
        JSON.stringify({ summarized: true, topic: extracted.topic }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Normal chat mode ──────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(profile);

    const _aiStart = Date.now();
    const result = await aiChat({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      model: "google/gemini-3-flash-preview",
      temperature: 0.7,
    });
    const _aiLatency = Date.now() - _aiStart;

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: user.id, function_name: "companion-chat", provider: "gemini", model: "google/gemini-3-flash-preview", usage: result.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    const content =
      result.content || "Hmm, I'm not sure what to say. Could you try asking again?";

    return new Response(
      JSON.stringify({ content, companion_name: profile.companion_name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("companion-chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
