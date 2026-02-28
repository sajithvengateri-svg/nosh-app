import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ShieldCheck as ShieldCheckIcon, Check, X } from "lucide-react-native";

interface GreenShieldCeremonyProps {
  onComplete: () => void;
}

interface ComplianceCheck {
  key: string;
  label: string;
  met: boolean;
}

export function GreenShieldCeremony({ onComplete }: GreenShieldCeremonyProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [activated, setActivated] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["green-shield-check", orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const [profileRes, fssRes, assessRes] = await Promise.all([
        supabase
          .from("compliance_profiles")
          .select("bcc_licence_number, licence_document_url")
          .eq("org_id", orgId)
          .maybeSingle(),
        supabase
          .from("food_safety_supervisors")
          .select("id, certificate_document_url")
          .eq("org_id", orgId),
        supabase
          .from("audit_self_assessments")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),
      ]);

      const checks: ComplianceCheck[] = [
        {
          key: "licence_number",
          label: "Food Business Licence Number",
          met: !!profileRes.data?.bcc_licence_number,
        },
        {
          key: "licence_doc",
          label: "Licence Document Uploaded",
          met: !!profileRes.data?.licence_document_url,
        },
        {
          key: "fss_cert",
          label: "FSS Certificate Uploaded",
          met: (fssRes.data || []).some(
            (s: any) => !!s.certificate_document_url
          ),
        },
        {
          key: "self_audit",
          label: "Self-Audit Completed",
          met: (assessRes.count ?? 0) > 0,
        },
      ];

      return {
        checks,
        eligible: checks.every((c) => c.met),
      };
    },
    enabled: !!orgId,
  });

  // Activate green shield if eligible
  useEffect(() => {
    if (data?.eligible && !activated && orgId) {
      setActivated(true);
      supabase
        .from("compliance_profiles")
        .update({
          green_shield_active: true,
          green_shield_activated_at: new Date().toISOString(),
        })
        .eq("org_id", orgId)
        .then(() => {});
    }
  }, [data?.eligible, activated, orgId]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 12 }}>
          Checking compliance status...
        </Text>
      </View>
    );
  }

  const eligible = data?.eligible ?? false;
  const checks = data?.checks ?? [];

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {/* Shield icon */}
      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 24 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: eligible ? "#10B981" + "20" : colors.warningBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldCheckIcon
            size={48}
            color={eligible ? "#10B981" : colors.warning}
            strokeWidth={1.5}
          />
        </View>
      </View>

      {/* Status text */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: eligible ? "#10B981" : colors.warning,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {eligible ? "Green Shield Activated!" : "Almost There"}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        {eligible
          ? "Your business meets basic document compliance requirements."
          : "Some documents are still needed. You can complete these later from Settings."}
      </Text>

      {/* Checklist */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          gap: 12,
        }}
      >
        {checks.map((check) => (
          <View
            key={check.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: check.met ? "#10B981" + "20" : colors.destructiveBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {check.met ? (
                <Check size={14} color="#10B981" strokeWidth={2.5} />
              ) : (
                <X size={14} color={colors.destructive} strokeWidth={2.5} />
              )}
            </View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: check.met ? colors.text : colors.textMuted,
                flex: 1,
              }}
            >
              {check.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
