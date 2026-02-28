import { create } from "zustand";
import { supabase } from "../supabase";
import { SEED_RECIPES } from "../../data/seedRecipes";
import type { RecipePersonalityTags } from "../engines/personalityEngine";

// ── Types ──────────────────────────────────────────────────────────

export interface Recipe {
  id: string;
  chef_id?: string;
  collection_id?: string;
  title: string;
  slug: string;
  description?: string;
  hero_image_url?: string;
  vessel: "pot" | "pan" | "tray" | "bowl" | "slow_cooker" | "appliance";
  cuisine: string;
  total_time_minutes: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  serves: number;
  cost_per_serve?: number;
  difficulty: number;
  spice_level: number;
  adventure_level: number;
  dietary_tags: string[];
  season_tags: string[];
  source_type: string;
  tips: string[];
  storage_notes?: string;
  leftover_ideas: string[];
  likes_count: number;
  cooked_count: number;
  avg_rating: number;
  is_published: boolean;
  personality_tags?: RecipePersonalityTags;
  // Joined data
  chef_name?: string;
  ingredients?: RecipeIngredient[];
  workflow_cards?: WorkflowCard[];
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  is_pantry_staple: boolean;
  sort_order: number;
  supermarket_section?: string;
  estimated_cost?: number;
}

export interface WorkflowCard {
  id: string;
  recipe_id: string;
  card_number: number;
  title: string;
  photo_url?: string;
  instructions: string[];
  success_marker?: string;
  timer_seconds?: number;
  parallel_task?: string;
  video_url?: string;
  // Infographic fields
  card_type?: "prep" | "technique" | "simmer" | "finish" | "serve";
  heat_level?: number;          // 0=off, 1=low, 2=medium, 3=high
  technique_icon?: string;
  ingredients_used?: { name: string; qty?: string; action?: string }[];
  pro_tip?: string;
}

// ── Store ──────────────────────────────────────────────────────────

interface RecipeStore {
  recipes: Recipe[];
  isLoading: boolean;
  lastSyncedAt: number | null;

  fetchRecipes: () => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
  getRecipeWithDetails: (id: string) => Promise<Recipe | null>;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  isLoading: false,
  lastSyncedAt: null,

  fetchRecipes: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("ds_recipes")
        .select(`
          *,
          chef:ds_chefs(name)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const recipes = (data ?? []).map((r: any) => ({
        ...r,
        chef_name: r.chef?.name ?? null,
      }));

      // Fall back to seed recipes when DB is empty or unreachable
      set({
        recipes: recipes.length > 0 ? recipes : SEED_RECIPES,
        isLoading: false,
        lastSyncedAt: Date.now(),
      });
    } catch (err) {
      console.error("fetchRecipes error:", err);
      // Use seed data as fallback so the feed always has content
      set({ recipes: SEED_RECIPES, isLoading: false });
    }
  },

  getRecipe: (id) => get().recipes.find((r) => r.id === id),

  getRecipeWithDetails: async (id) => {
    // Check seed data first (works offline / no DB)
    const seed = SEED_RECIPES.find((r) => r.id === id);

    try {
      const { data, error } = await supabase
        .from("ds_recipes")
        .select(`
          *,
          chef:ds_chefs(name, slug, avatar_url),
          ingredients:ds_recipe_ingredients(*),
          workflow_cards:ds_recipe_workflow_cards(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        ...data,
        chef_name: data.chef?.name ?? null,
        ingredients: (data.ingredients ?? []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        ),
        workflow_cards: (data.workflow_cards ?? []).sort(
          (a: any, b: any) => a.card_number - b.card_number
        ),
      } as Recipe;
    } catch (err) {
      console.error("getRecipeWithDetails error:", err);
      // Fall back to seed recipe (already has ingredients + workflow_cards)
      return seed ?? null;
    }
  },
}));
