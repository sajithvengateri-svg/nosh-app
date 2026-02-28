import { useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { SkeletonCard } from "../ui/Skeleton";
import { ChevronRight } from "lucide-react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadinessCheck {
  key: string;
  label: string;
  detail: string;
  status: "ready" | "warning" | "not_ready";
  fixTab?: string;
}

/** Maps readiness check keys to the bccTab key that fixes them */
const FIX_TAB_MAP: Record<string, string> = {
  compliance_profile: "overview",
  fss_cert: "training",
  food_handler_training: "training",
  daily_logs: "burst",
  critical_actions: "actions",
  cleaning_schedules: "cleaning_bcc",
  pest_control: "pest",
  equipment_calibration: "equipment",
  supplier_register: "suppliers_bcc",
  self_assessment: "a1a40",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getThirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#F59E0B";
  return "#DC2626";
}

function getStatusIcon(status: "ready" | "warning" | "not_ready"): string {
  if (status === "ready") return "\u2705";
  if (status === "warning") return "\u26A0\uFE0F";
  return "\u274C";
}

function getStatusColor(
  status: "ready" | "warning" | "not_ready"
): string {
  if (status === "ready") return "#10B981";
  if (status === "warning") return "#F59E0B";
  return "#DC2626";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BCCReadinessProps {
  onNavigateTab?: (tabKey: string) => void;
}

export function BCCReadiness({ onNavigateTab }: BCCReadinessProps = {}) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const today = getTodayDate();
  const thirtyDaysAgo = getThirtyDaysAgo();

  // ---------------------------------------------------------------------------
  // Query — 10 parallel checks
  // ---------------------------------------------------------------------------

  const {
    data: checks,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<ReadinessCheck[]>({
    queryKey: ["bcc-readiness", orgId, today],
    queryFn: async () => {
      if (!orgId) return [];

      const results = await Promise.all([
        // 1. Compliance profile exists
        supabase
          .from("compliance_profiles")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),

        // 2. FSS cert current
        supabase
          .from("food_safety_supervisors")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .gt("certificate_expiry", today),

        // 3. Food handler training exists
        supabase
          .from("food_handler_training")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),

        // 4. Daily logs today >= 5
        supabase
          .from("daily_compliance_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("log_date", today),

        // 5. No open critical corrective actions
        supabase
          .from("corrective_actions")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("status", "open")
          .eq("severity", "critical"),

        // 6. Cleaning schedules exist
        supabase
          .from("bcc_cleaning_schedules")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),

        // 7. Pest control within 30 days
        supabase
          .from("bcc_pest_control_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .gt("log_date", thirtyDaysAgo),

        // 8. Equipment calibration within 30 days
        supabase
          .from("bcc_equipment_calibration_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .gt("calibration_date", thirtyDaysAgo),

        // 9. Supplier register exists
        supabase
          .from("bcc_supplier_register")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),

        // 10. Self-assessment completed
        supabase
          .from("audit_self_assessments")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId),
      ]);

      const [
        profileRes,
        fssRes,
        trainingRes,
        logsRes,
        criticalRes,
        cleaningRes,
        pestRes,
        calibrationRes,
        supplierRes,
        selfAssessRes,
      ] = results;

      const profileCount = profileRes.count ?? 0;
      const fssCount = fssRes.count ?? 0;
      const trainingCount = trainingRes.count ?? 0;
      const logsCount = logsRes.count ?? 0;
      const criticalCount = criticalRes.count ?? 0;
      const cleaningCount = cleaningRes.count ?? 0;
      const pestCount = pestRes.count ?? 0;
      const calibrationCount = calibrationRes.count ?? 0;
      const supplierCount = supplierRes.count ?? 0;
      const selfAssessCount = selfAssessRes.count ?? 0;

      const readinessChecks: ReadinessCheck[] = [
        {
          key: "compliance_profile",
          label: "Compliance Profile",
          detail:
            profileCount > 0
              ? "Profile configured"
              : "No profile found — tap to set up",
          status: profileCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["compliance_profile"],
        },
        {
          key: "fss_cert",
          label: "FSS Certificate Current",
          detail:
            fssCount > 0
              ? `${fssCount} current ${fssCount === 1 ? "certificate" : "certificates"}`
              : "No current certificates — tap to add",
          status: fssCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["fss_cert"],
        },
        {
          key: "food_handler_training",
          label: "Food Handler Training",
          detail:
            trainingCount > 0
              ? `${trainingCount} ${trainingCount === 1 ? "record" : "records"} found`
              : "No training records — tap to add",
          status: trainingCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["food_handler_training"],
        },
        {
          key: "daily_logs",
          label: "Daily Compliance Logs",
          detail:
            logsCount >= 5
              ? `${logsCount} logs today`
              : `${logsCount}/5 logs today — tap to log`,
          status:
            logsCount >= 5
              ? "ready"
              : logsCount > 0
                ? "warning"
                : "not_ready",
          fixTab: FIX_TAB_MAP["daily_logs"],
        },
        {
          key: "critical_actions",
          label: "No Open Critical Actions",
          detail:
            criticalCount === 0
              ? "No open critical actions"
              : `${criticalCount} open — tap to resolve`,
          status: criticalCount === 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["critical_actions"],
        },
        {
          key: "cleaning_schedules",
          label: "Cleaning Schedules",
          detail:
            cleaningCount > 0
              ? `${cleaningCount} ${cleaningCount === 1 ? "schedule" : "schedules"} configured`
              : "No cleaning schedules — tap to set up",
          status: cleaningCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["cleaning_schedules"],
        },
        {
          key: "pest_control",
          label: "Pest Control (30 days)",
          detail:
            pestCount > 0
              ? `${pestCount} ${pestCount === 1 ? "log" : "logs"} in last 30 days`
              : "No recent logs — tap to add",
          status: pestCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["pest_control"],
        },
        {
          key: "equipment_calibration",
          label: "Equipment Calibration (30 days)",
          detail:
            calibrationCount > 0
              ? `${calibrationCount} ${calibrationCount === 1 ? "calibration" : "calibrations"} in last 30 days`
              : "No recent calibrations — tap to log",
          status: calibrationCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["equipment_calibration"],
        },
        {
          key: "supplier_register",
          label: "Supplier Register",
          detail:
            supplierCount > 0
              ? `${supplierCount} ${supplierCount === 1 ? "supplier" : "suppliers"} registered`
              : "No suppliers — tap to add",
          status: supplierCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["supplier_register"],
        },
        {
          key: "self_assessment",
          label: "Self-Assessment Completed",
          detail:
            selfAssessCount > 0
              ? "Self-assessment on file"
              : "Not completed — tap to start",
          status: selfAssessCount > 0 ? "ready" : "not_ready",
          fixTab: FIX_TAB_MAP["self_assessment"],
        },
      ];

      return readinessChecks;
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const readyCount = useMemo(
    () => (checks ?? []).filter((c) => c.status === "ready").length,
    [checks]
  );

  const totalChecks = 10;
  const scorePct = Math.round((readyCount / totalChecks) * 100);
  const scoreColor = getScoreColor(scorePct);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 16,
      }}
    >
      {isLoading ? (
        <View style={{ gap: 10, paddingTop: 16 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <>
          {/* ── Score Circle ──────────────────────────────────────── */}
          <Card>
            <CardContent style={{ paddingTop: 24, alignItems: "center" }}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 6,
                  borderColor: scoreColor,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "800",
                    color: scoreColor,
                  }}
                >
                  {scorePct}%
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                Inspection Readiness
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginBottom: 16,
                }}
              >
                {readyCount} of {totalChecks} checks passed
              </Text>

              {/* ── Progress Bar ───────────────────────────────── */}
              <View
                style={{
                  width: "100%",
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 8,
                    borderRadius: 4,
                    width: `${scorePct}%` as any,
                    backgroundColor: scoreColor,
                  }}
                />
              </View>

              {/* ── Summary Badge ──────────────────────────────── */}
              <View style={{ marginTop: 12 }}>
                <Badge
                  variant={
                    scorePct >= 80
                      ? "success"
                      : scorePct >= 50
                        ? "warning"
                        : "destructive"
                  }
                >
                  {scorePct >= 80
                    ? "Ready for Inspection"
                    : scorePct >= 50
                      ? "Needs Attention"
                      : "Not Ready"}
                </Badge>
              </View>
            </CardContent>
          </Card>

          {/* ── Check List ────────────────────────────────────────── */}
          <Card>
            <CardContent style={{ paddingTop: 16, gap: 0 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.text,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                Readiness Checks
              </Text>

              {(checks ?? []).map((check, index) => {
                const canFix = check.status !== "ready" && check.fixTab && onNavigateTab;
                const Row = canFix ? Pressable : View;
                return (
                <Row
                  key={check.key}
                  {...(canFix ? { onPress: () => onNavigateTab(check.fixTab!) } : {})}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: colors.border,
                    gap: 12,
                  }}
                >
                  {/* Status indicator */}
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor:
                        check.status === "ready"
                          ? "#DCFCE7"
                          : check.status === "warning"
                            ? "#FEF3C7"
                            : "#FEE2E2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: getStatusColor(check.status),
                      }}
                    />
                  </View>

                  {/* Label + detail */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                        marginBottom: 2,
                      }}
                    >
                      {check.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: canFix ? colors.accent : colors.textSecondary,
                      }}
                    >
                      {check.detail}
                    </Text>
                  </View>

                  {/* Fix chevron */}
                  {canFix && (
                    <ChevronRight size={16} color={colors.accent} strokeWidth={1.5} />
                  )}
                </Row>
                );
              })}
            </CardContent>
          </Card>

          {/* ── Refresh Button ─────────────────────────────────────── */}
          <Button
            onPress={() => {
              queryClient.invalidateQueries({
                queryKey: ["bcc-readiness", orgId],
              });
              refetch();
            }}
            loading={isRefetching}
            variant="outline"
          >
            Refresh
          </Button>
        </>
      )}
    </ScrollView>
  );
}
