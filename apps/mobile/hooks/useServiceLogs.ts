import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";
import { useUploadSafetyPhoto } from "./useFoodSafety";
import { useCalendarIntegration } from "./useCalendarIntegration";

// ── Types ────────────────────────────────────────────────────────────
export type ServiceType = "grease_trap" | "hood_cleaning" | "pest_control";

export interface ServiceLog {
  id: string;
  org_id: string;
  log_type: string;
  log_date: string;
  location: string;
  status: string;
  recorded_by: string;
  recorded_by_name: string;
  readings: Record<string, any>;
  created_at: string;
}

export interface PestLog {
  id: string;
  org_id: string;
  log_date: string;
  log_type: "self_inspection" | "professional";
  provider_name: string | null;
  technician_name: string | null;
  pests_found: boolean;
  findings: string | null;
  corrective_action: string | null;
  next_service_date: string | null;
  report_document_url: string | null;
  logged_by: string;
  logged_by_name: string;
  created_at: string;
}

// ── Service field definitions (for form rendering) ───────────────────
export interface ServiceField {
  key: string;
  label: string;
  type: "date" | "text" | "number" | "toggle" | "photo" | "multi_select";
  required?: boolean;
  options?: string[]; // for multi_select
  showWhen?: (values: Record<string, any>) => boolean;
  placeholder?: string;
}

export const GREASE_FIELDS: ServiceField[] = [
  { key: "service_date", label: "Service Date", type: "date", required: true },
  { key: "provider_name", label: "Provider", type: "text", placeholder: "Company name" },
  { key: "pump_out", label: "Pump Out Performed", type: "toggle" },
  { key: "grease_level_pct", label: "Grease Level %", type: "number", placeholder: "0-100" },
  { key: "condition_notes", label: "Condition Notes", type: "text", placeholder: "Condition of trap..." },
  { key: "next_service_date", label: "Next Service Date", type: "date" },
  { key: "photo", label: "Photo", type: "photo" },
];

export const HOOD_FIELDS: ServiceField[] = [
  { key: "cleaning_date", label: "Cleaning Date", type: "date", required: true },
  { key: "provider_name", label: "Provider", type: "text", placeholder: "Company name" },
  { key: "areas_cleaned", label: "Areas Cleaned", type: "multi_select", options: ["Kitchen Hood", "Exhaust Filters", "Canopy", "Ductwork"] },
  { key: "method", label: "Method", type: "text", placeholder: "Steam, chemical, etc." },
  { key: "condition_notes", label: "Condition", type: "text", placeholder: "Condition notes..." },
  { key: "next_scheduled_date", label: "Next Scheduled", type: "date" },
  { key: "photo", label: "Photo", type: "photo" },
  { key: "certificate", label: "Certificate", type: "photo" },
];

export const PEST_FIELDS: ServiceField[] = [
  { key: "log_type", label: "Type", type: "multi_select", options: ["Self-Inspection", "Professional"], required: true },
  { key: "provider_name", label: "Provider", type: "text", placeholder: "Company name", showWhen: (v) => v.log_type === "Professional" },
  { key: "technician_name", label: "Technician", type: "text", placeholder: "Technician name", showWhen: (v) => v.log_type === "Professional" },
  { key: "pests_found", label: "Pests Found", type: "toggle" },
  { key: "findings", label: "Findings", type: "text", placeholder: "Describe findings...", showWhen: (v) => !!v.pests_found },
  { key: "corrective_action", label: "Corrective Action", type: "text", placeholder: "Actions taken...", showWhen: (v) => !!v.pests_found },
  { key: "next_service_date", label: "Next Service Date", type: "date" },
  { key: "report", label: "Report / Photo", type: "photo" },
];

// ── Hook: fetch service logs ─────────────────────────────────────────
export function useServiceHistory(serviceType: ServiceType) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;

  const isPest = serviceType === "pest_control";
  const table = isPest ? "bcc_pest_control_logs" : "food_safety_logs";
  const queryKey = [table, orgId, serviceType];

  const { data, isLoading, refetch } = useQuery<(ServiceLog | PestLog)[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return [];

      if (isPest) {
        const { data, error } = await supabase
          .from("bcc_pest_control_logs")
          .select("*")
          .eq("org_id", orgId)
          .order("log_date", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data ?? []) as PestLog[];
      }

      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", serviceType)
        .order("log_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ServiceLog[];
    },
    enabled: !!orgId,
  });

  return { logs: data ?? [], isLoading, refetch, queryKey };
}

