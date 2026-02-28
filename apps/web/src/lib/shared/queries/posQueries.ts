// POS Queries — pure async functions via gateway, RN-ready

import { supabase } from '../supabaseClient';

// ===================== STORE =====================
export async function fetchPOSStore(orgId: string) {
  const { data, error } = await supabase
    .from('pos_stores')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertPOSStore(store: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('pos_stores')
    .upsert(store as any, { onConflict: 'org_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===================== STAFF =====================
export async function fetchPOSStaff(orgId: string) {
  const { data, error } = await supabase
    .from('pos_staff')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('display_name');
  if (error) throw error;
  return data;
}

export async function createPOSStaff(staff: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_staff').insert(staff as any).select().single();
  if (error) throw error;
  return data;
}

export async function updatePOSStaff(id: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_staff').update(values as any).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ===================== CATEGORIES =====================
export async function fetchPOSCategories(orgId: string) {
  const { data, error } = await supabase
    .from('pos_categories')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function createPOSCategory(cat: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_categories').insert(cat as any).select().single();
  if (error) throw error;
  return data;
}

export async function updatePOSCategory(id: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_categories').update(values as any).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ===================== MENU ITEMS =====================
export async function fetchPOSMenuItems(orgId: string) {
  const { data, error } = await supabase
    .from('pos_menu_items')
    .select('*, category:pos_categories(id, name, icon)')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function createPOSMenuItem(item: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_menu_items').insert(item as any).select().single();
  if (error) throw error;
  return data;
}

export async function updatePOSMenuItem(id: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_menu_items').update(values as any).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ===================== MODIFIER GROUPS =====================
export async function fetchPOSModifierGroups(orgId: string) {
  const { data, error } = await supabase
    .from('pos_modifier_groups')
    .select('*, modifiers:pos_modifiers(*)')
    .eq('org_id', orgId)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createPOSModifierGroup(group: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_modifier_groups').insert(group as any).select().single();
  if (error) throw error;
  return data;
}

// ===================== MODIFIERS =====================
export async function createPOSModifier(mod: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_modifiers').insert(mod as any).select().single();
  if (error) throw error;
  return data;
}

export async function updatePOSModifier(id: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_modifiers').update(values as any).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ===================== ORDERS =====================
export async function createPOSOrder(order: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_orders').insert(order as any).select().single();
  if (error) throw error;
  return data;
}

export async function updatePOSOrder(id: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_orders').update(values as any).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPOSOrders(orgId: string, status?: string) {
  let q = supabase
    .from('pos_orders')
    .select('*, items:pos_order_items(*)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ===================== ORDER ITEMS =====================
export async function createPOSOrderItems(items: Record<string, unknown>[]) {
  const { data, error } = await supabase.from('pos_order_items').insert(items as any).select();
  if (error) throw error;
  return data;
}

// ===================== ORDER EVENTS =====================
export async function insertOrderEvent(event: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_order_events').insert(event as any).select().single();
  if (error) throw error;
  return data;
}

// ===================== PAYMENTS =====================
export async function createPOSPayment(payment: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_payments').insert(payment as any).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPOSPayments(orgId: string, startDate?: string, endDate?: string) {
  let q = supabase.from('pos_payments').select('*').eq('org_id', orgId).order('created_at', { ascending: false });
  if (startDate) q = q.gte('created_at', startDate);
  if (endDate) q = q.lte('created_at', endDate);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ===================== TABS =====================
export async function fetchPOSTabs(orgId: string, status?: string) {
  let q = supabase.from('pos_tabs').select('*').eq('org_id', orgId).order('opened_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function openPOSTab(tab: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_tabs').insert(tab as any).select().single();
  if (error) throw error;
  return data;
}

export async function closePOSTab(id: string) {
  const { data, error } = await supabase
    .from('pos_tabs')
    .update({ status: 'CLOSED', closed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===================== CERTIFICATIONS =====================
export async function fetchPOSCerts(orgId: string) {
  const { data, error } = await supabase
    .from('pos_certifications')
    .select('*')
    .eq('org_id', orgId)
    .order('expiry_date');
  if (error) throw error;
  return data;
}

export async function createPOSCert(cert: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_certifications').insert(cert as any).select().single();
  if (error) throw error;
  return data;
}

export async function updatePOSCert(id: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_certifications').update(values as any).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ===================== SHIFTS =====================
export async function clockIn(shift: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_shifts').insert(shift as any).select().single();
  if (error) throw error;
  return data;
}

export async function clockOut(id: string, hours: number) {
  const { data, error } = await supabase
    .from('pos_shifts')
    .update({ clock_out: new Date().toISOString(), hours, status: 'COMPLETED' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===================== AUDIT =====================
export async function logAuditEvent(event: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_audit_events').insert(event as any).select().single();
  if (error) throw error;
  return data;
}

export async function fetchAuditEvents(orgId: string, limit = 100) {
  const { data, error } = await supabase
    .from('pos_audit_events')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ===================== DAILY CLOSE =====================
export async function createDailyClose(close: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_daily_close').insert(close as any).select().single();
  if (error) throw error;
  return data;
}

export async function fetchDailyClose(orgId: string, limit = 30) {
  const { data, error } = await supabase
    .from('pos_daily_close')
    .select('*')
    .eq('org_id', orgId)
    .order('close_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ===================== WASTE =====================
export async function logWaste(waste: Record<string, unknown>) {
  const { data, error } = await supabase.from('pos_waste_logs').insert(waste as any).select().single();
  if (error) throw error;
  return data;
}

export async function fetchWasteLogs(orgId: string, limit = 50) {
  const { data, error } = await supabase
    .from('pos_waste_logs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// ===================== XERO QUEUE =====================
export async function queueJournalEntry(entry: Record<string, unknown>) {
  const { data, error } = await supabase.from('xero_journal_queue').insert(entry as any).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPendingJournals(orgId: string) {
  const { data, error } = await supabase
    .from('xero_journal_queue')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'QUEUED')
    .order('created_at');
  if (error) throw error;
  return data;
}
