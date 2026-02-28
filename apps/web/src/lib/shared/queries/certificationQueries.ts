import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStaffCertifications(orgId?: string) {
  return useQuery({
    queryKey: ['staff-certifications', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_certifications')
        .select('*')
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

export function useEmployeeCertifications(orgId?: string, userId?: string) {
  return useQuery({
    queryKey: ['staff-certifications', orgId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_certifications')
        .select('*')
        .eq('org_id', orgId!)
        .eq('user_id', userId!)
        .order('cert_type');
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && !!userId,
  });
}

export function useUpsertCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cert: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('staff_certifications')
        .upsert(cert as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-certifications'] }),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_certifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-certifications'] }),
  });
}

export function useTrainingCompletions(orgId?: string) {
  return useQuery({
    queryKey: ['training-completions', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_completions')
        .select('*')
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });
}

// Helpers
export function getCertStatus(expiryDate?: string | null): 'valid' | 'expiring' | 'expired' | 'missing' {
  if (!expiryDate) return 'missing';
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry < now) return 'expired';
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  if (expiry < thirtyDays) return 'expiring';
  return 'valid';
}

export const CERT_STATUS_COLORS: Record<string, string> = {
  valid: 'text-green-600',
  expiring: 'text-yellow-600',
  expired: 'text-destructive',
  missing: 'text-muted-foreground',
};
