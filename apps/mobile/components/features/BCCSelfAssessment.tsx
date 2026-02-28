import { useState, useMemo, useEffect } from "react";
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
import { CheckCircle } from "lucide-react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ItemStatus = "compliant" | "non_compliant" | "not_assessed";
type Severity = "critical" | "major" | "minor";

interface ItemAnswer {
  status: ItemStatus;
  severity?: Severity;
  comments?: string;
  evidence?: boolean; // Category 1 evidence checkbox
}

// ---------------------------------------------------------------------------
// Official BCC Eat Safe Brisbane Food Safety Checklist (A1-A40)
// Mirrors the official BCC form exactly.
// `severities` indicates which non-compliance levels are available per item
// (from the BCC form's checkbox columns — ☒ means not applicable).
// `hasEvidence` marks items where Category 1 businesses must provide evidence.
// ---------------------------------------------------------------------------

interface AssessmentItem {
  code: string;
  category: string;
  text: string;
  detail?: string;
  severities: Severity[];
  hasEvidence?: boolean;
}

const ASSESSMENT_ITEMS: AssessmentItem[] = [
  // ── General Requirements ────────────────────────────────────────────────
  {
    code: "A1",
    category: "General Requirements",
    text: "Licence \u2013 Is your Council food business licence current?",
    detail: "i.e. no outstanding fees",
    severities: ["minor"],
  },
  {
    code: "A2",
    category: "General Requirements",
    text: "Licence \u2013 Is the current licence displayed prominently on the premises?",
    severities: ["minor", "major"],
  },
  {
    code: "A3",
    category: "General Requirements",
    text: "Licence Conditions \u2013 Is your business complying with all site specific licence conditions (if applicable)?",
    severities: ["minor"],
  },
  {
    code: "A4",
    category: "General Requirements",
    text: "Previous non-compliances \u2013 Has your business fixed all previous non-compliance items?",
    severities: ["minor", "major"],
  },
  {
    code: "A5",
    category: "General Requirements",
    text: "Design \u2013 Does your business comply with the structural requirements of the Food Safety Standards?",
    severities: ["minor"],
  },
  {
    code: "A6",
    category: "General Requirements",
    text: "Food Safety Supervisor \u2013 Have you notified Council who your Food Safety Supervisor is/are?",
    severities: ["major"],
  },
  {
    code: "A7",
    category: "General Requirements",
    text: "Food Safety Supervisor \u2013 Is the Food Safety Supervisor reasonably available/contactable?",
    severities: ["minor", "major"],
  },
  {
    code: "A8",
    category: "General Requirements",
    text: "Food Safety Supervisor \u2013 Does the FSS have an RTO issued certificate that is no more than 5 years old?",
    severities: ["minor", "major"],
  },
  {
    code: "A9",
    category: "General Requirements",
    text: "Food Safety Program \u2013 If required, does your food business have an accredited Food Safety Program?",
    detail: "Category 1 and 2 businesses only",
    severities: ["major"],
  },
  {
    code: "A10",
    category: "General Requirements",
    text: "Skills and knowledge \u2013 Do you and your employees have appropriate skills and knowledge in food safety and hygiene matters?",
    severities: ["minor", "critical"],
  },

  // ── Food Handling Controls ──────────────────────────────────────────────
  {
    code: "A11",
    category: "Food Handling Controls",
    text: "Receival \u2013 Is food protected from contamination at receival and are potentially hazardous foods accepted at the correct temperature?",
    severities: ["minor", "critical"],
    hasEvidence: true,
  },
  {
    code: "A12",
    category: "Food Handling Controls",
    text: "Food storage \u2013 Is all food stored appropriately so that it is protected from contamination?",
    detail: "cold room / fridge \u2022 freezer \u2022 dry store",
    severities: ["minor", "major"],
  },
  {
    code: "A13",
    category: "Food Handling Controls",
    text: "Food storage \u2013 Is potentially hazardous food stored under temperature control?",
    detail: "cold food = 5\u00B0C and below \u2022 hot food = 60\u00B0C and above \u2022 frozen food = remain frozen",
    severities: ["minor", "major"],
    hasEvidence: true,
  },
  {
    code: "A14",
    category: "Food Handling Controls",
    text: "Food processing \u2013 Are suitable measures in place to prevent contamination?",
    detail: "e.g. cross contamination",
    severities: ["minor", "major"],
  },
  {
    code: "A15",
    category: "Food Handling Controls",
    text: "Food processing \u2013 Is potentially hazardous food that is ready to eat and held outside of temperature control monitored correctly?",
    detail: "e.g. 2 hour / 4 hour rule",
    severities: ["minor", "critical"],
    hasEvidence: true,
  },
  {
    code: "A16",
    category: "Food Handling Controls",
    text: "Thawing \u2013 Are acceptable methods used to thaw food?",
    severities: ["minor", "major"],
    hasEvidence: true,
  },
  {
    code: "A17",
    category: "Food Handling Controls",
    text: "Cooling \u2013 Are acceptable methods used to cool food?",
    severities: ["minor", "major"],
    hasEvidence: true,
  },
  {
    code: "A18",
    category: "Food Handling Controls",
    text: "Reheating \u2013 Are appropriate reheating procedures followed?",
    severities: ["minor", "critical"],
    hasEvidence: true,
  },
  {
    code: "A19",
    category: "Food Handling Controls",
    text: "Food display \u2013 Is food on display protected from contamination?",
    severities: ["minor", "major"],
  },
  {
    code: "A20",
    category: "Food Handling Controls",
    text: "Food display \u2013 Is potentially hazardous food displayed under correct temperature control?",
    severities: ["minor", "major"],
    hasEvidence: true,
  },
  {
    code: "A21",
    category: "Food Handling Controls",
    text: "Food packaging \u2013 Is food packaged in a manner that protects it from contamination?",
    severities: ["minor"],
  },
  {
    code: "A22",
    category: "Food Handling Controls",
    text: "Food transportation \u2013 Is food transported in a manner that protects it from contamination and keeps it at the appropriate temperature?",
    severities: ["minor"],
    hasEvidence: true,
  },
  {
    code: "A23",
    category: "Food Handling Controls",
    text: "Food for disposal \u2013 Do you use acceptable arrangements for throwing out food?",
    severities: ["minor"],
  },
  {
    code: "A24",
    category: "Food Handling Controls",
    text: "Food recall \u2013 If you are a wholesale supplier, manufacturer or importer of food, does your food business comply with the food recall requirements?",
    severities: ["minor"],
  },
  {
    code: "A25",
    category: "Food Handling Controls",
    text: "Alternative methods \u2013 Are your documented alternative compliance methods acceptable?",
    detail: "i.e. receipt, storage, cooling, reheating, display, transport",
    severities: ["minor"],
  },

  // ── Health and Hygiene Requirements ─────────────────────────────────────
  {
    code: "A26",
    category: "Health and Hygiene Requirements",
    text: "Contact with food \u2013 Does your business minimise the risk of contamination of food and food contact surfaces?",
    severities: ["minor", "critical"],
  },
  {
    code: "A27",
    category: "Health and Hygiene Requirements",
    text: "Health of food handlers \u2013 Do you ensure staff members do not engage in food handling if they are suffering from a food-borne illness or are sick?",
    severities: ["minor", "major"],
  },
  {
    code: "A28",
    category: "Health and Hygiene Requirements",
    text: "Hygiene \u2013 Do food handlers exercise good hygiene practices?",
    detail: "e.g. cleanliness of clothing, not eating over surfaces, washing hands correctly and at appropriate times, jewellery",
    severities: ["minor", "critical"],
  },
  {
    code: "A29",
    category: "Health and Hygiene Requirements",
    text: "Hand washing facilities \u2013 Does your business have adequate hand washing facilities?",
    detail: "soap \u2022 warm running water \u2022 single use towel \u2022 easily accessible basin",
    severities: ["minor", "critical"],
  },
  {
    code: "A30",
    category: "Health and Hygiene Requirements",
    text: "Duty of food business \u2013 Do you inform food handlers of their obligations and take measures to ensure they do not contaminate food?",
    severities: ["minor", "critical"],
  },

  // ── Cleaning, Sanitising and Maintenance ────────────────────────────────
  {
    code: "A31",
    category: "Cleaning, Sanitising and Maintenance",
    text: "Cleanliness \u2013 Are the floors, walls and ceilings maintained in a clean condition?",
    severities: ["minor", "critical"],
  },
  {
    code: "A32",
    category: "Cleaning, Sanitising and Maintenance",
    text: "Cleanliness \u2013 Are the fixtures, fittings and equipment maintained in a clean condition?",
    detail: "mechanical exhaust ventilation \u2022 fridges, coolrooms, freezers \u2022 benches, shelves, cooking equipment",
    severities: ["minor", "major", "critical"],
    hasEvidence: true,
  },
  {
    code: "A33",
    category: "Cleaning, Sanitising and Maintenance",
    text: "Sanitation \u2013 Has your business provided clean and sanitary equipment including eating/drinking utensils and food contact surfaces? Are food contact surfaces sanitised correctly?",
    severities: ["minor", "major"],
    hasEvidence: true,
  },
  {
    code: "A34",
    category: "Cleaning, Sanitising and Maintenance",
    text: "Maintenance \u2013 Does your business ensure no damaged (cracked/broken) utensils, crockery, cutting boards are used?",
    severities: ["minor", "critical"],
  },
  {
    code: "A35",
    category: "Cleaning, Sanitising and Maintenance",
    text: "Maintenance \u2013 Are your premises\u2019 fixtures, fittings and equipment maintained in a good state of repair and working order?",
    detail: "floors, walls & ceilings \u2022 fixtures, fittings & equipment \u2022 mechanical exhaust ventilation",
    severities: ["minor", "critical"],
  },

  // ── Miscellaneous ───────────────────────────────────────────────────────
  {
    code: "A36",
    category: "Miscellaneous",
    text: "Thermometer \u2013 Does your food business (if handling potentially hazardous food) have a thermometer?",
    severities: ["minor", "critical"],
  },
  {
    code: "A37",
    category: "Miscellaneous",
    text: "Single Use Items \u2013 Are single use items protected from contamination until use and not used more than once?",
    severities: ["minor"],
  },
  {
    code: "A38",
    category: "Miscellaneous",
    text: "Toilet \u2013 Are adequate staff toilets provided and in a clean state?",
    severities: ["minor", "critical"],
  },
  {
    code: "A39",
    category: "Miscellaneous",
    text: "Animals and pests \u2013 Is your food business completely free from animals or vermin (assistance animals exempt)?",
    severities: ["minor", "major"],
  },
  {
    code: "A40",
    category: "Miscellaneous",
    text: "Animals and pests \u2013 Are animals and pests prevented from being on the premises?",
    severities: ["minor", "critical"],
  },
];

