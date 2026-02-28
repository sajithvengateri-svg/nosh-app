import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * VenueFlow Stripe Checkout
 *
 * Creates a Stripe Checkout Session for proposal deposit payments.
 *
 * POST /vf-stripe-checkout
 * Body: { proposalId, depositAmount, currency, orgName, clientEmail?, returnUrl }
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

    const {
      proposalId,
      depositAmount,
      currency = "aud",
      orgName = "Venue",
      clientEmail,
      returnUrl,
    } = await req.json();

    if (!proposalId || !depositAmount || !returnUrl) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: proposalId, depositAmount, returnUrl",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Import Stripe
    const Stripe = (await import("https://esm.sh/stripe@16?target=deno"))
      .default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-04-10",
    });

    // Build session params
    const sessionParams: Record<string, any> = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `${orgName} – Event Deposit`,
              description: `Deposit for proposal ${proposalId}`,
            },
            unit_amount: Math.round(depositAmount * 100), // cents
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?payment=success`,
      cancel_url: `${returnUrl}?payment=cancelled`,
      metadata: {
        proposal_id: proposalId,
      },
    };

    if (clientEmail) {
      sessionParams.customer_email = clientEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Store session ID on proposal
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await serviceClient
      .from("res_function_proposals")
      .update({ stripe_checkout_session_id: session.id } as any)
      .eq("id", proposalId);

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