// ── Hook: fetch service dates for calendar ───────────────────────────
export function useServiceDates(serviceType: ServiceType, year: number) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;

  const isPest = serviceType === "pest_control";
  const table = isPest ? "bcc_pest_control_logs" : "food_safety_logs";
  const queryKey = [`${table}-dates`, orgId, serviceType, year];

  const { data } = useQuery<{ serviceDates: Date[]; nextDueDate: Date | null }>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return { serviceDates: [], nextDueDate: null };
      if (isDevBypass) return { serviceDates: [], nextDueDate: null };

      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const serviceDates: Date[] = [];
      let nextDueDate: Date | null = null;

      if (isPest) {
        const { data } = await supabase
          .from("bcc_pest_control_logs")
          .select("log_date, next_service_date")
          .eq("org_id", orgId)
          .gte("log_date", yearStart)
          .lte("log_date", yearEnd)
          .order("log_date", { ascending: false });
        data?.forEach((d: any) => {
          serviceDates.push(new Date(d.log_date));
          if (!nextDueDate && d.next_service_date) nextDueDate = new Date(d.next_service_date);
        });
      } else {
        const { data } = await supabase
          .from("food_safety_logs")
          .select("log_date, readings")
          .eq("org_id", orgId)
          .eq("log_type", serviceType)
          .gte("log_date", yearStart)
          .lte("log_date", yearEnd)
          .order("log_date", { ascending: false });
        data?.forEach((d: any) => {
          serviceDates.push(new Date(d.log_date));
          const r = d.readings as Record<string, any>;
          const nsd = r?.next_service_date || r?.next_scheduled_date;
          if (!nextDueDate && nsd) nextDueDate = new Date(nsd);
        });
      }

      return { serviceDates, nextDueDate };
    },
    enabled: !!orgId,
  });

  return data ?? { serviceDates: [], nextDueDate: null };
}

// ── Hook: save a service log ─────────────────────────────────────────
export function useSaveServiceLog(serviceType: ServiceType) {
  const { currentOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();
  const { createServiceReminder } = useCalendarIntegration();

  const isPest = serviceType === "pest_control";

  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const orgId = currentOrg?.id;
      if (!orgId || !user) throw new Error("Not authenticated");
      if (isDevBypass) return;

      // Upload photos
      let photoUrl: string | null = null;
      let certUrl: string | null = null;
      if (values.photo) photoUrl = await uploadPhoto.mutateAsync(values.photo);
      if (values.certificate) certUrl = await uploadPhoto.mutateAsync(values.certificate);
      if (values.report) photoUrl = await uploadPhoto.mutateAsync(values.report);

      if (isPest) {
        const logType = values.log_type === "Professional" ? "professional" : "self_inspection";
        const { error } = await supabase.from("bcc_pest_control_logs").insert({
          org_id: orgId,
          log_date: new Date().toISOString().split("T")[0],
          log_type: logType,
          provider_name: logType === "professional" ? values.provider_name : null,
          technician_name: logType === "professional" ? values.technician_name : null,
          pests_found: values.pests_found ?? false,
          findings: values.pests_found ? values.findings : null,
          corrective_action: values.pests_found ? values.corrective_action : null,
          next_service_date: values.next_service_date || null,
          report_document_url: photoUrl,
          logged_by: user.id,
          logged_by_name: user.email,
        });
        if (error) throw error;
      } else {
        const logDate = values.service_date || values.cleaning_date || new Date().toISOString().split("T")[0];
        const readings: Record<string, any> = { ...values };
        delete readings.photo;
        delete readings.certificate;
        delete readings.report;
        delete readings.service_date;
        delete readings.cleaning_date;
        if (photoUrl) readings.photo_url = photoUrl;
        if (certUrl) readings.certificate_url = certUrl;

        const { error } = await supabase.from("food_safety_logs").insert({
          org_id: orgId,
          log_type: serviceType,
          log_date: logDate,
          location: serviceType === "grease_trap" ? "Grease Trap" : "Kitchen Hood",
          status: "pass",
          recorded_by: user.id,
          recorded_by_name: user.email,
          readings,
        });
        if (error) throw error;
      }

      // Create calendar reminder for next service date
      const nextDate = values.next_service_date || values.next_scheduled_date;
      if (nextDate) {
        const label = serviceType === "grease_trap" ? "Grease Trap" : serviceType === "hood_cleaning" ? "Hood Cleaning" : "Pest Control";
        await createServiceReminder({
          title: `${label} Service Due`,
          dueDate: nextDate,
          reminderWeeksBefore: 2,
          notes: values.provider_name ? `Provider: ${values.provider_name}` : undefined,
        });
      }
    },
    onSuccess: () => {
      const table = isPest ? "bcc_pest_control_logs" : "food_safety_logs";
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: [`${table}-dates`] });
    },
  });
}

// ── Helper: get latest next-due date from logs ───────────────────────
export function getNextDueDate(logs: (ServiceLog | PestLog)[]): Date | null {
  for (const log of logs) {
    if ("next_service_date" in log && log.next_service_date) {
      return new Date(log.next_service_date);
    }
    if ("readings" in log) {
      const r = (log as ServiceLog).readings;
      const nsd = r?.next_service_date || r?.next_scheduled_date;
      if (nsd) return new Date(nsd);
    }
  }
  return null;
}

export function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return date < new Date();
}
