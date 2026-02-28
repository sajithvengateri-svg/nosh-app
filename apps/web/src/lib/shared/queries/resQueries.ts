// Res OS queries — RN-portable, no toast/navigate/window
import { supabase } from "../supabaseClient";

// ─── Guests ───────────────────────────────────────
export async function fetchGuests(orgId: string) {
  return supabase.from("res_guests").select("*").eq("org_id", orgId).order("last_name");
}

export async function fetchGuestById(id: string) {
  return supabase.from("res_guests").select("*").eq("id", id).single();
}

export async function createGuest(guest: Record<string, unknown>) {
  return supabase.from("res_guests").insert(guest as any).select().single();
}

export async function updateGuest(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_guests").update(payload as any).eq("id", id).select().single();
}

export async function searchGuestsByPhone(orgId: string, phone: string) {
  return supabase.from("res_guests").select("*").eq("org_id", orgId).ilike("phone", `%${phone}%`).limit(10);
}

export async function searchGuests(orgId: string, query: string) {
  return supabase.from("res_guests").select("*").eq("org_id", orgId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);
}

// ─── Tables ───────────────────────────────────────
export async function fetchTables(orgId: string) {
  return supabase.from("res_tables").select("*").eq("org_id", orgId).order("sort_order");
}

export async function createTable(table: Record<string, unknown>) {
  return supabase.from("res_tables").insert(table as any).select().single();
}

export async function updateTable(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_tables").update(payload as any).eq("id", id).select().single();
}

export async function deleteTable(id: string) {
  return supabase.from("res_tables").delete().eq("id", id);
}

export async function updateTablePositions(tables: { id: string; x_position: number; y_position: number; width: number; height: number; rotation: number }[]) {
  const promises = tables.map(t =>
    supabase.from("res_tables").update({
      x_position: t.x_position,
      y_position: t.y_position,
      width: t.width,
      height: t.height,
      rotation: t.rotation,
    } as any).eq("id", t.id)
  );
  return Promise.all(promises);
}

// ─── Block / Unblock ─────────────────────────────
export async function blockTable(id: string, reason?: string) {
  return supabase.from("res_tables").update({ is_blocked: true, block_reason: reason ?? null } as any).eq("id", id);
}

export async function unblockTable(id: string) {
  return supabase.from("res_tables").update({ is_blocked: false, block_reason: null } as any).eq("id", id);
}

// ─── Combine / Uncombine Tables ──────────────────
export async function combineTables(tableIds: string[]) {
  const groupId = crypto.randomUUID();
  const promises = tableIds.map(id =>
    supabase.from("res_tables").update({ group_id: groupId } as any).eq("id", id)
  );
  return Promise.all(promises);
}

export async function uncombineTable(tableId: string) {
  return supabase.from("res_tables").update({ group_id: null } as any).eq("id", tableId);
}

export async function uncombineGroup(groupId: string) {
  return supabase.from("res_tables").update({ group_id: null } as any).eq("group_id", groupId);
}

// ─── Floor Layouts ────────────────────────────────
export async function fetchFloorLayouts(orgId: string) {
  return supabase.from("res_floor_layouts").select("*").eq("org_id", orgId).order("created_at");
}

export async function createFloorLayout(layout: Record<string, unknown>) {
  return supabase.from("res_floor_layouts").insert(layout as any).select().single();
}

export async function updateFloorLayout(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_floor_layouts").update(payload as any).eq("id", id).select().single();
}

// ─── Floor Zones ─────────────────────────────────
export async function fetchFloorZones(orgId: string) {
  return supabase.from("res_floor_zones").select("*").eq("org_id", orgId).order("sort_order");
}

export async function createFloorZone(zone: Record<string, unknown>) {
  return supabase.from("res_floor_zones").insert(zone as any).select().single();
}

export async function updateFloorZone(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_floor_zones").update(payload as any).eq("id", id).select().single();
}

export async function deleteFloorZone(id: string) {
  return supabase.from("res_floor_zones").delete().eq("id", id);
}

export async function upsertFloorZones(zones: Record<string, unknown>[]) {
  return supabase.from("res_floor_zones").upsert(zones as any).select();
}

// ─── Reservations ─────────────────────────────────
export async function fetchReservationsByDate(orgId: string, date: string) {
  return supabase.from("res_reservations").select("*, res_guests(first_name, last_name, vip_tier, phone), res_tables(name)")
    .eq("org_id", orgId).eq("date", date).order("time");
}

export async function fetchReservationById(id: string) {
  return supabase.from("res_reservations").select("*, res_guests(*), res_tables(*)").eq("id", id).single();
}

export async function createReservation(reservation: Record<string, unknown>) {
  return supabase.from("res_reservations").insert(reservation as any).select().single();
}

export async function updateReservation(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_reservations").update(payload as any).eq("id", id).select().single();
}

export async function updateReservationStatus(id: string, status: string) {
  const now = new Date().toISOString();
  const extra: Record<string, unknown> = {};
  if (status === 'SEATED') extra.seated_at = now;
  if (status === 'COMPLETED') extra.completed_at = now;
  if (status === 'NO_SHOW' || status === 'CANCELLED') extra.completed_at = now;
  return supabase.from("res_reservations").update({ status, ...extra } as any).eq("id", id);
}

