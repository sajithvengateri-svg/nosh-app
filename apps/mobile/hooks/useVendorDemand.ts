import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useVendorAuth } from "../contexts/VendorAuthProvider";

export interface DemandInsight {
  id: string;
  ingredient_name: string | null;
  ingredient_category: string;
  postcode: string;
  week_ending: string;
  total_quantity: number;
  order_count: number;
  unit: string;
  avg_price_paid: number | null;
}

/**
 * Fetches demand insights scoped to vendor's delivery areas.
 * If no delivery_areas set on profile, returns all demand data.
 */
export function useVendorDemand() {
  const { vendorProfile } = useVendorAuth();
  const areas = vendorProfile?.delivery_areas ?? [];

  return useQuery({
    queryKey: ["vendor-demand", areas],
    queryFn: async () => {
      let query = supabase
        .from("demand_insights")
        .select("*")
        .order("total_quantity", { ascending: false });

      if (areas.length > 0) {
        query = query.in("postcode", areas);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DemandInsight[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!vendorProfile,
  });
}

/**
 * Aggregates demand by category for the vendor's delivery areas.
 */
export function useVendorCategoryDemand() {
  const { data: insights, isLoading, error } = useVendorDemand();

  const categoryData = insights?.reduce(
    (acc, item) => {
      const existing = acc.find((c) => c.category === item.ingredient_category);
      if (existing) {
        existing.total_quantity += item.total_quantity;
        existing.order_count += item.order_count;
        existing.ingredient_count += 1;
      } else {
        acc.push({
          category: item.ingredient_category,
          total_quantity: item.total_quantity,
          order_count: item.order_count,
          ingredient_count: 1,
          unit: item.unit,
        });
      }
      return acc;
    },
    [] as {
      category: string;
      total_quantity: number;
      order_count: number;
      ingredient_count: number;
      unit: string;
    }[]
  );

  return {
    data: categoryData?.sort((a, b) => b.total_quantity - a.total_quantity),
    isLoading,
    error,
  };
}

/**
 * Aggregates demand by postcode for map display.
 */
export function useVendorPostcodeDemand() {
  const { data: insights, isLoading, error } = useVendorDemand();

  const postcodeData = insights?.reduce(
    (acc, item) => {
      const existing = acc.find((p) => p.postcode === item.postcode);
      if (existing) {
        existing.total_quantity += item.total_quantity;
        existing.order_count += item.order_count;
        existing.ingredient_count += 1;
        existing.ingredients.push({
          name: item.ingredient_name ?? item.ingredient_category,
          category: item.ingredient_category,
          quantity: item.total_quantity,
          unit: item.unit,
          avg_price: item.avg_price_paid,
        });
      } else {
        acc.push({
          postcode: item.postcode,
          total_quantity: item.total_quantity,
          order_count: item.order_count,
          ingredient_count: 1,
          ingredients: [
            {
              name: item.ingredient_name ?? item.ingredient_category,
              category: item.ingredient_category,
              quantity: item.total_quantity,
              unit: item.unit,
              avg_price: item.avg_price_paid,
            },
          ],
        });
      }
      return acc;
    },
    [] as {
      postcode: string;
      total_quantity: number;
      order_count: number;
      ingredient_count: number;
      ingredients: {
        name: string;
        category: string;
        quantity: number;
        unit: string;
        avg_price: number | null;
      }[];
    }[]
  );

  return {
    data: postcodeData?.sort((a, b) => b.total_quantity - a.total_quantity),
    isLoading,
    error,
  };
}