// ---------------------------------------------------------------------------
// Star rating — exact BCC formula from the Results Table
// ---------------------------------------------------------------------------
// 0 non-compliances                              → 5 stars
// 1-3 Minor non-compliances only                 → 4 stars
// 4-5 Minor non-compliances only                 → 3 stars
// 6+ Minor only; or 1-2 Major; or 1 Critical     → 2 stars
// 3+ Major; or 2+ Critical                        → 0 stars

function predictStarRating(answers: Record<string, ItemAnswer>): number {
  const values = Object.values(answers);
  const criticals = values.filter(
    (a) => a.status === "non_compliant" && a.severity === "critical"
  ).length;
  const majors = values.filter(
    (a) => a.status === "non_compliant" && a.severity === "major"
  ).length;
  const minors = values.filter(
    (a) => a.status === "non_compliant" && a.severity === "minor"
  ).length;

  // 0 stars: 3+ major OR 2+ critical
  if (majors >= 3 || criticals >= 2) return 0;
  // 2 stars: 6+ minor only; or 1-2 major; or 1 critical
  if (criticals >= 1 || majors >= 1 || minors >= 6) return 2;
  // 3 stars: 4-5 minor only
  if (minors >= 4) return 3;
  // 4 stars: 1-3 minor only
  if (minors >= 1) return 4;
  // 5 stars: 0 non-compliances
  return 5;
}

