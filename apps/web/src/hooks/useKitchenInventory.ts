import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface KitchenInventoryItem {
  id: string;
  org_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  par_level: number;
  condition: string;
  location: string;
  supplier: string | null;
  cost_per_unit: number;
  notes: string | null;
  last_counted: string | null;
}

export const CROCKERY_CATEGORIES = ["Plates", "Glassware", "Trays", "Linen"];
export const SMALLWARES_CATEGORIES = [
  "Cutlery", "Utensils", "Pots and Pans", "Knives", "Thermometers", "Small Appliances",
];
const CONDITIONS = ["good", "chipped", "replace"] as const;
const UNITS = ["each", "set", "dozen", "box"] as const;

export { CONDITIONS, UNITS };

// ── Fetch items by category group ────────────────────────────────
export function useKitchenInventory(categoryGroup: "crockery" | "smallwares") {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const categories = categoryGroup === "crockery" ? CROCKERY_CATEGORIES : SMALLWARES_CATEGORIES;

  const { data, isLoading, error } = useQuery<KitchenInventoryItem[]>({
    queryKey: ["kitchen-inventory", orgId, categoryGroup],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("equipment_inventory")
        .select("*")
        .eq("org_id", orgId)
        .in("category", categories)
        .order("category, name" as any);
      if (error) throw error;
      return (data ?? []) as KitchenInventoryItem[];
    },
    enabled: !!orgId,
  });

  return { items: data ?? [], isLoading, error, categories };
}

// ── Save item ────────────────────────────────────────────────────
export function useSaveKitchenItem() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      id?: string;
      name: string;
      category: string;
      quantity: number;
      unit: string;
      par_level: number;
      condition: string;
      location: string;
      supplier?: string;
      cost_per_unit: number;
      notes?: string;
    }) => {
      const orgId = currentOrg?.id;
      if (!orgId) throw new Error("No org");

      const row = {
        org_id: orgId,
        name: values.name,
        category: values.category,
        quantity: values.quantity,
        unit: values.unit,
        par_level: values.par_level,
        condition: values.condition,
        location: values.location,
        supplier: values.supplier || null,
        cost_per_unit: values.cost_per_unit,
        notes: values.notes || null,
        last_counted: new Date().toISOString().split("T")[0],
      };

      if (values.id) {
        const { error } = await supabase.from("equipment_inventory").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment_inventory").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-inventory"] });
    },
  });
}

// ── Delete item ──────────────────────────────────────────────────
export function useDeleteKitchenItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment_inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-inventory"] });
    },
  });
}

// ── Inventory summary stats ──────────────────────────────────────
export function useKitchenInventorySummary(categoryGroup: "crockery" | "smallwares") {
  const { items } = useKitchenInventory(categoryGroup);

  const totalItems = items.length;
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.cost_per_unit), 0);
  const belowPar = items.filter((i) => i.par_level > 0 && i.quantity < i.par_level);
  const needReplace = items.filter((i) => i.condition === "replace");

  return { totalItems, totalValue, belowPar, needReplace };
}
