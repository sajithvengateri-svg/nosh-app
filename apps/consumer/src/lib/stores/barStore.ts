import { create } from "zustand";
import { supabase } from "../supabase";

export interface BarItem {
  id: string;
  user_id: string;
  spirit_name: string;
  category: string; // gin, whiskey, rum, vodka, tequila, liqueur, mixer, bitters, other
  brand?: string;
  quantity_ml?: number;
  photo_url?: string;
  created_at: string;
}

interface BarStore {
  items: BarItem[];
  isLoading: boolean;

  fetchBar: () => Promise<void>;
  addItem: (item: Omit<BarItem, "id" | "user_id" | "created_at">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<BarItem>) => Promise<void>;
  getCategories: () => string[];
}

export const useBarStore = create<BarStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchBar: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("ds_bar_items")
        .select("*")
        .order("category, spirit_name");

      if (error) throw error;
      set({ items: data ?? [], isLoading: false });
    } catch (err) {
      console.error("fetchBar error:", err);
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const tempId = `temp-${Date.now()}`;
    const tempItem = { ...item, id: tempId, user_id: "", created_at: new Date().toISOString() } as BarItem;
    set((s) => ({ items: [...s.items, tempItem] }));

    try {
      const { data, error } = await supabase
        .from("ds_bar_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      set((s) => ({ items: s.items.map((i) => (i.id === tempId ? data : i)) }));
    } catch (err) {
      console.error("addBarItem error:", err);
      set((s) => ({ items: s.items.filter((i) => i.id !== tempId) }));
    }
  },

  removeItem: async (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));

    const { error } = await supabase.from("ds_bar_items").delete().eq("id", id);
    if (error) {
      console.error("removeBarItem error:", error);
      set({ items: prev });
    }
  },

  updateItem: async (id, updates) => {
    const prev = get().items;
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)) }));

    const { error } = await supabase.from("ds_bar_items").update(updates).eq("id", id);
    if (error) {
      console.error("updateBarItem error:", error);
      set({ items: prev });
    }
  },

  getCategories: () => [...new Set(get().items.map((i) => i.category))].sort(),
}));
