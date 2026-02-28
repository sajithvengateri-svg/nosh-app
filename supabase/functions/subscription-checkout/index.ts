import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Subscription Checkout
 *
 * Creates a Stripe Checkout Session for subscription upgrades.
 * Supports monthly/yearly billing and optional AI add-on.
 *
 * POST /subscription-checkout
 * Body: { orgId, planId, billingPeriod, includeAiAddon?, returnUrl }
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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      orgId,
      planId,
      billingPeriod = "monthly",
      includeAiAddon = false,
      returnUrl,
    } = await req.json();

    if (!orgId || !planId || !returnUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: orgId, planId, returnUrl",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify user belongs to the organization
    const { data: membership } = await serviceClient
      .from("employee_profiles")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (!membership) {
      // Also check if user is the org owner
      const { data: ownedOrg } = await serviceClient
        .from("organizations")
        .select("id")
        .eq("id", orgId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!ownedOrg) {
        return new Response(
          JSON.stringify({ error: "You do not have access to this organization" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Fetch the subscription plan
    const { data: plan, error: planError } = await serviceClient
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const priceId = billingPeriod === "yearly"
      ? (plan as any).stripe_price_id_yearly
      : (plan as any).stripe_price_id_monthly;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Stripe price not configured for this plan" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch org for existing Stripe customer
    const { data: org } = await serviceClient
      .from("organizations")
      .select("stripe_customer_id, name, subscription_tier")
      .eq("id", orgId)
      .single();

    // Import Stripe
    const Stripe = (await import("https://esm.sh/stripe@16?target=deno"))
      .default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

    // Build line items
    const lineItems: any[] = [{ price: priceId, quantity: 1 }];

    // Optionally add AI add-on (uses dedicated text columns for Stripe price IDs)
    if (includeAiAddon) {
      const addonPriceId = billingPeriod === "yearly"
        ? (plan as any).ai_addon_stripe_price_yearly
        : (plan as any).ai_addon_stripe_price_monthly;
      if (addonPriceId) {
        lineItems.push({ price: addonPriceId, quantity: 1 });
      }
    }

    const sessionParams: Record<string, any> = {
      mode: "subscription",
      line_items: lineItems,
      success_url: `${returnUrl}?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?upgrade=cancelled`,
      metadata: {
        org_id: orgId,
        plan_id: planId,
        billing_period: billingPeriod,
        include_ai_addon: includeAiAddon ? "true" : "false",
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
          plan_id: planId,
        },
      },
    };

    // Reuse existing Stripe customer if available
    if ((org as any)?.stripe_customer_id) {
      sessionParams.customer = (org as any).stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email;
    }

    // Add trial if plan has trial days
    if ((plan as any).trial_days > 0) {
      sessionParams.subscription_data.trial_period_days = (plan as any).trial_days;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Log the checkout event
    await serviceClient
      .from("org_subscription_events")
      .insert({
        org_id: orgId,
        event_type: "checkout_started",
        from_tier: (org as any)?.subscription_tier ?? "free",
        to_tier: (plan as any).tier,
        metadata: {
          session_id: session.id,
          plan_id: planId,
          billing_period: billingPeriod,
          include_ai_addon: includeAiAddon,
        },
        actor_id: user.id,
      } as any);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
