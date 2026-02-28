import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional training content designer for hospitality venues.
Given the uploaded training material (PDF, image of a manual, or text), create:

1. A series of training cards (5-15 cards depending on content length). Each card should:
   - Have a clear title (max 60 chars)
   - Have concise content (2-4 sentences, easy to read on mobile)
   - Have 1-2 practical tips
   - Have an encouragement note (brief motivational message like "Great progress!" or "You're almost there!")
   - Progress from basic concepts to advanced

2. A quiz with 5-10 multiple choice questions testing comprehension. Each question:
   - Has 4 options
   - Has one correct answer (0-indexed)
   - Has a brief explanation of the correct answer

Return ONLY valid JSON:
{
  "title": "Module title if not already provided",
  "cards": [
    {"id": "c1", "title": "Card Title", "content": "Card body text...", "tips": ["Practical tip 1"], "encouragement": "You're doing great!", "order": 1}
  ],
  "quiz": [
    {"id": "q1", "question": "Question text?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_index": 0, "explanation": "Brief explanation"}
  ],
  "estimated_minutes": 15,
  "summary": "Brief module description"
}`;

function getFileCategory(file: File): "image" | "pdf" | "text" | "unknown" {
  const mime = file.type || "";
  const name = file.name?.toLowerCase() || "";
  if (mime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".heic"].some(e => name.endsWith(e))) return "image";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("text/") || [".txt", ".md", ".csv"].some(e => name.endsWith(e))) return "text";
  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const orgId = await getUserOrgId(authResult.user.id);
    if (orgId) {
      const quota = await checkAiQuota(orgId);
      if (!quota.allowed) {
        return new Response(
          JSON.stringify({ error: "ai_quota_exceeded", message: "Monthly AI limit reached." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const materialId = formData.get("material_id") as string;

    if (!file || !materialId) {
      return new Response(
        JSON.stringify({ error: "file and material_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build AI messages based on file type
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const category = getFileCategory(file);

    let messages: unknown[];

    if (category === "text") {
      const text = new TextDecoder().decode(uint8);
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create training cards and quiz from this material:\n\n${text}` },
      ];
    } else if (category === "image" || category === "pdf") {
      // Send as base64 image (Gemini handles images and PDFs)
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const mimeType = file.type || "image/jpeg";
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: "text", text: "Create training cards and quiz from this training material." },
          ],
        },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported file type. Upload an image, PDF, or text file." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call AI
    const aiStart = Date.now();
    const aiResult = await aiChat({ messages: messages as any });
    const aiLatency = Date.now() - aiStart;

    // Parse response
    const raw = aiResult.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    const cards = parsed.cards || [];
    const quiz = parsed.quiz || [];
    const estimatedMinutes = parsed.estimated_minutes || Math.ceil(cards.length * 1.5);

    // Update the training_materials row
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { error: updateErr } = await adminClient
      .from("training_materials")
      .update({
        cards,
        quiz,
        card_count: cards.length,
        estimated_minutes: estimatedMinutes,
        processing_status: "ready",
        content: parsed.summary || null,
      })
      .eq("id", materialId);

    if (updateErr) {
      console.error("Failed to update training_materials:", updateErr);
      // Try to mark as error
      await adminClient.from("training_materials").update({ processing_status: "error" }).eq("id", materialId);
      throw new Error("Failed to save processed content");
    }

    // Create notification for org admin
    if (orgId) {
      await adminClient.from("training_notifications").insert({
        org_id: orgId,
        type: "processing_done",
        payload: { material_id: materialId, title: parsed.title, card_count: cards.length, quiz_count: quiz.length },
      });

      logAiUsage({
        org_id: orgId,
        user_id: authResult.user.id,
        function_name: "process-training-file",
        provider: "gemini",
        model: "gemini-2.0-flash",
        usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
        latency_ms: aiLatency,
        has_image: category === "image",
      });
    }

    return new Response(
      JSON.stringify({ success: true, card_count: cards.length, quiz_count: quiz.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-training-file error:", error);

    // Try to mark material as error
    try {
      const formData = await req.clone().formData().catch(() => null);
      const materialId = formData?.get("material_id") as string;
      if (materialId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, serviceKey);
        await adminClient.from("training_materials").update({ processing_status: "error" }).eq("id", materialId);
      }
    } catch {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
