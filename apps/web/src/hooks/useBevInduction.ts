import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useEffect } from "react";

export interface BevInductionStep {
  key: string;
  day: number;
  week: 1 | 2;
  label: string;
  description: string;
  href: string;
  icon: string;
}

export const BEV_INDUCTION_STEPS: BevInductionStep[] = [
  // Week 1: Foundation
  { key: "bev_day1_profile", day: 1, week: 1, label: "Welcome & Bar Setup", description: "Complete profile, set up bar details, add locations", href: "/bev/settings", icon: "User" },
  { key: "bev_day2_products", day: 2, week: 1, label: "Stock Your Cellar", description: "Add first 10 products to the cellar", href: "/bev/cellar", icon: "Package" },
  { key: "bev_day3_spec", day: 3, week: 1, label: "First Cocktail Spec", description: "Create your first cocktail specification", href: "/bev/cocktails", icon: "Martini" },
  { key: "bev_day4_stations", day: 4, week: 1, label: "Bar Stations", description: "Create stations (Well, Service, Back Bar, Coffee)", href: "/bev/stations", icon: "LayoutGrid" },
  { key: "bev_day5_prep", day: 5, week: 1, label: "Bar Prep Templates", description: "Set up bar prep templates for juice, syrups, garnish", href: "/bev/bar-prep", icon: "ClipboardCheck" },
  { key: "bev_day6_team", day: 6, week: 1, label: "Invite Your Team", description: "Invite bartenders, bar-backs, and baristas", href: "/bev/team", icon: "Users" },
  { key: "bev_day7_review", day: 7, week: 1, label: "Review & Catch-up", description: "Complete any missed steps, explore settings", href: "/bev/settings", icon: "CheckCircle2" },
  // Week 2: Advanced
  { key: "bev_day8_invoice", day: 8, week: 2, label: "Scan First Invoice", description: "Snap a photo of a beverage supplier invoice", href: "/bev/invoices", icon: "Receipt" },
  { key: "bev_day9_keg", day: 9, week: 2, label: "Log a Keg & Pours", description: "Tap a keg and log your first pours", href: "/bev/draught", icon: "Beer" },
  { key: "bev_day10_menu", day: 10, week: 2, label: "Drinks Menu Setup", description: "Upload or create a drinks menu with pricing", href: "/bev/engineering", icon: "BookOpen" },
  { key: "bev_day11_equipment", day: 11, week: 2, label: "Equipment Audit", description: "Log espresso machine, blenders, glass washer", href: "/bev/equipment", icon: "Wrench" },
  { key: "bev_day12_cleaning", day: 12, week: 2, label: "Line Cleaning Schedule", description: "Set up draught line cleaning schedule", href: "/bev/compliance", icon: "SprayCan" },
  { key: "bev_day13_temps", day: 13, week: 2, label: "Cellar Temperature Logs", description: "Set up CCP points and temperature monitoring", href: "/bev/compliance", icon: "Thermometer" },
  { key: "bev_day14_workflow", day: 14, week: 2, label: "Full Shift Workflow", description: "Run through a full day (prep, service, stocktake)", href: "/bev/bar-prep", icon: "CalendarCheck" },
];

const BEV_SETTINGS_KEY = "bevos_induction";