// ─── Waitlist ─────────────────────────────────────
export async function fetchActiveWaitlist(orgId: string) {
  return supabase.from("res_waitlist").select("*, res_tables(name)")
    .eq("org_id", orgId).in("status", ["WAITING", "NOTIFIED"]).order("joined_at");
}

export async function addToWaitlist(entry: Record<string, unknown>) {
  return supabase.from("res_waitlist").insert(entry as any).select().single();
}

export async function updateWaitlistStatus(id: string, status: string, extra?: Record<string, unknown>) {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { status };
  if (status === 'NOTIFIED') payload.notified_at = now;
  if (status === 'SEATED') payload.seated_at = now;
  if (extra) Object.assign(payload, extra);
  return supabase.from("res_waitlist").update(payload as any).eq("id", id);
}

// ─── Functions ────────────────────────────────────
export async function fetchFunctions(orgId: string) {
  return supabase.from("res_functions").select("*").eq("org_id", orgId).order("event_date", { ascending: false });
}

export async function fetchFunctionById(id: string) {
  return supabase.from("res_functions").select("*").eq("id", id).single();
}

export async function createFunction(fn: Record<string, unknown>) {
  return supabase.from("res_functions").insert(fn as any).select().single();
}

export async function updateFunction(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_functions").update(payload as any).eq("id", id).select().single();
}

export async function fetchFunctionPackages(functionId: string) {
  return supabase.from("res_function_packages").select("*").eq("function_id", functionId);
}

export async function addFunctionPackage(pkg: Record<string, unknown>) {
  return supabase.from("res_function_packages").insert(pkg as any).select().single();
}

export async function fetchFunctionPayments(functionId: string) {
  return supabase.from("res_function_payments").select("*").eq("function_id", functionId).order("paid_at");
}

export async function addFunctionPayment(payment: Record<string, unknown>) {
  return supabase.from("res_function_payments").insert(payment as any).select().single();
}

// ─── Forecasts ────────────────────────────────────
export async function fetchForecasts(orgId: string, startDate: string, endDate: string) {
  return supabase.from("res_demand_forecasts").select("*")
    .eq("org_id", orgId).gte("date", startDate).lte("date", endDate).order("date");
}

export async function upsertForecast(forecast: Record<string, unknown>) {
  return supabase.from("res_demand_forecasts").upsert(forecast as any).select().single();
}

// ─── Available Tables (for walk-in) ──────────────
export async function fetchAvailableTables(orgId: string, minCapacity: number) {
  const today = new Date().toISOString().split("T")[0];
  // Get active, unblocked tables with enough capacity
  const { data: allTables } = await supabase
    .from("res_tables")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .eq("is_blocked", false)
    .gte("max_capacity", minCapacity)
    .order("max_capacity");

  if (!allTables || allTables.length === 0) return { data: [] };

  // Get currently seated reservations today
  const { data: seated } = await supabase
    .from("res_reservations")
    .select("table_id")
    .eq("org_id", orgId)
    .eq("date", today)
    .eq("status", "SEATED");

  const seatedIds = new Set((seated ?? []).map((r: any) => r.table_id));
  return { data: allTables.filter((t: any) => !seatedIds.has(t.id)) };
}

// ─── Guest Reservations (visit history) ──────────
export async function fetchGuestReservations(guestId: string) {
  return supabase
    .from("res_reservations")
    .select("*, res_tables(name)")
    .eq("guest_id", guestId)
    .order("date", { ascending: false })
    .limit(10);
}

// ─── Settings ────────────────────────────────────
export async function fetchResSettings(orgId: string) {
  return supabase.from("res_settings").select("*").eq("org_id", orgId).maybeSingle();
}

export async function upsertResSettings(orgId: string, payload: Record<string, unknown>) {
  return supabase.from("res_settings").upsert({ org_id: orgId, ...payload } as any, { onConflict: "org_id" }).select().single();
}

// ─── Average turn time ──────────────────────────
export async function fetchAvgTurnTime(orgId: string, tableId?: string) {
  let query = supabase
    .from("res_reservations")
    .select("turn_time_minutes")
    .eq("org_id", orgId)
    .eq("status", "COMPLETED")
    .not("turn_time_minutes", "is", null);
  if (tableId) query = query.eq("table_id", tableId);
  const { data } = await query.limit(50);
  if (!data || data.length === 0) return null;
  const avg = data.reduce((s: number, r: any) => s + r.turn_time_minutes, 0) / data.length;
  return Math.round(avg);
}

// ─── Journey Events ─────────────────────────────
export async function fetchJourneyEvents(orgId: string, reservationIds: string[]) {
  return supabase.from("res_journey_events").select("*")
    .eq("org_id", orgId).in("reservation_id", reservationIds).order("occurred_at");
}

export async function createJourneyEvent(event: Record<string, unknown>) {
  return supabase.from("res_journey_events").insert(event as any).select().single();
}

