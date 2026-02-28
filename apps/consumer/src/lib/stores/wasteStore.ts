import { create } from "zustand";
import { supabase } from "../supabase";

export interface WasteEntry {
  id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  estimated_cost: number;
  reason: string | null;
  logged_at: string;
}

interface WasteState {
  entries: WasteEntry[];
  isLoading: boolean;

  fetchWaste: (since?: string) => Promise<void>;
  logWaste: (entry: Omit<WasteEntry, "id" | "logged_at">) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  totalWaste: () => number;
}

export const useWasteStore = create<WasteState>((set, get) => ({
  entries: [],
  isLoading: false,

  fetchWaste: async (since) => {
    set({ isLoading: true });
    let query = supabase
      .from("ds_waste_log")
      .select("id, item_name, quantity, unit, estimated_cost, reason, logged_at")
      .order("logged_at", { ascending: false });

    if (since) query = query.gte("logged_at", since);

    const { data, error } = await query;
    if (error) {
      console.warn("fetchWaste:", error.message);
    } else {
      set({ entries: (data ?? []) as WasteEntry[] });
    }
    set({ isLoading: false });
  },

  logWaste: async (entry) => {
    const tempId = `temp-${Date.now()}`;
    const temp: WasteEntry = {
      ...entry,
      id: tempId,
      logged_at: new Date().toISOString(),
    };
    set((s) => ({ entries: [temp, ...s.entries] }));

    const { data, error } = await supabase
      .from("ds_waste_log")
      .insert({
        item_name: entry.item_name,
        quantity: entry.quantity,
        unit: entry.unit,
        estimated_cost: entry.estimated_cost,
        reason: entry.reason,
      })
      .select()
      .single();

    if (error) {
      console.warn("logWaste:", error.message);
      set((s) => ({ entries: s.entries.filter((e) => e.id !== tempId) }));
    } else if (data) {
      set((s) => ({
        entries: s.entries.map((e) => (e.id === tempId ? (data as WasteEntry) : e)),
      }));
    }
  },

  removeEntry: async (id) => {
    const prev = get().entries;
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));

    const { error } = await supabase.from("ds_waste_log").delete().eq("id", id);
    if (error) {
      console.warn("removeEntry:", error.message);
      set({ entries: prev });
    }
  },

  totalWaste: () =>
    get().entries.reduce((sum, e) => sum + (e.estimated_cost ?? 0), 0),
}));
