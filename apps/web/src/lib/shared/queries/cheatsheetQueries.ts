// Cheatsheet queries — extracted from CookingCheatsheets.tsx

import { supabase } from "../supabaseClient";

export async function fetchCheatsheets() {
  return supabase.from("cheatsheets").select("*").order("category").order("title");
}

export async function insertCheatsheets(payload: Record<string, unknown>[]) {
  return supabase.from("cheatsheets").insert(payload as any);
}

export async function insertCheatsheet(payload: Record<string, unknown>) {
  return supabase.from("cheatsheets").insert(payload as any);
}

export async function updateCheatsheet(id: string, payload: Record<string, unknown>) {
  return supabase.from("cheatsheets").update(payload as any).eq("id", id);
}

export async function deleteCheatsheet(id: string) {
  return supabase.from("cheatsheets").delete().eq("id", id);
}
