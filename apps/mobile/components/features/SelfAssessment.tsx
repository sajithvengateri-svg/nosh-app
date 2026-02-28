import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { StarRating } from "../ui/StarRating";
import { CheckCircle, CheckCircle2, Circle, ChevronDown, ChevronUp, Send } from "lucide-react-native";
import { useComplianceContext } from "../../contexts/ComplianceProvider";
import { getAllAssessmentItems } from "@queitos/shared";
import type { AssessmentItem, AssessmentSection } from "@queitos/shared";

// ── Types ────────────────────────────────────────────────────────────

type ItemStatus = "compliant" | "non_compliant" | "not_assessed";
type Severity = "critical" | "major" | "minor";

interface ItemAnswer {
  status: ItemStatus;
  severity?: Severity;
  comments?: string;
  evidence?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatHistoryDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1] || month} ${year}`;
}

function getHistoryStats(historyAnswers: Record<string, ItemAnswer>) {
  const values = Object.values(historyAnswers);
  const assessed = values.filter((a) => a.status !== "not_assessed").length;
  const compliant = values.filter((a) => a.status === "compliant").length;
  const nonCompliant = values.filter((a) => a.status === "non_compliant").length;
  return { assessed, compliant, nonCompliant };
}

// ── Component ────────────────────────────────────────────────────────

interface SelfAssessmentProps {
  mode?: "standalone" | "onboarding";
  onComplete?: () => void;
}

export function SelfAssessment({ mode = "standalone", onComplete }: SelfAssessmentProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const { config } = useComplianceContext();

  const allItems = useMemo(() => getAllAssessmentItems(config), [config]);
  const totalItems = allItems.length;
  const accentColor = config.labels.accentColor;
  const hasSeverity = config.features.hasSeverityLevels;
  const hasEvidence = config.features.hasEvidenceChecks;
  const hasStarRating = config.features.hasStarRating;

  // ── State ─────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.assessmentSections.map((s) => [s.key, true]))
  );
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Query: load today's saved assessment ─────────────────────
  const today = getTodayISO();

  const assessmentQueryFilter = config.assessmentFrameworkFilter;

  const { data: savedAssessment, isLoading } = useQuery({
    queryKey: ["self-assessment", config.id, orgId, today],
    queryFn: async () => {
      let query = supabase
        .from(config.tables.auditSelfAssessments)
        .select("*")
        .eq("org_id", orgId)
        .eq("assessment_date", today);

      if (assessmentQueryFilter) {
        query = query.eq("framework", assessmentQueryFilter);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
    enabled: !!orgId,
  });

  // ── Query: load assessment history (last 10) ─────────────────
  const { data: history } = useQuery({
    queryKey: ["self-assessment-history", config.id, orgId],
    queryFn: async () => {
      let query = supabase
        .from(config.tables.auditSelfAssessments)
        .select("id, assessment_date, predicted_star_rating, answers, responses, score")
        .eq("org_id", orgId)
        .neq("assessment_date", today);

      if (assessmentQueryFilter) {
        query = query.eq("framework", assessmentQueryFilter);
      }

      const { data, error } = await query.order("assessment_date", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Initialise answers from saved data
  useEffect(() => {
    if (savedAssessment?.answers) {
      setAnswers(savedAssessment.answers as Record<string, ItemAnswer>);
    } else if (savedAssessment?.responses) {
      // FSSAI-style simple pass/fail responses → convert to ItemAnswer format
      const converted: Record<string, ItemAnswer> = {};
      for (const [key, val] of Object.entries(savedAssessment.responses)) {
        converted[key] = { status: val ? "compliant" : "non_compliant" };
      }
      setAnswers(converted);
    }
  }, [savedAssessment]);

  // ── Derived data ──────────────────────────────────────────────
  const assessedCount = useMemo(
    () => Object.values(answers).filter((a) => a.status !== "not_assessed").length,
    [answers]
  );

  const compliantCount = useMemo(
    () => Object.values(answers).filter((a) => a.status === "compliant").length,
    [answers]
  );

  const nonCompliantCount = useMemo(
    () => Object.values(answers).filter((a) => a.status === "non_compliant").length,
    [answers]
  );

  const minorCount = useMemo(
    () => Object.values(answers).filter((a) => a.status === "non_compliant" && a.severity === "minor").length,
    [answers]
  );
  const majorCount = useMemo(
    () => Object.values(answers).filter((a) => a.status === "non_compliant" && a.severity === "major").length,
    [answers]
  );
  const criticalCount = useMemo(
    () => Object.values(answers).filter((a) => a.status === "non_compliant" && a.severity === "critical").length,
    [answers]
  );

  const predictedRating = useMemo(() => {
    if (hasStarRating && config.scoring.computeStarRating) {
      return config.scoring.computeStarRating(answers);
    }
    // Percentage model
    return assessedCount > 0 ? Math.round((compliantCount / assessedCount) * 100) : 0;
  }, [answers, config, hasStarRating, assessedCount, compliantCount]);

  const ratingLabel = useMemo(() => {
    if (hasStarRating) {
      const tier = config.scoring.tiers.find((t) => predictedRating >= t.min);
      return tier?.label ?? "";
    }
    if (predictedRating >= 80) return "Compliant";
    if (predictedRating >= 50) return "Needs Improvement";
    return "Non-Compliant";
  }, [predictedRating, hasStarRating, config.scoring.tiers]);

  const progressPct = totalItems > 0 ? (assessedCount / totalItems) * 100 : 0;

  // ── Save mutation ─────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");

      if (hasSeverity) {
        // BCC-style: save full answers with severity
        const payload: any = {
          org_id: orgId,
          assessment_date: today,
          answers,
          predicted_star_rating: predictedRating,
          assessed_by: user?.id || null,
          assessed_by_name: user?.email || null,
        };
        if (assessmentQueryFilter) {
          payload.framework = assessmentQueryFilter;
        }

        const { error } = await supabase
          .from(config.tables.auditSelfAssessments)
          .upsert(payload, { onConflict: "org_id,assessment_date" });
        if (error) throw error;
      } else {
        // FSSAI-style: simple pass/fail responses
        const responses: Record<string, boolean> = {};
        for (const [key, val] of Object.entries(answers)) {
          responses[key] = val.status === "compliant";
        }

        const payload: any = {
          org_id: orgId,
          responses,
          score: assessedCount > 0 ? Math.round((compliantCount / totalItems) * 100) : 0,
          total_items: totalItems,
          passed_items: compliantCount,
        };
        if (assessmentQueryFilter) {
          payload.framework = assessmentQueryFilter;
        }

        const { error } = await supabase
          .from(config.tables.auditSelfAssessments)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-assessment", config.id, orgId, today] });
      queryClient.invalidateQueries({ queryKey: ["self-assessment-history", config.id, orgId] });
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      if (mode === "onboarding" && onComplete) {
        onComplete();
      } else {
        const msg = hasStarRating
          ? `Assessment saved. Predicted rating: ${predictedRating} stars.`
          : `Assessment submitted. Score: ${assessedCount > 0 ? Math.round((compliantCount / assessedCount) * 100) : 0}%`;
        Alert.alert("Saved", msg);
      }
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ── Handlers ──────────────────────────────────────────────────
  const setItemStatus = (code: string, status: ItemStatus, item: AssessmentItem) => {
    setAnswers((prev) => {
      const existing = prev[code];
      const next = { ...prev };

      if (status === "non_compliant" && hasSeverity) {
        const defaultSeverity = item.severities[0] || "minor";
        next[code] = {
          status,
          severity: existing?.severity && item.severities.includes(existing.severity as Severity)
            ? existing.severity
            : defaultSeverity,
          comments: existing?.comments,
          evidence: existing?.evidence,
        };
      } else {
        next[code] = { status, comments: existing?.comments, evidence: existing?.evidence };
      }
      return next;
    });
  };

  const setItemSeverity = (code: string, severity: Severity) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: { ...prev[code], status: "non_compliant", severity },
    }));
  };

  const setItemComments = (code: string, comments: string) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: { ...prev[code], status: prev[code]?.status || "not_assessed", comments },
    }));
  };

  const setItemEvidence = (code: string, evidence: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: { ...prev[code], status: prev[code]?.status || "not_assessed", evidence },
    }));
  };

  const toggleComments = (code: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleMarkAllCompliant = () => {
    Alert.alert(
      "Mark All Compliant",
      `Mark all ${totalItems} items as compliant? You can still adjust individual items after.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            setAnswers((prev) => {
              const next = { ...prev };
              for (const item of allItems) {
                const existing = next[item.code];
                next[item.code] = { status: "compliant", comments: existing?.comments, evidence: existing?.evidence };
              }
              return next;
            });
          },
        },
      ]
    );
  };

  const loadHistoryAssessment = (historyAnswers: Record<string, ItemAnswer>) => {
    setAnswers(historyAnswers);
  };

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>
          Loading assessment...
        </Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      {mode !== "onboarding" && (
        <View style={{ paddingVertical: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, textAlign: "center" }}>
            {config.labels.assessmentTitle}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 2 }}>
            {config.labels.assessmentSubtitle}
          </Text>
        </View>
      )}

      {/* ── Summary Card ────────────────────────────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent style={{ paddingTop: 20 }}>
          {/* Progress bar */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>
                Progress
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>
                {assessedCount}/{totalItems}
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: "hidden" }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  width: `${progressPct}%` as any,
                  backgroundColor: assessedCount === totalItems ? colors.success : accentColor,
                }}
              />
            </View>
          </View>

          {/* Compliance counts */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <Badge variant="success">{compliantCount} Compliant</Badge>
            <Badge variant="destructive">{nonCompliantCount} Non-Compliant</Badge>
            <Badge variant="secondary">{totalItems - assessedCount} Not Assessed</Badge>
          </View>

          {/* Non-compliance severity breakdown (BCC-style) */}
          {hasSeverity && nonCompliantCount > 0 && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {minorCount > 0 && <Badge variant="secondary">{minorCount} Minor</Badge>}
              {majorCount > 0 && <Badge variant="warning">{majorCount} Major</Badge>}
              {criticalCount > 0 && <Badge variant="destructive">{criticalCount} Critical</Badge>}
            </View>
          )}

          {/* Score display */}
          <View>
            {hasStarRating ? (
              <>
                <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Predicted Star Rating
                </Text>
                <StarRating rating={predictedRating} size="md" showLabel />
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {ratingLabel}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Score
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                  <Text style={{ fontSize: 28, fontWeight: "800", color: predictedRating >= 80 ? colors.success : predictedRating >= 50 ? colors.warning : colors.destructive }}>
                    {predictedRating}%
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    {ratingLabel}
                  </Text>
                </View>
              </>
            )}
          </View>
        </CardContent>
      </Card>

      {/* ── Severity level guide (BCC only) ──────────────────── */}
      {hasSeverity && (
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 2 }}>
            Non-Compliance Levels
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
            <Text style={{ fontWeight: "700", color: colors.textMuted }}>Minor</Text> — Small, low risk breach easily rectified
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
            <Text style={{ fontWeight: "700", color: colors.warning }}>Major</Text> — Serious breach with high risk to food safety
          </Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
            <Text style={{ fontWeight: "700", color: colors.destructive }}>Critical</Text> — Highest risk to producing safe food
          </Text>
        </View>
      )}

      {/* ── Mark All Compliant ────────────────────────────────── */}
      <Button
        variant="outline"
        onPress={handleMarkAllCompliant}
        style={{ marginBottom: 16, flexDirection: "row", gap: 8 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <CheckCircle size={18} color={colors.success} />
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
            Mark All Compliant
          </Text>
        </View>
      </Button>

      {/* ── Assessment Sections ──────────────────────────────── */}
      {config.assessmentSections.map((section) => {
        const expanded = expandedSections[section.key] ?? true;
        const sectionPassed = section.items.filter((i) => answers[i.code]?.status === "compliant").length;

        return (
          <View key={section.key} style={{ marginBottom: 16 }}>
            {/* Section header */}
            <Pressable
              onPress={() => toggleSection(section.key)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                paddingHorizontal: 4,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  {section.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  {sectionPassed}/{section.items.length} compliant
                </Text>
              </View>
              {expanded ? (
                <ChevronUp size={20} color={colors.textMuted} />
              ) : (
                <ChevronDown size={20} color={colors.textMuted} />
              )}
            </Pressable>

            {expanded && (
              <Card>
                <CardContent style={{ paddingTop: 16, gap: 12 }}>
                  {section.items.map((item, idx) => {
                    const answer = answers[item.code];
                    const status: ItemStatus = answer?.status || "not_assessed";
                    const showComments = expandedComments.has(item.code) || !!answer?.comments;

                    return (
                      <View key={item.code}>
                        {idx > 0 && (
                          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />
                        )}

                        {/* Item header: code + text */}
                        <View style={{ flexDirection: "row", marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: accentColor, width: 36 }}>
                            {item.code}
                          </Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>
                              {item.text}
                            </Text>
                            {item.detail && (
                              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                                {item.detail}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Compliant / Non-Compliant / N/A toggle */}
                        <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                          <Pressable
                            onPress={() => setItemStatus(item.code, "compliant", item)}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: "center",
                              backgroundColor: status === "compliant" ? colors.successBg : colors.surface,
                              borderWidth: 1.5,
                              borderColor: status === "compliant" ? colors.success : colors.border,
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: status === "compliant" ? colors.success : colors.textSecondary }}>
                              Yes
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => setItemStatus(item.code, "non_compliant", item)}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: "center",
                              backgroundColor: status === "non_compliant" ? colors.destructiveBg : colors.surface,
                              borderWidth: 1.5,
                              borderColor: status === "non_compliant" ? colors.destructive : colors.border,
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: status === "non_compliant" ? colors.destructive : colors.textSecondary }}>
                              No
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => setItemStatus(item.code, "not_assessed", item)}
                            style={{
                              flex: 0.6,
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: "center",
                              backgroundColor: colors.surface,
                              borderWidth: 1.5,
                              borderColor: status === "not_assessed" ? colors.textMuted : colors.border,
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: status === "not_assessed" ? colors.textMuted : colors.textSecondary }}>
                              N/A
                            </Text>
                          </Pressable>
                        </View>

                        {/* Severity pills (shown when non-compliant + hasSeverity) */}
                        {status === "non_compliant" && hasSeverity && (
                          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                            {item.severities.includes("minor") && (
                              <Pressable
                                onPress={() => setItemSeverity(item.code, "minor")}
                                style={{
                                  flex: 1,
                                  paddingVertical: 7,
                                  borderRadius: 8,
                                  alignItems: "center",
                                  backgroundColor: colors.surface,
                                  borderWidth: 1.5,
                                  borderColor: answer?.severity === "minor" ? colors.textMuted : colors.border,
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: "700", color: answer?.severity === "minor" ? colors.text : colors.textSecondary }}>
                                  Minor
                                </Text>
                              </Pressable>
                            )}
                            {item.severities.includes("major") && (
                              <Pressable
                                onPress={() => setItemSeverity(item.code, "major")}
                                style={{
                                  flex: 1,
                                  paddingVertical: 7,
                                  borderRadius: 8,
                                  alignItems: "center",
                                  backgroundColor: answer?.severity === "major" ? colors.warningBg : colors.surface,
                                  borderWidth: 1.5,
                                  borderColor: answer?.severity === "major" ? colors.warning : colors.border,
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: "700", color: answer?.severity === "major" ? colors.warning : colors.textSecondary }}>
                                  Major
                                </Text>
                              </Pressable>
                            )}
                            {item.severities.includes("critical") && (
                              <Pressable
                                onPress={() => setItemSeverity(item.code, "critical")}
                                style={{
                                  flex: 1,
                                  paddingVertical: 7,
                                  borderRadius: 8,
                                  alignItems: "center",
                                  backgroundColor: answer?.severity === "critical" ? colors.destructiveBg : colors.surface,
                                  borderWidth: 1.5,
                                  borderColor: answer?.severity === "critical" ? colors.destructive : colors.border,
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: "700", color: answer?.severity === "critical" ? colors.destructive : colors.textSecondary }}>
                                  Critical
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        )}

                        {/* Evidence checkbox (BCC Category 1 businesses) */}
                        {hasEvidence && item.hasEvidence && (
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, backgroundColor: colors.surface, borderRadius: 8, padding: 8 }}>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1 }}>
                              Evidence of food safety controls
                            </Text>
                            <Switch
                              value={answer?.evidence || false}
                              onValueChange={(val) => setItemEvidence(item.code, val)}
                              trackColor={{ false: colors.border, true: colors.success }}
                              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                          </View>
                        )}

                        {/* Comments toggle + input */}
                        <Pressable
                          onPress={() => toggleComments(item.code)}
                          style={{ marginTop: 6, paddingVertical: 2 }}
                        >
                          <Text style={{ fontSize: 11, color: accentColor, fontWeight: "600" }}>
                            {showComments ? "Hide comments" : "Add comments"}
                          </Text>
                        </Pressable>
                        {showComments && (
                          <Input
                            placeholder="Comments / findings..."
                            value={answer?.comments || ""}
                            onChangeText={(v) => setItemComments(item.code, v)}
                            multiline
                            style={{ minHeight: 50, textAlignVertical: "top", fontSize: 12, marginTop: 4 }}
                          />
                        )}
                      </View>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </View>
        );
      })}

      {/* ── Star Rating Table (BCC-style) ────────────────────── */}
      {hasStarRating && (
        <Card style={{ marginBottom: 16 }}>
          <CardContent style={{ paddingTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              Star Rating Table
            </Text>
            {[
              { label: "0 non-compliances", stars: 5 },
              { label: "1\u20133 Minor non-compliances", stars: 4 },
              { label: "4\u20135 Minor non-compliances", stars: 3 },
              { label: "6+ Minor; or 1\u20132 Major; or 1 Critical", stars: 2 },
              { label: "3+ Major; or 2+ Critical", stars: 0 },
            ].map((row) => (
              <View
                key={row.stars}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: predictedRating === row.stars ? colors.accentBg : "transparent",
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  marginBottom: 2,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>
                  {row.label}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: predictedRating === row.stars ? accentColor : colors.text }}>
                    {row.stars}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {row.stars === 1 ? "star" : "stars"}
                  </Text>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Save Button ──────────────────────────────────────── */}
      <View style={{ paddingVertical: 8 }}>
        <Button
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
          style={{ backgroundColor: accentColor }}
          textStyle={{ color: "#FFFFFF" }}
        >
          Save {config.labels.assessmentTitle}
        </Button>
      </View>

      {/* ── Assessment History ────────────────────────────────── */}
      {history && history.length > 0 && (
        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            Assessment History
          </Text>
          {history.map((entry: any) => {
            const historyAnswers = entry.answers || entry.responses || {};
            const stats = getHistoryStats(historyAnswers as Record<string, ItemAnswer>);
            return (
              <Card key={entry.id} style={{ marginBottom: 10 }}>
                <CardContent style={{ paddingTop: 14, paddingBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                      {formatHistoryDate(entry.assessment_date)}
                    </Text>
                    {hasStarRating && entry.predicted_star_rating != null ? (
                      <StarRating rating={entry.predicted_star_rating} size="sm" />
                    ) : entry.score != null ? (
                      <Text style={{ fontSize: 14, fontWeight: "700", color: entry.score >= 80 ? colors.success : entry.score >= 50 ? colors.warning : colors.destructive }}>
                        {entry.score}%
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <Badge variant="secondary">{stats.assessed}/{totalItems} Assessed</Badge>
                    <Badge variant="success">{stats.compliant} Compliant</Badge>
                    <Badge variant="destructive">{stats.nonCompliant} Non-Compliant</Badge>
                  </View>
                  {entry.answers && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => loadHistoryAssessment(entry.answers as Record<string, ItemAnswer>)}
                    >
                      Load
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", marginTop: 8, marginBottom: 16, lineHeight: 14 }}>
        {config.labels.frameworkName} — {config.labels.certBody}
      </Text>
    </ScrollView>
  );
}
