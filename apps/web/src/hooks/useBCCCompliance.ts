import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrgId";

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
];

export function useBCCCompliance() {
  const orgId = useOrgId();
  const [profile, setProfile] = useState<ComplianceProfile | null>(null);
  const [supervisors, setSupervisors] = useState<FoodSafetySupervisor[]>([]);
  const [training, setTraining] = useState<FoodHandlerTraining[]>([]);
  const [sectionToggles, setSectionToggles] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    const [profileRes, fssRes, trainingRes, togglesRes] = await Promise.all([
      supabase.from("compliance_profiles").select("*").eq("org_id", orgId).maybeSingle(),
      supabase.from("food_safety_supervisors").select("*").eq("org_id", orgId).order("created_at"),
      supabase.from("food_handler_training").select("*").eq("org_id", orgId).order("created_at"),
      supabase.from("bcc_section_toggles").select("*").eq("org_id", orgId),
    ]);

    if (profileRes.data) setProfile(profileRes.data as unknown as ComplianceProfile);
    if (fssRes.data) setSupervisors(fssRes.data as unknown as FoodSafetySupervisor[]);
    if (trainingRes.data) setTraining(trainingRes.data as unknown as FoodHandlerTraining[]);

    const toggleMap: Record<string, boolean> = {};
    BCC_SECTIONS.forEach((s) => { toggleMap[s.key] = s.defaultOn; });
    if (togglesRes.data) {
      (togglesRes.data as unknown as SectionToggle[]).forEach((t) => {
        toggleMap[t.section_key] = t.is_enabled;
      });
    }
    setSectionToggles(toggleMap);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upsertProfile = async (data: Partial<ComplianceProfile>) => {
    if (!orgId) return;
    const payload = { ...data, org_id: orgId };
    if (profile?.id) {
      await supabase.from("compliance_profiles").update(payload as any).eq("id", profile.id);
    } else {
      await supabase.from("compliance_profiles").insert(payload as any);
    }
    await fetchAll();
  };

  const upsertSupervisor = async (data: Partial<FoodSafetySupervisor>) => {
    if (!orgId) return;
    const payload = { ...data, org_id: orgId };
    if (data.id) {
      await supabase.from("food_safety_supervisors").update(payload as any).eq("id", data.id);
    } else {
      await supabase.from("food_safety_supervisors").insert(payload as any);
    }
    await fetchAll();
  };

  const addTraining = async (data: Omit<FoodHandlerTraining, "id" | "org_id">) => {
    if (!orgId) return;
    await supabase.from("food_handler_training").insert({ ...data, org_id: orgId } as any);
    await fetchAll();
  };

  const updateTraining = async (id: string, data: Partial<FoodHandlerTraining>) => {
    if (!orgId) return;
    await supabase.from("food_handler_training").update(data as any).eq("id", id);
    await fetchAll();
  };

  const deleteTraining = async (id: string) => {
    await supabase.from("food_handler_training").delete().eq("id", id);
    await fetchAll();
  };

  const updateSectionToggle = async (sectionKey: string, enabled: boolean) => {
    if (!orgId) return;
    await supabase.from("bcc_section_toggles").upsert(
      { org_id: orgId, section_key: sectionKey, is_enabled: enabled } as any,
      { onConflict: "org_id,section_key" }
    );
    setSectionToggles((prev) => ({ ...prev, [sectionKey]: enabled }));
  };

  const bulkSetSectionToggles = async (toggles: Record<string, boolean>) => {
    if (!orgId) return;
    const rows = Object.entries(toggles).map(([section_key, is_enabled]) => ({
      org_id: orgId, section_key, is_enabled,
    }));
    await supabase.from("bcc_section_toggles").upsert(rows as any[], { onConflict: "org_id,section_key" });
    setSectionToggles(toggles);
  };

  return {
    profile, supervisors, training, sectionToggles, loading,
    fetchAll, upsertProfile, upsertSupervisor,
    addTraining, updateTraining, deleteTraining,
    updateSectionToggle, bulkSetSectionToggles,
  };
}
