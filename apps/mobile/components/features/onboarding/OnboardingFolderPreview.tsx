import { View, Text, ScrollView, ActivityIndicator, Pressable, Share } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import {
  FolderOpen,
  Check,
  AlertCircle,
  Share as ShareIcon,
  FileText,
} from "lucide-react-native";

interface OnboardingFolderPreviewProps {
  onComplete: () => void;
}

const FOLDER_SECTIONS = [
  { key: "profile", label: "Compliance Profile & Licence", table: "compliance_profiles" },
  { key: "fss", label: "Food Safety Supervisor Certs", table: "food_safety_supervisors" },
  { key: "training", label: "Food Handler Training", table: "food_handler_training" },
  { key: "daily_logs", label: "Daily Compliance Logs", table: "daily_compliance_logs" },
  { key: "corrective", label: "Corrective Action Register", table: "corrective_actions" },
  { key: "cleaning", label: "Cleaning Schedules", table: "food_safety_logs" },
  { key: "pest", label: "Pest Control Records", table: "bcc_pest_control_logs" },
  { key: "calibration", label: "Equipment Calibration", table: "bcc_equipment_calibration_logs" },
  { key: "grease", label: "Grease Trap Service", table: "food_safety_logs" },
  { key: "hood", label: "Hood/Canopy Cleaning", table: "food_safety_logs" },
  { key: "suppliers", label: "Supplier Register", table: "bcc_supplier_register" },
  { key: "assessment", label: "Self-Assessment & Star Rating", table: "audit_self_assessments" },
  { key: "receiving", label: "Receiving Log", table: "daily_compliance_logs" },
  { key: "temp", label: "Temperature Records", table: "food_safety_logs" },
];

export function OnboardingFolderPreview({ onComplete }: OnboardingFolderPreviewProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: sectionStatus, isLoading } = useQuery({
    queryKey: ["folder-preview", orgId],
    queryFn: async () => {
      if (!orgId) return {};

      const [profileRes, fssRes, trainingRes, logsRes, suppliersRes, assessRes, tempRes] =
        await Promise.all([
          supabase.from("compliance_profiles").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("food_safety_supervisors").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("food_handler_training").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("daily_compliance_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("bcc_supplier_register").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("audit_self_assessments").select("id", { count: "exact", head: true }).eq("org_id", orgId),
          supabase.from("food_safety_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("log_type", "temperature"),
        ]);

      return {
        profile: (profileRes.count ?? 0) > 0,
        fss: (fssRes.count ?? 0) > 0,
        training: (trainingRes.count ?? 0) > 0,
        daily_logs: (logsRes.count ?? 0) > 0,
        corrective: false,
        cleaning: false,
        pest: false,
        calibration: false,
        grease: false,
        hood: false,
        suppliers: (suppliersRes.count ?? 0) > 0,
        assessment: (assessRes.count ?? 0) > 0,
        receiving: (logsRes.count ?? 0) > 0,
        temp: (tempRes.count ?? 0) > 0,
      } as Record<string, boolean>;
    },
    enabled: !!orgId,
  });

  const completedCount = sectionStatus
    ? Object.values(sectionStatus).filter(Boolean).length
    : 0;

  const handleShare = async () => {
    const lines = FOLDER_SECTIONS.map(
      (s, i) =>
        `${i + 1}. ${s.label}: ${sectionStatus?.[s.key] ? "Complete" : "Pending"}`
    );
    const text = `Food Safety Audit Folder — ${currentOrg?.name || "My Business"}\n\n${lines.join("\n")}\n\n${completedCount}/${FOLDER_SECTIONS.length} sections started`;

    try {
      await Share.share({ message: text });
    } catch {}
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Summary */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.accentBg,
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <FolderOpen size={28} color={colors.accent} strokeWidth={1.5} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
            Your Food Safety Folder
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {completedCount}/{FOLDER_SECTIONS.length} sections started — ready for inspection
          </Text>
        </View>
      </View>

      {/* Table of Contents */}
      <View style={{ backgroundColor: colors.card, borderRadius: 14, overflow: "hidden" }}>
        {FOLDER_SECTIONS.map((section, idx) => {
          const hasData = sectionStatus?.[section.key] ?? false;
          return (
            <View
              key={section.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderBottomWidth: idx < FOLDER_SECTIONS.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, width: 24, textAlign: "center" }}>
                {idx + 1}
              </Text>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: hasData ? "#10B981" + "20" : colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hasData ? (
                  <Check size={12} color="#10B981" strokeWidth={2.5} />
                ) : (
                  <AlertCircle size={12} color={colors.textMuted} strokeWidth={1.5} />
                )}
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: hasData ? colors.text : colors.textMuted,
                  flex: 1,
                }}
              >
                {section.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Share button */}
      <Pressable
        onPress={handleShare}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingVertical: 14,
          marginTop: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <ShareIcon size={16} color={colors.accent} strokeWidth={2} />
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>
          Share Audit Folder Summary
        </Text>
      </Pressable>
    </ScrollView>
  );
}
