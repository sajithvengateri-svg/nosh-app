import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

// ===================== AWARD RATES =====================

export function useAwardRates(awardCode?: string) {
  return useQuery({
    queryKey: ['award-rates', awardCode],
    queryFn: async () => {
      let q = supabase.from('award_rates').select('*').eq('is_current', true);
      if (awardCode) q = q.eq('award_code', awardCode);
      const { data, error } = await q.order('classification');
      if (error) throw error;
      return data;
    },
  });
}

export function useArchivedAwardRates(awardCode?: string) {
  return useQuery({
    queryKey: ['award-rates-archived', awardCode],
    queryFn: async () => {
      let q = supabase.from('award_rates').select('*').eq('is_current', false);
      if (awardCode) q = q.eq('award_code', awardCode);
      const { data, error } = await q.order('effective_to', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ===================== PENALTY RULES =====================

export function usePenaltyRules(awardCode?: string) {
  return useQuery({
    queryKey: ['penalty-rules', awardCode],
    queryFn: async () => {
      let q = supabase.from('penalty_rules').select('*');
      if (awardCode) q = q.eq('award_code', awardCode);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ===================== PUBLIC HOLIDAYS =====================

export function usePublicHolidays(state?: string) {
  return useQuery({
    queryKey: ['public-holidays', state],
    queryFn: async () => {
      let q = supabase.from('public_holidays').select('*');
      if (state) q = q.eq('state', state);
      const { data, error } = await q.order('date');
      if (error) throw error;
      return data;
    },
  });
}

// ===================== ALLOWANCE RATES =====================

export function useAllowanceRates(awardCode?: string) {
  return useQuery({
    queryKey: ['allowance-rates', awardCode],
    queryFn: async () => {
      let q = supabase.from('allowance_rates').select('*').eq('is_current', true);
      if (awardCode) q = q.eq('award_code', awardCode);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ===================== EMPLOYEE PROFILES =====================

export function useEmployeeProfiles(orgId?: string) {
  return useQuery({
    queryKey: ['employee-profiles', orgId],
    queryFn: async () => {
      let q = supabase.from('employee_profiles').select('*');
      if (orgId) q = q.eq('org_id', orgId);
      const { data, error } = await q.eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useUpsertEmployeeProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Record<string, unknown>) => {
      const { data, error } = await supabase.from('employee_profiles').upsert(profile as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-profiles'] }),
  });
}

// ===================== ROSTERS =====================

export function useRosters(orgId?: string) {
  return useQuery({
    queryKey: ['rosters', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('rosters').select('*')
        .eq('org_id', orgId!).order('period_start', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCreateRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roster: { org_id: string; period_start: string; period_end: string; period_type?: string; labour_budget?: number; created_by?: string; section?: string | null }) => {
      const { data, error } = await supabase.from('rosters').insert(roster).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rosters'] }),
  });
}

export function useUpdateRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('rosters').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rosters'] }),
  });
}

export function useRosterShifts(rosterId?: string) {
  return useQuery({
    queryKey: ['labour-roster-shifts', rosterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('labour_roster_shifts').select('*')
        .eq('roster_id', rosterId!).order('date').order('start_time');
      if (error) throw error;
      return data;
    },
    enabled: !!rosterId,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shift: {
      roster_id: string; org_id: string; user_id: string; date: string;
      start_time: string; end_time: string; break_minutes?: number;
      section?: string; sub_section?: string; shift_type?: string;
      estimated_hours?: number; estimated_cost?: number; notes?: string;
    }) => {
      const { data, error } = await supabase.from('labour_roster_shifts').insert(shift).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['labour-roster-shifts', vars.roster_id] }),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, roster_id, ...updates }: { id: string; roster_id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('labour_roster_shifts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['labour-roster-shifts', vars.roster_id] }),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, roster_id }: { id: string; roster_id: string }) => {
      const { error } = await supabase.from('labour_roster_shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['labour-roster-shifts', vars.roster_id] }),
  });
}

// ===================== EMPLOYEE PROFILES WITH NAMES =====================

export function useEmployeeProfilesWithNames(orgId?: string) {
  return useQuery({
    queryKey: ['employee-profiles-with-names', orgId],
    queryFn: async () => {
      const { data: employees, error } = await supabase.from('employee_profiles').select('*')
        .eq('org_id', orgId!).eq('is_active', true);
      if (error) throw error;
      if (!employees?.length) return [];

      const userIds = employees.map(e => e.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return employees.map(e => ({
        ...e,
        full_name: profileMap.get(e.user_id)?.full_name || 'Unknown',
        avatar_url: profileMap.get(e.user_id)?.avatar_url || null,
      }));
    },
    enabled: !!orgId,
  });
}

// ===================== LEAVE =====================

export function useLeaveRequests(orgId?: string) {
  return useQuery({
    queryKey: ['leave-requests', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('leave_requests').select('*')
        .eq('org_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useLeaveBalances(orgId?: string) {
  return useQuery({
    queryKey: ['leave-balances', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('leave_balances').select('*')
        .eq('org_id', orgId!);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// ===================== PAYROLL =====================

export function usePayrollRuns(orgId?: string) {
  return useQuery({
    queryKey: ['payroll-runs', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('payroll_runs').select('*')
        .eq('org_id', orgId!).order('period_start', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function usePayrollItems(runId?: string) {
  return useQuery({
    queryKey: ['payroll-items', runId],
    queryFn: async () => {
      const { data, error } = await supabase.from('payroll_items').select('*')
        .eq('payroll_run_id', runId!);
      if (error) throw error;
      return data;
    },
    enabled: !!runId,
  });
}

// ===================== CLOCK EVENTS =====================

export function useClockEvents(orgId?: string, date?: string) {
  return useQuery({
    queryKey: ['clock-events', orgId, date],
    queryFn: async () => {
      let q = supabase.from('clock_events').select('*').eq('org_id', orgId!);
      if (date) q = q.eq('shift_date', date);
      const { data, error } = await q.order('event_time', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// ===================== LABOUR SETTINGS =====================

export function useLabourSettings(orgId?: string) {
  return useQuery({
    queryKey: ['labour-settings', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('labour_settings').select('*')
        .eq('org_id', orgId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// ===================== COMMUNICATION RULES =====================

export function useCommunicationRules(orgId?: string) {
  return useQuery({
    queryKey: ['communication-rules', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('communication_rules').select('*')
        .eq('org_id', orgId!);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// ===================== GEOFENCE LOCATIONS =====================

export function useGeofenceLocations(orgId?: string) {
  return useQuery({
    queryKey: ['geofence-locations', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('geofence_locations').select('*')
        .eq('org_id', orgId!).eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// ===================== MINIMUM STAFFING =====================

export function useMinimumStaffing(orgId?: string) {
  return useQuery({
    queryKey: ['minimum-staffing', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('minimum_staffing').select('*')
        .eq('org_id', orgId!);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// ===================== ROSTER TEMPLATES =====================

export function useRosterTemplates(orgId?: string) {
  return useQuery({
    queryKey: ['roster-templates', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('roster_templates').select('*')
        .eq('org_id', orgId!).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useCreateRosterTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: { org_id: string; name: string; description: string | null; shifts: unknown[] }) => {
      const { data, error } = await supabase.from('roster_templates').insert(template as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roster-templates'] }),
  });
}

export function useDeleteRosterTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roster_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roster-templates'] }),
  });
}
