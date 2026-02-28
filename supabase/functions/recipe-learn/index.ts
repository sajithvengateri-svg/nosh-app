// recipe-learn: Aggregates sacred analysis data into the knowledge base.
// Can be called as admin action (rebuild all cuisines) or for a single cuisine.
// The inline version (single cuisine) is also embedded in recipe-extract.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SacredIngredient {
  ingredient: string;
  reason?: string;
}

interface FlexibleIngredient {
  ingredient: string;
  can_remove?: boolean;
  substitute?: string;
}

interface SacredAnalysisRow {
  cuisine: string;
  sacred_ingredients: SacredIngredient[];
  sacred_technique: string | null;
  sacred_flavour_profile: string | null;
  hero_ingredient: string | null;
  flexible_ingredients: FlexibleIngredient[];
  side_tasks_needed: string[];
  quality_score: number | null;
}

async function aggregateCuisine(
  db: any,
  cuisine: string,
  analyses: SacredAnalysisRow[]
): Promise<void> {
  const total = analyses.length;

  // Sacred ingredients by frequency
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

  // Common sacred: >30% frequency
  const commonSacred = [...sacredCounts.entries()]
    .filter(([_, v]) => v.count / total >= 0.3)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([ingredient, v]) => ({
      ingredient,
      frequency: Math.round((v.count / total) * 100),
      reason: v.reasons[0] ?? "",
    }));

  // Commonly removed: >40%
  const commonRemoved = [...removedItems.entries()]
    .filter(([_, count]) => count / total >= 0.4)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // Common side tasks: >30%
  const commonSides = [...sideTasks.entries()]
    .filter(([_, count]) => count / total >= 0.3)
    .map(([name]) => name);

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
        common_sacred_techniques: [...new Set(techniques)].slice(0, 5),
        common_flavour_profiles: [...new Set(flavourProfiles)].slice(0, 5),
        typical_hero_ingredients: [...new Set(heroIngredients)].slice(0, 5),
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
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Admin check
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

    const body = await req.json().catch(() => ({}));
    const targetCuisine = body.cuisine; // optional: learn for single cuisine

    // Fetch all sacred analyses (or filtered by cuisine)
    let query = serviceClient
      .from("ds_recipe_sacred_analysis")
      .select("cuisine, sacred_ingredients, sacred_technique, sacred_flavour_profile, hero_ingredient, flexible_ingredients, side_tasks_needed, quality_score");

    if (targetCuisine) {
      query = query.eq("cuisine", targetCuisine);
    }

    const { data: analyses, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!analyses?.length) {
      return new Response(
        JSON.stringify({ message: "No sacred analyses found", cuisines_updated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by cuisine
    const byCuisine = new Map<string, SacredAnalysisRow[]>();
    for (const a of analyses) {
      const existing = byCuisine.get(a.cuisine) ?? [];
      existing.push(a as SacredAnalysisRow);
      byCuisine.set(a.cuisine, existing);
    }

    // Aggregate each cuisine (skip those with < 2 recipes)
    let updated = 0;
    const results: { cuisine: string; recipes: number }[] = [];

    for (const [cuisine, rows] of byCuisine) {
      if (rows.length < 2) continue;

      await aggregateCuisine(serviceClient, cuisine, rows);
      updated++;
      results.push({ cuisine, recipes: rows.length });
    }

    console.log(`recipe-learn: updated ${updated} cuisine knowledge bases`);

    return new Response(
      JSON.stringify({
        cuisines_updated: updated,
        total_analyses: analyses.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("recipe-learn error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
