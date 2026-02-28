import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map signup source → email template slug
const SOURCE_TEMPLATE_MAP: Record<string, string> = {
  chefos: "welcome-chef",
  home_cook: "welcome-home-cook",
  vendor: "welcome-vendor",
  food_safety: "welcome-food-safety",
  india_chefos: "welcome-india-chefos",
  gcc_chefos: "welcome-gcc-chefos",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, email, chefName, name, orgName, referralCode, signupSource } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Resolve template slug from signup source
    const templateSlug = SOURCE_TEMPLATE_MAP[signupSource || ""] || "welcome-chef";

    // Fetch the welcome template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("slug", templateSlug)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      throw new Error(`Email template '${templateSlug}' not found or inactive`);
    }

    const appUrl = Deno.env.get("APP_URL") || "https://chefos.ai";
    const recipientName = name || chefName || "Chef";

    // Replace variables (support both {{chef_name}} and {{name}})
    const replacements: Record<string, string> = {
      "{{chef_name}}": recipientName,
      "{{name}}": recipientName,
      "{{org_name}}": orgName || "Your Kitchen",
      "{{business_name}}": orgName || "Your Business",
      "{{app_url}}": appUrl,
      "{{referral_code}}": referralCode || "",
    };

    let htmlBody = template.body_html;
    let textBody = template.body_text;
    let subject = template.subject;

    for (const [key, value] of Object.entries(replacements)) {
      htmlBody = htmlBody.replaceAll(key, value);
      textBody = textBody.replaceAll(key, value);
      subject = subject.replaceAll(key, value);
    }

    // Log the attempt
    const { data: logEntry } = await supabase.from("email_send_log").insert({
      template_slug: templateSlug,
      recipient_email: email,
      recipient_user_id: userId,
      variables: replacements,
      status: "pending",
    }).select().single();

    if (!resendApiKey) {
      // No Resend key — log but don't fail
      await supabase.from("email_send_log")
        .update({ status: "skipped", error_message: "RESEND_API_KEY not configured" })
        .eq("id", logEntry?.id);

      await supabase.from("signup_events")
        .update({ welcome_email_sent: false })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true, skipped: true, message: "No email provider configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email payload
    const emailPayload: Record<string, unknown> = {
      from: "ChefOS <hello@chefos.com.au>",
      to: [email],
      subject,
      html: htmlBody,
      text: textBody,
    };

    // Add attachments if template has them
    const attachments = template.attachments;
    if (Array.isArray(attachments) && attachments.length > 0) {
      emailPayload.attachments = attachments.map((a: { name: string; url: string }) => ({
        filename: a.name.replaceAll("{{app_url}}", appUrl),
        path: a.url.replaceAll("{{app_url}}", appUrl),
      }));
    }

    // Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      await supabase.from("email_send_log")
        .update({ status: "failed", error_message: errorText })
        .eq("id", logEntry?.id);
      throw new Error(`Resend API error: ${errorText}`);
    }

    // Success — update log and signup event
    await supabase.from("email_send_log")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", logEntry?.id);

    await supabase.from("signup_events")
      .update({ welcome_email_sent: true })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({ success: true, template: templateSlug }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
