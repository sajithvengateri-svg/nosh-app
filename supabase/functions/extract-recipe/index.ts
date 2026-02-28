import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.18.5";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedIngredient {
  name: string;
  quantity: number;
  unit: string;
  matched_ingredient_id?: string;
  matched_ingredient_name?: string;
  estimated_cost?: number;
}

interface ExtractedRecipe {
  name: string;
  description: string;
  category: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  ingredients: ExtractedIngredient[];
  instructions: string[];
  allergens: string[];
}

function buildSystemPrompt(ingredientNames: string) {
  return `You are a professional chef and recipe data extractor. Extract recipe information from images, documents, or text of handwritten or printed recipes.

Your task is to:
1. Extract the recipe name, description, category, servings, prep time, and cook time
2. Extract all ingredients with their quantities and units
3. Extract step-by-step cooking instructions
4. Identify any allergens present

For ingredients, try to match them to these existing ingredients in our database (for auto-costing):
${ingredientNames || "No existing ingredients in database yet"}

Categories should be one of: Mains, Appetizers, Soups, Salads, Desserts, Sauces

Common allergens to look for: Gluten, Dairy, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Soy, Sesame

Return ONLY valid JSON matching this structure:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "category": "Mains",
  "servings": 4,
  "prep_time": 15,
  "cook_time": 30,
  "ingredients": [
    {
      "name": "ingredient name as written",
      "quantity": 500,
      "unit": "g",
      "matched_ingredient_name": "matching ingredient from database if found"
    }
  ],
  "instructions": ["Step 1...", "Step 2..."],
  "allergens": ["Gluten", "Dairy"]
}`;
}

function parseIngredientsList(raw: unknown): { id: string; name: string; unit: string; cost_per_unit: number }[] {
  try {
    let parsed: unknown[];
    if (Array.isArray(raw)) parsed = raw;
    else if (typeof raw === "string") parsed = JSON.parse(raw || "[]");
    else return [];
    // Cap ingredients list to prevent abuse
    if (parsed.length > 5000) parsed = parsed.slice(0, 5000);
    return parsed as { id: string; name: string; unit: string; cost_per_unit: number }[];
  } catch {
    return [];
  }
}

function enrichIngredients(
  extracted: ExtractedIngredient[],
  dbIngredients: { id: string; name: string; unit: string; cost_per_unit: number }[]
): ExtractedIngredient[] {
  return extracted.map((ing) => {
    const matchedIng = dbIngredients.find(
      (dbIng) =>
        dbIng.name.toLowerCase() === ing.name.toLowerCase() ||
        dbIng.name.toLowerCase() === ing.matched_ingredient_name?.toLowerCase() ||
        dbIng.name.toLowerCase().includes(ing.name.toLowerCase()) ||
        ing.name.toLowerCase().includes(dbIng.name.toLowerCase())
    );

    if (matchedIng) {
      return {
        ...ing,
        matched_ingredient_id: matchedIng.id,
        matched_ingredient_name: matchedIng.name,
        estimated_cost: matchedIng.cost_per_unit * ing.quantity,
      };
    }
    return ing;
  });
}

function parseAIResponse(content: string): ExtractedRecipe {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                    content.match(/```\s*([\s\S]*?)\s*```/) ||
                    [null, content];
  const jsonStr = jsonMatch[1] || content;
  return JSON.parse(jsonStr.trim());
}

// ── File type detection ────────────────────────────────────────────
function getFileCategory(file: File): "image" | "pdf" | "excel" | "csv" | "word" | "apple" | "text" | "unknown" {
  const name = file.name.toLowerCase();
  const mime = file.type || "";

  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    name.endsWith(".xlsx") || name.endsWith(".xls")
  ) return "excel";
  if (mime === "text/csv" || name.endsWith(".csv")) return "csv";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    name.endsWith(".docx") || name.endsWith(".doc")
  ) return "word";
  if (name.endsWith(".numbers") || name.endsWith(".pages")) return "apple";
  if (mime.startsWith("text/") || name.endsWith(".txt")) return "text";
  return "unknown";
}

