import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

// ---------------------------------------------------------------------------
// CCP Entry type
// ---------------------------------------------------------------------------

interface CCPEntry {
  id: string;
  processStep: string;
  hazard: string;
  ccp: string;
  criticalLimit: string;
  monitoring: string;
  correctiveAction: string;
  verification: string;
  records: string;
}

function createEmptyCCPEntry(): CCPEntry {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
    processStep: "",
    hazard: "",
    ccp: "",
    criticalLimit: "",
    monitoring: "",
    correctiveAction: "",
    verification: "",
    records: "",
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HACCP_PRINCIPLES = [
  {
    key: "hazard_analysis",
    number: 1,
    title: "Hazard Analysis",
    description: "Identify potential hazards at each process step",
    placeholder:
      "List biological, chemical, and physical hazards for each step of your food handling process...",
  },
  {
    key: "critical_control_points",
    number: 2,
    title: "Critical Control Points",
    description:
      "Determine CCPs where hazards can be prevented or eliminated",
    placeholder:
      "List each CCP (e.g., cooking, cooling, reheating) and the hazard it controls...",
  },
  {
    key: "critical_limits",
    number: 3,
    title: "Critical Limits",
    description: "Set measurable limits for each CCP",
    placeholder:
      "E.g., Cooking: internal temp \u226575\u00b0C, Cold storage: \u22645\u00b0C, Cooling: 21\u00b0C within 2hr...",
  },
  {
    key: "monitoring",
    number: 4,
    title: "Monitoring Procedures",
    description: "Define who, when, and how to monitor each CCP",
    placeholder:
      "E.g., Head chef checks cooking temps with calibrated thermometer every batch...",
  },
  {
    key: "corrective_actions",
    number: 5,
    title: "Corrective Actions",
    description:
      "Actions when monitoring shows a CCP is not under control",
    placeholder:
      "E.g., If cooking temp <75\u00b0C, continue cooking until reached. If fridge >5\u00b0C, transfer food to backup unit...",
  },
  {
    key: "verification",
    number: 6,
    title: "Verification Procedures",
    description: "Activities to confirm HACCP system is working",
    placeholder:
      "E.g., Monthly thermometer calibration, quarterly internal audit, annual external audit...",
  },
  {
    key: "record_keeping",
    number: 7,
    title: "Record Keeping",
    description: "Documentation of all HACCP-related records",
    placeholder:
      "E.g., Daily temp logs, corrective action register, calibration certificates, training records...",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTimestamp(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCHACCPPlan() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [sections, setSections] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>("hazard_analysis");
  const [ccpEntries, setCcpEntries] = useState<CCPEntry[]>([]);
  const [expandedCcp, setExpandedCcp] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Query: load existing HACCP plan (singleton per org)
  // ---------------------------------------------------------------------------

  const {
    data: existing,
    isLoading,
  } = useQuery<any>({
    queryKey: ["haccp-plan", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("food_safety_logs")
        .select("*")
        .eq("log_type", "haccp_plan")
        .eq("org_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Seed local state from fetched data on first load
  const [hasSeeded, setHasSeeded] = useState(false);
  useEffect(() => {
    if (existing?.readings && !hasSeeded) {
      const readings = existing.readings as Record<string, any>;
      // Seed the 7-principles sections (everything except ccp_entries)
      const { ccp_entries, ...rest } = readings;
      setSections(rest as Record<string, string>);
      // Seed CCP entries
      if (Array.isArray(ccp_entries) && ccp_entries.length > 0) {
        setCcpEntries(ccp_entries as CCPEntry[]);
      }
      setHasSeeded(true);
    }
  }, [existing, hasSeeded]);

  // ---------------------------------------------------------------------------
  // Mutation: upsert HACCP plan
  // ---------------------------------------------------------------------------

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");

      const payload: any = {
        org_id: orgId,
        log_type: "haccp_plan",
        log_date: getTodayDate(),
        location: "HACCP Plan",
        status: "pass",
        readings: { ...sections, ccp_entries: ccpEntries },
        recorded_by: user?.id,
        recorded_by_name: user?.email,
      };

      if (existing?.id) {
        // Update existing record
        const { error } = await supabase
          .from("food_safety_logs")
          .update({
            log_date: payload.log_date,
            readings: payload.readings,
            recorded_by: payload.recorded_by,
            recorded_by_name: payload.recorded_by_name,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("food_safety_logs")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["haccp-plan", orgId] });
      Alert.alert("Saved", "HACCP plan has been saved successfully.");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleToggle = useCallback(
    (key: string) => {
      setExpanded((prev) => (prev === key ? null : key));
    },
    []
  );

  const handleSectionChange = useCallback(
    (key: string, value: string) => {
      setSections((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = () => {
    saveMutation.mutate();
  };

  // ---------------------------------------------------------------------------
  // CCP Handlers
  // ---------------------------------------------------------------------------

  const handleAddCcp = useCallback(() => {
    const entry = createEmptyCCPEntry();
    setCcpEntries((prev) => [...prev, entry]);
    setExpandedCcp(entry.id);
  }, []);

  const handleDeleteCcp = useCallback((id: string) => {
    Alert.alert("Delete CCP", "Are you sure you want to delete this CCP entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setCcpEntries((prev) => prev.filter((e) => e.id !== id));
          setExpandedCcp((prev) => (prev === id ? null : prev));
        },
      },
    ]);
  }, []);

  const handleCcpFieldChange = useCallback(
    (id: string, field: keyof CCPEntry, value: string) => {
      setCcpEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
      );
    },
    []
  );

  const handleToggleCcp = useCallback((id: string) => {
    setExpandedCcp((prev) => (prev === id ? null : id));
  }, []);

  // Count how many sections have content
  const completedCount = HACCP_PRINCIPLES.filter(
    (p) => sections[p.key]?.trim()
  ).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 100}
        enableAutomaticScroll
        enableResetScrollToCoords={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              lineHeight: 22,
            }}
          >
            Build your HACCP (Hazard Analysis Critical Control Points) plan by
            completing each of the 7 principles below. Expand a section to add
            or edit your documentation.
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              gap: 8,
            }}
          >
            <Badge variant={completedCount === 7 ? "success" : "secondary"}>
              {completedCount}/7 completed
            </Badge>
            {existing?.updated_at && (
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                Last saved: {formatTimestamp(existing.updated_at)}
              </Text>
            )}
          </View>
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* CCP Register */}
        {/* ----------------------------------------------------------------- */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                CCP Register
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                {ccpEntries.length === 0
                  ? "No critical control points added yet"
                  : `${ccpEntries.length} CCP${ccpEntries.length !== 1 ? "s" : ""} defined`}
              </Text>
            </View>
            <Pressable
              onPress={handleAddCcp}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.accentBg,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 18, color: colors.accent }}>+</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.accent,
                }}
              >
                Add CCP
              </Text>
            </Pressable>
          </View>

          {/* CCP Entry Cards */}
          <View style={{ gap: 10 }}>
            {ccpEntries.map((entry, index) => {
              const isCcpExpanded = expandedCcp === entry.id;
              const label = entry.processStep.trim()
                ? entry.processStep.trim()
                : "Untitled";

              return (
                <View
                  key={entry.id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isCcpExpanded
                      ? colors.accent
                      : colors.border,
                    overflow: "hidden",
                  }}
                >
                  {/* CCP Card Header */}
                  <Pressable
                    onPress={() => handleToggleCcp(entry.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      gap: 12,
                    }}
                  >
                    {/* CCP Number badge */}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.accentBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: colors.accent,
                        }}
                      >
                        C{index + 1}
                      </Text>
                    </View>

                    {/* Title */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        CCP #{index + 1}: {label}
                      </Text>
                      {!isCcpExpanded && entry.ccp.trim() ? (
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {entry.ccp.trim()}
                        </Text>
                      ) : null}
                    </View>

                    {/* Delete button */}
                    <Pressable
                      onPress={() => handleDeleteCcp(entry.id)}
                      hitSlop={8}
                      style={{
                        width: 32,
                        height: 32,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 18, color: colors.destructive }}>
                        {"\uD83D\uDDD1"}
                      </Text>
                    </Pressable>

                    {/* Chevron */}
                    <Text
                      style={{
                        fontSize: 18,
                        color: colors.textMuted,
                      }}
                    >
                      {isCcpExpanded ? "\u25B2" : "\u25BC"}
                    </Text>
                  </Pressable>

                  {/* CCP Expanded body */}
                  {isCcpExpanded && (
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingBottom: 14,
                      }}
                    >
                      <Input
                        label="Process Step"
                        placeholder="e.g., Cooking chicken"
                        value={entry.processStep}
                        onChangeText={(text) =>
                          handleCcpFieldChange(entry.id, "processStep", text)
                        }
                      />
                      <Input
                        label="Hazard"
                        placeholder="e.g., Biological - Salmonella"
                        value={entry.hazard}
                        onChangeText={(text) =>
                          handleCcpFieldChange(entry.id, "hazard", text)
                        }
                      />
                      <Input
                        label="CCP"
                        placeholder="e.g., CCP-1: Cooking temperature"
                        value={entry.ccp}
                        onChangeText={(text) =>
                          handleCcpFieldChange(entry.id, "ccp", text)
                        }
                      />
                      <Input
                        label="Critical Limit"
                        placeholder="e.g., Internal temp \u226575\u00b0C for 2 seconds"
                        value={entry.criticalLimit}
                        onChangeText={(text) =>
                          handleCcpFieldChange(entry.id, "criticalLimit", text)
                        }
                      />
                      <Input
                        label="Monitoring Procedure"
                        placeholder="e.g., Check core temp with probe thermometer every batch"
                        value={entry.monitoring}
                        onChangeText={(text) =>
                          handleCcpFieldChange(entry.id, "monitoring", text)
                        }
                      />
                      <Input
                        label="Corrective Action"
                        placeholder="e.g., Continue cooking until 75\u00b0C reached, discard if contaminated"
                        value={entry.correctiveAction}
                        onChangeText={(text) =>
                          handleCcpFieldChange(
                            entry.id,
                            "correctiveAction",
                            text
                          )
                        }
                      />
                      <Input
                        label="Verification"
                        placeholder="e.g., Weekly thermometer calibration check"
                        value={entry.verification}
                        onChangeText={(text) =>
                          handleCcpFieldChange(entry.id, "verification", text)
                        }
                      />
                      <Input
                        label="Records"
                        placeholder="e.g., Daily cooking temp log, thermometer calibration log"
                        value={entry.records}
                        onChangeText={(text) =>
                          handleCcpFieldChange(entry.id, "records", text)
                        }
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* 7 Principles Accordion */}
        {/* ----------------------------------------------------------------- */}
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            7 HACCP Principles
          </Text>
        </View>

        {/* Accordion sections */}
        <View style={{ gap: 10 }}>
          {HACCP_PRINCIPLES.map((principle) => {
            const isExpanded = expanded === principle.key;
            const content = sections[principle.key] || "";
            const hasContent = content.trim().length > 0;
            const firstLine = hasContent
              ? content.trim().split("\n")[0].substring(0, 80)
              : null;

            return (
              <View
                key={principle.key}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: isExpanded ? colors.accent : colors.border,
                  overflow: "hidden",
                }}
              >
                {/* Accordion header */}
                <Pressable
                  onPress={() => handleToggle(principle.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    gap: 12,
                  }}
                >
                  {/* Number badge */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: hasContent
                        ? colors.successBg
                        : colors.accentBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: hasContent ? colors.success : colors.accent,
                      }}
                    >
                      {principle.number}
                    </Text>
                  </View>

                  {/* Title + preview */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {principle.title}
                    </Text>
                    {!isExpanded && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: hasContent
                            ? colors.textSecondary
                            : colors.textMuted,
                          marginTop: 2,
                          fontStyle: hasContent ? "normal" : "italic",
                        }}
                        numberOfLines={1}
                      >
                        {firstLine || "Not yet completed"}
                      </Text>
                    )}
                  </View>

                  {/* Chevron */}
                  <Text
                    style={{
                      fontSize: 18,
                      color: colors.textMuted,
                    }}
                  >
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </Text>
                </Pressable>

                {/* Expanded body */}
                {isExpanded && (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingBottom: 14,
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                        lineHeight: 18,
                      }}
                    >
                      {principle.description}
                    </Text>
                    <TextInput
                      value={content}
                      onChangeText={(text) =>
                        handleSectionChange(principle.key, text)
                      }
                      placeholder={principle.placeholder}
                      placeholderTextColor={colors.textMuted}
                      multiline
                      textAlignVertical="top"
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 15,
                        color: colors.text,
                        backgroundColor: colors.surface,
                        minHeight: 120,
                        lineHeight: 22,
                      }}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Save button */}
        <View style={{ marginTop: 24 }}>
          <Button
            onPress={handleSave}
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending}
          >
            Save HACCP Plan
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
