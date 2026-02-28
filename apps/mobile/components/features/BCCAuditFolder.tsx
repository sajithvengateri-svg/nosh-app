import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Share,
  Alert,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { DatePicker } from "../ui/DatePicker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditSection {
  key: string;
  label: string;
  table: string;
  dateCol: string | null;
  filter?: Record<string, string>;
}

interface SectionResult {
  key: string;
  count: number;
  lastEntry: string | null;
}

type PeriodOption = "7" | "30" | "90" | "custom";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUDIT_SECTIONS: AuditSection[] = [
  { key: "profile", label: "Compliance Profile & Licence", table: "compliance_profiles", dateCol: null },
  { key: "fss", label: "Food Safety Supervisor Certs", table: "food_safety_supervisors", dateCol: "created_at" },
  { key: "training", label: "Food Handler Training", table: "food_handler_training", dateCol: "training_date" },
  { key: "daily_logs", label: "Daily Compliance Logs", table: "daily_compliance_logs", dateCol: "log_date" },
  { key: "corrective", label: "Corrective Action Register", table: "corrective_actions", dateCol: "created_at" },
  { key: "cleaning", label: "Cleaning Schedules", table: "bcc_cleaning_schedules", dateCol: "created_at" },
  { key: "pest", label: "Pest Control Records", table: "bcc_pest_control_logs", dateCol: "log_date" },
  { key: "equipment", label: "Equipment Calibration", table: "bcc_equipment_calibration_logs", dateCol: "calibration_date" },
  { key: "grease", label: "Grease Trap Service", table: "food_safety_logs", dateCol: "log_date", filter: { log_type: "grease_trap" } },
  { key: "hood", label: "Hood/Canopy Cleaning", table: "food_safety_logs", dateCol: "log_date", filter: { log_type: "hood_cleaning" } },
  { key: "suppliers", label: "Supplier Register", table: "bcc_supplier_register", dateCol: null },
  { key: "self_assessment", label: "Self-Assessment & Star Rating", table: "audit_self_assessments", dateCol: "assessment_date" },
  { key: "haccp", label: "HACCP Plan", table: "food_safety_logs", dateCol: "log_date", filter: { log_type: "haccp_plan" } },
  { key: "receiving", label: "Receiving Log", table: "daily_compliance_logs", dateCol: "log_date", filter: { log_type: "receiving" } },
];

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: "7", label: "7 Days" },
  { value: "30", label: "30 Days" },
  { value: "90", label: "90 Days" },
  { value: "custom", label: "Custom" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateRange(period: PeriodOption, customStart: string, customEnd: string): { startDate: string; endDate: string } {
  if (period === "custom") {
    return { startDate: customStart, endDate: customEnd || formatDate(new Date()) };
  }
  const days = parseInt(period, 10);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCAuditFolder() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;

  // Period state
  const [period, setPeriod] = useState<PeriodOption>("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { startDate, endDate } = useMemo(
    () => getDateRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  // ---------------------------------------------------------------------------
  // Query — fetch counts for all 14 sections
  // ---------------------------------------------------------------------------

  const {
    data: sectionResults,
    isLoading,
    isRefetching,
  } = useQuery<SectionResult[]>({
    queryKey: ["audit-folder", orgId, startDate, endDate],
    queryFn: async () => {
      if (!orgId) return [];

      const results = await Promise.all(
        AUDIT_SECTIONS.map(async (section) => {
          // Count query
          let query = (supabase as any)
            .from(section.table)
            .select("*", { count: "exact", head: true })
            .eq("org_id", orgId);

          if (section.filter) {
            Object.entries(section.filter).forEach(([k, v]) => {
              query = query.eq(k, v);
            });
          }

          if (section.dateCol && startDate) {
            query = query.gte(section.dateCol, startDate);
            if (endDate) {
              query = query.lte(section.dateCol, endDate);
            }
          }

          const { count, error } = await query;

          // Last entry query (only if dateCol exists)
          let lastEntry: string | null = null;
          if (section.dateCol) {
            let lastQuery = (supabase as any)
              .from(section.table)
              .select(section.dateCol)
              .eq("org_id", orgId)
              .order(section.dateCol, { ascending: false })
              .limit(1);

            if (section.filter) {
              Object.entries(section.filter).forEach(([k, v]) => {
                lastQuery = lastQuery.eq(k, v);
              });
            }

            const { data: lastData } = await lastQuery;
            if (lastData && lastData.length > 0 && lastData[0][section.dateCol]) {
              lastEntry = lastData[0][section.dateCol];
            }
          }

          return {
            key: section.key,
            count: error ? 0 : (count || 0),
            lastEntry,
          };
        })
      );

      return results;
    },
    enabled: !!orgId,
  });

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const sectionsWithData = useMemo(
    () => (sectionResults ?? []).filter((s) => s.count > 0).length,
    [sectionResults]
  );

  const totalSections = AUDIT_SECTIONS.length;
  const progressPct = totalSections > 0 ? Math.round((sectionsWithData / totalSections) * 100) : 0;

  // ---------------------------------------------------------------------------
  // Share / Email handlers
  // ---------------------------------------------------------------------------

  function buildSummaryText(): string {
    const orgName = currentOrg?.name || "Unknown Organisation";
    const generatedDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const separator = "──────────────────────────────────────";

    const sectionLines: string[] = [];
    let sectionIndex = 0;
    for (const section of AUDIT_SECTIONS) {
      sectionIndex += 1;
      const result = (sectionResults ?? []).find((r) => r.key === section.key);
      const count = result?.count ?? 0;
      const lastEntry = result?.lastEntry ?? null;
      const status = count > 0 ? "COMPLETE" : "MISSING";
      const lastEntryStr = lastEntry ? `  Last entry: ${lastEntry.split("T")[0]}` : "";

      sectionLines.push(
        `${sectionIndex}. ${section.label}`,
        `   Status: ${status}  |  Records: ${count}${lastEntryStr}`,
        ""
      );
    }

    return [
      separator,
      `  BCC AUDIT FOLDER`,
      `  ${orgName}`,
      separator,
      "",
      `Period:     ${startDate}  to  ${endDate}`,
      `Generated:  ${generatedDate}`,
      "",
      separator,
      `  SECTION DETAILS`,
      separator,
      "",
      ...sectionLines,
      separator,
      `  SUMMARY`,
      separator,
      "",
      `Sections with data:  ${sectionsWithData} / ${totalSections}`,
      `Overall completion:  ${progressPct}%`,
      "",
      separator,
      "Generated by Chef OS",
    ].join("\n");
  }

  async function handleShareFolder() {
    try {
      await Share.share({ message: buildSummaryText() });
    } catch (err: any) {
      Alert.alert("Share Error", err?.message || "Unable to share audit folder.");
    }
  }

  async function handleEmailInspector() {
    const orgName = currentOrg?.name || "Audit Folder";
    const subject = encodeURIComponent(`BCC Audit Folder - ${orgName}`);
    const body = encodeURIComponent(buildSummaryText());
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Fallback to share sheet if no mail client is available
        await Share.share({
          message: buildSummaryText(),
          title: `BCC Audit Folder - ${orgName}`,
        });
      }
    } catch (err: any) {
      Alert.alert("Email Error", err?.message || "Unable to open email client.");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!orgId) {
    return (
      <EmptyState
        title="No Organisation Selected"
        description="Select an organisation to view the audit folder."
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 16,
      }}
    >
      {/* ── Period Selector ─────────────────────────────────────── */}
      <Card>
        <CardContent style={{ paddingTop: 16 }}>
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
            Audit Period
          </Text>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = period === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPeriod(opt.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 9999,
                    backgroundColor: isActive ? colors.accent : colors.surface,
                    borderWidth: 1,
                    borderColor: isActive ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : colors.text,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {period === "custom" && (
            <View style={{ marginTop: 12, gap: 8 }}>
              <DatePicker
                label="Start Date"
                placeholder="Select start date"
                value={customStart ? new Date(customStart + "T00:00:00") : new Date()}
                onChange={(date) => setCustomStart(date.toISOString().split("T")[0])}
              />
              <DatePicker
                label="End Date"
                placeholder="Select end date"
                value={customEnd ? new Date(customEnd + "T00:00:00") : new Date()}
                onChange={(date) => setCustomEnd(date.toISOString().split("T")[0])}
              />
            </View>
          )}
        </CardContent>
      </Card>

      {/* ── Summary Bar ─────────────────────────────────────────── */}
      <Card>
        <CardContent style={{ paddingTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {sectionsWithData}/{totalSections} sections have data
            </Text>
            {isLoading || isRefetching ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Badge
                variant={
                  sectionsWithData === totalSections
                    ? "success"
                    : sectionsWithData > 0
                      ? "warning"
                      : "destructive"
                }
              >
                {progressPct}%
              </Badge>
            )}
          </View>

          {/* Progress bar */}
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
                width: `${progressPct}%` as any,
                backgroundColor:
                  sectionsWithData === totalSections
                    ? colors.success
                    : sectionsWithData > 0
                      ? colors.warning
                      : colors.destructive,
              }}
            />
          </View>
        </CardContent>
      </Card>

      {/* ── Section Cards ───────────────────────────────────────── */}
      {isLoading ? (
        <View style={{ gap: 10, paddingTop: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent style={{ paddingTop: 16 }}>
                <View
                  style={{
                    height: 14,
                    width: "60%",
                    backgroundColor: colors.border,
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <View
                  style={{
                    height: 12,
                    width: "30%",
                    backgroundColor: colors.border,
                    borderRadius: 4,
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {AUDIT_SECTIONS.map((section) => {
            const result = (sectionResults ?? []).find(
              (r) => r.key === section.key
            );
            const count = result?.count ?? 0;
            const lastEntry = result?.lastEntry ?? null;
            const hasData = count > 0;

            return (
              <Card key={section.key}>
                <CardContent style={{ paddingTop: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    {/* Section label */}
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.text,
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      {section.label}
                    </Text>

                    {/* Completeness badge */}
                    <Badge variant={hasData ? "success" : "destructive"}>
                      {hasData ? "Complete" : "Missing"}
                    </Badge>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {/* Record count badge */}
                    <Badge variant={hasData ? "success" : "destructive"}>
                      {count} record{count !== 1 ? "s" : ""}
                    </Badge>

                    {/* Last entry date */}
                    {section.dateCol && lastEntry && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        Last entry: {lastEntry.split("T")[0]}
                      </Text>
                    )}
                  </View>
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {/* ── Action Buttons ──────────────────────────────────────── */}
      {!isLoading && (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Button size="lg" onPress={handleShareFolder}>
            Share Audit Folder
          </Button>

          <Button variant="outline" size="lg" onPress={handleEmailInspector}>
            Email to Inspector
          </Button>
        </View>
      )}
    </ScrollView>
  );
}