// ── Text extractors ────────────────────────────────────────────────
async function extractExcelText(data: Uint8Array): Promise<string> {
  const workbook = XLSX.read(data, { type: "array" });
  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    lines.push(`--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    lines.push(csv);
  }
  return lines.join("\n");
}

function extractDocxText(data: Uint8Array): string {
  // .docx is a zip; word/document.xml has the text
  try {
    const workbook = XLSX.read(data, { type: "array" });
    // SheetJS can open docx-like zips but won't parse XML well.
    // Fallback: manually look for XML via zip reading from XLSX's zip util
    // Instead, use the raw zip approach:
    const decoder = new TextDecoder();
    const raw = decoder.decode(data);
    // Attempt to find XML body content between <w:t> tags
    const matches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/<[^>]+>/g, "")).join(" ");
    }
    // If that didn't work, try stripping all XML tags from any XML-like content
    const xmlContent = raw.match(/<w:body>([\s\S]*?)<\/w:body>/);
    if (xmlContent) {
      return xmlContent[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    throw new Error("Could not extract text from Word document");
  } catch {
    throw new Error("Could not read this Word file. Try exporting it as PDF and uploading again.");
  }
}

function extractAppleText(data: Uint8Array): string {
  // Apple Pages/Numbers are zip archives with proprietary protobuf content.
  // Try to find any readable text in the zip.
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const raw = decoder.decode(data);
  
  // Look for any readable text chunks (heuristic)
  const readable = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
  if (readable.length > 50) {
    return readable.substring(0, 50000); // cap
  }
  throw new Error("APPLE_FORMAT_UNREADABLE");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;


  try {
    const _orgId = await getUserOrgId(authResult.user.id);
    if (_orgId) {
      const _quota = await checkAiQuota(_orgId);
      if (!_quota.allowed) {
        return new Response(JSON.stringify({ error: "ai_quota_exceeded", message: "Monthly AI limit reached. Resets on the 1st.", pct_used: _quota.pct_used }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const contentType = req.headers.get("content-type") || "";
    let messages: unknown[];
    let ingredientsList: { id: string; name: string; unit: string; cost_per_unit: number }[] = [];

    if (contentType.includes("application/json")) {
      // === TEXT / URL mode ===
      const body = await req.json();
      const text = body.text || "";
      ingredientsList = parseIngredientsList(body.ingredients);

      if (!text.trim()) {
        return new Response(
          JSON.stringify({ error: "No text provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const ingredientNames = ingredientsList.map(i => `${i.name} (${i.unit})`).join(", ");
      const systemPrompt = buildSystemPrompt(ingredientNames);

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please extract all recipe information from this text. If there are multiple recipes, extract the first/main one. Be thorough with ingredients.\n\n${text}`,
        },
      ];
    } else {
      // === FILE mode ===
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const existingIngredients = formData.get("ingredients") as string;

      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: "File too large. Maximum file size is 10MB." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate file type against allowlist
      const ALLOWED_MIME_PREFIXES = [
        "image/",
        "application/pdf",
        "text/",
        "application/vnd.openxmlformats-officedocument",
        "application/vnd.ms-excel",
        "application/msword",
      ];
      const ALLOWED_EXTENSIONS = [
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic",
        ".pdf", ".txt", ".csv",
        ".xlsx", ".xls", ".docx", ".doc",
        ".pages", ".numbers",
      ];
      const fileName = file.name?.toLowerCase() || "";
      const fileMime = file.type || "";
      const mimeAllowed = ALLOWED_MIME_PREFIXES.some(p => fileMime.startsWith(p));
      const extAllowed = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

      if (!mimeAllowed && !extAllowed) {
        return new Response(
          JSON.stringify({ error: "Unsupported file type. Please upload an image, PDF, Excel, Word, or text file." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      ingredientsList = parseIngredientsList(existingIngredients);
      const ingredientNames = ingredientsList.map(i => `${i.name} (${i.unit})`).join(", ");
      const systemPrompt = buildSystemPrompt(ingredientNames);

      const category = getFileCategory(file);

      if (category === "excel" || category === "csv" || category === "word" || category === "text" || category === "apple") {
        // ── Text-based extraction path ──
        let extractedText = "";

        if (category === "excel") {
          extractedText = await extractExcelText(uint8);
        } else if (category === "csv" || category === "text") {
          extractedText = new TextDecoder().decode(uint8);
        } else if (category === "word") {
          extractedText = extractDocxText(uint8);
        } else if (category === "apple") {
          try {
            extractedText = extractAppleText(uint8);
          } catch (e) {
            if (e instanceof Error && e.message === "APPLE_FORMAT_UNREADABLE") {
              return new Response(
                JSON.stringify({
                  error: "This Apple file format couldn't be read. Please export it as PDF or Excel from Pages/Numbers and try again.",
                  errorCode: "APPLE_FORMAT_UNREADABLE",
                }),
                { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            throw e;
          }
        }

        if (!extractedText.trim()) {
          return new Response(
            JSON.stringify({ error: "Could not extract any text from this file. Try a different format." }),
            { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        messages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Please extract all recipe information from this document text. If there are multiple recipes, extract the first/main one. Be thorough with ingredients.\n\n${extractedText.substring(0, 30000)}`,
          },
        ];
      } else {
        // ── Image / PDF vision path (existing) ──
        // Convert to base64 in chunks to avoid stack overflow on large files
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
          binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        const mimeType = file.type || "image/jpeg";

        messages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: "Please extract all recipe information from this image. If there are multiple recipes, extract the first/main one. Be thorough with ingredients - include all of them with quantities and units.",
              },
            ],
          },
        ];
      }
    }

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: messages as any,
    });
    const _aiLatency = Date.now() - _aiStart;

    const content = aiResult.content || "";

    let extractedRecipe: ExtractedRecipe;
    try {
      extractedRecipe = parseAIResponse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse recipe data");
    }

    const enrichedRecipe = {
      ...extractedRecipe,
      ingredients: enrichIngredients(extractedRecipe.ingredients, ingredientsList),
    };

    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "extract-recipe", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: false });
    }

    return new Response(
      JSON.stringify({ success: true, recipe: enrichedRecipe }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-recipe error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
