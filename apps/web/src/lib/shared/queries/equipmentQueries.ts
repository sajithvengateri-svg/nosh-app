// Equipment queries — extracted from Equipment.tsx

import { supabase } from "../supabaseClient";

export async function fetchEquipment() {
  return supabase.from("equipment").select("*").order("name");
}

export async function insertEquipment(payload: Record<string, unknown>) {
  return supabase.from("equipment").insert(payload as any);
}

export async function updateEquipment(id: string, payload: Record<string, unknown>) {
  return supabase.from("equipment").update(payload as any).eq("id", id);
}

export async function deleteEquipment(id: string) {
  return supabase.from("equipment").delete().eq("id", id);
}
