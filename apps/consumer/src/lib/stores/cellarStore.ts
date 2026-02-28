import { create } from "zustand";
import { supabase } from "../supabase";

export interface CellarItem {
  id: string;
  user_id: string;
  wine_name: string;
  varietal: string;
  region?: string;
  vintage?: number;
  quantity: number;
  notes?: string;
  purchase_price?: number;
  photo_url?: string;
  created_at: string;
}

interface CellarStore {
  items: CellarItem[];
  isLoading: boolean;

  fetchCellar: () => Promise<void>;
  addItem: (item: Omit<CellarItem, "id" | "user_id" | "created_at">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<CellarItem>) => Promise<void>;
  getTotalBottles: () => number;
}

export const useCellarStore = create<CellarStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCellar: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("ds_cellar_items")
        .select("*")
        .order("wine_name");

      if (error) throw error;
      set({ items: data ?? [], isLoading: false });
    } catch (err) {
      console.error("fetchCellar error:", err);
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const tempId = `temp-${Date.now()}`;
    const tempItem = { ...item, id: tempId, user_id: "", created_at: new Date().toISOString() } as CellarItem;
    set((s) => ({ items: [...s.items, tempItem] }));

    try {
      const { data, error } = await supabase
        .from("ds_cellar_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      set((s) => ({ items: s.items.map((i) => (i.id === tempId ? data : i)) }));
    } catch (err) {
      console.error("addCellarItem error:", err);
      set((s) => ({ items: s.items.filter((i) => i.id !== tempId) }));
    }
  },

  removeItem: async (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));

    const { error } = await supabase.from("ds_cellar_items").delete().eq("id", id);
    if (error) {
      console.error("removeCellarItem error:", error);
      set({ items: prev });
    }
  },

  updateItem: async (id, updates) => {
    const prev = get().items;
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)) }));

    const { error } = await supabase.from("ds_cellar_items").update(updates).eq("id", id);
    if (error) {
      console.error("updateCellarItem error:", error);
      set({ items: prev });
    }
  },

  getTotalBottles: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
