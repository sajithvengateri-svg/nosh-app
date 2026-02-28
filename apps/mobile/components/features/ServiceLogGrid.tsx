import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { ImagePicker } from "../ui/ImagePicker";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { useScanner } from "../../hooks/useScanner";
import {
  type ServiceType,
  type ServiceField,
  type ServiceLog,
  type PestLog,
  useServiceHistory,
  useSaveServiceLog,
  getNextDueDate,
  isOverdue,
  GREASE_FIELDS,
  HOOD_FIELDS,
  PEST_FIELDS,
} from "../../hooks/useServiceLogs";
import { ServiceYearlyCalendar } from "./ServiceYearlyCalendar";
import {
  Plus,
  X,
  Check,
  Calendar,
  FileText,
  AlertTriangle,
  ScanLine,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

// ── Field configs per service type ───────────────────────────────────
const FIELD_MAP: Record<ServiceType, ServiceField[]> = {
  grease_trap: GREASE_FIELDS,
  hood_cleaning: HOOD_FIELDS,
  pest_control: PEST_FIELDS,
};

// ── Props ────────────────────────────────────────────────────────────
interface Props {
  serviceType: ServiceType;
  title: string;
}

// ── Component ────────────────────────────────────────────────────────
export function ServiceLogGrid({ serviceType, title }: Props) {
  const { colors } = useTheme();
  const { logs, isLoading, refetch } = useServiceHistory(serviceType);
  const saveMutation = useSaveServiceLog(serviceType);
  const scanner = useScanner<any>("extract-invoice");
  const fields = FIELD_MAP[serviceType];

  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});

  const nextDue = useMemo(() => getNextDueDate(logs), [logs]);
  const overdue = isOverdue(nextDue);

  const setValue = (key: string, val: any) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    // Validate required fields
    for (const f of fields) {
      if (f.required && !values[f.key]) {
        Alert.alert("Required", `${f.label} is required`);
        return;
      }
    }
    try {
      await saveMutation.mutateAsync(values);
      Alert.alert("Saved", `${title} log saved successfully`);
      setValues({});
      setShowForm(false);
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleScanInvoice = async (base64: string) => {
    try {
      const result = await scanner.scan(base64);
      if (result) {
        if (result.provider_name || result.company) setValue("provider_name", result.provider_name || result.company);
        if (result.date) setValue("service_date", result.date);
        if (result.date) setValue("cleaning_date", result.date);
        if (result.amount) setValue("cost", result.amount);
      }
    } catch {
      // Scan failed silently
    }
  };

  // Format log for display
  const formatLog = (log: ServiceLog | PestLog) => {
    const date = new Date("log_date" in log ? log.log_date : "").toLocaleDateString("en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
    if ("readings" in log) {
      const r = (log as ServiceLog).readings;
      const provider = r?.provider_name || "";
      return { date, provider, status: (log as ServiceLog).status };
    }
    const pest = log as PestLog;
    return {
      date,
      provider: pest.provider_name || (pest.log_type === "self_inspection" ? "Self-Inspection" : ""),
      status: pest.pests_found ? "issues" : "clear",
    };
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* ── Next due badge ──────────────────────────────────────── */}
      {nextDue && (
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 8,
          padding: 12, marginBottom: 12, borderRadius: 12,
          backgroundColor: overdue ? colors.destructive + "08" : colors.accent + "08",
          borderWidth: 1,
          borderColor: overdue ? colors.destructive + "20" : colors.accent + "20",
        }}>
          {overdue ? (
            <AlertTriangle size={16} color={colors.destructive} strokeWidth={2} />
          ) : (
            <Calendar size={16} color={colors.accent} strokeWidth={2} />
          )}
          <Text style={{
            fontSize: 13, fontWeight: "600",
            color: overdue ? colors.destructive : colors.accent,
          }}>
            {overdue ? "Overdue — was due " : "Next service: "}
            {nextDue.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      )}

      {/* ── Action buttons ──────────────────────────────────────── */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <Pressable
          onPress={() => setShowForm(!showForm)}
          style={{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 6, paddingVertical: 12, borderRadius: 12,
            backgroundColor: showForm ? colors.textMuted : colors.accent,
          }}
        >
          {showForm ? <X size={16} color="#FFFFFF" strokeWidth={2} /> : <Plus size={16} color="#FFFFFF" strokeWidth={2} />}
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
            {showForm ? "Cancel" : "Log Service"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowCalendar(!showCalendar)}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
            backgroundColor: showCalendar ? colors.accent + "15" : colors.surface,
            borderWidth: 1, borderColor: showCalendar ? colors.accent + "30" : colors.border,
          }}
        >
          <Calendar size={16} color={showCalendar ? colors.accent : colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* ── Calendar ────────────────────────────────────────────── */}
      {showCalendar && (
        <View style={{
          marginBottom: 16, padding: 16, borderRadius: 14,
          backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
        }}>
          <ServiceYearlyCalendar serviceType={serviceType} />
        </View>
      )}

      {/* ── New log form ────────────────────────────────────────── */}
      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <CardContent style={{ gap: 12, paddingTop: 12 }}>
            {/* Scan invoice button */}
            <ImagePicker
              onImageSelected={handleScanInvoice}
              cameraOnly
              compact
              renderButton={({ onPress, loading }) => (
                <Pressable
                  onPress={onPress}
                  disabled={loading || scanner.scanning}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 6, paddingVertical: 10, borderRadius: 10,
                    backgroundColor: colors.accent + "10",
                    borderWidth: 1, borderColor: colors.accent + "25",
                  }}
                >
                  {scanner.scanning ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <ScanLine size={16} color={colors.accent} strokeWidth={2} />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>
                    {scanner.scanning ? "Scanning..." : "Scan Invoice"}
                  </Text>
                </Pressable>
              )}
            />

            {/* Dynamic fields */}
            {fields.map((field) => {
              // Check showWhen condition
              if (field.showWhen && !field.showWhen(values)) return null;

              if (field.type === "date") {
                return (
                  <View key={field.key}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}>
                      {field.label}{field.required ? " *" : ""}
                    </Text>
                    <TextInput
                      value={values[field.key] || ""}
                      onChangeText={(v) => setValue(field.key, v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        fontSize: 14, color: colors.text,
                        paddingVertical: 10, paddingHorizontal: 12,
                        borderRadius: 10, backgroundColor: colors.surface,
                        borderWidth: 1, borderColor: colors.border,
                      }}
                    />
                  </View>
                );
              }

              if (field.type === "text") {
                return (
                  <View key={field.key}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}>
                      {field.label}{field.required ? " *" : ""}
                    </Text>
                    <TextInput
                      value={values[field.key] || ""}
                      onChangeText={(v) => setValue(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.textMuted}
                      multiline={field.key.includes("notes") || field.key.includes("findings") || field.key.includes("action")}
                      style={{
                        fontSize: 14, color: colors.text,
                        paddingVertical: 10, paddingHorizontal: 12,
                        borderRadius: 10, backgroundColor: colors.surface,
                        borderWidth: 1, borderColor: colors.border,
                        minHeight: (field.key.includes("notes") || field.key.includes("findings")) ? 60 : undefined,
                      }}
                    />
                  </View>
                );
              }

              if (field.type === "number") {
                return (
                  <View key={field.key}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}>
                      {field.label}
                    </Text>
                    <TextInput
                      value={values[field.key]?.toString() || ""}
                      onChangeText={(v) => setValue(field.key, v)}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      style={{
                        fontSize: 14, color: colors.text,
                        paddingVertical: 10, paddingHorizontal: 12,
                        borderRadius: 10, backgroundColor: colors.surface,
                        borderWidth: 1, borderColor: colors.border,
                      }}
                    />
                  </View>
                );
              }

              if (field.type === "toggle") {
                return (
                  <View key={field.key} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{field.label}</Text>
                    <Switch
                      value={!!values[field.key]}
                      onValueChange={(v) => setValue(field.key, v)}
                      trackColor={{ false: colors.border, true: colors.accent }}
                    />
                  </View>
                );
              }

              if (field.type === "multi_select" && field.options) {
                return (
                  <View key={field.key}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 6 }}>
                      {field.label}{field.required ? " *" : ""}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {field.options.map((opt) => {
                        // For single-select (like pest log_type), store as string
                        // For multi-select (like hood areas), store as array
                        const isSingle = field.key === "log_type";
                        const selected = isSingle
                          ? values[field.key] === opt
                          : (values[field.key] as string[] || []).includes(opt);

                        return (
                          <Pressable
                            key={opt}
                            onPress={() => {
                              if (isSingle) {
                                setValue(field.key, opt);
                              } else {
                                const current = (values[field.key] as string[]) || [];
                                setValue(field.key, selected ? current.filter((o) => o !== opt) : [...current, opt]);
                              }
                            }}
                            style={{
                              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
                              backgroundColor: selected ? colors.accent : colors.surface,
                              borderWidth: 1,
                              borderColor: selected ? colors.accent : colors.border,
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: "600", color: selected ? "#FFFFFF" : colors.textSecondary }}>
                              {opt}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              }

              if (field.type === "photo") {
                return (
                  <View key={field.key}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}>
                      {field.label}
                    </Text>
                    <ImagePicker
                      onImageSelected={(b64) => setValue(field.key, b64)}
                      buttonText={values[field.key] ? `${field.label} Added` : `Add ${field.label}`}
                      showPreview={false}
                    />
                  </View>
                );
              }

              return null;
            })}

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={saveMutation.isPending}
              style={{
                paddingVertical: 14, borderRadius: 12,
                backgroundColor: colors.accent, alignItems: "center",
                opacity: saveMutation.isPending ? 0.6 : 1, marginTop: 4,
              }}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Save Log</Text>
              )}
            </Pressable>
          </CardContent>
        </Card>
      )}

      {/* ── History ─────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <FileText size={14} color={colors.textMuted} strokeWidth={2} />
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Service History
        </Text>
      </View>

      {logs.length === 0 ? (
        <View style={{ paddingVertical: 30, alignItems: "center" }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>No service logs yet</Text>
        </View>
      ) : (
        logs.map((log) => {
          const info = formatLog(log);
          const statusColor = info.status === "pass" || info.status === "clear" ? colors.success : colors.warning;
          return (
            <View
              key={log.id}
              style={{
                flexDirection: "row", alignItems: "center", gap: 10,
                paddingVertical: 12, paddingHorizontal: 14, marginBottom: 6,
                borderRadius: 12, backgroundColor: colors.card,
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: statusColor,
              }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{info.date}</Text>
                {info.provider ? (
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{info.provider}</Text>
                ) : null}
              </View>
              <Badge variant={info.status === "pass" || info.status === "clear" ? "success" : "warning"}>
                {info.status === "pass" ? "Pass" : info.status === "clear" ? "Clear" : info.status === "issues" ? "Issues" : info.status}
              </Badge>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
