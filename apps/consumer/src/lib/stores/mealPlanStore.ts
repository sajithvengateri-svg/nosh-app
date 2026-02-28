import { create } from "zustand";
import { supabase } from "../supabase";
import type { Recipe } from "./recipeStore";
import type { PantryItem } from "./pantryStore";
import type { SeedVendor } from "../../data/seedVendors";
import type { WeeklyPlanProposal, DayMode, PlanConstraints } from "../engines/weeklyPlanEngine";
import type { WeeklyShoppingList } from "../engines/weeklyShoppingEngine";
import { generateWeeklyPlan, swapDay } from "../engines/weeklyPlanEngine";
import { buildWeeklyTieredList } from "../engines/weeklyShoppingEngine";
import { getConstraints } from "../engines/personalityEngine";

export interface MealPlanEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: "dinner"; // can extend to "lunch", "breakfast"
  recipe_id?: string;
  notes?: string;
  // Joined recipe data
  recipe?: {
    title: string;
    hero_image_url?: string;
    cuisine: string;
    vessel: string;
    total_time_minutes: number;
  };
}

interface MealPlanStore {
  entries: MealPlanEntry[];
  isLoading: boolean;

  // Weekly plan generation
  planProposal: WeeklyPlanProposal | null;
  weeklyShoppingList: WeeklyShoppingList | null;
  isGenerating: boolean;
  dayModes: Record<number, DayMode>;

  fetchWeek: (startDate: string) => Promise<void>;
  setMeal: (date: string, recipeId: string) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  getEntry: (date: string) => MealPlanEntry | undefined;

  // Plan generation methods
  setDayMode: (dayOfWeek: number, mode: DayMode) => void;
  generatePlan: (
    recipes: Recipe[],
    pantryItems: PantryItem[],
    weekStartDate: string,
    personalityType: string,
    excludeRecipeIds?: string[],
  ) => void;
  swapPlanDay: (
    dayIndex: number,
    recipes: Recipe[],
    pantryItems: PantryItem[],
  ) => void;
  acceptPlan: () => Promise<void>;
  generateShoppingList: (
    recipes: Recipe[],
    pantryItems: PantryItem[],
    vendors: SeedVendor[],
  ) => void;
  clearProposal: () => void;

  // Autopilot (Nosh+)
  autoGeneratePlan: (
    recipes: Recipe[],
    pantryItems: PantryItem[],
    vendors: SeedVendor[],
    personalityType: string,
    weekStartDate: string,
  ) => Promise<void>;
}

function getWeekDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export const useMealPlanStore = create<MealPlanStore>((set, get) => ({
  entries: [],
  isLoading: false,
  planProposal: null,
  weeklyShoppingList: null,
  isGenerating: false,
  dayModes: {} as Record<number, DayMode>,

  fetchWeek: async (startDate) => {
    set({ isLoading: true });
    const dates = getWeekDates(startDate);
    const endDate = dates[dates.length - 1];

    try {
      const { data, error } = await supabase
        .from("ds_meal_plan")
        .select(`
          *,
          recipe:ds_recipes(title, hero_image_url, cuisine, vessel, total_time_minutes)
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date");

      if (error) throw error;
      set({ entries: data ?? [], isLoading: false });
    } catch (err) {
      console.error("fetchMealPlan error:", err);
      set({ isLoading: false });
    }
  },

  setMeal: async (date, recipeId) => {
    // Upsert — remove existing entry for that date then insert
    const existing = get().entries.find((e) => e.date === date);
    if (existing) {
      await supabase.from("ds_meal_plan").delete().eq("id", existing.id);
    }

    const tempId = `temp-${Date.now()}`;
    const temp: MealPlanEntry = {
      id: tempId,
      user_id: "",
      date,
      meal_type: "dinner",
      recipe_id: recipeId,
    };
    set((s) => ({
      entries: [...s.entries.filter((e) => e.date !== date), temp],
    }));

    try {
      const { data, error } = await supabase
        .from("ds_meal_plan")
        .insert({ date, meal_type: "dinner", recipe_id: recipeId })
        .select(`
          *,
          recipe:ds_recipes(title, hero_image_url, cuisine, vessel, total_time_minutes)
        `)
        .single();

      if (error) throw error;
      set((s) => ({
        entries: s.entries.map((e) => (e.id === tempId ? data : e)),
      }));

      // Signal enrichment — personality engine
      const dayOfWeek = new Date(date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const { usePersonalityStore } = await import("./personalityStore");
      usePersonalityStore.getState().logSignal("meal_planned", JSON.stringify({
        recipeId,
        date,
        isWeekend,
      }));
    } catch (err) {
      console.error("setMeal error:", err);
      set((s) => ({ entries: s.entries.filter((e) => e.id !== tempId) }));
    }
  },

  removeMeal: async (id) => {
    const prev = get().entries;
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));

    const { error } = await supabase.from("ds_meal_plan").delete().eq("id", id);
    if (error) {
      console.error("removeMeal error:", error);
      set({ entries: prev });
    }
  },

  getEntry: (date) => get().entries.find((e) => e.date === date),

  // ── Plan Generation ───────────────────────────────────────────

  setDayMode: (dayOfWeek, mode) => {
    set((s) => ({
      dayModes: { ...s.dayModes, [dayOfWeek]: mode },
    }));
  },

  generatePlan: (recipes, pantryItems, weekStartDate, personalityType, excludeRecipeIds = []) => {
    set({ isGenerating: true });

    const pType = personalityType as import("../engines/personalityEngine").PersonalityType;
    const constraints: PlanConstraints = {
      personalityType: pType,
      personalityConstraints: getConstraints(pType),
      dayModes: get().dayModes,
      excludeRecipeIds,
    };

    const proposal = generateWeeklyPlan(recipes, pantryItems, constraints, weekStartDate);
    set({ planProposal: proposal, isGenerating: false });
  },

  swapPlanDay: (dayIndex, recipes, pantryItems) => {
    const { planProposal } = get();
    if (!planProposal) return;

    // Rebuild constraints from current state
    const { usePersonalityStore } = require("./personalityStore");
    const profile = usePersonalityStore.getState().profile;
    const pType = profile?.primary ?? "humpday_nosher";

    const constraints: PlanConstraints = {
      personalityType: pType,
      personalityConstraints: getConstraints(pType),
      dayModes: get().dayModes,
      excludeRecipeIds: [],
    };

    const updated = swapDay(planProposal, dayIndex, recipes, pantryItems, constraints);
    set({ planProposal: updated });
  },

  acceptPlan: async () => {
    const { planProposal, entries } = get();
    if (!planProposal) return;

    // Set each day's recipe as a meal plan entry
    for (const day of planProposal.days) {
      if (!day.recipe) continue;

      const existing = entries.find((e) => e.date === day.date);
      if (existing) {
        await supabase.from("ds_meal_plan").delete().eq("id", existing.id);
      }

      try {
        const { data } = await supabase
          .from("ds_meal_plan")
          .insert({
            date: day.date,
            meal_type: "dinner",
            recipe_id: day.recipe.id,
          })
          .select(`
            *,
            recipe:ds_recipes(title, hero_image_url, cuisine, vessel, total_time_minutes)
          `)
          .single();

        if (data) {
          set((s) => ({
            entries: [
              ...s.entries.filter((e) => e.date !== day.date),
              data,
            ],
          }));
        }
      } catch (err) {
        console.error("acceptPlan insert error:", err);
      }
    }

    // Persist weekly plan to ds_weekly_plans
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const { data: plan } = await supabase
          .from("ds_weekly_plans")
          .insert({
            user_id: userId,
            week_start_date: planProposal.days[0]?.date,
            total_estimated_cost: planProposal.totalEstimatedCost,
            pantry_utilisation: planProposal.pantryUtilisation,
            status: "accepted",
          })
          .select("id")
          .single();

        if (plan) {
          for (const day of planProposal.days) {
            if (!day.recipe) continue;
            await supabase.from("ds_weekly_plan_days").insert({
              plan_id: plan.id,
              day_of_week: day.dayOfWeek,
              date: day.date,
              day_mode: day.dayMode,
              recipe_id: day.recipe.id,
              score: day.score,
            });
          }
        }
      }
    } catch (err) {
      console.error("acceptPlan persist error:", err);
    }

    set({ planProposal: null });
  },

  generateShoppingList: (recipes, pantryItems, vendors) => {
    const { planProposal } = get();
    if (!planProposal) return;

    const planRecipes = planProposal.days
      .filter((d) => d.recipe)
      .map((d) => d.recipe!);

    // Merge plan recipes with full recipe data (ingredients may not be on plan recipe)
    const fullRecipes = planRecipes.map((pr) => {
      const full = recipes.find((r) => r.id === pr.id);
      return full ?? pr;
    });

    const list = buildWeeklyTieredList(fullRecipes, pantryItems, vendors);
    set({ weeklyShoppingList: list });
  },

  clearProposal: () => {
    set({ planProposal: null, weeklyShoppingList: null, isGenerating: false });
  },

  /**
   * Autopilot: generates, accepts, and builds shopping list in one shot.
   * Used by Nosh+ weekly autopilot trigger.
   */
  autoGeneratePlan: async (recipes, pantryItems, vendors, personalityType, weekStartDate) => {
    const store = get();
    // Generate
    store.generatePlan(recipes, pantryItems, weekStartDate, personalityType);
    // Accept
    await store.acceptPlan();
    // Build shopping list
    store.generateShoppingList(recipes, pantryItems, vendors);
  },
}));
