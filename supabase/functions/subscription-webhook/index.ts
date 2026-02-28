import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Subscription Webhook
 *
 * Handles Stripe webhook events for subscription lifecycle:
 * - checkout.session.completed → activate subscription
 * - customer.subscription.updated → tier changes
 * - customer.subscription.deleted → downgrade to free
 * - invoice.payment_failed → log failure
 */
Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      return new Response("Stripe not configured", { status: 400 });
    }

    const Stripe = (await import("https://esm.sh/stripe@16?target=deno"))
      .default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

    // Verify webhook signature
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response("Missing signature", { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const db = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency check — skip already-processed events
    const { data: existingEvent } = await db
      .from("org_subscription_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ received: true, skipped: "already_processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // ── AI Credit Purchase ──
        if (session.metadata?.type === "ai_credit") {
          const creditOrgId = session.metadata.org_id;
          const creditPurchaseId = session.metadata.credit_purchase_id;

          if (creditOrgId && creditPurchaseId) {
            // Mark credit as paid
            await db
              .from("ai_credit_purchases")
              .update({
                status: "paid",
                paid_at: new Date().toISOString(),
                stripe_payment_id: session.id,
              })
              .eq("id", creditPurchaseId);

            // Log revenue
            const tokens = parseInt(session.metadata.tokens || "0");
            if (session.amount_total) {
              await db.from("revenue_log").insert({
                org_id: creditOrgId,
                revenue_type: "ai_credit",
                amount_usd: session.amount_total / 100,
                currency: session.currency ?? "usd",
                original_amount: session.amount_total / 100,
                stripe_event_id: event.id,
                metadata: {
                  credit_purchase_id: creditPurchaseId,
                  tokens_purchased: tokens,
                  session_id: session.id,
                },
              });
            }
          }
          break;
        }

        // ── Subscription Checkout ──
        const orgId = session.metadata?.org_id;
        const planId = session.metadata?.plan_id;
        const includeAiAddon = session.metadata?.include_ai_addon === "true";
        const userId = session.metadata?.user_id;

        if (!orgId || !planId) break;

        // Fetch plan to get tier
        const { data: plan } = await db
          .from("subscription_plans")
          .select("tier, product_key")
          .eq("id", planId)
          .single();

        if (!plan) break;

        // Fetch current tier before updating
        const { data: currentOrg } = await db
          .from("organizations")
          .select("subscription_tier")
          .eq("id", orgId)
          .single();

        const fromTier = (currentOrg as any)?.subscription_tier ?? "free";

        // Update org
        const updateData: Record<string, any> = {
          subscription_tier: (plan as any).tier,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          upgraded_at: new Date().toISOString(),
        };
        if (includeAiAddon) {
          updateData.ai_addon_active = true;
        }

        await db
          .from("organizations")
          .update(updateData as any)
          .eq("id", orgId);

        // Log event
        await db.from("org_subscription_events").insert({
          org_id: orgId,
          event_type: "subscription_created",
          from_tier: fromTier,
          to_tier: (plan as any).tier,
          stripe_event_id: event.id,
          metadata: {
            session_id: session.id,
            subscription_id: session.subscription,
            customer_id: session.customer,
            plan_id: planId,
            ai_addon: includeAiAddon,
          },
          actor_id: userId || null,
        } as any);

        // Log revenue
        if (session.amount_total) {
          await db.from("revenue_log").insert({
            org_id: orgId,
            revenue_type: "subscription",
            amount_usd: session.amount_total / 100,
            currency: session.currency ?? "usd",
            original_amount: session.amount_total / 100,
            stripe_event_id: event.id,
            metadata: {
              plan_id: planId,
              tier: (plan as any).tier,
              ai_addon: includeAiAddon,
              session_id: session.id,
            },
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        // Check if subscription is active or in trial
        const isActive = ["active", "trialing"].includes(subscription.status);

        if (!isActive) {
          // Subscription went past_due or unpaid — downgrade to free after grace
          // For past_due: log warning. For unpaid/canceled: downgrade immediately.
          if (subscription.status === "unpaid" || subscription.status === "incomplete_expired") {
            await db
              .from("organizations")
              .update({
                subscription_tier: "free",
                ai_addon_active: false,
              } as any)
              .eq("id", orgId);
          }

          await db.from("org_subscription_events").insert({
            org_id: orgId,
            event_type: "subscription_status_changed",
            stripe_event_id: event.id,
            metadata: {
              status: subscription.status,
              subscription_id: subscription.id,
              downgraded: subscription.status === "unpaid" || subscription.status === "incomplete_expired",
            },
          } as any);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const orgId = subscription.metadata?.org_id;
        if (!orgId) break;

        // Fetch current tier before downgrading
        const { data: org } = await db
          .from("organizations")
          .select("subscription_tier")
          .eq("id", orgId)
          .single();

        // Downgrade to free
        await db
          .from("organizations")
          .update({
            subscription_tier: "free",
            stripe_subscription_id: null,
            ai_addon_active: false,
          } as any)
          .eq("id", orgId);

        await db.from("org_subscription_events").insert({
          org_id: orgId,
          event_type: "subscription_cancelled",
          from_tier: (org as any)?.subscription_tier ?? "unknown",
          to_tier: "free",
          stripe_event_id: event.id,
          metadata: {
            subscription_id: subscription.id,
            cancel_reason: subscription.cancellation_details?.reason,
          },
        } as any);

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Find org by stripe_subscription_id
        const { data: invoiceOrg } = await db
          .from("organizations")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (invoiceOrg && invoice.amount_paid > 0) {
          await db.from("revenue_log").insert({
            org_id: (invoiceOrg as any).id,
            revenue_type: "subscription",
            amount_usd: invoice.amount_paid / 100,
            currency: invoice.currency ?? "usd",
            original_amount: invoice.amount_paid / 100,
            stripe_event_id: event.id,
            period_start: invoice.period_start
              ? new Date(invoice.period_start * 1000).toISOString().slice(0, 10)
              : null,
            period_end: invoice.period_end
              ? new Date(invoice.period_end * 1000).toISOString().slice(0, 10)
              : null,
            metadata: {
              invoice_id: invoice.id,
              subscription_id: subscriptionId,
            },
          });
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Find org by stripe_subscription_id
        const { data: org } = await db
          .from("organizations")
          .select("id, subscription_tier")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (org) {
          await db.from("org_subscription_events").insert({
            org_id: (org as any).id,
            event_type: "payment_failed",
            metadata: {
              invoice_id: invoice.id,
              attempt_count: invoice.attempt_count,
              amount_due: invoice.amount_due,
            },
            stripe_event_id: event.id,
          } as any);
        }

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
