import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Returns a Vapi auth token for the companion voice agent.
 * Same pattern as widget-voice-token but for the mobile companion.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
    if (!VAPI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Voice agent not configured. Please add VAPI_API_KEY." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const COMPANION_ASSISTANT_ID =
      Deno.env.get("VAPI_COMPANION_ASSISTANT_ID") ||
      Deno.env.get("VAPI_ASSISTANT_ID") ||
      "";

    return new Response(
      JSON.stringify({
        token: VAPI_API_KEY,
        assistantId: COMPANION_ASSISTANT_ID,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("companion-voice-token error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
