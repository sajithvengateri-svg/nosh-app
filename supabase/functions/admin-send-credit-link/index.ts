import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Admin Send Credit Link
 *
 * Creates a Stripe Payment Link for an org to purchase extra AI tokens.
 * Only callable by admins (user_roles.role = 'admin').
 *
 * POST /admin-send-credit-link
 * Body: { orgId, tokenBundle, recipientEmail? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify admin role
    const { data: role } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { orgId, tokenBundle, recipientEmail } = await req.json();

    if (!orgId || !tokenBundle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: orgId, tokenBundle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up the credit rate for this bundle
    const { data: rate } = await db
      .from("ai_credit_rate")
      .select("id, tokens_per_unit, price_per_unit, currency")
      .eq("tokens_per_unit", tokenBundle)
      .eq("is_active", true)
      .maybeSingle();

    if (!rate) {
      return new Response(
        JSON.stringify({ error: "Invalid token bundle size" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch org details
    const { data: org } = await db
      .from("organizations")
      .select("id, name, stripe_customer_id, owner_id")
      .eq("id", orgId)
      .single();

    if (!org) {
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get recipient email (fallback to org owner email)
    let email = recipientEmail;
    if (!email) {
      const { data: owner } = await db.auth.admin.getUserById((org as any).owner_id);
      email = owner?.user?.email;
    }

    // Insert pending credit purchase
    const { data: purchase, error: purchaseError } = await db
      .from("ai_credit_purchases")
      .insert({
        org_id: orgId,
        tokens_purchased: rate.tokens_per_unit,
        amount_usd: rate.price_per_unit,
        currency: rate.currency ?? "usd",
        status: "pending",
        billing_month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        created_by: user.id,
      })
      .select("id")
      .single();

    if (purchaseError || !purchase) {
      return new Response(
        JSON.stringify({ error: "Failed to create credit purchase record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create Stripe Checkout Session in payment mode
    const Stripe = (await import("https://esm.sh/stripe@16?target=deno")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

    const amountCents = Math.round(rate.price_per_unit * 100);

    const sessionParams: Record<string, any> = {
      mode: "payment",
      line_items: [{
        price_data: {
          currency: rate.currency ?? "usd",
          product_data: {
            name: `AI Token Credits — ${(rate.tokens_per_unit / 1000).toFixed(0)}K tokens`,
            description: `Extra AI tokens for ${(org as any).name}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/functions/v1/subscription-webhook?credit_success=true`,
      cancel_url: `${supabaseUrl}/functions/v1/subscription-webhook?credit_cancelled=true`,
      metadata: {
        type: "ai_credit",
        org_id: orgId,
        credit_purchase_id: purchase.id,
        tokens: String(rate.tokens_per_unit),
      },
    };

    if ((org as any).stripe_customer_id) {
      sessionParams.customer = (org as any).stripe_customer_id;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update purchase with Stripe session ID
    await db
      .from("ai_credit_purchases")
      .update({ stripe_payment_id: session.id })
      .eq("id", purchase.id);

    return new Response(
      JSON.stringify({
        payment_url: session.url,
        credit_purchase_id: purchase.id,
        recipient_email: email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("admin-send-credit-link error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
