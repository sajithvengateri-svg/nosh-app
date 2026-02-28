import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;


  try {
    const { fileId, accessToken, mimeType, fileName } = await req.json();

    if (!fileId || !accessToken) {
      return new Response(
        JSON.stringify({ error: "fileId and accessToken are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For Google Docs/Sheets/Slides, export as PDF; otherwise download directly
    const isGoogleDoc = mimeType?.startsWith("application/vnd.google-apps.");
    let downloadUrl: string;

    if (isGoogleDoc) {
      // Export Google Docs as PDF
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    } else {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    }

    const driveResponse = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!driveResponse.ok) {
      const errorText = await driveResponse.text();
      console.error("Drive download error:", driveResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Google Drive download failed: ${driveResponse.status}` }),
        { status: driveResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBytes = await driveResponse.arrayBuffer();
    const actualMime = isGoogleDoc ? "application/pdf" : (mimeType || "application/octet-stream");
    const actualName = isGoogleDoc ? `${fileName || "document"}.pdf` : (fileName || "file");

    // Now call extract-recipe with this file
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Pass the authorization header from the original request
    const authHeader = req.headers.get("Authorization") || `Bearer ${SUPABASE_ANON_KEY}`;

    // Get ingredients from query if provided
    const url = new URL(req.url);
    const ingredientsParam = url.searchParams.get("ingredients") || "[]";

    const formData = new FormData();
    formData.append("file", new Blob([fileBytes], { type: actualMime }), actualName);
    formData.append("ingredients", ingredientsParam);

    const extractResponse = await fetch(`${SUPABASE_URL}/functions/v1/extract-recipe`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: formData,
    });

    const extractResult = await extractResponse.json();

    return new Response(JSON.stringify(extractResult), {
      status: extractResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("gdrive-download error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
