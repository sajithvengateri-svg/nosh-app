import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Tradie } from "@/types/tradies";

// ── Fetch all tradies for org ─────────────────────────────────────
export function useTradies(category?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data, isLoading, error } = useQuery<Tradie[]>({
    queryKey: ["tradies", orgId, category],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from("tradies")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (category && category !== "All") {
        q = q.eq("category", category);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Tradie[];
    },
    enabled: !!orgId,
  });

  return { tradies: data ?? [], isLoading, error };
}

// ── Save tradie (insert or update) ───────────────────────────────
export function useSaveTradie() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      id?: string;
      name: string;
      company?: string;
      category: string;
      phone?: string;
      email?: string;
      website?: string;
      abn?: string;
      address?: string;
      notes?: string;
      photo_url?: string;
      is_supplier?: boolean;
      linked_equipment_ids?: string[];
    }) => {
      const orgId = currentOrg?.id;
      if (!orgId) throw new Error("No org");

      const row = {
        org_id: orgId,
        name: values.name,
        company: values.company || null,
        category: values.category,
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        abn: values.abn || null,
        address: values.address || null,
        notes: values.notes || null,
        photo_url: values.photo_url || null,
        is_supplier: values.is_supplier ?? false,
        linked_equipment_ids: values.linked_equipment_ids ?? [],
      };

      if (values.id) {
        const { error } = await supabase.from("tradies").update(row).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tradies").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradies"] });
    },
  });
}

// ── Delete tradie ────────────────────────────────────────────────
export function useDeleteTradie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tradies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tradies"] });
    },
  });
}

// ── Log service call (uses service_logs with tradie_callout type) ──
export function useLogServiceCall() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      tradie_id: string;
      service_date: string;
      cost?: number;
      notes?: string;
      invoice_file?: File;
      equipment_id?: string;
      issue_description?: string;
      resolution?: string;
      follow_up_needed?: boolean;
    }) => {
      const orgId = currentOrg?.id;
      if (!orgId || !user) throw new Error("Not authenticated");

      let invoiceUrl: string | null = null;
      if (values.invoice_file) {
        const ext = values.invoice_file.name.split(".").pop();
        const path = `${orgId}/tradies/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(path, values.invoice_file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(path);
          invoiceUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("service_logs").insert({
        org_id: orgId,
        service_type: "tradie_callout",
        provider_name: null,
        service_date: values.service_date,
        cost: values.cost ?? null,
        invoice_url: invoiceUrl,
        status: "completed",
        logged_by: user.id,
        logged_by_name: user.email,
        metadata: {
          tradie_id: values.tradie_id,
          equipment_id: values.equipment_id || null,
          issue_description: values.issue_description || null,
          resolution: values.resolution || null,
          follow_up_needed: values.follow_up_needed ?? false,
        },
        notes: values.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-logs"] });
      queryClient.invalidateQueries({ queryKey: ["tradie-service-history"] });
    },
  });
}

// ── Get service history for a tradie ────────────────────────────
export function useTradieServiceHistory(tradieId: string | null) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["tradie-service-history", orgId, tradieId],
    queryFn: async () => {
      if (!orgId || !tradieId) return [];
      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("service_type", "tradie_callout")
        .order("service_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).filter(
        (log: any) => log.metadata?.tradie_id === tradieId
      );
    },
    enabled: !!orgId && !!tradieId,
  });

  return { history: data ?? [], isLoading };
}

// ── Scan business card ──────────────────────────────────────────
export async function scanBusinessCard(imageBase64: string) {
  const { data, error } = await supabase.functions.invoke("scan-business-card", {
    body: { imageBase64 },
  });
  if (error) throw error;
  return data?.data as {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
    abn?: string;
    address?: string;
    category?: string;
    notes?: string;
  } | null;
}
