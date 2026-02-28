import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "public" } }
  );

  // 1. Check triggers on auth.users
  const { data: triggers, error: trigErr } = await supabase.rpc("debug_auth_check");

  // 2. Try creating a user via admin
  const { data: user, error: userErr } = await supabase.auth.admin.createUser({
    email: `debug-${Date.now()}@test.com`,
    password: "TestPass1234",
    email_confirm: true,
    user_metadata: { full_name: "Debug" },
  });

  // 3. Check debug log
  const { data: logs } = await supabase.from("_auth_debug_log").select("*").order("id", { ascending: false }).limit(5);

  return new Response(JSON.stringify({
    triggers: triggers ?? trigErr?.message,
    user_result: user ? "SUCCESS" : userErr?.message,
    debug_logs: logs,
  }, null, 2), { headers: { "Content-Type": "application/json" } });
});
