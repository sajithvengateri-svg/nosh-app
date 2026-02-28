// Food safety queries — extracted from FoodSafety.tsx and DailyTempChecks.tsx

import { supabase } from "../supabaseClient";

// ─── Food Safety Logs ─────────────────────────────

export async function fetchFoodSafetyLogs() {
  return supabase
    .from("food_safety_logs")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });
}

export async function insertFoodSafetyLog(payload: Record<string, unknown>) {
  return supabase.from("food_safety_logs").insert(payload as any);
}

export async function updateFoodSafetyLog(id: string, payload: Record<string, unknown>) {
  return supabase.from("food_safety_logs").update(payload as any).eq("id", id);
}

export async function deleteFoodSafetyLog(id: string) {
  return supabase.from("food_safety_logs").delete().eq("id", id);
}

export async function fetchTodayTempLogs(orgId: string, date: string, shift: string) {
  return supabase
    .from("food_safety_logs")
    .select("*")
    .eq("org_id", orgId)
    .eq("log_type", "temperature")
    .eq("date", date)
    .eq("shift", shift);
}

export async function fetchMonthlyTempLogs(orgId: string, startDate: string, endDate: string) {
  return supabase
    .from("food_safety_logs")
    .select("*")
    .eq("org_id", orgId)
    .eq("log_type", "temperature")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date")
    .order("time");
}

// ─── Cleaning Areas ───────────────────────────────

export async function fetchCleaningAreas() {
  return supabase.from("cleaning_areas").select("*").order("name");
}

export async function insertCleaningArea(payload: Record<string, unknown>) {
  return supabase.from("cleaning_areas").insert(payload as any);
}

export async function updateCleaningArea(id: string, payload: Record<string, unknown>) {
  return supabase.from("cleaning_areas").update(payload as any).eq("id", id);
}

export async function deleteCleaningArea(id: string) {
  return supabase.from("cleaning_areas").delete().eq("id", id);
}

// ─── Suppliers ────────────────────────────────────

export async function fetchSuppliers() {
  return supabase.from("suppliers").select("*").order("name");
}

export async function insertSupplier(payload: Record<string, unknown>) {
  return supabase.from("suppliers").insert(payload as any);
}

export async function updateSupplier(id: string, payload: Record<string, unknown>) {
  return supabase.from("suppliers").update(payload as any).eq("id", id);
}

export async function deleteSupplier(id: string) {
  return supabase.from("suppliers").delete().eq("id", id);
}

// ─── Food Safety Alerts ──────────────────────────

export async function fetchFoodSafetyAlerts(orgId: string) {
  return supabase
    .from("food_safety_alerts")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
}

export async function acknowledgeFoodSafetyAlert(id: string, userId: string) {
  return supabase
    .from("food_safety_alerts")
    .update({ status: "acknowledged", acknowledged_by: userId, acknowledged_at: new Date().toISOString() })
    .eq("id", id);
}

// ─── Temp Check Config ───────────────────────────

export async function fetchTempCheckConfigs(orgId: string) {
  return supabase
    .from("temp_check_config")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("sort_order");
}

export async function insertTempCheckConfigs(configs: Record<string, unknown>[]) {
  return supabase.from("temp_check_config").insert(configs as any);
}

export async function deactivateTempCheckConfig(id: string) {
  return supabase.from("temp_check_config").update({ is_active: false } as any).eq("id", id);
}

// ─── Temp Check Archives ─────────────────────────

export async function fetchTempCheckArchives(orgId: string) {
  return supabase
    .from("temp_check_archives")
    .select("*")
    .eq("org_id", orgId)
    .order("month", { ascending: false });
}

export async function insertTempCheckArchive(payload: Record<string, unknown>) {
  return supabase.from("temp_check_archives").insert(payload as any);
}

// ─── Food Safety Duties ──────────────────────────

export async function fetchFoodSafetyDuties(orgId: string) {
  return supabase
    .from("food_safety_duties")
    .select("*")
    .eq("org_id", orgId);
}

export async function insertFoodSafetyDuty(payload: Record<string, unknown>) {
  return supabase.from("food_safety_duties").insert(payload as any);
}

export async function deleteFoodSafetyDuty(id: string) {
  return supabase.from("food_safety_duties").delete().eq("id", id);
}

export async function deleteFoodSafetyDutiesByMatch(orgId: string, shift: string, dutyDate: string) {
  return supabase.from("food_safety_duties").delete().match({ org_id: orgId, shift, duty_date: dutyDate });
}
