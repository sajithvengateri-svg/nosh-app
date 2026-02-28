import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── The NOSH Intelligence Prompt ────────────────────────────────────────────

function buildExtractionPrompt(knowledgeContext: string): string {
  return `You are the NOSH Recipe Intelligence Engine. You extract recipes from any source and adapt them into NOSH format — a compressed, one-pot, weeknight-friendly format that preserves the soul of the dish.

PRIOR KNOWLEDGE (learned from previous extractions):
${knowledgeContext}

═══ NOSH FORMAT — HARD CONSTRAINTS ═══

MAX 12 INGREDIENTS     — if the original has more, simplify or combine. Exclude pantry staples from count.
30-40 MINUTES          — total cook time. Prep (chopping, measuring) is separate.
ONE VESSEL             — one main cooking vessel (pot, pan, wok, tray, slow_cooker, appliance).

PANTRY STAPLES (do NOT count toward 12):
  Salt, black pepper, olive oil or vegetable oil, water.
  Plain flour if under 2 tbsp (dusting/thickening only).

ALLOWED SIDE TASKS (optional second vessel):
  Boiling noodles/pasta, making rice, toasting bread, boiling eggs, quick blanch (60 sec).
  These are SIDE tasks — label clearly. The main dish happens in one vessel.

═══ SACRED vs FLEXIBLE ANALYSIS ═══

For EVERY recipe, identify what is sacred (what makes it THAT dish) vs flexible (can change).

SACRED (never remove, never substitute except for dietary needs):
  HERO INGREDIENT — the thing the dish is named after or built around
  SIGNATURE FLAVOUR — the spice/sauce/paste that defines the cuisine
  COOKING METHOD — if it's a braise, it stays a braise

FLEXIBLE (can simplify, combine, or remove):
  AROMATICS — can reduce from 5 to 3 core ones
  GARNISH — can simplify or remove entirely
  THICKENERS — can swap cornflour for reduction
  SECONDARY VEG — can swap or reduce variety
  OPTIONAL EXTRAS — anything the dish works without

═══ INGREDIENT COMPRESSION RULES ═══

1. COMBINE SPICES INTO BLENDS: cumin + coriander + turmeric + chilli + garam masala → garam masala + turmeric + chilli
2. ELIMINATE GARNISH at 12 limit (unless garnish IS the dish, e.g. pho herbs)
3. MERGE SIMILAR: "2 tbsp soy + 1 tbsp dark soy" → "3 tbsp soy sauce"
4. PANTRY STAPLES ARE FREE: salt, pepper, oil, water don't count
5. SUBSTITUTE HARD-TO-FIND: shaoxing wine → dry sherry, palm sugar → brown sugar, galangal → ginger. BUT: fish sauce stays fish sauce, gochujang stays gochujang.
6. COMBINE ON SHOPPING: "ginger-garlic paste" = 1 ingredient, "tin of tomatoes" = 1 ingredient

═══ STEP COMPRESSION GUIDANCE ═══

The recipe will later be broken into 4-6 workflow cards. Structure your output to support:
  Step 1: Sear / Brown / Heat (protein or base)
  Step 2: Build flavour (aromatics, spices, deglaze)
  Step 3: Add liquid / main ingredients
  Step 4: Simmer / Cook (timer step)
  Step 5: Finish (fresh herbs, cream, lime, seasoning)
  Step 6: Serve (plate, garnish, eat)

Prep actions (dice, mince, slice) go in a prep checklist, NOT cooking steps.

═══ ONE-POT ADAPTATION ═══

Strategy 1: Sear and simmer in same vessel
Strategy 2: Build layers in one pan (cook protein, push to side, add veg, add sauce)
Strategy 3: One pot + side task (curry in pot, rice in rice cooker)
Strategy 4: Pasta cooked in the sauce (add dry pasta + water — works for penne, rigatoni, NOT spaghetti)
Strategy 5: Sheet pan if genuinely easier

If a dish truly cannot work as one-pot, set one_pot_feasible to false.

═══ OUTPUT SCHEMA ═══

Return a single JSON object with this exact structure:

{
  "title": "string",
  "nosh_hook": "one compelling line that makes you want to cook this tonight",
  "description": "1-2 sentences describing the dish",
  "vessel": "pot | pan | tray | bowl | slow_cooker | appliance",
  "cuisine": "string (Indian, Thai, Italian, etc.)",
  "total_time_minutes": "integer (30-40 target, max 60)",
  "prep_time_minutes": "integer",
  "cook_time_minutes": "integer",
  "serves": "integer",
  "cost_per_serve": "decimal AUD estimate",
  "difficulty": "1-5",
  "spice_level": "0-4",
  "adventure_level": "1-4",
  "dietary_tags": ["vegetarian", "gluten-free", etc.],
  "season_tags": ["winter", "summer", "all-year"],
  "tips": ["2-3 genuinely useful cooking tips"],
  "storage_notes": "fridge X days, freezer X months, reheat method",
  "leftover_ideas": ["creative leftover suggestions"],
  "ingredients": [
    {
      "name": "string",
      "quantity": "number or null",
      "unit": "string or null",
      "is_pantry_staple": "boolean",
      "is_sacred": "boolean — true if this ingredient is sacred to the dish",
      "supermarket_section": "produce | meat | dairy | pantry | frozen | bakery | deli | drinks",
      "estimated_cost": "decimal AUD or null",
      "sort_order": "integer from 0"
    }
  ],
  "sacred_analysis": {
    "hero_ingredient": "the thing this dish is built around",
    "sacred_ingredients": [
      { "ingredient": "name", "reason": "why it cannot be removed" }
    ],
    "sacred_technique": "the cooking method that defines this dish",
    "sacred_flavour_profile": "the taste signature (e.g. sour-sweet-salty umami)",
    "flexible_ingredients": [
      { "ingredient": "name", "can_remove": true, "substitute": "alternative or null" }
    ],
    "simplification_opportunities": ["what was simplified and why"],
    "one_pot_feasible": true,
    "side_tasks_needed": ["rice", "noodles"] or [],
    "original_ingredient_count": "how many the source recipe had",
    "original_step_count": "how many steps the source had",
    "adaptations_made": [
      { "change": "what changed", "reason": "why", "impact": "none | minor | moderate" }
    ],
    "quality_score": "0-100 flavour integrity after adaptation",
    "confidence": "0-100 how confident you are this will taste great",
    "risk_level": "low | medium | high",
    "risks": ["any concerns about the adaptation"]
  }
}

Rules:
- Respond with ONLY the JSON object, no markdown, no explanation
- The adapted recipe must taste GOOD. Do not produce a sad, hollow version.
- If a dish cannot fit NOSH format without ruining it, set quality_score < 50 and explain in risks.`;
}

