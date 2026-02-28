import { create } from "zustand";
import { supabase } from "../supabase";

// ── Types ──────────────────────────────────────────────────────────

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  expiry_date?: string;
  added_via: "manual" | "camera_scan" | "barcode" | "receipt";
  created_at: string;
  updated_at: string;
}

// ── Store (local-first, syncs to Supabase) ────────────────────────

interface PantryStore {
  items: PantryItem[];
  isLoading: boolean;

  fetchPantry: () => Promise<void>;
  addItem: (item: Omit<PantryItem, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<PantryItem>) => Promise<void>;

  // Pantry match: check how many of a recipe's ingredients the user has
  getPantryMatch: (ingredientNames: string[]) => { have: number; total: number; missing: string[] };

  // Expiring items
  getExpiringItems: (daysAhead?: number) => PantryItem[];
}

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, "");
}

export const usePantryStore = create<PantryStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchPantry: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("ds_pantry_items")
        .select("*")
        .order("name");

      if (error) throw error;
      set({ items: data ?? [], isLoading: false });
    } catch (err) {
      console.error("fetchPantry error:", err);
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    // Optimistic local add
    const tempId = `temp-${Date.now()}`;
    const tempItem = { ...item, id: tempId, user_id: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as PantryItem;
    set((s) => ({ items: [...s.items, tempItem] }));

    try {
      const { data, error } = await supabase
        .from("ds_pantry_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      // Replace temp with real
      set((s) => ({ items: s.items.map((i) => (i.id === tempId ? data : i)) }));
    } catch (err) {
      console.error("addItem error:", err);
      // Rollback
      set((s) => ({ items: s.items.filter((i) => i.id !== tempId) }));
    }
  },

  removeItem: async (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));

    const { error } = await supabase.from("ds_pantry_items").delete().eq("id", id);
    if (error) {
      console.error("removeItem error:", error);
      set({ items: prev });
    }
  },

  updateItem: async (id, updates) => {
    const prev = get().items;
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)) }));

    const { error } = await supabase.from("ds_pantry_items").update(updates).eq("id", id);
    if (error) {
      console.error("updateItem error:", error);
      set({ items: prev });
    }
  },

  getPantryMatch: (ingredientNames) => {
    const pantryNormalised = new Set(get().items.map((i) => normalise(i.name)));
    const missing: string[] = [];
    let have = 0;

    for (const name of ingredientNames) {
      if (pantryNormalised.has(normalise(name))) {
        have++;
      } else {
        missing.push(name);
      }
    }

    return { have, total: ingredientNames.length, missing };
  },

  getExpiringItems: (daysAhead = 3) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    return get()
      .items.filter((i) => i.expiry_date && i.expiry_date <= cutoffStr)
      .sort((a, b) => (a.expiry_date ?? "").localeCompare(b.expiry_date ?? ""));
  },
}));