export const useBevInduction = () => {
  const { user, profile } = useAuth();
  const { currentOrg, memberships } = useOrg();
  const queryClient = useQueryClient();

  // Local induction state (separate from ChefOS)
  const getLocalState = () => {
    try {
      const raw = localStorage.getItem(BEV_SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { enabled: true, startDate: "" };
    } catch { return { enabled: true, startDate: "" }; }
  };

  const setLocalState = (updates: Record<string, any>) => {
    const current = getLocalState();
    localStorage.setItem(BEV_SETTINGS_KEY, JSON.stringify({ ...current, ...updates }));
  };

  const localState = getLocalState();

  useEffect(() => {
    if (localState.enabled && !localState.startDate && user) {
      setLocalState({ startDate: new Date().toISOString().split("T")[0] });
    }
  }, [localState.enabled, localState.startDate, user]);

  const currentDay = (() => {
    if (!localState.startDate) return 1;
    const start = new Date(localState.startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diff + 1, 1), 14);
  })();

  const { data: autoCounts } = useQuery({
    queryKey: ["bev-induction-auto-counts", currentOrg?.id],
    enabled: !!currentOrg?.id && localState.enabled,
    queryFn: async () => {
      const orgId = currentOrg!.id;
      const [
        { count: productCount },
        { count: specCount },
        { count: kegCount },
        { count: prepCount },
      ] = await Promise.all([
        supabase.from("bev_products" as any).select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("bev_cocktail_specs" as any).select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("bev_keg_tracking" as any).select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("bev_bar_prep" as any).select("*", { count: "exact", head: true }).eq("org_id", orgId),
      ]);

      const memberCount = memberships.filter(m => m.org_id === orgId && m.is_active).length;
      const hasProfile = !!(profile?.avatar_url || profile?.position);

      return {
        bev_day1_profile: hasProfile,
        bev_day2_products: (productCount || 0) >= 10,
        bev_day3_spec: (specCount || 0) > 0,
        bev_day4_stations: false,
        bev_day5_prep: (prepCount || 0) > 0,
        bev_day6_team: memberCount > 1,
        bev_day7_review: hasProfile && (productCount || 0) >= 10 && (specCount || 0) > 0,
        bev_day8_invoice: false,
        bev_day9_keg: (kegCount || 0) > 0,
        bev_day10_menu: false,
        bev_day11_equipment: false,
        bev_day12_cleaning: false,
        bev_day13_temps: false,
        bev_day14_workflow: false,
      };
    },
  });

  const { data: manualProgress } = useQuery({
    queryKey: ["bev-induction-progress", user?.id, currentOrg?.id],
    enabled: !!user?.id && !!currentOrg?.id && localState.enabled,
    queryFn: async () => {
      const { data } = await supabase
        .from("induction_progress" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("org_id", currentOrg!.id)
        .like("step_key", "bev_%");
      return (data || []) as unknown as Array<{ step_key: string; completed_at: string | null; skipped: boolean }>;
    },
  });

  const skipStep = useMutation({
    mutationFn: async (stepKey: string) => {
      await supabase.from("induction_progress" as any).upsert({
        user_id: user!.id,
        org_id: currentOrg!.id,
        step_key: stepKey,
        skipped: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,org_id,step_key" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bev-induction-progress"] }),
  });

  const isStepDone = (stepKey: string): boolean => {
    if (autoCounts && (autoCounts as any)[stepKey]) return true;
    const manual = manualProgress?.find(p => p.step_key === stepKey);
    return !!(manual?.completed_at || manual?.skipped);
  };

  const stepsWithStatus = BEV_INDUCTION_STEPS.map(step => ({
    ...step,
    done: isStepDone(step.key),
    skipped: manualProgress?.find(p => p.step_key === step.key)?.skipped || false,
  }));

  const completedCount = stepsWithStatus.filter(s => s.done).length;
  const percent = Math.round((completedCount / BEV_INDUCTION_STEPS.length) * 100);
  const todayStep = BEV_INDUCTION_STEPS.find(s => s.day === currentDay);

  return {
    steps: stepsWithStatus,
    currentDay,
    percent,
    completedCount,
    totalSteps: BEV_INDUCTION_STEPS.length,
    todayStep,
    skipStep: skipStep.mutate,
    isEnabled: localState.enabled,
    disable: () => setLocalState({ enabled: false }),
    enable: () => setLocalState({ enabled: true }),
    reset: () => {
      setLocalState({ startDate: new Date().toISOString().split("T")[0] });
      queryClient.invalidateQueries({ queryKey: ["bev-induction-progress"] });
    },
  };
};
