import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import {
  Thermometer,
  SprayCan,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PERIOD_OPTIONS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
] as const;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: color + "20", overflow: "hidden" }}>
      <View style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: color }} />
    </View>
  );
}

function TrendArrow({ current, previous, colors }: { current: number; previous: number; colors: any }) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  const isUp = diff >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? colors.success : colors.destructive;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <Icon size={12} color={color} strokeWidth={2} />
      <Text style={{ fontSize: 11, fontWeight: "700", color }}>
        {isUp ? "+" : ""}{diff}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsTab() {
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const router = useRouter();
  const orgId = currentOrg?.id;
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const selectedPeriod = PERIOD_OPTIONS.find((p) => p.key === period)!;
  const sinceDate = daysAgo(selectedPeriod.days);
  const prevSinceDate = daysAgo(selectedPeriod.days * 2);

  const { data, refetch } = useQuery({
    queryKey: ["reports-full", orgId, period],
    queryFn: async () => {
      if (!orgId) return null;

      const [
        tempRes, tempPrevRes,
        cleanRes, cleanPrevRes,
        assessRes, assessHistoryRes,
        correctiveRes,
        readinessRes,
      ] = await Promise.all([
        // Current period temps
        supabase.from("food_safety_logs").select("id, status, date")
          .eq("org_id", orgId).eq("log_type", "temperature").gte("date", sinceDate),
        // Previous period temps (for comparison)
        supabase.from("food_safety_logs").select("id, status")
          .eq("org_id", orgId).eq("log_type", "temperature").gte("date", prevSinceDate).lt("date", sinceDate),
        // Current period cleaning
        supabase.from("food_safety_logs").select("id, status, date")
          .eq("org_id", orgId).eq("log_type", "cleaning").gte("date", sinceDate),
        // Previous period cleaning
        supabase.from("food_safety_logs").select("id, status")
          .eq("org_id", orgId).eq("log_type", "cleaning").gte("date", prevSinceDate).lt("date", sinceDate),
        // Latest self-assessment
        supabase.from("audit_self_assessments").select("id, score, created_at")
          .eq("org_id", orgId).order("created_at", { ascending: false }).limit(1),
        // Assessment history (last 5)
        supabase.from("audit_self_assessments").select("id, score, created_at")
          .eq("org_id", orgId).order("created_at", { ascending: false }).limit(5),
        // Corrective actions
        supabase.from("corrective_actions").select("id, status, severity, created_at")
          .eq("org_id", orgId),
        // Readiness — compliance profile check
        supabase.from("compliance_profiles").select("id, last_audit_score")
          .eq("org_id", orgId).maybeSingle(),
      ]);

      const tempLogs = tempRes.data ?? [];
      const tempPrev = tempPrevRes.data ?? [];
      const cleanLogs = cleanRes.data ?? [];
      const cleanPrev = cleanPrevRes.data ?? [];
      const corrective = correctiveRes.data ?? [];

      const tempPass = tempLogs.filter((l: any) => l.status === "pass").length;
      const tempFail = tempLogs.filter((l: any) => l.status === "fail" || l.status === "critical").length;
      const tempPrevPass = tempPrev.filter((l: any) => l.status === "pass").length;
      const cleanPass = cleanLogs.filter((l: any) => l.status === "pass").length;
      const cleanPrevPass = cleanPrev.filter((l: any) => l.status === "pass").length;

      const openActions = corrective.filter((c: any) => c.status === "open" || c.status === "in_progress");
      const closedActions = corrective.filter((c: any) => c.status === "resolved" || c.status === "closed");
      const criticalOpen = openActions.filter((c: any) => c.severity === "critical").length;

      // Daily breakdown for mini chart (last 7 days regardless of period)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      const tempByDay = last7Days.map((date) => tempLogs.filter((l: any) => l.date === date).length);
      const cleanByDay = last7Days.map((date) => cleanLogs.filter((l: any) => l.date === date).length);

      return {
        temp: {
          total: tempLogs.length,
          pass: tempPass,
          fail: tempFail,
          passRate: tempLogs.length > 0 ? Math.round((tempPass / tempLogs.length) * 100) : 0,
          prevTotal: tempPrev.length,
          prevPassRate: tempPrev.length > 0 ? Math.round((tempPrevPass / tempPrev.length) * 100) : 0,
          byDay: tempByDay,
        },
        clean: {
          total: cleanLogs.length,
          pass: cleanPass,
          passRate: cleanLogs.length > 0 ? Math.round((cleanPass / cleanLogs.length) * 100) : 0,
          prevTotal: cleanPrev.length,
          prevPassRate: cleanPrev.length > 0 ? Math.round((cleanPrevPass / cleanPrev.length) * 100) : 0,
          byDay: cleanByDay,
        },
        assessment: {
          latest: assessRes.data?.[0]?.score ?? null,
          history: (assessHistoryRes.data ?? []).map((a: any) => ({
            score: a.score,
            date: new Date(a.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
          })),
        },
        actions: {
          open: openActions.length,
          closed: closedActions.length,
          criticalOpen,
          total: corrective.length,
        },
        readiness: {
          lastAuditScore: readinessRes.data?.last_audit_score ?? null,
        },
      };
    },
    enabled: !!orgId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const maxDayLogs = useMemo(() => {
    if (!data) return 1;
    return Math.max(...(data.temp.byDay ?? []), ...(data.clean.byDay ?? []), 1);
  }, [data]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>Reports</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
            Compliance & safety trends
          </Text>
        </View>

        {/* Period Selector */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {PERIOD_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setPeriod(opt.key as any)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: period === opt.key ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: period === opt.key ? colors.accent : colors.border,
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: "700",
                color: period === opt.key ? "#FFFFFF" : colors.textSecondary,
              }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Temperature Card ──────────────────────────────── */}
        <Pressable
          onPress={() => router.push("/(app)/food-safety")}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.success + "20", alignItems: "center", justifyContent: "center" }}>
                <Thermometer size={18} color={colors.success} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Temperature Logs</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>{data?.temp.total ?? 0}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Logs</Text>
              <TrendArrow current={data?.temp.total ?? 0} previous={data?.temp.prevTotal ?? 0} colors={colors} />
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: (data?.temp.passRate ?? 0) >= 90 ? colors.success : colors.warning }}>
                {data?.temp.passRate ?? 0}%
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Pass Rate</Text>
              <TrendArrow current={data?.temp.passRate ?? 0} previous={data?.temp.prevPassRate ?? 0} colors={colors} />
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: (data?.temp.fail ?? 0) > 0 ? colors.destructive : colors.text }}>
                {data?.temp.fail ?? 0}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Failures</Text>
            </View>
          </View>

          {/* Mini sparkline bars */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginBottom: 6 }}>Last 7 days</Text>
          <View style={{ flexDirection: "row", gap: 3, height: 32, alignItems: "flex-end" }}>
            {(data?.temp.byDay ?? Array(7).fill(0)).map((count: number, i: number) => (
              <View key={i} style={{ flex: 1, justifyContent: "flex-end" }}>
                <View
                  style={{
                    height: maxDayLogs > 0 ? Math.max((count / maxDayLogs) * 28, 2) : 2,
                    borderRadius: 2,
                    backgroundColor: count > 0 ? colors.success : colors.border,
                  }}
                />
              </View>
            ))}
          </View>
        </Pressable>

        {/* ── Cleaning Card ──────────────────────────────── */}
        <Pressable
          onPress={() => router.push("/(app)/food-safety")}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent + "20", alignItems: "center", justifyContent: "center" }}>
                <SprayCan size={18} color={colors.accent} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Cleaning Logs</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>{data?.clean.total ?? 0}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Logs</Text>
              <TrendArrow current={data?.clean.total ?? 0} previous={data?.clean.prevTotal ?? 0} colors={colors} />
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: (data?.clean.passRate ?? 0) >= 90 ? colors.success : colors.warning }}>
                {data?.clean.passRate ?? 0}%
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Pass Rate</Text>
              <TrendArrow current={data?.clean.passRate ?? 0} previous={data?.clean.prevPassRate ?? 0} colors={colors} />
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>{data?.clean.pass ?? 0}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Passed</Text>
            </View>
          </View>

          {/* Mini sparkline bars */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginBottom: 6 }}>Last 7 days</Text>
          <View style={{ flexDirection: "row", gap: 3, height: 32, alignItems: "flex-end" }}>
            {(data?.clean.byDay ?? Array(7).fill(0)).map((count: number, i: number) => (
              <View key={i} style={{ flex: 1, justifyContent: "flex-end" }}>
                <View
                  style={{
                    height: maxDayLogs > 0 ? Math.max((count / maxDayLogs) * 28, 2) : 2,
                    borderRadius: 2,
                    backgroundColor: count > 0 ? colors.accent : colors.border,
                  }}
                />
              </View>
            ))}
          </View>
        </Pressable>

        {/* ── Self-Assessment Card ──────────────────────── */}
        <Pressable
          onPress={() => router.push("/(app)/food-safety")}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent + "20", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={18} color={colors.accent} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Self-Assessment (A1-A40)</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
          </View>

          {/* Latest score */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              borderWidth: 4,
              borderColor: (data?.assessment.latest ?? 0) >= 80 ? colors.success : (data?.assessment.latest ?? 0) >= 50 ? colors.warning : colors.destructive,
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{
                fontSize: 24, fontWeight: "800",
                color: data?.assessment.latest != null ? colors.text : colors.textMuted,
              }}>
                {data?.assessment.latest != null ? `${data.assessment.latest}%` : "—"}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Latest Score</Text>
          </View>

          {/* History list */}
          {(data?.assessment.history ?? []).length > 1 && (
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}>Recent assessments</Text>
              {data!.assessment.history.map((a: any, i: number) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{a.date}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MiniBar value={a.score} max={100} color={colors.accent} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: a.score >= 80 ? colors.success : a.score >= 50 ? colors.warning : colors.destructive, width: 36, textAlign: "right" }}>
                      {a.score}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        {/* ── Corrective Actions Card ──────────────────── */}
        <Pressable
          onPress={() => router.push("/(app)/food-safety")}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.warning + "20", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={18} color={colors.warning} strokeWidth={1.5} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Corrective Actions</Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
          </View>

          {/* Critical alert */}
          {(data?.actions.criticalOpen ?? 0) > 0 && (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              backgroundColor: colors.destructive + "12",
              borderRadius: 8, padding: 10, marginBottom: 12,
              borderWidth: 1, borderColor: colors.destructive + "30",
            }}>
              <XCircle size={16} color={colors.destructive} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.destructive }}>
                {data!.actions.criticalOpen} critical action{data!.actions.criticalOpen > 1 ? "s" : ""} open
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: (data?.actions.open ?? 0) > 0 ? colors.warning : colors.text }}>
                {data?.actions.open ?? 0}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Open</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.success }}>{data?.actions.closed ?? 0}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Resolved</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>{data?.actions.total ?? 0}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>All Time</Text>
            </View>
          </View>

          {/* Resolution rate bar */}
          {(data?.actions.total ?? 0) > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Resolution rate</Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>
                  {Math.round(((data?.actions.closed ?? 0) / (data?.actions.total ?? 1)) * 100)}%
                </Text>
              </View>
              <MiniBar value={data?.actions.closed ?? 0} max={data?.actions.total ?? 1} color={colors.success} />
            </View>
          )}
        </Pressable>

        {/* ── Audit Readiness Score ──────────────────────── */}
        {data?.readiness.lastAuditScore != null && (
          <View style={{
            backgroundColor: colors.accent + "12",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.accent + "30",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <ShieldCheck size={18} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Last Audit Score</Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: "800", color: colors.accent }}>
              {data.readiness.lastAuditScore}%
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
