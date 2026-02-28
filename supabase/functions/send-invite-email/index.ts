import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    // Auth check
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;


  try {
    const { inviteId, email, inviterName, orgName, role, portal, orgId, token } = await req.json();

    const appUrl = Deno.env.get("APP_URL") || "https://chefos.ai";

    // Determine portal-specific branding
    const isBar = portal === "bev";
    const brandName = isBar ? "BevOS" : "ChefOS";
    const roleLabel = isBar
      ? { bar_manager: "Bar Manager", asst_bar_manager: "Asst Bar Manager", senior_bartender: "Senior Bartender", bartender: "Bartender", bar_back: "Bar-back", barista: "Barista" }[role] || role
      : { head_chef: "Head Chef", line_chef: "Line Chef", owner: "Owner", sous_chef: "Sous Chef", kitchen_hand: "Kitchen Hand" }[role] || role;
    const emoji = isBar ? "🍸" : "👨‍🍳";

    // Use personalised join link if token provided, otherwise fallback to /auth
    const signupUrl = token ? `${appUrl}/join/${token}` : `${appUrl}/auth`;
    const subject = `${inviterName || "Your manager"} invited you to ${orgName || brandName} ${emoji}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">${emoji} You're invited to ${brandName}</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 24px;">
          <strong>${inviterName || "Your manager"}</strong> has invited you to join
          <strong>${orgName || "their team"}</strong> as <strong>${roleLabel}</strong>.
        </p>
        <a href="${signupUrl}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Accept &amp; Create Account
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px;">
          Sign up with <strong>${email}</strong> to automatically join the team.
          This invite expires in 7 days.
        </p>
      </div>
    `;

    const textBody = `${emoji} You're invited to ${brandName}\n\n${inviterName || "Your manager"} has invited you to join ${orgName || "their team"} as ${roleLabel}.\n\nSign up at: ${signupUrl}\n\nUse ${email} to automatically join the team. This invite expires in 7 days.`;

    // Look up org email settings if orgId provided
    let emailSettings = null;
    if (orgId) {
      try {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const { data } = await supabaseAdmin
          .from("org_email_settings")
          .select("*")
          .eq("org_id", orgId)
          .maybeSingle();
        emailSettings = data;
      } catch (e) {
        console.error("Failed to fetch org email settings:", e);
      }
    }

    // --- SMTP path ---
    if (emailSettings?.provider === "smtp" && emailSettings.smtp_host && emailSettings.smtp_user && emailSettings.smtp_pass_encrypted) {
      try {
        const client = new SMTPClient({
          connection: {
            hostname: emailSettings.smtp_host,
            port: emailSettings.smtp_port || 587,
            tls: true,
            auth: {
              username: emailSettings.smtp_user,
              password: emailSettings.smtp_pass_encrypted,
            },
          },
        });
        await client.send({
          from: `${emailSettings.from_name || brandName} <${emailSettings.from_email || emailSettings.smtp_user}>`,
          to: email,
          subject,
          content: textBody,
          html: htmlBody,
        });
        await client.close();
        console.log("Invite email sent via SMTP to:", email);
        return new Response(
          JSON.stringify({ success: true, email_sent: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (smtpErr) {
        console.error("SMTP error:", smtpErr);
        return new Response(
          JSON.stringify({ success: false, email_sent: false, reason: "smtp_error" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // --- Resend path (default) ---
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, email_sent: false, reason: "not_configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fromName = emailSettings?.from_name || brandName;
    const fromEmail = emailSettings?.from_email || "noreply@chefos.com.au";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend error:", resendResponse.status, errorText);
      const reason = resendResponse.status === 403 ? "domain_not_verified" : "resend_error";
      return new Response(
        JSON.stringify({ success: false, email_sent: false, reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = await resendResponse.json();
    console.log("Invite email sent via Resend:", result);

    return new Response(
      JSON.stringify({ success: true, email_sent: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ success: false, email_sent: false, reason: "unexpected_error", error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
