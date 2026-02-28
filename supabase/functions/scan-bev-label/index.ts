import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { aiChat } from "../_shared/ai.ts";
import { checkAiQuota, logAiUsage, getUserOrgId } from "../_shared/usage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCAN_PROMPTS: Record<string, string> = {
  wine_label: `You are an expert sommelier and wine label reader. Analyze this wine label image and extract:
{
  "product_name": "Full wine name",
  "producer": "Winery/producer name",
  "vintage": "Year as number or null",
  "region": "Wine region",
  "appellation": "Appellation/AOC/DOC if shown",
  "varietal": "Grape variety/varieties",
  "abv": "Alcohol % as number",
  "volume_ml": "Bottle size in ml as number",
  "country": "Country of origin",
  "tasting_notes": "Any tasting notes on label",
  "classification": "e.g. Grand Cru, Reserva, etc.",
  "notes": "Any other relevant text"
}`,
  spirit_label: `You are an expert at reading spirit/liquor bottle labels. Analyze this label and extract:
{
  "product_name": "Full spirit name",
  "brand": "Brand/distillery name",
  "spirit_type": "e.g. Whisky, Vodka, Gin, Rum, Tequila, etc.",
  "sub_type": "e.g. Single Malt, Blanco, VSOP, etc.",
  "abv": "Alcohol % as number",
  "volume_ml": "Bottle size in ml as number",
  "age_statement": "Age if stated",
  "country": "Country of origin",
  "region": "Region if stated",
  "cask_type": "Cask/barrel info if shown",
  "batch_number": "Batch or lot number",
  "notes": "Any other relevant text"
}`,
  beer_label: `You are an expert at reading beer labels and cans. Analyze this label and extract:
{
  "product_name": "Full beer name",
  "brewery": "Brewery name",
  "beer_style": "e.g. IPA, Lager, Stout, Pale Ale, etc.",
  "abv": "Alcohol % as number",
  "volume_ml": "Volume in ml as number",
  "ibu": "IBU if stated as number",
  "ingredients": "Listed ingredients if shown",
  "country": "Country of origin",
  "batch_number": "Batch/lot number",
  "best_before": "Best before date if shown",
  "notes": "Any other relevant text"
}`,
  equipment_tag: `You are an expert at reading equipment asset labels. Analyze this label and extract:
{
  "name": "Equipment name/type",
  "manufacturer": "Brand/manufacturer",
  "model": "Model number",
  "serial_number": "Serial number",
  "voltage": "Voltage rating",
  "power": "Power rating (watts/amps)",
  "manufacture_date": "Manufacturing date (YYYY-MM-DD)",
  "certifications": "Safety certifications",
  "notes": "Any other relevant text"
}`,
  barcode: `Analyze this image of a barcode or QR code. Extract:
{
  "code_type": "barcode or qr_code",
  "code_value": "The decoded value/number",
  "format": "e.g. EAN-13, UPC-A, QR, Code128, etc.",
  "product_name": "Product name if visible near barcode",
  "notes": "Any other visible information near the code"
}`,
  invoice: `You are an expert at reading supplier invoices for bar/restaurant inventory. Extract all line items:
{
  "supplier_name": "Supplier/vendor name",
  "invoice_number": "Invoice number",
  "invoice_date": "Date (YYYY-MM-DD)",
  "items": [
    {
      "name": "Item name",
      "quantity": 0,
      "unit": "unit type",
      "unit_price": 0,
      "total_price": 0
    }
  ],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "notes": "Any other relevant info"
}`,
};

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

    const { imageBase64, scanType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const systemPrompt = SCAN_PROMPTS[scanType] || SCAN_PROMPTS.barcode;

    const _aiStart = Date.now();
    const aiResult = await aiChat({
      messages: [
          { role: "system", content: systemPrompt + "\n\nFocus on accuracy. Only extract information you can clearly read. Return null for fields you cannot determine." },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this image and extract all available information." },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      response_format: { type: "json_object" },
    });
    const _aiLatency = Date.now() - _aiStart;
    if (_orgId) {
      logAiUsage({ org_id: _orgId, user_id: authResult.user.id, function_name: "scan-bev-label", provider: "gemini", model: "gemini-2.0-flash", usage: aiResult.usage ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 }, latency_ms: _aiLatency, has_image: true });
    }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

        const content = aiResult.content;
    
    if (!content) {
      throw new Error("No response content from AI");
    }

    const extractedData = JSON.parse(content);

    return new Response(
      JSON.stringify({ success: true, data: extractedData, scanType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scan-bev-label error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
