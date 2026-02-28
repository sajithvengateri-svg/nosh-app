import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin if authenticated
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const { data: { user: caller } } = await supabase.auth.getUser(token);
      if (caller) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", caller.id);
        const isAdmin = roles?.some((r) => r.role === "admin");
        if (!isAdmin) throw new Error("Not authorized — admin role required");
      }
    }

    const { action, email, userId, password, full_name } = await req.json();

    if (action === "delete_user") {
      let targetId = userId;
      if (!targetId && email) {
        const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
        if (listErr) throw listErr;
        const found = users.find((u) => u.email === email);
        if (!found) throw new Error(`No user found with email: ${email}`);
        targetId = found.id;
      }
      if (!targetId) throw new Error("Provide email or userId");

      // Find orgs owned by this user
      const { data: ownedOrgs } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", targetId);

      if (ownedOrgs && ownedOrgs.length > 0) {
        const orgIds = ownedOrgs.map((o) => o.id);
        // Use the dynamic nuke function to delete ALL org-scoped data
        const { data: nukeResult, error: nukeErr } = await supabase.rpc("admin_nuke_orgs", {
          p_org_ids: orgIds,
        });
        if (nukeErr) throw new Error(`Org nuke failed: ${nukeErr.message}`);
      }

      // Delete user-level data
      await supabase.from("module_permissions").delete().eq("user_id", targetId);
      await supabase.from("user_roles").delete().eq("user_id", targetId);
      await supabase.from("org_memberships").delete().eq("user_id", targetId);
      await supabase.from("section_assignments").delete().eq("user_id", targetId);
      await supabase.from("profiles").delete().eq("user_id", targetId);
      await supabase.from("signup_events").delete().eq("user_id", targetId);
      await supabase.from("referral_codes").delete().eq("user_id", targetId);

      // Finally delete auth user
      const { error: delErr } = await supabase.auth.admin.deleteUser(targetId);
      if (delErr) throw new Error(`Auth delete failed: ${delErr.message}`);

      return new Response(
        JSON.stringify({ success: true, message: `Deleted user ${email || targetId}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list_users") {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      const simplified = users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        confirmed: !!u.email_confirmed_at,
        name: u.user_metadata?.full_name || "",
      }));

      return new Response(
        JSON.stringify({ success: true, users: simplified }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_password") {
      if (!email && !userId) throw new Error("Provide email or userId");
      let targetId = userId;
      if (!targetId && email) {
        const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
        if (listErr) throw listErr;
        const found = users.find((u) => u.email === email);
        if (!found) throw new Error(`No user found with email: ${email}`);
        targetId = found.id;
      }
      const { error: updateErr } = await supabase.auth.admin.updateUserById(targetId, {
        password: password || "Admin123!",
      });
      if (updateErr) throw new Error(`Update password failed: ${updateErr.message}`);
      return new Response(
        JSON.stringify({ success: true, message: `Password updated for ${email || targetId}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create_admin") {
      const adminEmail = email;
      const adminPassword = password || "Admin123!";
      const adminName = full_name || "Master Admin";

      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: adminName },
      });
      if (createErr) throw new Error(`Create user failed: ${createErr.message}`);

      await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

      return new Response(
        JSON.stringify({ success: true, message: `Admin ${adminEmail} created`, userId: newUser.user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "nuke_orgs") {
      // Nuke orgs by IDs, used by the frontend nuke button
      const { orgIds } = await req.json().catch(() => ({ orgIds: [] }));
      // Already parsed above, re-read from body isn't possible — 
      // This action is handled differently: caller passes orgIds in initial body
      throw new Error("Use delete_user action or call admin_nuke_orgs RPC directly");
    }

    throw new Error("Unknown action");
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
