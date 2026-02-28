import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useEffect } from "react";

export interface InductionStep {
  key: string;
  day: number;
  week: 1 | 2;
  label: string;
  description: string;
  href: string;
  icon: string;
}

export const INDUCTION_STEPS: InductionStep[] = [
  // Week 1: Foundation
  { key: "day1_profile", day: 1, week: 1, label: "Welcome & Setup", description: "Complete profile, set up org details, add venues", href: "/settings", icon: "User" },
  { key: "day2_recipe", day: 2, week: 1, label: "Your First Recipe", description: "Create or import 1 recipe", href: "/recipes", icon: "ChefHat" },
  { key: "day3_pantry", day: 3, week: 1, label: "Build Your Pantry", description: "Add 10+ ingredients with costs and suppliers", href: "/ingredients", icon: "Package" },
  { key: "day4_sections", day: 4, week: 1, label: "Kitchen Sections", description: "Create sections (Hot, Cold, Pastry) and assign team", href: "/kitchen-sections", icon: "LayoutGrid" },
  { key: "day5_prep", day: 5, week: 1, label: "Prep List Templates", description: "Set up section prep templates with par levels", href: "/prep", icon: "ClipboardCheck" },
  { key: "day6_team", day: 6, week: 1, label: "Team & Roles", description: "Invite team members, assign roles and sections", href: "/team", icon: "Users" },
  { key: "day7_review", day: 7, week: 1, label: "Review & Catch-up", description: "Complete any missed steps, explore settings", href: "/settings", icon: "CheckCircle2" },
  // Week 2: Advanced
  { key: "day8_invoice", day: 8, week: 2, label: "Scan Your First Invoice", description: "Snap a photo of a supplier invoice", href: "/invoices", icon: "Receipt" },
  { key: "day9_yield", day: 9, week: 2, label: "Yield Testing", description: "Log a yield test (butchery, fish, batch)", href: "/production", icon: "FlaskConical" },
  { key: "day10_menu", day: 10, week: 2, label: "Menu Upload", description: "Upload or create a menu, link recipes", href: "/menu-engineering", icon: "BookOpen" },
  { key: "day11_equipment", day: 11, week: 2, label: "Equipment & Smallwares", description: "Log plates, cutlery, equipment counts", href: "/inventory", icon: "Utensils" },
  { key: "day12_cleaning", day: 12, week: 2, label: "Cleaning Inventory", description: "Add cleaning materials and chemicals", href: "/inventory", icon: "SprayCan" },
  { key: "day13_safety", day: 13, week: 2, label: "Food Safety Setup", description: "Set up CCP points and temperature logs", href: "/food-safety", icon: "ShieldCheck" },
  { key: "day14_workflow", day: 14, week: 2, label: "Daily Workflow", description: "Run through a full day (prep, service, nightly count)", href: "/prep", icon: "CalendarCheck" },
];

export const useInduction = () => {
  const { user, profile } = useAuth();
  const { currentOrg, venues, memberships } = useOrg();
  const { settings, updateSettings } = useAppSettings();
  const queryClient = useQueryClient();

  // Set induction start date on first use
  useEffect(() => {
    if (settings.inductionEnabled && !settings.inductionStartDate && user) {
      updateSettings({ inductionStartDate: new Date().toISOString().split("T")[0] });
    }
  }, [settings.inductionEnabled, settings.inductionStartDate, user]);

  const currentDay = (() => {
    if (!settings.inductionStartDate) return 1;
    const start = new Date(settings.inductionStartDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diff + 1, 1), 14);
  })();

  // Fetch auto-completion counts
  const { data: autoCounts } = useQuery({
    queryKey: ["induction-auto-counts", currentOrg?.id],
    enabled: !!currentOrg?.id && settings.inductionEnabled,
    queryFn: async () => {
      const orgId = currentOrg!.id;
      const [
        { count: recipeCount },
        { count: ingredientCount },
        { count: sectionCount },
        { count: prepTemplateCount },
        { count: invoiceCount },
        { count: menuCount },
        { count: equipmentCount },
        { count: cleaningCount },
        { count: nightlyCount },
      ] = await Promise.all([
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("ingredients").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("kitchen_sections").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("section_stock_templates" as any).select("*", { count: "exact", head: true }),
        supabase.from("invoice_scans").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("menus").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("equipment_inventory").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("cleaning_inventory").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("nightly_stock_counts").select("*", { count: "exact", head: true }).eq("org_id", orgId),
      ]);

      const memberCount = memberships.filter(m => m.org_id === orgId && m.is_active).length;
      const hasProfile = !!(profile?.avatar_url || profile?.position);

      return {
        day1_profile: hasProfile && venues.length > 0,
        day2_recipe: (recipeCount || 0) > 0,
        day3_pantry: (ingredientCount || 0) >= 10,
        day4_sections: (sectionCount || 0) > 0,
        day5_prep: (prepTemplateCount || 0) > 0,
        day6_team: memberCount > 1,
        day7_review: hasProfile && (recipeCount || 0) > 0 && (ingredientCount || 0) >= 10,
        day8_invoice: (invoiceCount || 0) > 0,
        day9_yield: false, // No yield_tests table yet
        day10_menu: (menuCount || 0) > 0,
        day11_equipment: (equipmentCount || 0) > 0,
        day12_cleaning: (cleaningCount || 0) > 0,
        day13_safety: false, // Manual for now
        day14_workflow: (nightlyCount || 0) > 0,
      };
    },
  });

  // Fetch manual skip/complete records from DB
  const { data: manualProgress } = useQuery({
    queryKey: ["induction-progress", user?.id, currentOrg?.id],
    enabled: !!user?.id && !!currentOrg?.id && settings.inductionEnabled,
    queryFn: async () => {
      const { data } = await supabase
        .from("induction_progress" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("org_id", currentOrg!.id);
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["induction-progress"] }),
  });

  const isStepDone = (stepKey: string): boolean => {
    // Check auto-completion
    if (autoCounts && (autoCounts as any)[stepKey]) return true;
    // Check manual progress
    const manual = manualProgress?.find(p => p.step_key === stepKey);
    return !!(manual?.completed_at || manual?.skipped);
  };

  const stepsWithStatus = INDUCTION_STEPS.map(step => ({
    ...step,
    done: isStepDone(step.key),
    skipped: manualProgress?.find(p => p.step_key === step.key)?.skipped || false,
  }));

  const completedCount = stepsWithStatus.filter(s => s.done).length;
  const percent = Math.round((completedCount / INDUCTION_STEPS.length) * 100);
  const todayStep = INDUCTION_STEPS.find(s => s.day === currentDay);

  return {
    steps: stepsWithStatus,
    currentDay,
    percent,
    completedCount,
    totalSteps: INDUCTION_STEPS.length,
    todayStep,
    skipStep: skipStep.mutate,
    isEnabled: settings.inductionEnabled,
    showDailyWorkflow: settings.showDailyWorkflow,
    disable: () => updateSettings({ inductionEnabled: false }),
    enable: () => updateSettings({ inductionEnabled: true }),
    reset: () => {
      updateSettings({ inductionStartDate: new Date().toISOString().split("T")[0] });
      queryClient.invalidateQueries({ queryKey: ["induction-progress"] });
    },
  };
};
