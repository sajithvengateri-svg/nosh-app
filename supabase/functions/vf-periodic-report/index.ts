import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * VenueFlow Periodic Report Generator
 *
 * Cron-triggered (daily at 7am AEST):
 * 1. Checks vf_report_preferences for enabled reports
 * 2. Generates HTML report content based on type
 * 3. Sends via Resend
 *
 * Report types:
 * - DAILY_SUMMARY: today's events, inquiries, follow-ups
 * - WEEKLY_DIGEST: pipeline summary, conversions (Mondays only)
 * - MONTHLY_ANALYTICS: full analytics (1st of month only)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
    const dayOfMonth = now.getDate();

    // Determine which report types to send today
    const reportTypes: string[] = ["DAILY_SUMMARY"];
    if (dayOfWeek === 1) reportTypes.push("WEEKLY_DIGEST");
    if (dayOfMonth === 1) reportTypes.push("MONTHLY_ANALYTICS");

    // Get all enabled preferences for today's report types
    const { data: prefs, error: prefErr } = await supabase
      .from("vf_report_preferences")
      .select("*, user:auth.users(email)")
      .eq("is_enabled", true)
      .in("report_type", reportTypes);

    if (prefErr) throw prefErr;
    if (!prefs || prefs.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No enabled reports for today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;

    for (const pref of prefs) {
      try {
        const p = pref as any;
        const orgId = p.org_id;
        const email = p.delivery_email || p.user?.email;
        if (!email) continue;

        // Get org name
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .single();
        const orgName = (org as any)?.name || "Your Venue";

        let subject = "";
        let htmlContent = "";
        const today = now.toISOString().split("T")[0];

        if (p.report_type === "DAILY_SUMMARY") {
          subject = `${orgName} — Daily Summary`;

          // Get today's events
          const { data: events } = await supabase
            .from("res_functions")
            .select("*, client:res_function_clients(contact_name)")
            .eq("org_id", orgId)
            .eq("event_date", today);

          // Get new inquiries today
          const { count: inquiryCount } = await supabase
            .from("res_function_clients")
            .select("*", { count: "exact", head: true })
            .eq("org_id", orgId)
            .eq("pipeline_stage", "INQUIRY")
            .gte("created_at", `${today}T00:00:00`);

          // Get overdue follow-ups
          const { count: overdueCount } = await supabase
            .from("res_function_clients")
            .select("*", { count: "exact", head: true })
            .eq("org_id", orgId)
            .not("next_follow_up", "is", null)
            .lt("next_follow_up", now.toISOString());

          const eventList = (events || []).map((e: any) =>
            `<li style="padding:4px 0;">${e.client?.contact_name || "Client"} — ${e.event_name || e.event_type || "Event"} (${e.party_size || "?"} guests)</li>`
          ).join("");

          htmlContent = `
            <h3 style="color:#1B2A4A;margin:0 0 12px;">Today at a Glance</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <tr>
                <td style="padding:8px 12px;background:#1B2A4A;color:#C9A96E;border-radius:4px 0 0 4px;text-align:center;width:33%;">
                  <strong style="font-size:24px;">${(events || []).length}</strong><br><span style="font-size:11px;">Events Today</span>
                </td>
                <td style="padding:8px 12px;background:#7A8B6F;color:#fff;text-align:center;width:33%;">
                  <strong style="font-size:24px;">${inquiryCount || 0}</strong><br><span style="font-size:11px;">New Inquiries</span>
                </td>
                <td style="padding:8px 12px;background:#C17C74;color:#fff;border-radius:0 4px 4px 0;text-align:center;width:33%;">
                  <strong style="font-size:24px;">${overdueCount || 0}</strong><br><span style="font-size:11px;">Overdue Follow-ups</span>
                </td>
              </tr>
            </table>
            ${(events || []).length > 0 ? `<h4 style="color:#2D2D2D;margin:0 0 8px;">Today's Events</h4><ul style="margin:0;padding:0 0 0 20px;">${eventList}</ul>` : "<p style='color:#999;'>No events scheduled today.</p>"}
          `;
        } else if (p.report_type === "WEEKLY_DIGEST") {
          subject = `${orgName} — Weekly Digest`;

          const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

          // Pipeline counts
          const { data: clients } = await supabase
            .from("res_function_clients")
            .select("pipeline_stage")
            .eq("org_id", orgId)
            .is("archived_at", null);

          const stageCounts: Record<string, number> = {};
          (clients || []).forEach((c: any) => {
            stageCounts[c.pipeline_stage] = (stageCounts[c.pipeline_stage] || 0) + 1;
          });

          // New clients this week
          const { count: newCount } = await supabase
            .from("res_function_clients")
            .select("*", { count: "exact", head: true })
            .eq("org_id", orgId)
            .gte("created_at", weekAgo);

          const stageRows = Object.entries(stageCounts)
            .map(([stage, count]) =>
              `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${stage.replace(/_/g, " ")}</td><td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">${count}</td></tr>`
            ).join("");

          htmlContent = `
            <h3 style="color:#1B2A4A;margin:0 0 12px;">Pipeline This Week</h3>
            <p style="color:#666;font-size:13px;">New inquiries this week: <strong>${newCount || 0}</strong></p>
            <table style="width:100%;border-collapse:collapse;margin:12px 0;">
              <tr style="background:#1B2A4A;color:#C9A96E;">
                <th style="padding:6px 8px;text-align:left;font-size:12px;">Stage</th>
                <th style="padding:6px 8px;text-align:right;font-size:12px;">Count</th>
              </tr>
              ${stageRows}
            </table>
          `;
        } else if (p.report_type === "MONTHLY_ANALYTICS") {
          subject = `${orgName} — Monthly Analytics`;

          // Revenue this month
          const { data: functions } = await supabase
            .from("res_functions")
            .select("quoted_total, status")
            .eq("org_id", orgId)
            .gte("event_date", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);

          const totalRevenue = (functions || []).reduce((sum: number, f: any) => sum + (Number(f.quoted_total) || 0), 0);
          const confirmedRevenue = (functions || [])
            .filter((f: any) => ["CONFIRMED", "COMPLETED"].includes(f.status))
            .reduce((sum: number, f: any) => sum + (Number(f.quoted_total) || 0), 0);

          // Referrals
          const { count: referralCount } = await supabase
            .from("vf_referrals")
            .select("*", { count: "exact", head: true })
            .eq("org_id", orgId);

          htmlContent = `
            <h3 style="color:#1B2A4A;margin:0 0 12px;">Monthly Overview</h3>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <tr>
                <td style="padding:12px;background:#C9A96E;color:#1B2A4A;border-radius:4px 0 0 4px;text-align:center;width:33%;">
                  <strong style="font-size:22px;">$${totalRevenue.toLocaleString()}</strong><br><span style="font-size:11px;">Pipeline Value</span>
                </td>
                <td style="padding:12px;background:#7A8B6F;color:#fff;text-align:center;width:33%;">
                  <strong style="font-size:22px;">$${confirmedRevenue.toLocaleString()}</strong><br><span style="font-size:11px;">Confirmed Revenue</span>
                </td>
                <td style="padding:12px;background:#1B2A4A;color:#C9A96E;border-radius:0 4px 4px 0;text-align:center;width:33%;">
                  <strong style="font-size:22px;">${referralCount || 0}</strong><br><span style="font-size:11px;">Referrals</span>
                </td>
              </tr>
            </table>
          `;
        }

        // Send email
        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Georgia,serif;background:#FAF7F2;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:#1B2A4A;padding:24px 32px;">
      <h1 style="margin:0;color:#C9A96E;font-size:22px;">${orgName}</h1>
    </div>
    <div style="padding:28px 32px;">${htmlContent}</div>
    <div style="padding:16px 32px;background:#FAF7F2;text-align:center;">
      <p style="margin:0;font-size:11px;color:#999;">Powered by VenueFlow · Manage reports in Settings</p>
    </div>
  </div>
</body>
</html>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${orgName} Reports <reports@venueflow.app>`,
            to: [email],
            subject,
            html: emailHtml,
          }),
        });

        sent++;
      } catch (e) {
        console.error(`Failed to send report for pref ${(pref as any).id}:`, (e as Error).message);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: prefs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
