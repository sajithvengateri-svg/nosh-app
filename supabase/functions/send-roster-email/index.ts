import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShiftData {
  employee_name: string;
  employee_email: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  section: string;
}

interface RosterEmailRequest {
  org_id?: string;
  org_name: string;
  period_label: string;
  all_shifts: ShiftData[];
  recipients: { email: string; name: string; user_id: string }[];
  force_send?: boolean; // Emergency override
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m ? `${hour}:${String(m).padStart(2, "0")}${ampm}` : `${hour}${ampm}`;
}

function buildPersonalHtml(name: string, shifts: ShiftData[], periodLabel: string, orgName: string): string {
  const rows = shifts
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const d = new Date(s.date);
      const day = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${day}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${formatTime(s.start_time)} – ${formatTime(s.end_time)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.break_minutes}m</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${s.section || "—"}</td>
      </tr>`;
    })
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#333;">📋 Your Roster — ${periodLabel}</h2>
      <p>Hi ${name},</p>
      <p>Here are your shifts for the upcoming period:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="text-align:left;padding:8px 10px;">Day</th>
            <th style="text-align:left;padding:8px 10px;">Time</th>
            <th style="text-align:left;padding:8px 10px;">Break</th>
            <th style="text-align:left;padding:8px 10px;">Section</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="4" style="padding:10px;color:#999;">No shifts this period.</td></tr>'}</tbody>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#666;">— ${orgName} Roster System</p>
    </div>
  `;
}

function isWithinWindow(windowStart: string, windowEnd: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = windowStart.split(":").map(Number);
  const [eh, em] = windowEnd.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  return currentMinutes >= startMins && currentMinutes <= endMins;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;


  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body: RosterEmailRequest = await req.json();
    const { org_id, org_name, period_label, all_shifts, recipients, force_send } = body;

    // Check communication rules (Right to Disconnect)
    let queued = 0;
    let sendNow = force_send || false;

    if (org_id && !force_send) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);

      const { data: commRules } = await sb
        .from("communication_rules")
        .select("*")
        .eq("org_id", org_id)
        .eq("message_type", "ROSTER_PUBLISH")
        .eq("respect_rtd", true);

      if (commRules?.length) {
        const rule = commRules[0];
        if (!isWithinWindow(rule.allowed_window_start, rule.allowed_window_end)) {
          // Outside allowed window — queue instead of sending
          return new Response(JSON.stringify({
            queued: true,
            message: `Messages queued. Outside allowed window (${rule.allowed_window_start} — ${rule.allowed_window_end}). Use force_send for emergencies.`,
            affected_recipients: recipients.length,
            next_window: rule.allowed_window_start,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const recipient of recipients) {
      const personalShifts = all_shifts.filter(
        (s) => s.employee_email === recipient.email
      );

      const html = buildPersonalHtml(
        recipient.name,
        personalShifts,
        period_label,
        org_name
      );

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${org_name} Roster <roster@chefos.com.au>`,
            to: [recipient.email],
            subject: `📋 Your Roster — ${period_label}`,
            html,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          results.push({ email: recipient.email, success: false, error: errText });
        } else {
          results.push({ email: recipient.email, success: true });
        }
      } catch (e) {
        results.push({
          email: recipient.email,
          success: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
