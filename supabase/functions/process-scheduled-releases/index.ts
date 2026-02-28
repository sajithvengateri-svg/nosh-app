import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all features scheduled to release now or in the past
    const { data: due, error: fetchErr } = await supabase
      .from("feature_releases")
      .select("id, module_name")
      .neq("status", "released")
      .not("scheduled_release_at", "is", null)
      .lte("scheduled_release_at", new Date().toISOString());

    if (fetchErr) throw fetchErr;

    if (!due || due.length === 0) {
      return new Response(
        JSON.stringify({ released: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = due.map((r) => r.id);

    const { error: updateErr } = await supabase
      .from("feature_releases")
      .update({ status: "released", released_at: new Date().toISOString() })
      .in("id", ids);

    if (updateErr) throw updateErr;

    console.log(`Auto-released ${ids.length} features:`, due.map((r) => r.module_name));

    return new Response(
      JSON.stringify({ released: ids.length, modules: due.map((r) => r.module_name) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error processing scheduled releases:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
