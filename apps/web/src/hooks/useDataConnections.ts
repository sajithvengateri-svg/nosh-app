import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DataConnection {
  id: string;
  org_id: string;
  provider: string;
  category: string;
  status: string;
  config: Record<string, any>;
  last_sync_at: string | null;
  sync_frequency: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useDataConnections(orgId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["data-connections", orgId],
    queryFn: async (): Promise<DataConnection[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("data_connections")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Data connections fetch error:", error);
        return [];
      }

      return (data || []) as DataConnection[];
    },
    enabled: !!orgId,
  });

  const addConnection = useMutation({
    mutationFn: async (connection: Omit<DataConnection, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("data_connections")
        .insert(connection)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-connections", orgId] }),
  });

  const updateConnection = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DataConnection> & { id: string }) => {
      const { data, error } = await supabase
        .from("data_connections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-connections", orgId] }),
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("data_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data-connections", orgId] }),
  });

  return { ...query, addConnection, updateConnection, deleteConnection };
}
