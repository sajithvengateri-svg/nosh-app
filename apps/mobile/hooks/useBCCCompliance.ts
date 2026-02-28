/**
 * @deprecated Use `useCompliance()` from `./useCompliance` instead.
 * This hook is BCC-specific. The new `useCompliance()` hook auto-detects
 * the compliance framework from the app variant and works for all frameworks.
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";
import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

export interface ComplianceProfile {
  id: string;
  org_id: string;
  bcc_licence_number: string | null;
  licence_expiry: string | null;
  licence_displayed: boolean;
  business_category: "category_1" | "category_2";
  food_safety_program_accredited: boolean;
  food_safety_program_auditor: string | null;
  next_audit_date: string | null;
  last_star_rating: number | null;
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

export const BCC_SECTIONS: readonly { key: string; label: string; defaultOn: boolean; homeCookDefault?: boolean }[] = [
  { key: "fridge_temps", label: "Fridge Temps", defaultOn: true },
  { key: "freezer_temps", label: "Freezer Temps", defaultOn: true },
  { key: "staff_health", label: "Staff Health Checks", defaultOn: true },
  { key: "handwash_stations", label: "Handwash Station Checks", defaultOn: true },
  { key: "sanitiser_check", label: "Sanitiser Checks", defaultOn: true },
  { key: "kitchen_clean", label: "Kitchen Cleanliness", defaultOn: true },
  { key: "pest_check", label: "Pest Checks", defaultOn: true },
  { key: "receiving_logs", label: "Receiving Logs", defaultOn: true },
  { key: "cooking_logs", label: "Cooking Logs", defaultOn: true },
  { key: "cooling_logs", label: "Cooling Logs", defaultOn: true },
  { key: "reheating_logs", label: "Reheating Logs", defaultOn: true },
  { key: "display_monitoring", label: "Display Monitoring", defaultOn: false, homeCookDefault: false },
  { key: "transport_logs", label: "Transport Logs", defaultOn: false, homeCookDefault: false },
  { key: "cleaning_schedules", label: "Cleaning Schedules", defaultOn: true },
  { key: "equipment_calibration", label: "Equipment & Calibration", defaultOn: true, homeCookDefault: false },
  { key: "supplier_register", label: "Supplier Register", defaultOn: true, homeCookDefault: false },
  { key: "self_assessment", label: "Self-Assessment (A1–A40)", defaultOn: true },
  { key: "grease_trap", label: "Grease Trap", defaultOn: true, homeCookDefault: false },
  { key: "hood_cleaning", label: "Hood Cleaning", defaultOn: true, homeCookDefault: false },
  { key: "chemical_safety", label: "Chemical Safety", defaultOn: true },
  { key: "haccp", label: "HACCP Plan", defaultOn: true, homeCookDefault: false },
  { key: "audit_docs", label: "Audit & Documents", defaultOn: true, homeCookDefault: false },
  { key: "eq_training", label: "Equipment Training", defaultOn: true, homeCookDefault: false },
];

interface BCCComplianceData {
  profile: ComplianceProfile | null;
  supervisors: FoodSafetySupervisor[];
  training: FoodHandlerTraining[];
  toggles: SectionToggle[];
}

export function useBCCCompliance() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const queryKey = ["bcc-compliance", orgId];

  const { data, isLoading: loading, refetch } = useQuery<BCCComplianceData>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return { profile: null, supervisors: [], training: [], toggles: [] };

      // Dev bypass — preserve whatever the mutations wrote to cache
      if (isDevBypass) {
        const cached = queryClient.getQueryData<BCCComplianceData>(queryKey);
        return cached ?? { profile: null, supervisors: [], training: [], toggles: [] };
      }

      const [profileRes, fssRes, trainingRes, togglesRes] = await Promise.all([
        supabase.from("compliance_profiles").select("*").eq("org_id", orgId).maybeSingle(),
        supabase.from("food_safety_supervisors").select("*").eq("org_id", orgId).order("created_at"),
        supabase.from("food_handler_training").select("*").eq("org_id", orgId).order("created_at"),
        supabase.from("bcc_section_toggles").select("*").eq("org_id", orgId),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (fssRes.error) throw fssRes.error;
      if (trainingRes.error) throw trainingRes.error;
      if (togglesRes.error) throw togglesRes.error;

      return {
        profile: (profileRes.data as unknown as ComplianceProfile) ?? null,
        supervisors: (fssRes.data as unknown as FoodSafetySupervisor[]) || [],
        training: (trainingRes.data as unknown as FoodHandlerTraining[]) || [],
        toggles: (togglesRes.data as unknown as SectionToggle[]) || [],
      };
    },
    enabled: !!orgId,
  });

  const profile = data?.profile ?? null;
  const supervisors = data?.supervisors ?? [];
  const training = data?.training ?? [];

  const isHome = isHomeCook(APP_VARIANT);

  const sectionToggles = useMemo(() => {
    const toggleMap: Record<string, boolean> = {};
    BCC_SECTIONS.forEach((s) => {
      toggleMap[s.key] = isHome && s.homeCookDefault !== undefined ? s.homeCookDefault : s.defaultOn;
    });
    if (data?.toggles) {
      data.toggles.forEach((t) => {
        toggleMap[t.section_key] = t.is_enabled;
      });
    }
    return toggleMap;
  }, [data?.toggles, isHome]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  // Dev bypass: write directly to React Query cache so UI updates
  const devSetCache = (updater: (prev: BCCComplianceData) => BCCComplianceData) => {
    queryClient.setQueryData<BCCComplianceData>(queryKey, (prev) =>
      updater(prev ?? { profile: null, supervisors: [], training: [], toggles: [] })
    );
  };

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
          .from("compliance_profiles")
          .update(payload as any)
          .eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("compliance_profiles")
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
          .from("food_safety_supervisors")
          .update(payload as any)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("food_safety_supervisors")
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
        .from("food_handler_training")
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
        .from("food_handler_training")
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
        .from("food_handler_training")
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
        .from("bcc_section_toggles")
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
        .from("bcc_section_toggles")
        .upsert(rows as any[], { onConflict: "org_id,section_key" });
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  // Wrapper functions that match the web hook's API surface
  const upsertProfile = (data: Partial<ComplianceProfile>) =>
    upsertProfileMutation.mutateAsync(data);

  const upsertSupervisor = (data: Partial<FoodSafetySupervisor>) =>
    upsertSupervisorMutation.mutateAsync(data);

  const addTraining = (data: Omit<FoodHandlerTraining, "id" | "org_id">) =>
    addTrainingMutation.mutateAsync(data);

  const updateTraining = (id: string, data: Partial<FoodHandlerTraining>) =>
    updateTrainingMutation.mutateAsync({ id, ...data });

  const deleteTraining = (id: string) =>
    deleteTrainingMutation.mutateAsync(id);

  const updateSectionToggle = (sectionKey: string, enabled: boolean) =>
    updateSectionToggleMutation.mutateAsync({ sectionKey, enabled });

  const bulkSetSectionToggles = (toggles: Record<string, boolean>) =>
    bulkSetSectionTogglesMutation.mutateAsync(toggles);

  return {
    profile,
    supervisors,
    training,
    sectionToggles,
    loading,
    upsertProfile,
    upsertSupervisor,
    addTraining,
    updateTraining,
    deleteTraining,
    updateSectionToggle,
    bulkSetSectionToggles,
    refetch,
  };
}
