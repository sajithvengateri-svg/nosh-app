import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * VenueFlow Automation Processor
 *
 * Processes the vf_automation_queue:
 * 1. Finds PENDING items where scheduled_for <= now
 * 2. Loads the automation config (email/sms templates)
 * 3. Sends via vf-email-send edge function or Twilio
 * 4. Updates queue status to SENT or FAILED
 *
 * Trigger: Supabase cron job every 15 minutes
 * POST /vf-automation-processor
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find pending queue items ready to process
    const { data: pending, error: qErr } = await supabase
      .from("vf_automation_queue")
      .select(`
        *,
        automation:vf_automations(*),
        client:res_function_clients(id, contact_name, email, company_name),
        function:res_functions(id, event_name, event_date)
      `)
      .eq("status", "PENDING")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    if (qErr) throw qErr;
    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending items" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const automation = (item as any).automation;
        const client = (item as any).client;
        const func = (item as any).function;

        if (!automation || !client?.email) {
          // Mark as failed — no automation config or no email
          await supabase
            .from("vf_automation_queue")
            .update({ status: "FAILED", error_message: "Missing automation config or client email" } as any)
            .eq("id", item.id);
          failed++;
          continue;
        }

        // Check do_not_contact flag
        if (client.do_not_contact) {
          await supabase
            .from("vf_automation_queue")
            .update({ status: "CANCELLED" } as any)
            .eq("id", item.id);
          continue;
        }

        // Build email content from templates
        const subject = (automation.email_subject || `Update from your venue`)
          .replace("{{client_name}}", client.contact_name || "")
          .replace("{{event_name}}", func?.event_name || "your event")
          .replace("{{event_date}}", func?.event_date || "");

        const body = (automation.email_body || "")
          .replace("{{client_name}}", client.contact_name || "")
          .replace("{{event_name}}", func?.event_name || "your event")
          .replace("{{event_date}}", func?.event_date || "")
          .replace("{{company_name}}", client.company_name || "");

        // Get org info for branding
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", item.org_id)
          .single();

        const orgName = (org as any)?.name || "VenueFlow";

        // Send email via Resend
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#FAF7F2;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:#1B2A4A;padding:24px 32px;">
      <h1 style="margin:0;color:#C9A96E;font-size:22px;font-family:Georgia,serif;">${orgName}</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#2D2D2D;font-size:15px;line-height:1.6;">${body.replace(/\n/g, "<br>")}</p>
    </div>
    <div style="padding:16px 32px;background:#FAF7F2;text-align:center;">
      <p style="margin:0;font-size:11px;color:#999;">Sent via VenueFlow</p>
    </div>
  </div>
</body>
</html>`;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${orgName} <noreply@venueflow.app>`,
              to: [client.email],
              subject,
              html: emailHtml,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Email send failed");
          }
        }

        // Mark as sent
        await supabase
          .from("vf_automation_queue")
          .update({ status: "SENT", sent_at: new Date().toISOString() } as any)
          .eq("id", item.id);

        // Log activity
        await supabase.from("vf_pipeline_activities").insert({
          org_id: item.org_id,
          client_id: client.id,
          function_id: func?.id || null,
          activity_type: "SYSTEM_AUTO",
          subject: `Automation: ${automation.trigger_type}`,
          body: subject,
          metadata: { automation_id: automation.id, queue_id: item.id },
        } as any);

        sent++;
      } catch (e) {
        // Mark individual item as failed
        await supabase
          .from("vf_automation_queue")
          .update({ status: "FAILED", error_message: (e as Error).message } as any)
          .eq("id", item.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: pending.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
