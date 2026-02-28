import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { provider, action, org_id, code, redirect_uri } = await req.json();
    if (!provider || !action || !org_id) {
      return new Response(JSON.stringify({ error: "provider, action, org_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Provider configurations (OAuth URLs, scopes)
    const PROVIDERS: Record<string, {
      authUrl: string;
      tokenUrl: string;
      scopes: string;
      clientIdEnv: string;
      clientSecretEnv: string;
    }> = {
      xero: {
        authUrl: "https://login.xero.com/identity/connect/authorize",
        tokenUrl: "https://identity.xero.com/connect/token",
        scopes: "openid profile email accounting.transactions accounting.contacts offline_access",
        clientIdEnv: "XERO_CLIENT_ID",
        clientSecretEnv: "XERO_CLIENT_SECRET",
      },
      square: {
        authUrl: "https://connect.squareup.com/oauth2/authorize",
        tokenUrl: "https://connect.squareup.com/oauth2/token",
        scopes: "PAYMENTS_READ ORDERS_READ ITEMS_READ",
        clientIdEnv: "SQUARE_CLIENT_ID",
        clientSecretEnv: "SQUARE_CLIENT_SECRET",
      },
      deputy: {
        authUrl: "https://once.deputy.com/my/oauth/login",
        tokenUrl: "https://once.deputy.com/my/oauth/access_token",
        scopes: "timesheets:read roster:read",
        clientIdEnv: "DEPUTY_CLIENT_ID",
        clientSecretEnv: "DEPUTY_CLIENT_SECRET",
      },
      lightspeed: {
        authUrl: "https://cloud.lightspeedapp.com/oauth/authorize.php",
        tokenUrl: "https://cloud.lightspeedapp.com/oauth/access_token.php",
        scopes: "employee:all systemuserid:all",
        clientIdEnv: "LIGHTSPEED_CLIENT_ID",
        clientSecretEnv: "LIGHTSPEED_CLIENT_SECRET",
      },
      tanda: {
        authUrl: "https://my.tanda.co/api/oauth/authorize",
        tokenUrl: "https://my.tanda.co/api/oauth/token",
        scopes: "timesheets cost roster me",
        clientIdEnv: "TANDA_CLIENT_ID",
        clientSecretEnv: "TANDA_CLIENT_SECRET",
      },
    };

    const config = PROVIDERS[provider];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── AUTH URL ───
    if (action === "auth_url") {
      const clientId = Deno.env.get(config.clientIdEnv);
      if (!clientId) {
        return new Response(JSON.stringify({ error: `${config.clientIdEnv} not configured. Add it as a secret.` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = btoa(JSON.stringify({ org_id, provider }));
      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: config.scopes,
        redirect_uri: redirect_uri || `${supabaseUrl}/functions/v1/api-connect`,
        state,
      });

      return new Response(JSON.stringify({ url: `${config.authUrl}?${params}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CALLBACK ───
    if (action === "callback") {
      if (!code) {
        return new Response(JSON.stringify({ error: "code required for callback" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const clientId = Deno.env.get(config.clientIdEnv);
      const clientSecret = Deno.env.get(config.clientSecretEnv);
      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: `${provider} credentials not configured` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirect_uri || `${supabaseUrl}/functions/v1/api-connect`,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error(`Token exchange failed for ${provider}:`, errText);
        return new Response(JSON.stringify({ error: "Token exchange failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();

      // Determine category based on provider
      const categoryMap: Record<string, string> = {
        xero: "accounting", square: "pos", lightspeed: "pos",
        deputy: "labour", tanda: "labour",
      };

      // Upsert data_connection
      const { data: connection, error: connError } = await adminClient
        .from("data_connections")
        .upsert({
          org_id,
          provider,
          category: categoryMap[provider] || "other",
          status: "active",
          config: { tokens, connected_at: new Date().toISOString() },
          last_sync_at: new Date().toISOString(),
        }, { onConflict: "org_id,provider" })
        .select()
        .single();

      if (connError) {
        // Fallback: insert without onConflict
        await adminClient.from("data_connections").insert({
          org_id, provider, category: categoryMap[provider] || "other",
          status: "active",
          config: { tokens, connected_at: new Date().toISOString() },
        });
      }

      return new Response(JSON.stringify({ success: true, connection }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── SYNC ───
    if (action === "sync") {
      // Get the connection for this org+provider
      const { data: conn } = await adminClient
        .from("data_connections")
        .select("*")
        .eq("org_id", org_id)
        .eq("provider", provider)
        .eq("status", "active")
        .single();

      if (!conn) {
        return new Response(JSON.stringify({ error: `No active ${provider} connection found` }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accessToken = (conn.config as any)?.tokens?.access_token;
      if (!accessToken) {
        return new Response(JSON.stringify({ error: "No access token — reconnect required" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Provider-specific sync logic (simplified — pulls last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
      const periodStart = thirtyDaysAgo.toISOString().split("T")[0];
      const periodEnd = today.toISOString().split("T")[0];

      let importRecords: any[] = [];

      if (provider === "xero") {
        // Fetch invoices from Xero
        try {
          const tenantId = (conn.config as any)?.tokens?.xero_tenant_id;
          const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          };
          if (tenantId) headers["Xero-tenant-id"] = tenantId;

          const invoicesRes = await fetch(
            `https://api.xero.com/api.xro/2.0/Invoices?where=Date>DateTime(${thirtyDaysAgo.getFullYear()},${thirtyDaysAgo.getMonth() + 1},${thirtyDaysAgo.getDate()})&Status=AUTHORISED`,
            { headers }
          );

          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            for (const inv of invoicesData.Invoices || []) {
              importRecords.push({
                org_id,
                connection_id: conn.id,
                source_type: "api",
                data_type: inv.Type === "ACCREC" ? "revenue" : "overhead",
                period_start: periodStart,
                period_end: periodEnd,
                amount: inv.Total || 0,
                metadata: { xero_invoice_id: inv.InvoiceID, supplier: inv.Contact?.Name },
                status: "received",
              });
            }
          }
        } catch (e) {
          console.error("Xero sync error:", e);
        }
      } else if (provider === "square" || provider === "lightspeed") {
        // POS sync — revenue data
        importRecords.push({
          org_id,
          connection_id: conn.id,
          source_type: "api",
          data_type: "revenue",
          period_start: periodStart,
          period_end: periodEnd,
          amount: 0, // Would be populated from actual API call
          metadata: { provider, sync_note: "Placeholder — configure API endpoint" },
          status: "received",
        });
      } else if (provider === "deputy" || provider === "tanda") {
        // Labour sync
        importRecords.push({
          org_id,
          connection_id: conn.id,
          source_type: "api",
          data_type: "labour",
          period_start: periodStart,
          period_end: periodEnd,
          amount: 0,
          metadata: { provider, sync_note: "Placeholder — configure API endpoint" },
          status: "received",
        });
      }

      // Insert import records
      if (importRecords.length > 0) {
        await adminClient.from("data_imports").insert(importRecords);
      }

      // Update last_sync_at
      await adminClient
        .from("data_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", conn.id);

      return new Response(JSON.stringify({ success: true, imported: importRecords.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("api-connect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
