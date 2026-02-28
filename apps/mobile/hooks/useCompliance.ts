import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";
import Constants from "expo-constants";
import { getVariantFrameworkConfig, getAllAssessmentItems, isHomeCook } from "@queitos/shared";
import type { AppVariant, ComplianceFrameworkConfig } from "@queitos/shared";

// ── Types ────────────────────────────────────────────────────────────

export interface ComplianceProfile {
  id: string;
  org_id: string;
  bcc_licence_number: string | null;
  fssai_licence_number?: string | null;
  licence_expiry: string | null;
  licence_displayed: boolean;
  business_category: string | null;
  food_safety_program_accredited: boolean;
  food_safety_program_auditor: string | null;
  next_audit_date: string | null;
  last_star_rating: number | null;
  licence_document_url?: string | null;
  green_shield_active?: boolean;
  green_shield_activated_at?: string | null;
  licence_type?: string | null;
  fostac_certified?: boolean;
  [key: string]: any; // allow framework-specific fields
}

export interface FoodSafetySupervisor {
  id: string;
  org_id: string;
  name: string;
  certificate_number: string | null;
  certificate_rto: string | null;
  certificate_date: string | null;
  certificate_expiry: string | null;
  certificate_document_url: string | null;
  is_primary: boolean;
  is_contactable: boolean;
  notified_council: boolean;
}

export interface FoodHandlerTraining {
  id: string;
  org_id: string;
  handler_name: string;
  role: string | null;
  training_type: string;
  training_provider: string | null;
  training_date: string | null;
  certificate_url: string | null;
  expiry_date: string | null;
  covers_safe_handling: boolean;
  covers_contamination: boolean;
  covers_cleaning: boolean;
  covers_personal_hygiene: boolean;
}

export interface SectionToggle {
  section_key: string;
  is_enabled: boolean;
}

interface ComplianceData {
  profile: ComplianceProfile | null;
  supervisors: FoodSafetySupervisor[];
  training: FoodHandlerTraining[];
  toggles: SectionToggle[];
  latestAssessment: any | null;
}

// ── Hook ─────────────────────────────────────────────────────────────

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

/**
 * Unified compliance hook. Replaces useBCCCompliance + useFSSAICompliance.
 * Auto-detects the current variant's framework config.
 * Pass overrideConfig to force a specific framework (useful for testing).
 */
