// invoice-generate: Weekly cron to create usage invoices for vendors
// Schedule: Monday 00:00 AEST via Supabase dashboard or pg_cron
// Aggregates redeemed deal codes from the previous week
// Creates vendor_invoices rows with 2% usage fee + 10% GST

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const USAGE_FEE_RATE = 0.02; // 2% of tracked sales
const GST_RATE = 0.10; // Australian GST

Deno.serve(async (_req) => {
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Period: last 7 days (Monday to Sunday)
  const periodEnd = new Date();
  periodEnd.setHours(0, 0, 0, 0);
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all redeemed codes in period
  const { data: redemptions, error: fetchErr } = await db
    .from("deal_codes")
    .select("vendor_id, transaction_amount")
    .eq("status", "redeemed")
    .gte("redeemed_at", periodStart.toISOString())
    .lt("redeemed_at", periodEnd.toISOString());

  if (fetchErr) {
    return new Response(
      JSON.stringify({ error: fetchErr.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!redemptions?.length) {
    return new Response(
      JSON.stringify({
        invoices_created: 0,
        message: "No redemptions in period",
        period: {
          start: periodStart.toISOString().split("T")[0],
          end: periodEnd.toISOString().split("T")[0],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Aggregate by vendor
  const vendorTotals = new Map<
    string,
    { count: number; sales: number }
  >();

  for (const r of redemptions) {
    const existing = vendorTotals.get(r.vendor_id) ?? {
      count: 0,
      sales: 0,
    };
    existing.count++;
    existing.sales += Number(r.transaction_amount ?? 0);
    vendorTotals.set(r.vendor_id, existing);
  }

  // Build invoice rows
  const invoices = [];
  const startStr = periodStart.toISOString().split("T")[0];
  const endStr = periodEnd.toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const [vendorId, totals] of vendorTotals) {
    const usageFee = Math.round(totals.sales * USAGE_FEE_RATE * 100) / 100;
    const gst = Math.round(usageFee * GST_RATE * 100) / 100;
    const total = Math.round((usageFee + gst) * 100) / 100;

    invoices.push({
      vendor_id: vendorId,
      invoice_type: "usage" as const,
      period_start: startStr,
      period_end: endStr,
      redemption_count: totals.count,
      tracked_sales_total: Math.round(totals.sales * 100) / 100,
      usage_fee_amount: usageFee,
      gst_amount: gst,
      total_amount: total,
      status: "draft" as const,
      issued_at: new Date().toISOString(),
      due_at: dueDate,
    });
  }

  const { data: created, error: insertErr } = await db
    .from("vendor_invoices")
    .insert(invoices)
    .select("id, vendor_id, total_amount");

  if (insertErr) {
    return new Response(
      JSON.stringify({ error: insertErr.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(
    `invoice-generate: ${created?.length ?? 0} invoices created for period ${startStr} to ${endStr}`
  );

  return new Response(
    JSON.stringify({
      invoices_created: created?.length ?? 0,
      period: { start: startStr, end: endStr },
      invoices: created,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