// ─── POS Order Detection ────────────────────────
export async function fetchPosOrdersByReservationIds(reservationIds: string[]) {
  if (reservationIds.length === 0) return { data: [] };
  return supabase.from("pos_orders").select("id, reservation_id, status, created_at")
    .in("reservation_id", reservationIds);
}

// ─── Audit Suggestions ─────────────────────────
export async function fetchAuditSuggestions(orgId: string, date: string, period: string) {
  return supabase.from("res_audit_suggestions").select("*")
    .eq("org_id", orgId).eq("service_date", date).eq("service_period", period)
    .order("created_at");
}

export async function updateAuditSuggestion(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_audit_suggestions").update(payload as any).eq("id", id).select().single();
}

// ─── Tags ───────────────────────────────────────
export async function fetchOrgTags(orgId: string) {
  return supabase.from("res_tags").select("*").eq("org_id", orgId).eq("is_active", true).order("category").order("sort_order");
}

export async function createOrgTag(tag: Record<string, unknown>) {
  return supabase.from("res_tags").insert(tag as any).select().single();
}

export async function updateOrgTag(id: string, payload: Record<string, unknown>) {
  return supabase.from("res_tags").update(payload as any).eq("id", id).select().single();
}

export async function deleteOrgTag(id: string) {
  return supabase.from("res_tags").delete().eq("id", id);
}

// ─── Sidebar Config ────────────────────────────
export async function fetchSidebarConfig(orgId: string) {
  return supabase.from("res_sidebar_config").select("*").eq("org_id", orgId).order("sort_order");
}

export async function upsertSidebarConfig(sections: Record<string, unknown>[]) {
  return supabase.from("res_sidebar_config").upsert(sections as any, { onConflict: "org_id,section_key" }).select();
}

// ─── Efficiency ─────────────────────────────────
export async function fetchEfficiencySnapshots(orgId: string, startDate: string, endDate: string) {
  return supabase.from("res_efficiency_snapshots").select("*")
    .eq("org_id", orgId).gte("week_start", startDate).lte("week_start", endDate)
    .order("week_start", { ascending: false });
}

export async function fetchLatestEfficiencySnapshot(orgId: string) {
  return supabase.from("res_efficiency_snapshots").select("*")
    .eq("org_id", orgId).order("week_start", { ascending: false }).limit(1).maybeSingle();
}

// ─── Report Aggregation ────────────────────────
export async function fetchReservationMetrics(orgId: string, startDate: string, endDate: string, servicePeriod?: string) {
  let query = supabase.from("res_reservations").select("*")
    .eq("org_id", orgId).gte("date", startDate).lte("date", endDate);
  if (servicePeriod && servicePeriod !== 'all') {
    // Filter by time range based on service period
    const periods: Record<string, [string, string]> = {
      breakfast: ['06:00', '11:00'],
      lunch: ['11:30', '15:00'],
      dinner: ['17:00', '23:00'],
    };
    const [start, end] = periods[servicePeriod] ?? ['00:00', '23:59'];
    query = query.gte("time", start).lte("time", end);
  }
  return query.order("date").order("time");
}

export async function fetchChannelBreakdown(orgId: string, startDate: string, endDate: string) {
  return supabase.from("res_reservations").select("channel, status")
    .eq("org_id", orgId).gte("date", startDate).lte("date", endDate);
}

export async function fetchTablePerformance(orgId: string, startDate: string, endDate: string) {
  return supabase.from("res_reservations")
    .select("table_id, turn_time_minutes, party_size, status, res_tables(name)")
    .eq("org_id", orgId).gte("date", startDate).lte("date", endDate)
    .not("table_id", "is", null);
}

export async function fetchOccupancyByHour(orgId: string, startDate: string, endDate: string) {
  return supabase.from("res_reservations").select("time, date, status, table_id")
    .eq("org_id", orgId).gte("date", startDate).lte("date", endDate)
    .in("status", ["CONFIRMED", "SEATED", "COMPLETED"]);
}

// ─── Waiters / Staff ────────────────────────────
export async function fetchWaiters(orgId: string) {
  try {
    return await supabase.from("pos_staff")
      .select("id, display_name, pos_role")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .in("pos_role", ["waiter", "manager", "supervisor"]);
  } catch {
    return { data: [] as any[], error: null };
  }
}

// ─── Proposal Media ────────────────────────────
export async function fetchProposalMedia(proposalId: string) {
  return supabase.from("res_proposal_media").select("*")
    .eq("proposal_id", proposalId).order("sort_order");
}

export async function createProposalMedia(media: Record<string, unknown>) {
  return supabase.from("res_proposal_media").insert(media as any).select().single();
}

export async function deleteProposalMedia(id: string) {
  return supabase.from("res_proposal_media").delete().eq("id", id);
}

export async function updateProposalMediaOrder(items: { id: string; sort_order: number }[]) {
  const promises = items.map(item =>
    supabase.from("res_proposal_media").update({ sort_order: item.sort_order } as any).eq("id", item.id)
  );
  return Promise.all(promises);
}
