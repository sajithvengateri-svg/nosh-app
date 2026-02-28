import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * VenueFlow BEO (Banquet Event Order) Generator
 *
 * Generates a kitchen-ready BEO document from a confirmed function:
 * - Event details, room setup, timeline
 * - Menu with quantities (party_size x items)
 * - Dietary breakdown
 * - Beverage service plan
 * - AV/special requirements
 *
 * POST /vf-beo-generator
 * Body: { functionId }
 *
 * Returns: { success: true, beoHtml: string }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { functionId } = await req.json();
    if (!functionId) {
      return new Response(JSON.stringify({ error: "functionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load function with related data
    const { data: func, error: funcErr } = await supabase
      .from("res_functions")
      .select("*")
      .eq("id", functionId)
      .single();

    if (funcErr || !func) {
      return new Response(JSON.stringify({ error: "Function not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const f = func as any;

    // Get client
    const { data: client } = f.client_id ? await supabase
      .from("res_function_clients")
      .select("*")
      .eq("id", f.client_id)
      .single() : { data: null };

    // Get venue space
    const { data: space } = f.venue_space_id ? await supabase
      .from("res_venue_spaces")
      .select("*")
      .eq("id", f.venue_space_id)
      .single() : { data: null };

    // Get proposal + menu sections
    const { data: proposals } = await supabase
      .from("res_function_proposals")
      .select("*")
      .eq("function_id", functionId)
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1);

    const proposal = (proposals as any)?.[0];
    let menuSections: any[] = [];
    if (proposal) {
      const { data: sections } = await supabase
        .from("res_proposal_menu_sections")
        .select("*")
        .eq("proposal_id", proposal.id)
        .order("sort_order");
      menuSections = sections || [];
    }

    // Get beverage package
    const { data: bevPackage } = f.beverage_package_id ? await supabase
      .from("vf_beverage_packages")
      .select("*")
      .eq("id", f.beverage_package_id)
      .single() : { data: null };

    // Get org name
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", f.org_id)
      .single();

    const orgName = (org as any)?.name || "Venue";
    const clientName = (client as any)?.contact_name || "Client";
    const spaceName = (space as any)?.name || "Main Dining";
    const partySize = f.party_size || 0;

    // Build menu HTML
    const menuHtml = menuSections.map((section: any) => {
      const items = (section.items || []).map((item: any) =>
        `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;">${item.name || ""}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;color:#666;">${item.description || ""}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${partySize}</td>
        </tr>`
      ).join("");

      return `
        <h3 style="color:#1B2A4A;margin:16px 0 4px;font-size:14px;border-bottom:2px solid #C9A96E;padding-bottom:4px;">
          ${section.title} ${section.pricing_type === "PER_HEAD" ? `($${section.per_head_price}/pp)` : ""}
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f5f0eb;"><th style="padding:4px 8px;text-align:left;">Item</th><th style="padding:4px 8px;text-align:left;">Description</th><th style="padding:4px 8px;text-align:right;">Qty</th></tr>
          ${items}
        </table>`;
    }).join("");

    // Build beverage HTML
    let bevHtml = "";
    if (bevPackage) {
      const bp = bevPackage as any;
      const categories = (bp.includes || []).map((cat: any) =>
        `<li><strong>${cat.category}:</strong> ${(cat.items || []).join(", ") || "Standard selection"}</li>`
      ).join("");
      bevHtml = `
        <h3 style="color:#1B2A4A;margin:16px 0 4px;font-size:14px;border-bottom:2px solid #C9A96E;padding-bottom:4px;">
          Beverage Service — ${bp.name} (${bp.duration_hours}h)
        </h3>
        <ul style="font-size:13px;color:#333;">${categories}</ul>`;
    }

    // Build full BEO
    const beoHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #2D2D2D; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <div style="max-width:800px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1B2A4A;padding-bottom:12px;margin-bottom:20px;">
      <div>
        <h1 style="margin:0;color:#1B2A4A;font-size:24px;">${orgName}</h1>
        <h2 style="margin:4px 0 0;color:#C9A96E;font-size:16px;">BANQUET EVENT ORDER</h2>
      </div>
      <div style="text-align:right;font-size:12px;color:#666;">
        <p style="margin:0;">Generated: ${new Date().toLocaleDateString("en-AU")}</p>
        <p style="margin:2px 0 0;">BEO #${functionId.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>

    <!-- Event Details -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
      <tr>
        <td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;width:25%;">Client</td>
        <td style="padding:6px 12px;border:1px solid #ddd;">${clientName}${(client as any)?.company_name ? ` — ${(client as any).company_name}` : ""}</td>
        <td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;width:25%;">Event Date</td>
        <td style="padding:6px 12px;border:1px solid #ddd;">${f.event_date || "TBC"}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;">Event Type</td>
        <td style="padding:6px 12px;border:1px solid #ddd;">${f.event_type || f.event_name || "Function"}</td>
        <td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;">Party Size</td>
        <td style="padding:6px 12px;border:1px solid #ddd;">${partySize} guests</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;">Room</td>
        <td style="padding:6px 12px;border:1px solid #ddd;">${spaceName}</td>
        <td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;">Time</td>
        <td style="padding:6px 12px;border:1px solid #ddd;">${f.start_time || "18:00"} — ${f.end_time || "23:00"}</td>
      </tr>
      ${f.setup_time ? `<tr><td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;">Setup</td><td style="padding:6px 12px;border:1px solid #ddd;">${f.setup_time}</td><td style="padding:6px 12px;background:#1B2A4A;color:#C9A96E;font-weight:bold;">Pack Down</td><td style="padding:6px 12px;border:1px solid #ddd;">${f.pack_down_time || ""}</td></tr>` : ""}
    </table>

    <!-- Menu -->
    <h2 style="color:#1B2A4A;font-size:16px;margin:24px 0 8px;">MENU</h2>
    ${menuHtml || "<p style='color:#999;font-size:13px;'>No menu configured. Attach a proposal with menu sections.</p>"}

    <!-- Beverages -->
    ${bevHtml}

    <!-- Special Requirements -->
    ${f.av_requirements || f.floral_requirements || f.special_instructions ? `
    <h2 style="color:#1B2A4A;font-size:16px;margin:24px 0 8px;">SPECIAL REQUIREMENTS</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${f.av_requirements ? `<tr><td style="padding:4px 8px;font-weight:bold;width:30%;border-bottom:1px solid #eee;">AV / Technical</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">${f.av_requirements}</td></tr>` : ""}
      ${f.floral_requirements ? `<tr><td style="padding:4px 8px;font-weight:bold;width:30%;border-bottom:1px solid #eee;">Floral</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">${f.floral_requirements}</td></tr>` : ""}
      ${f.special_instructions ? `<tr><td style="padding:4px 8px;font-weight:bold;width:30%;border-bottom:1px solid #eee;">Special Instructions</td><td style="padding:4px 8px;border-bottom:1px solid #eee;">${f.special_instructions}</td></tr>` : ""}
    </table>` : ""}

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:12px;border-top:2px solid #1B2A4A;font-size:11px;color:#999;text-align:center;">
      <p>This BEO was generated by VenueFlow. Please verify all details with the events manager.</p>
    </div>
  </div>
</body>
</html>`;

    // Mark function as BEO generated
    await supabase
      .from("res_functions")
      .update({ beo_generated: true } as any)
      .eq("id", functionId);

    return new Response(
      JSON.stringify({ success: true, beoHtml }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
