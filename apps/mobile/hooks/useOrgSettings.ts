import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

interface OrgSettings {
  show_reservations?: boolean;
  show_pos_sales?: boolean;
  show_dish_par?: boolean;
  enable_chef_nudges?: boolean;
  auto_audit_2hr?: boolean;
  auto_audit_30min?: boolean;
  [key: string]: any;
}

export function useOrgSettings() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<OrgSettings>({
    queryKey: ["org-settings", orgId],
    queryFn: async () => {
      if (!orgId) return {};
      const { data, error } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();
      if (error) return {};
      return (data?.settings as OrgSettings) || {};
    },
    enabled: !!orgId,
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!orgId) throw new Error("No org");
      const updated = { ...(settings || {}), [key]: value };
      const { error } = await supabase
        .from("organizations")
        .update({ settings: updated })
        .eq("id", orgId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["org-settings", orgId] }),
  });

  const updateSetting = (key: string, value: any) => {
    updateSettingMutation.mutate({ key, value });
  };

  return {
    settings: settings || {},
    showReservations: settings?.show_reservations ?? false,
    showPosSales: settings?.show_pos_sales ?? false,
    showDishPar: settings?.show_dish_par ?? false,
    enableChefNudges: settings?.enable_chef_nudges ?? false,
    autoAudit2hr: settings?.auto_audit_2hr ?? false,
    autoAudit30min: settings?.auto_audit_30min ?? false,
    updateSetting,
    updating: updateSettingMutation.isPending,
  };
}
