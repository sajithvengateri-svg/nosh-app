import { supabase } from "../supabaseClient";

// Categories
export async function fetchOverheadCategories(orgId: string) {
  const { data, error } = await supabase
    .from('overhead_categories')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

// Recurring costs
export async function fetchOverheadRecurring(orgId: string) {
  const { data, error } = await supabase
    .from('overhead_recurring')
    .select('*, category:overhead_categories(*)')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Entries for a date range
export async function fetchOverheadEntries(orgId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('overhead_entries')
    .select('*, category:overhead_categories(*)')
    .eq('org_id', orgId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

// Create entry
export async function createOverheadEntry(entry: {
  org_id: string;
  category_id: string;
  description: string;
  amount: number;
  date: string;
  supplier_name?: string;
  receipt_url?: string;
  notes?: string;
  source?: string;
  created_by?: string;
}) {
  const { data, error } = await supabase
    .from('overhead_entries')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Create recurring cost
export async function createOverheadRecurring(rec: {
  org_id: string;
  category_id: string;
  description: string;
  amount: number;
  frequency: string;
  supplier_name?: string;
  start_date?: string;
  next_due_date?: string;
  created_by?: string;
}) {
  const { data, error } = await supabase
    .from('overhead_recurring')
    .insert(rec)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Depreciation assets
export async function fetchDepreciationAssets(orgId: string) {
  const { data, error } = await supabase
    .from('depreciation_assets')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDepreciationAsset(asset: {
  org_id: string;
  name: string;
  purchase_price: number;
  purchase_date: string;
  useful_life_years: number;
  salvage_value?: number;
  monthly_depreciation: number;
  current_book_value: number;
  created_by?: string;
}) {
  const { data, error } = await supabase
    .from('depreciation_assets')
    .insert(asset)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Alert rules
export async function fetchOverheadAlertRules(orgId: string) {
  const { data, error } = await supabase
    .from('overhead_alert_rules')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at');
  if (error) throw error;
  return data;
}

// Alerts
export async function fetchOverheadAlerts(orgId: string, status?: string) {
  let query = supabase
    .from('overhead_alerts')
    .select('*')
    .eq('org_id', orgId)
    .order('triggered_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Benchmarks
export async function fetchOverheadBenchmarks(orgId: string) {
  const { data, error } = await supabase
    .from('overhead_benchmarks')
    .select('*')
    .eq('org_id', orgId)
    .order('metric');
  if (error) throw error;
  return data;
}

// P&L Snapshots
export async function fetchPnlSnapshots(orgId: string, periodType: string, limit = 12) {
  const { data, error } = await supabase
    .from('pnl_snapshots')
    .select('*')
    .eq('org_id', orgId)
    .eq('period_type', periodType)
    .order('period_start', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
