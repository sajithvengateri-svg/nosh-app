import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";

export function useTempLogs(dateFilter?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const date = dateFilter || new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["food-safety-temps", orgId, date],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "temperature")
        .eq("date", date)
        .order("time", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useCreateTempLog() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: { location: string; value: number; unit?: string; status: string; equipment_id?: string; corrective_action?: string }) => {
      if (!currentOrg?.id || !user) throw new Error("Not authenticated");
      const now = new Date();
      const { error } = await supabase.from("food_safety_logs").insert({
        log_type: "temperature",
        location: log.location,
        readings: { value: log.value.toString(), unit: log.unit || "C", equipment_id: log.equipment_id },
        status: log.status,
        recorded_by: user.id,
        recorded_by_name: user.email,
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
        org_id: currentOrg.id,
        notes: log.corrective_action || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-safety-temps"] });
      queryClient.invalidateQueries({ queryKey: ["food-safety-logs"] });
    },
  });
}

export function useCleaningLogs(dateFilter?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const date = dateFilter || new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["food-safety-cleaning", orgId, date],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "cleaning")
        .eq("date", date)
        .order("time", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useCreateCleaningLog() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: { area: string; task: string; photo_url?: string; notes?: string }) => {
      if (!currentOrg?.id || !user) throw new Error("Not authenticated");
      const now = new Date();
      const { error } = await supabase.from("food_safety_logs").insert({
        log_type: "cleaning",
        location: log.area,
        readings: { task: log.task, photo_url: log.photo_url },
        status: "pass",
        recorded_by: user.id,
        recorded_by_name: user.email,
        date: now.toISOString().split("T")[0],
        time: now.toTimeString().split(" ")[0],
        org_id: currentOrg.id,
        notes: log.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-safety-cleaning"] });
      queryClient.invalidateQueries({ queryKey: ["food-safety-logs"] });
    },
  });
}

export function useUploadSafetyPhoto() {
  const { currentOrg } = useOrg();

  return useMutation({
    mutationFn: async (base64: string): Promise<string> => {
      if (!currentOrg?.id) throw new Error("No org");
      const fileName = `safety/${currentOrg.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("food-safety").upload(fileName, decode(base64), { contentType: "image/jpeg" });
      if (error) throw error;
      const { data } = supabase.storage.from("food-safety").getPublicUrl(fileName);
      return data.publicUrl;
    },
  });
}

export function useUploadSDSDocument() {
  const { currentOrg } = useOrg();
  return useMutation({
    mutationFn: async ({ uri, mimeType }: { uri: string; mimeType: string }): Promise<string> => {
      if (!currentOrg?.id) throw new Error("No org");
      const ext = mimeType === "application/pdf" ? "pdf" : "jpg";
      const fileName = `sds/${currentOrg.id}/${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error } = await supabase.storage
        .from("food-safety")
        .upload(fileName, arrayBuffer, { contentType: mimeType });
      if (error) throw error;
      const { data } = supabase.storage.from("food-safety").getPublicUrl(fileName);
      return data.publicUrl;
    },
  });
}

function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
