import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — require admin or cron invocation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is authenticated
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active retention settings where retention_days > 0 (not "keep forever" = -1)
    const { data: settings, error: settingsError } = await supabase
      .from("org_storage_settings")
      .select("*")
      .eq("enabled", true)
      .gt("retention_days", 0);

    if (settingsError) throw settingsError;

    let totalDeleted = 0;
    const results: { bucket: string; org_id: string; deleted: number; errors: string[] }[] = [];

    for (const setting of settings || []) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - setting.retention_days);
      const cutoffISO = cutoffDate.toISOString();

      // List files in the bucket for this org
      // Files are stored as org_id/filename or org_id/subfolder/filename
      const { data: files, error: listError } = await supabase.storage
        .from(setting.bucket_name)
        .list(setting.org_id, { limit: 500 });

      if (listError) {
        results.push({
          bucket: setting.bucket_name,
          org_id: setting.org_id,
          deleted: 0,
          errors: [listError.message],
        });
        continue;
      }

      const expiredFiles = (files || []).filter(f => {
        if (!f.created_at) return false;
        return new Date(f.created_at) < cutoffDate;
      });

      if (expiredFiles.length === 0) continue;

      const filePaths = expiredFiles.map(f => `${setting.org_id}/${f.name}`);
      
      const { data: removeData, error: removeError } = await supabase.storage
        .from(setting.bucket_name)
        .remove(filePaths);

      const deleted = removeError ? 0 : filePaths.length;
      totalDeleted += deleted;

      results.push({
        bucket: setting.bucket_name,
        org_id: setting.org_id,
        deleted,
        errors: removeError ? [removeError.message] : [],
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_deleted: totalDeleted,
        details: results,
        processed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Storage cleanup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
