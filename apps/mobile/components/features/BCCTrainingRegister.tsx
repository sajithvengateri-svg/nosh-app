import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { DatePicker } from "../ui/DatePicker";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRAINING_TYPES = [
  "Food Safety Course",
  "I'm Alert Online",
  "Workplace Induction",
  "Refresher",
] as const;

type TrainingType = (typeof TRAINING_TYPES)[number];

const COVERAGE_AREAS = [
  { key: "safe", label: "Safe food handling" },
  { key: "contam", label: "Contamination prevention" },
  { key: "cleaning", label: "Cleaning & sanitising" },
  { key: "hygiene", label: "Personal hygiene" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Returns days until expiry. Negative = already expired. */
function daysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function coverageCount(record: any): number {
  let count = 0;
  if (record.covers_safe_handling) count++;
  if (record.covers_contamination) count++;
  if (record.covers_cleaning) count++;
  if (record.covers_personal_hygiene) count++;
  return count;
}

function trainingTypeBadgeVariant(
  type: string
): "default" | "secondary" | "success" | "warning" {
  switch (type) {
    case "Food Safety Course":
      return "default";
    case "I'm Alert Online":
      return "success";
    case "Workplace Induction":
      return "secondary";
    case "Refresher":
      return "warning";
    default:
      return "secondary";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCTrainingRegister() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // -- Form state -----------------------------------------------------------
  const [sheetOpen, setSheetOpen] = useState(false);
  const [handlerName, setHandlerName] = useState("");
  const [role, setRole] = useState("");
  const [trainingType, setTrainingType] = useState<TrainingType>(
    "Food Safety Course"
  );
  const [provider, setProvider] = useState("");
  const [trainingDate, setTrainingDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [coversSafe, setCoversSafe] = useState(false);
  const [coversContam, setCoversContam] = useState(false);
  const [coversCleaning, setCoversCleaning] = useState(false);
  const [coversHygiene, setCoversHygiene] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");

  // -- Query ----------------------------------------------------------------
  const {
    data: records,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["bcc-food-handler-training", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("food_handler_training")
        .select("*")
        .eq("org_id", orgId)
        .order("training_date", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // -- Mutation -------------------------------------------------------------
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");

      if (!handlerName.trim()) {
        throw new Error("Handler name is required");
      }

      if (!coversSafe || !coversContam || !coversCleaning || !coversHygiene) {
        throw new Error(
          "All 4 mandatory coverage areas must be selected before saving"
        );
      }

      const { error } = await supabase.from("food_handler_training").insert({
        org_id: orgId,
        handler_name: handlerName.trim(),
        role: role.trim() || null,
        training_type: trainingType,
        training_provider: provider.trim() || null,
        training_date: trainingDate || null,
        expiry_date: expiryDate || null,
        covers_safe_handling: coversSafe,
        covers_contamination: coversContam,
        covers_cleaning: coversCleaning,
        covers_personal_hygiene: coversHygiene,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bcc-food-handler-training", orgId],
      });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setHandlerName("");
    setRole("");
    setTrainingType("Food Safety Course");
    setProvider("");
    setTrainingDate("");
    setExpiryDate("");
    setCoversSafe(false);
    setCoversContam(false);
    setCoversCleaning(false);
    setCoversHygiene(false);
    setValidationMsg("");
  }, []);

  const handleSave = () => {
    if (!coversSafe || !coversContam || !coversCleaning || !coversHygiene) {
      setValidationMsg(
        "All 4 mandatory coverage areas must be selected before saving"
      );
      return;
    }
    setValidationMsg("");
    saveMutation.mutate();
  };

  // -- Coverage toggle helper -----------------------------------------------
  const toggleCoverage = (key: string) => {
    switch (key) {
      case "safe":
        setCoversSafe((v) => !v);
        break;
      case "contam":
        setCoversContam((v) => !v);
        break;
      case "cleaning":
        setCoversCleaning((v) => !v);
        break;
      case "hygiene":
        setCoversHygiene((v) => !v);
        break;
    }
    setValidationMsg("");
  };

  const isCoverageChecked = (key: string): boolean => {
    switch (key) {
      case "safe":
        return coversSafe;
      case "contam":
        return coversContam;
      case "cleaning":
        return coversCleaning;
      case "hygiene":
        return coversHygiene;
      default:
        return false;
    }
  };

  // -- Render ---------------------------------------------------------------
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 4,
          }}
        >
          Training Register
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.textMuted,
            marginBottom: 16,
          }}
        >
          FSANZ Standard 3.2.2A — Food Handler Training
        </Text>

        {/* Loading */}
        {isLoading && (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* Empty */}
        {!isLoading && (!records || records.length === 0) && (
          <EmptyState
            icon="🎓"
            title="No Training Records"
            description="Add food handler training records to demonstrate compliance with FSANZ Standard 3.2.2A."
            actionLabel="Add First Record"
            onAction={() => setSheetOpen(true)}
          />
        )}

        {/* Record list */}
        {!isLoading &&
          records &&
          records.length > 0 &&
          records.map((rec: any) => {
            const days = daysUntilExpiry(rec.expiry_date);
            const coverage = coverageCount(rec);

            return (
              <Card key={rec.id} style={{ marginBottom: 12 }}>
                <CardContent style={{ paddingTop: 16 }}>
                  {/* Top row: name + training type badge */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {rec.handler_name}
                      </Text>
                      {rec.role && (
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          {rec.role}
                        </Text>
                      )}
                    </View>
                    <Badge variant={trainingTypeBadgeVariant(rec.training_type)}>
                      {rec.training_type}
                    </Badge>
                  </View>

                  {/* Second row: date, coverage, expiry warning */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 6,
                    }}
                  >
                    {/* Training date */}
                    {rec.training_date && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textMuted,
                        }}
                      >
                        {formatDate(rec.training_date)}
                      </Text>
                    )}

                    {/* Coverage fraction */}
                    <View
                      style={{
                        backgroundColor:
                          coverage === 4 ? colors.successBg : colors.warningBg,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color:
                            coverage === 4 ? colors.success : colors.warning,
                        }}
                      >
                        {coverage}/4
                      </Text>
                    </View>

                    {/* Expiry warning */}
                    {days !== null && (
                      <View
                        style={{
                          backgroundColor:
                            days < 0
                              ? colors.destructiveBg
                              : days < 90
                                ? colors.warningBg
                                : colors.successBg,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color:
                              days < 0
                                ? colors.destructive
                                : days < 90
                                  ? colors.warning
                                  : colors.success,
                          }}
                        >
                          {days < 0
                            ? "Expired"
                            : days < 90
                              ? `Expires in ${days}d`
                              : `Valid`}
                        </Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            );
          })}
      </ScrollView>

      {/* FAB */}
      <FAB onPress={() => setSheetOpen(true)} color={colors.accent} />

      {/* Form Sheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Add Training Record"
        saving={saveMutation.isPending}
      >
        {/* Handler name */}
        <Input
          label="Handler Name"
          value={handlerName}
          onChangeText={setHandlerName}
          placeholder="e.g. Jane Smith"
        />

        {/* Role */}
        <Input
          label="Role"
          value={role}
          onChangeText={setRole}
          placeholder="e.g. Head Chef, Kitchen Hand"
        />

        {/* Training type selector — pill buttons */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 8,
          }}
        >
          Training Type
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 4,
          }}
        >
          {TRAINING_TYPES.map((tt) => (
            <Pressable
              key={tt}
              onPress={() => setTrainingType(tt)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 9999,
                alignItems: "center",
                backgroundColor:
                  trainingType === tt ? colors.accentBg : colors.surface,
                borderWidth: 2,
                borderColor:
                  trainingType === tt ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color:
                    trainingType === tt
                      ? colors.accent
                      : colors.textSecondary,
                }}
              >
                {tt}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Training provider */}
        <Input
          label="Training Provider"
          value={provider}
          onChangeText={setProvider}
          placeholder="e.g. AIFS, council, in-house"
        />

        {/* Training date */}
        <DatePicker
          label="Training Date"
          placeholder="Select training date"
          value={trainingDate ? new Date(trainingDate + "T00:00:00") : new Date()}
          onChange={(date) => setTrainingDate(date.toISOString().split("T")[0])}
        />

        {/* Expiry date */}
        <DatePicker
          label="Expiry Date"
          placeholder="Select expiry date"
          value={expiryDate ? new Date(expiryDate + "T00:00:00") : new Date()}
          onChange={(date) => setExpiryDate(date.toISOString().split("T")[0])}
        />

        {/* Mandatory coverage areas */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: 8,
          }}
        >
          Mandatory Coverage Areas
        </Text>
        <View style={{ gap: 8 }}>
          {COVERAGE_AREAS.map((area) => {
            const checked = isCoverageChecked(area.key);
            return (
              <Pressable
                key={area.key}
                onPress={() => toggleCoverage(area.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: checked
                    ? colors.successBg
                    : colors.surface,
                  borderWidth: 2,
                  borderColor: checked ? colors.success : colors.border,
                }}
              >
                {/* Checkmark circle */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: checked
                      ? colors.success
                      : "transparent",
                    borderWidth: checked ? 0 : 2,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {checked && (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: "700",
                        marginTop: -1,
                      }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: checked ? colors.success : colors.text,
                    flex: 1,
                  }}
                >
                  {area.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Validation message */}
        {validationMsg !== "" && (
          <View
            style={{
              backgroundColor: colors.destructiveBg,
              borderRadius: 10,
              padding: 12,
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.destructive,
                textAlign: "center",
              }}
            >
              {validationMsg}
            </Text>
          </View>
        )}
      </FormSheet>
    </View>
  );
}
