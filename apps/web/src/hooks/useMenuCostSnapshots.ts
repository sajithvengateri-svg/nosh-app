import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrgId";
import { toast } from "sonner";

export interface CostSnapshot {
  id: string;
  menuId: string | null;
  menuItemId: string | null;
  dishName: string;
  sellPrice: number;
  foodCost: number;
  fcPercent: number;
  snapshotDate: Date;
  orgId: string;
}

function dbToSnapshot(row: any): CostSnapshot {
  return {
    id: row.id,
    menuId: row.menu_id,
    menuItemId: row.menu_item_id,
    dishName: row.dish_name,
    sellPrice: Number(row.sell_price) || 0,
    foodCost: Number(row.food_cost) || 0,
    fcPercent: Number(row.fc_percent) || 0,
    snapshotDate: new Date(row.snapshot_date),
    orgId: row.org_id,
  };
}

export function useMenuCostSnapshots() {
  const queryClient = useQueryClient();
  const orgId = useOrgId();

  // Fetch all snapshots for the org
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["menu-cost-snapshots", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("menu_cost_snapshots")
        .select("*")
        .eq("org_id", orgId)
        .order("snapshot_date", { ascending: false });
      if (error) throw error;
      return (data || []).map(dbToSnapshot);
    },
    enabled: !!orgId,
  });

  // Snapshot all items from a menu before archiving
  const snapshotMenuCostsMutation = useMutation({
    mutationFn: async ({ menuId, items }: {
      menuId: string;
      items: { id: string; name: string; sellPrice: number; foodCost: number; foodCostPercent: number }[];
    }) => {
      if (!orgId || items.length === 0) return;
      const rows = items.map(item => ({
        menu_id: menuId,
        menu_item_id: item.id,
        dish_name: item.name,
        sell_price: item.sellPrice,
        food_cost: item.foodCost,
        fc_percent: item.foodCostPercent,
        org_id: orgId,
      }));
      const { error } = await supabase.from("menu_cost_snapshots").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-cost-snapshots"] });
    },
    onError: (err) => {
      console.error("Snapshot error:", err);
      toast.error("Failed to save cost snapshot");
    },
  });

  // Get trend data for a specific dish name
  const getDishTrend = (dishName: string): CostSnapshot[] => {
    return snapshots
      .filter(s => s.dishName.toLowerCase() === dishName.toLowerCase())
      .sort((a, b) => a.snapshotDate.getTime() - b.snapshotDate.getTime());
  };

  return {
    snapshots,
    isLoading,
    snapshotMenuCosts: snapshotMenuCostsMutation.mutateAsync,
    getDishTrend,
    isSnapshotting: snapshotMenuCostsMutation.isPending,
  };
}
