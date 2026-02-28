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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { type, employee_name, employee_email, org_name, section, start_date, documents } = await req.json();

    if (!employee_email) throw new Error("employee_email required");

    let subject: string;
    let html: string;

    if (type === "document_pack") {
      subject = `📄 Document Pack — ${org_name || "Your Employer"}`;
      html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2>Hi ${employee_name || "there"} 👋</h2>
          <p>Please complete and return the following documents before your start date:</p>
          <ul>
            <li>✅ TFN Declaration</li>
            <li>✅ Superannuation Choice Form</li>
            <li>✅ Employment Contract</li>
            <li>✅ Fair Work Information Statement</li>
            <li>✅ Photo ID (passport, licence, or proof of age card)</li>
          </ul>
          <p>You can bring physical copies on your first day or reply to this email with scanned versions.</p>
          <p style="margin-top:24px;color:#666;">— ${org_name || "Management"}</p>
        </div>
      `;
    } else {
      subject = `🎉 Welcome to ${org_name || "the team"}!`;
      html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2>Welcome aboard, ${employee_name || "team member"}! 🎉</h2>
          <p>We're excited to have you join <strong>${org_name || "our team"}</strong>${section ? ` in the <strong>${section}</strong> section` : ""}.</p>
          ${start_date ? `<p>📅 <strong>Start Date:</strong> ${start_date}</p>` : ""}
          <h3>What to bring on your first day:</h3>
          <ul>
            <li>📋 Photo ID (passport, licence, or proof of age)</li>
            <li>📋 TFN Declaration (if not already submitted)</li>
            <li>📋 Super Choice Form</li>
            <li>📋 Bank account details (BSB + account number)</li>
          </ul>
          <h3>What we'll provide:</h3>
          <ul>
            <li>👕 Uniform (aprons, jackets as applicable)</li>
            <li>🔑 Access credentials and locker</li>
            <li>📖 Induction and training schedule</li>
          </ul>
          <p>If you have any questions before your start date, just reply to this email.</p>
          <p style="margin-top:24px;color:#666;">— ${org_name || "Management"}</p>
        </div>
      `;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${org_name || "ChefOS"} <noreply@chefos.com.au>`,
        to: [employee_email],
        subject,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Resend API error");

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-onboarding-email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
