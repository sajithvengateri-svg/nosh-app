import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // In production, verify webhook signature here
    // For now, parse the event directly
    const event = JSON.parse(body);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id ?? session.client_reference_id;
        if (!userId) break;

        await supabase.from("ds_subscriptions").upsert({
          user_id: userId,
          plan: "nosh_plus",
          status: session.subscription ? "trial" : "active",
          stripe_subscription_id: session.subscription,
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        }, { onConflict: "user_id" });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase
          .from("ds_subscriptions")
          .update({
            status: sub.cancel_at_period_end ? "cancelled" : "active",
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabase
          .from("ds_subscriptions")
          .update({ status: "expired" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