// ─── Inline knowledge aggregation for a cuisine ──────────────────────────────

async function learnFromExtraction(
  db: any,
  cuisine: string
): Promise<void> {
  try {
    // Fetch all sacred analyses for this cuisine
    const { data: analyses } = await db
      .from("ds_recipe_sacred_analysis")
      .select("sacred_ingredients, sacred_technique, sacred_flavour_profile, hero_ingredient, flexible_ingredients, side_tasks_needed, quality_score")
      .eq("cuisine", cuisine);

    if (!analyses || analyses.length < 2) return; // Need critical mass

    // Aggregate sacred ingredients by frequency
    const sacredCounts = new Map<string, { count: number; reasons: string[] }>();
    const techniques: string[] = [];
    const flavourProfiles: string[] = [];
    const heroIngredients: string[] = [];
    const removedItems = new Map<string, number>();
    const substitutions: { original: string; substitute: string }[] = [];
    const sideTasks = new Map<string, number>();
    let totalQuality = 0;

    for (const a of analyses) {
      totalQuality += a.quality_score ?? 0;

      if (a.sacred_technique) techniques.push(a.sacred_technique);
      if (a.sacred_flavour_profile) flavourProfiles.push(a.sacred_flavour_profile);
      if (a.hero_ingredient) heroIngredients.push(a.hero_ingredient);

      for (const si of a.sacred_ingredients ?? []) {
        const key = si.ingredient?.toLowerCase();
        if (!key) continue;
        const existing = sacredCounts.get(key) ?? { count: 0, reasons: [] };
        existing.count++;
        if (si.reason) existing.reasons.push(si.reason);
        sacredCounts.set(key, existing);
      }

      for (const fi of a.flexible_ingredients ?? []) {
        if (fi.can_remove) {
          const key = fi.ingredient?.toLowerCase();
          if (key) removedItems.set(key, (removedItems.get(key) ?? 0) + 1);
        }
        if (fi.substitute && fi.ingredient) {
          substitutions.push({ original: fi.ingredient, substitute: fi.substitute });
        }
      }

      for (const st of a.side_tasks_needed ?? []) {
        sideTasks.set(st, (sideTasks.get(st) ?? 0) + 1);
      }
    }

    const total = analyses.length;

    // Build aggregate sacred ingredients (>30% frequency)
    const commonSacred = [...sacredCounts.entries()]
      .filter(([_, v]) => v.count / total >= 0.3)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([ingredient, v]) => ({
        ingredient,
        frequency: Math.round((v.count / total) * 100),
        reason: v.reasons[0] ?? "",
      }));

    // Commonly removed (>40% frequency)
    const commonRemoved = [...removedItems.entries()]
      .filter(([_, count]) => count / total >= 0.4)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    // Common side tasks (>30%)
    const commonSides = [...sideTasks.entries()]
      .filter(([_, count]) => count / total >= 0.3)
      .map(([name]) => name);

    // Unique values
    const uniqueTechniques = [...new Set(techniques)];
    const uniqueProfiles = [...new Set(flavourProfiles)];
    const uniqueHeroes = [...new Set(heroIngredients)];

    // Deduplicate substitutions
    const seenSubs = new Set<string>();
    const uniqueSubs = substitutions.filter(s => {
      const key = `${s.original}→${s.substitute}`;
      if (seenSubs.has(key)) return false;
      seenSubs.add(key);
      return true;
    });

    await db
      .from("ds_recipe_knowledge_base")
      .upsert(
        {
          cuisine,
          common_sacred_ingredients: commonSacred,
          common_sacred_techniques: uniqueTechniques.slice(0, 5),
          common_flavour_profiles: uniqueProfiles.slice(0, 5),
          typical_hero_ingredients: uniqueHeroes.slice(0, 5),
          commonly_removed: commonRemoved.slice(0, 10),
          common_substitutions: uniqueSubs.slice(0, 10),
          common_side_tasks: commonSides,
          recipe_count: total,
          avg_quality_score: Math.round(totalQuality / total),
          last_learned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "cuisine" }
      );
  } catch (err) {
    console.error(`recipe-learn error for ${cuisine}:`, err);
    // Non-fatal — extraction still succeeds
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    // Admin check
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await serviceClient
      .from("ds_user_profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { upload_type, raw_text, file_url, source_url } = await req.json();

    // Create upload record
    const { data: upload, error: uploadErr } = await serviceClient
      .from("ds_recipe_uploads")
      .insert({
        uploaded_by: user.id,
        upload_type,
        raw_text,
        file_url,
        source_url,
        status: "processing",
      })
      .select("id")
      .single();

    if (uploadErr) throw uploadErr;

    // Build content for AI
    let content = "";
    if (upload_type === "text" && raw_text) {
      content = raw_text;
    } else if (upload_type === "url" && source_url) {
      const res = await fetch(source_url);
      content = await res.text();
      content = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      if (content.length > 10000) content = content.slice(0, 10000);
    } else if ((upload_type === "pdf" || upload_type === "image") && file_url) {
      content = `[File uploaded at: ${file_url}] Please extract the recipe from this content.`;
    } else {
      throw new Error("No content provided");
    }

    // ─── Query knowledge base for prior learnings ───────────────────────
    const { data: knowledge } = await serviceClient
      .from("ds_recipe_knowledge_base")
      .select("*")
      .order("recipe_count", { ascending: false })
      .limit(5);

    const knowledgeContext = knowledge?.length
      ? knowledge.map((k: any) => {
          const sacred = (k.common_sacred_ingredients ?? [])
            .slice(0, 6)
            .map((i: any) => `${i.ingredient} (${i.frequency}%)`)
            .join(", ");
          return `${k.cuisine} (${k.recipe_count} recipes learned):
  Sacred ingredients: ${sacred || "none yet"}
  Techniques: ${(k.common_sacred_techniques ?? []).join(", ") || "none yet"}
  Usually flexible/removable: ${(k.commonly_removed ?? []).join(", ") || "none yet"}
  Common sides: ${(k.common_side_tasks ?? []).join(", ") || "none"}`;
        }).join("\n\n")
      : "No prior knowledge yet — this is an early extraction. Use your culinary expertise.";

    // ─── Call AI with intelligence prompt ────────────────────────────────
    const systemPrompt = buildExtractionPrompt(knowledgeContext);

    let aiResult;
    try {
      aiResult = await aiChat(
        {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        },
        "gemini"
      );
    } catch (aiErr) {
      await serviceClient.from("ds_recipe_uploads")
        .update({ status: "failed", error_message: (aiErr as Error).message })
        .eq("id", upload.id);
      throw aiErr;
    }

    if (!aiResult.content) {
      await serviceClient.from("ds_recipe_uploads")
        .update({ status: "failed", error_message: "AI returned no content" })
        .eq("id", upload.id);
      throw new Error("AI returned no content");
    }

    // Parse extracted recipe
    let jsonStr = aiResult.content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonStr);
    } catch (parseErr) {
      await serviceClient.from("ds_recipe_uploads")
        .update({ status: "failed", error_message: `JSON parse error: ${(parseErr as Error).message}` })
        .eq("id", upload.id);
      throw new Error(`Failed to parse AI response as JSON: ${jsonStr.slice(0, 200)}`);
    }

    // Fallback title
    if (!extracted.title) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      extracted.title = `Unnamed ${dd}/${mm}/${yy}`;
    }

    // Generate slug
    const slug =
      extracted.title
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 80) + `-${Date.now().toString(36)}`;

    // ─── Insert recipe ──────────────────────────────────────────────────
    const { data: recipe, error: recipeErr } = await serviceClient
      .from("ds_recipes")
      .insert({
        title: extracted.title,
        slug,
        description: extracted.description,
        nosh_hook: extracted.nosh_hook ?? null,
        vessel: extracted.vessel || "pot",
        cuisine: extracted.cuisine || "Other",
        total_time_minutes: Math.min(extracted.total_time_minutes || 30, 60),
        prep_time_minutes: extracted.prep_time_minutes,
        cook_time_minutes: extracted.cook_time_minutes,
        serves: extracted.serves || 4,
        cost_per_serve: extracted.cost_per_serve,
        difficulty: extracted.difficulty || 2,
        spice_level: extracted.spice_level || 1,
        adventure_level: extracted.adventure_level || 1,
        dietary_tags: extracted.dietary_tags || [],
        season_tags: extracted.season_tags || [],
        source_type: "converted",
        tips: extracted.tips || [],
        storage_notes: extracted.storage_notes,
        leftover_ideas: extracted.leftover_ideas || [],
        pipeline_status: "extracted",
        is_published: false,
        likes_count: 0,
        cooked_count: 0,
        avg_rating: 0,
      })
      .select("id")
      .single();

    if (recipeErr) throw recipeErr;

    // ─── Insert ingredients (with is_sacred) ────────────────────────────
    if (extracted.ingredients?.length > 0) {
      const ingredients = extracted.ingredients.map(
        (ing: Record<string, unknown>, i: number) => ({
          recipe_id: recipe.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          is_pantry_staple: ing.is_pantry_staple ?? false,
          is_sacred: ing.is_sacred ?? false,
          supermarket_section: ing.supermarket_section ?? "pantry",
          estimated_cost: ing.estimated_cost,
          sort_order: ing.sort_order ?? i,
        })
      );

      const { error: ingErr } = await serviceClient
        .from("ds_recipe_ingredients")
        .insert(ingredients);

      if (ingErr) console.error("Ingredient insert error:", ingErr);
    }

    // ─── Insert sacred analysis ─────────────────────────────────────────
    const sa = extracted.sacred_analysis;
    if (sa) {
      const { error: saErr } = await serviceClient
        .from("ds_recipe_sacred_analysis")
        .insert({
          recipe_id: recipe.id,
          cuisine: extracted.cuisine || "Other",
          hero_ingredient: sa.hero_ingredient,
          sacred_ingredients: sa.sacred_ingredients ?? [],
          sacred_technique: sa.sacred_technique,
          sacred_flavour_profile: sa.sacred_flavour_profile,
          flexible_ingredients: sa.flexible_ingredients ?? [],
          simplification_opportunities: sa.simplification_opportunities ?? [],
          one_pot_feasible: sa.one_pot_feasible ?? true,
          side_tasks_needed: sa.side_tasks_needed ?? [],
          original_ingredient_count: sa.original_ingredient_count,
          compressed_ingredient_count: extracted.ingredients?.length ?? 0,
          original_step_count: sa.original_step_count,
          compressed_step_count: 6,
          quality_score: sa.quality_score,
          confidence: sa.confidence,
          risk_level: sa.risk_level ?? "low",
          risks: sa.risks ?? [],
          adaptations_made: sa.adaptations_made ?? [],
        });

      if (saErr) console.error("Sacred analysis insert error:", saErr);

      // ─── Feed the brain: learn from this extraction ─────────────────
      await learnFromExtraction(serviceClient, extracted.cuisine || "Other");
    }

    // ─── Update upload record ───────────────────────────────────────────
    await serviceClient
      .from("ds_recipe_uploads")
      .update({
        recipe_id: recipe.id,
        extracted_json: extracted,
        ai_model_used: "gemini-2.5-flash",
        ai_tokens_used: aiResult.usage?.total_tokens,
        status: "completed",
      })
      .eq("id", upload.id);

    return new Response(
      JSON.stringify({
        recipe_id: recipe.id,
        upload_id: upload.id,
        sacred_analysis: sa ? {
          hero: sa.hero_ingredient,
          quality: sa.quality_score,
          confidence: sa.confidence,
          sacred_count: sa.sacred_ingredients?.length ?? 0,
          adaptations: sa.adaptations_made?.length ?? 0,
        } : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("recipe-extract error:", err);

    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
