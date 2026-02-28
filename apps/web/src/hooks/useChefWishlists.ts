import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export interface WishlistItem {
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
}

export interface ChefWishlist {
  id: string;
  org_id: string;
  venue_id: string | null;
  submitted_by: string;
  submitted_by_name: string;
  target_date: string;
  items: WishlistItem[];
  status: string;
  chef_notes: string | null;
  ai_recommendations: any;
  created_at: string;
  reviewed_at: string | null;
}

const table = () => supabase.from("chef_wishlists" as any);

export const useChefWishlists = (options?: { mine?: boolean; statusFilter?: string[] }) => {
  const { currentOrg } = useOrg();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const { data: wishlists = [], isLoading } = useQuery({
    queryKey: ["chef-wishlists", orgId, options?.mine, options?.statusFilter],
    queryFn: async () => {
      if (!orgId) return [];
      let query = table().select("*").eq("org_id", orgId);
      if (options?.mine && user?.id) {
        query = query.eq("submitted_by", user.id);
      }
      if (options?.statusFilter?.length) {
        query = query.in("status", options.statusFilter);
      }
      query = query.order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        items: Array.isArray(d.items) ? d.items : [],
      })) as ChefWishlist[];
    },
    enabled: !!orgId,
  });

  const createWishlist = useMutation({
    mutationFn: async (input: { target_date: string; items: WishlistItem[]; venue_id?: string }) => {
      if (!orgId || !user?.id) throw new Error("No org or user");
      const { error } = await table().insert({
        org_id: orgId,
        submitted_by: user.id,
        submitted_by_name: profile?.full_name || user.email?.split("@")[0] || "Unknown",
        target_date: input.target_date,
        items: JSON.stringify(input.items),
        status: "submitted",
        venue_id: input.venue_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chef-wishlists"] }),
  });

  const updateWishlist = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<ChefWishlist, "status" | "chef_notes" | "ai_recommendations" | "reviewed_at" | "items">>) => {
      const payload: any = { ...updates };
      if (updates.items) payload.items = JSON.stringify(updates.items);
      const { error } = await table().update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chef-wishlists"] }),
  });

  const deleteWishlist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chef-wishlists"] }),
  });

  return { wishlists, isLoading, createWishlist, updateWishlist, deleteWishlist };
};
