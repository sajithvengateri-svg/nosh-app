// Invoice queries — extracted from InvoiceScannerDialog.tsx, RecentScans.tsx, InvoiceArchive.tsx

import { supabase } from "../supabaseClient";

export async function insertInvoiceScan(payload: Record<string, unknown>) {
  return supabase.from("invoice_scans").insert(payload as any);
}

export async function fetchInvoiceScans(orgId?: string) {
  const query = supabase
    .from("invoice_scans")
    .select("*")
    .order("created_at", { ascending: false });
  if (orgId) query.eq("org_id", orgId);
  return query;
}

export async function updateInventoryQuantity(ingredientId: string, quantity: number) {
  return supabase.from("inventory").update({ quantity }).eq("ingredient_id", ingredientId);
}