function getRatingLabel(rating: number): string {
  switch (rating) {
    case 5: return "Excellent Performer";
    case 4: return "Very Good Performer";
    case 3: return "Good Performer";
    case 2: return "Poor Performer";
    case 0: return "Non-Compliant Performer";
    default: return "";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function groupByCategory(
  items: AssessmentItem[]
): { category: string; items: AssessmentItem[] }[] {
  const groups: { category: string; items: AssessmentItem[] }[] = [];
  let current: (typeof groups)[number] | null = null;

  for (const item of items) {
    if (!current || current.category !== item.category) {
      current = { category: item.category, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

function formatHistoryDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = parseInt(day, 10);
  const m = months[parseInt(month, 10) - 1] || month;
  return `${d} ${m} ${year}`;
}

function getHistoryStats(historyAnswers: Record<string, ItemAnswer>) {
  const values = Object.values(historyAnswers);
  const assessed = values.filter((a) => a.status !== "not_assessed").length;
  const compliant = values.filter((a) => a.status === "compliant").length;
  const nonCompliant = values.filter((a) => a.status === "non_compliant").length;
  return { assessed, compliant, nonCompliant };
}

const CATEGORY_GROUPS = groupByCategory(ASSESSMENT_ITEMS);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BCCSelfAssessmentProps {
  mode?: "standalone" | "onboarding";
  onComplete?: () => void;
}

export function BCCSelfAssessment({ mode = "standalone", onComplete }: BCCSelfAssessmentProps = {}) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // ── State ───────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Record<string, ItemAnswer>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // ── Query: load today's saved assessment ────────────────────────────
  const today = getTodayISO();

  const { data: savedAssessment, isLoading } = useQuery({
    queryKey: ["self-assessment", orgId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_self_assessments")
        .select("*")
        .eq("org_id", orgId)
        .eq("assessment_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
    enabled: !!orgId,
  });

  // ── Query: load assessment history (last 10, excluding today) ────
  const { data: history } = useQuery({
    queryKey: ["self-assessment-history", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_self_assessments")
        .select("id, assessment_date, predicted_star_rating, answers")
        .eq("org_id", orgId)
        .neq("assessment_date", today)
        .order("assessment_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Initialise answers from saved data
  useEffect(() => {
    if (savedAssessment?.answers) {
      setAnswers(savedAssessment.answers as Record<string, ItemAnswer>);
    }
  }, [savedAssessment]);

  // ── Derived data ────────────────────────────────────────────────────
  const assessedCount = useMemo(
    () =>
      Object.values(answers).filter((a) => a.status !== "not_assessed").length,
    [answers]
  );

  const compliantCount = useMemo(
    () => Object.values(answers).filter((a) => a.status === "compliant").length,
    [answers]
  );

  const nonCompliantCount = useMemo(
    () =>
      Object.values(answers).filter((a) => a.status === "non_compliant").length,
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

  const predictedRating = useMemo(() => predictStarRating(answers), [answers]);
  const ratingLabel = getRatingLabel(predictedRating);

  // ── Save mutation ───────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");

      const payload = {
        org_id: orgId,
        assessment_date: today,
        answers,
        predicted_star_rating: predictedRating,
        assessed_by: user?.id || null,
        assessed_by_name: user?.email || null,
      };

      const { error } = await supabase
        .from("audit_self_assessments")
        .upsert(payload, { onConflict: "org_id,assessment_date" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["self-assessment", orgId, today],
      });
      queryClient.invalidateQueries({
        queryKey: ["self-assessment-history", orgId],
      });
      if (mode === "onboarding" && onComplete) {
        onComplete();
      } else {
        Alert.alert("Saved", "Self-assessment saved successfully.");
      }
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ── Handlers ────────────────────────────────────────────────────────
  const setItemStatus = (code: string, status: ItemStatus, item: AssessmentItem) => {
    setAnswers((prev) => {
      const existing = prev[code];
      const next = { ...prev };

      if (status === "non_compliant") {
        // Default to the first available severity for this item
        const defaultSeverity = item.severities[0] || "minor";
        next[code] = {
          status,
          severity: existing?.severity && item.severities.includes(existing.severity)
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
      "Mark all 40 items as compliant? You can still adjust individual items after.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            setAnswers((prev) => {
              const next = { ...prev };
              for (const item of ASSESSMENT_ITEMS) {
                const existing = next[item.code];
                next[item.code] = {
                  status: "compliant",
                  comments: existing?.comments,
                  evidence: existing?.evidence,
                };
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

  // ── Loading state ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>
          Loading assessment...
        </Text>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  const progressPct = (assessedCount / 40) * 100;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      {mode !== "onboarding" && (
        <View style={{ paddingVertical: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, textAlign: "center" }}>
            Food Safety Checklist
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 2 }}>
            How Well Does Your Food Business Rate?
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 6, lineHeight: 16 }}>
            Based on the official BCC Eat Safe Brisbane Food Safety Checklist.{"\n"}
            Food Act 2006 &amp; Food Safety Standards.
          </Text>
        </View>
      )}

      {/* ── Summary Card ──────────────────────────────────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent style={{ paddingTop: 20 }}>
          {/* Progress bar */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>
                Progress
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>
                {assessedCount}/40
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: "hidden" }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  width: `${progressPct}%` as any,
                  backgroundColor: assessedCount === 40 ? colors.success : colors.accent,
                }}
              />
            </View>
          </View>

          {/* Compliance counts */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <Badge variant="success">{compliantCount} Compliant</Badge>
            <Badge variant="destructive">{nonCompliantCount} Non-Compliant</Badge>
            <Badge variant="secondary">{40 - assessedCount} Not Assessed</Badge>
          </View>

          {/* Non-compliance breakdown */}
          {nonCompliantCount > 0 && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {minorCount > 0 && <Badge variant="secondary">{minorCount} Minor</Badge>}
              {majorCount > 0 && <Badge variant="warning">{majorCount} Major</Badge>}
              {criticalCount > 0 && <Badge variant="destructive">{criticalCount} Critical</Badge>}
            </View>
          )}

          {/* Predicted star rating */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Predicted Eat Safe Star Rating
            </Text>
            <StarRating rating={predictedRating} size="md" showLabel />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              {ratingLabel}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* ── Compliance level guide ────────────────────────────────── */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 2 }}>
          Non-Compliance Levels
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.textMuted }}>Minor</Text> — Small, low risk breach easily rectified (e.g. cracked tiles, very minor cleaning issues)
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.warning }}>Major</Text> — Serious breach with high risk to food safety (e.g. unclean premises, no hand washing facilities)
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.destructive }}>Critical</Text> — Highest risk to producing safe food (e.g. incorrect temperature control, contamination, pests)
        </Text>
      </View>

      {/* ── Mark All Compliant ──────────────────────────────────── */}
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

      {/* ── Category Groups ───────────────────────────────────────── */}
      {CATEGORY_GROUPS.map((group) => (
        <View key={group.category} style={{ marginBottom: 16 }}>
          {/* Category header */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 8,
              paddingHorizontal: 4,
            }}
          >
            {group.category}
          </Text>

          <Card>
            <CardContent style={{ paddingTop: 16, gap: 12 }}>
              {group.items.map((item, idx) => {
                const answer = answers[item.code];
                const status: ItemStatus = answer?.status || "not_assessed";
                const showComments = expandedComments.has(item.code) || !!answer?.comments;

                return (
                  <View key={item.code}>
                    {/* Separator between items */}
                    {idx > 0 && (
                      <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />
                    )}

                    {/* Item header: code + text */}
                    <View style={{ flexDirection: "row", marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent, width: 36 }}>
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
                      {/* Yes (Compliant) */}
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

                      {/* No (Non-Compliant) */}
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

                      {/* N/A */}
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

                    {/* Severity pills (shown when non-compliant) — only show available severities */}
                    {status === "non_compliant" && (
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                        {item.severities.includes("minor") && (
                          <Pressable
                            onPress={() => setItemSeverity(item.code, "minor")}
                            style={{
                              flex: 1,
                              paddingVertical: 7,
                              borderRadius: 8,
                              alignItems: "center",
                              backgroundColor: answer?.severity === "minor" ? colors.surface : colors.surface,
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

                    {/* Evidence checkbox for Category 1 businesses */}
                    {item.hasEvidence && (
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, backgroundColor: colors.surface, borderRadius: 8, padding: 8 }}>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1 }}>
                          Evidence of food safety controls (Cat. 1)
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
                      <Text style={{ fontSize: 11, color: colors.accent, fontWeight: "600" }}>
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
        </View>
      ))}

      {/* ── Results Table ──────────────────────────────────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <CardContent style={{ paddingTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
            Eat Safe Brisbane Star Rating Table
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
                <Text style={{ fontSize: 14, fontWeight: "700", color: predictedRating === row.stars ? colors.accent : colors.text }}>
                  {row.stars === 0 ? "0" : row.stars}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {row.stars === 1 ? "star" : "stars"}
                </Text>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>

      {/* ── Save Button ───────────────────────────────────────────── */}
      <View style={{ paddingVertical: 8 }}>
        <Button
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Self-Assessment
        </Button>
      </View>

      {/* ── Assessment History ────────────────────────────────────── */}
      {history && history.length > 0 && (
        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Assessment History
          </Text>
          {history.map((entry: any) => {
            const stats = getHistoryStats(
              (entry.answers || {}) as Record<string, ItemAnswer>
            );
            return (
              <Card key={entry.id} style={{ marginBottom: 10 }}>
                <CardContent style={{ paddingTop: 14, paddingBottom: 14 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {formatHistoryDate(entry.assessment_date)}
                    </Text>
                    <StarRating
                      rating={entry.predicted_star_rating ?? 0}
                      size="sm"
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <Badge variant="secondary">
                      {stats.assessed}/40 Assessed
                    </Badge>
                    <Badge variant="success">
                      {stats.compliant} Compliant
                    </Badge>
                    <Badge variant="destructive">
                      {stats.nonCompliant} Non-Compliant
                    </Badge>
                  </View>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      loadHistoryAssessment(
                        (entry.answers || {}) as Record<string, ItemAnswer>
                      )
                    }
                  >
                    Load
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: "center", marginTop: 8, marginBottom: 16, lineHeight: 14 }}>
        This checklist mirrors the official BCC Eat Safe Brisbane Food Safety Checklist.{"\n"}
        For assistance contact EatSafeBrisbane@brisbane.qld.gov.au or (07) 3403 8888.
      </Text>
    </ScrollView>
  );
}
