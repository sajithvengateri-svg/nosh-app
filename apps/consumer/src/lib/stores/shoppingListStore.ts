import { create } from "zustand";
import { supabase } from "../supabase";

export interface ShoppingListItem {
  id: string;
  user_id: string;
  name: string;
  quantity?: string;
  unit?: string;
  supermarket_section?: string; // supermarket aisle: "produce", "dairy", "meat", etc.
  source_recipe_id?: string; // which recipe added this
  is_checked: boolean;
  created_at: string;
}

interface ShoppingListStore {
  items: ShoppingListItem[];
  isLoading: boolean;

  fetchList: () => Promise<void>;
  addItem: (item: { name: string; quantity?: string; unit?: string; supermarket_section?: string; source_recipe_id?: string }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  getGroupedBySection: () => Record<string, ShoppingListItem[]>;
}

export const useShoppingListStore = create<ShoppingListStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchList: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("ds_shopping_list")
        .select("*")
        .order("supermarket_section, name");

      if (error) throw error;
      set({ items: data ?? [], isLoading: false });
    } catch (err) {
      console.error("fetchShoppingList error:", err);
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const tempId = `temp-${Date.now()}`;
    const temp: ShoppingListItem = {
      ...item,
      id: tempId,
      user_id: "",
      is_checked: false,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ items: [...s.items, temp] }));

    try {
      const { data, error } = await supabase
        .from("ds_shopping_list")
        .insert({ ...item, is_checked: false })
        .select()
        .single();

      if (error) throw error;
      set((s) => ({ items: s.items.map((i) => (i.id === tempId ? data : i)) }));
    } catch (err) {
      console.error("addShoppingItem error:", err);
      set((s) => ({ items: s.items.filter((i) => i.id !== tempId) }));
    }
  },

  removeItem: async (id) => {
    const prev = get().items;
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));

    const { error } = await supabase.from("ds_shopping_list").delete().eq("id", id);
    if (error) {
      console.error("removeShoppingItem error:", error);
      set({ items: prev });
    }
  },

  toggleItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const newChecked = !item.is_checked;
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, is_checked: newChecked } : i)),
    }));

    const { error } = await supabase
      .from("ds_shopping_list")
      .update({ is_checked: newChecked })
      .eq("id", id);

    if (error) {
      console.error("toggleShoppingItem error:", error);
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, is_checked: !newChecked } : i)),
      }));
    }
  },

  clearChecked: async () => {
    const checked = get().items.filter((i) => i.is_checked);
    if (checked.length === 0) return;

    const prev = get().items;
    set((s) => ({ items: s.items.filter((i) => !i.is_checked) }));

    const { error } = await supabase
      .from("ds_shopping_list")
      .delete()
      .in("id", checked.map((i) => i.id));

    if (error) {
      console.error("clearChecked error:", error);
      set({ items: prev });
    }
  },

  getGroupedBySection: () => {
    const groups: Record<string, ShoppingListItem[]> = {};
    for (const item of get().items) {
      const section = item.supermarket_section ?? "Other";
      if (!groups[section]) groups[section] = [];
      groups[section].push(item);
    }
    return groups;
  },
}));
