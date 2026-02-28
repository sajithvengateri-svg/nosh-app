// Prep queries — extracted from PrepLists.tsx

import { supabase } from "../supabaseClient";

// ─── Prep Lists ───────────────────────────────────

export async function fetchPrepLists() {
  return supabase.from("prep_lists").select("*").order("date", { ascending: false });
}

export async function insertPrepList(payload: Record<string, unknown>) {
  return supabase.from("prep_lists").insert(payload as any);
}

export async function updatePrepList(id: string, payload: Record<string, unknown>) {
  return supabase.from("prep_lists").update(payload as any).eq("id", id);
}

export async function deletePrepList(id: string) {
  return supabase.from("prep_lists").delete().eq("id", id);
}

// ─── Section Stock Templates ─────────────────────

export async function deleteSectionStockTemplate(id: string) {
  return supabase.from("section_stock_templates").delete().eq("id", id);
}
