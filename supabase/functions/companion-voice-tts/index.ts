import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Proxies text-to-speech requests to ElevenLabs API.
 * Keeps API key server-side. Returns base64-encoded audio.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { text, voice_id } = await req.json();

    if (!text || typeof text !== "string" || text.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Text is required (max 2000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default voice: Rachel (warm, friendly) — can be overridden
    const selectedVoice = voice_id || "21m00Tcm4TlvDq8ikWAM";

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(`ElevenLabs error ${res.status}:`, errText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${res.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert audio response to base64
    const audioBuffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(audioBuffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const audio_base64 = btoa(binary);

    return new Response(
      JSON.stringify({ audio_base64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("companion-voice-tts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
