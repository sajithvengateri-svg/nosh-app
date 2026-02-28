import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface ShoppingItem {
  id: string;
  name: string;
  supplier: string | null;
  quantity_needed: number;
  unit: string | null;
  par_level: number | null;
  current_stock: number | null;
  cost_per_unit: number | null;
  checked: boolean;
  /** "ingredient" = auto-generated from low stock, "manual" = user-added */
  source: "ingredient" | "manual";
  ingredient_id?: string;
}

interface GroupedItems {
  supplier: string;
  items: ShoppingItem[];
}

export function useShoppingList() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // Manual items stored in local state (not persisted to DB)
  const [manualItems, setManualItems] = useState<ShoppingItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Fetch low-stock ingredients
  const { data: lowStockIngredients, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["shopping-low-stock", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, supplier, current_stock, par_level, unit, cost_per_unit")
        .eq("org_id", orgId)
        .not("par_level", "is", null)
        .order("name");
      if (error) throw error;
      // Filter to only items below par level
      return (data || []).filter(
        (item: any) => item.par_level != null && (item.current_stock ?? 0) < item.par_level
      );
    },
    enabled: !!orgId,
  });

  // Build shopping items from low-stock ingredients
  const ingredientItems: ShoppingItem[] = useMemo(() => {
    if (!lowStockIngredients) return [];
    return lowStockIngredients.map((ing: any) => ({
      id: `ing-${ing.id}`,
      name: ing.name,
      supplier: ing.supplier || null,
      quantity_needed: Math.max(0, (ing.par_level || 0) - (ing.current_stock || 0)),
      unit: ing.unit || null,
      par_level: ing.par_level,
      current_stock: ing.current_stock ?? 0,
      cost_per_unit: ing.cost_per_unit ?? null,
      checked: checkedIds.has(`ing-${ing.id}`),
      source: "ingredient" as const,
      ingredient_id: ing.id,
    }));
  }, [lowStockIngredients, checkedIds]);

  // All items combined
  const allItems = useMemo(() => {
    return [...ingredientItems, ...manualItems.map((m) => ({ ...m, checked: checkedIds.has(m.id) }))];
  }, [ingredientItems, manualItems, checkedIds]);

  // Group by supplier
  const grouped: GroupedItems[] = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>();
    for (const item of allItems) {
      const key = item.supplier || "No Supplier";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === "No Supplier") return 1;
        if (b === "No Supplier") return -1;
        return a.localeCompare(b);
      })
      .map(([supplier, items]) => ({ supplier, items }));
  }, [allItems]);

  const totalItems = allItems.length;
  const checkedCount = allItems.filter((i) => i.checked).length;

  const toggleItem = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addManualItem = useCallback((name: string, quantity: string, supplier: string | null) => {
    const item: ShoppingItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      supplier,
      quantity_needed: parseFloat(quantity) || 1,
      unit: null,
      par_level: null,
      current_stock: null,
      cost_per_unit: null,
      checked: false,
      source: "manual",
    };
    setManualItems((prev) => [...prev, item]);
  }, []);

  const clearCompleted = useCallback(() => {
    // Remove checked manual items
    setManualItems((prev) => prev.filter((m) => !checkedIds.has(m.id)));
    // Clear all checked IDs
    setCheckedIds(new Set());
  }, [checkedIds]);

  const removeItem = useCallback((id: string) => {
    setManualItems((prev) => prev.filter((m) => m.id !== id));
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    grouped,
    allItems,
    totalItems,
    checkedCount,
    isLoading,
    isRefetching,
    refetch,
    toggleItem,
    addManualItem,
    clearCompleted,
    removeItem,
  };
}
