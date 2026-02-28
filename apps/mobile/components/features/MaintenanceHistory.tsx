import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/Skeleton";
import { AuditBadge } from "../ui/AuditBadge";
import { FileText, ExternalLink } from "lucide-react-native";

interface MaintenanceHistoryProps {
  equipmentId: string;
  equipmentName: string;
}

const TYPE_BADGE: Record<string, "default" | "warning" | "success" | "secondary"> = {
  maintenance: "default",
  repair: "warning",
  calibration: "success",
  inspection: "secondary",
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function MaintenanceHistory({ equipmentId, equipmentName }: MaintenanceHistoryProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ["maintenance-logs", equipmentId, orgId],
    queryFn: async () => {
      if (!orgId || !equipmentId) return [];
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("equipment_id", equipmentId)
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!equipmentId,
  });

  if (isLoading) {
    return <View style={{ gap: 10, padding: 12 }}><SkeletonCard /><SkeletonCard /></View>;
  }

  if (!logs || logs.length === 0) {
    return (
      <View style={{ padding: 12 }}>
        <EmptyState icon={null} title="No Maintenance History" description={`No records for ${equipmentName}`} />
      </View>
    );
  }

  return (
    <View style={{ gap: 10, padding: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
        Maintenance History ({logs.length})
      </Text>
      {logs.map((log: any) => (
        <View
          key={log.id}
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 6,
          }}
        >
          {/* Timeline dot + date */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{formatDate(log.service_date)}</Text>
            <Badge variant={TYPE_BADGE[log.service_type] || "default"}>
              {log.service_type}
            </Badge>
          </View>

          {log.provider && <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 18 }}>Provider: {log.provider}</Text>}
          {log.cost != null && <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 18 }}>Cost: ${Number(log.cost).toFixed(2)}</Text>}

          {log.invoice_url && (
            <Pressable
              onPress={() => Linking.openURL(log.invoice_url)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 18 }}
            >
              <FileText size={14} color={colors.accent} />
              <Text style={{ fontSize: 12, color: colors.accent }}>View Invoice</Text>
              <ExternalLink size={12} color={colors.accent} />
            </Pressable>
          )}

          {log.notes && <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 18 }} numberOfLines={2}>{log.notes}</Text>}

          {log.performed_by && (
            <View style={{ marginLeft: 18 }}>
              <AuditBadge signedBy={log.performed_by} signedAt={log.created_at} size="sm" />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
