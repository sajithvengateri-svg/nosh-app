import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface PosOrder {
  id: string;
  total: number;
  status: string;
  order_type: string | null;
  created_at: string;
  items: OrderItem[];
}

interface ImportedRevenueData {
  id: string;
  data_type: string;
  payload: { revenue?: number; orders?: number; date?: string } | null;
  synced_at: string;
}

function getDateRange(selectedDate: Date, viewMode: "day" | "week"): { start: string; end: string } {
  if (viewMode === "day") {
    const d = selectedDate.toISOString().split("T")[0];
    return { start: d + "T00:00:00", end: d + "T23:59:59" };
  }
  const day = selectedDate.getDay();
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - ((day === 0 ? 7 : day) - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0] + "T00:00:00",
    end: sunday.toISOString().split("T")[0] + "T23:59:59",
  };
}

export function useFoodSales(selectedDate: Date, viewMode: "day" | "week") {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { start, end } = getDateRange(selectedDate, viewMode);

  const { data: orders, isLoading } = useQuery<PosOrder[]>({
    queryKey: ["pos-orders", orgId, start, end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("pos_orders")
        .select("id, total, status, order_type, created_at, items:pos_order_items(name, quantity, unit_price)")
        .eq("org_id", orgId)
        .gte("created_at", start)
        .lte("created_at", end)
        .in("status", ["COMPLETED", "PAID"]);
      if (error) return [];
      return (data as PosOrder[]) || [];
    },
    enabled: !!orgId,
  });

  // Fallback: data_imports for external POS data
  const { data: importedData } = useQuery<ImportedRevenueData[]>({
    queryKey: ["imported-revenue", orgId, start, end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("data_imports")
        .select("id, data_type, payload, synced_at")
        .eq("org_id", orgId)
        .eq("data_type", "revenue")
        .gte("synced_at", start)
        .lte("synced_at", end)
        .order("synced_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return (data as ImportedRevenueData[]) || [];
    },
    enabled: !!orgId && (!orders || orders.length === 0),
  });

  const stats = useMemo(() => {
    const list = orders || [];
    const totalRevenue = list.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = list.length;
    const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Top selling items
    const itemCounts: Record<string, { name: string; qty: number }> = {};
    for (const order of list) {
      for (const item of order.items || []) {
        if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, qty: 0 };
        itemCounts[item.name].qty += item.quantity || 1;
      }
    }
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);

    // Fallback from imported data
    let importedRevenue = 0;
    let importedOrders = 0;
    if (list.length === 0 && importedData && importedData.length > 0) {
      for (const imp of importedData) {
        importedRevenue += imp.payload?.revenue || 0;
        importedOrders += imp.payload?.orders || 0;
      }
    }

    const hasData = list.length > 0 || importedRevenue > 0;
    const isFromImport = list.length === 0 && importedRevenue > 0;

    return {
      totalRevenue: list.length > 0 ? totalRevenue : importedRevenue,
      totalOrders: list.length > 0 ? totalOrders : importedOrders,
      avgTicket,
      topItems,
      hasData,
      isFromImport,
      lastSynced: isFromImport && importedData?.[0]?.synced_at ? importedData[0].synced_at : null,
    };
  }, [orders, importedData]);

  return { orders: orders || [], stats, isLoading };
}
