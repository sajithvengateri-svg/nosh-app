// Calendar queries — extracted from OperationsCalendar.tsx

import { supabase } from "../supabaseClient";

export async function fetchCalendarEvents() {
  return supabase.from("calendar_events").select("*").order("date", { ascending: true });
}

export async function insertCalendarEvent(payload: Record<string, unknown>) {
  return supabase.from("calendar_events").insert(payload as any);
}

export async function updateCalendarEvent(id: string, payload: Record<string, unknown>) {
  return supabase.from("calendar_events").update(payload as any).eq("id", id);
}

export async function deleteCalendarEvent(id: string) {
  return supabase.from("calendar_events").delete().eq("id", id);
}
