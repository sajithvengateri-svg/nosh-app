import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Test accounts for dev quick-login
const DEV_ACCOUNTS: Record<string, { email: string; password: string; redirect: string; fullName: string }> = {
  admin: { email: "admin@chefos.app", password: "ChefOS2026x", redirect: "/admin", fullName: "Admin User" },
  chef: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/dashboard", fullName: "Head Chef" },
  vendor: { email: "vendor@chefos.app", password: "ChefOS2026x", redirect: "/vendor/dashboard", fullName: "Vendor User" },
  bevos: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/bev/dashboard", fullName: "Bar Manager" },
  restos: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/restos/dashboard", fullName: "Restaurant Manager" },
  reservation: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/reservation/dashboard", fullName: "Res OS Manager" },
  posos: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/posos/dashboard", fullName: "POS Manager" },
  overhead: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/overhead/dashboard", fullName: "Overhead Manager" },
  labour: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/labour/dashboard", fullName: "Labour Manager" },
  supply: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/supply/dashboard", fullName: "Supply Manager" },
  growth: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/growth/dashboard", fullName: "Growth Manager" },
  money: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/money/dashboard", fullName: "Finance Manager" },
  quiet: { email: "chef@chefos.app", password: "ChefOS2026x", redirect: "/quiet/dashboard", fullName: "Intelligence" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Block in production — only allow in development/local environments
  const envMode = Deno.env.get("ENVIRONMENT") || Deno.env.get("APP_ENV") || "production";
  if (envMode === "production") {
    return new Response(
      JSON.stringify({ error: "Dev login is disabled in production" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { persona, action } = await req.json();

    // Action: reset-passwords
    if (action === "reset-passwords") {
      const results: Record<string, string> = {};
      for (const [key, acct] of Object.entries(DEV_ACCOUNTS)) {
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const user = users?.find(u => u.email === acct.email);
        if (!user) {
          results[key] = `not found (${acct.email})`;
          continue;
        }
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(user.id, {
          password: acct.password,
        });
        results[key] = updateErr ? updateErr.message : "ok";
      }
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: login as persona
    const account = DEV_ACCOUNTS[persona];
    if (!account) {
      return new Response(
        JSON.stringify({ error: `Unknown persona: ${persona}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey);

    // Try sign in first
    let { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    // If user doesn't exist, create them and try again
    if (error) {
      const { error: createErr } = await adminClient.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      });

      if (createErr && !createErr.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: `Failed to create account: ${createErr.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // If already registered, reset password
      if (createErr?.message.includes("already been registered")) {
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const user = users?.find(u => u.email === account.email);
        if (user) {
          await adminClient.auth.admin.updateUserById(user.id, { password: account.password });
        }
      }

      // Try sign in again
      const retry = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        redirect: account.redirect,
        user: { id: data.user?.id, email: data.user?.email },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
