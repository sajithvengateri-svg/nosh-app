/**
 * @deprecated Use `useCompliance()` from `./useCompliance` instead.
 * This hook is FSSAI-specific. The new `useCompliance()` hook auto-detects
 * the compliance framework from the app variant and works for all frameworks.
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface FSSAIProfile {
  id: string;
  org_id: string;
  fssai_licence_number: string | null;
  licence_expiry: string | null;
  licence_type: "registration" | "state" | "central";
  business_category: string | null;
  fostac_certified: boolean;
  next_audit_date: string | null;
  last_audit_score: number | null;
}

/**
 * FSSAI Schedule 4 self-assessment sections and items.
 * Based on Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011.
 */
export const FSSAI_SECTIONS = [
  {
    key: "personal_hygiene",
    label: "Personal Hygiene",
    items: [
      { key: "F1", text: "All food handlers wear clean protective clothing, head covering, and footwear" },
      { key: "F2", text: "Hands washed before handling food and after using toilet" },
      { key: "F3", text: "No smoking, spitting, or chewing in food handling areas" },
      { key: "F4", text: "Cuts and wounds covered with waterproof dressings" },
      { key: "F5", text: "Food handlers free from communicable diseases (medical fitness certificates current)" },
      { key: "F6", text: "Jewellery and watches removed before food handling" },
    ],
  },
  {
    key: "premises",
    label: "Design & Facilities",
    items: [
      { key: "F7", text: "Floors, walls and ceilings in good repair, clean, and impervious" },
      { key: "F8", text: "Adequate lighting and ventilation in all food areas" },
      { key: "F9", text: "Separate handwash basins with soap and drying facilities" },
      { key: "F10", text: "Adequate drainage and waste disposal systems" },
      { key: "F11", text: "Clean water supply adequate for all operations" },
      { key: "F12", text: "Toilet facilities clean and not opening directly into food areas" },
      { key: "F13", text: "Pest-proofing measures in place (screens, door strips, etc.)" },
    ],
  },
  {
    key: "equipment",
    label: "Equipment & Utensils",
    items: [
      { key: "F14", text: "Equipment and utensils made of food-grade materials, clean, and in good repair" },
      { key: "F15", text: "Thermometers available and calibrated for temperature monitoring" },
      { key: "F16", text: "Adequate refrigeration and cold storage available" },
      { key: "F17", text: "Separate cutting boards for raw and cooked foods" },
      { key: "F18", text: "Cleaning and sanitising schedule for all equipment maintained" },
    ],
  },
  {
    key: "food_operations",
    label: "Food Operations",
    items: [
      { key: "F19", text: "Raw materials sourced from approved/licensed suppliers" },
      { key: "F20", text: "Receiving inspection: temperature, condition, and expiry date checks" },
      { key: "F21", text: "Proper storage: FIFO, off floor, labelled, temperature controlled" },
      { key: "F22", text: "Cross-contamination prevention: separate storage for raw and cooked" },
      { key: "F23", text: "Cooking temperatures monitored (core temp ≥75°C)" },
      { key: "F24", text: "Cooling done within 2 hours (from 60°C to 21°C) and 4 hours (to 5°C)" },
      { key: "F25", text: "Hot holding maintained above 60°C" },
      { key: "F26", text: "Cold holding maintained below 5°C" },
      { key: "F27", text: "Reheating to ≥75°C before serving" },
      { key: "F28", text: "Oil/fat quality monitored; TPC levels within limits" },
      { key: "F29", text: "Packaging materials are food grade and labelled per FSSAI norms" },
    ],
  },
  {
    key: "documentation",
    label: "Documentation & Records",
    items: [
      { key: "F30", text: "FSSAI licence displayed at prominent location" },
      { key: "F31", text: "Temperature monitoring records maintained daily" },
      { key: "F32", text: "Cleaning and sanitisation records maintained" },
      { key: "F33", text: "Pest control records maintained" },
      { key: "F34", text: "Staff training records maintained (FOSTAC or equivalent)" },
      { key: "F35", text: "Supplier records with FSSAI licence numbers maintained" },
      { key: "F36", text: "Complaint register maintained and reviewed" },
      { key: "F37", text: "Recall/withdrawal procedure documented" },
      { key: "F38", text: "Water testing reports available (latest)" },
      { key: "F39", text: "Medical fitness certificates of food handlers available" },
      { key: "F40", text: "Food Safety Management Plan or HACCP plan documented" },
    ],
  },
] as const;

export const FSSAI_ALL_ITEMS = FSSAI_SECTIONS.flatMap((s) => [...s.items] as Array<{ key: string; text: string }>);

export function useFSSAICompliance() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["fssai-compliance", orgId];

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orgId) return { profile: null, assessments: [] };

      const [profileRes, assessRes] = await Promise.all([
        supabase
          .from("compliance_profiles")
          .select("*")
          .eq("org_id", orgId)
          .maybeSingle(),
        supabase
          .from("audit_self_assessments")
          .select("*")
          .eq("org_id", orgId)
          .eq("framework", "fssai")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      return {
        profile: profileRes.data as FSSAIProfile | null,
        assessments: assessRes.data ?? [],
      };
    },
    enabled: !!orgId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const profile = data?.profile ?? null;
  const latestAssessment = data?.assessments?.[0] ?? null;

  const complianceScore = useMemo(() => {
    if (!latestAssessment?.responses) return 0;
    const responses = latestAssessment.responses as Record<string, boolean>;
    const total = FSSAI_ALL_ITEMS.length;
    const passed = Object.values(responses).filter(Boolean).length;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }, [latestAssessment]);

  const upsertProfileMutation = useMutation({
    mutationFn: async (input: Partial<FSSAIProfile>) => {
      if (!orgId) throw new Error("No org");
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
    onSuccess: invalidate,
  });

  const submitAssessmentMutation = useMutation({
    mutationFn: async (responses: Record<string, boolean>) => {
      if (!orgId) throw new Error("No org");
      const total = FSSAI_ALL_ITEMS.length;
      const passed = Object.values(responses).filter(Boolean).length;
      const score = Math.round((passed / total) * 100);

      const { error } = await supabase
        .from("audit_self_assessments")
        .insert({
          org_id: orgId,
          framework: "fssai",
          responses,
          score,
          total_items: total,
          passed_items: passed,
        } as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    profile,
    latestAssessment,
    complianceScore,
    loading,
    upsertProfile: (data: Partial<FSSAIProfile>) => upsertProfileMutation.mutateAsync(data),
    submitAssessment: (responses: Record<string, boolean>) => submitAssessmentMutation.mutateAsync(responses),
    refetch,
  };
}
