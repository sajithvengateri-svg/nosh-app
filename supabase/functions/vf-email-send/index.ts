import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * VenueFlow Email Send
 *
 * Sends branded emails for VenueFlow:
 * - Proposal share emails
 * - Deposit reminders
 * - Follow-up nudges
 * - Custom one-off emails from CRM
 *
 * POST /vf-email-send
 * Body: { to, subject, body, orgId, type, clientId?, proposalShareUrl? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
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

    const { to, subject, body, orgId, type, clientId, proposalShareUrl } = await req.json();

    if (!to || !subject || !orgId) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, orgId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get org info for branding
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: org } = await serviceClient
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .single();

    const orgName = (org as any)?.name || "VenueFlow";

    // Build HTML email with VenueFlow branding
    let ctaHtml = "";
    if (proposalShareUrl) {
      ctaHtml = `
        <div style="text-align:center;margin:24px 0;">
          <a href="${proposalShareUrl}" style="display:inline-block;background:#C9A96E;color:#1B2A4A;font-weight:bold;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:15px;">
            View Your Proposal
          </a>
        </div>`;
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background:#FAF7F2;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#1B2A4A;padding:28px 32px;">
      <h1 style="margin:0;color:#C9A96E;font-size:24px;font-family:Georgia,serif;letter-spacing:0.5px;">${orgName}</h1>
    </div>
    <div style="padding:32px;color:#2D2D2D;font-size:15px;line-height:1.7;">
      ${(body || "").replace(/\n/g, "<br>")}
      ${ctaHtml}
    </div>
    <div style="border-top:1px solid #E8E3DC;padding:20px 32px;background:#FAF7F2;text-align:center;">
      <p style="margin:0;font-size:11px;color:#999;">Powered by VenueFlow</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email service not configured (RESEND_API_KEY missing)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${orgName} <noreply@venueflow.app>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: emailHtml,
      }),
    });

    const resBody = await res.json();
    if (!res.ok) {
      throw new Error(resBody.message || "Resend API error");
    }

    // Log activity if clientId provided
    if (clientId) {
      await serviceClient.from("vf_pipeline_activities").insert({
        org_id: orgId,
        client_id: clientId,
        activity_type: "EMAIL",
        subject,
        body: body?.substring(0, 500),
        metadata: { type, email_id: resBody.id },
        created_by: user.id,
      } as any);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resBody.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
