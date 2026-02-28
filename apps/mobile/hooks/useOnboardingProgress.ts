import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";

// ── Types ────────────────────────────────────────────────────────────

interface PhaseState {
  completed: boolean;
  skipped?: boolean;
  step?: number;
}

interface OnboardingRow {
  id: string;
  org_id: string;
  user_id: string;
  current_phase: number;
  phase_data: Record<string, PhaseState>;
  started_at: string;
  updated_at: string;
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useOnboardingProgress() {
  const { currentOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = ["onboarding-progress", orgId, userId];

  const { data, isLoading } = useQuery<OnboardingRow | null>({
    queryKey,
    queryFn: async () => {
      if (!orgId || !userId) return null;
      if (isDevBypass) {
        return queryClient.getQueryData<OnboardingRow>(queryKey) ?? null;
      }
      const { data, error } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("org_id", orgId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as OnboardingRow | null;
    },
    enabled: !!orgId && !!userId,
  });

  const updateProgress = useMutation({
    mutationFn: async (update: {
      current_phase: number;
      phase_data: Record<string, PhaseState>;
    }) => {
      if (!orgId || !userId) throw new Error("Not ready");
      if (isDevBypass) {
        queryClient.setQueryData<OnboardingRow>(queryKey, (prev) => ({
          id: prev?.id ?? `dev-onboarding-${Date.now()}`,
          org_id: orgId,
          user_id: userId,
          current_phase: update.current_phase,
          phase_data: update.phase_data,
          started_at: prev?.started_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        return;
      }
      const { error } = await supabase.from("onboarding_progress").upsert(
        {
          org_id: orgId,
          user_id: userId,
          current_phase: update.current_phase,
          phase_data: update.phase_data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      if (!isDevBypass) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      if (isDevBypass) return;
      const { error } = await supabase
        .from("organizations")
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org"] });
    },
  });

  return {
    progress: data,
    isLoading,
    currentPhase: data?.current_phase ?? 0,
    phaseData: (data?.phase_data ?? {}) as Record<string, PhaseState>,
    updateProgress: updateProgress.mutateAsync,
    completeOnboarding: completeOnboarding.mutateAsync,
  };
}
