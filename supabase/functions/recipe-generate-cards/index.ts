import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildCardPrompt(sacredContext: string): string {
  return `You are a cooking workflow designer for the NOSH app.

Given a recipe with its ingredients and sacred analysis, generate 4-6 workflow cards that break the cooking process into clear, confident steps. Each card represents one phase of cooking.

${sacredContext}

═══ CARD STRUCTURE ═══

The 6-card template (adapt based on dish — some dishes need 4-5 cards):
  Card 1: SEAR / BROWN / HEAT — get the protein or base going
  Card 2: BUILD FLAVOUR — aromatics, spices, deglaze
  Card 3: ADD LIQUID / MAIN — stock, tomatoes, coconut milk + remaining ingredients
  Card 4: SIMMER / COOK — the waiting step (timer card)
  Card 5: FINISH — fresh herbs, cream, lime, final seasoning
  Card 6: SERVE — plate, garnish, eat

Not every dish fits all 6. A stir fry might be 4 cards. A braise might need all 6. Use your judgement.

═══ RULES ═══

1. Card 1 should align with the SACRED TECHNIQUE (if "sear then braise", card 1 must be sear)
2. Sacred ingredients should appear early and prominently
3. Side tasks (rice, noodles, bread) appear as parallel_task callouts: "SIDE: Start rice now"
4. Side tasks go on the card where there's downtime (usually the simmer card)
5. Prep actions (dice, mince, slice, measure) are NOT cards — they're done before cooking starts
6. Keep instructions concise: 2-4 steps per card
7. success_marker must be SENSORY — what you see, smell, or feel (not "done" or "ready")
8. pro_tip should be genuinely useful, not generic
9. Every ingredient must appear in at least one card's ingredients_used
10. timer_seconds only for steps that require actual waiting (simmering, resting, marinating)

Return a JSON array of cards:

[
  {
    "card_number": 1,
    "title": "UPPERCASE VERB PHRASE (e.g. SEAR THE CHICKEN)",
    "card_type": "prep | technique | simmer | finish | serve",
    "heat_level": 0-3,
    "instructions": ["step 1", "step 2", "step 3"],
    "success_marker": "sensory cue (golden brown, fragrant, bubbling)",
    "timer_seconds": null or integer,
    "parallel_task": null or "SIDE: Start rice now",
    "pro_tip": null or "expert tip",
    "technique_icon": "chop | stir | flip | sear | simmer | fold | pour | plate",
    "ingredients_used": [
      { "name": "ingredient", "qty": "600g", "action": "diced" }
    ]
  }
]

Respond with ONLY the JSON array, no markdown, no explanation.`;
}

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

    const { recipe_id } = await req.json();
    if (!recipe_id) throw new Error("recipe_id required");

    // Fetch recipe + ingredients + sacred analysis
    const [recipeResult, sacredResult] = await Promise.all([
      serviceClient
        .from("ds_recipes")
        .select("*, ingredients:ds_recipe_ingredients(*)")
        .eq("id", recipe_id)
        .single(),
      serviceClient
        .from("ds_recipe_sacred_analysis")
        .select("*")
        .eq("recipe_id", recipe_id)
        .maybeSingle(),
    ]);

    if (recipeResult.error || !recipeResult.data) throw new Error("Recipe not found");
    const recipe = recipeResult.data;
    const sacred = sacredResult.data;

    // Build ingredient list context
    const ingredientList = (recipe.ingredients || [])
      .map(
        (i: Record<string, unknown>) =>
          `- ${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? ` ${i.unit}` : ""})` : ""}${i.is_sacred ? " [SACRED]" : ""}`
      )
      .join("\n");

    // Build sacred context
    let sacredContext = "";
    if (sacred) {
      const sacredIngNames = (sacred.sacred_ingredients ?? [])
        .map((si: any) => si.ingredient)
        .join(", ");

      sacredContext = `═══ SACRED ANALYSIS FOR THIS DISH ═══

Hero ingredient: ${sacred.hero_ingredient ?? "not specified"}
Sacred technique: ${sacred.sacred_technique ?? "not specified"}
Sacred flavour profile: ${sacred.sacred_flavour_profile ?? "not specified"}
Sacred ingredients: ${sacredIngNames || "none identified"}
Side tasks needed: ${(sacred.side_tasks_needed ?? []).join(", ") || "none"}
One-pot feasible: ${sacred.one_pot_feasible ? "yes" : "no — may need creative adaptation"}

IMPORTANT: The sacred technique MUST be reflected in the card structure.
Sacred ingredients should be handled with care — they define this dish.`;
    } else {
      sacredContext = "No sacred analysis available for this recipe. Use your culinary expertise.";
    }

    const recipeContext = `Recipe: ${recipe.title}
Cuisine: ${recipe.cuisine}
Vessel: ${recipe.vessel}
Total time: ${recipe.total_time_minutes} minutes
Prep time: ${recipe.prep_time_minutes ?? "unknown"} minutes
Cook time: ${recipe.cook_time_minutes ?? "unknown"} minutes
Serves: ${recipe.serves}
Spice level: ${recipe.spice_level}/4
Description: ${recipe.description ?? ""}
Hook: ${recipe.nosh_hook ?? ""}

Ingredients:
${ingredientList}`;

    // Call AI
    const systemPrompt = buildCardPrompt(sacredContext);
    const aiResult = await aiChat(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: recipeContext },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      },
      "gemini"
    );

    if (!aiResult.content) throw new Error("AI returned no content");

    // Parse cards
    let jsonStr = aiResult.content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    let cards: Record<string, unknown>[];
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      cards = parsed;
    } else if (Array.isArray(parsed.cards)) {
      cards = parsed.cards;
    } else {
      throw new Error("Unexpected AI response format");
    }

    // Delete existing workflow cards
    await serviceClient
      .from("ds_recipe_workflow_cards")
      .delete()
      .eq("recipe_id", recipe_id);

    // Insert new cards
    const rows = cards.map((c: Record<string, unknown>, i: number) => ({
      recipe_id,
      card_number: (c.card_number as number) ?? i + 1,
      title: c.title as string,
      card_type: c.card_type as string,
      heat_level: c.heat_level as number,
      instructions: c.instructions as string[],
      success_marker: c.success_marker as string | undefined,
      timer_seconds: c.timer_seconds as number | undefined,
      parallel_task: c.parallel_task as string | undefined,
      pro_tip: c.pro_tip as string | undefined,
      technique_icon: c.technique_icon as string | undefined,
      ingredients_used: c.ingredients_used ?? [],
    }));

    const { error: insertErr } = await serviceClient
      .from("ds_recipe_workflow_cards")
      .insert(rows);

    if (insertErr) throw insertErr;

    // Update pipeline status
    await serviceClient
      .from("ds_recipes")
      .update({ pipeline_status: "cards_ready" })
      .eq("id", recipe_id);

    return new Response(
      JSON.stringify({
        recipe_id,
        card_count: cards.length,
        tokens_used: aiResult.usage?.total_tokens,
        sacred_aware: !!sacred,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("recipe-generate-cards error:", err);

    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
