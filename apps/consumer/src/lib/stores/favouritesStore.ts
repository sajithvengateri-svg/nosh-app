import { create } from "zustand";
import { supabase } from "../supabase";

export interface Favourite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
  // Joined recipe data
  recipe?: {
    title: string;
    hero_image_url?: string;
    cuisine: string;
    vessel: string;
    total_time_minutes: number;
  };
}

export interface CookLogEntry {
  id: string;
  user_id: string;
  recipe_id: string;
  rating?: number;
  notes?: string;
  photo_url?: string;
  cooked_at: string;
  // Joined recipe data
  recipe?: {
    title: string;
    hero_image_url?: string;
    cuisine: string;
    vessel: string;
    total_time_minutes: number;
  };
}

interface FavouritesStore {
  favourites: Favourite[];
  cookLog: CookLogEntry[];
  isLoading: boolean;

  fetchFavourites: () => Promise<void>;
  fetchCookLog: () => Promise<void>;
  addFavourite: (recipeId: string) => Promise<void>;
  removeFavourite: (recipeId: string) => Promise<void>;
  isFavourited: (recipeId: string) => boolean;
}

export const useFavouritesStore = create<FavouritesStore>((set, get) => ({
  favourites: [],
  cookLog: [],
  isLoading: false,

  fetchFavourites: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("ds_favourites")
        .select(`
          *,
          recipe:ds_recipes(title, hero_image_url, cuisine, vessel, total_time_minutes)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ favourites: data ?? [], isLoading: false });
    } catch (err) {
      console.error("fetchFavourites error:", err);
      set({ isLoading: false });
    }
  },

  fetchCookLog: async () => {
    try {
      const { data, error } = await supabase
        .from("ds_cook_log")
        .select(`
          *,
          recipe:ds_recipes(title, hero_image_url, cuisine, vessel, total_time_minutes)
        `)
        .order("cooked_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      set({ cookLog: data ?? [] });
    } catch (err) {
      console.error("fetchCookLog error:", err);
    }
  },

  addFavourite: async (recipeId) => {
    const tempId = `temp-${Date.now()}`;
    const temp: Favourite = {
      id: tempId,
      user_id: "",
      recipe_id: recipeId,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ favourites: [temp, ...s.favourites] }));

    try {
      const { data, error } = await supabase
        .from("ds_favourites")
        .insert({ recipe_id: recipeId })
        .select(`
          *,
          recipe:ds_recipes(title, hero_image_url, cuisine, vessel, total_time_minutes)
        `)
        .single();

      if (error) throw error;
      set((s) => ({ favourites: s.favourites.map((f) => (f.id === tempId ? data : f)) }));

      // Signal enrichment — personality engine
      const { usePersonalityStore } = await import("./personalityStore");
      usePersonalityStore.getState().logSignal("recipe_favourited", JSON.stringify({
        recipeId,
        cuisine: data?.recipe?.cuisine,
        cookTime: data?.recipe?.total_time_minutes,
      }));
    } catch (err) {
      console.error("addFavourite error:", err);
      set((s) => ({ favourites: s.favourites.filter((f) => f.id !== tempId) }));
    }
  },

  removeFavourite: async (recipeId) => {
    const prev = get().favourites;
    set((s) => ({ favourites: s.favourites.filter((f) => f.recipe_id !== recipeId) }));

    const { error } = await supabase
      .from("ds_favourites")
      .delete()
      .eq("recipe_id", recipeId);

    if (error) {
      console.error("removeFavourite error:", error);
      set({ favourites: prev });
    }
  },

  isFavourited: (recipeId) => get().favourites.some((f) => f.recipe_id === recipeId),
}));
