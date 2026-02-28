import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { AutocompleteInput } from "../ui/AutocompleteInput";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { ImagePicker } from "../ui/ImagePicker";
import { MultiInputCapture } from "../ui/MultiInputCapture";
import { AuditBadge } from "../ui/AuditBadge";
import { DatePicker } from "../ui/DatePicker";
import { useUploadSafetyPhoto } from "../../hooks/useFoodSafety";
import {
  useSuppliers,
  useReceivingSettings,
  useReceivingLogs,
  useReceivingHistory,
  getReceivingTempStatus,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ITEMS,
  type ProductCategory,
  type CorrectiveActionType,
} from "../../hooks/useReceiving";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  History,
  Check,
} from "lucide-react-native";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Checklist items
// ---------------------------------------------------------------------------

const CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: "packaging", label: "Packaging intact?" },
  { key: "temp_ok", label: "Temperature OK?" },
  { key: "dates_ok", label: "Dates OK?" },
  { key: "vehicle_clean", label: "Vehicle clean?" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCReceiving() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const uploadPhoto = useUploadSafetyPhoto();

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;

  // ── Data hooks ──────────────────────────────────────────────
  const { suppliers } = useSuppliers();
  const { settings: receivingSettings } = useReceivingSettings();
  const { logs, isLoading, refetch } = useReceivingLogs(selectedDate);

  // ── History ─────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, []);
  const { logs: historyLogs, isLoading: historyLoading } = useReceivingHistory(
    showHistory ? { dateFrom: sevenDaysAgo, dateTo: todayStr, searchItem: historySearch || undefined } : {}
  );
  const historyByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    historyLogs.forEach((l: any) => {
      const d = l.date || l.log_date;
      if (!map[d]) map[d] = [];
      map[d].push(l);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [historyLogs]);

  // ── Date navigation ─────────────────────────────────────────
  const stepDate = useCallback((direction: -1 | 1) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + direction);
    const newDate = d.toISOString().split("T")[0];
    if (newDate <= todayStr) setSelectedDate(newDate);
  }, [selectedDate, todayStr]);

  // ── Form state ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [productCategory, setProductCategory] = useState<ProductCategory | null>(null);
  const [quantity, setQuantity] = useState("");
  const [tempValue, setTempValue] = useState("");
  const [bestBefore, setBestBefore] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState<CorrectiveActionType | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({
    packaging: false,
    temp_ok: false,
    dates_ok: false,
    vehicle_clean: false,
  });
  const [notes, setNotes] = useState("");
  const [scanningTemp, setScanningTemp] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [aiQualityResult, setAiQualityResult] = useState<any | null>(null);
  const [checkingQuality, setCheckingQuality] = useState(false);

  // ── Derived: supplier categories + item suggestions ────────
  const supplierSuggestions = useMemo(
    () => suppliers.map((s) => ({ label: s.supplier_name, subtitle: (s.products_supplied || []).join(", ") })),
    [suppliers]
  );

  const selectedSupplierObj = useMemo(
    () => suppliers.find((s) => s.id === supplierId || s.supplier_name.toLowerCase() === supplier.toLowerCase()),
    [suppliers, supplierId, supplier]
  );

  const availableCategories = useMemo(() => {
    if (selectedSupplierObj?.products_supplied?.length) {
      return PRODUCT_CATEGORIES.filter((c) =>
        selectedSupplierObj.products_supplied!.includes(c)
      );
    }
    return [...PRODUCT_CATEGORIES];
  }, [selectedSupplierObj]);

  const itemSuggestions = useMemo(() => {
    if (productCategory) return PRODUCT_CATEGORY_ITEMS[productCategory] || [];
    // If no category but supplier has products, merge all their categories
    if (selectedSupplierObj?.products_supplied?.length) {
      return selectedSupplierObj.products_supplied.flatMap(
        (cat) => PRODUCT_CATEGORY_ITEMS[cat as ProductCategory] || []
      );
    }
    return [];
  }, [productCategory, selectedSupplierObj]);

  // ── Temp benchmark check ──────────────────────────────────
  const currentSetting = useMemo(
    () => productCategory ? receivingSettings.find((s) => s.product_category === productCategory) : null,
    [productCategory, receivingSettings]
  );

  const tempStatus = useMemo(() => {
    if (!currentSetting || !tempValue.trim()) return null;
    const val = parseFloat(tempValue);
    if (isNaN(val)) return null;
    return getReceivingTempStatus(val, currentSetting);
  }, [tempValue, currentSetting]);

  const needsCorrective = useMemo(() => {
    const tempFail = tempStatus === "fail";
    const checksFail = Object.values(checks).some((v) => !v) &&
      Object.values(checks).some((v) => v); // partial checks = some interaction
    return tempFail || checksFail;
  }, [tempStatus, checks]);

  // ── Supplier selection handler ────────────────────────────
  const handleSupplierChange = useCallback((text: string) => {
    setSupplier(text);
    const match = suppliers.find((s) => s.supplier_name.toLowerCase() === text.toLowerCase());
    if (match) {
      setSupplierId(match.id);
      // Auto-set first category if supplier has exactly one
      if (match.products_supplied?.length === 1) {
        setProductCategory(match.products_supplied[0] as ProductCategory);
      }
    } else {
      setSupplierId(null);
    }
  }, [suppliers]);

  // ── AI quality check ──────────────────────────────────────
  const handleQualityCheck = async () => {
    if (!photoBase64 || !productCategory) return;
    setCheckingQuality(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-produce-quality", {
        body: {
          image_base64: photoBase64,
          file_type: "image/jpeg",
          product_category: productCategory,
        },
      });
      if (error) throw error;
      setAiQualityResult(data);
    } catch (e: any) {
      Alert.alert("Quality Check Error", e.message || "Failed to check quality");
    } finally {
      setCheckingQuality(false);
    }
  };

  // ── Mutation ────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!itemName.trim()) throw new Error("Item name is required");

      const allChecksPass =
        checks.packaging && checks.temp_ok && checks.dates_ok && checks.vehicle_clean;

      // Upload product photo if present
      let photoUrl: string | null = null;
      if (photoBase64) {
        try {
          photoUrl = await uploadPhoto.mutateAsync(photoBase64);
        } catch (e: any) {
          console.warn("Photo upload failed:", e.message);
        }
      }

      // Upload invoice if present — cross-file to invoice folder
      let invoiceUrl: string | null = null;
      if (invoiceData?.base64) {
        try {
          const fileName = `invoices/${orgId}/${selectedDate}_${Date.now()}.jpg`;
          const { error: upErr } = await supabase.storage
            .from("food-safety")
            .upload(fileName, decode(invoiceData.base64), {
              contentType: "image/jpeg",
            });
          if (!upErr) {
            const { data: urlData } = supabase.storage
              .from("food-safety")
              .getPublicUrl(fileName);
            invoiceUrl = urlData?.publicUrl || null;
          }
        } catch {
          // Non-blocking — invoice cross-file is best-effort
        }
      }

      const shift = new Date().getHours() < 12 ? "AM" : "PM";

      const { error } = await supabase.from("daily_compliance_logs").insert({
        org_id: orgId,
        log_type: "receiving",
        log_date: selectedDate,
        shift,
        temperature_reading: tempValue.trim() ? parseFloat(tempValue) : null,
        is_within_safe_zone: allChecksPass && tempStatus !== "fail",
        visual_check_passed: allChecksPass,
        requires_corrective_action: !allChecksPass || tempStatus === "fail",
        supplier_id: supplierId,
        product_category: productCategory,
        corrective_action_type: correctiveAction,
        ai_quality_result: aiQualityResult,
        invoice_url: invoiceUrl,
        notes: JSON.stringify({
          item_name: itemName.trim(),
          supplier: supplier.trim(),
          quantity: quantity.trim(),
          best_before: bestBefore.trim(),
          checks: {
            packaging: checks.packaging,
            temp_ok: checks.temp_ok,
            dates_ok: checks.dates_ok,
            vehicle_clean: checks.vehicle_clean,
          },
          notes: notes.trim(),
          photo_url: photoUrl,
          invoice_data: invoiceData,
          product_category: productCategory,
          corrective_action: correctiveAction,
        }),
        logged_by: user?.id,
        logged_by_name: user?.email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receiving-logs"] });
      queryClient.invalidateQueries({ queryKey: ["bcc-receiving-logs"] });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setItemName("");
    setSupplier("");
    setSupplierId(null);
    setProductCategory(null);
    setQuantity("");
    setTempValue("");
    setBestBefore("");
    setCorrectiveAction(null);
    setChecks({
      packaging: false,
      temp_ok: false,
      dates_ok: false,
      vehicle_clean: false,
    });
    setNotes("");
    setPhotoBase64(null);
    setInvoiceData(null);
    setAiQualityResult(null);
  }, []);

  const handleSave = () => {
    if (!itemName.trim()) {
      Alert.alert("Missing", "Please enter an item name");
      return;
    }
    if (needsCorrective && !correctiveAction) {
      Alert.alert(
        "Corrective Action Required",
        "Temperature or checks failed. Please select a corrective action.",
        [
          { text: "Go Back" },
          { text: "Save Anyway", onPress: () => saveMutation.mutate() },
        ]
      );
      return;
    }
    saveMutation.mutate();
  };

  // ── AI thermometer scan ─────────────────────────────────────
  const handleScanTemp = async (base64: string) => {
    setScanningTemp(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "read-temp-display",
        { body: { image_base64: base64, file_type: "image/jpeg" } }
      );
      if (error) throw error;
      if (data?.temperature !== undefined) {
        setTempValue(String(data.temperature));
      } else {
        Alert.alert("No Reading", "Could not detect temperature");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setScanningTemp(false);
    }
  };

  // ── Toggle a checklist item ─────────────────────────────────
  const toggleCheck = (key: string) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Parse notes JSON from a log row ─────────────────────────
  const parseNotes = (raw: string | null): any => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  // ── Checklist summary helper ────────────────────────────────
  const getCheckSummary = (parsed: any): string => {
    if (!parsed?.checks) return "--";
    const c = parsed.checks;
    const total = 4;
    let passed = 0;
    if (c.packaging) passed++;
    if (c.temp_ok) passed++;
    if (c.dates_ok) passed++;
    if (c.vehicle_clean) passed++;
    return `${passed}/${total}`;
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 12,
          }}
        >
          Receiving Log
        </Text>

        {/* Date navigation bar */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12, gap: 8 }}>
          <Pressable onPress={() => stepDate(-1)} style={{ padding: 6 }}>
            <ChevronLeft size={20} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
          <DatePicker
            value={new Date(selectedDate + "T12:00:00")}
            onChange={(d) => setSelectedDate(d.toISOString().split("T")[0])}
            mode="date"
          />
          <Pressable
            onPress={() => stepDate(1)}
            style={{ padding: 6, opacity: isToday ? 0.3 : 1 }}
            disabled={isToday}
          >
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
          {!isToday && (
            <Pressable
              onPress={() => setSelectedDate(todayStr)}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.accentBg }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Today</Text>
            </Pressable>
          )}
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* Empty */}
        {!isLoading && (!logs || logs.length === 0) && (
          <EmptyState
            icon="📦"
            title="No Receiving Entries"
            description={isToday
              ? "Tap + to log a delivery. Record item details, temperatures and run through the BCC checklist."
              : "No deliveries were logged on this date."}
            actionLabel={isToday ? "Log Delivery" : undefined}
            onAction={isToday ? () => setSheetOpen(true) : undefined}
          />
        )}

        {/* Log list */}
        {!isLoading &&
          logs &&
          logs.length > 0 &&
          logs.map((log: any) => {
            const parsed = parseNotes(log.notes);
            const checkSummary = getCheckSummary(parsed);
            const allPass = checkSummary === "4/4";
            const logCorrective = log.corrective_action_type || parsed?.corrective_action;

            return (
              <Card key={log.id} style={{ marginBottom: 12 }}>
                <CardContent style={{ paddingTop: 16 }}>
                  {/* Top row: item name + checklist badge */}
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
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.text,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {parsed?.item_name || parsed?.item || "Untitled Item"}
                    </Text>
                    <Badge variant={allPass ? "success" : "warning"}>
                      {checkSummary}
                    </Badge>
                  </View>

                  {/* Supplier + category */}
                  {(parsed?.supplier || log.product_category) && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {parsed?.supplier && (
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                          {parsed.supplier}
                        </Text>
                      )}
                      {log.product_category && (
                        <Badge variant="default">
                          {PRODUCT_CATEGORY_LABELS[log.product_category as ProductCategory] || log.product_category}
                        </Badge>
                      )}
                    </View>
                  )}

                  {/* Details row: temperature + best-before */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 4,
                    }}
                  >
                    {log.temperature_reading != null && (
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: log.is_within_safe_zone === false ? colors.destructive : colors.text,
                        }}
                      >
                        {`${log.temperature_reading}\u00B0C`}
                      </Text>
                    )}
                    {parsed?.best_before ? (
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                        BB: {parsed.best_before}
                      </Text>
                    ) : null}
                    {parsed?.quantity ? (
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                        Qty: {parsed.quantity}
                      </Text>
                    ) : null}
                  </View>

                  {/* Corrective action */}
                  {logCorrective && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Action:</Text>
                      <Badge variant={logCorrective === "received" ? "success" : logCorrective === "send_back" ? "destructive" : "warning"}>
                        {logCorrective === "send_back" ? "Sent Back" : logCorrective === "credit" ? "Credit" : "Received"}
                      </Badge>
                    </View>
                  )}

                  {/* AI quality result */}
                  {log.ai_quality_result && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>Quality:</Text>
                      <Badge variant={log.ai_quality_result.grade === "A" ? "success" : log.ai_quality_result.grade === "Reject" ? "destructive" : "warning"}>
                        Grade {log.ai_quality_result.grade}
                      </Badge>
                    </View>
                  )}

                  {/* Notes */}
                  {parsed?.notes ? (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        marginTop: 4,
                      }}
                      numberOfLines={2}
                    >
                      {parsed.notes}
                    </Text>
                  ) : null}

                  {/* Timestamp */}
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textMuted,
                      marginTop: 6,
                    }}
                  >
                    {log.created_at ? formatTime(log.created_at) : ""} \u00B7 {log.shift}
                  </Text>

                  {/* Audit trail */}
                  <AuditBadge
                    signedBy={log.logged_by_name || "Unknown"}
                    signedAt={log.created_at}
                    size="sm"
                  />
                </CardContent>
              </Card>
            );
          })}

        {/* History section */}
        <Pressable
          onPress={() => setShowHistory(!showHistory)}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            marginTop: 20, paddingVertical: 10, paddingHorizontal: 4,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <History size={16} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textSecondary }}>History</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{showHistory ? "Hide" : "Show"}</Text>
        </Pressable>

        {showHistory && (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Search size={14} color={colors.textMuted} strokeWidth={1.5} />
              <TextInput
                value={historySearch}
                onChangeText={setHistorySearch}
                placeholder="Search by item..."
                placeholderTextColor={colors.textMuted}
                style={{
                  flex: 1, fontSize: 14, color: colors.text, backgroundColor: colors.surface,
                  borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
                  borderWidth: 1, borderColor: colors.border,
                }}
              />
            </View>

            {historyLoading && <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 12 }} />}

            {historyByDate.map(([dateKey, dayLogs]) => (
              <View key={dateKey} style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 6 }}>
                  {new Date(dateKey + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                </Text>
                {dayLogs.map((log: any) => {
                  const parsed = parseNotes(log.notes);
                  return (
                    <View
                      key={log.id}
                      style={{
                        flexDirection: "row", alignItems: "center", paddingVertical: 6,
                        paddingHorizontal: 8, borderRadius: 8, marginBottom: 2,
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: 13, color: colors.text }} numberOfLines={1}>
                        {parsed?.item_name || parsed?.item || "Item"}
                      </Text>
                      {parsed?.supplier && (
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginRight: 8 }} numberOfLines={1}>
                          {parsed.supplier}
                        </Text>
                      )}
                      {log.temperature_reading != null && (
                        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, marginRight: 8 }}>
                          {`${log.temperature_reading}\u00B0C`}
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>
                        {log.shift}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}

            {!historyLoading && historyByDate.length === 0 && (
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 16 }}>
                No history found for the past 7 days
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB — only show on today */}
      {isToday && <FAB onPress={() => setSheetOpen(true)} color={colors.accent} />}

      {/* Form Sheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Log Receiving"
        saving={saveMutation.isPending}
      >
        {/* Supplier autocomplete */}
        <AutocompleteInput
          label="Supplier"
          value={supplier}
          onChangeText={handleSupplierChange}
          suggestions={supplierSuggestions}
          placeholder="Start typing supplier name..."
        />

        {/* Product category pills */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textSecondary, marginBottom: 6 }}>
            Product Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {availableCategories.map((cat) => {
                const isSelected = productCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setProductCategory(isSelected ? null : cat)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isSelected ? "#FFFFFF" : colors.textSecondary,
                    }}>
                      {PRODUCT_CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Item name autocomplete */}
        <AutocompleteInput
          label="Item Name"
          value={itemName}
          onChangeText={setItemName}
          suggestions={itemSuggestions}
          placeholder="Start typing item name..."
        />

        {/* Quantity */}
        <Input
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g. 2 cases, 10 kg"
        />

        {/* Temperature with benchmark */}
        <View style={{ marginBottom: 12 }}>
          <Input
            label={`Temperature (\u00B0C)${currentSetting ? ` \u2014 Benchmark: ${currentSetting.temp_min}\u2013${currentSetting.temp_max}\u00B0C` : ""}`}
            value={tempValue}
            onChangeText={setTempValue}
            keyboardType="decimal-pad"
            placeholder={currentSetting?.requires_temp_check ? "Required" : "Optional"}
            containerStyle={{ marginBottom: 0 }}
          />
          {tempStatus && (
            <View style={{ marginTop: 4 }}>
              <Badge variant={tempStatus === "pass" ? "success" : "destructive"}>
                {tempStatus === "pass" ? "PASS" : "FAIL"}{currentSetting ? ` (${currentSetting.temp_min}\u2013${currentSetting.temp_max}\u00B0C)` : ""}
              </Badge>
            </View>
          )}
        </View>

        {/* AI thermometer snap */}
        <View style={{ marginTop: 4 }}>
          <ImagePicker
            onImageSelected={handleScanTemp}
            label=""
            buttonText={scanningTemp ? "Reading..." : "Scan Thermometer"}
            showPreview={false}
          />
        </View>

        {/* Best-before date */}
        <DatePicker
          label="Best-Before Date"
          placeholder="Select best-before date"
          value={bestBefore ? new Date(bestBefore + "T00:00:00") : new Date()}
          onChange={(date) => setBestBefore(date.toISOString().split("T")[0])}
        />

        {/* 4-item checklist */}
        <View style={{ marginTop: 4 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Receiving Checklist
          </Text>
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checks[item.key];
            return (
              <Pressable
                key={item.key}
                onPress={() => toggleCheck(item.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  marginBottom: 6,
                  backgroundColor: isChecked ? colors.successBg : colors.surface,
                  borderWidth: 2,
                  borderColor: isChecked ? colors.success : colors.border,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: isChecked ? colors.success : colors.border,
                    backgroundColor: isChecked ? colors.success : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  {isChecked && (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 14,
                        fontWeight: "700",
                        lineHeight: 16,
                      }}
                    >
                      \u2713
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isChecked ? colors.success : colors.text,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Corrective action picker */}
        {needsCorrective && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.destructive, marginBottom: 8 }}>
              Corrective Action
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {([
                { key: "received" as const, label: "Received" },
                { key: "send_back" as const, label: "Send Back" },
                { key: "credit" as const, label: "Credit" },
              ]).map(({ key, label }) => {
                const isSelected = correctiveAction === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setCorrectiveAction(isSelected ? null : key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: isSelected
                        ? key === "received" ? colors.successBg
                        : key === "send_back" ? colors.destructiveBg
                        : colors.warningBg
                        : colors.surface,
                      borderWidth: 2,
                      borderColor: isSelected
                        ? key === "received" ? colors.success
                        : key === "send_back" ? colors.destructive
                        : colors.warning
                        : colors.border,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: isSelected
                        ? key === "received" ? colors.success
                        : key === "send_back" ? colors.destructive
                        : colors.warning
                        : colors.textSecondary,
                    }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Notes */}
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        {/* Product photo evidence */}
        <View style={{ marginTop: 8 }}>
          <ImagePicker
            onImageSelected={(base64: string) => setPhotoBase64(base64)}
            label="Product Photo"
            buttonText={photoBase64 ? "Retake Photo" : "Take Product Photo"}
            showPreview
          />
        </View>

        {/* AI quality check toggle */}
        {photoBase64 && currentSetting?.ai_quality_check_enabled && (
          <View style={{ marginTop: 8 }}>
            <Pressable
              onPress={handleQualityCheck}
              disabled={checkingQuality}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: colors.accentBg,
                borderWidth: 1,
                borderColor: colors.accent,
                gap: 8,
              }}
            >
              {checkingQuality ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Check size={16} color={colors.accent} strokeWidth={2} />
              )}
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>
                {checkingQuality ? "Checking Quality..." : "AI Quality Check"}
              </Text>
            </Pressable>
            {aiQualityResult && (
              <View style={{
                marginTop: 8, padding: 12, borderRadius: 10,
                backgroundColor: aiQualityResult.grade === "A" ? colors.successBg
                  : aiQualityResult.grade === "Reject" ? colors.destructiveBg
                  : colors.warningBg,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                    Grade {aiQualityResult.grade}
                  </Text>
                  <Badge variant={aiQualityResult.grade === "A" ? "success" : aiQualityResult.grade === "Reject" ? "destructive" : "warning"}>
                    {aiQualityResult.grade === "A" ? "Excellent" : aiQualityResult.grade === "B" ? "Acceptable" : aiQualityResult.grade === "C" ? "Below Standard" : "Reject"}
                  </Badge>
                </View>
                {aiQualityResult.notes && (
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{aiQualityResult.notes}</Text>
                )}
                {aiQualityResult.recommendation && (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, fontStyle: "italic" }}>
                    {aiQualityResult.recommendation}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Invoice scanning */}
        <View style={{ marginTop: 8 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Scan Invoice
          </Text>
          <MultiInputCapture
            modes={["camera", "upload", "document"]}
            onCapture={(data: any) => setInvoiceData(data)}
            label="Capture or upload delivery invoice"
          />
          {invoiceData && (
            <Text
              style={{
                fontSize: 12,
                color: colors.success,
                marginTop: 4,
              }}
            >
              Invoice captured
            </Text>
          )}
        </View>
      </FormSheet>
    </View>
  );
}

// Base64 decode helper for storage upload
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