export function useCompliance(overrideConfig?: ComplianceFrameworkConfig) {
  const config = overrideConfig ?? getVariantFrameworkConfig(APP_VARIANT);

  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const queryKey = ["compliance", config.id, orgId];

  // ── Main query ──────────────────────────────────────────────────

  const { data, isLoading: loading, refetch } = useQuery<ComplianceData>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return { profile: null, supervisors: [], training: [], toggles: [], latestAssessment: null };

      if (isDevBypass) {
        const cached = queryClient.getQueryData<ComplianceData>(queryKey);
        return cached ?? { profile: null, supervisors: [], training: [], toggles: [], latestAssessment: null };
      }

      const queries: PromiseLike<any>[] = [
        // 0: profile
        supabase.from(config.tables.complianceProfiles).select("*").eq("org_id", orgId).maybeSingle(),
        // 1: section toggles
        supabase.from(config.tables.sectionToggles).select("*").eq("org_id", orgId),
      ];

      // 2: supervisors (if framework supports them)
      if (config.features.hasSupervisors) {
        queries.push(
          supabase.from(config.tables.foodSafetySupervisors).select("*").eq("org_id", orgId).order("created_at")
        );
      }

      // 3: training (if framework supports it)
      if (config.features.hasTrainingRegister) {
        queries.push(
          supabase.from(config.tables.foodHandlerTraining).select("*").eq("org_id", orgId).order("created_at")
        );
      }

      // 4: latest assessment
      let assessmentQuery = supabase
        .from(config.tables.auditSelfAssessments)
        .select("*")
        .eq("org_id", orgId);
      if (config.assessmentFrameworkFilter) {
        assessmentQuery = assessmentQuery.eq("framework", config.assessmentFrameworkFilter);
      }
      queries.push(assessmentQuery.order("created_at", { ascending: false }).limit(1));

      const results = await Promise.all(queries);

      let idx = 0;
      const profileRes = results[idx++];
      const togglesRes = results[idx++];
      const supervisorsRes = config.features.hasSupervisors ? results[idx++] : null;
      const trainingRes = config.features.hasTrainingRegister ? results[idx++] : null;
      const assessmentRes = results[idx++];

      // Check for errors
      if (profileRes.error) throw profileRes.error;
      if (togglesRes.error) throw togglesRes.error;
      if (supervisorsRes?.error) throw supervisorsRes.error;
      if (trainingRes?.error) throw trainingRes.error;
      if (assessmentRes?.error) throw assessmentRes.error;

      return {
        profile: (profileRes.data as ComplianceProfile) ?? null,
        supervisors: (supervisorsRes?.data as FoodSafetySupervisor[]) || [],
        training: (trainingRes?.data as FoodHandlerTraining[]) || [],
        toggles: (togglesRes.data as SectionToggle[]) || [],
        latestAssessment: assessmentRes?.data?.[0] ?? null,
      };
    },
    enabled: !!orgId,
  });

  // ── Derived state ───────────────────────────────────────────────

  const profile = data?.profile ?? null;
  const supervisors = data?.supervisors ?? [];
  const training = data?.training ?? [];
  const latestAssessment = data?.latestAssessment ?? null;

  const isHome = isHomeCook(APP_VARIANT);

  const sectionToggles = useMemo(() => {
    const toggleMap: Record<string, boolean> = {};
    config.sections.forEach((s) => {
      toggleMap[s.key] = isHome && s.homeCookDefault !== undefined ? s.homeCookDefault : s.defaultOn;
    });
    if (data?.toggles) {
      data.toggles.forEach((t) => {
        toggleMap[t.section_key] = t.is_enabled;
      });
    }
    return toggleMap;
  }, [data?.toggles, config.sections, isHome]);

  const complianceScore = useMemo(() => {
    if (!latestAssessment) return null;

    if (config.scoring.model === "star_rating" && config.scoring.computeStarRating) {
      const items = latestAssessment.checklist_items ?? latestAssessment.responses ?? {};
      return config.scoring.computeStarRating(items);
    }

    // Percentage model
    const responses = latestAssessment.responses ?? {};
    const totalItems = getAllAssessmentItems(config).length;
    const passed = Object.values(responses).filter(Boolean).length;
    return totalItems > 0 ? Math.round((passed / totalItems) * 100) : 0;
  }, [latestAssessment, config]);

  // ── Invalidation helper ─────────────────────────────────────────

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const devSetCache = (updater: (prev: ComplianceData) => ComplianceData) => {
    queryClient.setQueryData<ComplianceData>(queryKey, (prev) =>
      updater(prev ?? { profile: null, supervisors: [], training: [], toggles: [], latestAssessment: null })
    );
  };

  // ── Mutations ───────────────────────────────────────────────────

  const upsertProfileMutation = useMutation({
    mutationFn: async (input: Partial<ComplianceProfile>) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => ({
          ...prev,
          profile: { ...prev.profile, ...input, id: prev.profile?.id ?? "dev-profile-1", org_id: orgId } as ComplianceProfile,
        }));
        return;
      }
      const payload = { ...input, org_id: orgId };
      if (profile?.id) {
        const { error } = await supabase
          .from(config.tables.complianceProfiles)
          .update(payload as any)
          .eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(config.tables.complianceProfiles)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const upsertSupervisorMutation = useMutation({
    mutationFn: async (input: Partial<FoodSafetySupervisor>) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => {
          const sup = { ...input, id: input.id ?? `dev-sup-${Date.now()}`, org_id: orgId } as FoodSafetySupervisor;
          const existing = prev.supervisors.findIndex((s) => s.id === sup.id);
          const supervisors = [...prev.supervisors];
          if (existing >= 0) supervisors[existing] = sup;
          else supervisors.push(sup);
          return { ...prev, supervisors };
        });
        return;
      }
      const payload = { ...input, org_id: orgId };
      if (input.id) {
        const { error } = await supabase
          .from(config.tables.foodSafetySupervisors)
          .update(payload as any)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(config.tables.foodSafetySupervisors)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const addTrainingMutation = useMutation({
    mutationFn: async (input: Omit<FoodHandlerTraining, "id" | "org_id">) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => ({
          ...prev,
          training: [...prev.training, { ...input, id: `dev-train-${Date.now()}`, org_id: orgId } as FoodHandlerTraining],
        }));
        return;
      }
      const { error } = await supabase
        .from(config.tables.foodHandlerTraining)
        .insert({ ...input, org_id: orgId } as any);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FoodHandlerTraining> & { id: string }) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) return;
      const { error } = await supabase
        .from(config.tables.foodHandlerTraining)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const deleteTrainingMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDevBypass) return;
      const { error } = await supabase
        .from(config.tables.foodHandlerTraining)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const updateSectionToggleMutation = useMutation({
    mutationFn: async ({ sectionKey, enabled }: { sectionKey: string; enabled: boolean }) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => {
          const toggles = prev.toggles.filter((t) => t.section_key !== sectionKey);
          toggles.push({ section_key: sectionKey, is_enabled: enabled });
          return { ...prev, toggles };
        });
        return;
      }
      const { error } = await supabase
        .from(config.tables.sectionToggles)
        .upsert(
          { org_id: orgId, section_key: sectionKey, is_enabled: enabled } as any,
          { onConflict: "org_id,section_key" }
        );
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const bulkSetSectionTogglesMutation = useMutation({
    mutationFn: async (toggles: Record<string, boolean>) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => ({
          ...prev,
          toggles: Object.entries(toggles).map(([section_key, is_enabled]) => ({ section_key, is_enabled })),
        }));
        return;
      }
      const rows = Object.entries(toggles).map(([section_key, is_enabled]) => ({
        org_id: orgId,
        section_key,
        is_enabled,
      }));
      const { error } = await supabase
        .from(config.tables.sectionToggles)
        .upsert(rows as any[], { onConflict: "org_id,section_key" });
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const submitAssessmentMutation = useMutation({
    mutationFn: async (payload: { responses?: Record<string, any>; checklist_items?: Record<string, any> }) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) return;

      const insertData: any = { org_id: orgId };

      if (config.assessmentFrameworkFilter) {
        insertData.framework = config.assessmentFrameworkFilter;
      }

      if (payload.checklist_items) {
        insertData.checklist_items = payload.checklist_items;
      }
      if (payload.responses) {
        insertData.responses = payload.responses;
        const totalItems = getAllAssessmentItems(config).length;
        const passed = Object.values(payload.responses).filter(Boolean).length;
        insertData.score = Math.round((passed / totalItems) * 100);
        insertData.total_items = totalItems;
        insertData.passed_items = passed;
      }

      const { error } = await supabase
        .from(config.tables.auditSelfAssessments)
        .insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  // ── Public API ──────────────────────────────────────────────────

  return {
    config,
    profile,
    supervisors,
    training,
    sectionToggles,
    latestAssessment,
    complianceScore,
    loading,
    upsertProfile: (data: Partial<ComplianceProfile>) => upsertProfileMutation.mutateAsync(data),
    upsertSupervisor: (data: Partial<FoodSafetySupervisor>) => upsertSupervisorMutation.mutateAsync(data),
    addTraining: (data: Omit<FoodHandlerTraining, "id" | "org_id">) => addTrainingMutation.mutateAsync(data),
    updateTraining: (id: string, data: Partial<FoodHandlerTraining>) => updateTrainingMutation.mutateAsync({ id, ...data }),
    deleteTraining: (id: string) => deleteTrainingMutation.mutateAsync(id),
    updateSectionToggle: (sectionKey: string, enabled: boolean) => updateSectionToggleMutation.mutateAsync({ sectionKey, enabled }),
    bulkSetSectionToggles: (toggles: Record<string, boolean>) => bulkSetSectionTogglesMutation.mutateAsync(toggles),
    submitAssessment: (payload: { responses?: Record<string, any>; checklist_items?: Record<string, any> }) => submitAssessmentMutation.mutateAsync(payload),
    refetch,
  };
}
